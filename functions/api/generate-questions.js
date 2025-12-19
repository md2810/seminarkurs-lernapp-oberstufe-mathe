/**
 * Cloudflare Pages Function: Question Generation
 * Phase 2 Upgrade: Model Router + Firestore Caching
 *
 * Features:
 * - Intelligent model selection based on complexity
 * - Firestore question_cache lookup before generation
 * - Cost optimization for simple queries
 */

import curriculumData from '../../data/bw_oberstufe_themen.json'
import { SYSTEM_PROMPT } from '../../data/prompts/generate-questions.js'

// ============================================================================
// MODEL ROUTER CONFIGURATION
// ============================================================================

// Model tiers for different AI providers
const MODEL_TIERS = {
  claude: {
    light: 'claude-3-5-haiku-20241022',
    standard: 'claude-sonnet-4-20250514',
    heavy: 'claude-sonnet-4-20250514'
  },
  gemini: {
    light: 'gemini-2.0-flash-exp',
    standard: 'gemini-2.0-flash-exp',
    heavy: 'gemini-1.5-pro'
  },
  openai: {
    light: 'gpt-4o-mini',
    standard: 'gpt-4o',
    heavy: 'gpt-4o'
  }
}

// AI Provider endpoints
const AI_ENDPOINTS = {
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  openai: 'https://api.openai.com/v1/chat/completions'
}

/**
 * Determine the optimal model tier based on task complexity
 */
function determineModelTier({
  afbLevel = 'II',
  hasGeoGebra = false,
  questionCount = 20,
  hasProof = false,
  isNumericOnly = false
}) {
  // Heavy tier for complex tasks
  if (hasGeoGebra || hasProof || afbLevel === 'III' || questionCount > 15) {
    return 'heavy'
  }

  // Light tier for simple tasks
  if (afbLevel === 'I' || (isNumericOnly && questionCount <= 5) || questionCount <= 3) {
    return 'light'
  }

  return 'standard'
}

/**
 * Select the optimal model based on provider and complexity
 */
function selectModel(provider, complexityOptions, preferredModel = null) {
  if (preferredModel) return preferredModel

  const tier = determineModelTier(complexityOptions)
  return MODEL_TIERS[provider]?.[tier] || MODEL_TIERS.claude.standard
}

/**
 * Generate cache key for question lookup
 */
function generateCacheKey(topics, afbLevel, difficulty) {
  const topicHash = topics
    .map(t => `${t.leitidee}_${t.thema}_${t.unterthema}`)
    .sort()
    .join('|')
    .replace(/[^a-zA-Z0-9|_]/g, '_')

  return `cache_${topicHash}_AFB${afbLevel}_D${difficulty}`.substring(0, 128)
}

/**
 * Call the AI provider API
 */
