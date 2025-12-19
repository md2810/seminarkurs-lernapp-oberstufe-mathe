/**
 * GeoGebra Visualization Generation API
 * Generates GeoGebra commands from AI based on math problems or custom prompts
 *
 * Supports: Claude, OpenAI, Gemini
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// System prompt for GeoGebra command generation
const GEOGEBRA_SYSTEM_PROMPT = `Du bist ein Mathematik-Experte mit tiefer GeoGebra-Expertise.

AUFGABE:
Erstelle GeoGebra-Befehle für die mathematische Visualisierung basierend auf der Nutzerbeschreibung.

ANFORDERUNGEN:

1. **GEOGEBRA-BEFEHLE:**
   - Generiere eine Liste valider GeoGebra-Befehle
   - Verwende klare Variablennamen (f, g, A, B)
   - Nutze Farben (SetColor) und Punktstile (SetPointStyle) für wichtige Elemente
   - Stelle sicher, dass der relevante Bereich sichtbar ist (ZoomIn, SetCoordSystem)

2. **INTERAKTIVITÄT:**
   - Nutze Slider wenn sinnvoll (z.B. a = Slider[-5, 5, 0.1])
   - Ermögliche dynamische Exploration

3. **ERKLÄRUNG:**
   - Erkläre in 2-4 Sätzen auf Deutsch, was der Schüler sieht
   - Schülerfreundlich und hilfreich

AUSGABE-FORMAT:
Antworte NUR mit validem JSON:
{
  "commands": [
    "f(x) = x^2",
    "A = (1, 1)",
    "SetColor(f, \"blue\")"
  ],
  "explanation": "Deutsche Erklärung des Graphen...",
  "interactionTips": "Tipps zur Interaktion..."
}`

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, provider = 'claude', prompt, questionContext, selectedModel } = body

    // Validate required fields
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API-Schlüssel fehlt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bitte gib eine Beschreibung ein' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the user prompt with context if available
    let userPrompt = prompt
    if (questionContext) {
      userPrompt = `Aufgabe: ${questionContext.question || prompt}
Thema: ${questionContext.topic || 'Mathematik'} > ${questionContext.subtopic || 'Allgemein'}
Schwierigkeit: ${questionContext.difficulty || 3}/5

Erstelle eine passende GeoGebra-Visualisierung.`
    }

    // Call the appropriate AI provider
    let response
    if (provider === 'openai') {
      response = await callOpenAI(apiKey, userPrompt, selectedModel)
    } else if (provider === 'gemini') {
      response = await callGemini(apiKey, userPrompt)
    } else {
      response = await callClaude(apiKey, userPrompt, selectedModel)
    }

    if (!response.success) {
      return new Response(
        JSON.stringify(response),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the JSON response
    const geogebraData = parseGeoGebraResponse(response.content)

    if (!geogebraData.success) {
      return new Response(
        JSON.stringify({ success: false, error: geogebraData.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        commands: geogebraData.commands,
        explanation: geogebraData.explanation,
        interactionTips: geogebraData.interactionTips
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating GeoGebra visualization:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Interner Serverfehler',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}

async function callClaude(apiKey, userPrompt, selectedModel) {
  try {
    const model = selectedModel || 'claude-sonnet-4-20250514'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: GEOGEBRA_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Claude API Fehler'

      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) errorMessage = errorData.error.message
      } catch {
        if (response.status === 401) errorMessage = 'Ungültiger API-Schlüssel'
        else if (response.status === 429) errorMessage = 'API-Limit erreicht'
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return { success: true, content: data.content[0].text }
  } catch (error) {
    return { success: false, error: `Netzwerkfehler: ${error.message}` }
  }
}

async function callOpenAI(apiKey, userPrompt, selectedModel) {
  try {
    const model = selectedModel || 'gpt-4o'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: GEOGEBRA_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'OpenAI API Fehler'

      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) errorMessage = errorData.error.message
      } catch {
        if (response.status === 401) errorMessage = 'Ungültiger API-Schlüssel'
        else if (response.status === 429) errorMessage = 'API-Limit erreicht'
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return { success: true, content: data.choices[0].message.content }
  } catch (error) {
    return { success: false, error: `Netzwerkfehler: ${error.message}` }
  }
}

async function callGemini(apiKey, userPrompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: GEOGEBRA_SYSTEM_PROMPT },
              { text: userPrompt }
            ]
          }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.5 }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Gemini API Fehler'

      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) errorMessage = errorData.error.message
      } catch {
        if (response.status === 400) errorMessage = 'Ungültiger API-Schlüssel'
        else if (response.status === 429) errorMessage = 'API-Limit erreicht'
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) return { success: false, error: 'Keine Antwort von Gemini' }
    return { success: true, content: text }
  } catch (error) {
    return { success: false, error: `Netzwerkfehler: ${error.message}` }
  }
}

function parseGeoGebraResponse(content) {
  try {
    // Remove markdown code blocks if present
    let jsonContent = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim()
    } else {
      // Try to find JSON object directly
      const directMatch = content.match(/\{[\s\S]*"commands"[\s\S]*\}/)
      if (directMatch) jsonContent = directMatch[0]
    }

    const parsed = JSON.parse(jsonContent)

    if (!parsed.commands || !Array.isArray(parsed.commands)) {
      return { success: false, error: 'Keine gültigen GeoGebra-Befehle generiert' }
    }

    return {
      success: true,
      commands: parsed.commands,
      explanation: parsed.explanation || '',
      interactionTips: parsed.interactionTips || ''
    }
  } catch (error) {
    console.error('Error parsing GeoGebra response:', error)
    return { success: false, error: 'Fehler beim Parsen der KI-Antwort' }
  }
}
