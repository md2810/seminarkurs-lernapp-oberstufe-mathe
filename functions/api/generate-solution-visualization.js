/**
 * Cloudflare Pages Function: Solution Visualization Generation
 * Generates step-by-step visual explanations for math solutions
 */

const SOLUTION_VISUALIZATION_PROMPT = `
Du bist ein Experte für mathematische Visualisierungen.

**AUFGABE:**
Erstelle eine Schritt-für-Schritt Visualisierung für die folgende Lösung.

**FRAGE:**
{{QUESTION}}

**LÖSUNG:**
{{SOLUTION}}

**ANFORDERUNGEN:**
1. Zerlege die Lösung in klare, visuelle Schritte
2. Beschreibe für jeden Schritt, was gezeichnet/dargestellt werden soll
3. Nutze einfache geometrische Formen und Graphen
4. Erkläre jeden Schritt verständlich

**OUTPUT JSON:**
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Schritt-Titel",
      "description": "Was passiert in diesem Schritt",
      "visualElements": [
        {
          "type": "function|point|line|area|text|arrow",
          "definition": "f(x) = x^2",
          "label": "Parabel",
          "color": "#4CAF50",
          "animation": "draw|fadeIn|highlight"
        }
      ],
      "explanation": "Ausführliche Erklärung..."
    }
  ],
  "interactiveElements": [
    {
      "type": "slider|input|toggle",
      "variable": "a",
      "min": -5,
      "max": 5,
      "affects": ["function", "point"]
    }
  ]
}
`;

const AI_ENDPOINTS = {
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  openai: 'https://api.openai.com/v1/chat/completions'
}

const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-20250514',
  gemini: 'gemini-3-flash-preview',
  openai: 'gpt-4o'
}

async function callAI({ provider, apiKey, model, prompt }) {
  switch (provider) {
    case 'claude': {
      const response = await fetch(AI_ENDPOINTS.claude, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODELS.claude,
          max_tokens: 4000,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
      const data = await response.json()
      return data.content[0].text
    }
    case 'gemini': {
      const endpoint = `${AI_ENDPOINTS.gemini}/${model || DEFAULT_MODELS.gemini}:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 4000 }
        })
      })
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    }
    case 'openai': {
      const response = await fetch(AI_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODELS.openai,
          max_tokens: 4000,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`)
      const data = await response.json()
      return data.choices[0].message.content
    }
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

function parseJSONResponse(response) {
  try {
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim())
    const objectMatch = response.match(/\{[\s\S]*\}/)
    if (objectMatch) return JSON.parse(objectMatch[0])
    return JSON.parse(response)
  } catch {
    return null
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { provider = 'claude', apiKey, model, question, solution } = body

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!question || !solution) {
      return new Response(
        JSON.stringify({ success: false, error: 'Question and solution are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt
    const prompt = SOLUTION_VISUALIZATION_PROMPT
      .replace('{{QUESTION}}', question)
      .replace('{{SOLUTION}}', solution)

    // Call AI
    let responseText
    try {
      responseText = await callAI({ provider, apiKey, model, prompt })
    } catch (aiError) {
      return new Response(
        JSON.stringify({ success: false, error: aiError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse response
    const data = parseJSONResponse(responseText)

    if (!data || !data.steps) {
      // If parsing failed, create a simple visualization from the solution text
      const simpleSteps = solution.split('\n\n').filter(s => s.trim()).map((text, index) => ({
        stepNumber: index + 1,
        title: `Schritt ${index + 1}`,
        description: text.trim(),
        explanation: text.trim(),
        visualElements: []
      }))

      return new Response(
        JSON.stringify({
          success: true,
          steps: simpleSteps,
          interactiveElements: []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        steps: data.steps,
        interactiveElements: data.interactiveElements || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-solution-visualization:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      endpoint: '/api/generate-solution-visualization',
      method: 'POST',
      description: 'Generates step-by-step visualizations for math solutions',
      requiredFields: ['apiKey', 'question', 'solution'],
      optionalFields: ['provider', 'model']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
