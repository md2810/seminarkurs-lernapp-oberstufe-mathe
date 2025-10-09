import { useState, useEffect } from 'react'
import './Settings.css'

const colorPresets = [
  { name: 'Orange', primary: '#f97316' },
  { name: 'Blau', primary: '#3b82f6' },
  { name: 'Lila', primary: '#8b5cf6' },
  { name: 'Grün', primary: '#10b981' },
  { name: 'Pink', primary: '#ec4899' },
  { name: 'Rot', primary: '#ef4444' }
]

const gradeLevels = [
  { value: 'Klassen_11_12', label: 'Klasse 11/12' }
]

const courseTypes = [
  { value: 'Leistungsfach', label: 'Leistungsfach', icon: '🎓' },
  { value: 'Basisfach', label: 'Basisfach', icon: '📚' }
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

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Einstellungen</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          {/* Academic Settings */}
          <section className="settings-section">
            <h3>🎓 Akademische Einstellungen</h3>
            <p className="section-description">
              Passe die App an deine Klassenstufe und Kurstyp an
            </p>

            <div className="academic-settings">
              <div className="setting-group">
                <label className="setting-label">Klassenstufe</label>
                <div className="grade-selector">
                  {gradeLevels.map((grade) => (
                    <button
                      key={grade.value}
                      className={`option-btn ${
                        localSettings.gradeLevel === grade.value ? 'active' : ''
                      }`}
                      onClick={() => handleGradeLevelChange(grade.value)}
                    >
                      {grade.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Kurstyp</label>
                <div className="course-type-selector">
                  {courseTypes.map((course) => (
                    <button
                      key={course.value}
                      className={`course-btn ${
                        localSettings.courseType === course.value ? 'active' : ''
                      }`}
                      onClick={() => handleCourseTypeChange(course.value)}
                    >
                      <span className="course-icon">{course.icon}</span>
                      <span>{course.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Theme Section */}
          <section className="settings-section">
            <h3>🎨 Design</h3>
            <p className="section-description">
              Wähle deine Lieblingsfarbe für die App
            </p>

            <div className="color-grid">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  className={`color-preset ${
                    localSettings.theme.name === preset.name ? 'active' : ''
                  }`}
                  onClick={() => handleColorChange(preset)}
                >
                  <div
                    className="color-preview"
                    style={{ background: preset.primary }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Model Settings */}
          <section className="settings-section">
            <h3>🤖 KI-Tutor Verhalten</h3>
            <p className="section-description">
              Passe an, wie der KI-Tutor dir Antworten gibt
            </p>

            <div className="auto-mode-container">
              <button
                className={`auto-mode-btn ${autoMode ? 'active' : ''}`}
                onClick={handleAutoMode}
                title="Lass die KI automatisch die besten Einstellungen für dich wählen"
              >
                <span className="auto-icon">✨</span>
                <span>AUTO Modus</span>
                {autoMode && <span className="auto-badge">Aktiv</span>}
              </button>
              <p className="auto-description">
                {autoMode
                  ? '✓ Die KI passt ihre Hilfestellung automatisch an deinen Lernfortschritt an'
                  : 'Aktiviere den AUTO-Modus für automatisch optimierte Einstellungen'}
              </p>
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
          </section>

          {/* Info Section */}
          <section className="settings-section">
            <div className="settings-info">
              💡 Deine Einstellungen werden lokal gespeichert und bleiben erhalten.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Settings
