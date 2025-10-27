// Cloudflare Pages Function: Get Available Models
// Fetches available Claude models from Anthropic API

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey } = body

    // Validate API key
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call Anthropic API to get available models
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json()
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch models from Anthropic API',
          details: error
        }),
        { status: anthropicResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const modelsData = await anthropicResponse.json()

    // Filter and format models for the UI
    const models = modelsData.data
      .filter(model => {
        // Only show models that are suitable for chat/completion
        return model.id.includes('claude') && !model.id.includes('opus-4')
      })
      .map(model => ({
        id: model.id,
        name: formatModelName(model.id),
        type: getModelType(model.id),
        description: getModelDescription(model.id),
        created: model.created_at
      }))
      .sort((a, b) => b.created - a.created) // Sort by newest first

    return new Response(
      JSON.stringify({
        success: true,
        models
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-models:', error)
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

// Helper function to format model names
function formatModelName(modelId) {
  // Extract version from model ID
  // e.g., "claude-sonnet-4-5-20250929" -> "Claude Sonnet 4.5"
  // e.g., "claude-opus-4-20250514" -> "Claude Opus 4"

  if (modelId.includes('sonnet')) {
    const match = modelId.match(/claude-sonnet-(\d+)-(\d+)/)
    if (match) {
      return `Claude Sonnet ${match[1]}.${match[2]}`
    }
    return 'Claude Sonnet'
  }

  if (modelId.includes('opus')) {
    const match = modelId.match(/claude-opus-(\d+)/)
    if (match) {
      return `Claude Opus ${match[1]}`
    }
    return 'Claude Opus'
  }

  if (modelId.includes('haiku')) {
    const match = modelId.match(/claude-(\d+)-(\d+)-haiku/)
    if (match) {
      return `Claude ${match[1]}.${match[2]} Haiku`
    }
    return 'Claude Haiku'
  }

  // Fallback: capitalize and format
  return modelId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to determine model type
function getModelType(modelId) {
  if (modelId.includes('sonnet')) return 'balanced'
  if (modelId.includes('opus')) return 'powerful'
  if (modelId.includes('haiku')) return 'fast'
  return 'standard'
}

// Helper function to get model description
function getModelDescription(modelId) {
  if (modelId.includes('sonnet-4-5')) {
    return 'Neueste Sonnet-Version mit verbesserter Genauigkeit und Geschwindigkeit'
  }
  if (modelId.includes('sonnet-4')) {
    return 'Ausgewogenes Modell für komplexe Aufgaben'
  }
  if (modelId.includes('sonnet')) {
    return 'Ausgewogen zwischen Leistung und Geschwindigkeit'
  }
  if (modelId.includes('opus')) {
    return 'Höchste Genauigkeit und Intelligenz'
  }
  if (modelId.includes('haiku')) {
    return 'Schnell und effizient für einfache Aufgaben'
  }
  return 'Claude Modell'
}

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      endpoint: '/api/get-models',
      method: 'POST',
      description: 'Fetches available Claude models',
      requiredFields: ['apiKey']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
