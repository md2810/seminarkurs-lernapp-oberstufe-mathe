/**
 * Collaborative Canvas API - AI assistant that can analyze, explain, draw, and use GeoGebra
 * This powers the interactive collaborative learning canvas
 */

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const {
      apiKey,
      provider = 'claude',
      question,
      imageData,
      geogebraState,
      selectionBounds,
      context: questionContext,
      chatHistory = []
    } = await context.request.json()

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'API-Schlüssel fehlt'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!question) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Keine Frage gestellt'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(geogebraState, questionContext)

    // Build messages
    const messages = buildMessages(question, imageData, chatHistory, selectionBounds)

    // Call the appropriate AI provider
    let response
    if (provider === 'claude') {
      response = await callClaude(apiKey, systemPrompt, messages)
    } else if (provider === 'gemini') {
      response = await callGemini(apiKey, systemPrompt, messages, imageData)
    } else {
      response = await callClaude(apiKey, systemPrompt, messages)
    }

    if (!response.success) {
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse the AI response
    const parsed = parseAIResponse(response.content)

    return new Response(JSON.stringify({
      success: true,
      explanation: parsed.explanation,
      drawings: parsed.drawings,
      geogebraCommands: parsed.geogebraCommands,
      rawResponse: response.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Collaborative canvas error:', error)
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

function buildSystemPrompt(geogebraState, questionContext) {
  let prompt = `Du bist ein erfahrener Mathe-Tutor, der auf einem interaktiven Whiteboard mit GeoGebra arbeitet.
Du kannst:
1. Mathematische Konzepte erklären
2. Auf dem Canvas zeichnen (Linien, Pfeile, Kreise, Text, Hervorhebungen)
3. GeoGebra-Befehle ausführen um Funktionen, Punkte, Geraden etc. zu visualisieren

Wenn der Schüler eine Frage stellt oder einen Bereich markiert, sollst du:
- Eine klare, verständliche Erklärung geben
- Bei Bedarf Zeichnungen hinzufügen, die die Erklärung unterstützen
- Bei mathematischen Visualisierungen GeoGebra-Befehle verwenden

WICHTIG: Antworte IMMER im folgenden JSON-Format:
{
  "explanation": "Deine textuelle Erklärung (kann LaTeX wie $x^2$ enthalten)",
  "drawings": [
    // Canvas-Zeichnungen (optional)
  ],
  "geogebraCommands": [
    // GeoGebra-Befehle (optional)
  ]
}

Verfügbare Zeichnungstypen für "drawings":
- { "type": "line", "start": {"x": 0, "y": 0}, "end": {"x": 100, "y": 100}, "color": "#22c55e" }
- { "type": "arrow", "start": {"x": 0, "y": 0}, "end": {"x": 100, "y": 50}, "color": "#22c55e" }
- { "type": "circle", "center": {"x": 50, "y": 50}, "radius": 30, "color": "#3b82f6" }
- { "type": "text", "text": "Beschriftung", "x": 10, "y": 20, "fontSize": 16, "color": "#ffffff" }
- { "type": "highlight", "x": 0, "y": 0, "width": 100, "height": 50, "color": "#22c55e" }
- { "type": "equation", "text": "f(x) = x²", "x": 10, "y": 30, "fontSize": 18, "color": "#f97316" }

Koordinaten sind relativ zum ausgewählten Bereich (falls vorhanden).
Positive Y-Werte gehen nach unten.

Verfügbare GeoGebra-Befehle für "geogebraCommands":
- { "command": "f(x) = x^2", "color": "#22c55e" } - Funktion definieren
- { "command": "A = (2, 3)", "color": "#ef4444" } - Punkt erstellen
- { "command": "g: y = 2x + 1", "color": "#3b82f6" } - Gerade definieren
- { "command": "Circle((0,0), 3)", "color": "#8b5cf6" } - Kreis erstellen
- { "command": "Integral(f, 0, 2)", "color": "#22c55e" } - Integral visualisieren
- { "command": "Tangent(A, f)", "color": "#f97316" } - Tangente zeichnen
- { "command": "Derivative(f)", "color": "#ec4899" } - Ableitung zeichnen

Nutze GeoGebra für mathematische Visualisierungen und Canvas-Zeichnungen für Annotationen/Erklärungen.
`

  // Add GeoGebra state context if available
  if (geogebraState && geogebraState.objects && geogebraState.objects.length > 0) {
    prompt += `\n\nAktueller GeoGebra-Zustand (bereits vorhandene Objekte):\n`
    geogebraState.objects.forEach(obj => {
      prompt += `- ${obj.name}: ${obj.type} = ${obj.value}\n`
    })
  }

  // Add question context if available
  if (questionContext) {
    prompt += `\n\nKontext der aktuellen Aufgabe:\n`
    prompt += `Aufgabe: ${questionContext.question}\n`
    if (questionContext.solution) {
      prompt += `Lösung: ${questionContext.solution}\n`
    }
  }

  return prompt
}

function buildMessages(question, imageData, chatHistory, selectionBounds) {
  const messages = []

  // Add chat history
  chatHistory.forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      messages.push({ role: 'assistant', content: msg.content })
    }
  })

  // Build current message
  const content = []

  // Add image if available
  if (imageData) {
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: base64
      }
    })
  }

  // Add question text
  let questionText = question
  if (selectionBounds) {
    questionText += `\n\n(Der Schüler hat einen Bereich markiert: ${Math.round(selectionBounds.width)}x${Math.round(selectionBounds.height)} Pixel)`
  }
  questionText += '\n\nBitte antworte im JSON-Format.'

  content.push({
    type: 'text',
    text: questionText
  })

  messages.push({ role: 'user', content })

  return messages
}

