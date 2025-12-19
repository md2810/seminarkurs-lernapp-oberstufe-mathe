// Cloudflare Pages Function: Get Available Models
// Fetches available models from Anthropic and Google APIs

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { apiKey, provider = 'claude' } = body

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

    let models = []

    switch (provider) {
      case 'claude':
        models = await fetchClaudeModels(apiKey)
        break
      case 'gemini':
        models = await fetchGeminiModels(apiKey)
        break
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown provider: ${provider}`
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

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

// ============================================
// ANTHROPIC CLAUDE
// ============================================
async function fetchClaudeModels(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch Claude models')
  }

  const data = await response.json()

  return data.data
    .filter(model => model.id.includes('claude') && !model.id.includes('opus-4'))
    .map(model => ({
      id: model.id,
      name: formatClaudeModelName(model.id),
      type: getClaudeModelType(model.id),
      description: getClaudeModelDescription(model.id)
    }))
    .sort((a, b) => {
      // Sort by model tier: sonnet > haiku
      const tierOrder = { 'sonnet': 1, 'haiku': 2 }
      const aTier = Object.keys(tierOrder).find(t => a.id.includes(t)) || 'z'
      const bTier = Object.keys(tierOrder).find(t => b.id.includes(t)) || 'z'
      return (tierOrder[aTier] || 99) - (tierOrder[bTier] || 99)
    })
}

function formatClaudeModelName(modelId) {
  if (modelId.includes('sonnet')) {
    const match = modelId.match(/claude-sonnet-(\d+)-(\d+)/)
    if (match) return `Claude Sonnet ${match[1]}.${match[2]}`
    return 'Claude Sonnet'
  }
  if (modelId.includes('opus')) {
    const match = modelId.match(/claude-opus-(\d+)/)
    if (match) return `Claude Opus ${match[1]}`
    return 'Claude Opus'
  }
  if (modelId.includes('haiku')) {
    const match = modelId.match(/claude-(\d+)-(\d+)-haiku/)
    if (match) return `Claude ${match[1]}.${match[2]} Haiku`
    return 'Claude Haiku'
  }
  return modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getClaudeModelType(modelId) {
  if (modelId.includes('sonnet')) return 'balanced'
  if (modelId.includes('opus')) return 'powerful'
  if (modelId.includes('haiku')) return 'fast'
  return 'standard'
}

function getClaudeModelDescription(modelId) {
  if (modelId.includes('sonnet-4-5')) return 'Neueste Version - Ausgewogen'
  if (modelId.includes('sonnet-4')) return 'Komplexe Aufgaben'
  if (modelId.includes('sonnet')) return 'Ausgewogen'
  if (modelId.includes('opus')) return 'Höchste Genauigkeit'
  if (modelId.includes('haiku')) return 'Schnell & Effizient'
  return 'Claude Modell'
}

// ============================================
// GOOGLE GEMINI
// ============================================
async function fetchGeminiModels(apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch Gemini models')
  }

  const data = await response.json()

  return (data.models || [])
    .filter(model => {
      // Only show Gemini models suitable for generation
      const name = model.name || ''
      return name.includes('gemini') &&
             model.supportedGenerationMethods?.includes('generateContent')
    })
    .map(model => {
      const modelId = model.name.replace('models/', '')
      return {
        id: modelId,
        name: formatGeminiModelName(modelId),
        type: getGeminiModelType(modelId),
        description: model.description || getGeminiModelDescription(modelId)
      }
    })
    .sort((a, b) => {
      // Sort: Pro > Flash > Nano
      const tierOrder = { 'pro': 1, 'flash': 2, 'nano': 3 }
      const aTier = Object.keys(tierOrder).find(t => a.id.includes(t)) || 'z'
      const bTier = Object.keys(tierOrder).find(t => b.id.includes(t)) || 'z'
      return (tierOrder[aTier] || 99) - (tierOrder[bTier] || 99)
    })
}

function formatGeminiModelName(modelId) {
  // gemini-1.5-pro -> Gemini 1.5 Pro
  // gemini-3-flash-preview -> Gemini 3 Flash (Preview)
  const parts = modelId.split('-')
  let name = 'Gemini'

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    if (part === 'exp' || part === 'experimental') {
      name += ' (Exp)'
    } else if (part === 'latest') {
      name += ' Latest'
    } else if (part === 'thinking') {
      name += ' Thinking'
    } else if (/^\d/.test(part)) {
      name += ` ${part}`
    } else {
      name += ` ${part.charAt(0).toUpperCase() + part.slice(1)}`
    }
  }

  return name
}

function getGeminiModelType(modelId) {
  if (modelId.includes('pro')) return 'powerful'
  if (modelId.includes('flash')) return 'fast'
  if (modelId.includes('nano')) return 'minimal'
  return 'standard'
}

function getGeminiModelDescription(modelId) {
  if (modelId.includes('2.0')) return 'Neueste Generation'
  if (modelId.includes('1.5-pro')) return 'Beste Qualität'
  if (modelId.includes('flash')) return 'Schnell & Effizient'
  if (modelId.includes('thinking')) return 'Erweitertes Reasoning'
  return 'Google Gemini'
}

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      endpoint: '/api/get-models',
      method: 'POST',
      description: 'Fetches available models from AI providers',
      requiredFields: ['apiKey'],
      optionalFields: ['provider'],
      providers: ['claude', 'gemini']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
