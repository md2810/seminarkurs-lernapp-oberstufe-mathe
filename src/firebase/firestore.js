import {
  doc,
  getDoc,
  getDocs,
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

// ==================== GENERATED QUESTIONS ====================

/**
 * Save generated questions to Firestore
 * @param {string} userId
 * @param {Object} questionsData - {sessionId, learningPlanItemId, topics, userContext, questions}
 */
export async function saveGeneratedQuestions(userId, questionsData) {
  try {
    const questionsRef = doc(db, 'users', userId, 'generatedQuestions', questionsData.sessionId)
    await setDoc(questionsRef, {
      ...questionsData,
      createdAt: serverTimestamp()
    })
    console.log('Generated questions saved')
    return questionsData.sessionId
  } catch (error) {
    console.error('Error saving generated questions:', error)
    throw error
  }
}

/**
 * Get generated questions by session ID
 * @param {string} userId
 * @param {string} sessionId
 */
export async function getGeneratedQuestions(userId, sessionId) {
  try {
    const questionsRef = doc(db, 'users', userId, 'generatedQuestions', sessionId)
    const questionsSnap = await getDoc(questionsRef)

    if (questionsSnap.exists()) {
      return questionsSnap.data()
    } else {
      console.log('No questions found for session:', sessionId)
      return null
    }
  } catch (error) {
    console.error('Error getting generated questions:', error)
    throw error
  }
}

/**
 * Get all generated question sessions for a user
 * @param {string} userId
 */
export async function getAllQuestionSessions(userId) {
  try {
    const questionsCol = collection(db, 'users', userId, 'generatedQuestions')
    const q = query(questionsCol, orderBy('createdAt', 'desc'), limit(20))
    const querySnapshot = await getDocs(q)

    const sessions = []
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() })
    })

    return sessions
  } catch (error) {
    console.error('Error getting question sessions:', error)
    throw error
  }
}

// ==================== QUESTION PROGRESS ====================

/**
 * Save question progress
 * @param {string} userId
 * @param {Object} progressData
 */
export async function saveQuestionProgress(userId, progressData) {
  try {
    const progressRef = doc(db, 'users', userId, 'questionProgress', progressData.questionId)
    await setDoc(progressRef, {
      ...progressData,
      updatedAt: serverTimestamp()
    }, { merge: true })
    console.log('Question progress saved')
  } catch (error) {
    console.error('Error saving question progress:', error)
    throw error
  }
}

/**
 * Get question progress
 * @param {string} userId
 * @param {string} questionId
 */
export async function getQuestionProgress(userId, questionId) {
  try {
    const progressRef = doc(db, 'users', userId, 'questionProgress', questionId)
    const progressSnap = await getDoc(progressRef)

    if (progressSnap.exists()) {
      return progressSnap.data()
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting question progress:', error)
    throw error
  }
}

/**
 * Get all progress for a session
 * @param {string} userId
 * @param {string} sessionId
 */
export async function getSessionProgress(userId, sessionId) {
  try {
    const progressCol = collection(db, 'users', userId, 'questionProgress')
    const q = query(progressCol, where('sessionId', '==', sessionId))
    const querySnapshot = await getDocs(q)

    const progress = []
    querySnapshot.forEach((doc) => {
      progress.push({ id: doc.id, ...doc.data() })
    })

    return progress
  } catch (error) {
    console.error('Error getting session progress:', error)
    throw error
  }
}

/**
 * Get recent performance data for AUTO mode
 * @param {string} userId
 * @param {number} limit - Number of recent questions to analyze
 */
export async function getRecentPerformance(userId, limitCount = 10) {
  try {
    const progressCol = collection(db, 'users', userId, 'questionProgress')
    const q = query(
      progressCol,
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)

    const recentQuestions = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      recentQuestions.push({
        correct: data.isCorrect,
        hintsUsed: data.hintsUsed,
        timeSpent: data.timeSpent,
        topic: data.topic,
        difficulty: data.difficulty
      })
    })

    // Calculate analytics
    const avgAccuracy = recentQuestions.length > 0
      ? recentQuestions.filter(q => q.correct).length / recentQuestions.length * 100
      : 0

    const avgHintsUsed = recentQuestions.length > 0
      ? recentQuestions.reduce((sum, q) => sum + q.hintsUsed, 0) / recentQuestions.length
      : 0

    const avgTimeSpent = recentQuestions.length > 0
      ? recentQuestions.reduce((sum, q) => sum + q.timeSpent, 0) / recentQuestions.length
      : 0

    // Find struggling topics (< 50% accuracy)
    const topicAccuracy = {}
    recentQuestions.forEach(q => {
      if (!topicAccuracy[q.topic]) {
        topicAccuracy[q.topic] = { correct: 0, total: 0 }
      }
      topicAccuracy[q.topic].total++
      if (q.correct) topicAccuracy[q.topic].correct++
    })

    const strugglingTopics = Object.entries(topicAccuracy)
      .filter(([topic, stats]) => stats.correct / stats.total < 0.5)
      .map(([topic]) => topic)

    return {
      last10Questions: recentQuestions,
      avgAccuracy,
      avgHintsUsed,
      avgTimeSpent,
      strugglingTopics
    }
  } catch (error) {
    console.error('Error getting recent performance:', error)
    throw error
  }
}

