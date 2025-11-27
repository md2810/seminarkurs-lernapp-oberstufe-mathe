/**
 * LiveFeed Component
 * Real-time question feed with adaptive difficulty and buffer system
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../stores/useAppStore'
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
  BookOpen
} from '@phosphor-icons/react'
import './LiveFeed.css'

// Import CSS variable helper (for getting primary-rgb)
const getPrimaryRGB = () => {
  // Default orange RGB
  return '249, 115, 22'
}

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

function LiveFeed({ topics = [], userSettings = {}, onOpenContext }) {
  const { currentUser } = useAuth()
  const { aiProvider, apiKeys, addWrongQuestion, selectedModels } = useAppStore()

  // Question state
  const [questionBuffer, setQuestionBuffer] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [pendingQuestions, setPendingQuestions] = useState([]) // Questions waiting after buffer depletes

  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [stepAnswers, setStepAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Hints
  const [hintsUsed, setHintsUsed] = useState([])
  const [showHints, setShowHints] = useState(false)

  // Difficulty tracking
  const [difficultyLevel, setDifficultyLevel] = useState(5)
  const [consecutiveWrong, setConsecutiveWrong] = useState(0)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)

  // Session stats
  const [sessionStats, setSessionStats] = useState({
    totalAnswered: 0,
    correct: 0,
    xpEarned: 0,
    streak: 0
  })

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Particles
  const [showParticles, setShowParticles] = useState(false)

  // Ref for tracking if initial load happened
  const initialLoadRef = useRef(false)

  // Get API key for current provider
  const getApiKey = useCallback(() => {
    // First check the store
    if (apiKeys[aiProvider]) return apiKeys[aiProvider]

    // Fallback to userSettings
    switch (aiProvider) {
      case 'claude':
        return userSettings.anthropicApiKey
      case 'gemini':
        return userSettings.geminiApiKey
      case 'openai':
        return userSettings.openaiApiKey
      default:
        return userSettings.anthropicApiKey
    }
  }, [aiProvider, apiKeys, userSettings])

  // Generate questions from API
  const generateQuestions = useCallback(async (count = BUFFER_SIZE, adjustedDifficulty = null) => {
    const apiKey = getApiKey()
    if (!apiKey || topics.length === 0) return []

    // Get the selected model for the current provider
    const model = selectedModels[aiProvider] || userSettings.selectedModel

    setIsGenerating(true)
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
          difficultyLevel: adjustedDifficulty ?? difficultyLevel,
          questionCount: count,
          userContext: {
            gradeLevel: userSettings.gradeLevel || 'Klasse_11',
            courseType: userSettings.courseType || 'Leistungsfach'
          }
        })
      })

      const data = await response.json()
      if (data.success && data.questions) {
        return data.questions
      }
      return []
    } catch (error) {
      console.error('Error generating questions:', error)
      return []
    } finally {
      setIsGenerating(false)
    }
  }, [aiProvider, getApiKey, topics, difficultyLevel, userSettings, currentUser, selectedModels])

  // Initialize buffer when topics change
  useEffect(() => {
    if (topics.length > 0 && !initialLoadRef.current) {
      initialLoadRef.current = true
      initializeBuffer()
    }
  }, [topics])

  // Reset when topics change
  useEffect(() => {
    if (topics.length > 0) {
      initialLoadRef.current = false
      setQuestionBuffer([])
      setCurrentQuestion(null)
      setPendingQuestions([])
      setDifficultyLevel(5)
      setConsecutiveWrong(0)
      setConsecutiveCorrect(0)
      setSessionStats({ totalAnswered: 0, correct: 0, xpEarned: 0, streak: 0 })
    }
  }, [JSON.stringify(topics)])

  const initializeBuffer = async () => {
    const questions = await generateQuestions(BUFFER_SIZE)
    if (questions.length > 0) {
      setCurrentQuestion(questions[0])
      setQuestionBuffer(questions.slice(1))
    }
  }

  // Refill buffer when it gets low (but not during wrong answer sequence)
  useEffect(() => {
    if (
      questionBuffer.length < 2 &&
      !isGenerating &&
      topics.length > 0 &&
      consecutiveWrong < WRONG_ANSWERS_TO_ADJUST &&
      pendingQuestions.length === 0
    ) {
      const refillBuffer = async () => {
        const newQuestions = await generateQuestions(BUFFER_SIZE - questionBuffer.length)
        setQuestionBuffer(prev => [...prev, ...newQuestions])
      }
      refillBuffer()
    }
  }, [questionBuffer.length, isGenerating, topics, consecutiveWrong, pendingQuestions.length])

  // Evaluate answer using AI
  const evaluateAnswer = async (answer) => {
    const apiKey = getApiKey()
    if (!apiKey || !currentQuestion) return null

    setIsEvaluating(true)
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          userId: currentUser?.uid,
          questionId: currentQuestion.id,
          questionData: currentQuestion,
          userAnswer: answer,
          hintsUsed: hintsUsed.length,
          timeSpent: 0,
          skipped: false,
          correctStreak: sessionStats.streak
        })
      })

      const data = await response.json()
      return data.success ? data : null
    } catch (error) {
      console.error('Error evaluating answer:', error)
      return null
    } finally {
      setIsEvaluating(false)
    }
  }

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

    // Also evaluate with AI for detailed feedback
    const evaluation = await evaluateAnswer(answer)
    if (evaluation) {
      correct = evaluation.isCorrect
      setFeedback(evaluation.feedback)
    }

    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      // Correct answer
      setShowParticles(true)
      setConsecutiveCorrect(prev => prev + 1)
      setConsecutiveWrong(0)

      // Increase difficulty after 3 correct in a row
      if (consecutiveCorrect >= 2 && difficultyLevel < 10) {
        setDifficultyLevel(prev => Math.min(10, prev + 1))
        setConsecutiveCorrect(0)
      }

      // Update stats
      const xp = evaluation?.xpEarned || (10 + difficultyLevel * 2)
      setSessionStats(prev => ({
        totalAnswered: prev.totalAnswered + 1,
        correct: prev.correct + 1,
        xpEarned: prev.xpEarned + xp,
        streak: prev.streak + 1
      }))
    } else {
      // Wrong answer
      const newConsecutiveWrong = consecutiveWrong + 1
      setConsecutiveWrong(newConsecutiveWrong)
      setConsecutiveCorrect(0)

      // Add to wrong questions for Canvas visualization
      addWrongQuestion({
        ...currentQuestion,
        answeredAt: new Date().toISOString(),
        userAnswer: answer
      })

      setSessionStats(prev => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        streak: 0
      }))

      // After 3 wrong answers, adjust difficulty and queue new questions
      if (newConsecutiveWrong >= WRONG_ANSWERS_TO_ADJUST) {
        const newDifficulty = Math.max(1, difficultyLevel - 2)
        setDifficultyLevel(newDifficulty)
        setConsecutiveWrong(0)

        // Generate easier questions and add to pending
        const easierQuestions = await generateQuestions(5, newDifficulty)
        setPendingQuestions(easierQuestions)
      }
    }
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
    if (pendingQuestions.length > 0) {
      setCurrentQuestion(pendingQuestions[0])
      setPendingQuestions(prev => prev.slice(1))
    } else if (questionBuffer.length > 0) {
      setCurrentQuestion(questionBuffer[0])
      setQuestionBuffer(prev => prev.slice(1))
    } else {
      // Buffer empty, show loading state
      setCurrentQuestion(null)
      initializeBuffer()
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
  if (!currentQuestion && isGenerating) {
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
          <span className="difficulty-value">{difficultyLevel}/10</span>
          <span className="difficulty-label">{DIFFICULTY_LABELS[difficultyLevel]}</span>
        </div>

        <div className="session-stats">
          <div className="stat">
            <Trophy weight="bold" />
            <span>{sessionStats.xpEarned} XP</span>
          </div>
          <div className="stat">
            <Fire weight="bold" />
            <span>{sessionStats.streak}</span>
          </div>
          <div className="stat accuracy">
            <Brain weight="bold" />
            <span>
              {sessionStats.totalAnswered > 0
                ? Math.round((sessionStats.correct / sessionStats.totalAnswered) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Wrong answer warning */}
      {consecutiveWrong > 0 && consecutiveWrong < WRONG_ANSWERS_TO_ADJUST && (
        <motion.div
          className="wrong-warning"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Warning weight="bold" />
          <span>
            {WRONG_ANSWERS_TO_ADJUST - consecutiveWrong} weitere falsche Antworten senken das Niveau
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
                {!isCorrect && currentQuestion.solution && (
                  <div className="solution-reveal">
                    <strong>Lösung:</strong>
                    <LaTeX>{currentQuestion.solution}</LaTeX>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="question-actions">
            {!showResult ? (
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
        <span>{questionBuffer.length + pendingQuestions.length} Fragen geladen</span>
        {isGenerating && <span className="generating-badge">Generiere...</span>}
      </div>

      {/* Particle explosion */}
      <ParticleExplosion
        trigger={showParticles}
        onComplete={() => setShowParticles(false)}
      />
    </div>
  )
}

export default LiveFeed
