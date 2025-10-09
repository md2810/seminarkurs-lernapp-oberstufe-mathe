import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import Settings from './components/Settings'
import AccountSettings from './components/AccountSettings'
import StatsPopover from './components/StatsPopover'
import ParticleExplosion from './components/ParticleExplosion'
import LearningPlan from './components/LearningPlan'
import { logTask } from './utils/taskLogger'
import {
  initializeUserProfile,
  updateUserStats,
  updateUserSettings,
  addTaskToHistory,
  subscribeToUserData,
  updateStreak
} from './firebase/firestore'
import {
  BookOpenText,
  CaretDown,
  CaretRight,
  Books,
  Gear,
  Fire,
  Trophy,
  Diamond,
  Lightning,
  MapPin,
  Target,
  Star,
  TrendUp,
  Ruler,
  DiceSix,
  Lightbulb,
  Check,
  FastForward,
  ArrowLeft,
  SignOut,
  UserCircle
} from '@phosphor-icons/react'

// Dummy-Daten
const topics = [
  {
    id: 1,
    title: 'Analysis',
    icon: TrendUp,
    description: 'Ableitungen, Kurvendiskussion, Integrale und Extremwertprobleme',
    progress: 65,
    completed: 13,
    total: 20,
    level: 'AFB II-III'
  },
  {
    id: 2,
    title: 'Analytische Geometrie',
    icon: Ruler,
    description: 'Vektoren, Geraden, Ebenen und Lagebeziehungen im Raum',
    progress: 40,
    completed: 8,
    total: 20,
    level: 'AFB II'
  },
  {
    id: 3,
    title: 'Stochastik',
    icon: DiceSix,
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
  const { currentUser, logout } = useAuth()

  // Auth View State: 'login' | 'register' | 'email-verification'
  const [authView, setAuthView] = useState('login')

  // View State
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'task'
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [unlockedHints, setUnlockedHints] = useState([])
  const [feedback, setFeedback] = useState(null)

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)

  // Popover State
  const [statsPopoverOpen, setStatsPopoverOpen] = useState(false)
  const statsRef = useRef(null)

  // Learning Plan State
  const [learningPlanOpen, setLearningPlanOpen] = useState(false)

  // Navigation Dropdown State
  const [navDropdownOpen, setNavDropdownOpen] = useState(false)

  // Gamification State - Initialize from Firebase user or defaults
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 0,
    totalXp: 0
  })

  // Physics-based animation state - Ultra smooth settings
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mouseX = useSpring(0, { stiffness: 80, damping: 25, mass: 0.5 })
  const mouseY = useSpring(0, { stiffness: 80, damping: 25, mass: 0.5 })

  // Define transforms at the top level (not inside JSX) - Enhanced parallax
  const containerX = useTransform(mouseX, [-50, 50], [-8, 8])
  const containerY = useTransform(mouseY, [-50, 50], [-8, 8])

  // Smooth scroll-based animations
  const [scrollY, setScrollY] = useState(0)
  const scrollSpring = useSpring(scrollY, { stiffness: 100, damping: 30 })

  // Particle explosion state
  const [showParticleExplosion, setShowParticleExplosion] = useState(false)

  // Enhanced parallax effect with smooth physics
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      setMousePosition({ x, y })
      mouseX.set(x * 50)
      mouseY.set(y * 50)
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
      scrollSpring.set(window.scrollY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [mouseX, mouseY, scrollSpring])

  // Load/initialize user data from Firestore and set up real-time sync
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) {
      return
    }

    let unsubscribe = null

    const setupUserData = async () => {
      try {
        // Initialize user profile if first time
        await initializeUserProfile(currentUser.uid, {
          displayName: currentUser.displayName,
          email: currentUser.email
        })

        // Update streak
        await updateStreak(currentUser.uid)

        // Subscribe to real-time updates
        unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          if (userData) {
            // Update stats
            if (userData.stats) {
              setUserStats(userData.stats)
            }

            // Update settings
            if (userData.settings) {
              setSettings(userData.settings)
              // Apply theme
              if (userData.settings.theme) {
                document.documentElement.style.setProperty('--primary', userData.settings.theme.primary)
              }
            }
          }
        })
      } catch (error) {
        console.error('Error setting up user data:', error)
        // Fallback to localStorage
        const userStatsKey = `mathapp_stats_${currentUser.uid}`
        const savedStats = localStorage.getItem(userStatsKey)
        if (savedStats) {
          setUserStats(JSON.parse(savedStats))
        }
      }
    }

    setupUserData()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentUser])

  const handleLogout = async () => {
    try {
      await logout()
      setCurrentView('dashboard')
      setAuthView('login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleSettingsChange = async (newSettings) => {
    setSettings(newSettings)

    // Save to Firestore
    if (currentUser) {
      try {
        await updateUserSettings(currentUser.uid, newSettings)
        console.log('Settings saved to Firestore')
      } catch (error) {
        console.error('Error saving settings:', error)
        // Fallback to localStorage
        localStorage.setItem('mathapp_settings', JSON.stringify(newSettings))
      }
    }
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

  const checkAnswer = async () => {
    const isCorrect = userAnswer.toLowerCase().includes('5,8') ||
                     userAnswer.toLowerCase().includes('5.8') ||
                     userAnswer.toLowerCase().includes('5,85') ||
                     userAnswer.toLowerCase().includes('5.85')

    // Prepare task data
    const taskData = {
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
    }

    // Log task performance (console logging)
    logTask(taskData)

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: '🎉 Richtig! Ausgezeichnete Arbeit! Die optimale Seitenlänge beträgt etwa 5,85 cm.',
        xp: sampleTask.xpReward
      })

      // Calculate new stats
      const newStats = {
        ...userStats,
        xp: userStats.xp + sampleTask.xpReward,
        totalXp: userStats.totalXp + sampleTask.xpReward
      }

      // Check for level up
      if (newStats.xp >= newStats.xpToNextLevel) {
        newStats.level += 1
        newStats.xp = newStats.xp - newStats.xpToNextLevel
        newStats.xpToNextLevel = Math.floor(newStats.xpToNextLevel * 1.5)
      }

      // Update local state
      setUserStats(newStats)

      // Save to Firestore
      if (currentUser) {
        try {
          await updateUserStats(currentUser.uid, newStats)
          await addTaskToHistory(currentUser.uid, taskData)
          console.log('Stats and task history saved to Firestore')
        } catch (error) {
          console.error('Error saving to Firestore:', error)
          // Fallback to localStorage
          localStorage.setItem(`mathapp_stats_${currentUser.uid}`, JSON.stringify(newStats))
        }
      }

      // Trigger particle explosion
      setShowParticleExplosion(true)
      setTimeout(() => setShowParticleExplosion(false), 100)
    } else {
      setFeedback({
        type: 'error',
        message: '🤔 Das ist noch nicht ganz richtig. Versuche es nochmal oder nutze einen Hinweis!'
      })

      // Still save incorrect attempt to history
      if (currentUser) {
        try {
          await addTaskToHistory(currentUser.uid, taskData)
        } catch (error) {
          console.error('Error saving task to Firestore:', error)
        }
      }
    }
  }

  // Show auth views if user is not logged in or email not verified
  if (!currentUser || !currentUser.emailVerified) {
    if (authView === 'register') {
      return (
        <Register
          onSwitchToLogin={() => setAuthView('login')}
          onRegisterSuccess={() => setAuthView('email-verification')}
        />
      )
    }

    if (authView === 'email-verification') {
      return (
        <EmailVerification
          userEmail={currentUser?.email || ''}
          onBackToLogin={() => setAuthView('login')}
        />
      )
    }

    // Default to login view
    return (
      <Login
        onLogin={() => {
          // Login successful - component will auto-refresh when currentUser updates
        }}
        onSwitchToRegister={() => setAuthView('register')}
      />
    )
  }

  return (
    <div className="app">
      {/* Header with enhanced smooth animation */}
      <motion.header
        className="header"
        initial={{ y: -20, opacity: 0, filter: "blur(10px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 0.8
        }}
      >
        <motion.div
          className="logo"
          onClick={() => setNavDropdownOpen(!navDropdownOpen)}
          style={{ cursor: 'pointer' }}
          whileHover={{
            scale: 1.03,
            transition: { type: "spring", stiffness: 400, damping: 15 }
          }}
          whileTap={{
            scale: 0.97,
            transition: { type: "spring", stiffness: 500, damping: 20 }
          }}
        >
          <span className="logo-icon"><BookOpenText weight="bold" /></span>
          <span>MatheLernApp</span>
          <motion.span
            className="dropdown-arrow"
            animate={{ rotate: navDropdownOpen ? 180 : 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <CaretDown weight="bold" />
          </motion.span>
        </motion.div>
      </motion.header>

      {/* Navigation Dropdown with smooth physics */}
      <AnimatePresence>
        {navDropdownOpen && (
          <motion.div
            className="nav-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(5px)" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
          >
            <motion.button
              className="nav-dropdown-item"
              onClick={() => {
                setLearningPlanOpen(true)
                setNavDropdownOpen(false)
              }}
              whileHover={{
                x: 8,
                transition: { type: "spring", stiffness: 400, damping: 20 }
              }}
              whileTap={{
                scale: 0.98,
                x: 4
              }}
            >
              <span className="nav-item-icon"><Books weight="bold" /></span>
              <span className="nav-item-label">Lernplan</span>
            </motion.button>
            <motion.button
              className="nav-dropdown-item"
              onClick={() => {
                setAccountSettingsOpen(true)
                setNavDropdownOpen(false)
              }}
              whileHover={{
                x: 8,
                transition: { type: "spring", stiffness: 400, damping: 20 }
              }}
              whileTap={{
                scale: 0.98,
                x: 4
              }}
            >
              <span className="nav-item-icon"><UserCircle weight="bold" /></span>
              <span className="nav-item-label">Account</span>
            </motion.button>
            <motion.button
              className="nav-dropdown-item"
              onClick={() => {
                setSettingsOpen(true)
                setNavDropdownOpen(false)
              }}
              whileHover={{
                x: 8,
                transition: { type: "spring", stiffness: 400, damping: 20 }
              }}
              whileTap={{
                scale: 0.98,
                x: 4
              }}
            >
              <span className="nav-item-icon"><Gear weight="bold" /></span>
              <span className="nav-item-label">Einstellungen</span>
            </motion.button>
            <motion.button
              className="nav-dropdown-item"
              onClick={() => {
                handleLogout()
                setNavDropdownOpen(false)
              }}
              whileHover={{
                x: 8,
                transition: { type: "spring", stiffness: 400, damping: 20 }
              }}
              whileTap={{
                scale: 0.98,
                x: 4
              }}
              style={{ color: '#ef4444' }}
            >
              <span className="nav-item-icon"><SignOut weight="bold" /></span>
              <span className="nav-item-label">Abmelden</span>
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
            {/* Stats Dashboard with enhanced smooth entry */}
            <motion.div
              className="stats-dashboard-container"
              initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 28,
                mass: 0.9
              }}
            >
              <div className="stats-dashboard">
                {/* Top Row: 3 Cards with ultra smooth 3D effects */}
                <div className="stats-grid-top">
                  <motion.div
                    className="stat-card"
                    whileHover={{
                      y: -8,
                      scale: 1.04,
                      rotateX: 5,
                      transition: { type: "spring", stiffness: 400, damping: 20 }
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { type: "spring", stiffness: 500, damping: 25 }
                    }}
                    style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                  >
                    <div className="stat-icon"><Fire weight="bold" /></div>
                    <div className="stat-content">
                      <div className="stat-value">{userStats.streak} Tage</div>
                      <div className="stat-label">Streak</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{
                      y: -8,
                      scale: 1.04,
                      rotateX: 5,
                      transition: { type: "spring", stiffness: 400, damping: 20 }
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { type: "spring", stiffness: 500, damping: 25 }
                    }}
                    style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                  >
                    <div className="stat-icon"><Trophy weight="bold" /></div>
                    <div className="stat-content">
                      <div className="stat-value">Level {userStats.level}</div>
                      <div className="stat-label">Dein Level</div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{
                      y: -8,
                      scale: 1.04,
                      rotateX: 5,
                      transition: { type: "spring", stiffness: 400, damping: 20 }
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { type: "spring", stiffness: 500, damping: 25 }
                    }}
                    style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                  >
                    <div className="stat-icon"><Diamond weight="bold" /></div>
                    <div className="stat-content">
                      <div className="stat-value">{userStats.totalXp.toLocaleString()}</div>
                      <div className="stat-label">Gesamt XP</div>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Row: XP Card with Path - Smooth physics */}
                <motion.div
                  className="stat-card-wide"
                  whileHover={{
                    y: -6,
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 350, damping: 20 }
                  }}
                  whileTap={{
                    scale: 0.99,
                    transition: { type: "spring", stiffness: 500, damping: 25 }
                  }}
                >
                  <div className="xp-card-content">
                    <div className="xp-header">
                      <div className="stat-icon-large"><Lightning weight="bold" /></div>
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
                          { level: userStats.level, xp: 0, label: 'Aktuell', icon: MapPin, active: true },
                          { level: userStats.level + 1, xp: userStats.xpToNextLevel, label: `Level ${userStats.level + 1}`, icon: Target, active: false },
                          { level: userStats.level + 2, xp: userStats.xpToNextLevel * 2.2, label: `Level ${userStats.level + 2}`, icon: Star, active: false },
                          { level: userStats.level + 3, xp: userStats.xpToNextLevel * 3.5, label: `Level ${userStats.level + 3}`, icon: Trophy, active: false }
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
                              <div className="milestone-icon"><milestone.icon weight="bold" /></div>
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

            {/* Topics Grid with staggered smooth animations */}
            <motion.div
              className="topics-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 28,
                mass: 0.8
              }}
            >
              <AnimatePresence>
                {topics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    className="card topic-card"
                    whileHover={{
                      scale: 1.03,
                      y: -10,
                      rotateX: 3,
                      rotateY: -2,
                      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                      transition: {
                        type: "spring",
                        stiffness: 350,
                        damping: 18,
                        mass: 0.6
                      }
                    }}
                    whileTap={{
                      scale: 0.97,
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 25
                      }
                    }}
                    initial={{
                      opacity: 0,
                      y: 40,
                      scale: 0.92,
                      filter: "blur(8px)"
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: "blur(0px)"
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 250,
                      damping: 28,
                      mass: 0.8,
                      delay: index * 0.08
                    }}
                    style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                    onClick={() => handleTopicClick(topic)}
                  >
                    <div className="topic-header">
                      <span className="topic-icon"><topic.icon weight="bold" /></span>
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
                          initial={{ width: 0, opacity: 0.5 }}
                          animate={{ width: `${topic.progress}%`, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                            mass: 0.8,
                            delay: index * 0.15 + 0.4
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
          /* Task View with ultra smooth entry */
          <motion.div
            className="task-view"
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(10px)" }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 28,
              mass: 0.8
            }}
          >
            <motion.div
              className="task-header"
              initial={{ y: -20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 26,
                mass: 0.7
              }}
            >
              <motion.button
                className="back-btn"
                onClick={handleBackToDashboard}
                whileHover={{
                  x: -8,
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 400, damping: 18 }
                }}
                whileTap={{
                  scale: 0.96,
                  x: -4
                }}
              >
                <span><ArrowLeft weight="bold" /></span>
                <span>Zurück zur Übersicht</span>
              </motion.button>
              <div className="stat">
                <span className="stat-icon"><Diamond weight="bold" /></span>
                <span>+{sampleTask.xpReward} XP</span>
              </div>
            </motion.div>

            <div className="task-content">
              <motion.div
                className="task-main"
                initial={{ x: -60, opacity: 0, filter: "blur(8px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 28,
                  mass: 0.9,
                  delay: 0.05
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
                      scale: 1.015,
                      y: -2,
                      boxShadow: "0 0 40px rgba(249, 115, 22, 0.5), 0 10px 30px rgba(0, 0, 0, 0.1)",
                      transition: { type: "spring", stiffness: 350, damping: 22 }
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 250,
                      damping: 25,
                      delay: 0.15
                    }}
                  />

                  <div className="task-actions">
                    <motion.button
                      className="btn btn-primary"
                      onClick={checkAnswer}
                      whileHover={{
                        scale: 1.05,
                        y: -4,
                        boxShadow: "0 10px 40px rgba(249, 115, 22, 0.4)",
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 18
                        }
                      }}
                      whileTap={{
                        scale: 0.96,
                        y: 0
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 25,
                        delay: 0.2
                      }}
                    >
                      <span><Check weight="bold" /></span>
                      <span>Lösung prüfen</span>
                    </motion.button>
                    <motion.button
                      className="btn btn-secondary"
                      whileHover={{
                        scale: 1.04,
                        y: -3,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 18
                        }
                      }}
                      whileTap={{
                        scale: 0.96,
                        y: 0
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 25,
                        delay: 0.22
                      }}
                    >
                      <span><FastForward weight="bold" /></span>
                      <span>Aufgabe überspringen</span>
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        className={`feedback ${feedback.type}`}
                        initial={{
                          opacity: 0,
                          y: -30,
                          scale: 0.9,
                          filter: "blur(5px)"
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)"
                        }}
                        exit={{
                          opacity: 0,
                          y: -20,
                          scale: 0.95,
                          filter: "blur(5px)",
                          transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 35
                          }
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                          mass: 0.7
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

              {/* Tutor Panel with smooth slide-in */}
              <motion.div
                className="tutor-panel card"
                initial={{ x: 60, opacity: 0, filter: "blur(8px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 28,
                  mass: 0.9,
                  delay: 0.1
                }}
              >
                <div className="tutor-header">
                  <span><Lightbulb weight="bold" /></span>
                  <span>KI-Tutor Hinweise</span>
                </div>

                <div className="hint-levels">
                  {sampleTask.hints.map((hint, index) => (
                    <motion.div
                      key={hint.level}
                      initial={{ opacity: 0, x: 30, filter: "blur(5px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 26,
                        mass: 0.7,
                        delay: index * 0.08 + 0.25
                      }}
                    >
                      <motion.button
                        className="hint-btn"
                        onClick={() => unlockHint(hint.level)}
                        disabled={unlockedHints.includes(hint.level)}
                        whileHover={!unlockedHints.includes(hint.level) ? {
                          scale: 1.03,
                          x: 8,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 18
                          }
                        } : {}}
                        whileTap={{
                          scale: 0.97,
                          x: 4
                        }}
                      >
                        <span>Hinweis {hint.level}</span>
                        <span>{unlockedHints.includes(hint.level) ? <Check weight="bold" /> : <CaretRight weight="bold" />}</span>
                      </motion.button>
                      <AnimatePresence>
                        {unlockedHints.includes(hint.level) && (
                          <motion.div
                            className="hint-content"
                            initial={{
                              opacity: 0,
                              height: 0,
                              y: -10,
                              filter: "blur(5px)"
                            }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                              y: 0,
                              filter: "blur(0px)"
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              y: -10,
                              filter: "blur(5px)",
                              transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 35
                              }
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 280,
                              damping: 28,
                              mass: 0.8
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

      <AccountSettings
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
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
