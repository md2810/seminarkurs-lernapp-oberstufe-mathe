/**
 * Prompt Engine - Centralized prompt management for AI API calls
 *
 * Architecture: Backend-Driven UI with strict separation of code and content
 *
 * Features:
 * - Loads prompts from JavaScript exports (CF Workers compatible)
 * - Replaces {{variable}} placeholders with provided values
 * - Validates required variables
 * - Provides helpful error messages for missing prompts/variables
 */

// Import all prompts from the JavaScript prompts file
import {
  questionGenerationPrompt,
  adaptiveQuestionPrompt,
  imageAnalysisPrompt,
  geogebraGenerationPrompt,
  customHintPrompt,
  whiteboardAnalysisPrompt,
  autoModeUpdatePrompt,
  collaborativeCanvasPrompt,
  miniAppGenerationPrompt,
  solutionVisualizationPrompt
} from './prompts.js'

// Prompt registry mapping names to imported content
const PROMPT_REGISTRY = {
  'question-generation': questionGenerationPrompt,
  'adaptive-question-generation': adaptiveQuestionPrompt,
  'image-analysis': imageAnalysisPrompt,
  'geogebra-generation': geogebraGenerationPrompt,
  'custom-hint': customHintPrompt,
  'whiteboard-analysis': whiteboardAnalysisPrompt,
  'auto-mode-update': autoModeUpdatePrompt,
  'collaborative-canvas': collaborativeCanvasPrompt,
  'mini-app-generation': miniAppGenerationPrompt,
  'solution-visualization': solutionVisualizationPrompt,
}

/**
 * Load and process a prompt template
 *
 * @param {string} promptName - Name of the prompt file (without .md extension)
 * @param {Object} variables - Key-value pairs to replace {{key}} placeholders
 * @returns {string} Processed prompt with all variables replaced
 * @throws {Error} If prompt not found or required variables missing
 *
 * @example
 * const prompt = loadPrompt('question-generation', {
 *   TOPICS_LIST: 'Analysis > Ableitung',
 *   GRADE_LEVEL: 'Klasse_11',
 *   COURSE_TYPE: 'Leistungsfach'
 * })
 */
export function loadPrompt(promptName, variables = {}) {
  // Get prompt content from registry
  const promptContent = PROMPT_REGISTRY[promptName]

  if (!promptContent) {
    const availablePrompts = Object.keys(PROMPT_REGISTRY).join(', ')
    throw new Error(
      `Prompt "${promptName}" not found. Available prompts: ${availablePrompts}`
    )
  }

  // Replace all {{variable}} placeholders
  let processedPrompt = promptContent

  // Find all placeholders in the template
  const placeholderRegex = /\{\{(\w+)\}\}/g
  const foundPlaceholders = new Set()
  let match

  while ((match = placeholderRegex.exec(promptContent)) !== null) {
    foundPlaceholders.add(match[1])
  }

  // Replace placeholders with provided values
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    processedPrompt = processedPrompt.replace(placeholder, String(value ?? ''))
  }

  // Check for unreplaced placeholders (optional - warn but don't fail)
  const unreplacedMatch = processedPrompt.match(/\{\{(\w+)\}\}/g)
  if (unreplacedMatch) {
    console.warn(
      `[PromptEngine] Warning: Unreplaced placeholders in "${promptName}": ${unreplacedMatch.join(', ')}`
    )
  }

  return processedPrompt.trim()
}

/**
 * Get list of all available prompts
 * @returns {string[]} Array of prompt names
 */
export function getAvailablePrompts() {
  return Object.keys(PROMPT_REGISTRY)
}

/**
 * Check if a prompt exists
 * @param {string} promptName - Name of the prompt
 * @returns {boolean}
 */
export function promptExists(promptName) {
  return promptName in PROMPT_REGISTRY
}

/**
 * Extract all placeholder variables from a prompt
 * @param {string} promptName - Name of the prompt
 * @returns {string[]} Array of variable names
 */
export function getPromptVariables(promptName) {
  const promptContent = PROMPT_REGISTRY[promptName]
  if (!promptContent) return []

  const placeholderRegex = /\{\{(\w+)\}\}/g
  const variables = new Set()
  let match

  while ((match = placeholderRegex.exec(promptContent)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

export default { loadPrompt, getAvailablePrompts, promptExists, getPromptVariables }
