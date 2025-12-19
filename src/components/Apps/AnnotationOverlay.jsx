/**
 * AnnotationOverlay Component
 * Drawing/highlighting overlay for GeoGebra AI assistant (like Gemini's "Markieren")
 */

import React, { useState, useRef, useCallback, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  PencilSimple,
  TextT,
  ArrowCounterClockwise,
  ArrowClockwise,
  Eraser
} from '@phosphor-icons/react'
import './AnnotationOverlay.css'

// Available colors
const COLORS = [
  { id: 'white', color: '#ffffff' },
  { id: 'red', color: '#ef4444' },
  { id: 'yellow', color: '#eab308' },
  { id: 'green', color: '#22c55e' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'pink', color: '#ec4899' }
]

// Tools
const TOOLS = [
  { id: 'sketch', label: 'Sketch', icon: PencilSimple },
  { id: 'text', label: 'Text', icon: TextT }
]

function AnnotationOverlay({
  isOpen,
  onClose,
  onComplete,
  backgroundImage
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState(COLORS[3].color) // Green default
  const [currentTool, setCurrentTool] = useState('sketch')
  const [strokeWidth] = useState(4)
  const [paths, setPaths] = useState([])
  const [currentPath, setCurrentPath] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState(null)

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    // Redraw all paths
    redrawCanvas()
  }, [isOpen, paths])

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all paths
    paths.forEach(path => {
      if (path.type === 'stroke') {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        path.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      } else if (path.type === 'text') {
        ctx.font = '16px system-ui, sans-serif'
        ctx.fillStyle = path.color
        ctx.fillText(path.text, path.x, path.y)
      }
    })
  }, [paths])

  // Get position from event
  const getPosition = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [])

  // Start drawing
  const handleStart = useCallback((e) => {
    e.preventDefault()
    const pos = getPosition(e)

    if (currentTool === 'sketch') {
      setIsDrawing(true)
      setCurrentPath({
        type: 'stroke',
        color: currentColor,
        width: strokeWidth,
        points: [pos]
      })
    } else if (currentTool === 'text') {
      setTextPosition(pos)
    }
  }, [currentTool, currentColor, strokeWidth, getPosition])

  // Continue drawing
  const handleMove = useCallback((e) => {
    if (!isDrawing || currentTool !== 'sketch') return
    e.preventDefault()

    const pos = getPosition(e)

    setCurrentPath(prev => {
      if (!prev) return null
      return {
        ...prev,
        points: [...prev.points, pos]
      }
    })

    // Draw current stroke
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.strokeStyle = currentColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const points = currentPath?.points || []
    if (points.length > 0) {
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }, [isDrawing, currentTool, currentColor, strokeWidth, getPosition, currentPath])

  // End drawing
  const handleEnd = useCallback(() => {
    if (currentTool === 'sketch' && currentPath) {
      setPaths(prev => [...prev, currentPath])
      setUndoStack([])
    }
    setIsDrawing(false)
    setCurrentPath(null)
  }, [currentTool, currentPath])

  // Add text
  const handleAddText = useCallback(() => {
    if (!textInput.trim() || !textPosition) return

    setPaths(prev => [...prev, {
      type: 'text',
      color: currentColor,
      text: textInput,
      x: textPosition.x,
      y: textPosition.y
    }])
    setTextInput('')
    setTextPosition(null)
    setUndoStack([])
  }, [textInput, textPosition, currentColor])

  // Undo
  const handleUndo = useCallback(() => {
    if (paths.length === 0) return

    const lastPath = paths[paths.length - 1]
    setPaths(prev => prev.slice(0, -1))
    setUndoStack(prev => [...prev, lastPath])
  }, [paths])

  // Redo
  const handleRedo = useCallback(() => {
    if (undoStack.length === 0) return

    const lastUndo = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setPaths(prev => [...prev, lastUndo])
  }, [undoStack])

  // Clear all
  const handleClear = useCallback(() => {
    setPaths([])
    setUndoStack([])
    setTextPosition(null)
  }, [])

  // Complete annotation
  const handleComplete = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      onComplete(null)
      return
    }

    // Create composite image with background and annotations
    const compositeCanvas = document.createElement('canvas')
    compositeCanvas.width = canvas.width
    compositeCanvas.height = canvas.height
    const ctx = compositeCanvas.getContext('2d')

    // Draw background if available
    if (backgroundImage) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, compositeCanvas.width, compositeCanvas.height)
        ctx.drawImage(canvas, 0, 0)
        const dataUrl = compositeCanvas.toDataURL('image/png')
        onComplete(dataUrl)
      }
      img.src = backgroundImage
    } else {
      ctx.drawImage(canvas, 0, 0)
      const dataUrl = compositeCanvas.toDataURL('image/png')
      onComplete(dataUrl)
    }
  }, [backgroundImage, onComplete])

  // Close without saving
  const handleClose = useCallback(() => {
    setPaths([])
    setUndoStack([])
    setTextPosition(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <motion.div
      className="annotation-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="annotation-header">
        <button className="header-close" onClick={handleClose}>
          <X weight="bold" />
        </button>
        <span className="header-title">Markieren</span>
        <div className="header-actions">
          <button
            className="header-action"
            onClick={handleUndo}
            disabled={paths.length === 0}
            title="Rückgängig"
          >
            <ArrowCounterClockwise weight="bold" />
          </button>
          <button
            className="header-action"
            onClick={handleRedo}
            disabled={undoStack.length === 0}
            title="Wiederholen"
          >
            <ArrowClockwise weight="bold" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="annotation-canvas-wrapper">
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Background"
            className="annotation-background"
          />
        )}
        <canvas
          ref={canvasRef}
          className="annotation-canvas"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Text input popup */}
        <AnimatePresence>
          {textPosition && (
            <motion.div
              className="text-input-popup"
              style={{ left: textPosition.x, top: textPosition.y }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Text eingeben..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddText()
                  if (e.key === 'Escape') setTextPosition(null)
                }}
              />
              <button onClick={handleAddText}>
                <Check weight="bold" />
              </button>
              <button onClick={() => setTextPosition(null)}>
                <X weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tools */}
      <div className="annotation-tools">
        <div className="tools-row">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
                onClick={() => setCurrentTool(tool.id)}
              >
                <Icon weight="bold" />
                <span>{tool.label}</span>
              </button>
            )
          })}
        </div>

        {/* Colors */}
        <div className="colors-row">
          {COLORS.map((c) => (
            <button
              key={c.id}
              className={`color-btn ${currentColor === c.color ? 'active' : ''}`}
              style={{ backgroundColor: c.color }}
              onClick={() => setCurrentColor(c.color)}
            />
          ))}
        </div>

        {/* Complete button */}
        <motion.button
          className="complete-btn"
          onClick={handleComplete}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Fertig
        </motion.button>
      </div>
    </motion.div>
  )
}

export default memo(AnnotationOverlay)
