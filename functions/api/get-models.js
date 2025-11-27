// Cloudflare Pages Function: Get Available Models
// Fetches available models from Anthropic, Google, and OpenAI APIs

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
      case 'openai':
        models = await fetchOpenAIModels(apiKey)
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
  // gemini-2.0-flash-exp -> Gemini 2.0 Flash (Experimental)
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

// ============================================
// OPENAI
// ============================================
async function fetchOpenAIModels(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch OpenAI models')
  }

  const data = await response.json()

  return (data.data || [])
    .filter(model => {
      // Only show GPT models suitable for chat
      const id = model.id || ''
      return (id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('o1') || id.includes('o3')) &&
             !id.includes('vision') &&
             !id.includes('instruct') &&
             !id.includes('realtime')
    })
    .map(model => ({
      id: model.id,
      name: formatOpenAIModelName(model.id),
      type: getOpenAIModelType(model.id),
      description: getOpenAIModelDescription(model.id)
    }))
    .sort((a, b) => {
      // Sort: o1/o3 > gpt-4o > gpt-4 > gpt-3.5
      const tierOrder = { 'o3': 0, 'o1': 1, 'gpt-4o': 2, 'gpt-4-turbo': 3, 'gpt-4': 4, 'gpt-3.5': 5 }
      const aTier = Object.keys(tierOrder).find(t => a.id.includes(t)) || 'z'
      const bTier = Object.keys(tierOrder).find(t => b.id.includes(t)) || 'z'
      return (tierOrder[aTier] || 99) - (tierOrder[bTier] || 99)
    })
}

function formatOpenAIModelName(modelId) {
  // gpt-4o-2024-11-20 -> GPT-4o (Nov 2024)
  // gpt-4-turbo -> GPT-4 Turbo
  // o1-preview -> O1 Preview

  if (modelId.startsWith('o1') || modelId.startsWith('o3')) {
    const parts = modelId.split('-')
    let name = parts[0].toUpperCase()
    if (parts[1] === 'preview') name += ' Preview'
    else if (parts[1] === 'mini') name += ' Mini'
    else if (parts[1]) name += ` ${parts[1]}`
    return name
  }

  let name = modelId.toUpperCase()
    .replace('GPT-4O', 'GPT-4o')
    .replace('GPT-4-TURBO', 'GPT-4 Turbo')
    .replace('GPT-3.5-TURBO', 'GPT-3.5 Turbo')

  // Remove date suffixes for cleaner display
  name = name.replace(/-\d{4}-\d{2}-\d{2}$/, '')

  return name
}

function getOpenAIModelType(modelId) {
  if (modelId.includes('o1') || modelId.includes('o3')) return 'reasoning'
  if (modelId.includes('gpt-4o')) return 'powerful'
  if (modelId.includes('gpt-4-turbo')) return 'fast'
  if (modelId.includes('gpt-4')) return 'balanced'
  if (modelId.includes('gpt-3.5')) return 'efficient'
  return 'standard'
}

function getOpenAIModelDescription(modelId) {
  if (modelId.includes('o3')) return 'Neuestes Reasoning Modell'
  if (modelId.includes('o1-preview')) return 'Erweitertes Reasoning'
  if (modelId.includes('o1-mini')) return 'Schnelles Reasoning'
  if (modelId.includes('gpt-4o-mini')) return 'Schnell & Günstig'
  if (modelId.includes('gpt-4o')) return 'Multimodal & Schnell'
  if (modelId.includes('gpt-4-turbo')) return 'Schnelle GPT-4 Variante'
  if (modelId.includes('gpt-4')) return 'Höchste Qualität'
  if (modelId.includes('gpt-3.5')) return 'Effizient & Günstig'
  return 'OpenAI Modell'
}

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      endpoint: '/api/get-models',
      method: 'POST',
      description: 'Fetches available models from AI providers',
      requiredFields: ['apiKey'],
      optionalFields: ['provider'],
      providers: ['claude', 'gemini', 'openai']
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
