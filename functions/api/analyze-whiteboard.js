/**
 * Whiteboard Analysis API - Analyze selected areas and generate AI responses with drawings
 * Uses Claude's vision capabilities to understand mathematical content
 */

import { loadPrompt } from '../utils/promptEngine.js'

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { apiKey, userId, imageData, question, selectionBounds } = await context.request.json()

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'API-Schlüssel fehlt'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!imageData || !question) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bild oder Frage fehlt'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract base64 data from data URL
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '')

    // Load system prompt from centralized prompt engine
    const systemPrompt = loadPrompt('whiteboard-analysis')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `Frage des Schülers: "${question}"\n\nBitte analysiere das Bild und beantworte die Frage. Antworte im JSON-Format.`
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      return new Response(JSON.stringify({
        success: false,
        error: 'Fehler bei der AI-Analyse'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const assistantMessage = data.content[0].text

    // Parse the JSON response
    let parsedResponse
    try {
      // Try to extract JSON from the response
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON found, treat entire response as explanation
        parsedResponse = {
          explanation: assistantMessage,
          drawings: []
        }
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      parsedResponse = {
        explanation: assistantMessage,
        drawings: []
      }
    }

    // Validate and sanitize drawings
    const validDrawings = []
    if (Array.isArray(parsedResponse.drawings)) {
      for (const drawing of parsedResponse.drawings) {
        if (validateDrawing(drawing)) {
          validDrawings.push(sanitizeDrawing(drawing))
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      explanation: parsedResponse.explanation || 'Keine Erklärung verfügbar',
      drawings: validDrawings,
      rawResponse: assistantMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Whiteboard analysis error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Interner Serverfehler'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

// Validate drawing object
function validateDrawing(drawing) {
  if (!drawing || typeof drawing !== 'object') return false
  if (!drawing.type) return false

  const validTypes = ['line', 'arrow', 'text', 'circle', 'highlight', 'equation']
  if (!validTypes.includes(drawing.type)) return false

  switch (drawing.type) {
    case 'line':
    case 'arrow':
      return drawing.start && drawing.end &&
        typeof drawing.start.x === 'number' && typeof drawing.start.y === 'number' &&
        typeof drawing.end.x === 'number' && typeof drawing.end.y === 'number'

    case 'text':
    case 'equation':
      return typeof drawing.text === 'string' &&
        typeof drawing.x === 'number' && typeof drawing.y === 'number'

    case 'circle':
      return drawing.center &&
        typeof drawing.center.x === 'number' && typeof drawing.center.y === 'number' &&
        typeof drawing.radius === 'number'

    case 'highlight':
      return typeof drawing.x === 'number' && typeof drawing.y === 'number' &&
        typeof drawing.width === 'number' && typeof drawing.height === 'number'

    default:
      return false
  }
}

// Sanitize drawing values
function sanitizeDrawing(drawing) {
  const sanitized = { ...drawing }

  // Ensure color is valid hex or use default
  if (!sanitized.color || !/^#[0-9A-Fa-f]{6}$/.test(sanitized.color)) {
    sanitized.color = '#22c55e' // Default green
  }

  // Ensure strokeWidth is reasonable
  if (typeof sanitized.strokeWidth !== 'number' || sanitized.strokeWidth < 1 || sanitized.strokeWidth > 20) {
    sanitized.strokeWidth = 3
  }

  // Ensure fontSize is reasonable
  if (sanitized.type === 'text' || sanitized.type === 'equation') {
    if (typeof sanitized.fontSize !== 'number' || sanitized.fontSize < 8 || sanitized.fontSize > 48) {
      sanitized.fontSize = 16
    }
  }

  // Clamp coordinate values
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

  if (sanitized.start) {
    sanitized.start.x = clamp(sanitized.start.x, -500, 1000)
    sanitized.start.y = clamp(sanitized.start.y, -500, 1000)
  }
  if (sanitized.end) {
    sanitized.end.x = clamp(sanitized.end.x, -500, 1000)
    sanitized.end.y = clamp(sanitized.end.y, -500, 1000)
  }
  if (sanitized.center) {
    sanitized.center.x = clamp(sanitized.center.x, -500, 1000)
    sanitized.center.y = clamp(sanitized.center.y, -500, 1000)
  }
  if (typeof sanitized.x === 'number') {
    sanitized.x = clamp(sanitized.x, -500, 1000)
  }
  if (typeof sanitized.y === 'number') {
    sanitized.y = clamp(sanitized.y, -500, 1000)
  }
  if (typeof sanitized.radius === 'number') {
    sanitized.radius = clamp(sanitized.radius, 1, 300)
  }
  if (typeof sanitized.width === 'number') {
    sanitized.width = clamp(sanitized.width, 1, 500)
  }
  if (typeof sanitized.height === 'number') {
    sanitized.height = clamp(sanitized.height, 1, 500)
  }

  return sanitized
}
