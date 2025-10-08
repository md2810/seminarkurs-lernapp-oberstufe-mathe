import { useEffect, useState } from 'react'
import './XPPopover.css'

function XPPopover({ isOpen, onClose, userStats, anchorRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2
      })
    }
  }, [isOpen, anchorRef])

  if (!isOpen) return null

  const progressPercent = (userStats.xp / userStats.xpToNextLevel) * 100
  const xpNeeded = userStats.xpToNextLevel - userStats.xp

  // Täglich XP Ziele für süchtig machenden Effekt
  const dailyGoals = [
    { label: 'Tägliches Minimum', xp: 50, completed: userStats.xp >= 50 },
    { label: 'Gutes Tempo', xp: 150, completed: userStats.xp >= 150 },
    { label: 'Fleißig', xp: 300, completed: userStats.xp >= 300 },
    { label: 'Überflieger', xp: 500, completed: userStats.xp >= 500 }
  ]

  return (
    <>
      <div className="popover-overlay" onClick={onClose} />
      <div
        className="xp-popover"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="popover-arrow" />

        <div className="xp-header">
          <div className="xp-main">
            <div className="xp-icon">✨</div>
            <div className="xp-stats">
              <div className="xp-current">{userStats.xp.toLocaleString()} XP</div>
              <div className="xp-total">von {userStats.xpToNextLevel.toLocaleString()} XP</div>
            </div>
          </div>

          <div className="xp-progress-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="var(--border)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercent / 100)}`}
                transform="rotate(-90 60 60)"
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--primary-light)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="progress-percentage">{Math.round(progressPercent)}%</div>
          </div>
        </div>

        <div className="xp-needed-box">
          <div className="xp-needed-icon">🎯</div>
          <div>
            <div className="xp-needed-label">Noch bis Level {userStats.level + 1}</div>
            <div className="xp-needed-value">{xpNeeded.toLocaleString()} XP</div>
          </div>
        </div>

        <div className="daily-goals">
          <div className="goals-header">
            <span>🏆</span>
            <span>Tägliche Ziele</span>
          </div>

          {dailyGoals.map((goal, index) => (
            <div key={index} className={`goal-item ${goal.completed ? 'completed' : ''}`}>
              <div className="goal-check">
                {goal.completed ? '✓' : '○'}
              </div>
              <div className="goal-label">{goal.label}</div>
              <div className="goal-xp">{goal.xp} XP</div>
            </div>
          ))}
        </div>

        <div className="xp-boost">
          <div className="boost-icon">🚀</div>
          <div className="boost-text">
            <div className="boost-title">Streak Bonus aktiv!</div>
            <div className="boost-desc">+{userStats.streak}% XP für {userStats.streak} Tage Streak</div>
          </div>
        </div>

        <div className="total-xp">
          Gesamt-XP: <span>{userStats.totalXp.toLocaleString()}</span>
        </div>
      </div>
    </>
  )
}

export default XPPopover
