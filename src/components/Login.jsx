import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { EnvelopeSimple, Lock } from '@phosphor-icons/react'
import './Login.css'

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const { login, resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await login(email, password)
      const user = userCredential.user

      // Check if email is verified
      if (!user.emailVerified) {
        setError('Bitte bestätige zuerst deine E-Mail-Adresse.')
        setLoading(false)
        return
      }

      // Success - user is logged in and verified
      onLogin(user)
    } catch (err) {
      console.error('Login error:', err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Ungültige E-Mail oder Passwort')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Zu viele fehlgeschlagene Versuche. Bitte warte einen Moment.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse')
      } else {
        setError('Bei der Anmeldung ist ein Fehler aufgetreten')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setResetSuccess(false)

    if (!resetEmail.trim()) {
      setError('Bitte gib deine E-Mail-Adresse ein')
      return
    }

    setLoading(true)

    try {
      await resetPassword(resetEmail)
      setResetSuccess(true)
      setTimeout(() => {
        setShowResetPassword(false)
        setResetSuccess(false)
        setResetEmail('')
      }, 3000)
    } catch (err) {
      console.error('Password reset error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Kein Account mit dieser E-Mail-Adresse gefunden')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse')
      } else {
        setError('Fehler beim Senden der Passwort-Zurücksetzung')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show password reset form
  if (showResetPassword) {
    return (
      <motion.div
        className="login-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.5
        }}
      >
        <motion.div
          className="login-card card"
          initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            mass: 1
          }}
        >
          <motion.div
            className="login-header"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 25,
              delay: 0.15
            }}
          >
            <motion.span
              className="login-icon"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2
              }}
            >
              🔑
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 25,
                delay: 0.3
              }}
            >
              Passwort zurücksetzen
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 25,
                delay: 0.35
              }}
            >
              Wir senden dir einen Link zum Zurücksetzen
            </motion.p>
          </motion.div>

          <motion.form
            onSubmit={handleResetPassword}
            className="login-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="form-group"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
                delay: 0.45
              }}
            >
              <label htmlFor="resetEmail">
                <EnvelopeSimple size={16} weight="bold" /> E-Mail
              </label>
              <motion.input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="dein.name@mvl-gym.de"
                className="form-input"
                autoComplete="email"
                required
                whileFocus={{
                  scale: 1.02,
                  boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)",
                  transition: { type: "spring", stiffness: 350, damping: 25 }
                }}
              />
            </motion.div>

            <AnimatePresence>
              {resetSuccess && (
                <motion.div
                  className="login-error"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', color: '#10b981' }}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25
                  }}
                >
                  E-Mail zum Zurücksetzen wurde versendet! Überprüfe dein Postfach.
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="login-error"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
                delay: 0.55
              }}
              whileHover={{
                scale: 1.05,
                y: -3,
                boxShadow: "0 10px 40px rgba(249, 115, 22, 0.4)",
                transition: { type: "spring", stiffness: 400, damping: 18 }
              }}
              whileTap={{
                scale: 0.95
              }}
            >
              {loading ? 'Wird gesendet...' : 'Link senden'}
            </motion.button>
          </motion.form>

          <motion.div
            className="login-hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 25,
              delay: 0.6
            }}
          >
            <motion.button
              onClick={() => {
                setShowResetPassword(false)
                setError('')
                setResetSuccess(false)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Zurück zum Login
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5
      }}
    >
      <motion.div
        className="login-card card"
        initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(15px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 1
        }}
      >
        <motion.div
          className="login-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
            delay: 0.15
          }}
        >
          <motion.span
            className="login-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.2
            }}
          >
            📚
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 25,
              delay: 0.3
            }}
          >
            MatheLernApp
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 25,
              delay: 0.35
            }}
          >
            Dein interaktiver Mathe-Tutor
          </motion.p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="login-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 25,
              delay: 0.45
            }}
          >
            <label htmlFor="email">
              <EnvelopeSimple size={16} weight="bold" /> E-Mail
            </label>
            <motion.input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dein.name@mvl-gym.de"
              className="form-input"
              autoComplete="email"
              required
              whileFocus={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)",
                transition: { type: "spring", stiffness: 350, damping: 25 }
              }}
            />
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 25,
              delay: 0.5
            }}
          >
            <label htmlFor="password">
              <Lock size={16} weight="bold" /> Passwort
            </label>
            <motion.input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dein Passwort"
              className="form-input"
              autoComplete="current-password"
              required
              whileFocus={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)",
                transition: { type: "spring", stiffness: 350, damping: 25 }
              }}
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 25,
              delay: 0.55
            }}
            whileHover={{
              scale: 1.05,
              y: -3,
              boxShadow: "0 10px 40px rgba(249, 115, 22, 0.4)",
              transition: { type: "spring", stiffness: 400, damping: 18 }
            }}
            whileTap={{
              scale: 0.95
            }}
          >
            {loading ? 'Lädt...' : 'Anmelden'}
          </motion.button>
        </motion.form>

        <motion.div
          className="login-hint"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25,
            delay: 0.6
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
        >
          <div>
            Noch kein Account?{' '}
            <motion.button
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Jetzt registrieren
            </motion.button>
          </div>
          <div>
            <motion.button
              onClick={() => setShowResetPassword(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '500',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
              whileHover={{ scale: 1.05, color: 'var(--primary)' }}
              whileTap={{ scale: 0.95 }}
            >
              Passwort vergessen?
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default Login
