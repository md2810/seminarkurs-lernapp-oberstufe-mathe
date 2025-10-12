// Cloudflare Pages Function: Question Generation
// Generates 20 questions per topic with hints, solutions, and GeoGebra commands

import curriculumData from '../../data/bw_oberstufe_themen.json'
import promptTemplate from '../../data/prompts/generate-questions.js'

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, userId, learningPlanItemId, topics, userContext } = body

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

    // Get curriculum context
    const curriculum = curriculumData.Klassen_11_12[userContext.courseType]

    // Build context about struggling topics
    const strugglingTopicsText = userContext.recentPerformance?.strugglingTopics?.length > 0
      ? `Der Schüler hat Schwierigkeiten mit: ${userContext.recentPerformance.strugglingTopics.join(', ')}`
      : 'Keine bekannten Schwierigkeiten'

    // Build AUTO mode context
    const autoModeText = userContext.autoModeAssessment
      ? `AUTO-Modus Einschätzung:
- Detailgrad: ${userContext.autoModeAssessment.currentAssessment.detailLevel}% (${userContext.autoModeAssessment.currentAssessment.detailLevel > 60 ? 'ausführliche' : 'kurze'} Erklärungen)
- Temperatur: ${userContext.autoModeAssessment.currentAssessment.temperature} (${userContext.autoModeAssessment.currentAssessment.temperature > 0.6 ? 'kreativ' : 'präzise'})
- Hilfestellung: ${userContext.autoModeAssessment.currentAssessment.helpfulness}% (${userContext.autoModeAssessment.currentAssessment.helpfulness > 60 ? 'unterstützend' : 'eigenständig'})

Interne Begründung: "${userContext.autoModeAssessment.currentAssessment.reasoning}"`
      : 'AUTO-Modus nicht aktiv - nutze ausgewogene Einstellungen'

    // Build topics list
    const topicsList = topics.map(t => `- ${t.leitidee} > ${t.thema} > ${t.unterthema}`).join('\n')

    // Build AI memories context
    const memoriesText = userContext.recentMemories?.length > 0
      ? `Bekannte Informationen über den Schüler:\n${userContext.recentMemories.join('\n')}`
      : 'Keine spezifischen Informationen über Lernverhalten bekannt'

    // Build prompt from template with placeholders
    const prompt = promptTemplate.prompt
      .replace('{{TOPICS_LIST}}', topicsList)
      .replace('{{GRADE_LEVEL}}', userContext.gradeLevel)
      .replace('{{COURSE_TYPE}}', userContext.courseType)
      .replace('{{STRUGGLING_TOPICS}}', strugglingTopicsText)
      .replace('{{MEMORIES}}', memoriesText)
      .replace('{{AUTO_MODE}}', autoModeText)

    // Call Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json()
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Anthropic API error',
          details: error
        }),
        { status: anthropicResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content[0].text

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
          error: 'Failed to parse Claude response',
          rawResponse: responseText.substring(0, 1000)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${userId.substring(0, 8)}`

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        learningPlanItemId,
        topics,
        userContext,
        questions: questionsData.questions,
        totalQuestions: questionsData.questions.length
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
      description: 'Generates 20 questions with hints and solutions',
      requiredFields: ['apiKey', 'userId', 'topics', 'userContext']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
