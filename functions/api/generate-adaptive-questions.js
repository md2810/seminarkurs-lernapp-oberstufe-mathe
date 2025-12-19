/**
 * Cloudflare Pages Function: Adaptive Question Generation
 * Generates questions with dynamic difficulty based on user performance
 * Supports Claude and Gemini
 */

import { loadPrompt } from '../utils/promptEngine.js'

const AI_ENDPOINTS = {
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models'
}

const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-5-20250929',
  gemini: 'gemini-3-flash-preview'
}

async function callClaude({ apiKey, model, prompt, temperature }) {
  const response = await fetch(AI_ENDPOINTS.claude, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.claude,
      max_tokens: 8000,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Claude API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callGemini({ apiKey, model, prompt, temperature }) {
  const modelId = model || DEFAULT_MODELS.gemini
  const endpoint = `${AI_ENDPOINTS.gemini}/${modelId}:generateContent?key=${apiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 8000
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

function parseJSONResponse(response) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim())
    }
    // Try to find raw JSON object
    const objectMatch = response.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse JSON:', error)
    throw new Error('Failed to parse AI response')
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const {
      provider = 'claude',
      apiKey,
      model,
      userId,
      topics,
      difficultyLevel = 5,
      adjustmentReason = 'Neuer Start',
      recentPerformance = {},
      questionCount = 5,
      userContext = {}
    } = body

    // Validate
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!topics || topics.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Topics are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build topics list
    const topicsList = topics.map(t => {
      if (typeof t === 'string') return `- ${t}`
      return `- ${t.leitidee || ''} > ${t.thema || t.topic || ''} > ${t.unterthema || t.subtopic || ''}`
    }).join('\n')

    // Build recent performance text
    const performanceText = recentPerformance.recentQuestions
      ? `Letzte ${recentPerformance.recentQuestions.length} Fragen: ${recentPerformance.correctCount || 0} richtig, ${recentPerformance.wrongCount || 0} falsch`
      : 'Keine vorherige Leistung bekannt'

    // Build user context
    const userContextText = userContext.strugglingTopics?.length
      ? `Schwierigkeiten mit: ${userContext.strugglingTopics.join(', ')}`
      : 'Keine bekannten Schwierigkeiten'

    // Build prompt using centralized prompt engine
    const prompt = loadPrompt('adaptive-question-generation', {
      QUESTION_COUNT: questionCount.toString(),
      TOPICS_LIST: topicsList,
      DIFFICULTY_LEVEL: difficultyLevel.toString(),
      ADJUSTMENT_REASON: adjustmentReason,
      RECENT_PERFORMANCE: performanceText,
      GRADE_LEVEL: userContext.gradeLevel || 'Klasse_11',
      COURSE_TYPE: userContext.courseType || 'Leistungsfach',
      USER_CONTEXT: userContextText
    })

    // Get temperature based on difficulty (lower difficulty = more consistent)
    const temperature = 0.5 + (difficultyLevel / 20)

    // Call the appropriate AI provider
    let responseText
    try {
      switch (provider) {
        case 'gemini':
          responseText = await callGemini({ apiKey, model, prompt, temperature })
          break
        case 'claude':
        default:
          responseText = await callClaude({ apiKey, model, prompt, temperature })
      }
    } catch (aiError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `AI Provider error: ${aiError.message}`,
          provider
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse the response
    let questionsData
    try {
      questionsData = parseJSONResponse(responseText)
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse AI response',
          rawResponse: responseText.substring(0, 500)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Add unique IDs if missing
    const questions = (questionsData.questions || []).map((q, index) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${index}`,
      difficulty: q.difficulty || difficultyLevel,
      generatedAt: new Date().toISOString()
    }))

    return new Response(
      JSON.stringify({
        success: true,
        questions,
        metadata: {
          ...questionsData.metadata,
          provider,
          model: model || DEFAULT_MODELS[provider],
          difficultyLevel,
          generatedAt: new Date().toISOString(),
          questionCount: questions.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-adaptive-questions:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      endpoint: '/api/generate-adaptive-questions',
      method: 'POST',
      description: 'Generates adaptive questions based on difficulty level',
      requiredFields: ['apiKey', 'topics'],
      optionalFields: ['provider', 'model', 'difficultyLevel', 'questionCount', 'userContext']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
