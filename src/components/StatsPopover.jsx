import { useEffect, useState } from 'react'
import './StatsPopover.css'

function StatsPopover({ isOpen, onClose, userStats, anchorRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      const isMobile = window.innerWidth < 768

      if (isMobile) {
        setPosition({ top: 0, left: 0 })
      } else {
        setPosition({
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2
        })
      }
    }
  }, [isOpen, anchorRef])

  if (!isOpen) return null

  const progressPercent = (userStats.xp / userStats.xpToNextLevel) * 100
  const xpNeeded = userStats.xpToNextLevel - userStats.xp

  const isMobile = window.innerWidth < 768

  return (
    <>
      <div className="stats-overlay" onClick={onClose} />
      <div
        className={`stats-popover ${isMobile ? 'mobile' : ''}`}
        style={!isMobile ? {
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        } : {}}
      >
        {!isMobile && <div className="popover-arrow" />}

        <div className="stats-header">
          <div className="level-badge">
            <div className="level-number">Level {userStats.level}</div>
            <div className="level-label">Experte</div>
          </div>
          <button className="close-btn-mobile" onClick={onClose}>✕</button>
        </div>

        <div className="xp-section">
          <div className="xp-progress-bar">
            <div
              className="xp-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="xp-info">
            <span className="xp-current">{userStats.xp.toLocaleString()} XP</span>
            <span className="xp-total">/ {userStats.xpToNextLevel.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{xpNeeded.toLocaleString()}</div>
            <div className="stat-label">bis Level {userStats.level + 1}</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{userStats.totalXp.toLocaleString()}</div>
            <div className="stat-label">Gesamt XP</div>
          </div>
          <div className="stat-box highlight">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{userStats.streak}</div>
            <div className="stat-label">Tage Streak</div>
          </div>
        </div>

        <div className="quick-goals">
          <div className="goals-title">Heute</div>
          <div className="goals-list">
            {[
              { label: '1 Aufgabe', xp: 50, done: true },
              { label: '3 Aufgaben', xp: 150, done: false },
              { label: '5 Aufgaben', xp: 300, done: false }
            ].map((goal, i) => (
              <div key={i} className={`goal ${goal.done ? 'done' : ''}`}>
                <span className="goal-check">{goal.done ? '✓' : '○'}</span>
                <span className="goal-name">{goal.label}</span>
                <span className="goal-xp">+{goal.xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default StatsPopover
