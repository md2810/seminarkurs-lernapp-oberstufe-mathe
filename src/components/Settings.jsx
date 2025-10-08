import { useState, useEffect } from 'react'
import './Settings.css'

const colorPresets = [
  {
    name: 'Orange',
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    primaryLighter: '#fdba74',
    primaryUltraLight: '#fed7aa',
    bgGradient: 'linear-gradient(135deg, #1a0b05 0%, #0f172a 50%, #0a0604 100%)'
  },
  {
    name: 'Blau',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    primaryLighter: '#93c5fd',
    primaryUltraLight: '#dbeafe',
    bgGradient: 'linear-gradient(135deg, #020617 0%, #0c1222 50%, #030712 100%)'
  },
  {
    name: 'Lila',
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryLighter: '#c4b5fd',
    primaryUltraLight: '#ede9fe',
    bgGradient: 'linear-gradient(135deg, #0f0514 0%, #0f172a 50%, #0a0412 100%)'
  },
  {
    name: 'Grün',
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    primaryLighter: '#6ee7b7',
    primaryUltraLight: '#d1fae5',
    bgGradient: 'linear-gradient(135deg, #021108 0%, #0f172a 50%, #020a06 100%)'
  },
  {
    name: 'Pink',
    primary: '#ec4899',
    primaryDark: '#db2777',
    primaryLight: '#f472b6',
    primaryLighter: '#f9a8d4',
    primaryUltraLight: '#fce7f3',
    bgGradient: 'linear-gradient(135deg, #140508 0%, #0f172a 50%, #0f0308 100%)'
  },
  {
    name: 'Rot',
    primary: '#ef4444',
    primaryDark: '#dc2626',
    primaryLight: '#f87171',
    primaryLighter: '#fca5a5',
    primaryUltraLight: '#fee2e2',
    bgGradient: 'linear-gradient(135deg, #140404 0%, #0f172a 50%, #0a0202 100%)'
  }
]

function Settings({ isOpen, onClose, settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleColorChange = (preset) => {
    const newSettings = {
      ...localSettings,
      theme: {
        ...localSettings.theme,
        primary: preset.primary,
        secondary: preset.primaryLight,
        name: preset.name
      }
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)

    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--primary', preset.primary)
    document.documentElement.style.setProperty('--primary-dark', preset.primaryDark)
    document.documentElement.style.setProperty('--primary-light', preset.primaryLight)
    document.documentElement.style.setProperty('--primary-lighter', preset.primaryLighter)
    document.documentElement.style.setProperty('--primary-ultra-light', preset.primaryUltraLight)
    document.documentElement.style.setProperty('--primary-glow', `${preset.primary}80`)
    document.documentElement.style.setProperty('--secondary', preset.primaryLight)
    document.documentElement.style.setProperty('--bg-primary', preset.bgGradient)
    document.documentElement.style.setProperty('--border', `${preset.primary}33`)
    document.documentElement.style.setProperty('--border-light', `${preset.primary}1a`)
  }

  const handleSliderChange = (key, value) => {
    const newSettings = {
      ...localSettings,
      aiModel: {
        ...localSettings.aiModel,
        [key]: parseFloat(value)
      }
    }
    setLocalSettings(newSettings)
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
                    style={{
                      background: `linear-gradient(135deg, ${preset.primary}, ${preset.primaryLight}, ${preset.primaryLighter})`
                    }}
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

            <div className="slider-group">
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
