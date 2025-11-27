/**
 * InteractiveCanvas Component
 * Interactive whiteboard with GeoGebra-powered step-by-step solution visualizations
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../stores/useAppStore'
import LaTeX from './LaTeX'
import {
  PencilSimple,
  Eraser,
  ArrowCounterClockwise,
  ArrowClockwise,
  Trash,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Eye,
  EyeSlash,
  CaretRight,
  CaretLeft,
  MagicWand,
  BookOpen,
  Cube,
  Function as FunctionIcon,
  ArrowsOutCardinal
} from '@phosphor-icons/react'
import './InteractiveCanvas.css'

// GeoGebra App configuration
const GEOGEBRA_APP_ID = 'ggbApplet'

function InteractiveCanvas({ wrongQuestions = [], userSettings = {}, onOpenContext }) {
  const { currentUser } = useAuth()
  const { aiProvider, apiKeys, selectedModels } = useAppStore()
  const geogebraContainerRef = useRef(null)
  const geogebraAppRef = useRef(null)

  // Solution visualization state
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [visualizationSteps, setVisualizationSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [geogebraReady, setGeogebraReady] = useState(false)
  const [geogebraLoading, setGeogebraLoading] = useState(true)

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true)

  // Visualization cache for background generation
  const [visualizationCache, setVisualizationCache] = useState({})

  // Initialize GeoGebra
  useEffect(() => {
    // Load GeoGebra script if not already loaded
    if (!window.GGBApplet) {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.async = true
      script.onload = () => {
        initGeoGebra()
      }
      document.head.appendChild(script)
    } else {
      initGeoGebra()
    }

    return () => {
      // Cleanup
      if (geogebraAppRef.current) {
        try {
          geogebraAppRef.current.remove()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  const initGeoGebra = () => {
    if (!geogebraContainerRef.current || !window.GGBApplet) return

    const params = {
      appName: 'graphing',
      width: geogebraContainerRef.current.clientWidth,
      height: geogebraContainerRef.current.clientHeight,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      enableLabelDrags: false,
      enableShiftDragZoom: true,
      enableRightClick: false,
      showResetIcon: true,
      language: 'de',
      borderColor: '#1a1a1f',
      preventFocus: true,
      appletOnLoad: () => {
        setGeogebraReady(true)
        setGeogebraLoading(false)

        // Apply dark theme styling
        const api = geogebraAppRef.current?.getAPI?.()
        if (api) {
          api.setAxesVisible(true, true)
          api.setGridVisible(true)
          api.setCoordSystem(-10, 10, -10, 10)
        }
      }
    }

    const applet = new window.GGBApplet(params, true)
    applet.inject(geogebraContainerRef.current)
    geogebraAppRef.current = applet
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (geogebraAppRef.current && geogebraContainerRef.current) {
        const api = geogebraAppRef.current.getAPI?.()
        if (api) {
          api.setWidth(geogebraContainerRef.current.clientWidth)
          api.setHeight(geogebraContainerRef.current.clientHeight)
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [geogebraReady])

  // Get API key for current provider
  const getApiKey = useCallback(() => {
    if (apiKeys[aiProvider]) return apiKeys[aiProvider]
    switch (aiProvider) {
      case 'claude': return userSettings.anthropicApiKey
      case 'gemini': return userSettings.geminiApiKey
      case 'openai': return userSettings.openaiApiKey
      default: return userSettings.anthropicApiKey
    }
  }, [aiProvider, apiKeys, userSettings])

  // Generate visualization for a question
  const generateVisualization = async (question) => {
    // Check cache first
    if (visualizationCache[question.id]) {
      setVisualizationSteps(visualizationCache[question.id])
      setSelectedQuestion(question)
      setCurrentStep(0)
      applyVisualizationStep(visualizationCache[question.id][0])
      return
    }

    const apiKey = getApiKey()
    if (!apiKey) return

    setIsGenerating(true)
    setSelectedQuestion(question)

    try {
      const response = await fetch('/api/generate-solution-visualization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey,
          model: selectedModels[aiProvider] || userSettings.selectedModel,
          question: question.question,
          solution: question.solution
        })
      })

      const data = await response.json()
      if (data.success && data.steps) {
        // Enrich steps with GeoGebra commands
        const enrichedSteps = data.steps.map(step => ({
          ...step,
          geogebraCommands: generateGeoGebraCommands(step)
        }))

        setVisualizationSteps(enrichedSteps)
        setCurrentStep(0)

        // Cache the result
        setVisualizationCache(prev => ({
          ...prev,
          [question.id]: enrichedSteps
        }))

        // Apply first step
        if (enrichedSteps.length > 0) {
          applyVisualizationStep(enrichedSteps[0])
        }
      }
    } catch (error) {
      console.error('Error generating visualization:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate GeoGebra commands from visualization step
  const generateGeoGebraCommands = (step) => {
    if (!step.visualElements) return []

    const commands = []

    step.visualElements.forEach((element, index) => {
      const name = `elem_${index}`
      const color = element.color || '#22c55e'

      switch (element.type) {
        case 'function':
          // Parse function definition and create GeoGebra command
          const funcDef = element.definition
            ?.replace(/\^/g, '^')
            ?.replace(/\*/g, '*') || 'x^2'
          commands.push({
            type: 'function',
            command: `f_${index}(x) = ${funcDef}`,
            color,
            label: element.label
          })
          break

        case 'point':
          commands.push({
            type: 'point',
            command: `P_${index} = (${element.x || 0}, ${element.y || 0})`,
            color,
            label: element.label || `P${index}`
          })
          break

        case 'line':
          if (element.equation) {
            commands.push({
              type: 'line',
              command: element.equation,
              color,
              label: element.label
            })
          } else if (element.start && element.end) {
            commands.push({
              type: 'segment',
              command: `Segment((${element.start.x}, ${element.start.y}), (${element.end.x}, ${element.end.y}))`,
              color,
              label: element.label
            })
          }
          break

        case 'area':
          if (element.function && element.from !== undefined && element.to !== undefined) {
            commands.push({
              type: 'integral',
              command: `Integral(${element.function}, ${element.from}, ${element.to})`,
              color,
              label: element.label
            })
          }
          break

        case 'text':
          commands.push({
            type: 'text',
            command: `Text("${element.text || ''}", (${element.x || 0}, ${element.y || 0}))`,
            color
          })
          break

        case 'circle':
          if (element.center && element.radius) {
            commands.push({
              type: 'circle',
              command: `Circle((${element.center.x}, ${element.center.y}), ${element.radius})`,
              color,
              label: element.label
            })
          }
          break

        case 'vector':
        case 'arrow':
          if (element.start && element.end) {
            commands.push({
              type: 'vector',
              command: `Vector((${element.start.x || 0}, ${element.start.y || 0}), (${element.end.x || 0}, ${element.end.y || 0}))`,
              color,
              label: element.label
            })
          }
          break
      }
    })

    return commands
  }

  // Apply visualization step to GeoGebra
  const applyVisualizationStep = (step) => {
    if (!geogebraReady || !geogebraAppRef.current) return

    const api = geogebraAppRef.current.getAPI?.()
    if (!api) return

    // Clear previous objects (keep axes and grid)
    api.reset()
    api.setAxesVisible(true, true)
    api.setGridVisible(true)

    if (!step?.geogebraCommands) return

    // Apply each command
    step.geogebraCommands.forEach((cmd, index) => {
      try {
        const result = api.evalCommand(cmd.command)
        if (result) {
          // Set color
          const objName = api.getObjectName(api.getObjectNumber() - 1)
          if (objName && cmd.color) {
            // Convert hex to RGB
            const hex = cmd.color.replace('#', '')
            const r = parseInt(hex.substr(0, 2), 16)
            const g = parseInt(hex.substr(2, 2), 16)
            const b = parseInt(hex.substr(4, 2), 16)
            api.setColor(objName, r, g, b)

            // Set line thickness for functions
            if (cmd.type === 'function' || cmd.type === 'line') {
              api.setLineThickness(objName, 3)
            }

            // Set point size
            if (cmd.type === 'point') {
              api.setPointSize(objName, 5)
            }
          }
        }
      } catch (e) {
        console.warn('GeoGebra command error:', cmd.command, e)
      }
    })

    // Auto-zoom to show all objects
    api.setCoordSystem(-10, 10, -10, 10)
  }

  // Apply step when current step changes
  useEffect(() => {
    if (visualizationSteps.length > 0 && currentStep < visualizationSteps.length) {
      applyVisualizationStep(visualizationSteps[currentStep])
    }
  }, [currentStep, visualizationSteps, geogebraReady])

  // Play/pause visualization
  useEffect(() => {
    if (!isPlaying || visualizationSteps.length === 0) return

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= visualizationSteps.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 3000) // 3 seconds per step

    return () => clearInterval(interval)
  }, [isPlaying, visualizationSteps.length])

  // Background pre-generation for other wrong questions
  useEffect(() => {
    if (wrongQuestions.length === 0) return

    // Pre-generate visualization for the first question if not selected
    const firstQuestion = wrongQuestions[0]
    if (!selectedQuestion && !visualizationCache[firstQuestion.id] && !isGenerating) {
      // Delay to not interfere with initial load
      const timeout = setTimeout(() => {
        if (!visualizationCache[firstQuestion.id]) {
          generateVisualization(firstQuestion)
        }
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [wrongQuestions, selectedQuestion, visualizationCache, isGenerating])

  // Navigation
  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
    setIsPlaying(false)
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(visualizationSteps.length - 1, prev + 1))
    setIsPlaying(false)
  }

  // Clear visualization
  const clearVisualization = () => {
    if (geogebraReady && geogebraAppRef.current) {
      const api = geogebraAppRef.current.getAPI?.()
      if (api) {
        api.reset()
        api.setAxesVisible(true, true)
        api.setGridVisible(true)
      }
    }
    setVisualizationSteps([])
    setCurrentStep(0)
  }

  // No wrong questions
  if (wrongQuestions.length === 0) {
    return (
      <div className="interactive-canvas">
        <div className="canvas-empty">
          <div className="empty-icon">
            <BookOpen weight="duotone" size={64} />
          </div>
          <h2>Keine Aufgaben zur Visualisierung</h2>
          <p>
            Beantworte Fragen im Feed. Falsch beantwortete Fragen erscheinen
            hier mit Schritt-für-Schritt Erklärungen.
          </p>
          <motion.button
            className="btn-primary"
            onClick={onOpenContext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Zum Lernen wechseln
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="interactive-canvas">
      {/* Sidebar with wrong questions */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            className="canvas-sidebar"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
          >
            <div className="sidebar-header">
              <h3>Zu üben</h3>
              <span className="question-count">{wrongQuestions.length}</span>
            </div>

            <div className="questions-list">
              {wrongQuestions.map((q, index) => (
                <motion.button
                  key={q.id || index}
                  className={`question-item ${selectedQuestion?.id === q.id ? 'active' : ''}`}
                  onClick={() => generateVisualization(q)}
                  whileHover={{ x: 4 }}
                  disabled={isGenerating}
                >
                  <span className="question-number">{index + 1}</span>
                  <div className="question-preview">
                    <span className="question-topic">{q.topic}</span>
                    <span className="question-text-preview">
                      {q.question?.substring(0, 50)}...
                    </span>
                    {q.skipped && (
                      <span className="skipped-badge">Übersprungen</span>
                    )}
                  </div>
                  {visualizationCache[q.id] ? (
                    <Cube weight="fill" className="cached-icon" />
                  ) : (
                    <MagicWand weight="bold" className="visualize-icon" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle sidebar */}
      <button
        className="sidebar-toggle"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <CaretLeft weight="bold" /> : <CaretRight weight="bold" />}
      </button>

      {/* Main canvas area */}
      <div className="canvas-main">
        {/* GeoGebra toolbar */}
        <div className="canvas-toolbar">
          <div className="tool-group geogebra-label">
            <FunctionIcon weight="bold" />
            <span>Powered by GeoGebra</span>
          </div>

          <div className="tool-group">
            <button
              className="tool-btn"
              onClick={clearVisualization}
              title="Visualisierung zurücksetzen"
            >
              <Trash weight="bold" />
            </button>
            <button
              className="tool-btn"
              onClick={() => {
                const api = geogebraAppRef.current?.getAPI?.()
                if (api) api.setCoordSystem(-10, 10, -10, 10)
              }}
              title="Ansicht zurücksetzen"
            >
              <ArrowsOutCardinal weight="bold" />
            </button>
          </div>
        </div>

        {/* GeoGebra Container */}
        <div className="geogebra-container" ref={geogebraContainerRef}>
          {geogebraLoading && (
            <div className="geogebra-loading">
              <div className="loading-spinner" />
              <p>GeoGebra wird geladen...</p>
            </div>
          )}
        </div>

        {/* Loading overlay for visualization generation */}
        {isGenerating && (
          <div className="canvas-loading">
            <div className="loading-spinner" />
            <p>Generiere Visualisierung...</p>
          </div>
        )}

        {/* Visualization controls */}
        {visualizationSteps.length > 0 && (
          <div className="visualization-panel">
            <div className="step-info">
              <h4>{visualizationSteps[currentStep]?.title || `Schritt ${currentStep + 1}`}</h4>
              <p>{visualizationSteps[currentStep]?.description}</p>
              {visualizationSteps[currentStep]?.explanation && (
                <div className="step-explanation">
                  <LaTeX>{visualizationSteps[currentStep].explanation}</LaTeX>
                </div>
              )}
            </div>

            <div className="step-controls">
              <button onClick={prevStep} disabled={currentStep === 0}>
                <SkipBack weight="bold" />
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause weight="bold" /> : <Play weight="bold" />}
              </button>
              <button onClick={nextStep} disabled={currentStep >= visualizationSteps.length - 1}>
                <SkipForward weight="bold" />
              </button>

              <div className="step-progress">
                <span>{currentStep + 1} / {visualizationSteps.length}</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((currentStep + 1) / visualizationSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question detail panel when no visualization */}
        {selectedQuestion && !visualizationSteps.length && !isGenerating && (
          <div className="question-detail">
            <h4>Ausgewählte Aufgabe</h4>
            <div className="question-content">
              <LaTeX>{selectedQuestion.question}</LaTeX>
            </div>
            {selectedQuestion.solution && (
              <div className="solution-content">
                <strong>Lösung:</strong>
                <LaTeX>{selectedQuestion.solution}</LaTeX>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no question selected */}
        {!selectedQuestion && !isGenerating && (
          <div className="canvas-hint">
            <MagicWand weight="duotone" size={48} />
            <p>Wähle eine Aufgabe aus der Liste, um eine Visualisierung zu generieren</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InteractiveCanvas
