import { create } from 'zustand'

/**
 * UI State Store - Controls the Dynamic Focus Grid layout
 *
 * Focus Modes:
 * - 'discovery': Feed is in focus (center), Canvas is minimized (right)
 * - 'deepwork': Canvas is in focus (center), Feed is minimized (right)
 *
 * Mobile View:
 * - 'feed': Shows the vertical feed
 * - 'canvas': Shows the spatial canvas
 */
export const useUIStore = create((set, get) => ({
  // Current focus mode: 'discovery' | 'deepwork'
  focusMode: 'discovery',

  // Mobile view state: 'feed' | 'canvas'
  mobileView: 'feed',

  // Sidebar collapsed state
  sidebarCollapsed: false,

  // Transition state for animations
  isTransitioning: false,

  // Actions
  setFocusMode: (mode) => {
    set({ isTransitioning: true })
    setTimeout(() => {
      set({ focusMode: mode, isTransitioning: false })
    }, 50)
  },

  toggleFocusMode: () => {
    const { focusMode } = get()
    const newMode = focusMode === 'discovery' ? 'deepwork' : 'discovery'
    set({ isTransitioning: true })
    setTimeout(() => {
      set({ focusMode: newMode, isTransitioning: false })
    }, 50)
  },

  setMobileView: (view) => set({ mobileView: view }),

  toggleMobileView: () => {
    const { mobileView } = get()
    set({ mobileView: mobileView === 'feed' ? 'canvas' : 'feed' })
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toggleSidebar: () => {
    const { sidebarCollapsed } = get()
    set({ sidebarCollapsed: !sidebarCollapsed })
  }
}))
