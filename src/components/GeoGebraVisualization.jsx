/**
 * GeoGebra Visualization Component
 * Phase 3 Upgrade: Robust error handling with self-correction loop
 *
 * Features:
 * - Skeleton loading state while applet initializes
 * - Robust try-catch around command execution
 * - Self-correction loop for invalid commands via AI
 * - Command validation and sanitization
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Warning, ArrowCounterClockwise, CheckCircle, CircleNotch } from '@phosphor-icons/react'
import './GeoGebraVisualization.css'

// Maximum retry attempts for self-correction
const MAX_CORRECTION_ATTEMPTS = 2

// Common GeoGebra command syntax errors and their fixes
const COMMON_FIXES = {
  // Missing parentheses
  /^(\w+)\s+(.+)$/: (match, cmd, args) => `${cmd}(${args})`,
  // German decimal comma to point
  /(\d+),(\d+)/g: '$1.$2',
  // Fix sqrt without parentheses
  /sqrt\s+(\d+)/gi: 'sqrt($1)',
  // Fix exp notation
  /(\d+)e(\d+)/gi: '$1*10^$2',
}

/**
 * Validate and sanitize a GeoGebra command
 */
function sanitizeCommand(command) {
  if (!command || typeof command !== 'string') return null

  let sanitized = command.trim()

  // Remove potentially dangerous content
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/eval\(/gi, '')

  // Apply common fixes
  for (const [pattern, replacement] of Object.entries(COMMON_FIXES)) {
    if (typeof replacement === 'function') {
      const regex = new RegExp(pattern)
      const match = sanitized.match(regex)
      if (match) {
        sanitized = replacement(...match)
      }
    } else {
      sanitized = sanitized.replace(new RegExp(pattern, 'g'), replacement)
    }
  }

  return sanitized
}

/**
 * Skeleton placeholder component for loading state
 */
function GeoGebraSkeleton() {
  return (
    <div className="geogebra-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-toolbar">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-tool-btn" />
          ))}
        </div>
      </div>
      <div className="skeleton-canvas">
        <div className="skeleton-grid">
          {/* Coordinate system skeleton */}
          <div className="skeleton-axis-x" />
          <div className="skeleton-axis-y" />
          <div className="skeleton-origin" />
        </div>
        <div className="skeleton-pulse-overlay" />
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-text skeleton-text-long" />
        <div className="skeleton-text skeleton-text-short" />
      </div>
    </div>
  )
}

