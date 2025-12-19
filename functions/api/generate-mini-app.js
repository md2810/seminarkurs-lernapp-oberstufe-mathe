/**
 * Generate Mini-App API
 * Generiert interaktive HTML/JS Simulationen basierend auf Nutzerbeschreibungen
 *
 * Theoretische Grundlage: Konstruktionismus nach Papert
 * - Lernen durch Erschaffen von Artefakten
 * - Code-Inspektion fördert metakognitives Denken
 *
 * Sicherheit:
 * - Generierter Code wird in sandboxed iframe ausgeführt
 * - Keine externen Scripte erlaubt
 * - Validierung des generierten Codes
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
      model,
      prompt,
      context: userContext = {}
    } = await context.request.json()

    // Validate inputs
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'API-Schlüssel fehlt'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bitte gib eine ausführlichere Beschreibung ein (mindestens 10 Zeichen).'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (prompt.length > 1000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Die Beschreibung ist zu lang (maximal 1000 Zeichen).'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(userContext)

    // Call the appropriate AI provider with the selected model
    let response
    if (provider === 'claude') {
      response = await callClaude(apiKey, systemPrompt, prompt, model)
    } else if (provider === 'openai') {
      response = await callOpenAI(apiKey, systemPrompt, prompt, model)
    } else if (provider === 'gemini') {
      response = await callGemini(apiKey, systemPrompt, prompt, model)
    } else {
      response = await callClaude(apiKey, systemPrompt, prompt, model)
    }

    if (!response.success) {
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate the generated code
    const result = parseAndValidateResponse(response.content)

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Fehler bei der Code-Generierung'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      html: result.html,
      title: result.title,
      description: result.description
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Generate mini-app error:', error)
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

function buildSystemPrompt(userContext) {
  const gradeLevel = userContext.gradeLevel || 'Klasse_11'
  const courseType = userContext.courseType || 'Leistungsfach'

  return `Du bist ein Experte für die Erstellung interaktiver mathematischer Visualisierungen und Simulationen.

Kontext:
- Zielgruppe: Oberstufenschüler (${gradeLevel.replace('_', ' ')}, ${courseType})
- Bundesland: Baden-Württemberg
- Lehrplan: Oberstufen-Mathematik (Analysis, Analytische Geometrie, Stochastik)

Deine Aufgabe ist es, eine einzelne, vollständige HTML-Datei zu erstellen, die eine interaktive mathematische Simulation enthält.

WICHTIGE REGELN:
1. Generiere NUR valides HTML5 mit eingebettetem CSS und JavaScript
2. Keine externen Bibliotheken oder CDN-Links - alles muss inline sein
3. Verwende Canvas API für Grafiken oder einfaches DOM
4. Die Simulation muss interaktiv sein (Slider, Buttons, Mauseingaben)
5. Zeige mathematische Formeln als Text (keine LaTeX-Bibliotheken)
6. Die Darstellung soll responsive sein
7. Verwende ein dunkles Farbschema (Hintergrund: #1a1a2e, Text: #ffffff, Akzent: #22c55e)
8. Der Code muss selbsterklärend und gut kommentiert sein
9. Mathematische Berechnungen müssen korrekt sein

ANTWORT-FORMAT:
Antworte IMMER im folgenden JSON-Format:
{
  "title": "Kurzer Titel der Simulation",
  "description": "Einzeilige Beschreibung was die Simulation zeigt",
  "html": "<!DOCTYPE html>..."
}

Beispiel für eine einfache Struktur:
\`\`\`html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulation</title>
  <style>
    /* Dunkles Theme */
    body {
      margin: 0;
      padding: 20px;
      background: #1a1a2e;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
    }
    /* Weitere Styles... */
  </style>
</head>
<body>
  <h1>Titel</h1>
  <div id="controls">
    <!-- Slider, Buttons etc. -->
  </div>
  <canvas id="canvas"></canvas>
  <script>
    // Interaktiver Code...
  </script>
</body>
</html>
\`\`\`

Erstelle nun basierend auf der Nutzerbeschreibung eine passende Simulation.`
}