// ==================== AUTO MODE ASSESSMENTS ====================

/**
 * Save AUTO mode assessment
 * @param {string} userId
 * @param {Object} assessmentData
 */
export async function saveAutoModeAssessment(userId, assessmentData) {
  try {
    const assessmentRef = doc(db, 'users', userId, 'autoModeAssessments', assessmentData.assessmentId)
    await setDoc(assessmentRef, {
      ...assessmentData,
      timestamp: serverTimestamp()
    })
    console.log('AUTO mode assessment saved')
    return assessmentData.assessmentId
  } catch (error) {
    console.error('Error saving AUTO mode assessment:', error)
    throw error
  }
}

/**
 * Get latest AUTO mode assessment
 * @param {string} userId
 */
export async function getLatestAutoModeAssessment(userId) {
  try {
    const assessmentCol = collection(db, 'users', userId, 'autoModeAssessments')
    const q = query(assessmentCol, orderBy('timestamp', 'desc'), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting latest AUTO mode assessment:', error)
    throw error
  }
}

/**
 * Get AUTO mode assessment history
 * @param {string} userId
 * @param {number} limitCount
 */
export async function getAutoModeAssessmentHistory(userId, limitCount = 10) {
  try {
    const assessmentCol = collection(db, 'users', userId, 'autoModeAssessments')
    const q = query(assessmentCol, orderBy('timestamp', 'desc'), limit(limitCount))
    const querySnapshot = await getDocs(q)

    const assessments = []
    querySnapshot.forEach((doc) => {
      assessments.push({ id: doc.id, ...doc.data() })
    })

    return assessments
  } catch (error) {
    console.error('Error getting AUTO mode assessment history:', error)
    throw error
  }
}

// ==================== LEARNING SESSIONS ====================

/**
 * Create a new learning session
 * @param {string} userId
 * @param {Object} sessionData
 */
export async function createLearningSession(userId, sessionData) {
  try {
    const sessionRef = doc(db, 'users', userId, 'learningSessions', sessionData.sessionId)
    await setDoc(sessionRef, {
      ...sessionData,
      startedAt: serverTimestamp(),
      endedAt: null,
      questionsCompleted: 0,
      totalXpEarned: 0,
      avgAccuracy: 0,
      totalTimeSpent: 0
    })
    console.log('Learning session created')
    return sessionData.sessionId
  } catch (error) {
    console.error('Error creating learning session:', error)
    throw error
  }
}

/**
 * Update learning session progress
 * @param {string} userId
 * @param {string} sessionId
 * @param {Object} updates
 */
export async function updateLearningSession(userId, sessionId, updates) {
  try {
    const sessionRef = doc(db, 'users', userId, 'learningSessions', sessionId)
    await updateDoc(sessionRef, updates)
    console.log('Learning session updated')
  } catch (error) {
    console.error('Error updating learning session:', error)
    throw error
  }
}

/**
 * Complete a learning session
 * @param {string} userId
 * @param {string} sessionId
 * @param {Object} finalStats
 */
export async function completeLearningSession(userId, sessionId, finalStats) {
  try {
    const sessionRef = doc(db, 'users', userId, 'learningSessions', sessionId)
    await updateDoc(sessionRef, {
      ...finalStats,
      endedAt: serverTimestamp()
    })
    console.log('Learning session completed')
  } catch (error) {
    console.error('Error completing learning session:', error)
    throw error
  }
}

/**
 * Get learning session
 * @param {string} userId
 * @param {string} sessionId
 */
export async function getLearningSession(userId, sessionId) {
  try {
    const sessionRef = doc(db, 'users', userId, 'learningSessions', sessionId)
    const sessionSnap = await getDoc(sessionRef)

    if (sessionSnap.exists()) {
      return sessionSnap.data()
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting learning session:', error)
    throw error
  }
}

/**
 * Get recent learning sessions
 * @param {string} userId
 * @param {number} limitCount
 */
export async function getRecentLearningSessions(userId, limitCount = 10) {
  try {
    const sessionCol = collection(db, 'users', userId, 'learningSessions')
    const q = query(sessionCol, orderBy('startedAt', 'desc'), limit(limitCount))
    const querySnapshot = await getDocs(q)

    const sessions = []
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() })
    })

    return sessions
  } catch (error) {
    console.error('Error getting recent learning sessions:', error)
    throw error
  }
}

