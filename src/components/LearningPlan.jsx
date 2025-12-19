import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import themesData from '../../data/bw_oberstufe_themen.json'
import './LearningPlan.css'
import {
  Books,
  X,
  NotePencil,
  CalendarBlank,
  Trash,
  Camera,
  CaretRight,
  CaretDown,
  Info,
  CircleNotch
} from '@phosphor-icons/react'

import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../stores/useAppStore'
import {
  saveGeneratedQuestions,
  createLearningSession,
  getMemories,
  getRecentPerformance,
  getLatestAutoModeAssessment,
  saveInitialKnowledge,
  getTopicProgress
} from '../firebase/firestore'

function LearningPlan({ isOpen, onClose, userSettings, onStartSession }) {
  const { currentUser } = useAuth()
  const { addTopicsToContext } = useAppStore()
  const [learningPlan, setLearningPlan] = useState([])
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [selectedThemes, setSelectedThemes] = useState([])
  const [examDate, setExamDate] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [openLeitidee, setOpenLeitidee] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [extractedTopics, setExtractedTopics] = useState([])
  const [imageError, setImageError] = useState(null)
  const [generatingQuestions, setGeneratingQuestions] = useState(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showIntroTest, setShowIntroTest] = useState(false)
  const [introTestPlanItem, setIntroTestPlanItem] = useState(null)
  const [introTestResponses, setIntroTestResponses] = useState({})
  const [savingIntroTest, setSavingIntroTest] = useState(false)

  // Get themes based on user settings
  const getAvailableThemes = () => {
    // Map new grade levels to the data structure
    let gradeLevel = userSettings.gradeLevel || 'Klasse_11'
    // Both Klasse_11 and Klasse_12 use the same curriculum data
    const dataKey = 'Klassen_11_12'
    const courseType = userSettings.courseType || 'Leistungsfach'

    const themes = themesData[dataKey]?.[courseType]
    if (!themes) return {}

    return themes
  }

  const availableThemes = getAvailableThemes()

  const toggleTheme = (leitidee, thema, unterthema) => {
    const themeId = `${leitidee}|${thema}|${unterthema}`

    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(selectedThemes.filter(id => id !== themeId))
    } else {
      setSelectedThemes([...selectedThemes, themeId])
    }
  }

  const toggleLeitidee = (leitidee) => {
    if (openLeitidee === leitidee) {
      setOpenLeitidee(null)
    } else {
      setOpenLeitidee(leitidee)
    }
  }

  const getSelectedCountForThema = (leitidee, thema, unterthemen) => {
    return unterthemen.filter(unterthema => {
      const themeId = `${leitidee}|${thema}|${unterthema}`
      return selectedThemes.includes(themeId)
    }).length
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check if image
    if (!file.type.startsWith('image/')) {
      setImageError('Bitte wähle eine Bilddatei aus')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Bild ist zu groß (max. 5MB)')
      return
    }

    setImageError(null)
    setAnalyzingImage(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        setUploadedImage(e.target.result)

        // Get API key from userSettings prop
        const apiKey = userSettings.anthropicApiKey

        if (!apiKey) {
          setImageError('Bitte gib deinen API-Key in den Einstellungen ein (Settings → Debugging → API Key)')
          setAnalyzingImage(false)
          return
        }

        // Call analyze-image API
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            image: base64,
            gradeLevel: userSettings.gradeLevel || 'Klasse_11',
            courseType: userSettings.courseType || 'Leistungsfach'
          })
        })

        const data = await response.json()

        if (data.success) {
          setExtractedTopics(data.extractedTopics)

          // Auto-select all extracted topics
          const topicIds = data.extractedTopics.map(t =>
            `${t.leitidee}|${t.thema}|${t.unterthema}`
          )
          setSelectedThemes(topicIds)

          setAnalyzingImage(false)
          setShowImageUpload(false)
        } else {
          setImageError(`Fehler: ${data.error}`)
          setAnalyzingImage(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      setImageError('Fehler beim Hochladen des Bildes')
      setAnalyzingImage(false)
    }
  }

  const addToPlan = () => {
    if (selectedThemes.length === 0) return

    const themes = selectedThemes.map(themeId => {
      const [leitidee, thema, unterthema] = themeId.split('|')
      return { leitidee, thema, unterthema }
    })

    const newPlanItem = {
      id: Date.now(),
      themes,
      examDate: examDate || null,
      examTitle: examTitle || 'Lernziel',
      addedAt: new Date().toISOString(),
      completed: false,
      fromImage: uploadedImage ? true : false,
      initialKnowledgeAssessed: false
    }

    setLearningPlan([...learningPlan, newPlanItem])
    setSelectedThemes([])
    setExamDate('')
    setExamTitle('')
    setShowThemeSelector(false)
    setUploadedImage(null)
    setExtractedTopics([])

    // Save to localStorage
    localStorage.setItem('learningPlan', JSON.stringify([...learningPlan, newPlanItem]))

    // Add topics to global context for LiveFeed
    addTopicsToContext(themes)

    // Show introductory assessment test
    setIntroTestPlanItem(newPlanItem)
    setShowIntroTest(true)
    setIntroTestResponses({})
  }

  const handleIntroTestSubmit = async () => {
    if (!currentUser || !introTestPlanItem) return

    setSavingIntroTest(true)

    try {
      // Save initial knowledge assessment to Firestore
      await saveInitialKnowledge(currentUser.uid, {
        planItemId: introTestPlanItem.id,
        responses: introTestResponses,
        assessedAt: new Date()
      })

      // Update plan item
      const updatedPlan = learningPlan.map(item =>
        item.id === introTestPlanItem.id
          ? { ...item, initialKnowledgeAssessed: true }
          : item
      )
      setLearningPlan(updatedPlan)
      localStorage.setItem('learningPlan', JSON.stringify(updatedPlan))

      // Close modal
      setShowIntroTest(false)
      setIntroTestPlanItem(null)
      setIntroTestResponses({})
    } catch (error) {
      console.error('Error saving initial knowledge:', error)
      alert('Fehler beim Speichern der Einschätzung')
    } finally {
      setSavingIntroTest(false)
    }
  }

  const handleIntroTestSkip = () => {
    setShowIntroTest(false)
    setIntroTestPlanItem(null)
    setIntroTestResponses({})
  }

  const handleSmartLearning = async (planItem) => {
    if (!currentUser) return

    setGeneratingQuestions(`smart_${planItem.id}`)
    setGenerationProgress(0)

    try {
      // Get topic progress for all themes in the plan
      const themesWithProgress = await Promise.all(
        planItem.themes.map(async (theme) => {
          const topicKey = `${theme.thema}|${theme.unterthema}`
          const progress = await getTopicProgress(currentUser.uid, topicKey)
          return {
            ...theme,
            avgAccuracy: progress.avgAccuracy || 0,
            questionsCompleted: progress.questionsCompleted || 0,
            lastAccessed: progress.lastAccessed || null
          }
        })
      )

      // Select 3-5 themes intelligently
      // Priority: 1) Low accuracy 2) Not practiced recently 3) Never practiced
      const sortedThemes = themesWithProgress.sort((a, b) => {
        // Never practiced first
        if (a.questionsCompleted === 0 && b.questionsCompleted > 0) return -1
        if (b.questionsCompleted === 0 && a.questionsCompleted > 0) return 1

        // Then by accuracy (lower = more practice needed)
        if (a.avgAccuracy !== b.avgAccuracy) {
          return a.avgAccuracy - b.avgAccuracy
        }

        // Then by how long ago it was practiced
        if (!a.lastAccessed) return -1
        if (!b.lastAccessed) return 1
        return new Date(a.lastAccessed) - new Date(b.lastAccessed)
      })

      // Take top 3-5 themes (depending on total count)
      const numThemes = Math.min(5, Math.max(3, Math.floor(planItem.themes.length / 2)))
      const selectedThemes = sortedThemes.slice(0, numThemes).map(({ leitidee, thema, unterthema }) => ({
        leitidee,
        thema,
        unterthema
      }))

      // Now generate questions with these selected themes
      setGenerationProgress(10)

      const apiKey = userSettings.anthropicApiKey

      if (!apiKey) {
        alert('Bitte gib deinen API-Key in den Einstellungen ein')
        setGeneratingQuestions(null)
        setGenerationProgress(0)
        return
      }

      const recentMemories = await getMemories(currentUser.uid, { limit: 5, importance: 5 })
      const recentPerformance = await getRecentPerformance(currentUser.uid, 10)
      const autoModeAssessment = userSettings.aiModel?.autoMode
        ? await getLatestAutoModeAssessment(currentUser.uid)
        : null

      setGenerationProgress(20)

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 85) {
            const increment = prev < 60 ? 3 : prev < 75 ? 2 : 1
            return Math.min(prev + increment, 85)
          }
          return prev
        })
      }, 1500)

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser.uid,
          learningPlanItemId: `smart_${planItem.id}`,
          topics: selectedThemes,
          selectedModel: userSettings.selectedModel,
          userContext: {
            gradeLevel: userSettings.gradeLevel || 'Klasse_11',
            courseType: userSettings.courseType || 'Leistungsfach',
            autoModeAssessment,
            recentMemories: recentMemories.map(m => m.content),
            recentPerformance
          }
        })
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (data.success) {
        setGenerationProgress(90)

        await saveGeneratedQuestions(currentUser.uid, data)
        setGenerationProgress(95)

        await createLearningSession(currentUser.uid, {
          sessionId: data.sessionId,
          learningPlanItemId: `smart_${planItem.id}`,
          generatedQuestionsId: data.sessionId,
          questionsTotal: data.totalQuestions
        })

        setGenerationProgress(100)

        onStartSession(data.sessionId)
        setGeneratingQuestions(null)
        setGenerationProgress(0)
      } else {
        clearInterval(progressInterval)
        alert(`Fehler: ${data.error}`)
        setGeneratingQuestions(null)
        setGenerationProgress(0)
      }
    } catch (error) {
      console.error('Error in smart learning:', error)
      alert('Fehler beim intelligenten Lernen')
      setGeneratingQuestions(null)
      setGenerationProgress(0)
    }
  }

  const handleStartLearning = async (planItem) => {
    if (!currentUser) return

    setGeneratingQuestions(planItem.id)
    setGenerationProgress(0)

    try {
      // Get API key from userSettings prop (which is already loaded from Firestore/localStorage)
      const apiKey = userSettings.anthropicApiKey

      if (!apiKey) {
        alert('Bitte gib deinen API-Key in den Einstellungen ein (Settings → Debugging → API Key)')
        setGeneratingQuestions(null)
        setGenerationProgress(0)
        return
      }

      // Simulate progress: Start at 10% while fetching context
      setGenerationProgress(10)

      // Get user context
      const recentMemories = await getMemories(currentUser.uid, { limit: 5, importance: 5 })
      const recentPerformance = await getRecentPerformance(currentUser.uid, 10)
      const autoModeAssessment = userSettings.aiModel?.autoMode
        ? await getLatestAutoModeAssessment(currentUser.uid)
        : null

      // Progress to 20% after context fetched
      setGenerationProgress(20)

      // Simulate gradual progress during API call (slower and stops at 85%)
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 85) {
            // Slow down as we approach 85%
            const increment = prev < 60 ? 3 : prev < 75 ? 2 : 1
            return Math.min(prev + increment, 85)
          }
          return prev
        })
      }, 1500)

      // Call generate-questions API
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser.uid,
          learningPlanItemId: planItem.id,
          topics: planItem.themes,
          selectedModel: userSettings.selectedModel,
          userContext: {
            gradeLevel: userSettings.gradeLevel || 'Klasse_11',
            courseType: userSettings.courseType || 'Leistungsfach',
            autoModeAssessment,
            recentMemories: recentMemories.map(m => m.content),
            recentPerformance
          }
        })
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (data.success) {
        setGenerationProgress(90)

        // Save to Firestore
        await saveGeneratedQuestions(currentUser.uid, data)

        setGenerationProgress(95)

        // Create learning session
        await createLearningSession(currentUser.uid, {
          sessionId: data.sessionId,
          learningPlanItemId: planItem.id,
          generatedQuestionsId: data.sessionId,
          questionsTotal: data.totalQuestions
        })

        setGenerationProgress(100)

        // Start session
        onStartSession(data.sessionId)
        setGeneratingQuestions(null)
        setGenerationProgress(0)
      } else {
        clearInterval(progressInterval)
        alert(`Fehler: ${data.error}`)
        setGeneratingQuestions(null)
        setGenerationProgress(0)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Fehler beim Generieren der Fragen')
      setGeneratingQuestions(null)
      setGenerationProgress(0)
    }
  }

  const removePlanItem = (itemId) => {
    const updatedPlan = learningPlan.filter(item => item.id !== itemId)
    setLearningPlan(updatedPlan)
    localStorage.setItem('learningPlan', JSON.stringify(updatedPlan))
  }

  const togglePlanItemCompletion = (itemId) => {
    const updatedPlan = learningPlan.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setLearningPlan(updatedPlan)
    localStorage.setItem('learningPlan', JSON.stringify(updatedPlan))
  }

  // Load learning plan from localStorage and sync to context
  useEffect(() => {
    const saved = localStorage.getItem('learningPlan')
    if (saved) {
      const savedPlan = JSON.parse(saved)
      setLearningPlan(savedPlan)

      // Sync all themes to the global context for LiveFeed
      const allThemes = savedPlan.flatMap(item => item.themes || [])
      if (allThemes.length > 0) {
        addTopicsToContext(allThemes)
      }
    }
  }, [])

  // Calculate days until exam
  const getDaysUntilExam = (examDate) => {
    if (!examDate) return null
    const today = new Date()
    const exam = new Date(examDate)
    const diffTime = exam - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="learning-plan-modal"
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(15px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(15px)" }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
              mass: 0.9
            }}
          >
            <motion.div
              className="modal-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.05
              }}
            >
              <h2><Books weight="bold" /> Kontext</h2>
              <motion.button
                className="close-btn"
                onClick={onClose}
                whileHover={{
                  scale: 1.1,
                  rotate: 90,
                  transition: { type: "spring", stiffness: 400, damping: 20 }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <X weight="bold" />
              </motion.button>
            </motion.div>

            <div className="modal-content">
              {/* Current Learning Plan */}
              <div className="plan-list">
                {learningPlan.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon"><NotePencil weight="bold" /></span>
                    <p>Dein Lernplan ist noch leer</p>
                    <p className="empty-hint">Füge Themen hinzu, um strukturiert zu lernen!</p>
                  </div>
                ) : (
                  learningPlan.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className={`plan-item ${item.completed ? 'completed' : ''}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(5px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.95, x: -100 }}
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 26,
                        delay: index * 0.05
                      }}
                      whileHover={{
                        scale: 1.02,
                        y: -4,
                        transition: { type: "spring", stiffness: 400, damping: 20 }
                      }}
                    >
                      <div className="plan-item-header">
                        <div className="plan-item-title">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => togglePlanItemCompletion(item.id)}
                            className="plan-checkbox"
                          />
                          <h3>{item.examTitle}</h3>
                        </div>
                        {item.examDate && (
                          <div className={`exam-date ${getDaysUntilExam(item.examDate) <= 7 ? 'urgent' : ''}`}>
                            <CalendarBlank weight="bold" /> {new Date(item.examDate).toLocaleDateString('de-DE')}
                            {getDaysUntilExam(item.examDate) >= 0 && (
                              <span className="days-until">
                                {getDaysUntilExam(item.examDate) === 0 ? ' Heute!' : ` in ${getDaysUntilExam(item.examDate)} Tagen`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="plan-themes">
                        {item.themes.map((theme, idx) => (
                          <div key={idx} className="theme-tag">
                            <span className="theme-name">{theme.thema}</span>
                            <span className="theme-detail">{theme.unterthema}</span>
                          </div>
                        ))}
                      </div>
                      <div className="plan-actions">
                        <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                          {/* Intelligentes Lernen with tooltip */}
                          <div className="button-with-tooltip" style={{ flex: 1 }}>
                            <motion.button
                              className="btn btn-smart"
                              onClick={() => handleSmartLearning(item)}
                              disabled={generatingQuestions === `smart_${item.id}` || generatingQuestions === item.id}
                              style={{ width: '100%' }}
                              whileHover={{
                                scale: !generatingQuestions ? 1.05 : 1,
                                y: !generatingQuestions ? -2 : 0,
                                transition: { type: "spring", stiffness: 400, damping: 20 }
                              }}
                              whileTap={{ scale: !generatingQuestions ? 0.95 : 1 }}
                            >
                              {generatingQuestions === `smart_${item.id}` ? `🤖 ${generationProgress}%` : '🤖 Intelligentes Lernen'}
                            </motion.button>
                            <div className="tooltip-trigger">
                              <Info weight="fill" size={16} />
                              <div className="tooltip-content">
                                <strong>Intelligentes Lernen</strong>
                                <p>Die KI analysiert deinen Lernfortschritt und wählt automatisch 3-5 Themen aus, die du am meisten üben solltest:</p>
                                <ul>
                                  <li>Themen mit niedriger Genauigkeit</li>
                                  <li>Lange nicht geübte Themen</li>
                                  <li>Noch nie geübte Themen</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Alle Themen with tooltip */}
                          <div className="button-with-tooltip" style={{ flex: 1 }}>
                            <motion.button
                              className="btn btn-primary start-btn"
                              onClick={() => handleStartLearning(item)}
                              disabled={generatingQuestions === item.id || generatingQuestions === `smart_${item.id}`}
                              style={{ width: '100%' }}
                              whileHover={{
                                scale: !generatingQuestions ? 1.05 : 1,
                                y: !generatingQuestions ? -2 : 0,
                                transition: { type: "spring", stiffness: 400, damping: 20 }
                              }}
                              whileTap={{ scale: !generatingQuestions ? 0.95 : 1 }}
                            >
                              {generatingQuestions === item.id ? `${generationProgress}%` : 'Alle Themen'}
                            </motion.button>
                            <div className="tooltip-trigger">
                              <Info weight="fill" size={16} />
                              <div className="tooltip-content">
                                <strong>Alle Themen</strong>
                                <p>Übe alle Themen in diesem Lernziel gleichmäßig. Ideal für:</p>
                                <ul>
                                  <li>Vollständige Prüfungsvorbereitung</li>
                                  <li>Wenn du alle Themen abdecken möchtest</li>
                                  <li>Erste Übungsrunde mit neuem Material</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          {(generatingQuestions === item.id || generatingQuestions === `smart_${item.id}`) && (
                            <div style={{ width: '100%', marginTop: '12px' }}>
                              {/* Progress Label */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '6px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)'
                              }}>
                                <span>
                                  {generationProgress < 20 ? 'Lade Kontext...' :
                                   generationProgress < 85 ? 'Generiere Fragen...' :
                                   generationProgress < 95 ? 'Speichere...' :
                                   'Fast fertig...'}
                                </span>
                                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                  {generationProgress}%
                                </span>
                              </div>
                              {/* Progress Bar */}
                              <div style={{
                                width: '100%',
                                height: '6px',
                                background: 'rgba(249, 115, 22, 0.15)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <motion.div
                                  initial={{ width: '0%' }}
                                  animate={{
                                    width: `${generationProgress}%`
                                  }}
                                  transition={{
                                    duration: 0.5,
                                    ease: [0.4, 0.0, 0.2, 1] // Smooth easing
                                  }}
                                  style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #f97316, #fb923c, #fdba74)',
                                    borderRadius: '3px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {/* Animated shimmer effect */}
                                  <motion.div
                                    animate={{
                                      x: ['-100%', '200%']
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: 'linear'
                                    }}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                      width: '50%'
                                    }}
                                  />
                                </motion.div>
                              </div>
                            </div>
                          )}
                        </div>
                        <motion.button
                          className="remove-btn"
                          onClick={() => removePlanItem(item.id)}
                          disabled={generatingQuestions === item.id || generatingQuestions === `smart_${item.id}`}
                          whileHover={{
                            scale: !generatingQuestions ? 1.05 : 1,
                            x: !generatingQuestions ? 4 : 0,
                            transition: { type: "spring", stiffness: 400, damping: 20 }
                          }}
                          whileTap={{ scale: !generatingQuestions ? 0.95 : 1 }}
                        >
                          <Trash weight="bold" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Add New Button */}
              {!showThemeSelector && (
                <motion.div
                  className="add-plan-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    delay: 0.2
                  }}
                >
                  <motion.button
                    className="btn btn-primary"
                    onClick={() => setShowThemeSelector(true)}
                    whileHover={{
                      scale: 1.05,
                      y: -3,
                      boxShadow: "0 10px 40px rgba(249, 115, 22, 0.4)",
                      transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    + Neues Lernziel hinzufügen
                  </motion.button>
                </motion.div>
              )}

              {/* Theme Selector */}
              <AnimatePresence>
                {showThemeSelector && (
                  <motion.div
                    className="theme-selector"
                    initial={{ opacity: 0, height: 0, scale: 0.95, filter: "blur(5px)" }}
                    animate={{ opacity: 1, height: 'auto', scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, height: 0, scale: 0.95, filter: "blur(5px)" }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 28
                    }}
                  >
                    <h3>Themen auswählen</h3>

                    {/* Exam Info */}
                    <div className="exam-info-inputs">
                      <input
                        type="text"
                        placeholder="Titel (z.B. Analysis Klausur)"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="exam-title-input"
                      />
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="exam-date-input"
                      />
                    </div>

                    {/* Image Upload Option */}
                    <div className="upload-option">
                      <input
                        type="file"
                        id="theme-image-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => document.getElementById('theme-image-upload').click()}
                        disabled={analyzingImage}
                      >
                        <Camera weight="bold" />
                        {analyzingImage ? 'Analysiere Bild...' : 'Themenliste hochladen (KI-gestützt)'}
                      </button>
                    </div>

                    {/* Image Analysis Status */}
                    {analyzingImage && (
                      <div className="analyzing-status">
                        <div className="spinner"></div>
                        <p>Claude analysiert dein Bild...</p>
                      </div>
                    )}

                    {imageError && (
                      <div className="image-error">
                        {imageError}
                      </div>
                    )}

                    {extractedTopics.length > 0 && (
                      <div className="extracted-topics-preview">
                        <p className="success-message">
                          ✓ {extractedTopics.length} Themen erkannt und ausgewählt!
                        </p>
                      </div>
                    )}

                    {/* Manual Theme Selection */}
                    <div className="themes-tree">
                      {Object.entries(availableThemes).map(([leitidee, themen]) => (
                        <div key={leitidee} className="leitidee-group">
                          <h4
                            className="leitidee-title"
                            onClick={() => toggleLeitidee(leitidee)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="collapse-icon">
                              {openLeitidee === leitidee ? <CaretDown weight="bold" /> : <CaretRight weight="bold" />}
                            </span>
                            {leitidee}
                          </h4>
                          <AnimatePresence>
                            {openLeitidee === leitidee && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                                animate={{ height: 'auto', opacity: 1, filter: "blur(0px)" }}
                                exit={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                                transition={{
                                  type: "spring",
                                  stiffness: 280,
                                  damping: 28
                                }}
                                style={{ overflow: 'hidden' }}
                              >
                                {Object.entries(themen).map(([thema, unterthemen]) => {
                                  const selectedCount = getSelectedCountForThema(leitidee, thema, unterthemen)
                                  return (
                                    <div key={thema} className="thema-group">
                                      <h5 className="thema-title">
                                        {thema}
                                        <span className="selection-count">
                                          {selectedCount}/{unterthemen.length}
                                        </span>
                                      </h5>
                                      <div className="unterthemen-list">
                                        {unterthemen.map((unterthema, idx) => {
                                          const themeId = `${leitidee}|${thema}|${unterthema}`
                                          const isSelected = selectedThemes.includes(themeId)
                                          return (
                                            <label key={idx} className={`unterthema-item ${isSelected ? 'selected' : ''}`}>
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleTheme(leitidee, thema, unterthema)}
                                              />
                                              <span>{unterthema}</span>
                                            </label>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Actions with smooth animations */}
                    <motion.div
                      className="selector-actions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                        delay: 0.2
                      }}
                    >
                      <motion.button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowThemeSelector(false)
                          setSelectedThemes([])
                          setExamDate('')
                          setExamTitle('')
                        }}
                        whileHover={{
                          scale: 1.04,
                          y: -2,
                          transition: { type: "spring", stiffness: 400, damping: 18 }
                        }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Abbrechen
                      </motion.button>
                      <motion.button
                        className="btn btn-primary"
                        onClick={addToPlan}
                        disabled={selectedThemes.length === 0}
                        whileHover={{
                          scale: selectedThemes.length > 0 ? 1.05 : 1,
                          y: selectedThemes.length > 0 ? -3 : 0,
                          boxShadow: selectedThemes.length > 0 ? "0 10px 40px rgba(249, 115, 22, 0.4)" : "none",
                          transition: { type: "spring", stiffness: 400, damping: 18 }
                        }}
                        whileTap={{ scale: selectedThemes.length > 0 ? 0.95 : 1 }}
                      >
                        Zum Lernplan hinzufügen ({selectedThemes.length})
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Introductory Knowledge Assessment Modal */}
          <AnimatePresence>
            {showIntroTest && introTestPlanItem && (
              <>
                <motion.div
                  className="modal-overlay"
                  onClick={handleIntroTestSkip}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ zIndex: 3000 }}
                />
                <motion.div
                  className="intro-test-modal"
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                >
                  <div className="modal-header">
                    <h2>📊 Einführungstest</h2>
                    <button className="close-btn" onClick={handleIntroTestSkip}>
                      <X weight="bold" />
                    </button>
                  </div>
                  <div className="modal-content">
                    <p className="intro-test-description">
                      Um dein Lernen optimal anzupassen, schätze bitte dein aktuelles Wissen für jedes Thema ein.
                      Dies hilft uns, die Schwierigkeit der Aufgaben besser anzupassen.
                    </p>
                    <div className="intro-test-themes">
                      {introTestPlanItem.themes.map((theme, idx) => {
                        const themeKey = `${theme.leitidee}|${theme.thema}|${theme.unterthema}`
                        return (
                          <div key={idx} className="intro-test-theme">
                            <div className="theme-info">
                              <strong>{theme.thema}</strong>
                              <span className="theme-detail">{theme.unterthema}</span>
                            </div>
                            <div className="knowledge-scale">
                              <span className="scale-label">Wie gut kennst du dich aus?</span>
                              <div className="scale-buttons">
                                {[1, 2, 3, 4, 5].map(level => (
                                  <button
                                    key={level}
                                    className={`scale-btn ${introTestResponses[themeKey] === level ? 'selected' : ''}`}
                                    onClick={() => setIntroTestResponses({
                                      ...introTestResponses,
                                      [themeKey]: level
                                    })}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                              <div className="scale-labels">
                                <span>Keine Ahnung</span>
                                <span>Experte</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="intro-test-actions">
                      <button className="btn btn-secondary" onClick={handleIntroTestSkip}>
                        Überspringen
                      </button>
                      <motion.button
                        className="btn btn-primary"
                        onClick={handleIntroTestSubmit}
                        disabled={Object.keys(introTestResponses).length !== introTestPlanItem.themes.length || savingIntroTest}
                        whileHover={!savingIntroTest ? { scale: 1.02 } : {}}
                        whileTap={!savingIntroTest ? { scale: 0.98 } : {}}
                      >
                        {savingIntroTest ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              style={{ display: 'inline-flex' }}
                            >
                              <CircleNotch weight="bold" />
                            </motion.span>
                            Wird gespeichert...
                          </>
                        ) : (
                          'Einschätzung speichern'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}

export default LearningPlan
