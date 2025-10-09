import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { X, User, EnvelopeSimple, Lock, CheckCircle, Info } from '@phosphor-icons/react'
import './Settings.css' // Reuse Settings.css for consistent styling

function AccountSettings({ isOpen, onClose }) {
  const { currentUser, updateUserProfile, updateUserEmail, updateUserPassword } = useAuth()

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setErrorMessage('Bitte gib einen Namen ein')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await updateUserProfile(displayName)
      setSuccessMessage('Name erfolgreich aktualisiert!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Update name error:', err)
      setErrorMessage('Fehler beim Aktualisieren des Namens')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    if (!newEmail.trim() || !currentPassword.trim()) {
      setErrorMessage('Bitte fülle alle Felder aus')
      return
    }

    if (!newEmail.endsWith('@mvl-gym.de')) {
      setErrorMessage('Bitte verwende eine @mvl-gym.de E-Mail-Adresse')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await updateUserEmail(newEmail, currentPassword)
      setSuccessMessage('E-Mail erfolgreich aktualisiert! Bitte bestätige die neue E-Mail-Adresse.')
      setNewEmail('')
      setCurrentPassword('')
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Update email error:', err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Falsches aktuelles Passwort')
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('Diese E-Mail-Adresse wird bereits verwendet')
      } else {
        setErrorMessage(err.message || 'Fehler beim Aktualisieren der E-Mail')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setErrorMessage('Bitte fülle alle Felder aus')
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage('Das neue Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Die neuen Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await updateUserPassword(currentPassword, newPassword)
      setSuccessMessage('Passwort erfolgreich aktualisiert!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Update password error:', err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Falsches aktuelles Passwort')
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Das neue Passwort ist zu schwach')
      } else {
        setErrorMessage(err.message || 'Fehler beim Aktualisieren des Passworts')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Account Settings Panel */}
          <motion.div
            className="settings-panel"
            initial={{ opacity: 0, x: 300, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 300, scale: 0.9, filter: "blur(10px)" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
          >
            {/* Header */}
            <motion.div
              className="settings-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 28,
                delay: 0.1
              }}
            >
              <h2>Account-Einstellungen</h2>
              <motion.button
                className="close-btn"
                onClick={onClose}
                whileHover={{
                  rotate: 90,
                  scale: 1.1,
                  transition: { type: "spring", stiffness: 400, damping: 18 }
                }}
                whileTap={{
                  scale: 0.9
                }}
              >
                <X weight="bold" />
              </motion.button>
            </motion.div>

            {/* Content */}
            <div className="settings-content">
              {/* Success/Error Messages */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    className="settings-info"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderColor: '#10b981',
                      color: '#10b981'
                    }}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 25
                    }}
                  >
                    <CheckCircle weight="bold" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    className="settings-info"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderColor: '#ef4444',
                      color: '#ef4444'
                    }}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 25
                    }}
                  >
                    <Info weight="bold" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name Section */}
              <motion.div
                className="settings-section"
                initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  delay: 0.15
                }}
              >
                <h3><User weight="bold" /> Name ändern</h3>
                <form onSubmit={handleUpdateName}>
                  <div className="setting-group">
                    <label className="setting-label" htmlFor="displayName">Name</label>
                    <motion.input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Dein Name"
                      className="form-input"
                      autoComplete="name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                      whileFocus={{
                        scale: 1.01,
                        borderColor: 'var(--primary)',
                        transition: { type: "spring", stiffness: 350, damping: 25 }
                      }}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '12px' }}
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                      transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    whileTap={{
                      scale: 0.98
                    }}
                  >
                    {loading ? 'Wird aktualisiert...' : 'Name aktualisieren'}
                  </motion.button>
                </form>
              </motion.div>

              {/* Email Section */}
              <motion.div
                className="settings-section"
                initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  delay: 0.2
                }}
              >
                <h3><EnvelopeSimple weight="bold" /> E-Mail ändern</h3>
                <div className="settings-info">
                  <Info weight="bold" />
                  <span>Aktuelle E-Mail: {currentUser?.email}</span>
                </div>
                <form onSubmit={handleUpdateEmail}>
                  <div className="setting-group">
                    <label className="setting-label" htmlFor="newEmail">Neue E-Mail (@mvl-gym.de)</label>
                    <motion.input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="neue.email@mvl-gym.de"
                      className="form-input"
                      autoComplete="email"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                      whileFocus={{
                        scale: 1.01,
                        borderColor: 'var(--primary)',
                        transition: { type: "spring", stiffness: 350, damping: 25 }
                      }}
                    />
                    <label className="setting-label" htmlFor="currentPasswordForEmail">Aktuelles Passwort</label>
                    <motion.input
                      id="currentPasswordForEmail"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Dein aktuelles Passwort"
                      className="form-input"
                      autoComplete="current-password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                      whileFocus={{
                        scale: 1.01,
                        borderColor: 'var(--primary)',
                        transition: { type: "spring", stiffness: 350, damping: 25 }
                      }}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '12px' }}
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                      transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    whileTap={{
                      scale: 0.98
                    }}
                  >
                    {loading ? 'Wird aktualisiert...' : 'E-Mail aktualisieren'}
                  </motion.button>
                </form>
              </motion.div>

              {/* Password Section */}
              <motion.div
                className="settings-section"
                initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  delay: 0.25
                }}
              >
                <h3><Lock weight="bold" /> Passwort ändern</h3>
                <form onSubmit={handleUpdatePassword}>
                  <div className="setting-group">
                    <label className="setting-label" htmlFor="currentPasswordForPassword">Aktuelles Passwort</label>
                    <motion.input
                      id="currentPasswordForPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Dein aktuelles Passwort"
                      className="form-input"
                      autoComplete="current-password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                      whileFocus={{
                        scale: 1.01,
                        borderColor: 'var(--primary)',
                        transition: { type: "spring", stiffness: 350, damping: 25 }
                      }}
                    />
                    <label className="setting-label" htmlFor="newPassword">Neues Passwort</label>
                    <motion.input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className="form-input"
                      autoComplete="new-password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                      whileFocus={{
                        scale: 1.01,
                        borderColor: 'var(--primary)',
                        transition: { type: "spring", stiffness: 350, damping: 25 }
                      }}
                    />
                    <label className="setting-label" htmlFor="confirmNewPassword">Neues Passwort bestätigen</label>
                    <motion.input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Neues Passwort wiederholen"
                      className="form-input"
                      autoComplete="new-password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                      whileFocus={{
                        scale: 1.01,
                        borderColor: 'var(--primary)',
                        transition: { type: "spring", stiffness: 350, damping: 25 }
                      }}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '12px' }}
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                      transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    whileTap={{
                      scale: 0.98
                    }}
                  >
                    {loading ? 'Wird aktualisiert...' : 'Passwort aktualisieren'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AccountSettings
