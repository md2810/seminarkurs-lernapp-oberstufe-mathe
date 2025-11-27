import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './QuestionSession.css'
import {
  X,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowRight,
  Question,
  Trophy,
  Fire,
  Eye,
  Share,
  Snowflake,
  Swords,
  Copy,
  Check as CheckIcon,
  Users
} from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import LaTeX from './LaTeX'
import GeoGebraVisualization from './GeoGebraVisualization'
import ParticleExplosion from './ParticleExplosion'
import LevelPopover from './LevelPopover'
import {
  getGeneratedQuestions,
  saveQuestionProgress,
  getRecentPerformance,
  saveAutoModeAssessment,
  getLatestAutoModeAssessment,
  updateUserStats,
  getUserStats,
  scheduleQuestionReview,
  updateTopicProgress,
  getTopicProgress,
  // Phase 4: Social Gamification
  createShareableSession,
  checkStreakStatus,
  useStreakFreeze,
  getUserInventory,
  awardStreakFreeze
} from '../firebase/firestore'

function QuestionSession({ sessionId, onClose }) {
  const { currentUser } = useAuth()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [hintsUsed, setHintsUsed] = useState([])
  const [showCustomHintInput, setShowCustomHintInput] = useState(false)
  const [customHintQuestion, setCustomHintQuestion] = useState('')
  const [customHint, setCustomHint] = useState(null)
  const [loadingCustomHint, setLoadingCustomHint] = useState(false)
  const [userAnswer, setUserAnswer] = useState(null)
  const [stepAnswers, setStepAnswers] = useState({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState(Date.now())
  const [sessionStats, setSessionStats] = useState({
    completed: 0,
    correct: 0,
    totalXp: 0,
    correctStreak: 0
  })
  const [showGeoGebra, setShowGeoGebra] = useState(false)
  const [geogebraData, setGeogebraData] = useState(null)
  const [loadingGeoGebra, setLoadingGeoGebra] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState(null)

  // Phase 4: Social Gamification State
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [showStreakWarning, setShowStreakWarning] = useState(false)
  const [streakStatus, setStreakStatus] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [usingStreakFreeze, setUsingStreakFreeze] = useState(false)

  useEffect(() => {
    loadQuestions()
    checkUserStreakStatus()
  }, [sessionId])

  // Check if user's streak is at risk
  const checkUserStreakStatus = async () => {
    try {
      const status = await checkStreakStatus(currentUser.uid)
      setStreakStatus(status)

      if (status.atRisk) {
        const inv = await getUserInventory(currentUser.uid)
        setInventory(inv)
        setShowStreakWarning(true)
      }
    } catch (error) {
      console.error('Error checking streak status:', error)
    }
  }

  // Handle streak freeze usage
  const handleUseStreakFreeze = async () => {
    setUsingStreakFreeze(true)
    try {
      const result = await useStreakFreeze(currentUser.uid)
      if (result.success) {
        setShowStreakWarning(false)
        // Show success notification
        alert(result.message)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error using streak freeze:', error)
      alert('Fehler beim Verwenden des Streak Freeze')
    } finally {
      setUsingStreakFreeze(false)
    }
  }

  // Handle session sharing
  const handleShareSession = async () => {
    try {
      const shareId = await createShareableSession(currentUser.uid, sessionId)
      const shareUrl = `${window.location.origin}/share/${shareId}`
      setShareLink(shareUrl)
      setShowShareModal(true)
    } catch (error) {
      console.error('Error creating shareable session:', error)
      alert('Fehler beim Erstellen des Share-Links')
    }
  }

  // Copy share link to clipboard
  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const loadQuestions = async () => {
    try {
      const questionsData = await getGeneratedQuestions(currentUser.uid, sessionId)
      if (questionsData) {
        // Filter out already completed questions to avoid duplicates
        const { getSessionProgress } = await import('../firebase/firestore')
        const completedProgress = await getSessionProgress(currentUser.uid, sessionId)
        const completedQuestionIds = completedProgress
          .filter(p => p.status === 'completed')
          .map(p => p.questionId)

        const uncompletedQuestions = questionsData.questions.filter(
          q => !completedQuestionIds.includes(q.id)
        )

        setQuestions(uncompletedQuestions.length > 0 ? uncompletedQuestions : questionsData.questions)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  const handleHintClick = (hintLevel) => {
    if (!hintsUsed.includes(hintLevel)) {
      setHintsUsed([...hintsUsed, hintLevel])
    }
  }

  const handleCustomHintRequest = async () => {
    if (!customHintQuestion.trim()) return

    setLoadingCustomHint(true)
    try {
      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      const apiKey = settings.anthropicApiKey

      const response = await fetch('/api/generate-custom-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser.uid,
          questionData: currentQuestion,
          userQuestion: customHintQuestion,
          previousHints: hintsUsed.map(level => currentQuestion.hints[level - 1].text),
          userContext: {}
        })
      })

      const data = await response.json()
      if (data.success) {
        setCustomHint(data.customHint)
        setCustomHintQuestion('')
      }
    } catch (error) {
      console.error('Error getting custom hint:', error)
    } finally {
      setLoadingCustomHint(false)
    }
  }

  const handleAnswerSubmit = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    try {
      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      const apiKey = settings.anthropicApiKey

      // Prepare user answer based on question type
      let finalAnswer = userAnswer
      if (currentQuestion.type === 'step-by-step') {
        finalAnswer = currentQuestion.steps.map(step => stepAnswers[step.stepNumber] || '')
      }

      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser.uid,
          questionId: currentQuestion.id,
          questionData: currentQuestion,
          userAnswer: finalAnswer,
          hintsUsed: hintsUsed.length,
          timeSpent,
          skipped: false,
          correctStreak: sessionStats.correctStreak
        })
      })

      const data = await response.json()
      if (data.success) {
        setFeedback(data)
        setShowFeedback(true)

        // Trigger particle explosion on correct answer
        if (data.isCorrect) {
          setShowParticles(true)
        }

        // Update streak
        const newCorrectStreak = data.isCorrect ? sessionStats.correctStreak + 1 : 0

        // Save progress to Firestore
        await saveQuestionProgress(currentUser.uid, {
          questionId: currentQuestion.id,
          sessionId,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          status: 'completed',
          hintsUsed: hintsUsed.length,
          hintsUsedDetails: hintsUsed.map(level => ({
            level,
            usedAt: new Date()
          })),
          customHintRequested: customHint !== null,
          customHintQuestion: customHintQuestion || null,
          customHintResponse: customHint,
          attempts: 1,
          isCorrect: data.isCorrect,
          userAnswer: finalAnswer,
          timeSpent,
          xpEarned: data.xpEarned,
          xpBreakdown: data.xpBreakdown,
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty
        })

        // Update session stats
        setSessionStats(prev => ({
          completed: prev.completed + 1,
          correct: prev.correct + (data.isCorrect ? 1 : 0),
          totalXp: prev.totalXp + data.xpEarned,
          correctStreak: newCorrectStreak
        }))

        // Schedule for spaced repetition if incorrect
        if (!data.isCorrect) {
          const topicKey = `${currentQuestion.topic}|${currentQuestion.subtopic}`
          await scheduleQuestionReview(currentUser.uid, currentQuestion.id, {
            questionId: currentQuestion.id,
            sessionId,
            topicKey,
            question: currentQuestion.question,
            difficulty: currentQuestion.difficulty,
            isCorrect: false,
            previousInterval: 0,
            previousReviewCount: 0,
            previousConsecutiveCorrect: 0
          })
        }

        // Update topic progress
        const topicKey = `${currentQuestion.topic}|${currentQuestion.subtopic}`
        const topicProgress = await getTopicProgress(currentUser.uid, topicKey)

        // Get the total questions count from the generated questions session
        const questionsData = await getGeneratedQuestions(currentUser.uid, sessionId)
        const sessionTotalQuestions = questionsData?.totalQuestions || questionsData?.questions?.length || 20

        await updateTopicProgress(currentUser.uid, topicKey, {
          questionsCompleted: topicProgress.questionsCompleted + 1,
          // Use session's total questions, or keep existing if already set
          totalQuestions: topicProgress.totalQuestions > 0 ? topicProgress.totalQuestions : sessionTotalQuestions,
          lastSessionId: sessionId,
          needsMoreQuestions: topicProgress.questionsCompleted + 1 >= sessionTotalQuestions ? true : false,
          avgAccuracy: ((topicProgress.avgAccuracy * topicProgress.questionsCompleted) + (data.isCorrect ? 100 : 0)) / (topicProgress.questionsCompleted + 1)
        })

        // Update user XP
        const userStats = await getUserStats(currentUser.uid)
        const oldLevel = userStats.level
        const newXp = userStats.xp + data.xpEarned
        const newTotalXp = userStats.totalXp + data.xpEarned
        let newLevel = userStats.level
        let newXpToNextLevel = userStats.xpToNextLevel

        // Level up logic
        while (newXp >= newXpToNextLevel) {
          newLevel++
          newXpToNextLevel = Math.floor(100 * Math.pow(1.5, newLevel - 1))
        }

        await updateUserStats(currentUser.uid, {
          ...userStats,
          xp: newXp,
          totalXp: newTotalXp,
          level: newLevel,
          xpToNextLevel: newXpToNextLevel
        })

        // Show level up popup if leveled up
        if (newLevel > oldLevel) {
          setLevelUpData({
            oldLevel,
            newLevel,
            totalXp: newTotalXp
          })
          setShowLevelUp(true)
        }

        // AUTO mode assessment (after every question)
        const settings2 = JSON.parse(localStorage.getItem('userSettings') || '{}')
        if (settings2.aiModel?.autoMode) {
          const performanceData = await getRecentPerformance(currentUser.uid, 10)
          const previousAssessment = await getLatestAutoModeAssessment(currentUser.uid)

          const assessmentResponse = await fetch('/api/update-auto-mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey,
              userId: currentUser.uid,
              previousAssessment,
              performanceData
            })
          })

          const assessmentData = await assessmentResponse.json()
          if (assessmentData.success) {
            const assessmentId = `assessment_${Date.now()}_${currentUser.uid.substring(0, 8)}`
            await saveAutoModeAssessment(currentUser.uid, {
              assessmentId,
              triggeredBy: 'question_completion',
              previousAssessment: previousAssessment?.currentAssessment || null,
              currentAssessment: assessmentData.newAssessment,
              performanceData
            })

            // Update settings with new assessment
            const updatedSettings = {
              ...settings2,
              aiModel: {
                ...settings2.aiModel,
                detailLevel: assessmentData.newAssessment.detailLevel,
                temperature: assessmentData.newAssessment.temperature,
                helpfulness: assessmentData.newAssessment.helpfulness
              }
            }
            localStorage.setItem('userSettings', JSON.stringify(updatedSettings))
          }
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const handleSkip = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    await saveQuestionProgress(currentUser.uid, {
      questionId: currentQuestion.id,
      sessionId,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'skipped',
      hintsUsed: hintsUsed.length,
      timeSpent,
      xpEarned: 0,
      isCorrect: false
    })

    setSessionStats(prev => ({
      ...prev,
      completed: prev.completed + 1
    }))

    handleNext()
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setHintsUsed([])
      setCustomHint(null)
      setCustomHintQuestion('')
      setShowCustomHintInput(false)
      setUserAnswer(null)
      setStepAnswers({})
      setShowFeedback(false)
      setFeedback(null)
      setStartTime(Date.now())
      setShowGeoGebra(false)
      setGeogebraData(null)
      setShowParticles(false)
    } else {
      // Session complete
      onClose()
    }
  }

  const handleGeoGebraVisualization = async () => {
    // If we already have geogebra data from the question, use it
    if (currentQuestion.geogebra?.commands && currentQuestion.geogebra?.description) {
      setGeogebraData({
        commands: currentQuestion.geogebra.commands,
        explanation: currentQuestion.geogebra.description,
        interactionTips: currentQuestion.geogebra.interactionTips || null
      })
      setShowGeoGebra(true)
      return
    }

    // Otherwise, generate it via API
    setLoadingGeoGebra(true)
    try {
      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      const apiKey = settings.anthropicApiKey

      const response = await fetch('/api/generate-geogebra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser.uid,
          questionData: currentQuestion,
          selectedModel: settings.selectedModel
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeogebraData(data.geogebra)
        setShowGeoGebra(true)
      } else {
        console.error('Error generating GeoGebra visualization:', data.error)
      }
    } catch (error) {
      console.error('Error loading GeoGebra visualization:', error)
    } finally {
      setLoadingGeoGebra(false)
    }
  }

  if (loading) {
    return (
      <div className="question-session-loading">
        <div className="spinner-large"></div>
        <p>Lade Fragen...</p>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="question-session-error">
        <p>Keine Fragen gefunden</p>
        <button className="btn btn-primary" onClick={onClose}>Zurück</button>
      </div>
    )
  }

  return (
    <div className="question-session">
      {/* Header */}
      <div className="session-header">
        <div className="session-progress">
          <span className="progress-text">
            Frage {currentQuestionIndex + 1} / {questions.length}
          </span>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <div className="session-stats">
          <span className="stat-item">
            <Trophy weight="bold" /> {sessionStats.totalXp} XP
          </span>
          <span className="stat-item">
            <Fire weight="bold" /> {sessionStats.correct}/{sessionStats.completed}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="share-btn"
            onClick={handleShareSession}
            title="Session teilen"
          >
            <Share weight="bold" />
          </button>
          <button className="close-btn" onClick={onClose}>
            <X weight="bold" />
          </button>
        </div>
      </div>

      {/* Question Content */}
      <div className="question-content">
        <div className="question-difficulty">
          Schwierigkeit: {currentQuestion.difficulty}/5
        </div>
        <h2 className="question-text">
          <LaTeX>{currentQuestion.question}</LaTeX>
        </h2>

        {/* GeoGebra Visualization Button */}
        {currentQuestion.hasGeoGebraVisualization && (
          <motion.button
            className="btn-geogebra"
            onClick={handleGeoGebraVisualization}
            disabled={loadingGeoGebra}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye weight="bold" />
            {loadingGeoGebra ? 'Lade Visualisierung...' : 'Mit GeoGebra visualisieren'}
          </motion.button>
        )}

        {/* Multiple Choice */}
        {currentQuestion.type === 'multiple-choice' && (
          <div className="answer-options">
            {currentQuestion.options.map(option => (
              <motion.button
                key={option.id}
                className={`option-btn ${userAnswer === option.id ? 'selected' : ''}`}
                onClick={() => setUserAnswer(option.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={showFeedback}
              >
                <span className="option-id">{option.id}</span>
                <span className="option-text">
                  <LaTeX>{option.text}</LaTeX>
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Step by Step */}
        {currentQuestion.type === 'step-by-step' && (
          <div className="step-by-step">
            {currentQuestion.steps.map(step => (
              <div key={step.stepNumber} className="step-item">
                <label className="step-label">
                  Schritt {step.stepNumber}: {step.instruction}
                </label>
                <input
                  type="text"
                  className="step-input"
                  value={stepAnswers[step.stepNumber] || ''}
                  onChange={(e) => setStepAnswers({
                    ...stepAnswers,
                    [step.stepNumber]: e.target.value
                  })}
                  disabled={showFeedback}
                  placeholder="Deine Antwort..."
                />
              </div>
            ))}
          </div>
        )}

        {/* Hints */}
        <div className="hints-section">
          <h3><Lightbulb weight="bold" /> Hinweise</h3>
          <div className="hints-buttons">
            {[1, 2, 3].map(level => (
              <button
                key={level}
                className={`hint-btn ${hintsUsed.includes(level) ? 'used' : ''}`}
                onClick={() => handleHintClick(level)}
                disabled={hintsUsed.includes(level) || showFeedback}
              >
                Hinweis {level}
              </button>
            ))}
          </div>

          {/* Show hints */}
          {hintsUsed.map(level => (
            <motion.div
              key={level}
              className="hint-display"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <strong>Hinweis {level}:</strong>
              <p><LaTeX>{currentQuestion.hints[level - 1].text}</LaTeX></p>
            </motion.div>
          ))}

          {/* Custom hint input */}
          {hintsUsed.length >= 3 && !showFeedback && (
            <div className="custom-hint-section">
              {!showCustomHintInput ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCustomHintInput(true)}
                >
                  <Question weight="bold" /> Wo hängts?
                </button>
              ) : (
                <div className="custom-hint-input">
                  <input
                    type="text"
                    placeholder="Beschreibe, wo du nicht weiterkommst..."
                    value={customHintQuestion}
                    onChange={(e) => setCustomHintQuestion(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleCustomHintRequest}
                    disabled={loadingCustomHint || !customHintQuestion.trim()}
                  >
                    {loadingCustomHint ? 'Wird generiert...' : 'Fragen'}
                  </button>
                </div>
              )}

              {customHint && (
                <motion.div
                  className="custom-hint-display"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <strong>Individueller Hinweis:</strong>
                  <p>{customHint}</p>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && feedback && (
            <motion.div
              className={`feedback-box ${feedback.isCorrect ? 'correct' : 'incorrect'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="feedback-header">
                {feedback.isCorrect ? (
                  <>
                    <CheckCircle weight="bold" size={32} />
                    <h3>Richtig!</h3>
                  </>
                ) : (
                  <>
                    <XCircle weight="bold" size={32} />
                    <h3>Leider falsch</h3>
                  </>
                )}
              </div>
              <p className="feedback-text">{feedback.feedback}</p>
              {feedback.isCorrect && (
                <div className="xp-earned">
                  <Trophy weight="bold" /> +{feedback.xpEarned} XP
                  <div className="xp-breakdown">
                    <div className="xp-breakdown-item">
                      Basis: +{feedback.xpBreakdown.base} XP
                    </div>
                    {feedback.xpBreakdown.hintPenalty < 0 && (
                      <div className="xp-breakdown-item penalty">
                        Hinweise: {feedback.xpBreakdown.hintPenalty} XP
                      </div>
                    )}
                    {feedback.xpBreakdown.timeBonus > 0 && (
                      <div className="xp-breakdown-item bonus">
                        Zeit-Bonus: +{feedback.xpBreakdown.timeBonus} XP
                      </div>
                    )}
                    {feedback.xpBreakdown.streakBonus > 0 && (
                      <div className="xp-breakdown-item bonus">
                        🔥 Streak-Bonus: +{feedback.xpBreakdown.streakBonus} XP ({sessionStats.correctStreak} richtig!)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="question-actions">
          {!showFeedback ? (
            <>
              <button className="btn btn-secondary" onClick={handleSkip}>
                Überspringen
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAnswerSubmit}
                disabled={!userAnswer && Object.keys(stepAnswers).length === 0}
              >
                Antworten
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              {currentQuestionIndex < questions.length - 1 ? (
                <>Nächste Frage <ArrowRight weight="bold" /></>
              ) : (
                'Fertig'
              )}
            </button>
          )}
        </div>
      </div>

      {/* GeoGebra Visualization Panel */}
      <GeoGebraVisualization
        isOpen={showGeoGebra}
        onClose={() => setShowGeoGebra(false)}
        geogebraData={geogebraData}
        questionData={currentQuestion}
        userSettings={JSON.parse(localStorage.getItem('userSettings') || '{}')}
      />

      {/* Particle Explosion on Correct Answer */}
      <ParticleExplosion
        trigger={showParticles}
        onComplete={() => setShowParticles(false)}
      />

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && levelUpData && (
          <motion.div
            className="level-up-modal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="level-up-content">
              <h2>🎉 Level Up! 🎉</h2>
              <div className="level-info">
                <div className="old-level">Level {levelUpData.oldLevel}</div>
                <div className="level-arrow">→</div>
                <div className="new-level">Level {levelUpData.newLevel}</div>
              </div>
              <p className="congrats-text">Herzlichen Glückwunsch! Du hast Level {levelUpData.newLevel} erreicht!</p>
              <p className="total-xp">Gesamt-XP: {levelUpData.totalXp.toLocaleString()}</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowLevelUp(false)}
              >
                Weiter geht's! 🚀
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Session Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            className="share-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              className="share-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="share-modal-header">
                <Share weight="bold" size={24} />
                <h3>Session teilen</h3>
                <button className="close-btn" onClick={() => setShowShareModal(false)}>
                  <X weight="bold" />
                </button>
              </div>
              <div className="share-modal-content">
                <p>Teile diese Session mit Freunden, damit sie die gleichen Fragen lösen können!</p>
                <div className="share-link-container">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="share-link-input"
                  />
                  <button
                    className={`copy-btn ${shareCopied ? 'copied' : ''}`}
                    onClick={handleCopyShareLink}
                  >
                    {shareCopied ? (
                      <>
                        <CheckIcon weight="bold" /> Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy weight="bold" /> Kopieren
                      </>
                    )}
                  </button>
                </div>
                <div className="share-info">
                  <Users weight="bold" />
                  <span>Link ist 30 Tage gültig</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Warning Modal */}
      <AnimatePresence>
        {showStreakWarning && streakStatus?.atRisk && (
          <motion.div
            className="streak-warning-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="streak-warning-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="streak-warning-icon">
                <Fire weight="fill" size={48} />
              </div>
              <h3>Dein Streak ist in Gefahr!</h3>
              <p className="streak-warning-text">
                Du hast {streakStatus.daysMissed} Tag(e) verpasst. Dein {streakStatus.currentStreak}-Tage-Streak
                wird zurückgesetzt, wenn du keinen Streak Freeze verwendest.
              </p>

              {streakStatus.canUseFreeze ? (
                <div className="streak-freeze-option">
                  <div className="freeze-info">
                    <Snowflake weight="bold" size={24} />
                    <span>{inventory?.streakFreezes || 0} Streak Freeze(s) verfügbar</span>
                  </div>
                  <button
                    className="btn btn-primary freeze-btn"
                    onClick={handleUseStreakFreeze}
                    disabled={usingStreakFreeze}
                  >
                    <Snowflake weight="bold" />
                    {usingStreakFreeze ? 'Wird verwendet...' : 'Streak Freeze verwenden'}
                  </button>
                </div>
              ) : (
                <div className="no-freeze-warning">
                  <p>Du hast keine Streak Freezes. Verdiene dir welche durch Challenges!</p>
                </div>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => setShowStreakWarning(false)}
              >
                {streakStatus.canUseFreeze ? 'Ohne Freeze fortfahren' : 'Verstanden'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default QuestionSession