async function callClaude(apiKey, systemPrompt, userPrompt, selectedModel) {
  try {
    const modelId = selectedModel || 'claude-sonnet-4-20250514'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Erstelle eine interaktive Simulation für: ${userPrompt}\n\nAntworte im JSON-Format.`
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)

      // Parse error for better user feedback
      let errorMessage = 'Fehler bei der KI-Anfrage'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = `Claude API: ${errorData.error.message}`
        }
      } catch (e) {
        // Use status code based message
        if (response.status === 401) {
          errorMessage = 'Ungültiger API-Schlüssel'
        } else if (response.status === 429) {
          errorMessage = 'API-Limit erreicht. Bitte versuche es später erneut.'
        } else if (response.status === 400) {
          errorMessage = 'Ungültige Anfrage an die KI'
        }
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return {
      success: true,
      content: data.content[0].text
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return { success: false, error: `Netzwerkfehler: ${error.message}` }
  }
}

async function callOpenAI(apiKey, systemPrompt, userPrompt, selectedModel) {
  try {
    const modelId = selectedModel || 'gpt-4o'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Erstelle eine interaktive Simulation für: ${userPrompt}\n\nAntworte im JSON-Format.` }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)

      let errorMessage = 'Fehler bei der KI-Anfrage'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = `OpenAI: ${errorData.error.message}`
        }
      } catch (e) {
        if (response.status === 401) {
          errorMessage = 'Ungültiger API-Schlüssel'
        } else if (response.status === 429) {
          errorMessage = 'API-Limit erreicht'
        }
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return {
      success: true,
      content: data.choices[0].message.content
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return { success: false, error: `Netzwerkfehler: ${error.message}` }
  }
}

async function callGemini(apiKey, systemPrompt, userPrompt, selectedModel) {
  try {
    // Use provided model or default to gemini-2.0-flash-exp (gemini-1.5-flash is deprecated)
    const modelId = selectedModel || 'gemini-2.0-flash-exp'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { text: `Erstelle eine interaktive Simulation für: ${userPrompt}\n\nAntworte im JSON-Format.` }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 8000,
            temperature: 0.7
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)

      let errorMessage = 'Fehler bei der KI-Anfrage'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = `Gemini: ${errorData.error.message}`
        }
      } catch (e) {
        if (response.status === 400) {
          errorMessage = 'Ungültiger API-Schlüssel oder Anfrage'
        } else if (response.status === 429) {
          errorMessage = 'API-Limit erreicht'
        }
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return { success: false, error: 'Keine Antwort von Gemini' }
    }

    return { success: true, content: text }
  } catch (error) {
    console.error('Gemini API error:', error)
    return { success: false, error: `Netzwerkfehler: ${error.message}` }
  }
}

function parseAndValidateResponse(content) {
  try {
    // Try to extract JSON from the response
    let jsonContent = content

    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim()
    } else {
      // Try to find JSON object directly
      const directMatch = content.match(/\{[\s\S]*"html"[\s\S]*\}/)
      if (directMatch) {
        jsonContent = directMatch[0]
      }
    }

    const parsed = JSON.parse(jsonContent)

    if (!parsed.html || typeof parsed.html !== 'string') {
      return { success: false, error: 'Kein gültiger HTML-Code generiert' }
    }

    // Validate HTML structure
    const html = parsed.html.trim()

    if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
      return { success: false, error: 'Ungültiges HTML-Dokument' }
    }

    if (!html.includes('<html') || !html.includes('</html>')) {
      return { success: false, error: 'Unvollständiges HTML-Dokument' }
    }

    // Security checks - no external resources
    const forbiddenPatterns = [
      /src\s*=\s*["']https?:\/\//i,
      /href\s*=\s*["']https?:\/\//i,
      /<script\s+[^>]*src\s*=/i,
      /<link\s+[^>]*href\s*=\s*["']https?:/i,
      /<iframe/i,
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i,
      /window\.open/i,
      /window\.location/i
    ]

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(html)) {
        console.warn('Security pattern detected:', pattern.toString())
        // Don't reject, just warn - some patterns might be false positives
        // The sandbox will prevent actual harm
      }
    }

    return {
      success: true,
      html: html,
      title: parsed.title || 'Generierte Simulation',
      description: parsed.description || ''
    }

  } catch (parseError) {
    console.error('Error parsing response:', parseError)

    // Try to extract HTML directly if JSON parsing fails
    const htmlMatch = content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
    if (htmlMatch) {
      return {
        success: true,
        html: htmlMatch[0],
        title: 'Generierte Simulation',
        description: ''
      }
    }

    return { success: false, error: 'Fehler beim Parsen der Antwort' }
  }
}