// ==================== TOPIC-BASED PROGRESS ====================

/**
 * Get or create topic progress data
 * @param {string} userId
 * @param {string} topicKey - e.g., "Analysis|Ableitungen|Potenzregel"
 */
export async function getTopicProgress(userId, topicKey) {
  try {
    const topicRef = doc(db, 'users', userId, 'topicProgress', topicKey)
    const topicSnap = await getDoc(topicRef)

    if (topicSnap.exists()) {
      return topicSnap.data()
    } else {
      // Initialize new topic progress
      const initialProgress = {
        topicKey,
        questionsCompleted: 0,
        totalQuestions: 0,
        lastSessionId: null,
        lastAccessed: null,
        needsMoreQuestions: true,
        avgAccuracy: 0,
        createdAt: serverTimestamp()
      }
      await setDoc(topicRef, initialProgress)
      return initialProgress
    }
  } catch (error) {
    console.error('Error getting topic progress:', error)
    throw error
  }
}

/**
 * Update topic progress
 * @param {string} userId
 * @param {string} topicKey
 * @param {Object} updates
 */
export async function updateTopicProgress(userId, topicKey, updates) {
  try {
    const topicRef = doc(db, 'users', userId, 'topicProgress', topicKey)
    await updateDoc(topicRef, {
      ...updates,
      lastAccessed: serverTimestamp()
    })
    console.log('Topic progress updated')
  } catch (error) {
    console.error('Error updating topic progress:', error)
    throw error
  }
}

/**
 * Get all topics with progress for dashboard
 * @param {string} userId
 */
export async function getAllTopicsWithProgress(userId) {
  try {
    const topicCol = collection(db, 'users', userId, 'topicProgress')
    const q = query(topicCol, orderBy('lastAccessed', 'desc'), limit(50))
    const querySnapshot = await getDocs(q)

    const topics = []
    querySnapshot.forEach((doc) => {
      topics.push({ id: doc.id, ...doc.data() })
    })

    return topics
  } catch (error) {
    console.error('Error getting all topics with progress:', error)
    throw error
  }
}

// ==================== SPACED REPETITION ====================

/**
 * Mark a question for review (spaced repetition)
 * @param {string} userId
 * @param {string} questionId
 * @param {Object} reviewData
 */
export async function scheduleQuestionReview(userId, questionId, reviewData) {
  try {
    const reviewRef = doc(db, 'users', userId, 'reviewQueue', questionId)
    const now = new Date()

    // Calculate next review date based on performance
    let daysUntilReview = 1 // Default: review tomorrow
    if (reviewData.isCorrect) {
      // Correct answer: increase interval
      daysUntilReview = reviewData.previousInterval ? reviewData.previousInterval * 2 : 3
    } else {
      // Incorrect answer: review sooner
      daysUntilReview = 1
    }

    const nextReviewDate = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000)

    await setDoc(reviewRef, {
      questionId: reviewData.questionId,
      sessionId: reviewData.sessionId,
      topicKey: reviewData.topicKey,
      question: reviewData.question,
      difficulty: reviewData.difficulty,
      lastReviewedAt: serverTimestamp(),
      nextReviewDate: nextReviewDate.toISOString(),
      reviewCount: (reviewData.previousReviewCount || 0) + 1,
      intervalDays: daysUntilReview,
      lastResult: reviewData.isCorrect ? 'correct' : 'incorrect',
      consecutiveCorrect: reviewData.isCorrect ? (reviewData.previousConsecutiveCorrect || 0) + 1 : 0
    }, { merge: true })

    console.log('Question scheduled for review')
  } catch (error) {
    console.error('Error scheduling question review:', error)
    throw error
  }
}

