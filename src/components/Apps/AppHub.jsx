/**
 * AppHub Component
 * Zentraler Hub für alle interaktiven Tools der Lernapp
 *
 * Tabs:
 * 1. GeoGebra Graphing - Mathematische Visualisierungen
 * 2. Whiteboard - Kollaboratives Zeichenbrett mit KI
 * 3. KI-Labor - Generative Mini-Apps (Simulationen)
 *
 * Theoretische Grundlage: Konstruktionismus nach Papert
 * "Lernen durch Erschaffen von Artefakten"
 */

import React, { useState, memo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Function as FunctionIcon,
  PencilSimple,
  Flask,
  Sparkle,
  CaretRight,
  CaretLeft,
  BookOpen
} from '@phosphor-icons/react'
import './AppHub.css'

// Lazy load heavy components for better performance
const InteractiveCanvas = lazy(() => import('../InteractiveCanvas'))
const GenerativeApp = lazy(() => import('./GenerativeApp'))

// Tab configuration
const TABS = [
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    icon: PencilSimple,
    description: 'Kollaboratives Zeichenbrett mit KI-Unterstützung',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'geogebra',
    label: 'GeoGebra',
    icon: FunctionIcon,
    description: 'Interaktive mathematische Visualisierungen',
    gradient: 'from-emerald-500 to-green-500'
  },
  {
    id: 'ki-labor',
    label: 'KI-Labor',
    icon: Flask,
    description: 'Generiere eigene Simulationen und Mini-Apps',
    gradient: 'from-purple-500 to-pink-500',
    isNew: true
  }
]

// Loading fallback component
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="app-loading">
      <div className="loading-spinner" />
      <p>Wird geladen...</p>
    </div>
  )
})

// Tab Button Component
const TabButton = memo(function TabButton({ tab, isActive, onClick }) {
  const Icon = tab.icon

  return (
    <motion.button
      className={`app-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`tab-icon bg-gradient-to-br ${tab.gradient}`}>
        <Icon weight="bold" />
      </div>
      <div className="tab-content">
        <span className="tab-label">
          {tab.label}
          {tab.isNew && (
            <span className="new-badge">
              <Sparkle weight="fill" size={10} />
              Neu
            </span>
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

// Standalone GeoGebra Component for the dedicated tab
// Uses ID-based injection to prevent React DOM reconciliation conflicts
const GeoGebraApp = memo(function GeoGebraApp() {
  const [geogebraReady, setGeogebraReady] = useState(false)
  const [geogebraLoading, setGeogebraLoading] = useState(true)
  const geogebraInitialized = React.useRef(false)
  const geogebraAppRef = React.useRef(null)
  const wrapperRef = React.useRef(null)

  React.useEffect(() => {
    // Prevent double initialization in StrictMode
    if (geogebraInitialized.current) return
    geogebraInitialized.current = true

    const existingScript = document.querySelector('script[src*="geogebra.org/apps/deployggb.js"]')

    const initGeoGebra = () => {
      if (!wrapperRef.current || !window.GGBApplet) return

      // Remove any existing container to prevent conflicts
      const existingContainer = document.getElementById(GEOGEBRA_STANDALONE_ID)
      if (existingContainer) {
        existingContainer.remove()
      }

      // Create a new container element with unique ID
      const container = document.createElement('div')
      container.id = GEOGEBRA_STANDALONE_ID
      container.style.width = '100%'
      container.style.height = '100%'
      wrapperRef.current.appendChild(container)

      const params = {
        appName: 'graphing',
        width: wrapperRef.current.clientWidth || 800,
        height: wrapperRef.current.clientHeight || 600,
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: true,
        enableLabelDrags: true,
        enableShiftDragZoom: true,
        enableRightClick: true,
        showResetIcon: true,
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
      // Inject by ID, not by ref - this prevents React DOM conflicts
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

    // Cleanup on unmount
    return () => {
      const container = document.getElementById(GEOGEBRA_STANDALONE_ID)
      if (container) {
        container.remove()
      }
      geogebraAppRef.current = null
      geogebraInitialized.current = false
    }
  }, [])

  return (
    <div className="geogebra-standalone">
      {/* Wrapper div that React controls, GeoGebra injects into child by ID */}
      <div className="geogebra-container" ref={wrapperRef}>
        {geogebraLoading && (
          <div className="geogebra-loading">
            <div className="loading-spinner" />
            <p>GeoGebra wird geladen...</p>
          </div>
        )}
      </div>
      <div className="geogebra-tips">
        <h4>Tipps</h4>
        <ul>
          <li>Gib Funktionen direkt in die Eingabeleiste ein, z.B. <code>f(x) = x^2</code></li>
          <li>Nutze die Werkzeugleiste für geometrische Konstruktionen</li>
          <li>Rechtsklick auf Objekte für weitere Optionen</li>
        </ul>
      </div>
    </div>
  )
})

// Main AppHub Component
function AppHub({ wrongQuestions = [], userSettings = {}, onOpenContext }) {
  const [activeTab, setActiveTab] = useState('whiteboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-hub">
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
              <h2>Apps</h2>
              <span className="app-count">{TABS.length} Tools</span>
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

            {/* Context info */}
            {wrongQuestions.length > 0 && (
              <div className="context-info">
                <BookOpen weight="duotone" />
                <span>{wrongQuestions.length} Aufgaben verfügbar</span>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? 'Sidebar öffnen' : 'Sidebar schließen'}
      >
        {sidebarCollapsed ? <CaretRight weight="bold" /> : <CaretLeft weight="bold" />}
      </button>

      {/* Main content area */}
      <div className={`app-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'whiteboard' && (
            <motion.div
              key="whiteboard"
              className="app-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <InteractiveCanvas
                  wrongQuestions={wrongQuestions}
                  userSettings={userSettings}
                  onOpenContext={onOpenContext}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'geogebra' && (
            <motion.div
              key="geogebra"
              className="app-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GeoGebraApp />
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
        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(AppHub)