async function callClaude(apiKey, systemPrompt, messages) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      return { success: false, error: 'Fehler bei der KI-Anfrage' }
    }

    const data = await response.json()
    return {
      success: true,
      content: data.content[0].text
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return { success: false, error: error.message }
  }
}

async function callGemini(apiKey, systemPrompt, messages, imageData) {
  try {
    const parts = [{ text: systemPrompt }]

    // Add image if available
    if (imageData) {
      const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: base64
        }
      })
    }

    // Add question
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && Array.isArray(lastMessage.content)) {
      const textContent = lastMessage.content.find(c => c.type === 'text')
      if (textContent) {
        parts.push({ text: textContent.text })
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.7
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return { success: false, error: 'Fehler bei der KI-Anfrage' }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return { success: false, error: 'Keine Antwort von Gemini' }
    }

    return { success: true, content: text }
  } catch (error) {
    console.error('Gemini API error:', error)
    return { success: false, error: error.message }
  }
}

function parseAIResponse(content) {
  const result = {
    explanation: '',
    drawings: [],
    geogebraCommands: []
  }

  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      result.explanation = parsed.explanation || ''

      // Validate and sanitize drawings
      if (Array.isArray(parsed.drawings)) {
        result.drawings = parsed.drawings
          .filter(d => validateDrawing(d))
          .map(d => sanitizeDrawing(d))
      }

      // Validate GeoGebra commands
      if (Array.isArray(parsed.geogebraCommands)) {
        result.geogebraCommands = parsed.geogebraCommands
          .filter(cmd => cmd && typeof cmd.command === 'string')
          .map(cmd => ({
            command: cmd.command,
            color: cmd.color || '#22c55e'
          }))
      }
    } else {
      // No JSON found, use entire response as explanation
      result.explanation = content
    }
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError)
    result.explanation = content
  }

  return result
}

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

function sanitizeDrawing(drawing) {
  const sanitized = { ...drawing }

  // Ensure color is valid hex or use default
  if (!sanitized.color || !/^#[0-9A-Fa-f]{6}$/.test(sanitized.color)) {
    sanitized.color = '#22c55e'
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
    sanitized.start.x = clamp(sanitized.start.x, -500, 2000)
    sanitized.start.y = clamp(sanitized.start.y, -500, 2000)
  }
  if (sanitized.end) {
    sanitized.end.x = clamp(sanitized.end.x, -500, 2000)
    sanitized.end.y = clamp(sanitized.end.y, -500, 2000)
  }
  if (sanitized.center) {
    sanitized.center.x = clamp(sanitized.center.x, -500, 2000)
    sanitized.center.y = clamp(sanitized.center.y, -500, 2000)
  }
  if (typeof sanitized.x === 'number') {
    sanitized.x = clamp(sanitized.x, -500, 2000)
  }
  if (typeof sanitized.y === 'number') {
    sanitized.y = clamp(sanitized.y, -500, 2000)
  }
  if (typeof sanitized.radius === 'number') {
    sanitized.radius = clamp(sanitized.radius, 1, 500)
  }
  if (typeof sanitized.width === 'number') {
    sanitized.width = clamp(sanitized.width, 1, 1000)
  }
  if (typeof sanitized.height === 'number') {
    sanitized.height = clamp(sanitized.height, 1, 1000)
  }

  return sanitized
}