/**
 * Get questions due for review
 * @param {string} userId
 */
export async function getDueReviews(userId) {
  try {
    const reviewCol = collection(db, 'users', userId, 'reviewQueue')
    const today = new Date().toISOString()
    const q = query(reviewCol, where('nextReviewDate', '<=', today), limit(20))
    const querySnapshot = await getDocs(q)

    const dueReviews = []
    querySnapshot.forEach((doc) => {
      dueReviews.push({ id: doc.id, ...doc.data() })
    })

    return dueReviews
  } catch (error) {
    console.error('Error getting due reviews:', error)
    throw error
  }
}

/**
 * Get review statistics
 * @param {string} userId
 */
export async function getReviewStats(userId) {
  try {
    const reviewCol = collection(db, 'users', userId, 'reviewQueue')
    const querySnapshot = await getDocs(reviewCol)

    let totalReviews = 0
    let dueToday = 0
    const today = new Date().toISOString()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      totalReviews++
      if (data.nextReviewDate <= today) {
        dueToday++
      }
    })

    return {
      totalReviews,
      dueToday
    }
  } catch (error) {
    console.error('Error getting review stats:', error)
    throw error
  }
}

// ==================== INITIAL KNOWLEDGE ASSESSMENT ====================

/**
 * Save initial knowledge assessment for a learning plan item
 * @param {string} userId
 * @param {object} assessmentData - { planItemId, responses: {themeKey: level}, assessedAt }
 */
