import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Zap, Flame, Brain, Sparkles, Bot, LogOut, User, ImagePlus, BookOpen, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import clsx from 'clsx'
import './Shell.css'

// AI Provider Options
const AI_PROVIDERS = [
  { id: 'claude', name: 'Anthropic Claude', icon: Brain, gradient: 'from-orange-500 to-amber-500' },
  { id: 'gemini', name: 'Google Gemini', icon: Sparkles, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'openai', name: 'OpenAI GPT-4', icon: Bot, gradient: 'from-emerald-500 to-green-500' },
]

// Smooth spring config
const smoothSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
}

// Command Center Overlay Component
function CommandCenterOverlay({
  onClose,
  userStats = {},
  onLogout,
  onOpenSettings,
  onOpenAccount,
  onOpenContext
}) {
  const { aiProvider, setAiProvider } = useAppStore()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Dark Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Command Center Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.05
        }}
        className="relative z-50 w-full max-w-md mx-4"
      >
        {/* Glass Card */}
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Command Center</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </motion.button>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-4 bg-zinc-800/50 flex items-center gap-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">XP</p>
                <p className="text-lg font-bold text-white">{userStats.totalXp || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-pink-500/20">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Streak</p>
                <p className="text-lg font-bold text-white">{userStats.streak || 0} Tage</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Context Engine - Primary Action */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onOpenContext?.(); onClose(); }}
              className="w-full p-5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                  <ImagePlus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">Kontext</p>
                  <p className="text-sm text-zinc-400">Themenliste hochladen & verwalten</p>
                </div>
                <BookOpen className="w-5 h-5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>

            {/* AI Provider Section */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">
                AI Provider
              </label>
              <div className="space-y-2">
                {AI_PROVIDERS.map((provider, index) => {
                  const Icon = provider.icon
                  const isActive = aiProvider === provider.id

                  return (
                    <motion.button
                      key={provider.id}
                      onClick={() => setAiProvider(provider.id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={clsx(
                        'w-full p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4',
                        isActive
                          ? 'bg-zinc-800 border-zinc-600'
                          : 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/60'
                      )}
                    >
                      <div className={clsx(
                        'p-2.5 rounded-xl bg-gradient-to-br',
                        provider.gradient
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium flex-1 text-left">
                        {provider.name}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeProvider"
                          className="w-2.5 h-2.5 rounded-full bg-green-500"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onOpenAccount?.(); onClose(); }}
                className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors text-left"
              >
                <User className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-white">Account</p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onOpenSettings?.(); onClose(); }}
                className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-white">Einstellungen</p>
              </motion.button>
            </div>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onLogout?.(); onClose(); }}
              className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-3"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Abmelden</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// View Toggle Button
function ViewToggleButton({ view, label, activeView, onSetView }) {
  const isActive = activeView === view

  return (
    <motion.button
      onClick={() => onSetView(view)}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        'relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors',
        isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="viewToggle"
          className="absolute inset-0 bg-zinc-800 rounded-full"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </motion.button>
  )
}

// Main Shell Component
export function Shell({
  children,
  feed,
  canvas,
  progress,
  userStats = {},
  onLogout,
  onOpenSettings,
  onOpenAccount,
  onOpenLearningPlan
}) {
  const { activeView, setActiveView } = useAppStore()
  const { isCommandCenterOpen, openCommandCenter, closeCommandCenter } = useAppStore()

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#02040a]">
      {/* Main Content Layer - Transforms when Command Center opens */}
      <motion.div
        animate={{
          scale: isCommandCenterOpen ? 0.95 : 1,
          opacity: isCommandCenterOpen ? 0.4 : 1,
        }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          filter: isCommandCenterOpen ? 'blur(8px)' : 'blur(0px)',
        }}
        className="h-full w-full origin-center"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          {/* View Toggle Pills */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...smoothSpring }}
            className="flex items-center gap-1 p-1.5 bg-zinc-900/80 backdrop-blur-xl rounded-full border border-zinc-800"
          >
            <ViewToggleButton
              view="feed"
              label="Feed"
              activeView={activeView}
              onSetView={setActiveView}
            />
            <ViewToggleButton
              view="canvas"
              label="Canvas"
              activeView={activeView}
              onSetView={setActiveView}
            />
            <ViewToggleButton
              view="progress"
              label="Fortschritt"
              activeView={activeView}
              onSetView={setActiveView}
            />
          </motion.div>

          {/* Command Center Trigger */}
          <motion.button
            onClick={openCommandCenter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...smoothSpring }}
            className={clsx(
              'p-3 rounded-2xl',
              'bg-zinc-900/80 backdrop-blur-xl border border-zinc-800',
              'hover:bg-zinc-800 transition-colors',
              isCommandCenterOpen && 'pointer-events-none'
            )}
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </motion.button>
        </div>

        {/* Content Area */}
        <div className="h-full w-full pt-20 pb-4 px-4">
          <AnimatePresence mode="wait">
            {activeView === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full overflow-y-auto scrollbar-thin"
              >
                {feed}
              </motion.div>
            )}
            {activeView === 'canvas' && (
              <motion.div
                key="canvas"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full overflow-hidden"
              >
                {canvas}
              </motion.div>
            )}
            {activeView === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full overflow-y-auto scrollbar-thin"
              >
                {progress}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Command Center Overlay */}
      <AnimatePresence>
        {isCommandCenterOpen && (
          <CommandCenterOverlay
            onClose={closeCommandCenter}
            userStats={userStats}
            onLogout={onLogout}
            onOpenSettings={onOpenSettings}
            onOpenAccount={onOpenAccount}
            onOpenContext={onOpenLearningPlan}
          />
        )}
      </AnimatePresence>

      {/* Modals (children) - Always on top */}
      <div className="relative z-40">
        {children}
      </div>
    </div>
  )
}

export default Shell
