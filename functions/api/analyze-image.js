// Cloudflare Pages Function: Image Analysis for Topic Extraction
// Analyzes uploaded images of topic lists using Claude 4.5 Sonnet

import curriculumData from '../../data/bw_oberstufe_themen.json'

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, image, gradeLevel, courseType } = body

    // Validate required fields
    if (!apiKey || !image || !gradeLevel || !courseType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: apiKey, image, gradeLevel, courseType'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get curriculum for context
    const curriculum = curriculumData.Klassen_11_12[courseType]
    if (!curriculum) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid courseType'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt for Claude
    const prompt = `Du bist ein Experte für den Baden-Württemberg Bildungsplan Mathematik Oberstufe.

Der Nutzer hat ein Bild einer Themenliste hochgeladen (z.B. für eine Klausur).

DEINE AUFGABE:
1. Analysiere das Bild und extrahiere alle sichtbaren mathematischen Themen
2. Mappe die Themen auf den offiziellen BW-Bildungsplan
3. Gib die Themen im strukturierten Format zurück

KONTEXT:
- Klassenstufe: ${gradeLevel}
- Kurstyp: ${courseType}

BILDUNGSPLAN:
${JSON.stringify(curriculum, null, 2)}

WICHTIG:
- Extrahiere nur Themen, die im Bild klar lesbar sind
- Mappe sie auf die exakten Bezeichnungen aus dem Bildungsplan
- Gib eine Confidence an (0-1), wie sicher du bei der Zuordnung bist
- Wenn ein Thema nicht genau passt, gib Vorschläge

Gib deine Antwort als JSON zurück (NUR das JSON, keine weiteren Erklärungen):
{
  "extractedTopics": [
    {
      "leitidee": "3.4.1 Leitidee Zahl – Variable – Operation",
      "thema": "weitere Ableitungsregeln anwenden",
      "unterthema": "die Produkt- und Kettenregel zum Ableiten von Funktionen verwenden",
      "confidence": 0.95
    }
  ],
  "suggestions": ["Falls Themen nicht klar zugeordnet werden konnten"]
}`

    // Call Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
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
    let extractedData
    try {
      // Try to extract JSON from response (in case Claude adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        extractedData = JSON.parse(responseText)
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

    // Check if topics match curriculum
    const matchedTopics = extractedData.extractedTopics.filter(topic => {
      const leitideeExists = curriculum[topic.leitidee]
      if (!leitideeExists) return false
      const themaExists = leitideeExists[topic.thema]
      if (!themaExists) return false
      return themaExists.includes(topic.unterthema)
    })

    return new Response(
      JSON.stringify({
        success: true,
        extractedTopics: matchedTopics,
        matchedFromCurriculum: matchedTopics.length > 0,
        suggestions: extractedData.suggestions || [],
        totalFound: extractedData.extractedTopics.length,
        totalMatched: matchedTopics.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-image:', error)
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
      endpoint: '/api/analyze-image',
      method: 'POST',
      description: 'Analyzes uploaded images of topic lists using Claude Vision',
      requiredFields: ['apiKey', 'image (base64)', 'gradeLevel', 'courseType']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
