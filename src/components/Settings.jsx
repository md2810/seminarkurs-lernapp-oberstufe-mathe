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
  Trash,
  Brain,
  Lightning,
  Check,
  Warning,
  CircleNotch,
  Gauge
} from '@phosphor-icons/react'
import { useAppStore } from '../stores/useAppStore'

const colorPresets = [
  {
    name: 'Sunset',
    primary: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    gradientFrom: '#f97316',
    gradientTo: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.4)'
  },
  {
    name: 'Ocean',
    primary: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    gradientFrom: '#3b82f6',
    gradientTo: '#06b6d4',
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  {
    name: 'Aurora',
    primary: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
    glow: 'rgba(139, 92, 246, 0.4)'
  },
  {
    name: 'Forest',
    primary: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  {
    name: 'Sakura',
    primary: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    gradientFrom: '#ec4899',
    gradientTo: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.4)'
  },
  {
    name: 'Crimson',
    primary: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    gradientFrom: '#ef4444',
    gradientTo: '#dc2626',
    glow: 'rgba(239, 68, 68, 0.4)'
  }
]

const gradeLevels = [
  { value: 'Klasse_11', label: 'Klasse 11' },
  { value: 'Klasse_12', label: 'Klasse 12' }
]

const courseTypes = [
  { value: 'Leistungsfach', label: 'Leistungsfach', icon: GraduationCap },
  { value: 'Basisfach', label: 'Basisfach', icon: Books }
]

// AI Provider configurations
const AI_PROVIDERS = [
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: Brain,
    placeholder: 'sk-ant-...',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#f97316',
    defaultSmartModel: 'claude-sonnet-4-5-20250929',
    defaultFastModel: 'claude-haiku-4-5-20251001'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: Lightning,
    placeholder: 'AIza...',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    color: '#3b82f6',
    defaultSmartModel: 'gemini-3-pro-preview',
    defaultFastModel: 'gemini-3-flash-preview'
  }
]

