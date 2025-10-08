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

function Settings({ isOpen, onClose, settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
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