function GeoGebraVisualization({
  isOpen,
  onClose,
  geogebraData,
  questionData,
  userSettings
}) {
  const appletRef = useRef(null)
  const apiRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Command execution state
  const [commandStatus, setCommandStatus] = useState({
    executed: 0,
    failed: 0,
    corrected: 0,
    errors: []
  })
  const [isCorrecting, setIsCorrecting] = useState(false)
  const [correctionAttempts, setCorrectionAttempts] = useState(0)

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /**
   * Execute a single GeoGebra command with error handling
   */
  const executeCommand = useCallback(async (api, command, attemptNumber = 0) => {
    const sanitized = sanitizeCommand(command)
    if (!sanitized) return { success: false, error: 'Invalid command' }

    try {
      // Attempt to execute the command
      const result = api.evalCommand(sanitized)

      // Check if command was successful (GeoGebra returns true/false)
      if (result === false) {
        throw new Error(`GeoGebra rejected command: ${sanitized}`)
      }

      return { success: true, command: sanitized }
    } catch (error) {
      console.warn(`[GeoGebra] Command failed (attempt ${attemptNumber + 1}):`, sanitized, error)

      // If we haven't exceeded max attempts, try self-correction
      if (attemptNumber < MAX_CORRECTION_ATTEMPTS) {
        const correctedCommand = await attemptSelfCorrection(sanitized, error.message)

        if (correctedCommand && correctedCommand !== sanitized) {
          console.log(`[GeoGebra] Attempting corrected command:`, correctedCommand)
          return executeCommand(api, correctedCommand, attemptNumber + 1)
        }
      }

      return {
        success: false,
        command: sanitized,
        error: error.message,
        attemptsMade: attemptNumber + 1
      }
    }
  }, [])

  /**
   * Attempt to fix a failed command using AI or heuristics
   */
  const attemptSelfCorrection = async (failedCommand, errorMessage) => {
    setIsCorrecting(true)

    try {
      // First, try local heuristic fixes
      let corrected = failedCommand

      // Common error patterns and fixes
      const errorFixes = [
        // Unbalanced parentheses
        {
          pattern: /unbalanced|parenthes/i,
          fix: (cmd) => {
            const open = (cmd.match(/\(/g) || []).length
            const close = (cmd.match(/\)/g) || []).length
            if (open > close) return cmd + ')'.repeat(open - close)
            if (close > open) return '('.repeat(close - open) + cmd
            return cmd
          }
        },
        // Unknown command - might be missing function call
        {
          pattern: /unknown|undefined|not found/i,
          fix: (cmd) => {
            // Try wrapping in common functions
            if (!cmd.includes('(')) {
              const parts = cmd.split(/\s+/)
              if (parts.length === 2) {
                return `${parts[0]}(${parts[1]})`
              }
            }
            return cmd
          }
        },
        // Invalid number format
        {
          pattern: /number|numeric|parse/i,
          fix: (cmd) => cmd.replace(/,/g, '.')
        },
        // Variable not defined
        {
          pattern: /variable|symbol|define/i,
          fix: (cmd) => {
            // Try defining the variable first
            if (cmd.includes('=')) {
              return cmd // Already a definition
            }
            return cmd
          }
        }
      ]

      for (const { pattern, fix } of errorFixes) {
        if (pattern.test(errorMessage)) {
          corrected = fix(corrected)
          if (corrected !== failedCommand) {
            break
          }
        }
      }

      // If heuristics didn't change anything and we have API access, try AI correction
      if (corrected === failedCommand && userSettings?.anthropicApiKey) {
        try {
          const aiCorrected = await requestAICorrection(failedCommand, errorMessage, userSettings.anthropicApiKey)
          if (aiCorrected) {
            corrected = aiCorrected
          }
        } catch (aiError) {
          console.warn('[GeoGebra] AI correction failed:', aiError)
        }
      }

      return corrected
    } finally {
      setIsCorrecting(false)
      setCorrectionAttempts(prev => prev + 1)
    }
  }

  /**
   * Request AI to fix invalid GeoGebra command
   */
  const requestAICorrection = async (failedCommand, errorMessage, apiKey) => {
    const response = await fetch('/api/generate-geogebra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        mode: 'fix_command',
        failedCommand,
        errorMessage,
        context: questionData?.question || ''
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.correctedCommand
  }

  /**
   * Execute all GeoGebra commands with error tracking
   */
  const executeAllCommands = useCallback(async (api, commands) => {
    const results = {
      executed: 0,
      failed: 0,
      corrected: 0,
      errors: []
    }

    for (const command of commands) {
      const result = await executeCommand(api, command)

      if (result.success) {
        results.executed++
        if (result.attemptsMade > 1) {
          results.corrected++
        }
      } else {
        results.failed++
        results.errors.push({
          command: result.command,
          error: result.error
        })
      }

      // Small delay between commands to prevent overwhelming GeoGebra
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    setCommandStatus(results)
    return results
  }, [executeCommand])

  // Initialize GeoGebra applet when component mounts
  useEffect(() => {
    if (!isOpen || !geogebraData?.commands) return

    setIsLoading(true)
    setIsInitializing(true)
    setLoadError(null)
    setCommandStatus({ executed: 0, failed: 0, corrected: 0, errors: [] })
    setCorrectionAttempts(0)

    // Load GeoGebra API if not already loaded
    if (!window.GGBApplet) {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.async = true
      script.onload = () => {
        setIsInitializing(false)
        initializeGeoGebra()
      }
      script.onerror = () => {
        setLoadError('GeoGebra konnte nicht geladen werden')
        setIsLoading(false)
        setIsInitializing(false)
      }
      document.body.appendChild(script)
    } else {
      setIsInitializing(false)
      initializeGeoGebra()
    }

    return () => {
      // Cleanup: remove applet when component unmounts
      if (appletRef.current && window.ggbApplet) {
        try {
          apiRef.current = null
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
        appletOnLoad: async function(api) {
          apiRef.current = api

          // Execute GeoGebra commands with error handling
          if (geogebraData?.commands) {
            await executeAllCommands(api, geogebraData.commands)
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

  /**
   * Retry failed commands
   */
  const retryFailedCommands = async () => {
    if (!apiRef.current || commandStatus.errors.length === 0) return

    setIsLoading(true)
    const failedCommands = commandStatus.errors.map(e => e.command)
    await executeAllCommands(apiRef.current, failedCommands)
    setIsLoading(false)
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

              {/* Status indicators */}
              <div className="header-status">
                {isCorrecting && (
                  <span className="status-correcting">
                    <CircleNotch weight="bold" size={16} className="spin" />
                    Korrigiere...
                  </span>
                )}
                {commandStatus.corrected > 0 && (
                  <span className="status-corrected" title={`${commandStatus.corrected} Befehle wurden automatisch korrigiert`}>
                    <ArrowCounterClockwise weight="bold" size={16} />
                    {commandStatus.corrected}
                  </span>
                )}
                {commandStatus.failed > 0 && (
                  <span className="status-failed" title={`${commandStatus.failed} Befehle sind fehlgeschlagen`}>
                    <Warning weight="bold" size={16} />
                    {commandStatus.failed}
                  </span>
                )}
                {commandStatus.executed > 0 && commandStatus.failed === 0 && (
                  <span className="status-success">
                    <CheckCircle weight="bold" size={16} />
                  </span>
                )}
              </div>

              <button className="close-btn" onClick={onClose}>
                <X weight="bold" size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="geogebra-content">
              {/* Skeleton loading state */}
              {isInitializing && <GeoGebraSkeleton />}

              {/* Loading state (after skeleton) */}
              {!isInitializing && isLoading && (
                <div className="geogebra-loading">
                  <div className="spinner"></div>
                  <p>Lade Visualisierung...</p>
                </div>
              )}

              {/* Error state */}
              {loadError && (
                <div className="geogebra-error">
                  <Warning weight="bold" size={48} />
                  <p>{loadError}</p>
                  <button className="retry-btn" onClick={() => window.location.reload()}>
                    Seite neu laden
                  </button>
                </div>
              )}

              {/* Command execution errors */}
              {!isLoading && commandStatus.errors.length > 0 && (
                <div className="geogebra-command-errors">
                  <div className="error-header">
                    <Warning weight="bold" size={20} />
                    <span>{commandStatus.failed} Befehl(e) konnten nicht ausgeführt werden</span>
                  </div>
                  <details className="error-details">
                    <summary>Details anzeigen</summary>
                    <ul>
                      {commandStatus.errors.map((err, i) => (
                        <li key={i}>
                          <code>{err.command}</code>
                          <span className="error-msg">{err.error}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                  {correctionAttempts < MAX_CORRECTION_ATTEMPTS * commandStatus.errors.length && (
                    <button className="retry-commands-btn" onClick={retryFailedCommands}>
                      <ArrowCounterClockwise weight="bold" size={16} />
                      Erneut versuchen
                    </button>
                  )}
                </div>
              )}

              {/* GeoGebra applet container */}
              <div
                id="geogebra-applet"
                ref={appletRef}
                className="geogebra-applet-container"
                style={{
                  display: isInitializing || isLoading || loadError ? 'none' : 'block',
                  opacity: commandStatus.failed > 0 ? 0.8 : 1
                }}
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
