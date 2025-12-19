/**
 * ErrorMessage Component
 * Displays user-friendly error messages with suggestions and actions
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Warning,
  X,
  ArrowRight,
  WifiSlash,
  Key,
  ClockCountdown,
  Gear,
  ArrowCounterClockwise
} from '@phosphor-icons/react'
import { parseError } from '../utils/errorMessages'
import './ErrorMessage.css'

// Icon mapping for error types
const ERROR_ICONS = {
  invalid_api_key: Key,
  rate_limit: ClockCountdown,
  network_error: WifiSlash,
  model_not_found: Gear,
  generation_failed: Warning,
  timeout: ClockCountdown,
  unknown: Warning
}

function ErrorMessage({
  error,
  onClose,
  onRetry,
  onOpenSettings,
  showSuggestions = true,
  compact = false
}) {
  if (!error) return null

  const errorInfo = typeof error === 'object' && error.type
    ? error
    : parseError(error)

  const Icon = ERROR_ICONS[errorInfo.type] || Warning

  const handleAction = (action) => {
    switch (action) {
      case 'retry':
        onRetry?.()
        break
      case 'openSettings':
        onOpenSettings?.()
        break
      case 'reloadModels':
        onOpenSettings?.()
        break
      default:
        break
    }
  }

  if (compact) {
    return (
      <motion.div
        className="error-message-compact"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Icon weight="fill" className="error-icon" />
        <span className="error-text">{errorInfo.title}</span>
        {onClose && (
          <button className="error-close" onClick={onClose}>
            <X weight="bold" />
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="error-message-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="error-header">
          <div className="error-icon-wrapper">
            <Icon weight="fill" size={24} />
          </div>
          <div className="error-title-section">
            <h4 className="error-title">{errorInfo.title}</h4>
            <p className="error-description">{errorInfo.message}</p>
          </div>
          {onClose && (
            <button className="error-close-btn" onClick={onClose}>
              <X weight="bold" />
            </button>
          )}
        </div>

        {showSuggestions && errorInfo.suggestions?.length > 0 && (
          <div className="error-suggestions">
            <p className="suggestions-label">Was du tun kannst:</p>
            <ul className="suggestions-list">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index}>
                  <ArrowRight weight="bold" size={12} />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorInfo.actions?.length > 0 && (
          <div className="error-actions">
            {errorInfo.actions.map((action, index) => (
              <motion.button
                key={index}
                className={`error-action-btn ${action.action === 'retry' ? 'primary' : 'secondary'}`}
                onClick={() => handleAction(action.action)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {action.action === 'retry' && <ArrowCounterClockwise weight="bold" />}
                {action.action === 'openSettings' && <Gear weight="bold" />}
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(ErrorMessage)
