/**
 * Task Logger Utility
 * Logs user task performance for analytics and AUTO mode optimization
 */

export const logTask = (taskData) => {
  try {
    const existingLog = JSON.parse(localStorage.getItem('taskLog') || '[]')

    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      taskId: taskData.taskId,
      topicId: taskData.topicId,
      difficulty: taskData.difficulty,
      correct: taskData.correct,
      timeSpent: taskData.timeSpent, // in seconds
      hintsUsed: taskData.hintsUsed || 0,
      xpEarned: taskData.xpEarned,
      userAnswer: taskData.userAnswer || null,
      // Additional metadata
      gradeLevel: taskData.gradeLevel || 'Klasse_11',
      courseType: taskData.courseType || 'Leistungsfach'
    }

    existingLog.push(logEntry)

    // Keep only last 1000 entries to avoid localStorage bloat
    if (existingLog.length > 1000) {
      existingLog.shift()
    }

    localStorage.setItem('taskLog', JSON.stringify(existingLog))

    return logEntry
  } catch (error) {
    console.error('Error logging task:', error)
    return null
  }
}

export const getTaskLog = () => {
  try {
    return JSON.parse(localStorage.getItem('taskLog') || '[]')
  } catch (error) {
    console.error('Error retrieving task log:', error)
    return []
  }
}

export const getTaskStatistics = () => {
  const log = getTaskLog()

  if (log.length === 0) {
    return {
      totalTasks: 0,
      correctTasks: 0,
      accuracy: 0,
      avgTimeSpent: 0,
      avgHintsUsed: 0,
      totalXP: 0,
      difficultyCounts: {}
    }
  }

  const totalTasks = log.length
  const correctTasks = log.filter(task => task.correct).length
  const accuracy = (correctTasks / totalTasks) * 100

  const totalTimeSpent = log.reduce((acc, task) => acc + (task.timeSpent || 0), 0)
  const avgTimeSpent = totalTimeSpent / totalTasks

  const totalHintsUsed = log.reduce((acc, task) => acc + (task.hintsUsed || 0), 0)
  const avgHintsUsed = totalHintsUsed / totalTasks

  const totalXP = log.reduce((acc, task) => acc + (task.xpEarned || 0), 0)

  const difficultyCounts = log.reduce((acc, task) => {
    const diff = task.difficulty || 'Unknown'
    acc[diff] = (acc[diff] || 0) + 1
    return acc
  }, {})

  return {
    totalTasks,
    correctTasks,
    accuracy,
    avgTimeSpent,
    avgHintsUsed,
    totalXP,
    difficultyCounts
  }
}

export const clearTaskLog = () => {
  try {
    localStorage.removeItem('taskLog')
    return true
  } catch (error) {
    console.error('Error clearing task log:', error)
    return false
  }
}

// Get performance trend (last N tasks)
export const getPerformanceTrend = (numTasks = 10) => {
  const log = getTaskLog()
  const recentTasks = log.slice(-numTasks)

  if (recentTasks.length === 0) return []

  return recentTasks.map(task => ({
    timestamp: task.timestamp,
    correct: task.correct,
    difficulty: task.difficulty
  }))
}

export default {
  logTask,
  getTaskLog,
  getTaskStatistics,
  clearTaskLog,
  getPerformanceTrend
}
