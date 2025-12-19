/**
 * Error Boundary Component
 * Fängt JavaScript-Fehler in Child-Komponenten ab und zeigt Fallback-UI
 *
 * Verwendung:
 * <ErrorBoundary fallback={<Fallback />}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 */

import React from 'react'
import { Warning, ArrowCounterClockwise } from '@phosphor-icons/react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack)

    // Optional: Send to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            resetError: this.handleReset
          })
        }
        return this.props.fallback
      }

      // Default fallback
      return (
        <div className="error-boundary-fallback">
          <div className="error-content">
            <Warning weight="bold" size={48} className="error-icon" />
            <h3>Etwas ist schiefgelaufen</h3>
            <p className="error-message">
              {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
            {this.props.showDetails && this.state.errorInfo && (
              <details className="error-details">
                <summary>Technische Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <button onClick={this.handleReset} className="reset-button">
              <ArrowCounterClockwise weight="bold" size={16} />
              Erneut versuchen
            </button>
          </div>

          <style>{`
            .error-boundary-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 200px;
              padding: 2rem;
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.3);
              border-radius: 1rem;
            }

            .error-content {
              text-align: center;
              max-width: 400px;
            }

            .error-icon {
              color: #ef4444;
              margin-bottom: 1rem;
            }

            .error-content h3 {
              color: #ffffff;
              font-size: 1.25rem;
              margin: 0 0 0.5rem 0;
            }

            .error-message {
              color: #a1a1aa;
              font-size: 0.875rem;
              margin: 0 0 1rem 0;
            }

            .error-details {
              margin-bottom: 1rem;
              text-align: left;
            }

            .error-details summary {
              color: #71717a;
              font-size: 0.75rem;
              cursor: pointer;
            }

            .error-details pre {
              font-size: 0.625rem;
              color: #52525b;
              overflow-x: auto;
              padding: 0.5rem;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 0.25rem;
              margin-top: 0.5rem;
            }

            .reset-button {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              background: rgba(239, 68, 68, 0.2);
              border: 1px solid rgba(239, 68, 68, 0.4);
              border-radius: 0.5rem;
              color: #ef4444;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .reset-button:hover {
              background: rgba(239, 68, 68, 0.3);
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * GeoGebra-spezifische Error Boundary
 * Mit angepasster Fehlerbehandlung für GeoGebra-Probleme
 */
class GeoGebraErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GeoGebra] Error caught:', error)

    // Check if it's a GeoGebra-specific error
    const isGeoGebraError = error.message?.includes('GeoGebra') ||
      error.message?.includes('ggb') ||
      errorInfo?.componentStack?.includes('GeoGebra')

    if (isGeoGebraError) {
      console.warn('[GeoGebra] GeoGebra-specific error detected, attempting recovery')
    }
  }

  handleReset = () => {
    // Clean up GeoGebra globals before reset
    try {
      if (window.ggbApplet) {
        window.ggbApplet = null
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="geogebra-error-boundary">
          <Warning weight="bold" size={32} />
          <h4>GeoGebra konnte nicht geladen werden</h4>
          <p>Die Visualisierung ist vorübergehend nicht verfügbar.</p>
          <button onClick={this.handleReset}>
            <ArrowCounterClockwise weight="bold" size={14} />
            Erneut versuchen
          </button>

          <style>{`
            .geogebra-error-boundary {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: rgba(24, 24, 27, 0.8);
              border: 1px dashed rgba(63, 63, 70, 0.5);
              border-radius: 1rem;
              text-align: center;
              gap: 0.75rem;
              min-height: 300px;
            }

            .geogebra-error-boundary svg {
              color: #f97316;
            }

            .geogebra-error-boundary h4 {
              color: #ffffff;
              font-size: 1rem;
              margin: 0;
            }

            .geogebra-error-boundary p {
              color: #71717a;
              font-size: 0.875rem;
              margin: 0;
            }

            .geogebra-error-boundary button {
              display: inline-flex;
              align-items: center;
              gap: 0.375rem;
              padding: 0.5rem 1rem;
              background: rgba(249, 115, 22, 0.2);
              border: 1px solid rgba(249, 115, 22, 0.4);
              border-radius: 0.5rem;
              color: #f97316;
              font-size: 0.8125rem;
              cursor: pointer;
              margin-top: 0.5rem;
            }

            .geogebra-error-boundary button:hover {
              background: rgba(249, 115, 22, 0.3);
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary, GeoGebraErrorBoundary }
export default ErrorBoundary