export async function saveInitialKnowledge(userId, assessmentData) {
  try {
    const assessmentRef = doc(db, 'users', userId, 'initialKnowledge', assessmentData.planItemId.toString())
    await setDoc(assessmentRef, {
      ...assessmentData,
      assessedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error saving initial knowledge:', error)
    throw error
  }
}

/**
 * Get initial knowledge assessment for a learning plan item
 * @param {string} userId
 * @param {string} planItemId
 */
export async function getInitialKnowledge(userId, planItemId) {
  try {
    const assessmentRef = doc(db, 'users', userId, 'initialKnowledge', planItemId.toString())
    const assessmentSnap = await getDoc(assessmentRef)

    if (assessmentSnap.exists()) {
      return assessmentSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error getting initial knowledge:', error)
    throw error
  }
}

// ============================================================================
// PHASE 4: SOCIAL GAMIFICATION
// ============================================================================

// ==================== ASYNC CHALLENGES ====================

/**
 * Create a challenge to send to another user
 * @param {string} challengerId - User creating the challenge
 * @param {Object} challengeData - { challengeeId, topics, questionCount, timeLimit, message }
 */
export async function createChallenge(challengerId, challengeData) {
  try {
    const challengeId = `challenge_${Date.now()}_${challengerId.substring(0, 8)}`
    const seed = Math.random().toString(36).substring(2, 15)

    const challenge = {
      challengeId,
      challengerId,
      challengeeId: challengeData.challengeeId,
      topics: challengeData.topics,
      questionCount: challengeData.questionCount || 5,
      timeLimit: challengeData.timeLimit || null, // in seconds, null = no limit
      seed, // Used to generate identical questions for both users
      message: challengeData.message || null,
      status: 'pending', // pending, accepted, declined, completed, expired
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      challengerResult: null,
      challengeeResult: null,
      winnerId: null
    }

    // Store in global challenges collection
    const challengeRef = doc(db, 'challenges', challengeId)
    await setDoc(challengeRef, challenge)

    // Add reference to challenger's sent challenges
    const sentRef = doc(db, 'users', challengerId, 'sentChallenges', challengeId)
    await setDoc(sentRef, {
      challengeId,
      challengeeId: challengeData.challengeeId,
      status: 'pending',
      createdAt: serverTimestamp()
    })

    // Add reference to challengee's received challenges
    const receivedRef = doc(db, 'users', challengeData.challengeeId, 'receivedChallenges', challengeId)
    await setDoc(receivedRef, {
      challengeId,
      challengerId,
      status: 'pending',
      createdAt: serverTimestamp()
    })

    console.log('Challenge created:', challengeId)
    return challengeId
  } catch (error) {
    console.error('Error creating challenge:', error)
    throw error
  }
}

/**
 * Accept or decline a challenge
 * @param {string} challengeId
 * @param {string} userId - The challengee
 * @param {boolean} accept
 */
export async function respondToChallenge(challengeId, userId, accept) {
  try {
    const challengeRef = doc(db, 'challenges', challengeId)
    const newStatus = accept ? 'accepted' : 'declined'

    await updateDoc(challengeRef, {
      status: newStatus,
      respondedAt: serverTimestamp()
    })

    // Update user's received challenge reference
    const receivedRef = doc(db, 'users', userId, 'receivedChallenges', challengeId)
    await updateDoc(receivedRef, {
      status: newStatus
    })

    // Update challenger's sent challenge reference
    const challengeSnap = await getDoc(challengeRef)
    if (challengeSnap.exists()) {
      const challengerId = challengeSnap.data().challengerId
      const sentRef = doc(db, 'users', challengerId, 'sentChallenges', challengeId)
      await updateDoc(sentRef, {
        status: newStatus
      })
    }

    console.log(`Challenge ${challengeId} ${newStatus}`)
    return newStatus
  } catch (error) {
    console.error('Error responding to challenge:', error)
    throw error
  }
}

/**
 * Submit challenge result
 * @param {string} challengeId
 * @param {string} userId
 * @param {Object} result - { score, correctAnswers, totalQuestions, timeSpent }
 */
export async function submitChallengeResult(challengeId, userId, result) {
  try {
    const challengeRef = doc(db, 'challenges', challengeId)
    const challengeSnap = await getDoc(challengeRef)

    if (!challengeSnap.exists()) {
      throw new Error('Challenge not found')
    }

    const challenge = challengeSnap.data()
    const isChallenger = challenge.challengerId === userId
    const resultField = isChallenger ? 'challengerResult' : 'challengeeResult'

    const updateData = {
      [resultField]: {
        ...result,
        submittedAt: serverTimestamp()
      }
    }

    // Check if both results are now in to determine winner
    const otherResult = isChallenger ? challenge.challengeeResult : challenge.challengerResult

    if (otherResult) {
      // Both have submitted - determine winner
      const challengerScore = isChallenger ? result.score : otherResult.score
      const challengeeScore = isChallenger ? otherResult.score : result.score

      if (challengerScore > challengeeScore) {
        updateData.winnerId = challenge.challengerId
      } else if (challengeeScore > challengerScore) {
        updateData.winnerId = challenge.challengeeId
      } else {
        // Tie - winner is whoever was faster
        const challengerTime = isChallenger ? result.timeSpent : otherResult.timeSpent
        const challengeeTime = isChallenger ? otherResult.timeSpent : result.timeSpent
        updateData.winnerId = challengerTime <= challengeeTime ? challenge.challengerId : challenge.challengeeId
      }

      updateData.status = 'completed'
      updateData.completedAt = serverTimestamp()
    }

    await updateDoc(challengeRef, updateData)

    console.log('Challenge result submitted')
    return updateData.winnerId || null
  } catch (error) {
    console.error('Error submitting challenge result:', error)
    throw error
  }
}

/**
 * Get pending challenges for a user
 * @param {string} userId
 */
export async function getPendingChallenges(userId) {
  try {
    const receivedCol = collection(db, 'users', userId, 'receivedChallenges')
    const q = query(receivedCol, where('status', '==', 'pending'))
    const querySnapshot = await getDocs(q)

    const challenges = []
    for (const docSnap of querySnapshot.docs) {
      const challengeId = docSnap.data().challengeId
      const challengeRef = doc(db, 'challenges', challengeId)
      const challengeSnap = await getDoc(challengeRef)

      if (challengeSnap.exists()) {
        const challengeData = challengeSnap.data()
        // Check if not expired
        if (new Date(challengeData.expiresAt) > new Date()) {
          challenges.push(challengeData)
        }
      }
    }

    return challenges
  } catch (error) {
    console.error('Error getting pending challenges:', error)
    throw error
  }
}

/**
 * Get active challenges (accepted but not completed)
 * @param {string} userId
 */
export async function getActiveChallenges(userId) {
  try {
    const challengesCol = collection(db, 'challenges')

    // Get challenges where user is challenger
    const q1 = query(
      challengesCol,
      where('challengerId', '==', userId),
      where('status', '==', 'accepted')
    )

    // Get challenges where user is challengee
    const q2 = query(
      challengesCol,
      where('challengeeId', '==', userId),
      where('status', '==', 'accepted')
    )

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])

    const challenges = []
    snap1.forEach(doc => challenges.push({ id: doc.id, ...doc.data() }))
    snap2.forEach(doc => challenges.push({ id: doc.id, ...doc.data() }))

    return challenges
  } catch (error) {
    console.error('Error getting active challenges:', error)
    throw error
  }
}

/**
 * Get challenge history
 * @param {string} userId
 * @param {number} limitCount
 */
export async function getChallengeHistory(userId, limitCount = 20) {
  try {
    const challengesCol = collection(db, 'challenges')

    // Get completed challenges where user participated
    const q1 = query(
      challengesCol,
      where('challengerId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    )

    const q2 = query(
      challengesCol,
      where('challengeeId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    )

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])

    const challenges = []
    snap1.forEach(doc => challenges.push({ id: doc.id, ...doc.data() }))
    snap2.forEach(doc => challenges.push({ id: doc.id, ...doc.data() }))

    // Sort by completedAt and limit
    challenges.sort((a, b) => {
      const aTime = a.completedAt?.seconds || 0
      const bTime = b.completedAt?.seconds || 0
      return bTime - aTime
    })

    return challenges.slice(0, limitCount)
  } catch (error) {
    console.error('Error getting challenge history:', error)
    throw error
  }
}

// ==================== SESSION SHARING ====================

/**
 * Create a shareable session link
 * @param {string} userId
 * @param {string} sessionId
 * @param {Object} options - { expiresIn, maxUses }
 */
export async function createShareableSession(userId, sessionId, options = {}) {
  try {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Get the original session data
    const sessionData = await getGeneratedQuestions(userId, sessionId)
    if (!sessionData) {
      throw new Error('Session not found')
    }

    const shareData = {
      shareId,
      originalUserId: userId,
      originalSessionId: sessionId,
      topics: sessionData.topics,
      userContext: {
        gradeLevel: sessionData.userContext?.gradeLevel,
        courseType: sessionData.userContext?.courseType
      },
      // Store the seed for question generation
      seed: sessionData.seed || Math.random().toString(36).substring(2, 15),
      questionCount: sessionData.questions?.length || sessionData.totalQuestions,
      createdAt: serverTimestamp(),
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
      maxUses: options.maxUses || null,
      useCount: 0,
      usedBy: []
    }

    // Store in global shared_sessions collection
    const shareRef = doc(db, 'shared_sessions', shareId)
    await setDoc(shareRef, shareData)

    // Add to user's shared sessions
    const userShareRef = doc(db, 'users', userId, 'sharedSessions', shareId)
    await setDoc(userShareRef, {
      shareId,
      sessionId,
      createdAt: serverTimestamp()
    })

    console.log('Shareable session created:', shareId)
    return shareId
  } catch (error) {
    console.error('Error creating shareable session:', error)
    throw error
  }
}

/**
 * Get shared session data by share ID
 * @param {string} shareId
 */
export async function getSharedSession(shareId) {
  try {
    const shareRef = doc(db, 'shared_sessions', shareId)
    const shareSnap = await getDoc(shareRef)

    if (!shareSnap.exists()) {
      return null
    }

    const data = shareSnap.data()

    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      return { error: 'expired', message: 'Dieser Link ist abgelaufen.' }
    }

    // Check if max uses reached
    if (data.maxUses && data.useCount >= data.maxUses) {
      return { error: 'maxUses', message: 'Dieser Link wurde bereits zu oft verwendet.' }
    }

    return data
  } catch (error) {
    console.error('Error getting shared session:', error)
    throw error
  }
}

/**
 * Use a shared session (copy it to user's account)
 * @param {string} shareId
 * @param {string} userId
 */
export async function useSharedSession(shareId, userId) {
  try {
    const shareRef = doc(db, 'shared_sessions', shareId)
    const shareSnap = await getDoc(shareRef)

    if (!shareSnap.exists()) {
      throw new Error('Shared session not found')
    }

    const shareData = shareSnap.data()

    // Check if expired or max uses
    if (new Date(shareData.expiresAt) < new Date()) {
      throw new Error('Shared session expired')
    }

    if (shareData.maxUses && shareData.useCount >= shareData.maxUses) {
      throw new Error('Shared session max uses reached')
    }

    // Check if user already used this
    if (shareData.usedBy.includes(userId)) {
      throw new Error('You have already used this shared session')
    }

    // Create new session ID for the user
    const newSessionId = `session_${Date.now()}_${userId.substring(0, 8)}`

    // Update share usage stats
    await updateDoc(shareRef, {
      useCount: shareData.useCount + 1,
      usedBy: [...shareData.usedBy, userId]
    })

    console.log('Shared session used successfully')

    return {
      newSessionId,
      topics: shareData.topics,
      userContext: shareData.userContext,
      seed: shareData.seed,
      questionCount: shareData.questionCount,
      originalShareId: shareId
    }
  } catch (error) {
    console.error('Error using shared session:', error)
    throw error
  }
}

// ==================== STREAK FREEZE ====================

/**
 * Get user's inventory (streak freezes, power-ups, etc.)
 * @param {string} userId
 */
export async function getUserInventory(userId) {
  try {
    const inventoryRef = doc(db, 'users', userId, 'inventory', 'items')
    const inventorySnap = await getDoc(inventoryRef)

    if (inventorySnap.exists()) {
      return inventorySnap.data()
    }

    // Initialize default inventory
    const defaultInventory = {
      streakFreezes: 1, // Start with 1 free streak freeze
      xpBoosts: 0,
      hintTokens: 0,
      lastUpdated: serverTimestamp()
    }

    await setDoc(inventoryRef, defaultInventory)
    return defaultInventory
  } catch (error) {
    console.error('Error getting user inventory:', error)
    throw error
  }
}

/**
 * Update user's inventory
 * @param {string} userId
 * @param {Object} updates
 */
export async function updateUserInventory(userId, updates) {
  try {
    const inventoryRef = doc(db, 'users', userId, 'inventory', 'items')
    await setDoc(inventoryRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    }, { merge: true })

    console.log('Inventory updated')
  } catch (error) {
    console.error('Error updating inventory:', error)
    throw error
  }
}

/**
 * Use a streak freeze to prevent streak loss
 * @param {string} userId
 */
export async function useStreakFreeze(userId) {
  try {
    const inventory = await getUserInventory(userId)

    if (inventory.streakFreezes <= 0) {
      return { success: false, error: 'no_freezes', message: 'Keine Streak-Freezes verfügbar' }
    }

    // Get user stats
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      throw new Error('User not found')
    }

    const stats = userSnap.data().stats
    const today = new Date().toISOString().split('T')[0]
    const lastActive = stats.lastActiveDate

    // Only use freeze if streak is actually at risk (missed yesterday)
    const lastActiveDate = new Date(lastActive)
    const todayDate = new Date(today)
    const dayDiff = Math.floor((todayDate - lastActiveDate) / (1000 * 60 * 60 * 24))

    if (dayDiff <= 1) {
      return { success: false, error: 'not_needed', message: 'Streak ist nicht gefährdet' }
    }

    // Use the freeze
    await updateUserInventory(userId, {
      streakFreezes: inventory.streakFreezes - 1
    })

    // Keep the streak but update last active to yesterday
    const yesterday = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await updateDoc(userRef, {
      'stats.lastActiveDate': yesterday
    })

    // Log the freeze usage
    const freezeLogRef = doc(db, 'users', userId, 'streakFreezeLog', `freeze_${Date.now()}`)
    await setDoc(freezeLogRef, {
      usedAt: serverTimestamp(),
      streakPreserved: stats.streak,
      daysMissed: dayDiff
    })

    console.log('Streak freeze used successfully')
    return {
      success: true,
      message: `Streak Freeze verwendet! Dein ${stats.streak}-Tage-Streak wurde gerettet!`,
      remainingFreezes: inventory.streakFreezes - 1
    }
  } catch (error) {
    console.error('Error using streak freeze:', error)
    throw error
  }
}

