import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye } from '@phosphor-icons/react'
import './GeoGebraVisualization.css'

function GeoGebraVisualization({
  isOpen,
  onClose,
  geogebraData,
  questionData,
  userSettings
}) {
  const appletRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize GeoGebra applet when component mounts
  useEffect(() => {
    if (!isOpen || !geogebraData?.commands) return

    setIsLoading(true)
    setLoadError(null)

    // Load GeoGebra API if not already loaded
    if (!window.GGBApplet) {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.async = true
      script.onload = () => initializeGeoGebra()
      script.onerror = () => {
        setLoadError('GeoGebra konnte nicht geladen werden')
        setIsLoading(false)
      }
      document.body.appendChild(script)
    } else {
      initializeGeoGebra()
    }

    return () => {
      // Cleanup: remove applet when component unmounts
      if (appletRef.current && window.ggbApplet) {
        try {
          window.ggbApplet = null
        } catch (e) {
          console.error('Error cleaning up GeoGebra:', e)
        }
      }
    }
  }, [isOpen, geogebraData])

  const initializeGeoGebra = () => {
    try {
      // GeoGebra applet parameters
      const parameters = {
        appName: 'classic',
        width: isMobile ? window.innerWidth : 800,
        height: isMobile ? 400 : 600,
        showToolBar: true,
        showAlgebraInput: false,
        showMenuBar: false,
        enableShiftDragZoom: true,
        enableRightClick: false,
        showResetIcon: true,
        language: 'de',
        useBrowserForJS: true,
        appletOnLoad: function(api) {
          // Execute GeoGebra commands
          if (geogebraData?.commands) {
            geogebraData.commands.forEach(command => {
              try {
                api.evalCommand(command)
              } catch (e) {
                console.error('Error executing GeoGebra command:', command, e)
              }
            })
          }
          setIsLoading(false)
        }
      }

      // Create and inject the applet
      const applet = new window.GGBApplet(parameters, true)
      applet.inject('geogebra-applet')
      window.ggbApplet = applet
    } catch (error) {
      console.error('Error initializing GeoGebra:', error)
      setLoadError('Fehler beim Initialisieren von GeoGebra')
      setIsLoading(false)
    }
  }

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const panelVariants = {
    hidden: isMobile
      ? { y: '100%', opacity: 0 }
      : { x: '100%', opacity: 0 },
    visible: isMobile
      ? { y: 0, opacity: 1 }
      : { x: 0, opacity: 1 },
    exit: isMobile
      ? { y: '100%', opacity: 0 }
      : { x: '100%', opacity: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="geogebra-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* GeoGebra panel */}
          <motion.div
            className={`geogebra-panel ${isMobile ? 'mobile' : 'desktop'}`}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              duration: 0.5
            }}
          >
            {/* Header */}
            <div className="geogebra-header">
              <div className="header-title">
                <Eye weight="bold" size={24} />
                <h3>GeoGebra Visualisierung</h3>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X weight="bold" size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="geogebra-content">
              {/* Loading state */}
              {isLoading && (
                <div className="geogebra-loading">
                  <div className="spinner"></div>
                  <p>Lade Visualisierung...</p>
                </div>
              )}

              {/* Error state */}
              {loadError && (
                <div className="geogebra-error">
                  <p>{loadError}</p>
                </div>
              )}

              {/* GeoGebra applet container */}
              <div
                id="geogebra-applet"
                ref={appletRef}
                className="geogebra-applet-container"
                style={{ display: isLoading || loadError ? 'none' : 'block' }}
              />

              {/* Explanation */}
              {!isLoading && !loadError && geogebraData?.explanation && (
                <div className="geogebra-explanation">
                  <h4>Was zeigt die Visualisierung?</h4>
                  <p>{geogebraData.explanation}</p>
                  {geogebraData.interactionTips && (
                    <div className="interaction-tips">
                      <strong>Tipp:</strong> {geogebraData.interactionTips}
                    </div>
                  )}
                </div>
              )}

              {/* Attribution */}
              <div className="geogebra-attribution">
                Erstellt mit <a href="https://www.geogebra.org" target="_blank" rel="noopener noreferrer">GeoGebra®</a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default GeoGebraVisualization
