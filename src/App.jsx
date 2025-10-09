import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import './App.css'
import Login from './components/Login'
import Settings from './components/Settings'
import StatsPopover from './components/StatsPopover'
import ParticleExplosion from './components/ParticleExplosion'

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
    detailLevel: 70,
    temperature: 0.7,
    helpfulness: 80
  }
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
  }, [])

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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 20,
          mass: 1.5
        }}
      >
        <motion.div
          className="logo"
          whileHover={{
            scale: 1.1,
            rotateZ: [0, -5, 5, 0],
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 10
            }
          }}
          animate={{
            y: [0, -3, 0],
            transition: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
        >
          <motion.span
            className="logo-icon"
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            📚
          </motion.span>
          <span>MatheLernApp</span>
        </motion.div>
        <div className="header-actions">
          <motion.button
            ref={statsRef}
            className="stats-btn"
            onClick={() => setStatsPopoverOpen(!statsPopoverOpen)}
            whileHover={{
              scale: 1.1,
              rotateZ: [0, -3, 3, 0],
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 10
              }
            }}
            whileTap={{
              scale: 0.9,
              rotateZ: 10
            }}
            animate={{
              boxShadow: [
                "0 0 0px rgba(249, 115, 22, 0.2)",
                "0 0 20px rgba(249, 115, 22, 0.4)",
                "0 0 0px rgba(249, 115, 22, 0.2)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <motion.span
              className="stats-level"
              animate={{
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              Level {userStats.level}
            </motion.span>
            <motion.span
              className="stats-streak"
              animate={{
                scale: [1, 1.3, 1],
                rotateZ: [0, -10, 10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              🔥 {userStats.streak}
            </motion.span>
          </motion.button>
          <motion.button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            title="Einstellungen"
            whileHover={{
              scale: 1.2,
              rotateZ: 180,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 10
              }
            }}
            whileTap={{
              scale: 0.8,
              rotateZ: 360
            }}
            animate={{
              rotateZ: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            ⚙️
          </motion.button>
        </div>
      </motion.header>

      <motion.div
        className="container"
        style={{
          x: useTransform(mouseX, [-50, 50], [-10, 10]),
          y: useTransform(mouseY, [-50, 50], [-10, 10])
        }}
      >
        {currentView === 'dashboard' ? (
          <>
            {/* Topics Grid */}
            <motion.div
              className="topics-grid"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 1.5
              }}
            >
              <AnimatePresence>
                {topics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    className="card topic-card"
                    drag
                    dragElastic={0.3}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragTransition={{
                      bounceStiffness: 600,
                      bounceDamping: 20,
                      power: 0.2
                    }}
                    whileHover={{
                      scale: 1.1,
                      rotateZ: [-2, 2, -2, 0],
                      rotateX: mousePosition.y * 20,
                      rotateY: mousePosition.x * 20,
                      z: 100,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 10
                      }
                    }}
                    whileTap={{
                      scale: 0.85,
                      rotateZ: 5,
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 15
                      }
                    }}
                    initial={{
                      opacity: 0,
                      y: 100,
                      rotateX: -90,
                      scale: 0.5
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      scale: 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: index * 0.1,
                      mass: 2
                    }}
                    onClick={() => handleTopicClick(topic)}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: 1000
                    }}
                  >
                    <motion.div
                      className="topic-header"
                      whileHover={{
                        x: [0, -5, 5, -5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <motion.span
                        className="topic-icon"
                        animate={{
                          rotateZ: [0, -10, 10, -10, 0],
                          scale: [1, 1.2, 1, 1.2, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        {topic.icon}
                      </motion.span>
                      <div className="topic-info">
                        <h2 className="topic-title">{topic.title}</h2>
                        <div className="topic-meta">
                          <span>{topic.level}</span>
                          <span>•</span>
                          <span>{topic.total} Aufgaben</span>
                        </div>
                      </div>
                    </motion.div>

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
            initial={{ opacity: 0, scale: 0.9, rotateX: -30 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: 30 }}
            transition={{
              type: "spring",
              stiffness: 150,
              damping: 20,
              mass: 1.5
            }}
          >
            <motion.div
              className="task-header"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <motion.button
                className="back-btn"
                onClick={handleBackToDashboard}
                whileHover={{
                  scale: 1.1,
                  x: -10,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.9, x: -15 }}
              >
                <span>←</span>
                <span>Zurück zur Übersicht</span>
              </motion.button>
              <motion.div
                className="stat"
                animate={{
                  scale: [1, 1.2, 1],
                  rotateZ: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <span className="stat-icon">💎</span>
                <span>+{sampleTask.xpReward} XP</span>
              </motion.div>
            </motion.div>

            <div className="task-content">
              <motion.div
                className="task-main"
                initial={{ x: -100, opacity: 0, rotateY: -45 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.1
                }}
              >
                <motion.div
                  className="card"
                  whileHover={{
                    scale: 1.02,
                    rotateZ: [0, 1, -1, 0],
                    transition: { type: "spring", stiffness: 300, damping: 15 }
                  }}
                >
                  <h2>{sampleTask.title}</h2>
                  <motion.div
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
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0px rgba(249, 115, 22, 0.3)",
                        "0 0 20px rgba(249, 115, 22, 0.5)",
                        "0 0 0px rgba(249, 115, 22, 0.3)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    {sampleTask.difficulty}
                  </motion.div>
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
                        scale: 1.15,
                        rotateZ: [0, -3, 3, 0],
                        boxShadow: "0 15px 40px rgba(249, 115, 22, 0.6)",
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 10
                        }
                      }}
                      whileTap={{
                        scale: 0.85,
                        rotateZ: 10,
                        transition: {
                          type: "spring",
                          stiffness: 500,
                          damping: 15
                        }
                      }}
                      animate={{
                        y: [0, -5, 0],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      <span>✓</span>
                      <span>Lösung prüfen</span>
                    </motion.button>
                    <motion.button
                      className="btn btn-secondary"
                      whileHover={{
                        scale: 1.1,
                        x: 10,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 10
                        }
                      }}
                      whileTap={{
                        scale: 0.9,
                        x: 15
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
                          scale: 0.3,
                          y: -50,
                          rotateX: -90
                        }}
                        animate={{
                          opacity: 1,
                          scale: [0.3, 1.2, 1],
                          y: 0,
                          rotateX: 0,
                          rotateZ: feedback.type === 'success' ? [0, -5, 5, -5, 0] : 0
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.3,
                          y: 50,
                          transition: { duration: 0.3 }
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          mass: 1
                        }}
                      >
                        <motion.div
                          style={{ fontWeight: '600', marginBottom: '8px' }}
                          animate={feedback.type === 'success' ? {
                            scale: [1, 1.05, 1],
                            transition: {
                              duration: 0.5,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }
                          } : {}}
                        >
                          {feedback.message}
                        </motion.div>
                        {feedback.xp && (
                          <motion.div
                            style={{ fontSize: '14px', opacity: 0.9 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                              opacity: 1,
                              y: [0, -5, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{
                              delay: 0.2,
                              type: "spring",
                              stiffness: 200,
                              damping: 10
                            }}
                          >
                            +{feedback.xp} XP erhalten! 🎊
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Tutor Panel */}
              <motion.div
                className="tutor-panel card"
                initial={{ x: 100, opacity: 0, rotateY: 45 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.2
                }}
                whileHover={{
                  scale: 1.02,
                  rotateZ: [0, -1, 1, 0],
                  transition: { type: "spring", stiffness: 300, damping: 15 }
                }}
              >
                <motion.div
                  className="tutor-header"
                  animate={{
                    x: [0, 5, 0],
                    transition: {
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }
                  }}
                >
                  <motion.span
                    animate={{
                      rotateZ: [0, -10, 10, -10, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    💡
                  </motion.span>
                  <span>KI-Tutor Hinweise</span>
                </motion.div>

                <div className="hint-levels">
                  {sampleTask.hints.map((hint, index) => (
                    <motion.div
                      key={hint.level}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 150,
                        damping: 20,
                        delay: index * 0.1 + 0.3
                      }}
                    >
                      <motion.button
                        className="hint-btn"
                        onClick={() => unlockHint(hint.level)}
                        disabled={unlockedHints.includes(hint.level)}
                        whileHover={!unlockedHints.includes(hint.level) ? {
                          scale: 1.05,
                          x: 10,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 10
                          }
                        } : {}}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>Hinweis {hint.level}</span>
                        <motion.span
                          animate={unlockedHints.includes(hint.level) ? {
                            rotateZ: [0, 360],
                            transition: { duration: 0.5 }
                          } : {}}
                        >
                          {unlockedHints.includes(hint.level) ? '✓' : '→'}
                        </motion.span>
                      </motion.button>
                      <AnimatePresence>
                        {unlockedHints.includes(hint.level) && (
                          <motion.div
                            className="hint-content"
                            initial={{
                              opacity: 0,
                              height: 0,
                              scale: 0.8,
                              y: -20
                            }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                              scale: 1,
                              y: 0
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              scale: 0.8,
                              transition: { duration: 0.2 }
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 20
                            }}
                          >
                            {hint.text}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: 'rgba(249, 115, 22, 0.05)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(249, 115, 22, 0.1)",
                      "0 0 15px rgba(249, 115, 22, 0.2)",
                      "0 0 0px rgba(249, 115, 22, 0.1)"
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  💬 Tipp: Nutze die Hinweise schrittweise, wenn du nicht weiterkommst.
                  Das Ziel ist, den Lösungsweg zu verstehen!
                </motion.div>
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

      <ParticleExplosion
        trigger={showParticleExplosion}
        onComplete={() => setShowParticleExplosion(false)}
      />
    </div>
  )
}

export default App
