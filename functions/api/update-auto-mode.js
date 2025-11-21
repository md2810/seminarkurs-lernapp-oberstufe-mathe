// Cloudflare Pages Function: AUTO Mode Assessment Update
// Updates AUTO mode settings based on user performance after each question

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

    const prompt = `Du bist ein KI-Lernsystem, das die optimalen Lerneinstellungen für einen Schüler bestimmt.

${previousAssessmentText}

AKTUELLE PERFORMANCE (letzte ${performanceData.last10Questions?.length || 10} Aufgaben):
- Erfolgsrate: ${Math.round(performanceData.avgAccuracy)}%
- Durchschnittliche Hinweise pro Aufgabe: ${performanceData.avgHintsUsed.toFixed(1)}
- Durchschnittliche Zeit pro Aufgabe: ${Math.round(performanceData.avgTimeSpent)}s
- ${strugglingTopicsText}

DEINE AUFGABE:
Passe die Lernparameter an, um dem Schüler optimal zu helfen:

PARAMETER:
1. **detailLevel** (0-100): Wie ausführlich sollen Erklärungen und Hinweise sein?
   - 0-30: Sehr kurz, nur Stichpunkte
   - 31-60: Ausgeglichen, klare Erklärungen
   - 61-100: Sehr ausführlich, Schritt-für-Schritt

2. **temperature** (0-1, Schritte von 0.1): Wie kreativ vs. präzise sollen Hinweise sein?
   - 0.0-0.3: Sehr präzise, mathematisch streng
   - 0.4-0.6: Ausgeglichen
   - 0.7-1.0: Kreativ, verschiedene Erklärungsansätze

3. **helpfulness** (0-100): Wie viel Unterstützung braucht der Schüler?
   - 0-30: Eigenständig, minimale Hilfe
   - 31-60: Ausgeglichen
   - 61-100: Sehr unterstützend, viele Hilfestellungen

ANPASSUNGS-LOGIK (Beispiele):
- Hohe Erfolgsrate (>80%) + wenige Hinweise (< 1.5) → Weniger Hilfe, fordere Eigenständigkeit
- Niedrige Erfolgsrate (<50%) → Mehr Details, mehr Unterstützung, präzisere Hinweise
- Viele Hinweise genutzt (> 2) → Erhöhe helpfulness und detailLevel
- Spezifische Themenschwierigkeiten → temperature senken für präzisere Erklärungen
- Gute Performance trotz wenig Hilfe → Fortgeschrittene Herausforderungen

AUSGABE:
Gib deine Einschätzung als JSON zurück (NUR das JSON):
{
  "detailLevel": 65,
  "temperature": 0.5,
  "helpfulness": 70,
  "reasoning": "Schüler zeigt Fortschritt, aber braucht noch Unterstützung bei komplexen Ableitungen. Detailgrad erhöht, um Sicherheit zu stärken."
}

WICHTIG:
- Die "reasoning" Begründung ist NICHT für den Schüler sichtbar, nur intern
- Maximal 2 Sätze für reasoning
- Sei objektiv und datenbasiert`

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
