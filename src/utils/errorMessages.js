/**
 * User-friendly error messages utility
 * Converts technical errors into helpful, actionable messages
 */

// Error type mappings
const ERROR_MESSAGES = {
  // API Key errors
  'invalid_api_key': {
    title: 'Ungültiger API-Schlüssel',
    message: 'Der eingegebene API-Schlüssel ist ungültig oder abgelaufen.',
    suggestions: [
      'Überprüfe deinen API-Key in den Einstellungen',
      'Stelle sicher, dass der Schlüssel korrekt kopiert wurde',
      'Prüfe, ob der Schlüssel noch aktiv ist'
    ],
    actions: [{ label: 'Einstellungen öffnen', action: 'openSettings' }]
  },

  // Rate limit errors
  'rate_limit': {
    title: 'Zu viele Anfragen',
    message: 'Du hast das Limit für Anfragen erreicht.',
    suggestions: [
      'Warte einen Moment und versuche es erneut',
      'Bei kostenlosen API-Keys gibt es oft strengere Limits',
      'Erwäge ein Upgrade deines API-Kontingents'
    ],
    actions: [{ label: 'Erneut versuchen', action: 'retry' }]
  },

  // Network errors
  'network_error': {
    title: 'Verbindungsproblem',
    message: 'Die Verbindung zum KI-Service konnte nicht hergestellt werden.',
    suggestions: [
      'Überprüfe deine Internetverbindung',
      'Der Service könnte vorübergehend nicht verfügbar sein',
      'Versuche es in einigen Sekunden erneut'
    ],
    actions: [{ label: 'Erneut versuchen', action: 'retry' }]
  },

  // Model not found
  'model_not_found': {
    title: 'Modell nicht verfügbar',
    message: 'Das ausgewählte KI-Modell ist nicht mehr verfügbar.',
    suggestions: [
      'Wähle ein anderes Modell in den Einstellungen',
      'Lade die Modellliste neu',
      'Einige Modelle sind nur mit bestimmten API-Plänen verfügbar'
    ],
    actions: [
      { label: 'Einstellungen öffnen', action: 'openSettings' },
      { label: 'Modelle neu laden', action: 'reloadModels' }
    ]
  },

  // Generation failed
  'generation_failed': {
    title: 'Generierung fehlgeschlagen',
    message: 'Die KI konnte keine gültige Antwort erstellen.',
    suggestions: [
      'Versuche es mit einer anderen Formulierung',
      'Vereinfache deine Anfrage',
      'Bei komplexen Themen hilft manchmal ein Neustart'
    ],
    actions: [{ label: 'Erneut versuchen', action: 'retry' }]
  },

  // Timeout
  'timeout': {
    title: 'Zeitüberschreitung',
    message: 'Die Anfrage hat zu lange gedauert.',
    suggestions: [
      'Die KI war möglicherweise überlastet',
      'Versuche eine kürzere Anfrage',
      'Warte einen Moment und versuche es erneut'
    ],
    actions: [{ label: 'Erneut versuchen', action: 'retry' }]
  },

  // Default
  'unknown': {
    title: 'Ein Fehler ist aufgetreten',
    message: 'Etwas ist schiefgelaufen.',
    suggestions: [
      'Versuche es erneut',
      'Wenn der Fehler bestehen bleibt, kontaktiere den Support'
    ],
    actions: [{ label: 'Erneut versuchen', action: 'retry' }]
  }
}

/**
 * Parse error response and return user-friendly error info
 */
export function parseError(error, context = {}) {
  let errorType = 'unknown'
  let originalMessage = ''

  if (typeof error === 'string') {
    originalMessage = error.toLowerCase()
  } else if (error?.message) {
    originalMessage = error.message.toLowerCase()
  } else if (error?.error) {
    originalMessage = (typeof error.error === 'string' ? error.error : error.error.message || '').toLowerCase()
  }

  // Detect error type from message
  if (originalMessage.includes('invalid') && (originalMessage.includes('key') || originalMessage.includes('api'))) {
    errorType = 'invalid_api_key'
  } else if (originalMessage.includes('401') || originalMessage.includes('unauthorized')) {
    errorType = 'invalid_api_key'
  } else if (originalMessage.includes('429') || originalMessage.includes('rate') || originalMessage.includes('limit') || originalMessage.includes('quota')) {
    errorType = 'rate_limit'
  } else if (originalMessage.includes('network') || originalMessage.includes('fetch') || originalMessage.includes('connection')) {
    errorType = 'network_error'
  } else if (originalMessage.includes('not found') || originalMessage.includes('not supported') || originalMessage.includes('does not exist')) {
    errorType = 'model_not_found'
  } else if (originalMessage.includes('timeout') || originalMessage.includes('timed out')) {
    errorType = 'timeout'
  } else if (originalMessage.includes('parse') || originalMessage.includes('json') || originalMessage.includes('generation')) {
    errorType = 'generation_failed'
  }

  const errorInfo = ERROR_MESSAGES[errorType]

  return {
    type: errorType,
    title: errorInfo.title,
    message: errorInfo.message,
    suggestions: errorInfo.suggestions,
    actions: errorInfo.actions,
    originalError: originalMessage || 'Unbekannter Fehler',
    context
  }
}

/**
 * Get a simple error message string
 */
export function getErrorMessage(error) {
  const parsed = parseError(error)
  return `${parsed.title}: ${parsed.message}`
}

/**
 * Format error for display with suggestions
 */
export function formatErrorForDisplay(error) {
  const parsed = parseError(error)
  return {
    ...parsed,
    formattedMessage: `${parsed.title}\n\n${parsed.message}\n\nWas du tun kannst:\n${parsed.suggestions.map(s => `• ${s}`).join('\n')}`
  }
}

export default {
  parseError,
  getErrorMessage,
  formatErrorForDisplay,
  ERROR_MESSAGES
}
