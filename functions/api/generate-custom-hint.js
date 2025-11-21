// Cloudflare Pages Function: Custom Hint Generation
// Generates personalized hint based on user's specific question

import { SYSTEM_PROMPT } from '../../data/prompts/generate-custom-hint.js'

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, userId, questionData, userQuestion, previousHints, userContext } = body

    // Validate required fields
    if (!apiKey || !questionData || !userQuestion) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build previous hints context
    const hintsUsedText = previousHints && previousHints.length > 0
      ? previousHints.map((h, i) => `Hinweis ${i + 1}: ${h}`).join('\n')
      : 'Keine Hinweise bisher verwendet'

    // Build question type specific content
    let questionTypeContent = ''
    if (questionData.type === 'multiple-choice') {
      questionTypeContent = `ANTWORTMÖGLICHKEITEN:
${questionData.options.map(opt => `${opt.id}) ${opt.text}`).join('\n')}`
    } else if (questionData.type === 'step-by-step') {
      questionTypeContent = `SCHRITTE:
${questionData.steps.map(s => `Schritt ${s.stepNumber}: ${s.instruction}`).join('\n')}`
    }

    // Build prompt from template
    const prompt = SYSTEM_PROMPT
      .replace('{{question}}', questionData.question)
      .replace('{{questionTypeContent}}', questionTypeContent)
      .replace('{{previousHints}}', hintsUsedText)
      .replace('{{userQuestion}}', userQuestion)

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
        temperature: 0.8,
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
    const customHint = anthropicData.content[0].text.trim()

    return new Response(
      JSON.stringify({
        success: true,
        customHint
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-custom-hint:', error)
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
      endpoint: '/api/generate-custom-hint',
      method: 'POST',
      description: 'Generates personalized hint based on user question',
      requiredFields: ['apiKey', 'questionData', 'userQuestion', 'previousHints']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
