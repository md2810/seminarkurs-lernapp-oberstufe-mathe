import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './StatsPopover.css'

function StatsPopover({ isOpen, onClose, userStats, anchorRef }) {
  const [position, setPosition] = useState(() => {
    // Calculate initial position immediately
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      const isMobile = window.innerWidth < 768

      if (isMobile) {
        return { top: 0, left: 0 }
      }

      const popoverWidth = 380
      let left = rect.left + rect.width / 2

      if (left + popoverWidth / 2 > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth / 2 - 16
      }

      if (left - popoverWidth / 2 < 16) {
        left = popoverWidth / 2 + 16
      }

      return {
        top: rect.bottom + 10,
        left: left
      }
    }
    return { top: 0, left: 0 }
  })

  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      const isMobile = window.innerWidth < 768

      if (isMobile) {
        setPosition({ top: 0, left: 0 })
      } else {
        const popoverWidth = 380
        let left = rect.left + rect.width / 2

        if (left + popoverWidth / 2 > window.innerWidth - 16) {
          left = window.innerWidth - popoverWidth / 2 - 16
        }

        if (left - popoverWidth / 2 < 16) {
          left = popoverWidth / 2 + 16
        }

        setPosition({
          top: rect.bottom + 10,
          left: left
        })
      }
    }
  }, [isOpen, anchorRef])

  const progressPercent = (userStats.xp / userStats.xpToNextLevel) * 100
  const xpNeeded = userStats.xpToNextLevel - userStats.xp
  const isMobile = window.innerWidth < 768

  // Calculate transform-origin for morph effect
  const transformOrigin = anchorRef?.current ? (() => {
    const rect = anchorRef.current.getBoundingClientRect()
    const originX = rect.left + rect.width / 2
    const originY = rect.bottom
    return `${originX}px ${originY}px`
  })() : 'center top'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="stats-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className={`stats-popover ${isMobile ? 'mobile' : ''}`}
            style={!isMobile ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translateX(-50%)',
              transformOrigin: transformOrigin
            } : {}}
            initial={{
              opacity: 0,
              scale: 0.3,
              y: isMobile ? 100 : -20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.3,
              y: isMobile ? 100 : -20
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
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

        {/* XP Progression Path */}
        <motion.div
          className="xp-path"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="path-title">Dein Level-Pfad</div>
          <div className="path-track">
            {[
              { level: userStats.level, xp: 0, label: 'Aktuell', icon: '📍', active: true },
              { level: userStats.level + 1, xp: userStats.xpToNextLevel, label: `Level ${userStats.level + 1}`, icon: '🎯', active: false },
              { level: userStats.level + 2, xp: userStats.xpToNextLevel * 2.2, label: `Level ${userStats.level + 2}`, icon: '⭐', active: false },
              { level: userStats.level + 3, xp: userStats.xpToNextLevel * 3.5, label: `Level ${userStats.level + 3}`, icon: '🏆', active: false }
            ].map((milestone, index) => {
              const isReached = index === 0
              const progress = index === 0 ? 100 : (index === 1 ? progressPercent : 0)

              return (
                <motion.div
                  key={milestone.level}
                  className={`path-milestone ${isReached ? 'reached' : ''} ${milestone.active ? 'active' : ''}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="milestone-icon">{milestone.icon}</div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default StatsPopover
