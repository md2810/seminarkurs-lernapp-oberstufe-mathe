/**
 * AppHub Component
 * Zentraler Hub für alle interaktiven Tools der Lernapp
 *
 * Tabs:
 * 1. GeoGebra Graphing - Mathematische Visualisierungen mit KI
 * 2. Whiteboard - Kollaboratives Zeichenbrett mit KI
 * 3. KI-Labor - Generative Mini-Apps (Simulationen)
 *
 * Theoretische Grundlage: Konstruktionismus nach Papert
 * "Lernen durch Erschaffen von Artefakten"
 */

import React, { useState, memo, Suspense, lazy, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/useAppStore'
import {
  Function as FunctionIcon,
  Flask,
  Sparkle,
  CaretRight,
  CaretLeft,
  BookOpen,
  Lightning,
  CircleNotch,
  CaretDown,
  Eye,
  Trash,
  Check,
  Warning,
  Brain,
  Gauge,
  FolderOpen,
  Robot,
  PencilSimple,
  X,
  PaperPlaneTilt,
  ArrowsOutCardinal
} from '@phosphor-icons/react'
import './AppHub.css'

// Lazy load heavy components for better performance
const GenerativeApp = lazy(() => import('./GenerativeApp'))
const MyContent = lazy(() => import('./MyContent'))
import FloatingChat from './FloatingChat'
import AnnotationOverlay from './AnnotationOverlay'
import './MyContent.css'
import './FloatingChat.css'
import './AnnotationOverlay.css'

// Tab configuration with animated gradients
const TABS = [
  {
    id: 'geogebra',
    label: 'GeoGebra',
    icon: FunctionIcon,
    description: 'Interaktive Visualisierungen mit KI-Assistent',
    gradient: 'from-emerald-500 to-green-500'
  },
  {
    id: 'ki-labor',
    label: 'KI-Labor',
    icon: Flask,
    description: 'Generiere eigene Simulationen und Mini-Apps',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'my-content',
    label: 'Meine Inhalte',
    icon: FolderOpen,
    description: 'Gespeicherte Simulationen und Projekte',
    gradient: 'from-violet-500 to-purple-500'
  }
]

// Loading fallback component with animation
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="app-loading">
      <motion.div
        className="loading-spinner"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Wird geladen...
      </motion.p>
    </div>
  )
})

