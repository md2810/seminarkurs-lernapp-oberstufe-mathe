import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// XP required for each level
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

// Calculate level from XP
function calculateLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

// Get XP needed for next level
function getXpToNextLevel(xp) {
  const level = calculateLevel(xp)
  if (level >= LEVEL_THRESHOLDS.length) return 0
  return LEVEL_THRESHOLDS[level] - xp
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // View State
      activeView: 'feed', // 'feed' | 'apps' | 'progress'
      setActiveView: (view) => set({ activeView: view }),

      // Command Center State
      isCommandCenterOpen: false,
      openCommandCenter: () => set({ isCommandCenterOpen: true }),
      closeCommandCenter: () => set({ isCommandCenterOpen: false }),
      toggleCommandCenter: () => set((state) => ({
        isCommandCenterOpen: !state.isCommandCenterOpen
      })),

      // Context Engine Data - Topics from Kontext/LearningPlan
      contextData: {
        topics: [],
        deadline: null,
        difficulty: 5,
        lastUpdated: null,
      },
      setContextData: (data) => set((state) => ({
        contextData: { ...state.contextData, ...data, lastUpdated: Date.now() }
      })),
      clearContext: () => set({
        contextData: {
          topics: [],
          deadline: null,
          difficulty: 5,
          lastUpdated: null,
        }
      }),
      addTopicsToContext: (topics) => set((state) => ({
        contextData: {
          ...state.contextData,
          topics: [...state.contextData.topics, ...topics.filter(
            t => !state.contextData.topics.some(
              existing => existing.thema === t.thema && existing.unterthema === t.unterthema
            )
          )],
          lastUpdated: Date.now()
        }
      })),
      removeTopicFromContext: (topic) => set((state) => ({
        contextData: {
          ...state.contextData,
          topics: state.contextData.topics.filter(
            t => !(t.thema === topic.thema && t.unterthema === topic.unterthema)
          ),
          lastUpdated: Date.now()
        }
      })),

      // AI Provider Settings
      aiProvider: 'claude', // 'claude' | 'gemini'
      setAiProvider: (provider) => set({ aiProvider: provider }),

      apiKeys: {
        claude: '',
        gemini: '',
      },
      setApiKey: (provider, key) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key }
      })),

      // Model mode: 'smart' (more capable) or 'fast' (quicker responses)
      modelMode: 'smart', // 'smart' | 'fast'
      setModelMode: (mode) => set({ modelMode: mode }),

      // Smart and Fast models per provider
      smartModels: {
        claude: 'claude-sonnet-4-5-20250929',
        gemini: 'gemini-3-pro-preview',
      },
      fastModels: {
        claude: 'claude-haiku-4-5-20251001',
        gemini: 'gemini-3-flash-preview',
      },
      setSmartModel: (provider, model) => set((state) => ({
        smartModels: { ...state.smartModels, [provider]: model }
      })),
      setFastModel: (provider, model) => set((state) => ({
        fastModels: { ...state.fastModels, [provider]: model }
      })),

      // Get current model based on provider and mode
      getCurrentModel: () => {
        const state = get()
        const models = state.modelMode === 'smart' ? state.smartModels : state.fastModels
        return models[state.aiProvider] || null
      },

      // Legacy: selectedModels for backward compatibility
      selectedModels: {
        claude: 'claude-sonnet-4-5-20250929',
        gemini: 'gemini-3-pro-preview',
      },
      setSelectedModel: (provider, model) => set((state) => ({
        selectedModels: { ...state.selectedModels, [provider]: model }
      })),

      // User Stats with XP/Level system
      stats: {
        xp: 0,
        streak: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        skippedQuestions: 0,
        lastActivityDate: null,
      },

      // Add XP and automatically calculate level
      addXp: (amount) => set((state) => {
        const newXp = state.stats.xp + amount
        return {
          stats: {
            ...state.stats,
            xp: newXp,
          }
        }
      }),

      // Record a correct answer (add XP based on difficulty)
      recordCorrectAnswer: (difficulty = 5, hintsUsed = 0, streakBonus = 0) => set((state) => {
        // Base XP: 10 + difficulty * 2, minus 5 per hint used
        const baseXp = Math.max(5, 10 + difficulty * 2 - hintsUsed * 5)
        const totalXp = baseXp + streakBonus
        const newXp = state.stats.xp + totalXp
        const newStreak = state.stats.streak + 1

        return {
          stats: {
            ...state.stats,
            xp: newXp,
            streak: newStreak,
            questionsAnswered: state.stats.questionsAnswered + 1,
            correctAnswers: state.stats.correctAnswers + 1,
            lastActivityDate: new Date().toISOString().split('T')[0],
          }
        }
      }),

      // Record a wrong answer (no XP, reset streak)
      recordWrongAnswer: () => set((state) => ({
        stats: {
          ...state.stats,
          questionsAnswered: state.stats.questionsAnswered + 1,
          streak: 0,
          lastActivityDate: new Date().toISOString().split('T')[0],
        }
      })),

      // Record a skipped question (small XP penalty if any, no streak change)
      recordSkippedQuestion: () => set((state) => ({
        stats: {
          ...state.stats,
          questionsAnswered: state.stats.questionsAnswered + 1,
          skippedQuestions: state.stats.skippedQuestions + 1,
          lastActivityDate: new Date().toISOString().split('T')[0],
        }
      })),

      // Get computed user stats
      getUserStats: () => {
        const state = get()
        const xp = state.stats.xp
        const level = calculateLevel(xp)
        const xpToNextLevel = getXpToNextLevel(xp)
        const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
        const nextLevelXp = LEVEL_THRESHOLDS[level] || xp
        const xpInCurrentLevel = xp - currentLevelXp
        const xpNeededForLevel = nextLevelXp - currentLevelXp
        const progressPercent = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 100

        return {
          ...state.stats,
          totalXp: xp,
          level,
          xpToNextLevel,
          progressPercent,
          accuracy: state.stats.questionsAnswered > 0
            ? Math.round((state.stats.correctAnswers / state.stats.questionsAnswered) * 100)
            : 0,
        }
      },

      incrementStreak: () => set((state) => ({
        stats: { ...state.stats, streak: state.stats.streak + 1 }
      })),
      resetStreak: () => set((state) => ({
        stats: { ...state.stats, streak: 0 }
      })),

      // Question Cache - persists questions between view switches
      questionCache: {
        questions: [],
        currentIndex: 0,
        pendingQuestions: [],
        difficultyLevel: 5,
        consecutiveWrong: 0,
        consecutiveCorrect: 0,
        isGenerating: false,
        lastTopicsHash: null,
      },

      setQuestionCache: (update) => set((state) => ({
        questionCache: { ...state.questionCache, ...update }
      })),

      // Add questions to cache
      addQuestionsToCache: (questions) => set((state) => ({
        questionCache: {
          ...state.questionCache,
          questions: [...state.questionCache.questions, ...questions],
        }
      })),

      // Get current question from cache
      getCurrentQuestion: () => {
        const state = get()
        return state.questionCache.questions[state.questionCache.currentIndex] || null
      },

      // Move to next question in cache
      nextQuestion: () => set((state) => ({
        questionCache: {
          ...state.questionCache,
          currentIndex: state.questionCache.currentIndex + 1,
        }
      })),

      // Get remaining questions count
      getRemainingQuestions: () => {
        const state = get()
        return state.questionCache.questions.length - state.questionCache.currentIndex + state.questionCache.pendingQuestions.length
      },

      // Clear question cache (when topics change)
      clearQuestionCache: () => set({
        questionCache: {
          questions: [],
          currentIndex: 0,
          pendingQuestions: [],
          difficultyLevel: 5,
          consecutiveWrong: 0,
          consecutiveCorrect: 0,
          isGenerating: false,
          lastTopicsHash: null,
        }
      }),

      // Wrong Questions for Canvas
      wrongQuestions: [],
      addWrongQuestion: (question) => set((state) => ({
        wrongQuestions: [
          question,
          ...state.wrongQuestions.filter(q => q.id !== question.id)
        ].slice(0, 20) // Keep last 20
      })),
      removeWrongQuestion: (questionId) => set((state) => ({
        wrongQuestions: state.wrongQuestions.filter(q => q.id !== questionId)
      })),
      clearWrongQuestions: () => set({ wrongQuestions: [] }),

      // Saved Content - "Meine Inhalte"
      savedContent: {
        miniApps: [],      // Generated HTML/JS apps from KI-Labor
        geogebraProjects: [], // Saved GeoGebra visualizations
      },

      // Save a mini app
      saveMiniApp: (app) => set((state) => ({
        savedContent: {
          ...state.savedContent,
          miniApps: [
            {
              id: `app_${Date.now()}`,
              ...app,
              savedAt: new Date().toISOString()
            },
            ...state.savedContent.miniApps
          ].slice(0, 50) // Keep last 50
        }
      })),

      // Delete a mini app
      deleteMiniApp: (appId) => set((state) => ({
        savedContent: {
          ...state.savedContent,
          miniApps: state.savedContent.miniApps.filter(a => a.id !== appId)
        }
      })),

      // Save a GeoGebra project
      saveGeoGebraProject: (project) => set((state) => ({
        savedContent: {
          ...state.savedContent,
          geogebraProjects: [
            {
              id: `geo_${Date.now()}`,
              ...project,
              savedAt: new Date().toISOString()
            },
            ...state.savedContent.geogebraProjects
          ].slice(0, 50)
        }
      })),

      // Delete a GeoGebra project
      deleteGeoGebraProject: (projectId) => set((state) => ({
        savedContent: {
          ...state.savedContent,
          geogebraProjects: state.savedContent.geogebraProjects.filter(p => p.id !== projectId)
        }
      })),

      // Get all saved content count
      getSavedContentCount: () => {
        const state = get()
        return state.savedContent.miniApps.length + state.savedContent.geogebraProjects.length
      },

      // Learning Session State
      currentDifficulty: 5,
      setCurrentDifficulty: (level) => set({ currentDifficulty: Math.max(1, Math.min(10, level)) }),

      sessionProgress: {
        totalAnswered: 0,
        correct: 0,
        consecutiveWrong: 0,
        consecutiveCorrect: 0,
      },
      updateSessionProgress: (update) => set((state) => ({
        sessionProgress: { ...state.sessionProgress, ...update }
      })),
      resetSessionProgress: () => set({
        sessionProgress: {
          totalAnswered: 0,
          correct: 0,
          consecutiveWrong: 0,
          consecutiveCorrect: 0,
        }
      }),

      // Background generation state
      isBackgroundGenerating: false,
      setBackgroundGenerating: (value) => set({ isBackgroundGenerating: value }),
    }),
    {
      name: 'lernapp-storage',
      partialize: (state) => ({
        aiProvider: state.aiProvider,
        apiKeys: state.apiKeys,
        modelMode: state.modelMode,
        smartModels: state.smartModels,
        fastModels: state.fastModels,
        selectedModels: state.selectedModels,
        contextData: state.contextData,
        stats: state.stats,
        wrongQuestions: state.wrongQuestions,
        savedContent: state.savedContent,
        currentDifficulty: state.currentDifficulty,
        questionCache: state.questionCache,
      }),
    }
  )
)
