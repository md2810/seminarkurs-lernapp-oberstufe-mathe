/**
 * InteractiveCanvas Component
 * Collaborative AI Canvas with GeoGebra integration and drawing capabilities
 *
 * Features:
 * - GeoGebra for mathematical visualizations
 * - Drawing layer for user annotations
 * - Lasso tool to select areas and ask AI questions
 * - AI can respond with drawings AND GeoGebra commands
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../stores/useAppStore'
import { GeoGebraErrorBoundary } from './ErrorBoundary'
import LaTeX from './LaTeX'
import {
  PencilSimple,
  Eraser,
  ArrowCounterClockwise,
  ArrowClockwise,
  Trash,
  X,
  CaretRight,
  CaretLeft,
  MagicWand,
  BookOpen,
  Cube,
  Function as FunctionIcon,
  ArrowsOutCardinal,
  Lasso,
  PaperPlaneTilt,
  CircleNotch,
  Sparkle,
  ChatCircle,
  LineSegment,
  Circle as CircleIcon,
  TextT,
  Check
} from '@phosphor-icons/react'
import './InteractiveCanvas.css'

// GeoGebra App configuration
const GEOGEBRA_CONTAINER_ID = 'geogebra-applet-container'

/**
 * Sanitize and validate GeoGebra commands before execution
 * Prevents injection attacks and fixes common syntax issues
 */
function sanitizeGeoGebraCommand(command) {
  if (!command || typeof command !== 'string') return null

  let sanitized = command.trim()

  // Remove potentially dangerous content
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/Function\(/gi, '')
    .replace(/document\./gi, '')
    .replace(/window\./gi, '')

  // Fix common syntax issues
  // German decimal comma to point
  sanitized = sanitized.replace(/(\d+),(\d+)/g, '$1.$2')

  // Fix unbalanced parentheses (simple cases)
  const openCount = (sanitized.match(/\(/g) || []).length
  const closeCount = (sanitized.match(/\)/g) || []).length
  if (openCount > closeCount) {
    sanitized += ')'.repeat(openCount - closeCount)
  }

  // Limit command length to prevent abuse
  if (sanitized.length > 500) {
    console.warn('[GeoGebra] Command too long, truncating')
    sanitized = sanitized.substring(0, 500)
  }

  return sanitized
}

/**
 * Execute a GeoGebra command safely with try-catch
 */
function safeEvalCommand(api, command, color) {
  const sanitized = sanitizeGeoGebraCommand(command)
  if (!sanitized) {
    console.warn('[GeoGebra] Invalid command skipped:', command)
    return false
  }

  try {
    const result = api.evalCommand(sanitized)

    if (result === false) {
      console.warn('[GeoGebra] Command rejected:', sanitized)
      return false
    }

    // Apply color if specified
    if (color) {
      try {
        const objName = api.getObjectName(api.getObjectNumber() - 1)
        if (objName) {
          const hex = color.replace('#', '')
          const r = parseInt(hex.substr(0, 2), 16)
          const g = parseInt(hex.substr(2, 2), 16)
          const b = parseInt(hex.substr(4, 2), 16)
          api.setColor(objName, r, g, b)
          api.setLineThickness(objName, 3)
        }
      } catch (colorError) {
        console.warn('[GeoGebra] Could not apply color:', colorError)
      }
    }

    return true
  } catch (error) {
    console.error('[GeoGebra] Command execution error:', sanitized, error)
    return false
  }
}

// Drawing tools
const TOOLS = {
  PEN: 'pen',
  ERASER: 'eraser',
  LASSO: 'lasso',
  LINE: 'line',
  CIRCLE: 'circle',
  TEXT: 'text'
}

