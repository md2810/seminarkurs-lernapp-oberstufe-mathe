import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { EnvelopeSimple, Warning, CheckCircle } from '@phosphor-icons/react'
import './Login.css'

function EmailVerification({ userEmail, onBackToLogin }) {
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState('')

  const { resendVerificationEmail, logout } = useAuth()

  const handleResend = async () => {
    setResending(true)
    setError('')
    setResendSuccess(false)

    try {
      await resendVerificationEmail()
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err) {
      console.error('Resend error:', err)
      if (err.code === 'auth/too-many-requests') {
        setError('Zu viele Anfragen. Bitte warte einen Moment.')
      } else {
        setError('Fehler beim Senden der E-Mail. Bitte versuche es später erneut.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      onBackToLogin()
    } catch (err) {
      console.error('Logout error:', err)
    }
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
        style={{ maxWidth: '500px' }}
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
          style={{ textAlign: 'center' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.2
            }}
          >
            <EnvelopeSimple size={64} weight="bold" color="var(--primary)" />
          </motion.div>
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
            E-Mail bestätigen
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
            style={{ marginTop: '1rem' }}
          >
            Wir haben eine Bestätigungs-E-Mail an
            <br />
            <strong style={{ color: 'var(--primary)' }}>{userEmail}</strong>
            <br />
            gesendet.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
            delay: 0.4
          }}
          style={{
            padding: '1.5rem',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '12px',
            marginTop: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Warning size={24} weight="bold" color="var(--primary)" style={{ marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Wichtig:</strong> Bitte klicke auf den Bestätigungslink in der E-Mail,
                um deinen Account zu aktivieren. Überprüfe auch deinen Spam-Ordner.
              </p>
              <p style={{ margin: '12px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
                Nach der Bestätigung kannst du dich einloggen.
              </p>
            </div>
          </div>
        </motion.div>

        {resendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25
            }}
            style={{
              marginTop: '1rem',
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10b981'
            }}
          >
            <CheckCircle size={20} weight="fill" />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Bestätigungs-E-Mail wurde erneut gesendet!
            </span>
          </motion.div>
        )}

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
            style={{ marginTop: '1rem' }}
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25,
            delay: 0.5
          }}
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <motion.button
            onClick={handleResend}
            disabled={resending}
            className="btn btn-secondary"
            whileHover={{
              scale: 1.03,
              y: -2,
              transition: { type: "spring", stiffness: 400, damping: 18 }
            }}
            whileTap={{
              scale: 0.97
            }}
          >
            {resending ? 'Wird gesendet...' : 'E-Mail erneut senden'}
          </motion.button>

          <motion.button
            onClick={handleLogout}
            className="btn btn-primary"
            whileHover={{
              scale: 1.03,
              y: -2,
              boxShadow: "0 10px 40px rgba(249, 115, 22, 0.4)",
              transition: { type: "spring", stiffness: 400, damping: 18 }
            }}
            whileTap={{
              scale: 0.97
            }}
          >
            Zum Login
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default EmailVerification
