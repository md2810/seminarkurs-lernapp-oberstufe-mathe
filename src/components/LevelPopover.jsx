import { useEffect, useState } from 'react'
import './LevelPopover.css'

const LEVEL_MILESTONES = [
  { level: 1, title: 'Anfänger', xpRequired: 0, icon: '🌱', color: '#10b981' },
  { level: 5, title: 'Fortgeschritten', xpRequired: 1000, icon: '🌿', color: '#3b82f6' },
  { level: 7, title: 'Experte', xpRequired: 2500, icon: '🔥', color: '#f97316' },
  { level: 10, title: 'Meister', xpRequired: 5000, icon: '⭐', color: '#eab308' },
  { level: 15, title: 'Großmeister', xpRequired: 10000, icon: '👑', color: '#8b5cf6' },
  { level: 20, title: 'Legende', xpRequired: 20000, icon: '💎', color: '#ec4899' }
]

function LevelPopover({ isOpen, onClose, userStats, anchorRef }) {
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

  const currentMilestone = LEVEL_MILESTONES.findIndex(m => m.level > userStats.level)
  const nextMilestone = LEVEL_MILESTONES[currentMilestone] || LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1]
  const prevMilestone = LEVEL_MILESTONES[currentMilestone - 1] || LEVEL_MILESTONES[0]

  return (
    <>
      <div className="popover-overlay" onClick={onClose} />
      <div
        className="level-popover"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="popover-arrow" />

        <div className="popover-header">
          <div className="current-level-badge">
            <span className="level-icon">⚡</span>
            <div>
              <div className="level-number">Level {userStats.level}</div>
              <div className="level-title">{prevMilestone.title}</div>
            </div>
          </div>
        </div>

        <div className="level-path">
          {LEVEL_MILESTONES.map((milestone, index) => {
            const isCompleted = userStats.level >= milestone.level
            const isCurrent = userStats.level === milestone.level
            const isNext = milestone.level === nextMilestone.level

            return (
              <div
                key={milestone.level}
                className={`milestone ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isNext ? 'next' : ''}`}
              >
                <div className="milestone-icon" style={{
                  background: isCompleted ? milestone.color : 'transparent',
                  borderColor: milestone.color
                }}>
                  {milestone.icon}
                </div>
                <div className="milestone-info">
                  <div className="milestone-level">Level {milestone.level}</div>
                  <div className="milestone-title">{milestone.title}</div>
                  <div className="milestone-xp">{milestone.xpRequired.toLocaleString()} XP</div>
                </div>
                {index < LEVEL_MILESTONES.length - 1 && (
                  <div className={`milestone-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="next-milestone">
          <div className="next-label">Nächster Meilenstein</div>
          <div className="next-info">
            <span className="next-icon">{nextMilestone.icon}</span>
            <span className="next-title">{nextMilestone.title}</span>
            <span className="next-level">Level {nextMilestone.level}</span>
          </div>
          <div className="xp-needed">
            Noch {(nextMilestone.xpRequired - userStats.totalXp).toLocaleString()} XP
          </div>
        </div>
      </div>
    </>
  )
}

export default LevelPopover
