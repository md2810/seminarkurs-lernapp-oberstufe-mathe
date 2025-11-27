import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // View State
      activeView: 'feed', // 'feed' | 'canvas' | 'progress'
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
      aiProvider: 'claude', // 'claude' | 'gemini' | 'openai'
      setAiProvider: (provider) => set({ aiProvider: provider }),

      apiKeys: {
        claude: '',
        gemini: '',
        openai: '',
      },
      setApiKey: (provider, key) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key }
      })),

      // Selected models per provider
      selectedModels: {
        claude: 'claude-sonnet-4-5-20250929',
        gemini: 'gemini-1.5-flash',
        openai: 'gpt-4o',
      },
      setSelectedModel: (provider, model) => set((state) => ({
        selectedModels: { ...state.selectedModels, [provider]: model }
      })),

      // Get current model for active provider
      getCurrentModel: () => {
        const state = get()
        return state.selectedModels[state.aiProvider] || null
      },

      // User Stats
      stats: {
        xp: 0,
        streak: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
      },
      addXp: (amount) => set((state) => ({
        stats: { ...state.stats, xp: state.stats.xp + amount }
      })),
      incrementStreak: () => set((state) => ({
        stats: { ...state.stats, streak: state.stats.streak + 1 }
      })),
      resetStreak: () => set((state) => ({
        stats: { ...state.stats, streak: 0 }
      })),

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
    }),
    {
      name: 'lernapp-storage',
      partialize: (state) => ({
        aiProvider: state.aiProvider,
        apiKeys: state.apiKeys,
        selectedModels: state.selectedModels,
        contextData: state.contextData,
        stats: state.stats,
        wrongQuestions: state.wrongQuestions,
        currentDifficulty: state.currentDifficulty,
      }),
    }
  )
)