/**
 * Award streak freeze (e.g., for completing challenges or achievements)
 * @param {string} userId
 * @param {number} count
 * @param {string} reason
 */
export async function awardStreakFreeze(userId, count = 1, reason = 'achievement') {
  try {
    const inventory = await getUserInventory(userId)

    await updateUserInventory(userId, {
      streakFreezes: inventory.streakFreezes + count
    })

    // Log the award
    const awardLogRef = doc(db, 'users', userId, 'streakFreezeLog', `award_${Date.now()}`)
    await setDoc(awardLogRef, {
      awardedAt: serverTimestamp(),
      count,
      reason,
      newTotal: inventory.streakFreezes + count
    })

    console.log(`Awarded ${count} streak freeze(s) for ${reason}`)
    return inventory.streakFreezes + count
  } catch (error) {
    console.error('Error awarding streak freeze:', error)
    throw error
  }
}

/**
 * Check if streak is at risk and prompt for freeze use
 * @param {string} userId
 */
export async function checkStreakStatus(userId) {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return { atRisk: false }
    }

    const stats = userSnap.data().stats
    const today = new Date().toISOString().split('T')[0]
    const lastActive = stats.lastActiveDate

    const lastActiveDate = new Date(lastActive)
    const todayDate = new Date(today)
    const dayDiff = Math.floor((todayDate - lastActiveDate) / (1000 * 60 * 60 * 24))

    if (dayDiff > 1 && stats.streak > 0) {
      const inventory = await getUserInventory(userId)

      return {
        atRisk: true,
        currentStreak: stats.streak,
        daysMissed: dayDiff,
        freezesAvailable: inventory.streakFreezes,
        canUseFreeze: inventory.streakFreezes > 0
      }
    }

    return {
      atRisk: false,
      currentStreak: stats.streak,
      daysMissed: dayDiff
    }
  } catch (error) {
    console.error('Error checking streak status:', error)
    throw error
  }
}

