// Cloudflare Pages Function: GeoGebra Visualization Generation
// Generates GeoGebra commands and explanations for math questions

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

    // Build the prompt for GeoGebra visualization
    const prompt = `Du bist ein Mathematiklehrer mit Expertise in GeoGebra-Visualisierungen.

AUFGABE:
Erstelle eine interaktive GeoGebra-Visualisierung für folgende Mathematik-Aufgabe:

FRAGE:
${questionData.question}

THEMA: ${questionData.topic} > ${questionData.subtopic}
SCHWIERIGKEIT: ${questionData.difficulty}/5

${questionData.geogebra?.commands ? `VORHANDENE GEOGEBRA-BEFEHLE:\n${questionData.geogebra.commands.join('\n')}` : ''}

ANFORDERUNGEN:

1. GEOGEBRA-BEFEHLE:
   - Erstelle eine Liste von GeoGebra-Befehlen (GeoGebra Classic Syntax)
   - Die Befehle sollen die mathematischen Konzepte der Aufgabe visualisieren
   - Nutze klare Variablennamen (z.B. f, g, A, B)
   - Bei Funktionen: Zeige relevante Merkmale (Nullstellen, Extrempunkte, etc.)
   - Bei Vektoren/Geometrie: Nutze 2D oder 3D je nach Bedarf
   - Verwende Farben für bessere Unterscheidung: SetColor[objekt, "red"]
   - Beschrifte wichtige Punkte: Text["Name", punkt]

2. ERKLÄRUNG:
   - Erkläre in 2-4 Sätzen, was die Visualisierung zeigt
   - Beschreibe, wie die Visualisierung beim Lösen der Aufgabe hilft
   - Nutze eine schülerfreundliche Sprache
   - Hebe wichtige visuelle Merkmale hervor

3. INTERAKTIVE ELEMENTE (optional):
   - Wenn sinnvoll, erstelle Slider für Parameter: a = Slider[-5, 5, 0.1]
   - Zeige dynamische Zusammenhänge

BEISPIELE:

Für Ableitungen:
{
  "commands": [
    "f(x) = x^3 - 3*x^2 + 2",
    "SetColor[f, \"blue\"]",
    "f'(x)",
    "SetColor[f', \"red\"]",
    "E = Extremum[f]",
    "SetPointStyle[E, 3]",
    "SetPointSize[E, 4]"
  ],
  "explanation": "Die Visualisierung zeigt die Funktion f(x) in Blau und ihre Ableitung f'(x) in Rot. Die Extrempunkte (Maximum und Minimum) sind als größere Punkte markiert. Du kannst sehen, dass f'(x) = 0 genau an den Extremstellen ist.",
  "interactionTips": "Zoome in den Bereich um die Extrempunkte, um die Zusammenhänge besser zu erkennen."
}

Für Vektoren:
{
  "commands": [
    "A = (1, 2)",
    "B = (4, 5)",
    "v = Vector[A, B]",
    "SetColor[v, \"green\"]",
    "Text[\"Vektor v\", B + (0.5, 0.5)]"
  ],
  "explanation": "Die Visualisierung zeigt den Vektor v (grün) vom Punkt A zum Punkt B. Die Koordinaten beider Punkte sind im Koordinatensystem sichtbar.",
  "interactionTips": "Du kannst die Punkte A und B verschieben, um zu sehen, wie sich der Vektor ändert."
}

Gib deine Antwort als JSON zurück (NUR das JSON, keine weiteren Erklärungen):

{
  "commands": ["GeoGebra Befehl 1", "GeoGebra Befehl 2", ...],
  "explanation": "Erklärung was die Visualisierung zeigt",
  "interactionTips": "Optionale Tipps zur Interaktion (oder null wenn nicht nötig)"
}

WICHTIG: Die Befehle müssen für GeoGebra Classic 6 kompatibel sein!`

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
