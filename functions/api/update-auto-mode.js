// Cloudflare Pages Function: AUTO Mode Assessment Update
// Updates AUTO mode settings based on user performance after each question

import { loadPrompt } from '../utils/promptEngine.js'

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, userId, previousAssessment, performanceData } = body

    // Validate required fields
    if (!apiKey || !performanceData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build previous assessment context
    const previousAssessmentText = previousAssessment
      ? `VORHERIGE EINSCHÄTZUNG:
- Detailgrad: ${previousAssessment.currentAssessment.detailLevel}%
- Temperatur: ${previousAssessment.currentAssessment.temperature}
- Hilfestellung: ${previousAssessment.currentAssessment.helpfulness}%
- Begründung: "${previousAssessment.currentAssessment.reasoning}"`
      : 'ERSTE EINSCHÄTZUNG (keine vorherige Einschätzung vorhanden)'

    // Build struggling topics text
    const strugglingTopicsText = performanceData.strugglingTopics?.length > 0
      ? `Schwierige Themen: ${performanceData.strugglingTopics.join(', ')}`
      : 'Keine spezifischen Schwierigkeiten erkannt'

    // Build prompt using centralized prompt engine
    const prompt = loadPrompt('auto-mode-update', {
      PREVIOUS_ASSESSMENT: previousAssessmentText,
      QUESTION_COUNT: performanceData.last10Questions?.length || 10,
      AVG_ACCURACY: Math.round(performanceData.avgAccuracy),
      AVG_HINTS_USED: performanceData.avgHintsUsed.toFixed(1),
      AVG_TIME_SPENT: Math.round(performanceData.avgTimeSpent),
      STRUGGLING_TOPICS: strugglingTopicsText
    })

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
        max_tokens: 500,
        temperature: 0.3,
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
    let newAssessment
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        newAssessment = JSON.parse(jsonMatch[0])
      } else {
        newAssessment = JSON.parse(responseText)
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse Claude response',
          rawResponse: responseText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate ranges
    newAssessment.detailLevel = Math.max(0, Math.min(100, newAssessment.detailLevel))
    newAssessment.temperature = Math.max(0, Math.min(1, Math.round(newAssessment.temperature * 10) / 10))
    newAssessment.helpfulness = Math.max(0, Math.min(100, newAssessment.helpfulness))

    return new Response(
      JSON.stringify({
        success: true,
        newAssessment
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-auto-mode:', error)
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
      endpoint: '/api/update-auto-mode',
      method: 'POST',
      description: 'Updates AUTO mode assessment based on performance',
      requiredFields: ['apiKey', 'performanceData']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
