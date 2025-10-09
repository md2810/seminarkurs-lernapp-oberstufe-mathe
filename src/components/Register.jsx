import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { EnvelopeSimple, Lock, User, CheckCircle } from '@phosphor-icons/react'
import './Login.css'

function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signup } = useAuth()

  const validateEmail = (email) => {
    return email.endsWith('@mvl-gym.de')
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!name.trim()) {
      setError('Bitte gib deinen Namen ein')
      return
    }

    if (!validateEmail(email)) {
      setError('Bitte verwende eine @mvl-gym.de E-Mail-Adresse')
      return
    }

    if (!validatePassword(password)) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)

    try {
      await signup(email, password, name)
      setSuccess(true)

      // Redirect to email verification screen after 2 seconds
      setTimeout(() => {
        onRegisterSuccess()
      }, 2000)
    } catch (err) {
      console.error('Registration error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail-Adresse wird bereits verwendet')
      } else if (err.code === 'auth/weak-password') {
        setError('Das Passwort ist zu schwach')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse')
      } else {
        setError(err.message || 'Bei der Registrierung ist ein Fehler aufgetreten')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        className="login-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="login-card card"
          initial={{ opacity: 0, scale: 0.9, filter: "blur(15px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25
          }}
        >
          <motion.div
            className="login-header"
            style={{ textAlign: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              <CheckCircle size={64} weight="fill" color="#10b981" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Registrierung erfolgreich!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Bitte überprüfe deine E-Mails und bestätige deine E-Mail-Adresse.
            </motion.p>
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
            Registrierung
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
            Erstelle deinen Account
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
            <label htmlFor="name">
              <User size={16} weight="bold" /> Name
            </label>
            <motion.input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              className="form-input"
              autoComplete="name"
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
            <label htmlFor="email">
              <EnvelopeSimple size={16} weight="bold" /> E-Mail (@mvl-gym.de)
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
              delay: 0.55
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
              placeholder="Mindestens 6 Zeichen"
              className="form-input"
              autoComplete="new-password"
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
              delay: 0.6
            }}
          >
            <label htmlFor="confirmPassword">
              <Lock size={16} weight="bold" /> Passwort bestätigen
            </label>
            <motion.input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              className="form-input"
              autoComplete="new-password"
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
              delay: 0.65
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
            {loading ? 'Registrierung läuft...' : 'Registrieren'}
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
            delay: 0.7
          }}
        >
          Bereits registriert?{' '}
          <motion.button
            onClick={onSwitchToLogin}
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
            Zum Login
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default Register
