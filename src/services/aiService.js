/**
 * Unified AI Service
 * Handles API calls to Claude, Gemini, and OpenAI with consistent interface
 */

const AI_ENDPOINTS = {
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  openai: 'https://api.openai.com/v1/chat/completions'
}

const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-5-20250929',
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o'
}

/**
 * Generate a response from the selected AI provider
 */
export async function generateAIResponse({
  provider,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 8000
}) {
  if (!apiKey) {
    throw new Error(`API key for ${provider} is missing`)
  }

  const selectedModel = model || DEFAULT_MODELS[provider]

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

export default {
  generateAIResponse,
  parseJSONResponse,
  DEFAULT_MODELS
}
