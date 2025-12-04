import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil,
  Eraser,
  Selection,
  Trash,
  ArrowCounterClockwise,
  ArrowClockwise,
  PaintBucket,
  LineSegment,
  Circle,
  Square,
  TextT,
  Robot,
  X,
  PaperPlaneTilt,
  Spinner,
  Download,
  Plus,
  CaretDown,
  Check,
  Lasso
} from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import LaTeX from './LaTeX'
import './Whiteboard.css'

// Tool types
const TOOLS = {
  PEN: 'pen',
  ERASER: 'eraser',
  LASSO: 'lasso',
  LINE: 'line',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
  TEXT: 'text'
}

// Default colors
const COLORS = [
  '#ffffff', '#f97316', '#ef4444', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#fbbf24', '#14b8a6', '#64748b'
]

// Stroke widths
const STROKE_WIDTHS = [2, 4, 6, 8, 12]

function Whiteboard({ onClose }) {
  const { currentUser } = useAuth()
  const canvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const containerRef = useRef(null)

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState(TOOLS.PEN)
  const [color, setColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Lasso state
  const [lassoPath, setLassoPath] = useState([])
  const [lassoSelection, setLassoSelection] = useState(null)
  const [showAIPanel, setShowAIPanel] = useState(false)

  // AI interaction state
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDrawings, setAiDrawings] = useState([])

  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showStrokePicker, setShowStrokePicker] = useState(false)

  // Shape drawing state
  const [shapeStart, setShapeStart] = useState(null)

  // Text state
  const [textInput, setTextInput] = useState({ active: false, x: 0, y: 0, text: '' })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayCanvasRef.current
    const container = containerRef.current

    if (canvas && overlay && container) {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      overlay.width = rect.width
      overlay.height = rect.height

      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#1a1a1f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Save initial state
      saveToHistory()
    }
  }, [])

  // Save canvas state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL()

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(imageData)
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[historyIndex - 1]
      setHistoryIndex(prev => prev - 1)
    }
  }, [history, historyIndex])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[historyIndex + 1]
      setHistoryIndex(prev => prev + 1)
    }
  }, [history, historyIndex])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1a1a1f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveToHistory()
    setLassoSelection(null)
    setShowAIPanel(false)
  }, [saveToHistory])

  // Get coordinates from event
  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    return { x, y }
  }, [])

  // Start drawing
  const startDrawing = useCallback((e) => {
    e.preventDefault()
    const { x, y } = getCoords(e)

    if (tool === TOOLS.TEXT) {
      setTextInput({ active: true, x, y, text: '' })
      return
    }

    setIsDrawing(true)

    if (tool === TOOLS.LASSO) {
      setLassoPath([{ x, y }])
      setLassoSelection(null)
      setShowAIPanel(false)
    } else if ([TOOLS.LINE, TOOLS.CIRCLE, TOOLS.RECTANGLE].includes(tool)) {
      setShapeStart({ x, y })
    } else {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = tool === TOOLS.ERASER ? '#1a1a1f' : color
      ctx.lineWidth = tool === TOOLS.ERASER ? strokeWidth * 3 : strokeWidth
    }
  }, [tool, color, strokeWidth, getCoords])

  // Draw
  const draw = useCallback((e) => {
    if (!isDrawing) return
    e.preventDefault()

    const { x, y } = getCoords(e)

    if (tool === TOOLS.LASSO) {
      setLassoPath(prev => [...prev, { x, y }])

      // Draw lasso on overlay
      const overlay = overlayCanvasRef.current
      const ctx = overlay.getContext('2d')
      ctx.clearRect(0, 0, overlay.width, overlay.height)

      ctx.beginPath()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 2

      const path = [...lassoPath, { x, y }]
      if (path.length > 0) {
        ctx.moveTo(path[0].x, path[0].y)
        path.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.closePath()
        ctx.stroke()

        // Fill with semi-transparent color
        ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'
        ctx.fill()
      }
    } else if ([TOOLS.LINE, TOOLS.CIRCLE, TOOLS.RECTANGLE].includes(tool) && shapeStart) {
      // Preview shape on overlay
      const overlay = overlayCanvasRef.current
      const ctx = overlay.getContext('2d')
      ctx.clearRect(0, 0, overlay.width, overlay.height)

      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'

      if (tool === TOOLS.LINE) {
        ctx.beginPath()
        ctx.moveTo(shapeStart.x, shapeStart.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (tool === TOOLS.CIRCLE) {
        const radius = Math.sqrt(Math.pow(x - shapeStart.x, 2) + Math.pow(y - shapeStart.y, 2))
        ctx.beginPath()
        ctx.arc(shapeStart.x, shapeStart.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      } else if (tool === TOOLS.RECTANGLE) {
        ctx.beginPath()
        ctx.rect(shapeStart.x, shapeStart.y, x - shapeStart.x, y - shapeStart.y)
        ctx.stroke()
      }
    } else if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }, [isDrawing, tool, color, strokeWidth, lassoPath, shapeStart, getCoords])

  // Stop drawing
  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return

    const { x, y } = getCoords(e)

    if (tool === TOOLS.LASSO && lassoPath.length > 2) {
      // Close the lasso and create selection
      const bounds = getBounds(lassoPath)
      setLassoSelection({
        path: lassoPath,
        bounds
      })
      setShowAIPanel(true)
    } else if ([TOOLS.LINE, TOOLS.CIRCLE, TOOLS.RECTANGLE].includes(tool) && shapeStart) {
      // Draw final shape on main canvas
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'

      if (tool === TOOLS.LINE) {
        ctx.beginPath()
        ctx.moveTo(shapeStart.x, shapeStart.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (tool === TOOLS.CIRCLE) {
        const radius = Math.sqrt(Math.pow(x - shapeStart.x, 2) + Math.pow(y - shapeStart.y, 2))
        ctx.beginPath()
        ctx.arc(shapeStart.x, shapeStart.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      } else if (tool === TOOLS.RECTANGLE) {
        ctx.beginPath()
        ctx.rect(shapeStart.x, shapeStart.y, x - shapeStart.x, y - shapeStart.y)
        ctx.stroke()
      }

      // Clear overlay
      const overlay = overlayCanvasRef.current
      const overlayCtx = overlay.getContext('2d')
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height)

      saveToHistory()
    } else if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      saveToHistory()
    }

    setIsDrawing(false)
    setShapeStart(null)
  }, [isDrawing, tool, lassoPath, shapeStart, color, strokeWidth, getCoords, saveToHistory])

  // Get bounding box of path
  const getBounds = (path) => {
    const xs = path.map(p => p.x)
    const ys = path.map(p => p.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    }
  }

  // Handle text input
  const handleTextSubmit = useCallback(() => {
    if (!textInput.text.trim()) {
      setTextInput({ active: false, x: 0, y: 0, text: '' })
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    ctx.font = `${strokeWidth * 4}px 'Inter', sans-serif`
    ctx.fillStyle = color
    ctx.fillText(textInput.text, textInput.x, textInput.y)

    setTextInput({ active: false, x: 0, y: 0, text: '' })
    saveToHistory()
  }, [textInput, color, strokeWidth, saveToHistory])

  // Send selected area to AI
  const sendToAI = async () => {
    if (!aiQuestion.trim() || !lassoSelection) return

    setAiLoading(true)
    setAiResponse(null)

    try {
      const canvas = canvasRef.current
      const { bounds } = lassoSelection

      // Create a temporary canvas for the selected area
      const tempCanvas = document.createElement('canvas')
      const padding = 20
      tempCanvas.width = bounds.maxX - bounds.minX + padding * 2
      tempCanvas.height = bounds.maxY - bounds.minY + padding * 2

      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.fillStyle = '#1a1a1f'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

      // Copy the selected area
      tempCtx.drawImage(
        canvas,
        bounds.minX - padding,
        bounds.minY - padding,
        tempCanvas.width,
        tempCanvas.height,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      )

      const imageData = tempCanvas.toDataURL('image/png')

      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      const apiKey = settings.anthropicApiKey

      const response = await fetch('/api/analyze-whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser.uid,
          imageData,
          question: aiQuestion,
          selectionBounds: bounds
        })
      })

      const data = await response.json()

      if (data.success) {
        setAiResponse(data)

        // If AI wants to draw, apply the drawings
        if (data.drawings && data.drawings.length > 0) {
          applyAIDrawings(data.drawings)
        }
      } else {
        setAiResponse({ error: data.error || 'Fehler bei der Analyse' })
      }
    } catch (error) {
      console.error('Error sending to AI:', error)
      setAiResponse({ error: 'Fehler bei der Verbindung zum Server' })
    } finally {
      setAiLoading(false)
    }
  }

  // Apply AI drawings to canvas
  const applyAIDrawings = (drawings) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { bounds } = lassoSelection

    drawings.forEach(drawing => {
      ctx.strokeStyle = drawing.color || '#22c55e'
      ctx.fillStyle = drawing.color || '#22c55e'
      ctx.lineWidth = drawing.strokeWidth || 3
      ctx.lineCap = 'round'

      // Offset drawing relative to selection
      const offsetX = bounds.minX
      const offsetY = bounds.maxY + 20 // Draw below selection

      switch (drawing.type) {
        case 'line':
          ctx.beginPath()
          ctx.moveTo(drawing.start.x + offsetX, drawing.start.y + offsetY)
          ctx.lineTo(drawing.end.x + offsetX, drawing.end.y + offsetY)
          ctx.stroke()
          break

        case 'arrow':
          // Draw line
          ctx.beginPath()
          ctx.moveTo(drawing.start.x + offsetX, drawing.start.y + offsetY)
          ctx.lineTo(drawing.end.x + offsetX, drawing.end.y + offsetY)
          ctx.stroke()

          // Draw arrowhead
          const angle = Math.atan2(
            drawing.end.y - drawing.start.y,
            drawing.end.x - drawing.start.x
          )
          const headLength = 15
          ctx.beginPath()
          ctx.moveTo(drawing.end.x + offsetX, drawing.end.y + offsetY)
          ctx.lineTo(
            drawing.end.x + offsetX - headLength * Math.cos(angle - Math.PI / 6),
            drawing.end.y + offsetY - headLength * Math.sin(angle - Math.PI / 6)
          )
          ctx.moveTo(drawing.end.x + offsetX, drawing.end.y + offsetY)
          ctx.lineTo(
            drawing.end.x + offsetX - headLength * Math.cos(angle + Math.PI / 6),
            drawing.end.y + offsetY - headLength * Math.sin(angle + Math.PI / 6)
          )
          ctx.stroke()
          break

        case 'text':
          ctx.font = `${drawing.fontSize || 16}px 'Inter', sans-serif`
          ctx.fillText(drawing.text, drawing.x + offsetX, drawing.y + offsetY)
          break

        case 'circle':
          ctx.beginPath()
          ctx.arc(
            drawing.center.x + offsetX,
            drawing.center.y + offsetY,
            drawing.radius,
            0,
            Math.PI * 2
          )
          ctx.stroke()
          break

        case 'highlight':
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'
          ctx.fillRect(
            drawing.x + offsetX,
            drawing.y + offsetY,
            drawing.width,
            drawing.height
          )
          break

        case 'equation':
          // For equations, we'll draw them as text with a box
          ctx.font = `${drawing.fontSize || 18}px 'JetBrains Mono', monospace`
          const textWidth = ctx.measureText(drawing.text).width
          ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'
          ctx.fillRect(
            drawing.x + offsetX - 8,
            drawing.y + offsetY - drawing.fontSize - 4,
            textWidth + 16,
            drawing.fontSize + 12
          )
          ctx.fillStyle = '#f97316'
          ctx.fillText(drawing.text, drawing.x + offsetX, drawing.y + offsetY)
          break
      }
    })

    setAiDrawings(prev => [...prev, ...drawings])
    saveToHistory()
  }

  // Close AI panel
  const closeAIPanel = () => {
    setShowAIPanel(false)
    setAiQuestion('')
    setAiResponse(null)

    // Clear lasso overlay
    const overlay = overlayCanvasRef.current
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)
  }

  // Download canvas as image
  const downloadCanvas = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="whiteboard-container">
      {/* Toolbar */}
      <div className="whiteboard-toolbar">
        <div className="toolbar-section">
          <button
            className={`tool-btn ${tool === TOOLS.PEN ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.PEN)}
            title="Stift"
          >
            <Pencil weight="bold" />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.ERASER ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.ERASER)}
            title="Radierer"
          >
            <Eraser weight="bold" />
          </button>
          <button
            className={`tool-btn lasso-btn ${tool === TOOLS.LASSO ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.LASSO)}
            title="Lasso-Auswahl (AI)"
          >
            <Lasso weight="bold" />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <button
            className={`tool-btn ${tool === TOOLS.LINE ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.LINE)}
            title="Linie"
          >
            <LineSegment weight="bold" />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.CIRCLE ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.CIRCLE)}
            title="Kreis"
          >
            <Circle weight="bold" />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.RECTANGLE ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.RECTANGLE)}
            title="Rechteck"
          >
            <Square weight="bold" />
          </button>
          <button
            className={`tool-btn ${tool === TOOLS.TEXT ? 'active' : ''}`}
            onClick={() => setTool(TOOLS.TEXT)}
            title="Text"
          >
            <TextT weight="bold" />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Color Picker */}
        <div className="color-picker-wrapper">
          <button
            className="color-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{ backgroundColor: color }}
          >
            <CaretDown weight="bold" size={12} />
          </button>
          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                className="color-picker-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-option ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setColor(c)
                      setShowColorPicker(false)
                    }}
                  >
                    {color === c && <Check weight="bold" size={12} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stroke Width Picker */}
        <div className="stroke-picker-wrapper">
          <button
            className="stroke-btn"
            onClick={() => setShowStrokePicker(!showStrokePicker)}
          >
            <div className="stroke-preview" style={{ height: strokeWidth }} />
            <CaretDown weight="bold" size={12} />
          </button>
          <AnimatePresence>
            {showStrokePicker && (
              <motion.div
                className="stroke-picker-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {STROKE_WIDTHS.map(w => (
                  <button
                    key={w}
                    className={`stroke-option ${strokeWidth === w ? 'selected' : ''}`}
                    onClick={() => {
                      setStrokeWidth(w)
                      setShowStrokePicker(false)
                    }}
                  >
                    <div className="stroke-preview" style={{ height: w, width: 40 }} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <button
            className="tool-btn"
            onClick={undo}
            disabled={historyIndex <= 0}
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
            onClick={clearCanvas}
            title="Alles löschen"
          >
            <Trash weight="bold" />
          </button>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-section">
          <button
            className="tool-btn"
            onClick={downloadCanvas}
            title="Als Bild speichern"
          >
            <Download weight="bold" />
          </button>
          <button className="tool-btn close" onClick={onClose} title="Schließen">
            <X weight="bold" />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="whiteboard-canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <canvas
          ref={overlayCanvasRef}
          className="whiteboard-overlay"
        />

        {/* Text Input */}
        {textInput.active && (
          <div
            className="text-input-container"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              type="text"
              autoFocus
              value={textInput.text}
              onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit()
                if (e.key === 'Escape') setTextInput({ active: false, x: 0, y: 0, text: '' })
              }}
              onBlur={handleTextSubmit}
              placeholder="Text eingeben..."
              style={{ color, fontSize: strokeWidth * 4 }}
            />
          </div>
        )}
      </div>

      {/* AI Interaction Panel */}
      <AnimatePresence>
        {showAIPanel && lassoSelection && (
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              top: Math.min(lassoSelection.bounds.minY, window.innerHeight - 400),
              left: Math.min(lassoSelection.bounds.maxX + 20, window.innerWidth - 360)
            }}
          >
            <div className="ai-panel-header">
              <Robot weight="bold" size={20} />
              <span>AI Assistent</span>
              <button className="close-btn" onClick={closeAIPanel}>
                <X weight="bold" />
              </button>
            </div>

            <div className="ai-panel-content">
              <p className="ai-hint">
                Stelle eine Frage zu deiner Auswahl. Das AI kann dir Fragen beantworten und auf dem Canvas zeichnen.
              </p>

              <div className="ai-input-container">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="z.B. Wie löse ich diese Gleichung?"
                  onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
                  disabled={aiLoading}
                />
                <button
                  className="send-btn"
                  onClick={sendToAI}
                  disabled={aiLoading || !aiQuestion.trim()}
                >
                  {aiLoading ? (
                    <Spinner weight="bold" className="spin" />
                  ) : (
                    <PaperPlaneTilt weight="bold" />
                  )}
                </button>
              </div>

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
                      {aiResponse.drawings && aiResponse.drawings.length > 0 && (
                        <div className="drawings-info">
                          <Check weight="bold" />
                          <span>{aiResponse.drawings.length} Zeichnung(en) hinzugefügt</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="ai-panel-footer">
              <span className="powered-by">Powered by Claude AI</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lasso Tool Hint */}
      {tool === TOOLS.LASSO && !lassoSelection && (
        <div className="lasso-hint">
          <Lasso weight="bold" />
          <span>Ziehe einen Bereich, um ihn mit AI zu analysieren</span>
        </div>
      )}
    </div>
  )
}

export default Whiteboard
