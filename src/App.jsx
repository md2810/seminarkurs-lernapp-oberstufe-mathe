import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import { useAppStore } from './stores/useAppStore'
import { Shell } from './components/Layout'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import Settings from './components/Settings'
import AccountSettings from './components/AccountSettings'
import ParticleExplosion from './components/ParticleExplosion'
import LearningPlan from './components/LearningPlan'
import QuestionSession from './components/QuestionSession'
import Progress from './components/Progress'
import LiveFeed from './components/LiveFeed'
import InteractiveCanvas from './components/InteractiveCanvas'
import {
  initializeUserProfile,
  updateUserSettings,
  subscribeToUserData,
  updateStreak,
  getAllTopicsWithProgress
} from './firebase/firestore'
import {
  TrendingUp,
  Ruler,
  Dice5,
  Star,
  BookOpen,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react'

// Icon mapping for topic types
const topicIconMap = {
  'Analysis': TrendingUp,
  'Analytische Geometrie': Ruler,
  'Stochastik': Dice5,
  'default': Star
}

const defaultSettings = {
  theme: {
    name: 'Sunset',
    primary: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    gradientFrom: '#f97316',
    gradientTo: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.4)'
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

// Legacy Feed component removed - now using LiveFeed
// Legacy Canvas component removed - now using InteractiveCanvas

function App() {
  const { currentUser, logout } = useAuth()
  const { contextData, wrongQuestions, addTopicsToContext } = useAppStore()

  // Auth View State
  const [authView, setAuthView] = useState('login')

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)

  // Learning Plan State
  const [learningPlanOpen, setLearningPlanOpen] = useState(false)

  // Question Session State
  const [questionSessionId, setQuestionSessionId] = useState(null)

  // Topics from Firestore
  const [topics, setTopics] = useState([])
  const [loadingTopics, setLoadingTopics] = useState(true)

  // Gamification State
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 0,
    totalXp: 0
  })

  // Particle explosion state
  const [showParticleExplosion, setShowParticleExplosion] = useState(false)

  // Load/initialize user data from Firestore
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) {
      return
    }

    let unsubscribe = null

    const setupUserData = async () => {
      try {
        await initializeUserProfile(currentUser.uid, {
          displayName: currentUser.displayName,
          email: currentUser.email
        })

        await updateStreak(currentUser.uid)
        loadTopicsWithProgress()

        unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          if (userData) {
            if (userData.stats) {
              setUserStats(userData.stats)
            }
            if (userData.settings) {
              setSettings(userData.settings)
              if (userData.settings.theme) {
                const theme = userData.settings.theme
                // Helper to convert hex to rgba
                const hexToRgba = (hex, alpha) => {
                  const r = parseInt(hex.slice(1, 3), 16)
                  const g = parseInt(hex.slice(3, 5), 16)
                  const b = parseInt(hex.slice(5, 7), 16)
                  return `rgba(${r}, ${g}, ${b}, ${alpha})`
                }
                document.documentElement.style.setProperty('--primary', theme.primary)
                document.documentElement.style.setProperty('--primary-subtle', hexToRgba(theme.primary, 0.08))
                document.documentElement.style.setProperty('--primary-hover', hexToRgba(theme.primary, 0.15))
                if (theme.gradient) {
                  document.documentElement.style.setProperty('--primary-gradient', theme.gradient)
                  document.documentElement.style.setProperty('--primary-from', theme.gradientFrom)
                  document.documentElement.style.setProperty('--primary-to', theme.gradientTo)
                  document.documentElement.style.setProperty('--primary-glow', theme.glow)
                }
              }
            }
          }
        })
      } catch (error) {
        console.error('Error setting up user data:', error)
        const userStatsKey = `mathapp_stats_${currentUser.uid}`
        const savedStats = localStorage.getItem(userStatsKey)
        if (savedStats) {
          setUserStats(JSON.parse(savedStats))
        }
      }
    }

    setupUserData()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentUser])

  // Load topics with progress from Firestore
  const loadTopicsWithProgress = async () => {
    try {
      setLoadingTopics(true)
      const topicsData = await getAllTopicsWithProgress(currentUser.uid)

      const transformedTopics = topicsData.map((topic) => {
        const [mainTopic, subtopic, subsubtopic] = topic.topicKey.split('|')

        const progress = topic.totalQuestions > 0
          ? Math.round((topic.questionsCompleted / topic.totalQuestions) * 100)
          : 0

        return {
          id: topic.id,
          topicKey: topic.topicKey,
          title: subtopic || mainTopic,
          mainTopic,
          subtopic,
          icon: topicIconMap[mainTopic] || topicIconMap.default,
          description: subsubtopic || subtopic || '',
          progress,
          completed: topic.questionsCompleted,
          total: topic.totalQuestions,
          needsMoreQuestions: topic.needsMoreQuestions,
          lastSessionId: topic.lastSessionId,
          avgAccuracy: Math.round(topic.avgAccuracy || 0),
          level: `${Math.round(topic.avgAccuracy || 0)}%`
        }
      })

      setTopics(transformedTopics)
      setLoadingTopics(false)
    } catch (error) {
      console.error('Error loading topics:', error)
      setLoadingTopics(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setAuthView('login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleSettingsChange = async (newSettings) => {
    setSettings(newSettings)

    if (currentUser) {
      try {
        await updateUserSettings(currentUser.uid, newSettings)
      } catch (error) {
        console.error('Error saving settings:', error)
        localStorage.setItem('mathapp_settings', JSON.stringify(newSettings))
      }
    }
  }

  const handleTopicClick = (topic) => {
    if (topic.lastSessionId) {
      setQuestionSessionId(topic.lastSessionId)
    } else {
      alert('Keine Fragen für dieses Thema gefunden. Bitte generiere zuerst Fragen im Lernplan.')
    }
  }

  const handleGenerateMoreQuestions = () => {
    setLearningPlanOpen(true)
  }

  // Auth views
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

    return (
      <Login
        onLogin={() => {}}
        onSwitchToRegister={() => setAuthView('register')}
      />
    )
  }

  return (
    <Shell
      userStats={userStats}
      onLogout={handleLogout}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenAccount={() => setAccountSettingsOpen(true)}
      onOpenLearningPlan={() => setLearningPlanOpen(true)}
      feed={
        <LiveFeed
          topics={contextData.topics}
          userSettings={settings}
          onOpenContext={() => setLearningPlanOpen(true)}
        />
      }
      canvas={
        <InteractiveCanvas
          wrongQuestions={wrongQuestions}
          userSettings={settings}
          onOpenContext={() => setLearningPlanOpen(true)}
        />
      }
      progress={<Progress userStats={userStats} />}
    >
      {/* Modals */}
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

      <LearningPlan
        isOpen={learningPlanOpen}
        onClose={() => setLearningPlanOpen(false)}
        userSettings={settings}
        onStartSession={(sessionId) => {
          setQuestionSessionId(sessionId)
          setLearningPlanOpen(false)
          setTimeout(() => {
            if (currentUser) {
              loadTopicsWithProgress()
            }
          }, 1000)
        }}
      />

      {questionSessionId && (
        <QuestionSession
          sessionId={questionSessionId}
          onClose={() => {
            setQuestionSessionId(null)
            if (currentUser) {
              loadTopicsWithProgress()
            }
          }}
        />
      )}

      <ParticleExplosion
        trigger={showParticleExplosion}
        onComplete={() => setShowParticleExplosion(false)}
      />
    </Shell>
  )
}

export default App
