import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import './App.css'
import Login from './components/Login'
import Settings from './components/Settings'
import StatsPopover from './components/StatsPopover'
import ParticleExplosion from './components/ParticleExplosion'
import LearningPlan from './components/LearningPlan'
import { logTask } from './utils/taskLogger'

// Dummy-Daten
const topics = [
  {
    id: 1,
    title: 'Analysis',
    icon: '📈',
    description: 'Ableitungen, Kurvendiskussion, Integrale und Extremwertprobleme',
    progress: 65,
    completed: 13,
    total: 20,
    level: 'AFB II-III'
  },
  {
    id: 2,
    title: 'Analytische Geometrie',
    icon: '📐',
    description: 'Vektoren, Geraden, Ebenen und Lagebeziehungen im Raum',
    progress: 40,
    completed: 8,
    total: 20,
    level: 'AFB II'
  },
  {
    id: 3,
    title: 'Stochastik',
    icon: '🎲',
    description: 'Wahrscheinlichkeiten, Binomial- und Normalverteilung',
    progress: 25,
    completed: 5,
    total: 20,
    level: 'AFB I-II'
  }
]

const sampleTask = {
  id: 1,
  topic: 'Analysis',
  title: 'Extremwertaufgabe',
  difficulty: 'AFB III',
  question: 'Aus einem rechteckigen Karton (40 cm × 30 cm) soll durch Herausschneiden von Quadraten an den Ecken und anschließendes Hochbiegen eine oben offene Schachtel entstehen. Bestimme die Seitenlänge x der auszuschneidenden Quadrate so, dass das Volumen der Schachtel maximal wird.',
  hints: [
    { level: 1, text: 'Stelle zunächst eine Funktion V(x) für das Volumen auf. Welche Maße hat die Schachtel nach dem Hochbiegen?' },
    { level: 2, text: 'V(x) = x · (40-2x) · (30-2x). Bestimme nun die erste Ableitung V\'(x) und setze sie gleich null.' },
    { level: 3, text: 'V\'(x) = 12x² - 280x + 1200 = 0. Löse mit der pq-Formel oder abc-Formel. Prüfe, welche Lösung im Definitionsbereich liegt und ob es ein Maximum ist.' }
  ],
  solution: 'x ≈ 5,85 cm',
  xpReward: 50
}

const defaultSettings = {
  theme: {
    name: 'Orange',
    primary: '#f97316'
  },
  aiModel: {
    detailLevel: 50,
    temperature: 0.5,
    helpfulness: 50,
    autoMode: true
  },
  gradeLevel: 'Klasse_11',
  courseType: 'Leistungsfach'
}