function Settings({ isOpen, onClose, settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [autoMode, setAutoMode] = useState(false)

  // Multi-provider state
  const {
    aiProvider,
    setAiProvider,
    setSelectedModel,
    setApiKey: setStoreApiKey,
    smartModels,
    fastModels,
    setSmartModel,
    setFastModel
  } = useAppStore()
  const [providerModels, setProviderModels] = useState({
    claude: [],
    gemini: []
  })
  const [loadingModels, setLoadingModels] = useState({
    claude: false,
    gemini: false
  })
  const [modelsError, setModelsError] = useState({
    claude: null,
    gemini: null
  })
  const [keyValidation, setKeyValidation] = useState({
    claude: { status: null, message: '' }, // status: 'valid', 'invalid', 'validating', null
    gemini: { status: null, message: '' }
  })

  useEffect(() => {
    setLocalSettings(settings)
    // Check if AUTO mode was previously enabled
    setAutoMode(settings.aiModel?.autoMode || false)

    // Sync API keys from settings to store on initial load
    if (settings.claudeApiKey || settings.anthropicApiKey) {
      setStoreApiKey('claude', settings.claudeApiKey || settings.anthropicApiKey)
    }
    if (settings.geminiApiKey) {
      setStoreApiKey('gemini', settings.geminiApiKey)
    }
  }, [settings])

  const handleColorChange = (preset) => {
    // Helper to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const newSettings = {
      ...localSettings,
      theme: {
        name: preset.name,
        primary: preset.primary,
        gradient: preset.gradient,
        gradientFrom: preset.gradientFrom,
        gradientTo: preset.gradientTo,
        glow: preset.glow
      }
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)

    // Apply theme CSS variables
    document.documentElement.style.setProperty('--primary', preset.primary)
    document.documentElement.style.setProperty('--primary-gradient', preset.gradient)
    document.documentElement.style.setProperty('--primary-from', preset.gradientFrom)
    document.documentElement.style.setProperty('--primary-to', preset.gradientTo)
    document.documentElement.style.setProperty('--primary-glow', preset.glow)
    document.documentElement.style.setProperty('--primary-subtle', hexToRgba(preset.primary, 0.08))
    document.documentElement.style.setProperty('--primary-hover', hexToRgba(preset.primary, 0.15))
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

  const handleApiKeyChange = (provider, apiKey) => {
    const keyField = `${provider}ApiKey`
    const newSettings = {
      ...localSettings,
      [keyField]: apiKey
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)

    // Also update the store's apiKeys
    setStoreApiKey(provider, apiKey)

    // Reset validation status when key changes
    setKeyValidation(prev => ({
      ...prev,
      [provider]: { status: null, message: '' }
    }))
  }

  // Validate API key
  const validateApiKey = async (provider) => {
    const apiKey = getApiKey(provider)
    if (!apiKey || apiKey.trim() === '') {
      setKeyValidation(prev => ({
        ...prev,
        [provider]: { status: 'invalid', message: 'Bitte gib einen API-Key ein' }
      }))
      return
    }

    setKeyValidation(prev => ({
      ...prev,
      [provider]: { status: 'validating', message: 'Wird überprüft...' }
    }))

    try {
      let isValid = false
      let errorMessage = ''

      switch (provider) {
        case 'claude':
          // Validate Claude key by listing models
          const claudeResponse = await fetch('https://api.anthropic.com/v1/models', {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            }
          })
          isValid = claudeResponse.ok
          if (!isValid) {
            const error = await claudeResponse.json().catch(() => ({}))
            errorMessage = error.error?.message || 'Ungültiger API-Key'
          }
          break

        case 'gemini':
          // Validate Gemini key by listing models
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
          isValid = geminiResponse.ok
          if (!isValid) {
            const error = await geminiResponse.json().catch(() => ({}))
            errorMessage = error.error?.message || 'Ungültiger API-Key'
          }
          break
      }

      setKeyValidation(prev => ({
        ...prev,
        [provider]: {
          status: isValid ? 'valid' : 'invalid',
          message: isValid ? 'API-Key ist gültig' : errorMessage
        }
      }))

      // If valid, also load models
      if (isValid) {
        fetchAvailableModels(provider)
      }
    } catch (error) {
      setKeyValidation(prev => ({
        ...prev,
        [provider]: { status: 'invalid', message: 'Verbindungsfehler - bitte später erneut versuchen' }
      }))
    }
  }

  // Legacy support - map anthropicApiKey to claudeApiKey
  const getApiKey = (provider) => {
    if (provider === 'claude') {
      return localSettings.claudeApiKey || localSettings.anthropicApiKey || ''
    }
    return localSettings[`${provider}ApiKey`] || ''
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

  const fetchAvailableModels = async (provider) => {
    const apiKey = getApiKey(provider)
    if (!apiKey) {
      setModelsError(prev => ({ ...prev, [provider]: 'Bitte gib zuerst einen API-Key ein' }))
      return
    }

    setLoadingModels(prev => ({ ...prev, [provider]: true }))
    setModelsError(prev => ({ ...prev, [provider]: null }))

    try {
      let models = []

      switch (provider) {
        case 'claude':
          models = await fetchClaudeModels(apiKey)
          break
        case 'gemini':
          models = await fetchGeminiModels(apiKey)
          break
        default:
          throw new Error(`Unknown provider: ${provider}`)
      }

      setProviderModels(prev => ({ ...prev, [provider]: models }))
      // If no model is selected for this provider, select the first one
      const modelField = `${provider}Model`
      if (!localSettings[modelField] && models.length > 0) {
        handleModelChange(provider, models[0].id)
      }
    } catch (error) {
      console.error(`Error fetching ${provider} models:`, error)
      setModelsError(prev => ({ ...prev, [provider]: error.message || 'Fehler beim Laden der Modelle' }))
    } finally {
      setLoadingModels(prev => ({ ...prev, [provider]: false }))
    }
  }

  // Direct API calls to providers
  const fetchClaudeModels = async (apiKey) => {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'Fehler beim Abrufen der Claude Modelle')
    }

    const data = await response.json()
    return (data.data || [])
      .filter(model => model.id.includes('claude'))
      .map(model => ({
        id: model.id,
        name: formatClaudeModelName(model.id)
      }))
      .sort((a, b) => {
        const tierOrder = { 'sonnet': 1, 'haiku': 2, 'opus': 0 }
        const aTier = Object.keys(tierOrder).find(t => a.id.includes(t)) || 'z'
        const bTier = Object.keys(tierOrder).find(t => b.id.includes(t)) || 'z'
        return (tierOrder[aTier] ?? 99) - (tierOrder[bTier] ?? 99)
      })
  }

  const formatClaudeModelName = (modelId) => {
    if (modelId.includes('sonnet')) {
      const match = modelId.match(/claude-sonnet-(\d+)-(\d+)/)
      if (match) return `Claude Sonnet ${match[1]}.${match[2]}`
      return 'Claude Sonnet'
    }
    if (modelId.includes('opus')) {
      const match = modelId.match(/claude-opus-(\d+)/)
      if (match) return `Claude Opus ${match[1]}`
      return 'Claude Opus'
    }
    if (modelId.includes('haiku')) {
      const match = modelId.match(/claude-(\d+)-(\d+)-haiku/)
      if (match) return `Claude ${match[1]}.${match[2]} Haiku`
      return 'Claude Haiku'
    }
    return modelId
  }

  const fetchGeminiModels = async (apiKey) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'Fehler beim Abrufen der Gemini Modelle')
    }

    const data = await response.json()
    return (data.models || [])
      .filter(model => {
        const name = model.name || ''
        return name.includes('gemini') && model.supportedGenerationMethods?.includes('generateContent')
      })
      .map(model => {
        const modelId = model.name.replace('models/', '')
        return {
          id: modelId,
          name: formatGeminiModelName(modelId)
        }
      })
      .sort((a, b) => {
        const tierOrder = { 'pro': 1, 'flash': 2, 'nano': 3 }
        const aTier = Object.keys(tierOrder).find(t => a.id.includes(t)) || 'z'
        const bTier = Object.keys(tierOrder).find(t => b.id.includes(t)) || 'z'
        return (tierOrder[aTier] ?? 99) - (tierOrder[bTier] ?? 99)
      })
  }

  const formatGeminiModelName = (modelId) => {
    const parts = modelId.split('-')
    let name = 'Gemini'
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      if (part === 'exp' || part === 'experimental') name += ' (Exp)'
      else if (part === 'latest') name += ' Latest'
      else if (part === 'thinking') name += ' Thinking'
      else if (/^\d/.test(part)) name += ` ${part}`
      else name += ` ${part.charAt(0).toUpperCase() + part.slice(1)}`
    }
    return name
  }

  const handleSmartModelChange = (provider, modelId) => {
    setSmartModel(provider, modelId)
    const newSettings = {
      ...localSettings,
      [`${provider}SmartModel`]: modelId
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleFastModelChange = (provider, modelId) => {
    setFastModel(provider, modelId)
    const newSettings = {
      ...localSettings,
      [`${provider}FastModel`]: modelId
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleProviderChange = (providerId) => {
    setAiProvider(providerId)
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
                    y: -4,
                    transition: { type: "spring", stiffness: 400, damping: 18 }
                  }}
                  whileTap={{ scale: 0.95 }}
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
                    style={{ background: preset.gradient }}
                    whileHover={{
                      scale: 1.15,
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

              {/* AI Provider Selection */}
              <div className="provider-selection">
                <label className="setting-label" style={{ marginBottom: '12px' }}>
                  <Robot weight="bold" /> Aktiver AI-Anbieter
                </label>
                <div className="provider-buttons">
                  {AI_PROVIDERS.map((provider) => {
                    const Icon = provider.icon
                    const isActive = aiProvider === provider.id
                    return (
                      <motion.button
                        key={provider.id}
                        className={`provider-btn ${isActive ? 'active' : ''}`}
                        onClick={() => handleProviderChange(provider.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          '--provider-color': provider.color,
                          '--provider-gradient': provider.gradient
                        }}
                      >
                        <Icon weight="bold" className="provider-icon" />
                        <span>{provider.name}</span>
                        {isActive && (
                          <motion.div
                            className="active-indicator"
                            layoutId="activeProvider"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                <p className="input-hint" style={{ marginTop: '8px' }}>
                  Wähle den Anbieter, der für die KI-Funktionen verwendet werden soll.
                </p>
              </div>

              {/* Provider API Keys & Models */}
              <div className="provider-configs">
                {AI_PROVIDERS.map((provider, index) => {
                  const Icon = provider.icon
                  const isActive = aiProvider === provider.id
                  const apiKey = getApiKey(provider.id)
                  const models = providerModels[provider.id] || []
                  const isLoading = loadingModels[provider.id]
                  const error = modelsError[provider.id]
                  const selectedModel = localSettings[`${provider.id}Model`] || ''

                  return (
                    <motion.div
                      key={provider.id}
                      className={`provider-config ${isActive ? 'active' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      style={{ '--provider-color': provider.color }}
                    >
                      <div className="provider-config-header">
                        <div className="provider-config-icon" style={{ background: provider.gradient }}>
                          <Icon weight="bold" />
                        </div>
                        <div className="provider-config-info">
                          <h4>{provider.name}</h4>
                          {isActive && <span className="active-badge">Aktiv</span>}
                        </div>
                      </div>

                      {/* API Key Input */}
                      <div className="api-key-container">
                        <label className="setting-label-small">
                          <Key weight="bold" /> API Key
                        </label>
                        <div className="api-key-input-wrapper">
                          <input
                            type="password"
                            placeholder={provider.placeholder}
                            value={apiKey}
                            onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                            className={`api-key-input ${keyValidation[provider.id]?.status === 'valid' ? 'valid' : ''} ${keyValidation[provider.id]?.status === 'invalid' ? 'invalid' : ''}`}
                          />
                          <motion.button
                            className="validate-btn"
                            onClick={() => validateApiKey(provider.id)}
                            disabled={!apiKey || keyValidation[provider.id]?.status === 'validating'}
                            whileHover={apiKey ? { scale: 1.05 } : {}}
                            whileTap={apiKey ? { scale: 0.95 } : {}}
                            title="API-Key überprüfen"
                          >
                            {keyValidation[provider.id]?.status === 'validating' ? (
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ display: 'flex' }}
                              >
                                <CircleNotch weight="bold" />
                              </motion.span>
                            ) : keyValidation[provider.id]?.status === 'valid' ? (
                              <Check weight="bold" />
                            ) : keyValidation[provider.id]?.status === 'invalid' ? (
                              <Warning weight="bold" />
                            ) : (
                              <Check weight="bold" />
                            )}
                          </motion.button>
                        </div>
                        {keyValidation[provider.id]?.status && (
                          <motion.div
                            className={`validation-message ${keyValidation[provider.id]?.status}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {keyValidation[provider.id]?.status === 'valid' && <Check weight="bold" />}
                            {keyValidation[provider.id]?.status === 'invalid' && <Warning weight="bold" />}
                            {keyValidation[provider.id]?.status === 'validating' && <CircleNotch weight="bold" />}
                            <span>{keyValidation[provider.id]?.message}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Smart/Fast Model Selectors */}
                      <div className="model-selectors">
                        {/* Smart Model */}
                        <div className="model-selector-container">
                          <label className="setting-label-small">
                            <Brain weight="bold" /> Smart Modell
                          </label>
                          {models.length === 0 ? (
                            <motion.button
                              className="btn btn-secondary btn-small"
                              onClick={() => fetchAvailableModels(provider.id)}
                              disabled={isLoading || !apiKey}
                              whileHover={{
                                scale: apiKey && !isLoading ? 1.02 : 1,
                                y: apiKey && !isLoading ? -2 : 0
                              }}
                              whileTap={{ scale: apiKey && !isLoading ? 0.98 : 1 }}
                            >
                              {isLoading ? 'Lade...' : 'Modelle laden'}
                            </motion.button>
                          ) : (
                            <div className="model-select-wrapper">
                              <select
                                value={smartModels[provider.id] || provider.defaultSmartModel}
                                onChange={(e) => handleSmartModelChange(provider.id, e.target.value)}
                                className="model-select"
                              >
                                {models.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <p className="model-hint">Leistungsstärker, für komplexe Aufgaben</p>
                        </div>

                        {/* Fast Model */}
                        <div className="model-selector-container">
                          <label className="setting-label-small">
                            <Lightning weight="bold" /> Fast Modell
                          </label>
                          {models.length === 0 ? (
                            <span className="model-hint">Lade zuerst die Modelle</span>
                          ) : (
                            <div className="model-select-wrapper">
                              <select
                                value={fastModels[provider.id] || provider.defaultFastModel}
                                onChange={(e) => handleFastModelChange(provider.id, e.target.value)}
                                className="model-select"
                              >
                                {models.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => fetchAvailableModels(provider.id)}
                                className="refresh-models-btn"
                                disabled={isLoading}
                              >
                                {isLoading ? '...' : '↻'}
                              </button>
                            </div>
                          )}
                          <p className="model-hint">Schneller, für einfache Aufgaben</p>
                        </div>
                        {error && (
                          <p className="error-text">{error}</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <p className="input-hint" style={{ marginTop: '16px' }}>
                API-Keys werden nur lokal gespeichert und nie an unsere Server gesendet.
              </p>

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
