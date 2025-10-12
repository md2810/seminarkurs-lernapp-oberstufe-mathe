import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Settings.css'
import {
  X,
  Sparkle,
  GraduationCap,
  Books,
  Palette,
  Robot,
  Lightbulb,
  Bug,
  Key,
  Eye,
  Trash
} from '@phosphor-icons/react'

const colorPresets = [
  { name: 'Orange', primary: '#f97316' },
  { name: 'Blau', primary: '#3b82f6' },
  { name: 'Lila', primary: '#8b5cf6' },
  { name: 'Grün', primary: '#10b981' },
  { name: 'Pink', primary: '#ec4899' },
  { name: 'Rot', primary: '#ef4444' }
]

const gradeLevels = [
  { value: 'Klasse_11', label: 'Klasse 11' },
  { value: 'Klasse_12', label: 'Klasse 12' }
]

const courseTypes = [
  { value: 'Leistungsfach', label: 'Leistungsfach', icon: GraduationCap },
  { value: 'Basisfach', label: 'Basisfach', icon: Books }
]

function Settings({ isOpen, onClose, settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [autoMode, setAutoMode] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
    // Check if AUTO mode was previously enabled
    setAutoMode(settings.aiModel?.autoMode || false)
  }, [settings])

  const handleColorChange = (preset) => {
    const newSettings = {
      ...localSettings,
      theme: {
        name: preset.name,
        primary: preset.primary
      }
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)

    // Apply primary color to CSS variable
    document.documentElement.style.setProperty('--primary', preset.primary)
  }

  const handleSliderChange = (key, value) => {
    const newSettings = {
      ...localSettings,
      aiModel: {
        ...localSettings.aiModel,
        [key]: parseFloat(value),
        autoMode: false // Disable auto mode when manually adjusting
      }
    }
    setLocalSettings(newSettings)
    setAutoMode(false)
    onSettingsChange(newSettings)
  }

  const handleGradeLevelChange = (gradeLevel) => {
    const newSettings = {
      ...localSettings,
      gradeLevel
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleCourseTypeChange = (courseType) => {
    const newSettings = {
      ...localSettings,
      courseType
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleAutoMode = () => {
    // Calculate optimal settings based on user's learning history
    // For now, use balanced defaults. Later this will analyze task logs
    const taskLog = JSON.parse(localStorage.getItem('taskLog') || '[]')

    let optimalSettings = {
      detailLevel: 50,
      temperature: 0.5,
      helpfulness: 50
    }

    if (taskLog.length > 0) {
      // TODO: Implement ML-based optimization based on task performance
      // For now, use simple heuristics
      const avgPerformance = taskLog.reduce((acc, task) => acc + (task.correct ? 1 : 0), 0) / taskLog.length

      if (avgPerformance > 0.8) {
        // User is doing well, reduce help
        optimalSettings = {
          detailLevel: 40,
          temperature: 0.6,
          helpfulness: 30
        }
      } else if (avgPerformance < 0.5) {
        // User needs more help
        optimalSettings = {
          detailLevel: 70,
          temperature: 0.4,
          helpfulness: 80
        }
      }
    }

    const newSettings = {
      ...localSettings,
      aiModel: {
        ...localSettings.aiModel,
        ...optimalSettings,
        autoMode: true
      }
    }
    setLocalSettings(newSettings)
    setAutoMode(true)
    onSettingsChange(newSettings)
  }

  const handleApiKeyChange = (apiKey) => {
    const newSettings = {
      ...localSettings,
      anthropicApiKey: apiKey
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleDebugToggle = (key, value) => {
    const newSettings = {
      ...localSettings,
      [key]: value
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleClearCache = () => {
    // Clear various caches
    const keysToKeep = ['userSettings', 'userData', 'taskLog']
    const allKeys = Object.keys(localStorage)

    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })

    alert('Cache geleert! Die App wird neu geladen.')
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="settings-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        <motion.div
          className="settings-panel card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, x: 300, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 300, scale: 0.9, filter: "blur(10px)" }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 28,
            mass: 0.9
          }}
        >
          <motion.div
            className="settings-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.05
            }}
          >
            <h2>Einstellungen</h2>
            <motion.button
              className="close-btn"
              onClick={onClose}
              whileHover={{
                scale: 1.1,
                rotate: 90,
                transition: { type: "spring", stiffness: 400, damping: 20 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <X weight="bold" />
            </motion.button>
          </motion.div>

          <div className="settings-content">
            {/* Academic Settings with smooth stagger */}
            <motion.section
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                delay: 0.1
              }}
            >
            <h3><GraduationCap weight="bold" /> Akademische Einstellungen</h3>
            <p className="section-description">
              Passe die App an deine Klassenstufe und Kurstyp an
            </p>

            <div className="academic-settings">
              <div className="setting-group">
                <label className="setting-label">Klassenstufe</label>
                <div className="grade-selector">
                  {gradeLevels.map((grade, index) => (
                    <motion.button
                      key={grade.value}
                      className={`option-btn ${
                        localSettings.gradeLevel === grade.value ? 'active' : ''
                      }`}
                      onClick={() => handleGradeLevelChange(grade.value)}
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        transition: { type: "spring", stiffness: 400, damping: 18 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 25,
                        delay: 0.15 + index * 0.05
                      }}
                    >
                      {grade.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Kurstyp</label>
                <div className="course-type-selector">
                  {courseTypes.map((course, index) => (
                    <motion.button
                      key={course.value}
                      className={`course-btn ${
                        localSettings.courseType === course.value ? 'active' : ''
                      }`}
                      onClick={() => handleCourseTypeChange(course.value)}
                      whileHover={{
                        scale: 1.04,
                        y: -3,
                        transition: { type: "spring", stiffness: 400, damping: 18 }
                      }}
                      whileTap={{ scale: 0.96 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 25,
                        delay: 0.25 + index * 0.05
                      }}
                    >
                      <span className="course-icon"><course.icon weight="bold" /></span>
                      <span>{course.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
            </motion.section>

            {/* Theme Section with stagger */}
            <motion.section
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                delay: 0.2
              }}
            >
            <h3><Palette weight="bold" /> Design</h3>
            <p className="section-description">
              Wähle deine Lieblingsfarbe für die App
            </p>

            <div className="color-grid">
              {colorPresets.map((preset, index) => (
                <motion.button
                  key={preset.name}
                  className={`color-preset ${
                    localSettings.theme.name === preset.name ? 'active' : ''
                  }`}
                  onClick={() => handleColorChange(preset)}
                  whileHover={{
                    scale: 1.1,
                    y: -4,
                    transition: { type: "spring", stiffness: 400, damping: 18 }
                  }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: 0.3 + index * 0.04
                  }}
                >
                  <motion.div
                    className="color-preview"
                    style={{ background: preset.primary }}
                    whileHover={{
                      scale: 1.2,
                      rotate: 180,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                  />
                  <span>{preset.name}</span>
                </motion.button>
              ))}
            </div>
            </motion.section>

            {/* AI Model Settings with smooth entry */}
            <motion.section
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                delay: 0.3
              }}
            >
            <h3><Robot weight="bold" /> KI-Tutor Verhalten</h3>
            <p className="section-description">
              Passe an, wie der KI-Tutor dir Antworten gibt
            </p>

            <div className="auto-mode-container">
              <div className="auto-mode-header">
                <div className="auto-mode-info">
                  <h4 className="auto-mode-title">
                    <span className="auto-icon"><Sparkle weight="bold" /></span>
                    AUTO Modus
                  </h4>
                  <p className="auto-description">
                    {autoMode
                      ? 'Die KI passt ihre Hilfestellung automatisch an deinen Lernfortschritt an'
                      : 'Lasse die KI automatisch die besten Einstellungen für dich wählen'}
                  </p>
                </div>
                <label className="auto-toggle">
                  <input
                    type="checkbox"
                    checked={autoMode}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleAutoMode()
                      } else {
                        // Disable auto mode but keep current values
                        const newSettings = {
                          ...localSettings,
                          aiModel: {
                            ...localSettings.aiModel,
                            autoMode: false
                          }
                        }
                        setLocalSettings(newSettings)
                        setAutoMode(false)
                        onSettingsChange(newSettings)
                      }
                    }}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className={`slider-group ${autoMode ? 'disabled' : ''}`}>
              <div className="slider-item">
                <label>
                  <span>Detailgrad der Erklärungen</span>
                  <span className="slider-value">
                    {localSettings.aiModel.detailLevel}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.aiModel.detailLevel}
                  onChange={(e) => handleSliderChange('detailLevel', e.target.value)}
                  className="slider"
                  disabled={autoMode}
                />
                <div className="slider-labels">
                  <span>Kurz</span>
                  <span>Ausführlich</span>
                </div>
              </div>

              <div className="slider-item">
                <label>
                  <span>Kreativität der Antworten</span>
                  <span className="slider-value">
                    {localSettings.aiModel.temperature}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.aiModel.temperature}
                  onChange={(e) => handleSliderChange('temperature', e.target.value)}
                  className="slider"
                  disabled={autoMode}
                />
                <div className="slider-labels">
                  <span>Präzise</span>
                  <span>Kreativ</span>
                </div>
              </div>

              <div className="slider-item">
                <label>
                  <span>Hilfestellung-Level</span>
                  <span className="slider-value">
                    {localSettings.aiModel.helpfulness}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.aiModel.helpfulness}
                  onChange={(e) => handleSliderChange('helpfulness', e.target.value)}
                  className="slider"
                  disabled={autoMode}
                />
                <div className="slider-labels">
                  <span>Eigenständig</span>
                  <span>Unterstützend</span>
                </div>
              </div>
            </div>
            </motion.section>

            {/* Info Section with smooth entry */}
            <motion.section
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                delay: 0.4
              }}
            >
              <div className="settings-info">
                <Lightbulb weight="bold" /> Deine Einstellungen werden lokal gespeichert und bleiben erhalten.
              </div>
            </motion.section>

            {/* Debugging Section */}
            <motion.section
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                delay: 0.5
              }}
            >
              <h3><Bug weight="bold" /> Debugging</h3>
              <p className="section-description">
                Entwickler-Einstellungen für API und Debugging
              </p>

              {/* API Key Input */}
              <div className="api-key-container">
                <label className="setting-label">
                  <Key weight="bold" /> Anthropic API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={localSettings.anthropicApiKey || ''}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="api-key-input"
                />
                <p className="input-hint">
                  Wird nur lokal gespeichert, nie an unsere Server gesendet. Benötigt für KI-Funktionen.
                </p>
              </div>

              {/* Debug Options */}
              <div className="debug-options">
                <label className="debug-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.showAiAssessments || false}
                    onChange={(e) => handleDebugToggle('showAiAssessments', e.target.checked)}
                  />
                  <span className="checkbox-icon">
                    <Eye weight="bold" />
                  </span>
                  <span>AUTO-Modus Einschätzungen anzeigen (für Debugging)</span>
                </label>

                <label className="debug-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.logApiCalls || false}
                    onChange={(e) => handleDebugToggle('logApiCalls', e.target.checked)}
                  />
                  <span className="checkbox-icon">
                    <Eye weight="bold" />
                  </span>
                  <span>API-Calls in Console loggen</span>
                </label>
              </div>

              {/* Clear Cache Button */}
              <motion.button
                className="btn btn-secondary clear-cache-btn"
                onClick={handleClearCache}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  transition: { type: "spring", stiffness: 400, damping: 18 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash weight="bold" /> Cache leeren
              </motion.button>
            </motion.section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Settings
