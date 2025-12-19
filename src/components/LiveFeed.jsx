/**
 * LiveFeed Component
 * Real-time question feed with adaptive difficulty, caching, and buffer system
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../stores/useAppStore'
import { isOnline, generateFallbackQuestions } from '../utils/apiFallback'
import LaTeX from './LaTeX'
import ParticleExplosion from './ParticleExplosion'
import {
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
  Trophy,
  Fire,
  Brain,
  Target,
  Sparkle,
  Warning,
  BookOpen,
  Question,
  SkipForward
} from '@phosphor-icons/react'
import './LiveFeed.css'

// Difficulty labels for display
const DIFFICULTY_LABELS = {
  1: 'Sehr leicht',
  2: 'Leicht',
  3: 'Leicht-Mittel',
  4: 'Mittel',
  5: 'Mittel',
  6: 'Mittel-Schwer',
  7: 'Schwer',
  8: 'Schwer',
  9: 'Sehr schwer',
  10: 'Experte'
}

const BUFFER_SIZE = 5
const WRONG_ANSWERS_TO_ADJUST = 3
const BACKGROUND_REFILL_THRESHOLD = 3

function LiveFeed({ topics = [], userSettings = {}, onOpenContext }) {
  const { currentUser } = useAuth()
  const {
    aiProvider,
    apiKeys,
    selectedModels,
    addWrongQuestion,
    questionCache,
    setQuestionCache,
    addQuestionsToCache,
    clearQuestionCache,
    recordCorrectAnswer,
    recordWrongAnswer,
    recordSkippedQuestion,
    getUserStats,
    isBackgroundGenerating,
    setBackgroundGenerating
  } = useAppStore()

  // Local state for UI
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [stepAnswers, setStepAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [hintsUsed, setHintsUsed] = useState([])
  const [showHints, setShowHints] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [showXpPopup, setShowXpPopup] = useState(false)

  // Get user stats
  const userStats = getUserStats()

  // Refs
  const initialLoadRef = useRef(false)
  const backgroundGenerationRef = useRef(false)

  // Compute topics hash for cache invalidation
  const topicsHash = JSON.stringify(topics.map(t => `${t.thema}-${t.unterthema}`).sort())

  // Get current question from cache
  const currentQuestion = questionCache.questions[questionCache.currentIndex] || null
  const remainingQuestions = questionCache.questions.length - questionCache.currentIndex + questionCache.pendingQuestions.length

  // Get API key for current provider
  const getApiKey = useCallback(() => {
    if (apiKeys[aiProvider]) return apiKeys[aiProvider]
    switch (aiProvider) {
      case 'claude': return userSettings.anthropicApiKey
      case 'gemini': return userSettings.geminiApiKey
      case 'openai': return userSettings.openaiApiKey
      default: return userSettings.anthropicApiKey
    }
  }, [aiProvider, apiKeys, userSettings])

  // Generate questions from API with fallback
  const generateQuestions = useCallback(async (count = BUFFER_SIZE, adjustedDifficulty = null, isBackground = false) => {
    const apiKey = getApiKey()
    const difficulty = adjustedDifficulty ?? questionCache.difficultyLevel

    // Fallback: Wenn kein API-Key oder offline, nutze lokale Fragen
    if (!apiKey || !isOnline()) {
      console.log('[LiveFeed] Using fallback questions (no API key or offline)')
      return generateFallbackQuestions(topics, difficulty, count)
    }

    if (topics.length === 0) return []

    const model = selectedModels[aiProvider] || userSettings.selectedModel

    if (!isBackground) {
      setQuestionCache({ isGenerating: true })
    } else {
      setBackgroundGenerating(true)
    }

    try {
      const response = await fetch('/api/generate-adaptive-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey,
          model,
          userId: currentUser?.uid,
          topics,
          difficultyLevel: difficulty,
          questionCount: count,
          userContext: {
            gradeLevel: userSettings.gradeLevel || 'Klasse_11',
            courseType: userSettings.courseType || 'Leistungsfach'
          }
        }),
        // Timeout nach 15 Sekunden
        signal: AbortSignal.timeout(15000)
      })

      const data = await response.json()
      if (data.success && data.questions) {
        return data.questions
      }

      // API hat keine Fragen zurückgegeben, nutze Fallback
      console.log('[LiveFeed] API returned no questions, using fallback')
      return generateFallbackQuestions(topics, difficulty, count)
    } catch (error) {
      console.error('[LiveFeed] Error generating questions, using fallback:', error)
      // Bei Fehler: Fallback-Fragen nutzen
      return generateFallbackQuestions(topics, difficulty, count)
    } finally {
      if (!isBackground) {
        setQuestionCache({ isGenerating: false })
      } else {
        setBackgroundGenerating(false)
      }
    }
  }, [aiProvider, getApiKey, topics, questionCache.difficultyLevel, userSettings, currentUser, selectedModels, setQuestionCache, setBackgroundGenerating])

  // Initialize cache when topics change
  useEffect(() => {
    if (topics.length === 0) return

    // Check if topics changed
    if (topicsHash !== questionCache.lastTopicsHash) {
      clearQuestionCache()
      setQuestionCache({ lastTopicsHash: topicsHash })
      initialLoadRef.current = false
    }

    // Initial load
    if (!initialLoadRef.current && questionCache.questions.length === 0) {
      initialLoadRef.current = true
      const loadInitialQuestions = async () => {
        const questions = await generateQuestions(BUFFER_SIZE)
        if (questions.length > 0) {
          addQuestionsToCache(questions)
        }
      }
      loadInitialQuestions()
    }
  }, [topics, topicsHash, questionCache.lastTopicsHash, questionCache.questions.length, clearQuestionCache, setQuestionCache, generateQuestions, addQuestionsToCache])

  // Background refill when buffer gets low
  useEffect(() => {
    if (
      remainingQuestions <= BACKGROUND_REFILL_THRESHOLD &&
      !questionCache.isGenerating &&
      !isBackgroundGenerating &&
      !backgroundGenerationRef.current &&
      topics.length > 0 &&
      questionCache.consecutiveWrong < WRONG_ANSWERS_TO_ADJUST
    ) {
      backgroundGenerationRef.current = true

      const refillInBackground = async () => {
        const newQuestions = await generateQuestions(BUFFER_SIZE, null, true)
        if (newQuestions.length > 0) {
          addQuestionsToCache(newQuestions)
        }
        backgroundGenerationRef.current = false
      }

      refillInBackground()
    }
  }, [remainingQuestions, questionCache.isGenerating, isBackgroundGenerating, topics, questionCache.consecutiveWrong, generateQuestions, addQuestionsToCache])

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return

    let answer = selectedAnswer
    if (currentQuestion.type === 'step-by-step') {
      answer = currentQuestion.steps?.map(step => stepAnswers[step.stepNumber] || '')
    }

    // For multiple choice, check locally first
    let correct = false
    if (currentQuestion.type === 'multiple-choice') {
      const correctOption = currentQuestion.options?.find(o => o.isCorrect)
      correct = correctOption?.id === answer
    }

    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      // Correct answer
      setShowParticles(true)
      const newConsecutiveCorrect = questionCache.consecutiveCorrect + 1
      setQuestionCache({
        consecutiveCorrect: newConsecutiveCorrect,
        consecutiveWrong: 0
      })

      // Calculate XP with streak bonus
      const difficulty = currentQuestion.difficulty || questionCache.difficultyLevel
      const streakBonus = userStats.streak >= 5 ? 5 : userStats.streak >= 3 ? 3 : 0
      const earnedXp = Math.max(5, 10 + difficulty * 2 - hintsUsed.length * 5) + streakBonus

      setXpGained(earnedXp)
      setShowXpPopup(true)
      setTimeout(() => setShowXpPopup(false), 2000)

      // Record in global stats
      recordCorrectAnswer(difficulty, hintsUsed.length, streakBonus)

      // Increase difficulty after 3 correct in a row
      if (newConsecutiveCorrect >= 3 && questionCache.difficultyLevel < 10) {
        setQuestionCache({
          difficultyLevel: Math.min(10, questionCache.difficultyLevel + 1),
          consecutiveCorrect: 0
        })
      }
    } else {
      // Wrong answer
      const newConsecutiveWrong = questionCache.consecutiveWrong + 1
      setQuestionCache({
        consecutiveWrong: newConsecutiveWrong,
        consecutiveCorrect: 0
      })

      // Record in global stats
      recordWrongAnswer()

      // Add to wrong questions for Canvas visualization
      addWrongQuestion({
        ...currentQuestion,
        answeredAt: new Date().toISOString(),
        userAnswer: answer
      })

      // After 3 wrong answers, adjust difficulty and queue new questions
      if (newConsecutiveWrong >= WRONG_ANSWERS_TO_ADJUST) {
        const newDifficulty = Math.max(1, questionCache.difficultyLevel - 2)
        setQuestionCache({
          difficultyLevel: newDifficulty,
          consecutiveWrong: 0
        })

        // Generate easier questions and add to pending
        const easierQuestions = await generateQuestions(5, newDifficulty)
        setQuestionCache({
          pendingQuestions: easierQuestions
        })
      }
    }
  }

  // Handle skip / "Keine Ahnung"
  const handleSkipQuestion = () => {
    // Add to wrong questions for review (without penalty to streak)
    addWrongQuestion({
      ...currentQuestion,
      answeredAt: new Date().toISOString(),
      userAnswer: null,
      skipped: true
    })

    // Record skipped question
    recordSkippedQuestion()

    // Move to next question
    handleNextQuestion()
  }

  // Move to next question
  const handleNextQuestion = () => {
    setSelectedAnswer(null)
    setStepAnswers({})
    setShowResult(false)
    setFeedback(null)
    setHintsUsed([])
    setShowHints(false)
    setShowParticles(false)

    // Check if we have pending easier questions
    if (questionCache.pendingQuestions.length > 0) {
      const [nextQuestion, ...rest] = questionCache.pendingQuestions
      // Insert pending question at current position
      setQuestionCache({
        questions: [
          ...questionCache.questions.slice(0, questionCache.currentIndex),
          nextQuestion,
          ...questionCache.questions.slice(questionCache.currentIndex)
        ],
        pendingQuestions: rest
      })
    } else {
      // Move to next question in cache
      setQuestionCache({
        currentIndex: questionCache.currentIndex + 1
      })
    }
  }

  // Toggle hint
  const handleHintClick = (level) => {
    if (!hintsUsed.includes(level)) {
      setHintsUsed(prev => [...prev, level])
    }
  }

  // No topics selected
  if (topics.length === 0) {
    return (
      <div className="live-feed">
        <div className="live-feed-empty">
          <div className="empty-icon">
            <BookOpen weight="duotone" size={64} />
          </div>
          <h2>Keine Themen ausgewählt</h2>
          <p>Füge Themen zu deinem Kontext hinzu, um mit dem Lernen zu beginnen.</p>
          <motion.button
            className="btn-primary"
            onClick={onOpenContext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Kontext öffnen
          </motion.button>
        </div>
      </div>
    )
  }

  // Loading initial questions
  if (!currentQuestion && questionCache.isGenerating) {
    return (
      <div className="live-feed">
        <div className="live-feed-loading">
          <div className="loading-spinner" />
          <p>Generiere Fragen...</p>
        </div>
      </div>
    )
  }

  // No question available
  if (!currentQuestion) {
    return (
      <div className="live-feed">
        <div className="live-feed-loading">
          <div className="loading-spinner" />
          <p>Lade nächste Frage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="live-feed">
      {/* Header with stats */}
      <div className="feed-header">
        <div className="difficulty-indicator">
          <Target weight="bold" />
          <span className="difficulty-value">{questionCache.difficultyLevel}/10</span>
          <span className="difficulty-label">{DIFFICULTY_LABELS[questionCache.difficultyLevel]}</span>
        </div>

        <div className="session-stats">
          <div className="stat">
            <Trophy weight="bold" />
            <span>{userStats.totalXp} XP</span>
          </div>
          <div className="stat">
            <Fire weight="bold" />
            <span>{userStats.streak}</span>
          </div>
          <div className="stat accuracy">
            <Brain weight="bold" />
            <span>{userStats.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* XP Popup */}
      <AnimatePresence>
        {showXpPopup && (
          <motion.div
            className="xp-popup"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
          >
            <Trophy weight="bold" />
            +{xpGained} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrong answer warning */}
      {questionCache.consecutiveWrong > 0 && questionCache.consecutiveWrong < WRONG_ANSWERS_TO_ADJUST && (
        <motion.div
          className="wrong-warning"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Warning weight="bold" />
          <span>
            {WRONG_ANSWERS_TO_ADJUST - questionCache.consecutiveWrong} weitere falsche Antworten senken das Niveau
          </span>
        </motion.div>
      )}

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          className="question-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Question topic badge */}
          <div className="question-meta">
            <span className="topic-badge">
              {currentQuestion.topic} · {currentQuestion.subtopic}
            </span>
            <span className="question-difficulty">
              <Sparkle weight="bold" />
              {currentQuestion.difficulty}/10
            </span>
          </div>

          {/* Question text */}
          <div className="question-text">
            <LaTeX>{currentQuestion.question}</LaTeX>
          </div>

          {/* Multiple Choice Options */}
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <div className="options-grid">
              {currentQuestion.options.map((option) => {
                let optionClass = 'option-btn'
                if (showResult) {
                  if (option.isCorrect) optionClass += ' correct'
                  else if (selectedAnswer === option.id && !option.isCorrect) optionClass += ' incorrect'
                } else if (selectedAnswer === option.id) {
                  optionClass += ' selected'
                }

                return (
                  <motion.button
                    key={option.id}
                    className={optionClass}
                    onClick={() => !showResult && setSelectedAnswer(option.id)}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <span className="option-id">{option.id}</span>
                    <span className="option-text">
                      <LaTeX>{option.text}</LaTeX>
                    </span>
                    {showResult && option.isCorrect && <CheckCircle weight="bold" className="result-icon" />}
                    {showResult && selectedAnswer === option.id && !option.isCorrect && (
                      <XCircle weight="bold" className="result-icon" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Step-by-Step */}
          {currentQuestion.type === 'step-by-step' && currentQuestion.steps && (
            <div className="steps-container">
              {currentQuestion.steps.map((step) => (
                <div key={step.stepNumber} className="step-item">
                  <label className="step-label">
                    Schritt {step.stepNumber}: {step.instruction}
                  </label>
                  <input
                    type="text"
                    className="step-input"
                    value={stepAnswers[step.stepNumber] || ''}
                    onChange={(e) => setStepAnswers(prev => ({
                      ...prev,
                      [step.stepNumber]: e.target.value
                    }))}
                    disabled={showResult}
                    placeholder="Deine Antwort..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Hints Section */}
          <div className="hints-section">
            <button
              className="hints-toggle"
              onClick={() => setShowHints(!showHints)}
            >
              <Lightbulb weight="bold" />
              Hinweise ({hintsUsed.length}/3)
            </button>

            <AnimatePresence>
              {showHints && (
                <motion.div
                  className="hints-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="hints-buttons">
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        className={`hint-btn ${hintsUsed.includes(level) ? 'used' : ''}`}
                        onClick={() => handleHintClick(level)}
                        disabled={hintsUsed.includes(level) || showResult}
                      >
                        Hinweis {level}
                      </button>
                    ))}
                  </div>

                  {hintsUsed.map(level => (
                    <motion.div
                      key={level}
                      className="hint-display"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <strong>Hinweis {level}:</strong>
                      <p>
                        <LaTeX>{currentQuestion.hints?.[level - 1]?.text || 'Hinweis nicht verfügbar'}</LaTeX>
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result Feedback */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                className={`result-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="result-header">
                  {isCorrect ? (
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
                {feedback && <p className="result-text">{feedback}</p>}
                {!isCorrect && (
                  <div className="wrong-answer-feedback">
                    {/* Show correct answer */}
                    {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                      <div className="correct-answer-reveal">
                        <strong>Richtige Antwort:</strong>
                        <div className="correct-option">
                          {(() => {
                            const correctOption = currentQuestion.options.find(o => o.isCorrect)
                            return correctOption ? (
                              <>
                                <span className="option-badge">{correctOption.id}</span>
                                <LaTeX>{correctOption.text}</LaTeX>
                              </>
                            ) : null
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Show solution for step-by-step */}
                    {currentQuestion.solution && (
                      <div className="solution-reveal">
                        <strong>Lösung:</strong>
                        <LaTeX>{currentQuestion.solution}</LaTeX>
                      </div>
                    )}

                    {/* Explanation why the answer is correct */}
                    {currentQuestion.explanation && (
                      <div className="explanation-section">
                        <strong>Erklärung:</strong>
                        <p className="explanation-text">
                          <LaTeX>{currentQuestion.explanation}</LaTeX>
                        </p>
                      </div>
                    )}

                    {/* Fallback explanation based on hints if no explicit explanation */}
                    {!currentQuestion.explanation && currentQuestion.hints?.length > 0 && (
                      <div className="explanation-section">
                        <strong>Lösungsansatz:</strong>
                        <p className="explanation-text">
                          <LaTeX>{currentQuestion.hints[currentQuestion.hints.length - 1]?.text || ''}</LaTeX>
                        </p>
                      </div>
                    )}

                    {/* Learn more button */}
                    <motion.button
                      className="learn-more-btn"
                      onClick={onOpenContext}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <BookOpen weight="bold" />
                      Mehr erfahren
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="question-actions">
            {!showResult ? (
              <>
                <motion.button
                  className="btn-secondary btn-skip"
                  onClick={handleSkipQuestion}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Frage überspringen"
                >
                  <Question weight="bold" />
                  Keine Ahnung
                </motion.button>
                <motion.button
                  className="btn-primary btn-submit"
                  onClick={handleSubmitAnswer}
                  disabled={
                    isEvaluating ||
                    (currentQuestion.type === 'multiple-choice' && !selectedAnswer) ||
                    (currentQuestion.type === 'step-by-step' && Object.keys(stepAnswers).length === 0)
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isEvaluating ? 'Prüfe...' : 'Antworten'}
                </motion.button>
              </>
            ) : (
              <motion.button
                className="btn-primary btn-next"
                onClick={handleNextQuestion}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Nächste Frage
                <ArrowRight weight="bold" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Buffer indicator */}
      <div className="buffer-indicator">
        <span>{remainingQuestions} Fragen geladen</span>
        {(questionCache.isGenerating || isBackgroundGenerating) && (
          <span className="generating-badge">Generiere...</span>
        )}
      </div>

      {/* Particle explosion */}
      <ParticleExplosion
        trigger={showParticles}
        onComplete={() => setShowParticles(false)}
      />
    </div>
  )
}

export default memo(LiveFeed)
