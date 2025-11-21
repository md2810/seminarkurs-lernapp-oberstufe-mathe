// Cloudflare Pages Function: GeoGebra Visualization Generation
// Generates GeoGebra commands and explanations for math questions

import { SYSTEM_PROMPT } from '../../data/prompts/generate-geogebra.js'

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, userId, questionData, selectedModel } = body

    // Validate required fields
    if (!apiKey || !userId || !questionData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Use selected model or default to claude-sonnet-4-5
    const model = selectedModel || 'claude-sonnet-4-5-20250929'

    // Build existing commands context
    const existingCommands = questionData.geogebra?.commands
      ? `VORHANDENE GEOGEBRA-BEFEHLE:\n${questionData.geogebra.commands.join('\n')}`
      : ''

    // Build prompt from template
    const prompt = SYSTEM_PROMPT
      .replace('{{question}}', questionData.question)
      .replace('{{topic}}', questionData.topic)
      .replace('{{subtopic}}', questionData.subtopic)
      .replace('{{difficulty}}', questionData.difficulty)
      .replace('{{existingCommands}}', existingCommands)

    // Call Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json()
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Anthropic API error',
          details: errorData
        }),
        { status: anthropicResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content[0].text

    // Parse the JSON response
    let geogebraData
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        geogebraData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse GeoGebra response',
          rawResponse: responseText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return the GeoGebra visualization data
    return new Response(
      JSON.stringify({
        success: true,
        geogebra: {
          commands: geogebraData.commands,
          explanation: geogebraData.explanation,
          interactionTips: geogebraData.interactionTips || null
        },
        usage: {
          inputTokens: anthropicData.usage.input_tokens,
          outputTokens: anthropicData.usage.output_tokens
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating GeoGebra visualization:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
