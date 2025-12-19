/**
 * API Fallback Utilities
 * Implementiert Offline-Support und Fallback-Logik für API-Aufrufe
 *
 * Strategie:
 * 1. Versuche primär das API
 * 2. Bei Fehler: Nutze gecachte Daten
 * 3. Bei keinem Cache: Nutze statische lokale Daten
 */

import localTopics from '../../data/bw_oberstufe_themen.json'

// Cache für API-Antworten
const API_CACHE = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten

/**
 * Prüft, ob der Browser online ist
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * Holt einen Cache-Eintrag, wenn noch gültig
 */
function getCachedResponse(key) {
  const cached = API_CACHE.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    API_CACHE.delete(key)
    return null
  }

  return cached.data
}

/**
 * Speichert eine API-Antwort im Cache
 */
function cacheResponse(key, data) {
  API_CACHE.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * Generiert eine einfache Cache-Key basierend auf den Parametern
 */
function generateCacheKey(endpoint, params) {
  return `${endpoint}:${JSON.stringify(params)}`
}

/**
 * Führt einen API-Aufruf mit Fallback durch
 *
 * @param {string} endpoint - Der API-Endpunkt
 * @param {object} options - fetch-Optionen
 * @param {function} fallbackFn - Fallback-Funktion, die aufgerufen wird, wenn das API fehlschlägt
 * @returns {Promise<object>} - Die API-Antwort oder Fallback-Daten
 */
export async function fetchWithFallback(endpoint, options, fallbackFn) {
  const cacheKey = generateCacheKey(endpoint, options.body)

  // 1. Prüfe Cache
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    console.log('[API Fallback] Using cached response for:', endpoint)
    return cached
  }

  // 2. Versuche API-Aufruf, wenn online
  if (isOnline()) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        // Timeout nach 10 Sekunden
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()
        cacheResponse(cacheKey, data)
        return data
      }

      // API hat Fehler zurückgegeben
      console.warn('[API Fallback] API returned error:', response.status)
    } catch (error) {
      console.warn('[API Fallback] API request failed:', error.message)
    }
  } else {
    console.log('[API Fallback] Offline mode detected')
  }

  // 3. Nutze Fallback
  if (fallbackFn) {
    console.log('[API Fallback] Using fallback function for:', endpoint)
    return fallbackFn()
  }

  // 4. Letzte Möglichkeit: Fehler werfen
  throw new Error('API nicht erreichbar und kein Fallback verfügbar')
}

/**
 * Lokale Themen aus der statischen JSON-Datei holen
 *
 * @param {string} gradeLevel - z.B. "Klasse_11"
 * @param {string} courseType - z.B. "Leistungsfach"
 * @returns {object[]} - Liste der Themen
 */
export function getLocalTopics(gradeLevel = 'Klassen_11_12', courseType = 'Leistungsfach') {
  const topics = []

  try {
    const classData = localTopics[gradeLevel]
    if (!classData) {
      console.warn('[Local Topics] Grade level not found:', gradeLevel)
      return topics
    }

    const courseData = classData[courseType]
    if (!courseData) {
      console.warn('[Local Topics] Course type not found:', courseType)
      return topics
    }

    // Konvertiere die verschachtelte Struktur in eine flache Liste
    Object.entries(courseData).forEach(([category, subcategories]) => {
      Object.entries(subcategories).forEach(([subcategory, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item, index) => {
            topics.push({
              id: `local-${category}-${subcategory}-${index}`,
              thema: category,
              unterthema: subcategory,
              inhalt: item,
              source: 'local'
            })
          })
        }
      })
    })
  } catch (error) {
    console.error('[Local Topics] Error parsing local topics:', error)
  }

  return topics
}

/**
 * Generiert Fallback-Fragen aus lokalen Daten
 * Wird verwendet, wenn das API nicht erreichbar ist
 *
 * @param {object[]} topics - Ausgewählte Themen
 * @param {number} difficulty - Schwierigkeitsgrad (1-10)
 * @param {number} count - Anzahl der Fragen
 * @returns {object[]} - Generierte Fallback-Fragen
 */
export function generateFallbackQuestions(topics, difficulty = 5, count = 5) {
  if (!topics || topics.length === 0) {
    return []
  }

  const questions = []
  const usedIndices = new Set()

  // Generiere einfache Multiple-Choice-Fragen basierend auf den Themen
  for (let i = 0; i < count; i++) {
    const topicIndex = i % topics.length
    const topic = topics[topicIndex]

    // Vermeide Duplikate
    const questionId = `fallback-${topic.thema}-${topic.unterthema}-${i}`
    if (usedIndices.has(questionId)) continue
    usedIndices.add(questionId)

    // Erstelle eine einfache Verständnisfrage
    const question = {
      id: questionId,
      type: 'multiple-choice',
      topic: topic.thema || 'Mathematik',
      subtopic: topic.unterthema || 'Allgemein',
      difficulty: difficulty,
      question: generateFallbackQuestionText(topic, difficulty),
      options: generateFallbackOptions(topic),
      hints: [
        { level: 1, text: 'Überlege, was der Begriff bedeutet.' },
        { level: 2, text: 'Denke an die Definition.' },
        { level: 3, text: 'Schau dir die Antwortmöglichkeiten genau an.' }
      ],
      solution: 'Die richtige Antwort ergibt sich aus der Definition.',
      source: 'fallback',
      offline: true
    }

    questions.push(question)
  }

  return questions
}

/**
 * Generiert einen Fallback-Fragentext basierend auf einem Thema
 */
function generateFallbackQuestionText(topic, difficulty) {
  const templates = [
    `Welche Aussage über "${topic.unterthema}" ist korrekt?`,
    `Was beschreibt am besten das Konzept "${topic.unterthema}"?`,
    `Welche der folgenden Eigenschaften gehört zu "${topic.unterthema}"?`,
    `Im Bereich "${topic.thema}" - was ist charakteristisch für "${topic.unterthema}"?`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Generiert Fallback-Antwortoptionen
 */
function generateFallbackOptions(topic) {
  return [
    {
      id: 'A',
      text: `Eine grundlegende Eigenschaft von ${topic.unterthema}`,
      isCorrect: true
    },
    {
      id: 'B',
      text: 'Eine falsche Aussage, die plausibel klingt',
      isCorrect: false
    },
    {
      id: 'C',
      text: 'Eine weitere falsche Aussage',
      isCorrect: false
    },
    {
      id: 'D',
      text: 'Eine offensichtlich falsche Aussage',
      isCorrect: false
    }
  ]
}

/**
 * Speichert Daten für Offline-Nutzung in localStorage
 */
export function saveForOffline(key, data) {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.warn('[Offline Storage] Could not save data:', error)
  }
}

/**
 * Lädt Offline-Daten aus localStorage
 */
export function loadOfflineData(key, maxAge = 24 * 60 * 60 * 1000) {
  try {
    const stored = localStorage.getItem(`offline_${key}`)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Prüfe Alter
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(`offline_${key}`)
      return null
    }

    return parsed.data
  } catch (error) {
    console.warn('[Offline Storage] Could not load data:', error)
    return null
  }
}

/**
 * Registriert Event-Listener für Online/Offline-Status
 */
export function setupConnectivityListener(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('[Connectivity] Back online')
    onOnline?.()
  })

  window.addEventListener('offline', () => {
    console.log('[Connectivity] Gone offline')
    onOffline?.()
  })
}

export default {
  isOnline,
  fetchWithFallback,
  getLocalTopics,
  generateFallbackQuestions,
  saveForOffline,
  loadOfflineData,
  setupConnectivityListener
}
