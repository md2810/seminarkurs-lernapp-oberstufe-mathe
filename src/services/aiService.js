/**
 * Unified AI Service with Model Router
 * Phase 2 Upgrade: Intelligent model selection based on task complexity
 *
 * Features:
 * - Multi-provider support (Claude, Gemini, OpenAI)
 * - Automatic model routing based on complexity
 * - Cost optimization for simple queries
 */

const AI_ENDPOINTS = {
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  openai: 'https://api.openai.com/v1/chat/completions'
}

// Model tiers: light (fast/cheap), standard (balanced), heavy (powerful)
const MODEL_TIERS = {
  claude: {
    light: 'claude-3-5-haiku-20241022',
    standard: 'claude-sonnet-4-20250514',
    heavy: 'claude-sonnet-4-20250514'
  },
  gemini: {
    light: 'gemini-2.0-flash-exp',
    standard: 'gemini-2.0-flash-exp',
    heavy: 'gemini-1.5-pro'
  },
  openai: {
    light: 'gpt-4o-mini',
    standard: 'gpt-4o',
    heavy: 'gpt-4o'
  }
}

// Default models (for backward compatibility)
const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash-exp',
  openai: 'gpt-4o'
}

// AFB (Anforderungsbereiche) complexity levels
const AFB_LEVELS = {
  I: 'light',      // Reproduktion - simple recall and basic operations
  II: 'standard',  // Reorganisation - applying knowledge to new contexts
  III: 'heavy'     // Transfer - complex problem solving, proofs
}

/**
 * Determine the appropriate model tier based on task complexity
 * @param {Object} options - Complexity indicators
 * @returns {string} - Model tier: 'light', 'standard', or 'heavy'
 */
export function determineModelTier({
  afbLevel = 'II',
  hasGeoGebra = false,
  questionCount = 5,
  hasProof = false,
  isNumericOnly = false,
  customComplexity = null
}) {
  // Custom override
  if (customComplexity && ['light', 'standard', 'heavy'].includes(customComplexity)) {
    return customComplexity
  }

  // Heavy tier required for:
  // - GeoGebra script generation (complex syntax)
  // - Mathematical proofs
  // - AFB III (transfer) questions
  // - Large batch generation (>15 questions)
  if (hasGeoGebra || hasProof || afbLevel === 'III' || questionCount > 15) {
    return 'heavy'
  }

  // Light tier for:
  // - AFB I (simple recall)
  // - Purely numeric operations
  // - Small batches (<=3 questions)
  if (afbLevel === 'I' || (isNumericOnly && questionCount <= 5) || questionCount <= 3) {
    return 'light'
  }

  // Standard tier for everything else
  return 'standard'
}

/**
 * Select the optimal model based on provider and complexity
 * @param {string} provider - AI provider
 * @param {Object} complexityOptions - Task complexity indicators
 * @param {string} preferredModel - User's preferred model (optional)
 * @returns {string} - Selected model ID
 */
export function selectModel(provider, complexityOptions = {}, preferredModel = null) {
  // If user explicitly selected a model, respect that choice
  if (preferredModel) {
    return preferredModel
  }

  // Determine tier based on complexity
  const tier = determineModelTier(complexityOptions)

  // Get model for this provider and tier
  return MODEL_TIERS[provider]?.[tier] || DEFAULT_MODELS[provider]
}

/**
 * Generate a response from the selected AI provider with automatic model routing
 */
export async function generateAIResponse({
  provider,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 8000,
  // New Phase 2 parameters for model routing
  complexity = null,
  afbLevel = 'II',
  hasGeoGebra = false,
  questionCount = 5,
  enableAutoRouting = true
}) {
  if (!apiKey) {
    throw new Error(`API key for ${provider} is missing`)
  }

  // Determine optimal model if auto-routing enabled
  let selectedModel = model
  if (enableAutoRouting && !model) {
    selectedModel = selectModel(provider, {
      afbLevel,
      hasGeoGebra,
      questionCount,
      customComplexity: complexity
    })
    console.log(`[AI Service] Auto-routed to ${selectedModel} (provider: ${provider}, complexity: ${complexity || 'auto'})`)
  } else {
    selectedModel = model || DEFAULT_MODELS[provider]
  }

  try {
    switch (provider) {
      case 'claude':
        return await callClaude({ apiKey, model: selectedModel, systemPrompt, userPrompt, temperature, maxTokens })
      case 'gemini':
        return await callGemini({ apiKey, model: selectedModel, systemPrompt, userPrompt, temperature, maxTokens })
      case 'openai':
        return await callOpenAI({ apiKey, model: selectedModel, systemPrompt, userPrompt, temperature, maxTokens })
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  } catch (error) {
    console.error(`AI Service error (${provider}):`, error)
    throw error
  }
}

/**
 * Call Anthropic Claude API
 */
async function callClaude({ apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const response = await fetch(AI_ENDPOINTS.claude, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Claude API error: ${error.error?.message || JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * Call Google Gemini API
 */
async function callGemini({ apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const endpoint = `${AI_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemPrompt + '\n\n' + userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

/**
 * Call OpenAI API
 */
async function callOpenAI({ apiKey, model, systemPrompt, userPrompt, temperature, maxTokens }) {
  const response = await fetch(AI_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseJSONResponse(response) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim())
    }

    // Try to find raw JSON object
    const objectMatch = response.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }

    // Try direct parse
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse JSON response:', error)
    throw new Error('Failed to parse AI response as JSON')
  }
}

/**
 * Generate a cache key for question lookup
 * Used for Firestore question_cache collection
 */
export function generateCacheKey(topics, afbLevel, difficulty) {
  const topicHash = topics
    .map(t => `${t.leitidee}_${t.thema}_${t.unterthema}`)
    .sort()
    .join('|')

  return `${topicHash}_AFB${afbLevel}_D${difficulty}`
}

/**
 * Estimate token count for a prompt (rough approximation)
 * Useful for cost estimation
 */
export function estimateTokens(text) {
  // Rough estimate: ~4 characters per token for German text
  return Math.ceil(text.length / 4)
}

/**
 * Get cost estimate for a model call
 * Returns cost in USD (approximate)
 */
export function estimateCost(provider, model, inputTokens, outputTokens) {
  const PRICING = {
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    'gemini-2.0-flash-exp': { input: 0.0001, output: 0.0004 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.0025, output: 0.01 }
  }

  const pricing = PRICING[model]
  if (!pricing) return null

  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output

  return {
    inputCost: inputCost.toFixed(6),
    outputCost: outputCost.toFixed(6),
    totalCost: (inputCost + outputCost).toFixed(6),
    model
  }
}

export default {
  generateAIResponse,
  parseJSONResponse,
  selectModel,
  determineModelTier,
  generateCacheKey,
  estimateTokens,
  estimateCost,
  DEFAULT_MODELS,
  MODEL_TIERS,
  AFB_LEVELS
}
