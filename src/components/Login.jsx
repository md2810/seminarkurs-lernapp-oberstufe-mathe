import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // For local dev, use simple validation
      // In production with Cloudflare Pages, this would call /api/auth
      if (username === 'admin' && password === 'admin') {
        onLogin({
          username: 'admin',
          level: 7,
          xp: 1250,
          xpToNextLevel: 1500,
          streak: 12,
          totalXp: 3420
        })
      } else {
        setError('Ungültiger Benutzername oder Passwort')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header">
          <span className="login-icon">📚</span>
          <h1>MatheLernApp</h1>
          <p>Dein interaktiver Mathe-Tutor</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Benutzername</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="form-input"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Lädt...' : 'Anmelden'}
          </button>
        </form>

        <div className="login-hint">
          💡 Demo: Nutze <strong>admin / admin</strong> zum Einloggen
        </div>
      </div>
    </div>
  )
}

export default Login
