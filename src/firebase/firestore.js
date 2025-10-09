import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

/**
 * Database Structure:
 *
 * users/{userId}/
 *   - profile: {displayName, email, createdAt}
 *   - stats: {level, xp, xpToNextLevel, streak, totalXp, lastActiveDate}
 *   - settings: {theme, aiModel, gradeLevel, courseType}
 *   - learningPlan: {topics: [{id, title, progress, completed, total, lastAccessed}]}
 *   - memories: [{timestamp, content, context, importance, tags}]
 *   - taskHistory: [{taskId, topicId, difficulty, correct, timeSpent, hintsUsed, timestamp}]
 */

// ==================== USER PROFILE ====================

/**
 * Initialize user profile on first login
 */
export async function initializeUserProfile(userId, userData) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Create initial user document
      await setDoc(userRef, {
        profile: {
          displayName: userData.displayName || '',
          email: userData.email || '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        },
        stats: {
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          streak: 0,
          totalXp: 0,
          lastActiveDate: new Date().toISOString().split('T')[0]
        },
        settings: {
          theme: {
            name: 'Orange',
            primary: '#f97316'
          },
          aiModel: {
            detailLevel: 50,
            temperature: 0.5,
            helpfulness: 50,
            autoMode: true
          },
          gradeLevel: 'Klasse_11',
          courseType: 'Leistungsfach'
        },
        learningPlan: {
          topics: []
        },
        memories: [],
        taskHistory: []
      })
      console.log('User profile initialized')
    } else {
      // Update last login
      await updateDoc(userRef, {
        'profile.lastLogin': serverTimestamp()
      })
    }

    return true
  } catch (error) {
    console.error('Error initializing user profile:', error)
    throw error
  }
}

/**
 * Get user profile data
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data()
    } else {
      console.log('No user profile found')
      return null
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

// ==================== USER STATS ====================

/**
 * Update user stats (level, xp, streak, etc.)
 */
export async function updateUserStats(userId, stats) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      stats: stats,
      'profile.lastLogin': serverTimestamp()
    })
    console.log('User stats updated')
  } catch (error) {
    console.error('Error updating user stats:', error)
    throw error
  }
}

/**
 * Get user stats
 */
export async function getUserStats(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data().stats
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    throw error
  }
}

/**
 * Calculate and update streak
 */
export async function updateStreak(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const stats = userSnap.data().stats
      const today = new Date().toISOString().split('T')[0]
      const lastActive = stats.lastActiveDate

      let newStreak = stats.streak

      if (lastActive !== today) {
        const lastActiveDate = new Date(lastActive)
        const todayDate = new Date(today)
        const dayDiff = Math.floor((todayDate - lastActiveDate) / (1000 * 60 * 60 * 24))

        if (dayDiff === 1) {
          // Consecutive day - increment streak
          newStreak = stats.streak + 1
        } else if (dayDiff > 1) {
          // Streak broken - reset
          newStreak = 1
        }
        // If dayDiff === 0, same day, keep streak

        await updateDoc(userRef, {
          'stats.streak': newStreak,
          'stats.lastActiveDate': today
        })
      }

      return newStreak
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    throw error
  }
}

// ==================== SETTINGS ====================

/**
 * Update user settings
 */
export async function updateUserSettings(userId, settings) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      settings: settings
    })
    console.log('User settings updated')
  } catch (error) {
    console.error('Error updating user settings:', error)
    throw error
  }
}

/**
 * Get user settings
 */
export async function getUserSettings(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data().settings
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user settings:', error)
    throw error
  }
}

// ==================== LEARNING PLAN ====================

/**
 * Update learning plan topics
 */
export async function updateLearningPlan(userId, topics) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      'learningPlan.topics': topics
    })
    console.log('Learning plan updated')
  } catch (error) {
    console.error('Error updating learning plan:', error)
    throw error
  }
}

/**
 * Get learning plan
 */
export async function getLearningPlan(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data().learningPlan
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting learning plan:', error)
    throw error
  }
}

// ==================== TASK HISTORY ====================

/**
 * Add task to history
 */
export async function addTaskToHistory(userId, taskData) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const taskHistory = userSnap.data().taskHistory || []
      taskHistory.push({
        ...taskData,
        timestamp: serverTimestamp()
      })

      await updateDoc(userRef, {
        taskHistory: taskHistory
      })
      console.log('Task added to history')
    }
  } catch (error) {
    console.error('Error adding task to history:', error)
    throw error
  }
}

/**
 * Get task history (optionally filtered)
 */
export async function getTaskHistory(userId, filters = {}) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      let taskHistory = userSnap.data().taskHistory || []

      // Apply filters if provided
      if (filters.topicId) {
        taskHistory = taskHistory.filter(task => task.topicId === filters.topicId)
      }
      if (filters.difficulty) {
        taskHistory = taskHistory.filter(task => task.difficulty === filters.difficulty)
      }
      if (filters.limit) {
        taskHistory = taskHistory.slice(-filters.limit)
      }

      return taskHistory
    } else {
      return []
    }
  } catch (error) {
    console.error('Error getting task history:', error)
    throw error
  }
}

// ==================== AI MEMORIES ====================

/**
 * Add memory for AI context
 * @param {string} userId
 * @param {Object} memoryData - {content, context, importance, tags}
 */
export async function addMemory(userId, memoryData) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const memories = userSnap.data().memories || []
      memories.push({
        ...memoryData,
        timestamp: serverTimestamp()
      })

      // Keep only last 100 memories
      const recentMemories = memories.slice(-100)

      await updateDoc(userRef, {
        memories: recentMemories
      })
      console.log('Memory added')
    }
  } catch (error) {
    console.error('Error adding memory:', error)
    throw error
  }
}

/**
 * Get AI memories for context
 * @param {string} userId
 * @param {Object} filters - {tags, limit, importance}
 */
export async function getMemories(userId, filters = {}) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      let memories = userSnap.data().memories || []

      // Apply filters
      if (filters.tags && filters.tags.length > 0) {
        memories = memories.filter(memory =>
          memory.tags && memory.tags.some(tag => filters.tags.includes(tag))
        )
      }

      if (filters.importance) {
        memories = memories.filter(memory =>
          memory.importance >= filters.importance
        )
      }

      // Sort by timestamp (most recent first)
      memories.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0
        const bTime = b.timestamp?.seconds || 0
        return bTime - aTime
      })

      if (filters.limit) {
        memories = memories.slice(0, filters.limit)
      }

      return memories
    } else {
      return []
    }
  } catch (error) {
    console.error('Error getting memories:', error)
    throw error
  }
}

// ==================== REAL-TIME LISTENERS ====================

/**
 * Subscribe to user data changes in real-time
 * @param {string} userId
 * @param {Function} callback - Called when data changes
 * @returns {Function} unsubscribe function
 */
export function subscribeToUserData(userId, callback) {
  const userRef = doc(db, 'users', userId)

  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  }, (error) => {
    console.error('Error in real-time listener:', error)
  })
}

/**
 * Subscribe to user stats only
 */
export function subscribeToUserStats(userId, callback) {
  const userRef = doc(db, 'users', userId)

  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().stats)
    }
  }, (error) => {
    console.error('Error in stats listener:', error)
  })
}
