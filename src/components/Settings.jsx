import { useState, useEffect } from 'react'
import './Settings.css'

const colorPresets = [
  { name: 'Orange', primary: '#f97316', secondary: '#fb923c' },
  { name: 'Blau', primary: '#3b82f6', secondary: '#60a5fa' },
  { name: 'Lila', primary: '#8b5cf6', secondary: '#a78bfa' },
  { name: 'Grün', primary: '#10b981', secondary: '#34d399' },
  { name: 'Pink', primary: '#ec4899', secondary: '#f472b6' },
  { name: 'Rot', primary: '#ef4444', secondary: '#f87171' }
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
        secondary: preset.secondary,
        name: preset.name
      }
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)

    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--primary', preset.primary)
    document.documentElement.style.setProperty('--secondary', preset.secondary)
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
                      background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
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