// ==================== FRIEND SYSTEM (for challenges) ====================

/**
 * Search for users by email or display name
 * @param {string} searchQuery
 */
export async function searchUsers(searchQuery) {
  try {
    // Note: This is a simple implementation. For production,
    // consider using Algolia or Firebase Extensions for full-text search
    const usersCol = collection(db, 'users')

    // Search by email (exact match for privacy)
    const emailQuery = query(usersCol, where('profile.email', '==', searchQuery.toLowerCase()))
    const emailSnap = await getDocs(emailQuery)

    const results = []
    emailSnap.forEach(doc => {
      const data = doc.data()
      results.push({
        id: doc.id,
        displayName: data.profile?.displayName || 'Anonym',
        level: data.stats?.level || 1
      })
    })

    return results
  } catch (error) {
    console.error('Error searching users:', error)
    throw error
  }
}

/**
 * Add a friend
 * @param {string} userId
 * @param {string} friendId
 */
export async function addFriend(userId, friendId) {
  try {
    // Add to user's friends list
    const friendRef = doc(db, 'users', userId, 'friends', friendId)
    await setDoc(friendRef, {
      friendId,
      addedAt: serverTimestamp(),
      status: 'active'
    })

    // Add reverse relationship
    const reverseFriendRef = doc(db, 'users', friendId, 'friends', userId)
    await setDoc(reverseFriendRef, {
      friendId: userId,
      addedAt: serverTimestamp(),
      status: 'active'
    })

    console.log('Friend added successfully')
    return true
  } catch (error) {
    console.error('Error adding friend:', error)
    throw error
  }
}

/**
 * Get user's friends list
 * @param {string} userId
 */
export async function getFriends(userId) {
  try {
    const friendsCol = collection(db, 'users', userId, 'friends')
    const q = query(friendsCol, where('status', '==', 'active'))
    const querySnapshot = await getDocs(q)

    const friends = []
    for (const docSnap of querySnapshot.docs) {
      const friendId = docSnap.data().friendId

      // Get friend's profile
      const friendProfile = await getUserProfile(friendId)
      if (friendProfile) {
        friends.push({
          id: friendId,
          displayName: friendProfile.profile?.displayName || 'Anonym',
          level: friendProfile.stats?.level || 1,
          streak: friendProfile.stats?.streak || 0
        })
      }
    }

    return friends
  } catch (error) {
    console.error('Error getting friends:', error)
    throw error
  }
}