function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  // View State
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'task'
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [unlockedHints, setUnlockedHints] = useState([])
  const [feedback, setFeedback] = useState(null)

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)

  // Popover State
  const [statsPopoverOpen, setStatsPopoverOpen] = useState(false)
  const statsRef = useRef(null)

  // Learning Plan State
  const [learningPlanOpen, setLearningPlanOpen] = useState(false)

  // Navigation Dropdown State
  const [navDropdownOpen, setNavDropdownOpen] = useState(false)

  // Gamification State
  const [userStats, setUserStats] = useState({
    level: 7,
    xp: 1250,
    xpToNextLevel: 1500,
    streak: 12,
    totalXp: 3420
  })

  // Physics-based animation state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseX = useSpring(0, { stiffness: 50, damping: 20 })
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 })

  // Define transforms at the top level (not inside JSX)
  const containerX = useTransform(mouseX, [-50, 50], [-5, 5])
  const containerY = useTransform(mouseY, [-50, 50], [-5, 5])

  // Particle explosion state
  const [showParticleExplosion, setShowParticleExplosion] = useState(false)

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      setMousePosition({ x, y })
      mouseX.set(x * 50)
      mouseY.set(y * 50)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('mathapp_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      // Apply theme on load
      if (parsed.theme) {
        document.documentElement.style.setProperty('--primary', parsed.theme.primary)
      }
    }

    // Check if user is logged in (simple session check)
    const savedUser = sessionStorage.getItem('mathapp_user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setIsLoggedIn(true)
      setUser(userData)
      setUserStats(userData)
    }
  }, [])

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    setUserStats(userData)
    sessionStorage.setItem('mathapp_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    sessionStorage.removeItem('mathapp_user')
    setCurrentView('dashboard')
  }

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings)
    localStorage.setItem('mathapp_settings', JSON.stringify(newSettings))
  }

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic)
    setCurrentView('task')
    setUserAnswer('')
    setUnlockedHints([])
    setFeedback(null)
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedTopic(null)
  }

  const unlockHint = (hintLevel) => {
    if (!unlockedHints.includes(hintLevel)) {
      setUnlockedHints([...unlockedHints, hintLevel])
    }
  }

  const checkAnswer = () => {
    const isCorrect = userAnswer.toLowerCase().includes('5,8') ||
                     userAnswer.toLowerCase().includes('5.8') ||
                     userAnswer.toLowerCase().includes('5,85') ||
                     userAnswer.toLowerCase().includes('5.85')

    // Log task performance
    const taskStartTime = Date.now() // In real app, track when task started
    logTask({
      taskId: sampleTask.id,
      topicId: selectedTopic?.id,
      difficulty: sampleTask.difficulty,
      correct: isCorrect,
      timeSpent: 0, // Would track actual time in real app
      hintsUsed: unlockedHints.length,
      xpEarned: isCorrect ? sampleTask.xpReward : 0,
      userAnswer: userAnswer,
      gradeLevel: settings.gradeLevel,
      courseType: settings.courseType
    })

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: '🎉 Richtig! Ausgezeichnete Arbeit! Die optimale Seitenlänge beträgt etwa 5,85 cm.',
        xp: sampleTask.xpReward
      })
      // Update XP
      setUserStats(prev => ({
        ...prev,
        xp: prev.xp + sampleTask.xpReward,
        totalXp: prev.totalXp + sampleTask.xpReward
      }))
      // Trigger particle explosion
      setShowParticleExplosion(true)
      setTimeout(() => setShowParticleExplosion(false), 100)
    } else {
      setFeedback({
        type: 'error',
        message: '🤔 Das ist noch nicht ganz richtig. Versuche es nochmal oder nutze einen Hinweis!'
      })
    }
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      {/* Header */}
      <motion.header
        className="header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        <motion.div
          className="logo"
          onClick={() => setNavDropdownOpen(!navDropdownOpen)}
          style={{ cursor: 'pointer' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="logo-icon">📚</span>
          <span>MatheLernApp</span>
          <motion.span
            className="dropdown-arrow"
            animate={{ rotate: navDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </motion.div>
      </motion.header>

      {/* Navigation Dropdown */}
      <AnimatePresence>
        {navDropdownOpen && (
          <motion.div
            className="nav-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              className="nav-dropdown-item"
              onClick={() => {
                setLearningPlanOpen(true)
                setNavDropdownOpen(false)
              }}
              whileHover={{ x: 4 }}
            >
              <span className="nav-item-icon">📚</span>
              <span className="nav-item-label">Lernplan</span>
            </motion.button>
            <motion.button
              className="nav-dropdown-item"
              onClick={() => {
                setSettingsOpen(true)
                setNavDropdownOpen(false)
              }}
              whileHover={{ x: 4 }}
            >
              <span className="nav-item-icon">⚙️</span>
              <span className="nav-item-label">Einstellungen</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="container"
        style={{
          x: containerX,
          y: containerY
        }}
      >
        {currentView === 'dashboard' ? (
          <>
            {/* Stats Dashboard */}
            <motion.div
              className="stats-dashboard-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <div className="stats-dashboard">
                {/* Top Row: 3 Cards */}
                <div className="stats-grid-top">
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="stat-icon">🔥</div>
                    <div className="stat-content">
                      <div className="stat-value">{userStats.streak} Tage</div>
                      <div className="stat-label">Streak</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                      <div className="stat-value">Level {userStats.level}</div>
                      <div className="stat-label">Dein Level</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="stat-icon">💎</div>
                    <div className="stat-content">
                      <div className="stat-value">{userStats.totalXp.toLocaleString()}</div>
                      <div className="stat-label">Gesamt XP</div>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Row: XP Card with Path */}
                <motion.div
                  className="stat-card-wide"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="xp-card-content">
                    <div className="xp-header">
                      <div className="stat-icon-large">⚡</div>
                      <div className="xp-info-main">
                        <div className="stat-value">{userStats.xp.toLocaleString()} XP</div>
                        <div className="stat-label">Aktuelle XP · {(userStats.xpToNextLevel - userStats.xp).toLocaleString()} XP bis Level {userStats.level + 1}</div>
                      </div>
                    </div>

                    {/* XP Progression Path */}
                    <motion.div
                      className="xp-path"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="path-track">
                        {[
                          { level: userStats.level, xp: 0, label: 'Aktuell', icon: '📍', active: true },
                          { level: userStats.level + 1, xp: userStats.xpToNextLevel, label: `Level ${userStats.level + 1}`, icon: '🎯', active: false },
                          { level: userStats.level + 2, xp: userStats.xpToNextLevel * 2.2, label: `Level ${userStats.level + 2}`, icon: '⭐', active: false },
                          { level: userStats.level + 3, xp: userStats.xpToNextLevel * 3.5, label: `Level ${userStats.level + 3}`, icon: '🏆', active: false }
                        ].map((milestone, index) => {
                          const isReached = index === 0
                          const progressPercent = (userStats.xp / userStats.xpToNextLevel) * 100
                          const progress = index === 0 ? 100 : (index === 1 ? progressPercent : 0)
                          const xpNeeded = userStats.xpToNextLevel - userStats.xp

                          return (
                            <motion.div
                              key={milestone.level}
                              className={`path-milestone ${isReached ? 'reached' : ''} ${milestone.active ? 'active' : ''}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <div className="milestone-icon">{milestone.icon}</div>
                              <div className="milestone-label">{milestone.label}</div>
                              {index < 3 && (
                                <div className="milestone-connector">
                                  <motion.div
                                    className="connector-fill"
                                    initial={{ width: '0%' }}
                                    animate={{ width: index === 0 ? `${progress}%` : '0%' }}
                                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                  />
                                </div>
                              )}
                              {index === 1 && (
                                <div className="milestone-xp">{xpNeeded.toLocaleString()} XP</div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Topics Grid */}
            <motion.div
              className="topics-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3
              }}
            >
              <AnimatePresence>
                {topics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    className="card topic-card"
                    whileHover={{
                      scale: 1.02,
                      y: -4,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }
                    }}
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: 0.95
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: index * 0.05
                    }}
                    onClick={() => handleTopicClick(topic)}
                  >
                    <div className="topic-header">
                      <span className="topic-icon">{topic.icon}</span>
                      <div className="topic-info">
                        <h2 className="topic-title">{topic.title}</h2>
                        <div className="topic-meta">
                          <span>{topic.level}</span>
                          <span>•</span>
                          <span>{topic.total} Aufgaben</span>
                        </div>
                      </div>
                    </div>

                    <div className="topic-progress">
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.progress}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 15,
                            delay: index * 0.2 + 0.3
                          }}
                        />
                      </div>
                      <div className="progress-text">
                        {topic.completed} von {topic.total} abgeschlossen
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        ) : (
          /* Task View */
          <motion.div
            className="task-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <motion.div
              className="task-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <motion.button
                className="back-btn"
                onClick={handleBackToDashboard}
                whileHover={{
                  x: -4,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <span>←</span>
                <span>Zurück zur Übersicht</span>
              </motion.button>
              <div className="stat">
                <span className="stat-icon">💎</span>
                <span>+{sampleTask.xpReward} XP</span>
              </div>
            </motion.div>

            <div className="task-content">
              <motion.div
                className="task-main"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.1
                }}
              >
                <div className="card">
                  <h2>{sampleTask.title}</h2>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: 'rgba(249, 115, 22, 0.2)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginTop: '8px',
                      marginBottom: '16px',
                      color: 'var(--secondary)'
                    }}
                  >
                    {sampleTask.difficulty}
                  </div>
                  <p className="task-question">{sampleTask.question}</p>

                  <motion.textarea
                    className="task-input"
                    placeholder="Deine Lösung hier eingeben... (z.B. x = 5,85 cm)"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    whileFocus={{
                      scale: 1.02,
                      boxShadow: "0 0 30px rgba(249, 115, 22, 0.4)",
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                  />

                  <div className="task-actions">
                    <motion.button
                      className="btn btn-primary"
                      onClick={checkAnswer}
                      whileHover={{
                        scale: 1.03,
                        y: -2,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }
                      }}
                      whileTap={{
                        scale: 0.98
                      }}
                    >
                      <span>✓</span>
                      <span>Lösung prüfen</span>
                    </motion.button>
                    <motion.button
                      className="btn btn-secondary"
                      whileHover={{
                        scale: 1.02,
                        y: -2,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }
                      }}
                      whileTap={{
                        scale: 0.98
                      }}
                    >
                      <span>⏭</span>
                      <span>Aufgabe überspringen</span>
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        className={`feedback ${feedback.type}`}
                        initial={{
                          opacity: 0,
                          y: -20,
                          scale: 0.95
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1
                        }}
                        exit={{
                          opacity: 0,
                          y: -20,
                          scale: 0.95,
                          transition: { duration: 0.2 }
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                          {feedback.message}
                        </div>
                        {feedback.xp && (
                          <motion.div
                            style={{ fontSize: '14px', opacity: 0.9 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            +{feedback.xp} XP erhalten! 🎊
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Tutor Panel */}
              <motion.div
                className="tutor-panel card"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.2
                }}
              >
                <div className="tutor-header">
                  <span>💡</span>
                  <span>KI-Tutor Hinweise</span>
                </div>

                <div className="hint-levels">
                  {sampleTask.hints.map((hint, index) => (
                    <motion.div
                      key={hint.level}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: index * 0.05 + 0.3
                      }}
                    >
                      <motion.button
                        className="hint-btn"
                        onClick={() => unlockHint(hint.level)}
                        disabled={unlockedHints.includes(hint.level)}
                        whileHover={!unlockedHints.includes(hint.level) ? {
                          scale: 1.02,
                          x: 4,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                          }
                        } : {}}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>Hinweis {hint.level}</span>
                        <span>{unlockedHints.includes(hint.level) ? '✓' : '→'}</span>
                      </motion.button>
                      <AnimatePresence>
                        {unlockedHints.includes(hint.level) && (
                          <motion.div
                            className="hint-content"
                            initial={{
                              opacity: 0,
                              height: 0
                            }}
                            animate={{
                              opacity: 1,
                              height: "auto"
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              transition: { duration: 0.2 }
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30
                            }}
                          >
                            {hint.text}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: 'rgba(249, 115, 22, 0.05)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  💬 Tipp: Nutze die Hinweise schrittweise, wenn du nicht weiterkommst.
                  Das Ziel ist, den Lösungsweg zu verstehen!
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <StatsPopover
        isOpen={statsPopoverOpen}
        onClose={() => setStatsPopoverOpen(false)}
        userStats={userStats}
        anchorRef={statsRef}
      />

      <LearningPlan
        isOpen={learningPlanOpen}
        onClose={() => setLearningPlanOpen(false)}
        userSettings={settings}
      />

      <ParticleExplosion
        trigger={showParticleExplosion}
        onComplete={() => setShowParticleExplosion(false)}
      />
    </div>
  )
}

export default App