async function callAIProvider({ provider, apiKey, model, prompt, temperature, maxTokens }) {
  switch (provider) {
    case 'claude': {
      const response = await fetch(AI_ENDPOINTS.claude, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
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

    case 'gemini': {
      const endpoint = `${AI_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Gemini API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    }

    case 'openai': {
      const response = await fetch(AI_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    }

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const {
      apiKey,
      userId,
      learningPlanItemId,
      topics,
      userContext,
      selectedModel,
      // Phase 2: New parameters
      provider = 'claude',
      complexity = null,        // 'light', 'standard', 'heavy', or null for auto
      afbLevel = 'II',          // 'I', 'II', 'III'
      questionCount = 20,       // Number of questions to generate
      useCache = true,          // Whether to check cache first
      forceRegenerate = false,  // Force new generation even if cached
      firebaseConfig = null     // Firebase config for cache lookup
    } = body

    // Validate required fields
    if (!apiKey || !userId || !topics || !userContext) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ========================================================================
    // PHASE 2: Firestore Cache Lookup
    // ========================================================================

    const cacheKey = generateCacheKey(topics, afbLevel, userContext.difficulty || 5)
    let cachedQuestions = null

    // Try to fetch from cache if enabled and not forcing regeneration
    if (useCache && !forceRegenerate && firebaseConfig) {
      try {
        // Initialize Firebase (dynamically to avoid import issues in Cloudflare)
        const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/question_cache/${cacheKey}`

        const cacheResponse = await fetch(firebaseUrl, {
          headers: {
            'Authorization': `Bearer ${firebaseConfig.accessToken}`
          }
        })

        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json()
          if (cacheData.fields?.questions?.arrayValue?.values) {
            cachedQuestions = cacheData.fields.questions.arrayValue.values.map(v => {
              // Parse Firestore document format
              return JSON.parse(v.stringValue || '{}')
            })

            // Check if cache is still valid (< 7 days old)
            const cachedAt = cacheData.fields?.cachedAt?.timestampValue
            if (cachedAt) {
              const cacheAge = Date.now() - new Date(cachedAt).getTime()
              const sevenDays = 7 * 24 * 60 * 60 * 1000
              if (cacheAge < sevenDays) {
                console.log(`[Cache Hit] Returning ${cachedQuestions.length} cached questions for key: ${cacheKey}`)

                const sessionId = `session_${Date.now()}_${userId.substring(0, 8)}`
                return new Response(
                  JSON.stringify({
                    success: true,
                    sessionId,
                    learningPlanItemId,
                    topics,
                    userContext,
                    questions: cachedQuestions,
                    totalQuestions: cachedQuestions.length,
                    fromCache: true,
                    cacheKey
                  }),
                  { status: 200, headers: { 'Content-Type': 'application/json' } }
                )
              }
            }
          }
        }
      } catch (cacheError) {
        console.warn('[Cache] Error fetching from cache:', cacheError.message)
        // Continue with generation if cache fails
      }
    }

    // ========================================================================
    // PHASE 2: Model Router - Select optimal model
    // ========================================================================

    // Analyze complexity from topics
    const hasGeoGebra = topics.some(t =>
      t.thema?.toLowerCase().includes('geometrie') ||
      t.thema?.toLowerCase().includes('funktion') ||
      t.unterthema?.toLowerCase().includes('graph')
    )

    const isNumericOnly = topics.every(t =>
      t.thema?.toLowerCase().includes('rechnen') ||
      t.thema?.toLowerCase().includes('arithmetik')
    )

    // Select model based on complexity
    const model = selectModel(provider, {
      afbLevel,
      hasGeoGebra,
      questionCount,
      isNumericOnly,
      customComplexity: complexity
    }, selectedModel)

    console.log(`[Model Router] Selected ${model} for ${provider} (AFB: ${afbLevel}, GeoGebra: ${hasGeoGebra}, Count: ${questionCount})`)

    // ========================================================================
    // Build prompt with complexity awareness
    // ========================================================================

    // Get curriculum context
    const curriculum = curriculumData.Klassen_11_12[userContext.courseType]

    // Build context strings
    const strugglingTopicsText = userContext.recentPerformance?.strugglingTopics?.length > 0
      ? `Der Schüler hat Schwierigkeiten mit: ${userContext.recentPerformance.strugglingTopics.join(', ')}`
      : 'Keine bekannten Schwierigkeiten'

    const autoModeText = userContext.autoModeAssessment
      ? `AUTO-Modus Einschätzung:
- Detailgrad: ${userContext.autoModeAssessment.currentAssessment.detailLevel}% (${userContext.autoModeAssessment.currentAssessment.detailLevel > 60 ? 'ausführliche' : 'kurze'} Erklärungen)
- Temperatur: ${userContext.autoModeAssessment.currentAssessment.temperature} (${userContext.autoModeAssessment.currentAssessment.temperature > 0.6 ? 'kreativ' : 'präzise'})
- Hilfestellung: ${userContext.autoModeAssessment.currentAssessment.helpfulness}% (${userContext.autoModeAssessment.currentAssessment.helpfulness > 60 ? 'unterstützend' : 'eigenständig'})

Interne Begründung: "${userContext.autoModeAssessment.currentAssessment.reasoning}"`
      : 'AUTO-Modus nicht aktiv - nutze ausgewogene Einstellungen'

    const topicsList = topics.map(t => `- ${t.leitidee} > ${t.thema} > ${t.unterthema}`).join('\n')

    const memoriesText = userContext.recentMemories?.length > 0
      ? `Bekannte Informationen über den Schüler:\n${userContext.recentMemories.join('\n')}`
      : 'Keine spezifischen Informationen über Lernverhalten bekannt'

    // Add complexity-specific instructions
    const complexityInstructions = `
ANFORDERUNGSBEREICH: ${afbLevel}
${afbLevel === 'I' ? '- Fokus auf Reproduktion und einfache Anwendung\n- Keine komplexen Transferaufgaben' : ''}
${afbLevel === 'II' ? '- Ausgewogene Mischung aus Anwendung und Reorganisation\n- Moderate Komplexität' : ''}
${afbLevel === 'III' ? '- Fokus auf Transfer und komplexe Problemlösung\n- Beweise und Begründungen einbeziehen' : ''}

ANZAHL FRAGEN: ${questionCount}
`

    // Build prompt
    const prompt = SYSTEM_PROMPT
      .replace('{{TOPICS_LIST}}', topicsList)
      .replace('{{GRADE_LEVEL}}', userContext.gradeLevel)
      .replace('{{COURSE_TYPE}}', userContext.courseType)
      .replace('{{STRUGGLING_TOPICS}}', strugglingTopicsText)
      .replace('{{MEMORIES}}', memoriesText)
      .replace('{{AUTO_MODE}}', autoModeText)
      .replace('{{COMPLEXITY}}', complexityInstructions)

    // Get temperature from AUTO mode or use default
    const temperature = userContext.autoModeAssessment?.currentAssessment?.temperature || 0.7

    // ========================================================================
    // Call AI Provider
    // ========================================================================

    const responseText = await callAIProvider({
      provider,
      apiKey,
      model,
      prompt,
      temperature,
      maxTokens: 16000
    })

    // Parse JSON response
    let questionsData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0])
      } else {
        questionsData = JSON.parse(responseText)
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse AI response',
          rawResponse: responseText.substring(0, 1000)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ========================================================================
    // PHASE 2: Store in Firestore Cache
    // ========================================================================

    if (useCache && firebaseConfig && questionsData.questions?.length > 0) {
      try {
        const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/question_cache/${cacheKey}`

        // Prepare document for Firestore
        const cacheDocument = {
          fields: {
            cacheKey: { stringValue: cacheKey },
            topics: { stringValue: JSON.stringify(topics) },
            afbLevel: { stringValue: afbLevel },
            questionCount: { integerValue: questionsData.questions.length },
            questions: {
              arrayValue: {
                values: questionsData.questions.map(q => ({
                  stringValue: JSON.stringify(q)
                }))
              }
            },
            cachedAt: { timestampValue: new Date().toISOString() },
            model: { stringValue: model },
            provider: { stringValue: provider }
          }
        }

        await fetch(firebaseUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${firebaseConfig.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cacheDocument)
        })

        console.log(`[Cache Store] Stored ${questionsData.questions.length} questions with key: ${cacheKey}`)
      } catch (cacheStoreError) {
        console.warn('[Cache] Error storing to cache:', cacheStoreError.message)
        // Continue even if cache store fails
      }
    }

    // ========================================================================
    // Return response
    // ========================================================================

    const sessionId = `session_${Date.now()}_${userId.substring(0, 8)}`

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        learningPlanItemId,
        topics,
        userContext,
        questions: questionsData.questions,
        totalQuestions: questionsData.questions.length,
        fromCache: false,
        cacheKey,
        modelUsed: model,
        providerUsed: provider
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-questions:', error)
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

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      endpoint: '/api/generate-questions',
      method: 'POST',
      description: 'Generates questions with intelligent model routing and caching',
      requiredFields: ['apiKey', 'userId', 'topics', 'userContext'],
      optionalFields: [
        'selectedModel',
        'provider (claude|gemini|openai)',
        'complexity (light|standard|heavy)',
        'afbLevel (I|II|III)',
        'questionCount',
        'useCache',
        'forceRegenerate',
        'firebaseConfig'
      ],
      features: [
        'Automatic model selection based on complexity',
        'Firestore question caching',
        'Multi-provider support (Claude, Gemini, OpenAI)',
        'AFB-level aware generation'
      ]
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
