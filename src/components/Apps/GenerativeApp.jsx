/**
 * GenerativeApp Component (KI-Labor)
 * Generative Mini-Apps basierend auf Nutzer-Prompts
 *
 * Theoretische Grundlage: Konstruktionismus nach Papert
 * - Lernen durch Erschaffen von Artefakten
 * - Aktive Konstruktion von Wissen
 *
 * Flow:
 * 1. Nutzer beschreibt mathematisches Konzept
 * 2. KI generiert interaktive HTML/JS Simulation
 * 3. Simulation wird in sandboxed iframe gerendert
 * 4. Nutzer kann Code inspizieren und verstehen
 */

import React, { useState, memo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/useAppStore'
import {
  Flask,
  Sparkle,
  PaperPlaneTilt,
  CircleNotch,
  Code,
  Eye,
  ArrowCounterClockwise,
  Lightning,
  BookOpen,
  Warning,
  Check,
  X
} from '@phosphor-icons/react'
import './GenerativeApp.css'

// Example prompts for inspiration
const EXAMPLE_PROMPTS = [
  {
    title: 'Binomialverteilung',
    prompt: 'Erstelle eine Simulation zur Binomialverteilung mit n Versuchen und Erfolgswahrscheinlichkeit p. Zeige das Histogramm und berechne Erwartungswert und Standardabweichung.',
    category: 'Stochastik'
  },
  {
    title: 'Ableitung visualisieren',
    prompt: 'Visualisiere die Ableitung einer Funktion f(x). Zeige die Tangente an einem verschiebbaren Punkt und den Graphen von f\'(x).',
    category: 'Analysis'
  },
  {
    title: 'Vektoraddition',
    prompt: 'Erstelle eine interaktive Visualisierung der Vektoraddition in 2D. Die Vektoren sollen per Drag & Drop verschoben werden können.',
    category: 'Geometrie'
  },
  {
    title: 'Normalverteilung',
    prompt: 'Zeige die Normalverteilung mit einstellbarem Mittelwert und Standardabweichung. Markiere den Bereich innerhalb von 1, 2 und 3 Standardabweichungen.',
    category: 'Stochastik'
  }
]

// Sandbox iframe security attributes
const SANDBOX_ATTRS = 'allow-scripts allow-same-origin'

function GenerativeApp({ userSettings = {}, onOpenContext }) {
  const { aiProvider, apiKeys } = useAppStore()

  // State
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  // Refs
  const iframeRef = useRef(null)

  // Get API key
  const getApiKey = useCallback(() => {
    if (apiKeys[aiProvider]) return apiKeys[aiProvider]
    switch (aiProvider) {
      case 'claude': return userSettings.anthropicApiKey
      case 'gemini': return userSettings.geminiApiKey
      case 'openai': return userSettings.openaiApiKey
      default: return userSettings.anthropicApiKey
    }
  }, [aiProvider, apiKeys, userSettings])

  // Generate mini-app
  const generateMiniApp = async () => {
    const apiKey = getApiKey()

    if (!apiKey) {
      setError('Bitte hinterlege zuerst einen API-Key in den Einstellungen.')
      return
    }

    if (!prompt.trim()) {
      setError('Bitte beschreibe, was die Simulation zeigen soll.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedCode(null)

    try {
      const response = await fetch('/api/generate-mini-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: aiProvider,
          prompt: prompt.trim(),
          context: {
            gradeLevel: userSettings.gradeLevel || 'Klasse_11',
            courseType: userSettings.courseType || 'Leistungsfach'
          }
        })
      })

      const data = await response.json()

      if (data.success && data.html) {
        setGeneratedCode({
          html: data.html,
          title: data.title || 'Generierte Simulation',
          description: data.description || prompt
        })

        // Add to history
        setHistory(prev => [{
          id: Date.now(),
          prompt,
          title: data.title,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10))

        setPrompt('')
      } else {
        setError(data.error || 'Fehler bei der Generierung. Bitte versuche es erneut.')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError('Netzwerkfehler. Bitte überprüfe deine Internetverbindung.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Load example prompt
  const loadExample = (example) => {
    setPrompt(example.prompt)
    setError(null)
  }

  // Reset
  const reset = () => {
    setGeneratedCode(null)
    setShowCode(false)
    setError(null)
  }

  // Render generated app in iframe
  const renderInIframe = () => {
    if (!generatedCode?.html || !iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow.document

    doc.open()
    doc.write(generatedCode.html)
    doc.close()
  }

  // Effect to render iframe when code changes
  React.useEffect(() => {
    if (generatedCode?.html) {
      // Small delay to ensure iframe is mounted
      const timer = setTimeout(renderInIframe, 100)
      return () => clearTimeout(timer)
    }
  }, [generatedCode])

  return (
    <div className="generative-app">
      {/* Header */}
      <div className="generative-header">
        <div className="header-info">
          <div className="header-icon">
            <Flask weight="duotone" />
          </div>
          <div>
            <h2>KI-Labor</h2>
            <p>Erstelle interaktive Simulationen mit KI</p>
          </div>
        </div>

        {generatedCode && (
          <div className="header-actions">
            <button
              className={`action-btn ${showCode ? 'active' : ''}`}
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? <Eye weight="bold" /> : <Code weight="bold" />}
              {showCode ? 'Vorschau' : 'Code'}
            </button>
            <button className="action-btn" onClick={reset}>
              <ArrowCounterClockwise weight="bold" />
              Neu
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="generative-content">
        {!generatedCode ? (
          // Input view
          <div className="input-view">
            {/* Prompt input */}
            <div className="prompt-section">
              <label className="prompt-label">
                <Sparkle weight="fill" />
                Beschreibe deine Simulation
              </label>
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="z.B. Erstelle eine Visualisierung der Normalverteilung mit einstellbaren Parametern..."
                rows={4}
                disabled={isGenerating}
              />
              <div className="prompt-actions">
                <span className="char-count">{prompt.length} / 500</span>
                <button
                  className="generate-btn"
                  onClick={generateMiniApp}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <CircleNotch weight="bold" className="spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Lightning weight="fill" />
                      Generieren
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Warning weight="fill" />
                  <span>{error}</span>
                  <button onClick={() => setError(null)}>
                    <X weight="bold" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Example prompts */}
            <div className="examples-section">
              <h3>
                <BookOpen weight="duotone" />
                Beispiele zur Inspiration
              </h3>
              <div className="examples-grid">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <motion.button
                    key={index}
                    className="example-card"
                    onClick={() => loadExample(example)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="example-category">{example.category}</span>
                    <span className="example-title">{example.title}</span>
                    <span className="example-prompt">{example.prompt.substring(0, 60)}...</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="history-section">
                <h3>Letzte Generierungen</h3>
                <div className="history-list">
                  {history.map((item) => (
                    <div key={item.id} className="history-item">
                      <Check weight="bold" className="history-icon" />
                      <span className="history-title">{item.title || 'Simulation'}</span>
                      <span className="history-time">
                        {new Date(item.timestamp).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Result view
          <div className="result-view">
            <div className="result-header">
              <h3>{generatedCode.title}</h3>
              <p>{generatedCode.description}</p>
            </div>

            <AnimatePresence mode="wait">
              {showCode ? (
                <motion.div
                  key="code"
                  className="code-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <pre className="code-content">
                    <code>{generatedCode.html}</code>
                  </pre>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  className="preview-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <iframe
                    ref={iframeRef}
                    className="preview-iframe"
                    sandbox={SANDBOX_ATTRS}
                    title="Generierte Simulation"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(GenerativeApp)