// Animated Tab Button Component
const TabButton = memo(function TabButton({ tab, isActive, onClick }) {
  const Icon = tab.icon

  return (
    <motion.button
      className={`app-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className={`tab-icon bg-gradient-to-br ${tab.gradient}`}
        animate={isActive ? {
          boxShadow: ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 30px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.3)']
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon weight="bold" />
        </motion.div>
      </motion.div>
      <div className="tab-content">
        <span className="tab-label">
          {tab.label}
          {tab.isNew && (
            <motion.span
              className="new-badge"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkle weight="fill" size={10} />
              Neu
            </motion.span>
          )}
        </span>
        <span className="tab-description">{tab.description}</span>
      </div>
      {isActive && (
        <motion.div
          className="active-indicator"
          layoutId="activeTabIndicator"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
})

// Unique ID for GeoGebra container to prevent React DOM conflicts
const GEOGEBRA_STANDALONE_ID = 'geogebra-standalone-applet'

// GeoGebra command sanitization
function sanitizeGeoGebraCommand(command) {
  if (!command || typeof command !== 'string') return null
  let sanitized = command.trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/(\d+),(\d+)/g, '$1.$2')

  const openCount = (sanitized.match(/\(/g) || []).length
  const closeCount = (sanitized.match(/\)/g) || []).length
  if (openCount > closeCount) {
    sanitized += ')'.repeat(openCount - closeCount)
  }
  return sanitized.length > 500 ? sanitized.substring(0, 500) : sanitized
}

// Standalone GeoGebra Component with Task Selector and AI Chat
const GeoGebraApp = memo(function GeoGebraApp({ wrongQuestions = [], userSettings = {} }) {
  const { aiProvider, apiKeys, saveGeoGebraProject } = useAppStore()
  const [geogebraReady, setGeogebraReady] = useState(false)
  const [geogebraLoading, setGeogebraLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState(null)
  const [customPrompt, setCustomPrompt] = useState('')

  // AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Annotation state
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [annotationImage, setAnnotationImage] = useState(null)
  const [screenshotImage, setScreenshotImage] = useState(null)

  const geogebraInitialized = React.useRef(false)
  const geogebraAppRef = React.useRef(null)
  const geogebraApiRef = React.useRef(null)
  const wrapperRef = React.useRef(null)

  // Get API key
  const getApiKey = useCallback(() => {
    if (apiKeys[aiProvider]) return apiKeys[aiProvider]
    switch (aiProvider) {
      case 'claude': return userSettings.anthropicApiKey
      case 'gemini': return userSettings.geminiApiKey
      default: return userSettings.anthropicApiKey
    }
  }, [aiProvider, apiKeys, userSettings])

  React.useEffect(() => {
    if (geogebraInitialized.current) return
    geogebraInitialized.current = true

    const existingScript = document.querySelector('script[src*="geogebra.org/apps/deployggb.js"]')

    const initGeoGebra = () => {
      if (!wrapperRef.current || !window.GGBApplet) return

      const existingContainer = document.getElementById(GEOGEBRA_STANDALONE_ID)
      if (existingContainer) existingContainer.remove()

      const container = document.createElement('div')
      container.id = GEOGEBRA_STANDALONE_ID
      container.style.width = '100%'
      container.style.height = '100%'
      wrapperRef.current.appendChild(container)

      const params = {
        appName: 'graphing',
        width: wrapperRef.current.clientWidth || 800,
        height: wrapperRef.current.clientHeight || 500,
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: false,
        enableLabelDrags: true,
        enableShiftDragZoom: true,
        enableRightClick: true,
        showResetIcon: true,
        language: 'de',
        borderColor: 'transparent',
        preventFocus: true,
        appletOnLoad: (api) => {
          geogebraApiRef.current = api
          setGeogebraReady(true)
          setGeogebraLoading(false)
          api.setAxesVisible(true, true)
          api.setGridVisible(true)
          api.setCoordSystem(-10, 10, -10, 10)
        }
      }

      const applet = new window.GGBApplet(params, true)
      applet.inject(GEOGEBRA_STANDALONE_ID)
      geogebraAppRef.current = applet
    }

    if (!window.GGBApplet && !existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.async = true
      script.onload = initGeoGebra
      document.head.appendChild(script)
    } else if (window.GGBApplet) {
      initGeoGebra()
    } else if (existingScript) {
      existingScript.addEventListener('load', initGeoGebra)
    }

    return () => {
      const container = document.getElementById(GEOGEBRA_STANDALONE_ID)
      if (container) container.remove()
      geogebraAppRef.current = null
      geogebraApiRef.current = null
      geogebraInitialized.current = false
    }
  }, [])

  // Execute GeoGebra commands
  const executeCommands = useCallback((commands) => {
    const api = geogebraApiRef.current
    if (!api) return { success: 0, failed: 0 }

    let success = 0, failed = 0
    commands.forEach(cmd => {
      const command = typeof cmd === 'string' ? cmd : cmd.command
      const sanitized = sanitizeGeoGebraCommand(command)
      if (!sanitized) { failed++; return }

      try {
        const result = api.evalCommand(sanitized)
        if (result !== false) {
          success++
          if (cmd.color) {
            const objName = api.getObjectName(api.getObjectNumber() - 1)
            if (objName) {
              const hex = cmd.color.replace('#', '')
              api.setColor(objName, parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16))
              api.setLineThickness(objName, 3)
            }
          }
        } else { failed++ }
      } catch (e) { failed++ }
    })
    return { success, failed }
  }, [])

  // Clear GeoGebra canvas
  const clearCanvas = useCallback(() => {
    const api = geogebraApiRef.current
    if (api) {
      api.reset()
      api.setAxesVisible(true, true)
      api.setGridVisible(true)
      api.setCoordSystem(-10, 10, -10, 10)
    }
  }, [])

  // Generate visualization with AI
  const generateVisualization = useCallback(async () => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setGenerationStatus({ type: 'error', message: 'Kein API-Schlüssel hinterlegt' })
      return
    }

    const prompt = selectedTask
      ? `Visualisiere diese Mathematikaufgabe in GeoGebra: ${selectedTask.question}`
      : customPrompt

    if (!prompt.trim()) {
      setGenerationStatus({ type: 'error', message: 'Bitte wähle eine Aufgabe oder gib eine Beschreibung ein' })
      return
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      const response = await fetch('/api/generate-geogebra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: aiProvider,
          prompt,
          questionContext: selectedTask
        })
      })

      const data = await response.json()

      if (data.success && data.commands) {
        clearCanvas()
        const result = executeCommands(data.commands)
        setGenerationStatus({
          type: result.failed > 0 ? 'warning' : 'success',
          message: result.failed > 0
            ? `${result.success} Befehle ausgeführt, ${result.failed} fehlgeschlagen`
            : `${result.success} Objekte erstellt`
        })
      } else {
        setGenerationStatus({ type: 'error', message: data.error || 'Fehler bei der Generierung' })
      }
    } catch (error) {
      setGenerationStatus({ type: 'error', message: 'Netzwerkfehler' })
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTask, customPrompt, getApiKey, aiProvider, executeCommands, clearCanvas])

  // Capture screenshot of GeoGebra
  const captureScreenshot = useCallback(() => {
    const api = geogebraApiRef.current
    if (!api) return null

    try {
      // GeoGebra API export to PNG
      const base64 = api.getPNGBase64(1.0, false, 72)
      return `data:image/png;base64,${base64}`
    } catch (e) {
      console.error('Screenshot capture failed:', e)
      return null
    }
  }, [])

  // Start annotation mode
  const handleStartAnnotation = useCallback(() => {
    const screenshot = captureScreenshot()
    if (screenshot) {
      setScreenshotImage(screenshot)
      setIsAnnotating(true)
    }
  }, [captureScreenshot])

  // Complete annotation
  const handleAnnotationComplete = useCallback((annotatedImage) => {
    setIsAnnotating(false)
    if (annotatedImage) {
      setAnnotationImage(annotatedImage)
      setIsChatOpen(true)
    }
    setScreenshotImage(null)
  }, [])

  // Send chat message
  const handleSendMessage = useCallback(async (message, imageData) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Bitte hinterlege einen API-Schlüssel in den Einstellungen.'
      }])
      return
    }

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setIsChatLoading(true)

    try {
      // Build context about current GeoGebra state
      const api = geogebraApiRef.current
      let geogebraState = { objects: [] }
      if (api) {
        const objCount = api.getObjectNumber()
        for (let i = 0; i < objCount; i++) {
          const name = api.getObjectName(i)
          const type = api.getObjectType(name)
          const value = api.getValueString(name)
          geogebraState.objects.push({ name, type, value })
        }
      }

      const response = await fetch('/api/collaborative-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          provider: aiProvider,
          question: message,
          imageData: imageData || annotationImage,
          geogebraState,
          questionContext: selectedTask
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add assistant response
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.explanation || data.response,
          commands: data.geogebraCommands
        }])

        // Execute GeoGebra commands if any
        if (data.geogebraCommands && data.geogebraCommands.length > 0) {
          const commands = data.geogebraCommands.map(cmd =>
            typeof cmd === 'string' ? cmd : cmd.command
          )
          executeCommands(commands)
        }

        // Clear annotation after successful use
        setAnnotationImage(null)
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Netzwerkfehler. Bitte überprüfe deine Verbindung.'
      }])
    } finally {
      setIsChatLoading(false)
    }
  }, [getApiKey, aiProvider, annotationImage, selectedTask, executeCommands])

  // Clear chat
  const handleClearChat = useCallback(() => {
    setChatMessages([])
    setAnnotationImage(null)
  }, [])

  return (
    <div className="geogebra-standalone">
      {/* Task Selector Panel */}
      <div className="geogebra-controls">
        <div className="control-section">
          <label className="control-label">
            <Eye weight="bold" />
            Aufgabe visualisieren
          </label>

          {/* Task Dropdown */}
          <div className="task-selector">
            <motion.button
              className="task-dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="trigger-text">
                {selectedTask
                  ? `${selectedTask.topic}: ${selectedTask.question?.substring(0, 50)}...`
                  : 'Aufgabe auswählen...'}
              </span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <CaretDown weight="bold" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="task-dropdown-menu"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                >
                  {wrongQuestions.length > 0 ? (
                    wrongQuestions.slice(0, 10).map((task, index) => (
                      <motion.button
                        key={task.id || index}
                        className={`task-option ${selectedTask?.id === task.id ? 'selected' : ''}`}
                        onClick={() => { setSelectedTask(task); setIsDropdownOpen(false); setCustomPrompt('') }}
                        whileHover={{ x: 4 }}
                      >
                        <span className="task-topic">{task.topic}</span>
                        <span className="task-text">{task.question?.substring(0, 60)}...</span>
                      </motion.button>
                    ))
                  ) : (
                    <div className="no-tasks">
                      <BookOpen weight="duotone" size={24} />
                      <span>Keine Aufgaben verfügbar</span>
                      <small>Beantworte Fragen im Feed, um Aufgaben zu sammeln</small>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Or custom prompt */}
          <div className="custom-prompt-section">
            <span className="divider-text">oder eigene Beschreibung</span>
            <input
              type="text"
              className="custom-prompt-input"
              placeholder="z.B. Zeichne die Funktion f(x) = sin(x) und ihre Ableitung"
              value={customPrompt}
              onChange={(e) => { setCustomPrompt(e.target.value); setSelectedTask(null) }}
            />
          </div>

          {/* Action buttons */}
          <div className="control-actions">
            <motion.button
              className="generate-btn"
              onClick={generateVisualization}
              disabled={isGenerating || (!selectedTask && !customPrompt.trim())}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGenerating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <CircleNotch weight="bold" />
                  </motion.div>
                  Generiere...
                </>
              ) : (
                <>
                  <Lightning weight="fill" />
                  Visualisieren
                </>
              )}
            </motion.button>

            <motion.button
              className="clear-btn"
              onClick={clearCanvas}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Canvas leeren"
            >
              <Trash weight="bold" />
            </motion.button>
          </div>

          {/* Status message */}
          <AnimatePresence>
            {generationStatus && (
              <motion.div
                className={`generation-status ${generationStatus.type}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {generationStatus.type === 'success' && <Check weight="bold" />}
                {generationStatus.type === 'warning' && <Warning weight="bold" />}
                {generationStatus.type === 'error' && <Warning weight="bold" />}
                <span>{generationStatus.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* GeoGebra Container */}
      <div className="geogebra-container" ref={wrapperRef}>
        {geogebraLoading && (
          <div className="geogebra-loading">
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              GeoGebra wird geladen...
            </motion.p>
          </div>
        )}

        {/* AI Floating Buttons */}
        {geogebraReady && !isAnnotating && (
          <div className="geogebra-ai-buttons">
            <motion.button
              className="ai-btn ask"
              onClick={() => setIsChatOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="KI fragen"
            >
              <Robot weight="fill" />
              <span>KI fragen</span>
            </motion.button>
            <motion.button
              className="ai-btn annotate"
              onClick={handleStartAnnotation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Markieren"
            >
              <PencilSimple weight="fill" />
              <span>Markieren</span>
            </motion.button>
          </div>
        )}

        {/* Floating Chat */}
        <AnimatePresence>
          {isChatOpen && (
            <FloatingChat
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              messages={chatMessages}
              onClearChat={handleClearChat}
              annotationImage={annotationImage}
            />
          )}
        </AnimatePresence>

        {/* Annotation Overlay */}
        <AnimatePresence>
          {isAnnotating && (
            <AnnotationOverlay
              isOpen={isAnnotating}
              onClose={() => {
                setIsAnnotating(false)
                setScreenshotImage(null)
              }}
              onComplete={handleAnnotationComplete}
              backgroundImage={screenshotImage}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})

// Smart/Fast Model Toggle Component
const ModelModeToggle = memo(function ModelModeToggle() {
  const { modelMode, setModelMode } = useAppStore()

  return (
    <div className="model-mode-toggle">
      <motion.button
        className={`mode-btn ${modelMode === 'smart' ? 'active' : ''}`}
        onClick={() => setModelMode('smart')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Smart: Leistungsstärkere Modelle für komplexe Aufgaben"
      >
        <Brain weight={modelMode === 'smart' ? 'fill' : 'bold'} />
        <span>Smart</span>
      </motion.button>
      <motion.button
        className={`mode-btn ${modelMode === 'fast' ? 'active' : ''}`}
        onClick={() => setModelMode('fast')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Fast: Schnellere Modelle für einfache Aufgaben"
      >
        <Gauge weight={modelMode === 'fast' ? 'fill' : 'bold'} />
        <span>Fast</span>
      </motion.button>
    </div>
  )
})

// Main AppHub Component
function AppHub({ wrongQuestions = [], userSettings = {}, onOpenContext }) {
  const [activeTab, setActiveTab] = useState('geogebra')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-hub">
      {/* Animated background gradient */}
      <div className="ambient-bg" />

      {/* Sidebar with tabs */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.aside
            className="app-sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="sidebar-header">
              <div className="sidebar-title">
                <motion.h2
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  className="animated-text"
                >
                  Apps
                </motion.h2>
                <motion.span
                  className="app-count"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {TABS.length} Tools
                </motion.span>
              </div>
              <ModelModeToggle />
            </div>

            <div className="tabs-container">
              {TABS.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            {/* Context info with pulse animation */}
            {wrongQuestions.length > 0 && (
              <motion.div
                className="context-info"
                animate={{
                  boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 0 8px rgba(34, 197, 94, 0.1)', '0 0 0 0 rgba(34, 197, 94, 0)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <BookOpen weight="duotone" />
                </motion.div>
                <span>{wrongQuestions.length} Aufgaben verfügbar</span>
              </motion.div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar toggle */}
      <motion.button
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? 'Sidebar öffnen' : 'Sidebar schließen'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ x: sidebarCollapsed ? [0, 3, 0] : [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {sidebarCollapsed ? <CaretRight weight="bold" /> : <CaretLeft weight="bold" />}
        </motion.div>
      </motion.button>

      {/* Main content area */}
      <div className={`app-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'geogebra' && (
            <motion.div
              key="geogebra"
              className="app-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GeoGebraApp
                wrongQuestions={wrongQuestions}
                userSettings={userSettings}
              />
            </motion.div>
          )}

          {activeTab === 'ki-labor' && (
            <motion.div
              key="ki-labor"
              className="app-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <GenerativeApp
                  userSettings={userSettings}
                  onOpenContext={onOpenContext}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'my-content' && (
            <motion.div
              key="my-content"
              className="app-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MyContent />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(AppHub)
