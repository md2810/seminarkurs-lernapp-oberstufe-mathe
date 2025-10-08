import { useState } from 'react'
import './App.css'

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

function App() {
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'task'
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [unlockedHints, setUnlockedHints] = useState([])
  const [feedback, setFeedback] = useState(null)

  // Gamification State
  const [userStats, setUserStats] = useState({
    level: 7,
    xp: 1250,
    xpToNextLevel: 1500,
    streak: 12,
    totalXp: 3420
  })

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
    } else {
      setFeedback({
        type: 'error',
        message: '🤔 Das ist noch nicht ganz richtig. Versuche es nochmal oder nutze einen Hinweis!'
      })
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">📚</span>
          <span>MatheLernApp</span>
        </div>
        <div className="user-stats">
          <div className="stat">
            <span className="stat-icon">⚡</span>
            <span>Level {userStats.level}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">✨</span>
            <span>{userStats.xp} / {userStats.xpToNextLevel} XP</span>
          </div>
          <div className="stat streak-animation">
            <span className="stat-icon">🔥</span>
            <span>{userStats.streak} Tage</span>
          </div>
        </div>
      </header>

      <div className="container">
        {currentView === 'dashboard' ? (
          <>
            {/* Hero Section */}
            <div className="hero">
              <h1>Deine Mathematik-Reise</h1>
              <p>
                Meistere Analysis, Geometrie und Stochastik mit interaktiven Aufgaben
                und einem KI-Tutor, der dir bei jedem Schritt hilft.
              </p>
            </div>

            {/* Topics Grid */}
            <div className="topics-grid">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="card topic-card"
                  onClick={() => handleTopicClick(topic)}
                >
                  <div className="topic-header">
                    <span className="topic-icon">{topic.icon}</span>
                    <h2 className="topic-title">{topic.title}</h2>
                  </div>
                  <p className="topic-description">{topic.description}</p>

                  <div className="topic-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${topic.progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      <span>{topic.completed} / {topic.total} Aufgaben</span>
                      <span>{topic.progress}%</span>
                    </div>
                  </div>

                  <div className="topic-stats">
                    <span>📊 {topic.level}</span>
                    <span>🎯 {topic.total - topic.completed} offen</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Task View */
          <div className="task-view">
            <div className="task-header">
              <button className="back-btn" onClick={handleBackToDashboard}>
                <span>←</span>
                <span>Zurück zur Übersicht</span>
              </button>
              <div className="stat">
                <span className="stat-icon">💎</span>
                <span>+{sampleTask.xpReward} XP</span>
              </div>
            </div>

            <div className="task-content">
              <div className="task-main">
                <div className="card">
                  <h2>{sampleTask.title}</h2>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginTop: '8px',
                    marginBottom: '16px',
                    color: 'var(--secondary)'
                  }}>
                    {sampleTask.difficulty}
                  </div>
                  <p className="task-question">{sampleTask.question}</p>

                  <textarea
                    className="task-input"
                    placeholder="Deine Lösung hier eingeben... (z.B. x = 5,85 cm)"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />

                  <div className="task-actions">
                    <button className="btn btn-primary" onClick={checkAnswer}>
                      <span>✓</span>
                      <span>Lösung prüfen</span>
                    </button>
                    <button className="btn btn-secondary">
                      <span>⏭</span>
                      <span>Aufgabe überspringen</span>
                    </button>
                  </div>

                  {feedback && (
                    <div className={`feedback ${feedback.type}`}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                        {feedback.message}
                      </div>
                      {feedback.xp && (
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                          +{feedback.xp} XP erhalten! 🎊
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tutor Panel */}
              <div className="tutor-panel card">
                <div className="tutor-header">
                  <span>💡</span>
                  <span>KI-Tutor Hinweise</span>
                </div>

                <div className="hint-levels">
                  {sampleTask.hints.map((hint) => (
                    <div key={hint.level}>
                      <button
                        className="hint-btn"
                        onClick={() => unlockHint(hint.level)}
                        disabled={unlockedHints.includes(hint.level)}
                      >
                        <span>Hinweis {hint.level}</span>
                        <span>{unlockedHints.includes(hint.level) ? '✓' : '→'}</span>
                      </button>
                      {unlockedHints.includes(hint.level) && (
                        <div className="hint-content">
                          {hint.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '24px',
                  padding: '12px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)'
                }}>
                  💬 Tipp: Nutze die Hinweise schrittweise, wenn du nicht weiterkommst.
                  Das Ziel ist, den Lösungsweg zu verstehen!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