// Color palette
const COLORS = [
  '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

function InteractiveCanvas({ wrongQuestions = [], userSettings = {}, onOpenContext }) {
  const { currentUser } = useAuth()
  const { aiProvider, apiKeys, selectedModels } = useAppStore()

  // Refs
  const geogebraWrapperRef = useRef(null)
  const geogebraAppRef = useRef(null)
  const geogebraInitialized = useRef(false)
  const canvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)

  // GeoGebra state
  const [geogebraReady, setGeogebraReady] = useState(false)
  const [geogebraLoading, setGeogebraLoading] = useState(true)

  // Drawing state
  const [currentTool, setCurrentTool] = useState(TOOLS.PEN)
  const [currentColor, setCurrentColor] = useState('#22c55e')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [paths, setPaths] = useState([])
  const [currentPath, setCurrentPath] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Lasso state
  const [lassoPath, setLassoPath] = useState([])
  const [lassoSelection, setLassoSelection] = useState(null)
  const [showAIPanel, setShowAIPanel] = useState(false)

  // AI state
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiDrawings, setAiDrawings] = useState([])

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  // Chat history
  const [chatHistory, setChatHistory] = useState([])

  // Initialize GeoGebra
  useEffect(() => {
    if (geogebraInitialized.current) return
    geogebraInitialized.current = true

    const existingScript = document.querySelector('script[src*="geogebra.org/apps/deployggb.js"]')

    if (!window.GGBApplet && !existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.async = true
      script.onload = () => initGeoGebra()
      document.head.appendChild(script)
    } else if (window.GGBApplet) {
      initGeoGebra()
    } else if (existingScript) {
      existingScript.addEventListener('load', () => initGeoGebra())
    }

    return () => {
      const container = document.getElementById(GEOGEBRA_CONTAINER_ID)
      if (container) container.remove()
      geogebraAppRef.current = null
      geogebraInitialized.current = false
    }
  }, [])

  const initGeoGebra = () => {
    if (!geogebraWrapperRef.current || !window.GGBApplet) return

    const existingContainer = document.getElementById(GEOGEBRA_CONTAINER_ID)
    if (existingContainer) existingContainer.remove()

    const container = document.createElement('div')
    container.id = GEOGEBRA_CONTAINER_ID
    container.style.width = '100%'
    container.style.height = '100%'
    geogebraWrapperRef.current.appendChild(container)

    const params = {
      appName: 'graphing',
      width: geogebraWrapperRef.current.clientWidth || 800,
      height: geogebraWrapperRef.current.clientHeight || 600,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      enableLabelDrags: false,
      enableShiftDragZoom: true,
      enableRightClick: false,
      showResetIcon: false,
      language: 'de',
      borderColor: 'transparent',
      preventFocus: true,
      appletOnLoad: () => {
        setGeogebraReady(true)
        setGeogebraLoading(false)
        const api = geogebraAppRef.current?.getAPI?.()
        if (api) {
          api.setAxesVisible(true, true)
          api.setGridVisible(true)
          api.setCoordSystem(-10, 10, -10, 10)
        }
      }
    }

    const applet = new window.GGBApplet(params, true)
    applet.inject(GEOGEBRA_CONTAINER_ID)
    geogebraAppRef.current = applet
  }

  // Setup drawing canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayCanvasRef.current
    if (!canvas || !overlay) return

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      overlay.width = rect.width
      overlay.height = rect.height
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [paths, aiDrawings])

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw user paths
    paths.forEach(path => {
      if (path.tool === TOOLS.ERASER) {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.strokeStyle = path.color
      ctx.lineWidth = path.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (path.type === 'freehand' && path.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(path.points[0].x, path.points[0].y)
        path.points.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.stroke()
      } else if (path.type === 'line' && path.start && path.end) {
        ctx.beginPath()
        ctx.moveTo(path.start.x, path.start.y)
        ctx.lineTo(path.end.x, path.end.y)
        ctx.stroke()
      } else if (path.type === 'circle' && path.center && path.radius) {
        ctx.beginPath()
        ctx.arc(path.center.x, path.center.y, path.radius, 0, Math.PI * 2)
        ctx.stroke()
      } else if (path.type === 'text' && path.text) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.font = `${path.fontSize || 16}px Inter, sans-serif`
        ctx.fillStyle = path.color
        ctx.fillText(path.text, path.x, path.y)
      }
    })

    ctx.globalCompositeOperation = 'source-over'

    // Draw AI drawings
    aiDrawings.forEach(drawing => {
      ctx.strokeStyle = drawing.color || '#22c55e'
      ctx.fillStyle = drawing.color || '#22c55e'
      ctx.lineWidth = drawing.strokeWidth || 3
      ctx.lineCap = 'round'

      switch (drawing.type) {
        case 'line':
          ctx.beginPath()
          ctx.moveTo(drawing.start.x, drawing.start.y)
          ctx.lineTo(drawing.end.x, drawing.end.y)
          ctx.stroke()
          break
        case 'arrow':
          drawArrow(ctx, drawing.start, drawing.end, drawing.color || '#22c55e')
          break
        case 'circle':
          ctx.beginPath()
          ctx.arc(drawing.center.x, drawing.center.y, drawing.radius, 0, Math.PI * 2)
          ctx.stroke()
          break
        case 'highlight':
          ctx.fillStyle = (drawing.color || '#22c55e') + '30'
          ctx.fillRect(drawing.x, drawing.y, drawing.width, drawing.height)
          break
        case 'text':
        case 'equation':
          ctx.font = `${drawing.fontSize || 16}px Inter, sans-serif`
          ctx.fillStyle = drawing.color || '#22c55e'
          ctx.fillText(drawing.text, drawing.x, drawing.y)
          break
      }
    })
  }, [paths, aiDrawings])

  // Draw arrow helper
  const drawArrow = (ctx, start, end, color) => {
    const headLength = 12
    const angle = Math.atan2(end.y - start.y, end.x - start.x)

    ctx.strokeStyle = color
    ctx.fillStyle = color

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(end.x, end.y)
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Get coordinates from event
  const getCoords = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  // Drawing handlers
  const handlePointerDown = (e) => {
    const coords = getCoords(e)
    setIsDrawing(true)

    if (currentTool === TOOLS.LASSO) {
      setLassoPath([coords])
      setLassoSelection(null)
      setShowAIPanel(false)
    } else if (currentTool === TOOLS.TEXT) {
      const text = prompt('Text eingeben:')
      if (text) {
        const newPath = {
          type: 'text',
          text,
          x: coords.x,
          y: coords.y,
          color: currentColor,
          fontSize: strokeWidth * 5
        }
        setPaths(prev => [...prev, newPath])
        saveToHistory([...paths, newPath])
      }
      setIsDrawing(false)
    } else {
      setCurrentPath({
        type: currentTool === TOOLS.LINE ? 'line' :
              currentTool === TOOLS.CIRCLE ? 'circle' : 'freehand',
        tool: currentTool,
        color: currentTool === TOOLS.ERASER ? '#000' : currentColor,
        width: currentTool === TOOLS.ERASER ? strokeWidth * 3 : strokeWidth,
        points: [coords],
        start: coords
      })
    }
  }

  const handlePointerMove = (e) => {
    if (!isDrawing) return
    const coords = getCoords(e)

    if (currentTool === TOOLS.LASSO) {
      setLassoPath(prev => [...prev, coords])
      drawLassoOverlay()
    } else if (currentPath) {
      if (currentTool === TOOLS.LINE) {
        setCurrentPath(prev => ({ ...prev, end: coords }))
      } else if (currentTool === TOOLS.CIRCLE) {
        const dx = coords.x - currentPath.start.x
        const dy = coords.y - currentPath.start.y
        const radius = Math.sqrt(dx * dx + dy * dy)
        setCurrentPath(prev => ({
          ...prev,
          center: prev.start,
          radius
        }))
      } else {
        setCurrentPath(prev => ({
          ...prev,
          points: [...prev.points, coords]
        }))
      }
      drawCurrentPath()
    }
  }

  const handlePointerUp = () => {
    setIsDrawing(false)

    if (currentTool === TOOLS.LASSO && lassoPath.length > 2) {
      completeLassoSelection()
    } else if (currentPath) {
      const newPaths = [...paths, currentPath]
      setPaths(newPaths)
      saveToHistory(newPaths)
      setCurrentPath(null)
      clearOverlay()
    }
  }

  // Draw current path preview
  const drawCurrentPath = () => {
    const overlay = overlayCanvasRef.current
    if (!overlay || !currentPath) return
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    ctx.strokeStyle = currentPath.color
    ctx.lineWidth = currentPath.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (currentPath.type === 'freehand') {
      ctx.beginPath()
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y)
      currentPath.points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    } else if (currentPath.type === 'line' && currentPath.end) {
      ctx.beginPath()
      ctx.moveTo(currentPath.start.x, currentPath.start.y)
      ctx.lineTo(currentPath.end.x, currentPath.end.y)
      ctx.stroke()
    } else if (currentPath.type === 'circle' && currentPath.radius) {
      ctx.beginPath()
      ctx.arc(currentPath.center.x, currentPath.center.y, currentPath.radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // Draw lasso overlay
  const drawLassoOverlay = () => {
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    if (lassoPath.length < 2) return

    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    ctx.moveTo(lassoPath[0].x, lassoPath[0].y)
    lassoPath.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Complete lasso selection
  const completeLassoSelection = () => {
    if (lassoPath.length < 3) return

    // Calculate bounding box
    const xs = lassoPath.map(p => p.x)
    const ys = lassoPath.map(p => p.y)
    const bounds = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    }

    setLassoSelection(bounds)
    setShowAIPanel(true)
    drawSelectionHighlight(bounds)
  }

  // Draw selection highlight
  const drawSelectionHighlight = (bounds) => {
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.setLineDash([])
  }

  const clearOverlay = () => {
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)
  }

  // History management
  const saveToHistory = (newPaths) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newPaths)
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setPaths(history[historyIndex - 1])
    } else if (historyIndex === 0) {
      setHistoryIndex(-1)
      setPaths([])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setPaths(history[historyIndex + 1])
    }
  }

  // Clear all
  const clearAll = () => {
    setPaths([])
    setAiDrawings([])
    setHistory([])
    setHistoryIndex(-1)
    clearOverlay()

    // Also reset GeoGebra
    const api = geogebraAppRef.current?.getAPI?.()
    if (api) {
      api.reset()
      api.setAxesVisible(true, true)
      api.setGridVisible(true)
    }
  }

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

  // Send to AI
  const sendToAI = async () => {
    const apiKey = getApiKey()
    if (!apiKey || !aiQuestion.trim()) return

    setIsAILoading(true)
    setAiResponse(null)

    try {
      // Capture current canvas state
      const canvas = canvasRef.current
      const geogebraContainer = document.getElementById(GEOGEBRA_CONTAINER_ID)

      // Create combined image
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')

      // Draw GeoGebra screenshot if available
      if (geogebraContainer) {
        const iframe = geogebraContainer.querySelector('iframe')
        // Note: Can't capture iframe content due to CORS, but we send GeoGebra state
      }

      // Draw user canvas
      tempCtx.drawImage(canvas, 0, 0)

      const imageData = tempCanvas.toDataURL('image/png')

      // Get current GeoGebra state
      let geogebraState = null
      const api = geogebraAppRef.current?.getAPI?.()
      if (api) {
        geogebraState = {
          xml: api.getXML(),
          objects: []
        }
        const objCount = api.getObjectNumber()
        for (let i = 0; i < objCount; i++) {
          const name = api.getObjectName(i)
          geogebraState.objects.push({
            name,
            type: api.getObjectType(name),
            value: api.getValueString(name)
          })
        }
      }

      const response = await fetch('/api/collaborative-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: aiProvider,
          question: aiQuestion,
          imageData,
          geogebraState,
          selectionBounds: lassoSelection,
          context: selectedQuestion ? {
            question: selectedQuestion.question,
            solution: selectedQuestion.solution
          } : null,
          chatHistory: chatHistory.slice(-5)
        })
      })

      const data = await response.json()

      if (data.success) {
        setAiResponse(data)

        // Add to chat history
        setChatHistory(prev => [...prev, {
          role: 'user',
          content: aiQuestion
        }, {
          role: 'assistant',
          content: data.explanation
        }])

        // Apply AI drawings to canvas
        if (data.drawings && data.drawings.length > 0) {
          // Offset drawings relative to selection
          const offsetDrawings = data.drawings.map(d => {
            const offsetX = lassoSelection ? lassoSelection.x : 0
            const offsetY = lassoSelection ? lassoSelection.y + lassoSelection.height + 20 : 100

            switch (d.type) {
              case 'line':
              case 'arrow':
                return {
                  ...d,
                  start: { x: d.start.x + offsetX, y: d.start.y + offsetY },
                  end: { x: d.end.x + offsetX, y: d.end.y + offsetY }
                }
              case 'circle':
                return {
                  ...d,
                  center: { x: d.center.x + offsetX, y: d.center.y + offsetY }
                }
              case 'text':
              case 'equation':
              case 'highlight':
                return {
                  ...d,
                  x: d.x + offsetX,
                  y: d.y + offsetY
                }
              default:
                return d
            }
          })
          setAiDrawings(prev => [...prev, ...offsetDrawings])
        }

        // Execute GeoGebra commands safely
        if (data.geogebraCommands && data.geogebraCommands.length > 0 && api) {
          let successCount = 0
          let failCount = 0

          data.geogebraCommands.forEach(cmd => {
            const success = safeEvalCommand(api, cmd.command, cmd.color)
            if (success) {
              successCount++
            } else {
              failCount++
            }
          })

          if (failCount > 0) {
            console.warn(`[GeoGebra] ${failCount}/${data.geogebraCommands.length} commands failed`)
          }
        }
      } else {
        setAiResponse({ error: data.error || 'Fehler bei der KI-Analyse' })
      }
    } catch (error) {
      console.error('AI error:', error)
      setAiResponse({ error: 'Netzwerkfehler. Bitte versuche es erneut.' })
    } finally {
      setIsAILoading(false)
      setAiQuestion('')
    }
  }

  // Load question into canvas
  const loadQuestion = (question) => {
    setSelectedQuestion(question)
    clearAll()

    // Add question text to chat
    setChatHistory([{
      role: 'system',
      content: `Aufgabe: ${question.question}`
    }])
  }

  // Close AI panel
  const closeAIPanel = () => {
    setShowAIPanel(false)
    setLassoSelection(null)
    clearOverlay()
  }

  return (
    <div className="interactive-canvas collaborative">
      {/* Sidebar with questions */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            className="canvas-sidebar"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
          >
            <div className="sidebar-header">
              <h3>Aufgaben</h3>
              <span className="question-count">{wrongQuestions.length}</span>
            </div>

            {wrongQuestions.length === 0 ? (
              <div className="sidebar-empty">
                <BookOpen weight="duotone" size={32} />
                <p>Keine Aufgaben verfügbar</p>
                <button onClick={onOpenContext} className="btn-sm">
                  Fragen generieren
                </button>
              </div>
            ) : (
              <div className="questions-list">
                {wrongQuestions.map((q, index) => (
                  <motion.button
                    key={q.id || index}
                    className={`question-item ${selectedQuestion?.id === q.id ? 'active' : ''}`}
                    onClick={() => loadQuestion(q)}
                    whileHover={{ x: 4 }}
                  >
                    <span className="question-number">{index + 1}</span>
                    <div className="question-preview">
                      <span className="question-topic">{q.topic}</span>
                      <span className="question-text-preview">
                        {q.question?.substring(0, 40)}...
                      </span>
                    </div>
                    <MagicWand weight="bold" className="visualize-icon" />
                  </motion.button>
                ))}
              </div>
            )}
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
      <div className="canvas-main collaborative-main">
        {/* Toolbar */}
        <div className="canvas-toolbar collaborative-toolbar">
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
              title="Radiergummi"
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
              <CircleIcon weight="bold" />
            </button>
            <button
              className={`tool-btn ${currentTool === TOOLS.TEXT ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.TEXT)}
              title="Text"
            >
              <TextT weight="bold" />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Lasso/AI tool */}
          <div className="tool-group">
            <button
              className={`tool-btn lasso-btn ${currentTool === TOOLS.LASSO ? 'active' : ''}`}
              onClick={() => setCurrentTool(TOOLS.LASSO)}
              title="Lasso - Bereich auswählen und KI fragen"
            >
              <Lasso weight="bold" />
              <Sparkle weight="fill" size={12} className="ai-sparkle" />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Color picker */}
          <div className="tool-group color-group">
            {COLORS.slice(0, 5).map(color => (
              <button
                key={color}
                className={`color-btn ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>

          <div className="toolbar-divider" />

          {/* Actions */}
          <div className="tool-group">
            <button
              className="tool-btn"
              onClick={undo}
              disabled={historyIndex < 0}
              title="Rückgängig"
            >
              <ArrowCounterClockwise weight="bold" />
            </button>
            <button
              className="tool-btn"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Wiederholen"
            >
              <ArrowClockwise weight="bold" />
            </button>
            <button
              className="tool-btn danger"
              onClick={clearAll}
              title="Alles löschen"
            >
              <Trash weight="bold" />
            </button>
          </div>

          <div className="tool-spacer" />

          {/* GeoGebra controls */}
          <div className="tool-group geogebra-label">
            <FunctionIcon weight="bold" />
            <span>GeoGebra</span>
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

        {/* Canvas layers */}
        <div className="canvas-layers">
          {/* GeoGebra layer (bottom) - wrapped in error boundary */}
          <GeoGebraErrorBoundary>
            <div className="geogebra-layer" ref={geogebraWrapperRef}>
              {geogebraLoading && (
                <div className="geogebra-loading">
                  <div className="loading-spinner" />
                  <p>GeoGebra wird geladen...</p>
                </div>
              )}
            </div>
          </GeoGebraErrorBoundary>

          {/* Drawing canvas layer (middle) */}
          <canvas
            ref={canvasRef}
            className="drawing-layer"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />

          {/* Overlay canvas for previews (top) */}
          <canvas
            ref={overlayCanvasRef}
            className="overlay-layer"
            style={{ pointerEvents: 'none' }}
          />
        </div>

        {/* Lasso hint */}
        <AnimatePresence>
          {currentTool === TOOLS.LASSO && !lassoSelection && (
            <motion.div
              className="lasso-hint"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Lasso weight="bold" />
              <span>Zeichne einen Bereich um die KI zu fragen</span>
              <Sparkle weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Panel */}
        <AnimatePresence>
          {showAIPanel && lassoSelection && (
            <motion.div
              className="ai-panel collaborative-ai-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                left: Math.min(lassoSelection.x + lassoSelection.width + 20, window.innerWidth - 380),
                top: Math.max(lassoSelection.y, 100)
              }}
            >
              <div className="ai-panel-header">
                <Sparkle weight="fill" />
                <span>KI-Assistent</span>
                <button className="close-btn" onClick={closeAIPanel}>
                  <X weight="bold" />
                </button>
              </div>

              <div className="ai-panel-content">
                {/* Chat history */}
                {chatHistory.length > 0 && (
                  <div className="chat-history">
                    {chatHistory.slice(-4).map((msg, i) => (
                      <div key={i} className={`chat-message ${msg.role}`}>
                        {msg.role === 'assistant' ? (
                          <LaTeX>{msg.content}</LaTeX>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Response */}
                {aiResponse && (
                  <div className={`ai-response ${aiResponse.error ? 'error' : ''}`}>
                    {aiResponse.error ? (
                      <p>{aiResponse.error}</p>
                    ) : (
                      <>
                        <div className="response-text">
                          <LaTeX>{aiResponse.explanation}</LaTeX>
                        </div>
                        {aiResponse.drawings?.length > 0 && (
                          <div className="drawings-info">
                            <Check weight="bold" />
                            <span>{aiResponse.drawings.length} Zeichnung(en) hinzugefügt</span>
                          </div>
                        )}
                        {aiResponse.geogebraCommands?.length > 0 && (
                          <div className="drawings-info geogebra-info">
                            <FunctionIcon weight="bold" />
                            <span>{aiResponse.geogebraCommands.length} GeoGebra-Befehl(e)</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Input */}
                <div className="ai-input-container">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Frage zur Auswahl stellen..."
                    onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
                    disabled={isAILoading}
                  />
                  <button
                    className="send-btn"
                    onClick={sendToAI}
                    disabled={isAILoading || !aiQuestion.trim()}
                  >
                    {isAILoading ? (
                      <CircleNotch weight="bold" className="spin" />
                    ) : (
                      <PaperPlaneTilt weight="fill" />
                    )}
                  </button>
                </div>

                <p className="ai-hint">
                  Die KI kann Erklärungen geben, auf dem Canvas zeichnen und GeoGebra-Visualisierungen erstellen.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick AI chat button (when no selection) */}
        {!showAIPanel && (
          <motion.button
            className="quick-ai-btn"
            onClick={() => {
              setLassoSelection({ x: 100, y: 100, width: 200, height: 200 })
              setShowAIPanel(true)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChatCircle weight="fill" />
            <span>KI fragen</span>
          </motion.button>
        )}

        {/* Selected question display */}
        {selectedQuestion && (
          <div className="question-display">
            <h4>Aktuelle Aufgabe</h4>
            <div className="question-text">
              <LaTeX>{selectedQuestion.question}</LaTeX>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(InteractiveCanvas)
