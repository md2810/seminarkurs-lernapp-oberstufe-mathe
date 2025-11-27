import { motion } from 'framer-motion'
import { Zap, Flame, Trophy, Star, Target, CheckCircle, Lock, Sparkles, TrendingUp, SkipForward } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import './Progress.css'

// Progress milestones for the vertical path
const MILESTONES = [
  { level: 1, xpRequired: 0, title: 'Anfänger', icon: Star, unlocked: true },
  { level: 2, xpRequired: 100, title: 'Lernender', icon: Target },
  { level: 3, xpRequired: 300, title: 'Fortgeschritten', icon: TrendingUp },
  { level: 4, xpRequired: 600, title: 'Experte', icon: Sparkles },
  { level: 5, xpRequired: 1000, title: 'Meister', icon: Trophy },
  { level: 6, xpRequired: 1500, title: 'Großmeister', icon: Flame },
  { level: 7, xpRequired: 2100, title: 'Champion', icon: Zap },
  { level: 8, xpRequired: 2800, title: 'Legende', icon: Star },
  { level: 9, xpRequired: 3600, title: 'Mythisch', icon: Sparkles },
  { level: 10, xpRequired: 4500, title: 'Göttlich', icon: Trophy },
  { level: 11, xpRequired: 5500, title: 'Transzendent', icon: Flame },
]

function ProgressPath({ userStats }) {
  const currentXp = userStats.totalXp || userStats.xp || 0
  const currentLevel = userStats.level || 1

  // Calculate progress to next level
  const currentMilestone = MILESTONES.find(m => m.level === currentLevel) || MILESTONES[0]
  const nextMilestone = MILESTONES.find(m => m.level === currentLevel + 1)

  let progressPercent = 100
  if (nextMilestone) {
    const xpInCurrentLevel = currentXp - currentMilestone.xpRequired
    const xpNeededForLevel = nextMilestone.xpRequired - currentMilestone.xpRequired
    progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
  }

  return (
    <div className="progress-path">
      {MILESTONES.map((milestone, index) => {
        const Icon = milestone.icon
        const isUnlocked = currentXp >= milestone.xpRequired
        const isCurrent = milestone.level === currentLevel
        const isNext = milestone.level === currentLevel + 1

        return (
          <motion.div
            key={milestone.level}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`milestone ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
          >
            {/* Connecting line to previous milestone */}
            {index > 0 && (
              <div className="milestone-line">
                <motion.div
                  className="milestone-line-fill"
                  initial={{ height: 0 }}
                  animate={{ height: isUnlocked ? '100%' : '0%' }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                />
              </div>
            )}

            {/* Milestone node */}
            <motion.div
              className={`milestone-node ${isCurrent ? 'pulse' : ''}`}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {isUnlocked ? (
                <Icon className="w-6 h-6" />
              ) : (
                <Lock className="w-5 h-5" />
              )}

              {isCurrent && (
                <motion.div
                  className="milestone-glow"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </motion.div>

            {/* Milestone info */}
            <div className="milestone-info">
              <span className="milestone-level">Level {milestone.level}</span>
              <span className="milestone-title">{milestone.title}</span>
              {!isUnlocked && (
                <span className="milestone-xp-needed">
                  {milestone.xpRequired - currentXp} XP benötigt
                </span>
              )}
              {isCurrent && nextMilestone && (
                <div className="milestone-progress-bar">
                  <motion.div
                    className="milestone-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                  <span className="milestone-progress-text">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="stat-card"
    >
      <div className={`stat-icon ${gradient}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </motion.div>
  )
}

export default function Progress() {
  // Get user stats from the store
  const { getUserStats } = useAppStore()
  const userStats = getUserStats()

  const totalXp = userStats.totalXp || 0
  const streak = userStats.streak || 0
  const level = userStats.level || 1
  const xpToNextLevel = userStats.xpToNextLevel || 100
  const questionsAnswered = userStats.questionsAnswered || 0
  const correctAnswers = userStats.correctAnswers || 0
  const skippedQuestions = userStats.skippedQuestions || 0
  const accuracy = userStats.accuracy || 0

  return (
    <div className="progress-view">
      {/* Header */}
      <motion.div
        className="progress-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="progress-title">
          <Trophy className="w-7 h-7" />
          Dein Fortschritt
        </h1>
        <p className="progress-subtitle">
          Verfolge deine Lernreise und sammle XP
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={Zap}
          label="Gesamt XP"
          value={totalXp.toLocaleString()}
          gradient="gradient-xp"
          delay={0.1}
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${streak} Fragen`}
          gradient="gradient-streak"
          delay={0.15}
        />
        <StatCard
          icon={Star}
          label="Level"
          value={level}
          gradient="gradient-level"
          delay={0.2}
        />
        <StatCard
          icon={CheckCircle}
          label="Richtig"
          value={`${correctAnswers}/${questionsAnswered}`}
          gradient="gradient-questions"
          delay={0.25}
        />
        <StatCard
          icon={Target}
          label="Genauigkeit"
          value={`${accuracy}%`}
          gradient="gradient-accuracy"
          delay={0.3}
        />
        <StatCard
          icon={SkipForward}
          label="Übersprungen"
          value={skippedQuestions}
          gradient="gradient-skipped"
          delay={0.35}
        />
      </div>

      {/* XP to Next Level */}
      {xpToNextLevel > 0 && (
        <motion.div
          className="xp-to-next"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="xp-info">
            <span className="xp-current">Level {level}</span>
            <span className="xp-needed">{xpToNextLevel} XP bis Level {level + 1}</span>
          </div>
          <div className="xp-bar">
            <motion.div
              className="xp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${userStats.progressPercent || 0}%` }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />
          </div>
        </motion.div>
      )}

      {/* Level Progress Section */}
      <motion.div
        className="level-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="section-title">Level-Fortschritt</h2>
        <ProgressPath userStats={userStats} />
      </motion.div>
    </div>
  )
}
