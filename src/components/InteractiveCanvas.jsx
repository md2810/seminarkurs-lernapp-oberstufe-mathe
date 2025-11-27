/**
 * InteractiveCanvas Component
 * Interactive whiteboard with step-by-step solution visualizations
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
  Download,
  Palette,
  Circle,
  Square,
  LineSegment,
  TextT,
  Function as FunctionIcon,
  CaretRight,
  CaretLeft,
  MagicWand,
  BookOpen
} from '@phosphor-icons/react'
import './InteractiveCanvas.css'

// Drawing tools
const TOOLS = {
  PEN: 'pen',
  ERASER: 'eraser',
  LINE: 'line',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
  TEXT: 'text'
}

// Colors for drawing
const COLORS = [
  '#ffffff',
  '#f97316',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ef4444',
  '#fbbf24'
]

// Stroke widths
const STROKE_WIDTHS = [2, 4, 6, 8]

function InteractiveCanvas({ wrongQuestions = [], userSettings = {}, onOpenContext }) {
  const { currentUser } = useAuth()
  const { aiProvider, apiKeys } = useAppStore()
  const canvasRef = useRef(null)
  const contextRef = useRef(null)

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState(TOOLS.PEN)
  const [currentColor, setCurrentColor] = useState(COLORS[0])
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [paths, setPaths] = useState([])
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  // Solution visualization state
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [visualizationSteps, setVisualizationSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showVisualization, setShowVisualization] = useState(true)

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size to full available area
    const resizeCanvas = () => {
      const container = canvas.parentElement
      const dpr = window.devicePixelRatio || 1
      canvas.width = container.clientWidth * dpr
      canvas.height = container.clientHeight * dpr
      canvas.style.width = `${container.clientWidth}px`
      canvas.style.height = `${container.clientHeight}px`

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      contextRef.current = ctx

      // Redraw all paths
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Redraw canvas with all paths
  const redrawCanvas = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background grid
    drawGrid(ctx, canvas)

    // Draw all saved paths
    paths.forEach(path => {
      if (path.type === 'path') {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        path.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      } else if (path.type === 'line') {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        ctx.moveTo(path.start.x, path.start.y)
        ctx.lineTo(path.end.x, path.end.y)
        ctx.stroke()
      } else if (path.type === 'circle') {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        const radius = Math.sqrt(
          Math.pow(path.end.x - path.start.x, 2) +
          Math.pow(path.end.y - path.start.y, 2)
        )
        ctx.arc(path.start.x, path.start.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (path.type === 'rectangle') {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        ctx.rect(
          path.start.x,
          path.start.y,
          path.end.x - path.start.x,
          path.end.y - path.start.y
        )
        ctx.stroke()
      }
    })

    // Draw visualization elements if active
    if (showVisualization && visualizationSteps.length > 0 && currentStep < visualizationSteps.length) {
      drawVisualizationStep(ctx, visualizationSteps[currentStep])
    }
  }, [paths, visualizationSteps, currentStep, showVisualization])

  // Draw grid background
  const drawGrid = (ctx, canvas) => {
    const gridSize = 40
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  // Draw visualization step elements
  const drawVisualizationStep = (ctx, step) => {
    if (!step || !step.visualElements) return

    step.visualElements.forEach(element => {
      ctx.save()

      if (element.type === 'function') {
        // Draw mathematical function
        ctx.strokeStyle = element.color || '#22c55e'
        ctx.lineWidth = 3
        ctx.beginPath()

        const canvas = canvasRef.current
        const centerX = canvas.clientWidth / 2
        const centerY = canvas.clientHeight / 2
        const scale = 30

        // Simple function plotting (for demonstration)
        for (let px = 0; px < canvas.clientWidth; px++) {
          const x = (px - centerX) / scale
          // Parse simple functions like "x^2"
          let y = 0
          try {
            y = eval(element.definition.replace(/\^/g, '**').replace(/x/g, `(${x})`))
          } catch {
            y = 0
          }

          const screenY = centerY - (y * scale)
          if (px === 0) {
            ctx.moveTo(px, screenY)
          } else {
            ctx.lineTo(px, screenY)
          }
        }
        ctx.stroke()

        // Add label
        if (element.label) {
          ctx.fillStyle = element.color || '#22c55e'
          ctx.font = '14px Inter, sans-serif'
          ctx.fillText(element.label, centerX + 10, centerY - 60)
        }
      } else if (element.type === 'point') {
        ctx.fillStyle = element.color || '#f97316'
        ctx.beginPath()
        const canvas = canvasRef.current
        const x = canvas.clientWidth / 2 + (element.x || 0) * 30
        const y = canvas.clientHeight / 2 - (element.y || 0) * 30
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()

        if (element.label) {
          ctx.fillStyle = 'white'
          ctx.font = '12px Inter, sans-serif'
          ctx.fillText(element.label, x + 10, y - 10)
        }
      } else if (element.type === 'text') {
        ctx.fillStyle = element.color || 'white'
        ctx.font = `${element.size || 16}px Inter, sans-serif`
        ctx.fillText(element.text, element.x || 50, element.y || 50)
      } else if (element.type === 'arrow') {
        ctx.strokeStyle = element.color || '#3b82f6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(element.start?.x || 0, element.start?.y || 0)
        ctx.lineTo(element.end?.x || 100, element.end?.y || 100)
        ctx.stroke()

        // Arrow head
        const angle = Math.atan2(
          (element.end?.y || 0) - (element.start?.y || 0),
          (element.end?.x || 0) - (element.start?.x || 0)
        )
        const headSize = 10
        ctx.beginPath()
        ctx.moveTo(element.end?.x || 100, element.end?.y || 100)
        ctx.lineTo(
          (element.end?.x || 100) - headSize * Math.cos(angle - Math.PI / 6),
          (element.end?.y || 100) - headSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(element.end?.x || 100, element.end?.y || 100)
        ctx.lineTo(
          (element.end?.x || 100) - headSize * Math.cos(angle + Math.PI / 6),
          (element.end?.y || 100) - headSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      }

      ctx.restore()
    })
  }

  // Redraw when paths or visualization changes
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  // Start drawing
  const startDrawing = (e) => {
    const pos = getMousePos(e)
    setIsDrawing(true)

    if (currentTool === TOOLS.PEN) {
      setPaths(prev => [...prev, {
        type: 'path',
        color: currentColor,
        width: strokeWidth,
        points: [pos]
      }])
    } else if (currentTool === TOOLS.ERASER) {
      setPaths(prev => [...prev, {
        type: 'path',
        color: '#02040a', // Background color
        width: strokeWidth * 4,
        points: [pos]
      }])
    } else if ([TOOLS.LINE, TOOLS.CIRCLE, TOOLS.RECTANGLE].includes(currentTool)) {
      setPaths(prev => [...prev, {
        type: currentTool,
        color: currentColor,
        width: strokeWidth,
        start: pos,
        end: pos
      }])
    }

    // Save to undo stack
    setUndoStack(prev => [...prev, paths])
    setRedoStack([])
  }

  // Draw
  const draw = (e) => {
    if (!isDrawing) return

    const pos = getMousePos(e)

    if (currentTool === TOOLS.PEN || currentTool === TOOLS.ERASER) {
      setPaths(prev => {
        const newPaths = [...prev]
        const lastPath = newPaths[newPaths.length - 1]
        if (lastPath && lastPath.points) {
          lastPath.points.push(pos)
        }
        return newPaths
      })
    } else if ([TOOLS.LINE, TOOLS.CIRCLE, TOOLS.RECTANGLE].includes(currentTool)) {
      setPaths(prev => {
        const newPaths = [...prev]
        const lastPath = newPaths[newPaths.length - 1]
        if (lastPath) {
          lastPath.end = pos
        }
        return newPaths
      })
    }
  }

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return
    setRedoStack(prev => [...prev, paths])
    setPaths(undoStack[undoStack.length - 1])
    setUndoStack(prev => prev.slice(0, -1))
  }

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return
    setUndoStack(prev => [...prev, paths])
    setPaths(redoStack[redoStack.length - 1])
    setRedoStack(prev => prev.slice(0, -1))
  }

  // Clear canvas
  const handleClear = () => {
    setUndoStack(prev => [...prev, paths])
    setPaths([])
    setRedoStack([])
  }

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
          model: userSettings.selectedModel,
          question: question.question,
          solution: question.solution
        })
      })

      const data = await response.json()
      if (data.success && data.steps) {
        setVisualizationSteps(data.steps)
        setCurrentStep(0)
      }
    } catch (error) {
      console.error('Error generating visualization:', error)
    } finally {
      setIsGenerating(false)
    }
  }

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
    }, 2000) // 2 seconds per step

    return () => clearInterval(interval)
  }, [isPlaying, visualizationSteps.length])

  // Navigation
  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
    setIsPlaying(false)
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(visualizationSteps.length - 1, prev + 1))
    setIsPlaying(false)
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
                  </div>
                  <MagicWand weight="bold" className="visualize-icon" />
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
        {/* Toolbar */}
        <div className="canvas-toolbar">
          {/* Drawing tools */}
          <div className="tool-group">
            <button
              className={`tool-btn ${currentTool === TOOLS.PEN ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.PEN)}
              title="Stift"
            >
              <PencilSimple weight="bold" />
            </button>
            <button
              className={`tool-btn ${currentTool === TOOLS.ERASER ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.ERASER)}
              title="Radierer"
            >
              <Eraser weight="bold" />
            </button>
            <button
              className={`tool-btn ${currentTool === TOOLS.LINE ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.LINE)}
              title="Linie"
            >
              <LineSegment weight="bold" />
            </button>
            <button
              className={`tool-btn ${currentTool === TOOLS.CIRCLE ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.CIRCLE)}
              title="Kreis"
            >
              <Circle weight="bold" />
            </button>
            <button
              className={`tool-btn ${currentTool === TOOLS.RECTANGLE ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.RECTANGLE)}
              title="Rechteck"
            >
              <Square weight="bold" />
            </button>
          </div>

          {/* Colors */}
          <div className="tool-group colors">
            {COLORS.map(color => (
              <button
                key={color}
                className={`color-btn ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>

          {/* Stroke width */}
          <div className="tool-group strokes">
            {STROKE_WIDTHS.map(width => (
              <button
                key={width}
                className={`stroke-btn ${strokeWidth === width ? 'active' : ''}`}
                onClick={() => setStrokeWidth(width)}
              >
                <div className="stroke-preview" style={{ width: width * 2, height: width * 2 }} />
              </button>
            ))}
          </div>

          {/* Undo/Redo */}
          <div className="tool-group">
            <button
              className="tool-btn"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Rückgängig"
            >
              <ArrowCounterClockwise weight="bold" />
            </button>
            <button
              className="tool-btn"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Wiederherstellen"
            >
              <ArrowClockwise weight="bold" />
            </button>
            <button
              className="tool-btn danger"
              onClick={handleClear}
              title="Alles löschen"
            >
              <Trash weight="bold" />
            </button>
          </div>

          {/* Visualization toggle */}
          {visualizationSteps.length > 0 && (
            <div className="tool-group">
              <button
                className={`tool-btn ${showVisualization ? 'active' : ''}`}
                onClick={() => setShowVisualization(!showVisualization)}
                title={showVisualization ? 'Visualisierung ausblenden' : 'Visualisierung einblenden'}
              >
                {showVisualization ? <Eye weight="bold" /> : <EyeSlash weight="bold" />}
              </button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault()
              const touch = e.touches[0]
              startDrawing({ clientX: touch.clientX, clientY: touch.clientY })
            }}
            onTouchMove={(e) => {
              e.preventDefault()
              const touch = e.touches[0]
              draw({ clientX: touch.clientX, clientY: touch.clientY })
            }}
            onTouchEnd={stopDrawing}
          />

          {/* Loading overlay */}
          {isGenerating && (
            <div className="canvas-loading">
              <div className="loading-spinner" />
              <p>Generiere Visualisierung...</p>
            </div>
          )}
        </div>

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

        {/* Question detail panel */}
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
      </div>
    </div>
  )
}

export default InteractiveCanvas
