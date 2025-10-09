import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import themesData from '../../data/bw_oberstufe_themen.json'
import './LearningPlan.css'
import {
  Books,
  X,
  NotePencil,
  CalendarBlank,
  Trash,
  Camera,
  CaretRight,
  CaretDown
} from '@phosphor-icons/react'

function LearningPlan({ isOpen, onClose, userSettings }) {
  const [learningPlan, setLearningPlan] = useState([])
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [selectedThemes, setSelectedThemes] = useState([])
  const [examDate, setExamDate] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [openLeitidee, setOpenLeitidee] = useState(null)

  // Get themes based on user settings
  const getAvailableThemes = () => {
    // Map new grade levels to the data structure
    let gradeLevel = userSettings.gradeLevel || 'Klasse_11'
    // Both Klasse_11 and Klasse_12 use the same curriculum data
    const dataKey = 'Klassen_11_12'
    const courseType = userSettings.courseType || 'Leistungsfach'

    const themes = themesData[dataKey]?.[courseType]
    if (!themes) return {}

    return themes
  }

  const availableThemes = getAvailableThemes()

  const toggleTheme = (leitidee, thema, unterthema) => {
    const themeId = `${leitidee}|${thema}|${unterthema}`

    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(selectedThemes.filter(id => id !== themeId))
    } else {
      setSelectedThemes([...selectedThemes, themeId])
    }
  }

  const toggleLeitidee = (leitidee) => {
    if (openLeitidee === leitidee) {
      setOpenLeitidee(null)
    } else {
      setOpenLeitidee(leitidee)
    }
  }

  const getSelectedCountForThema = (leitidee, thema, unterthemen) => {
    return unterthemen.filter(unterthema => {
      const themeId = `${leitidee}|${thema}|${unterthema}`
      return selectedThemes.includes(themeId)
    }).length
  }

  const addToPlan = () => {
    if (selectedThemes.length === 0) return

    const newPlanItem = {
      id: Date.now(),
      themes: selectedThemes.map(themeId => {
        const [leitidee, thema, unterthema] = themeId.split('|')
        return { leitidee, thema, unterthema }
      }),
      examDate: examDate || null,
      examTitle: examTitle || 'Lernziel',
      addedAt: new Date().toISOString(),
      completed: false
    }

    setLearningPlan([...learningPlan, newPlanItem])
    setSelectedThemes([])
    setExamDate('')
    setExamTitle('')
    setShowThemeSelector(false)

    // Save to localStorage
    localStorage.setItem('learningPlan', JSON.stringify([...learningPlan, newPlanItem]))
  }

  const removePlanItem = (itemId) => {
    const updatedPlan = learningPlan.filter(item => item.id !== itemId)
    setLearningPlan(updatedPlan)
    localStorage.setItem('learningPlan', JSON.stringify(updatedPlan))
  }

  const togglePlanItemCompletion = (itemId) => {
    const updatedPlan = learningPlan.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setLearningPlan(updatedPlan)
    localStorage.setItem('learningPlan', JSON.stringify(updatedPlan))
  }

  // Load learning plan from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('learningPlan')
    if (saved) {
      setLearningPlan(JSON.parse(saved))
    }
  }, [])

  // Calculate days until exam
  const getDaysUntilExam = (examDate) => {
    if (!examDate) return null
    const today = new Date()
    const exam = new Date(examDate)
    const diffTime = exam - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="learning-plan-modal"
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(15px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(15px)" }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
              mass: 0.9
            }}
          >
            <motion.div
              className="modal-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.05
              }}
            >
              <h2><Books weight="bold" /> Mein Lernplan</h2>
              <motion.button
                className="close-btn"
                onClick={onClose}
                whileHover={{
                  scale: 1.1,
                  rotate: 90,
                  transition: { type: "spring", stiffness: 400, damping: 20 }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <X weight="bold" />
              </motion.button>
            </motion.div>

            <div className="modal-content">
              {/* Current Learning Plan */}
              <div className="plan-list">
                {learningPlan.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon"><NotePencil weight="bold" /></span>
                    <p>Dein Lernplan ist noch leer</p>
                    <p className="empty-hint">Füge Themen hinzu, um strukturiert zu lernen!</p>
                  </div>
                ) : (
                  learningPlan.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className={`plan-item ${item.completed ? 'completed' : ''}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(5px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.95, x: -100 }}
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 26,
                        delay: index * 0.05
                      }}
                      whileHover={{
                        scale: 1.02,
                        y: -4,
                        transition: { type: "spring", stiffness: 400, damping: 20 }
                      }}
                    >
                      <div className="plan-item-header">
                        <div className="plan-item-title">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => togglePlanItemCompletion(item.id)}
                            className="plan-checkbox"
                          />
                          <h3>{item.examTitle}</h3>
                        </div>
                        {item.examDate && (
                          <div className={`exam-date ${getDaysUntilExam(item.examDate) <= 7 ? 'urgent' : ''}`}>
                            <CalendarBlank weight="bold" /> {new Date(item.examDate).toLocaleDateString('de-DE')}
                            {getDaysUntilExam(item.examDate) >= 0 && (
                              <span className="days-until">
                                {getDaysUntilExam(item.examDate) === 0 ? ' Heute!' : ` in ${getDaysUntilExam(item.examDate)} Tagen`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="plan-themes">
                        {item.themes.map((theme, idx) => (
                          <div key={idx} className="theme-tag">
                            <span className="theme-name">{theme.thema}</span>
                            <span className="theme-detail">{theme.unterthema}</span>
                          </div>
                        ))}
                      </div>
                      <motion.button
                        className="remove-btn"
                        onClick={() => removePlanItem(item.id)}
                        whileHover={{
                          scale: 1.05,
                          x: 4,
                          transition: { type: "spring", stiffness: 400, damping: 20 }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash weight="bold" /> Entfernen
                      </motion.button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Add New Button */}
              {!showThemeSelector && (
                <motion.div
                  className="add-plan-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    delay: 0.2
                  }}
                >
                  <motion.button
                    className="btn btn-primary"
                    onClick={() => setShowThemeSelector(true)}
                    whileHover={{
                      scale: 1.05,
                      y: -3,
                      boxShadow: "0 10px 40px rgba(249, 115, 22, 0.4)",
                      transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    + Neues Lernziel hinzufügen
                  </motion.button>
                </motion.div>
              )}

              {/* Theme Selector */}
              <AnimatePresence>
                {showThemeSelector && (
                  <motion.div
                    className="theme-selector"
                    initial={{ opacity: 0, height: 0, scale: 0.95, filter: "blur(5px)" }}
                    animate={{ opacity: 1, height: 'auto', scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, height: 0, scale: 0.95, filter: "blur(5px)" }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 28
                    }}
                  >
                    <h3>Themen auswählen</h3>

                    {/* Exam Info */}
                    <div className="exam-info-inputs">
                      <input
                        type="text"
                        placeholder="Titel (z.B. Analysis Klausur)"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="exam-title-input"
                      />
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="exam-date-input"
                      />
                    </div>

                    {/* Image Upload Option (Future Feature) */}
                    <div className="upload-option">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowImageUpload(!showImageUpload)}
                        title="Kommt bald: Lade ein Foto deiner Themenliste hoch"
                        disabled
                      >
                        <Camera weight="bold" /> Themenliste hochladen (Bald verfügbar)
                      </button>
                    </div>

                    {/* Manual Theme Selection */}
                    <div className="themes-tree">
                      {Object.entries(availableThemes).map(([leitidee, themen]) => (
                        <div key={leitidee} className="leitidee-group">
                          <h4
                            className="leitidee-title"
                            onClick={() => toggleLeitidee(leitidee)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="collapse-icon">
                              {openLeitidee === leitidee ? <CaretDown weight="bold" /> : <CaretRight weight="bold" />}
                            </span>
                            {leitidee}
                          </h4>
                          <AnimatePresence>
                            {openLeitidee === leitidee && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                                animate={{ height: 'auto', opacity: 1, filter: "blur(0px)" }}
                                exit={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                                transition={{
                                  type: "spring",
                                  stiffness: 280,
                                  damping: 28
                                }}
                                style={{ overflow: 'hidden' }}
                              >
                                {Object.entries(themen).map(([thema, unterthemen]) => {
                                  const selectedCount = getSelectedCountForThema(leitidee, thema, unterthemen)
                                  return (
                                    <div key={thema} className="thema-group">
                                      <h5 className="thema-title">
                                        {thema}
                                        <span className="selection-count">
                                          {selectedCount}/{unterthemen.length}
                                        </span>
                                      </h5>
                                      <div className="unterthemen-list">
                                        {unterthemen.map((unterthema, idx) => {
                                          const themeId = `${leitidee}|${thema}|${unterthema}`
                                          const isSelected = selectedThemes.includes(themeId)
                                          return (
                                            <label key={idx} className={`unterthema-item ${isSelected ? 'selected' : ''}`}>
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleTheme(leitidee, thema, unterthema)}
                                              />
                                              <span>{unterthema}</span>
                                            </label>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Actions with smooth animations */}
                    <motion.div
                      className="selector-actions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                        delay: 0.2
                      }}
                    >
                      <motion.button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowThemeSelector(false)
                          setSelectedThemes([])
                          setExamDate('')
                          setExamTitle('')
                        }}
                        whileHover={{
                          scale: 1.04,
                          y: -2,
                          transition: { type: "spring", stiffness: 400, damping: 18 }
                        }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Abbrechen
                      </motion.button>
                      <motion.button
                        className="btn btn-primary"
                        onClick={addToPlan}
                        disabled={selectedThemes.length === 0}
                        whileHover={{
                          scale: selectedThemes.length > 0 ? 1.05 : 1,
                          y: selectedThemes.length > 0 ? -3 : 0,
                          boxShadow: selectedThemes.length > 0 ? "0 10px 40px rgba(249, 115, 22, 0.4)" : "none",
                          transition: { type: "spring", stiffness: 400, damping: 18 }
                        }}
                        whileTap={{ scale: selectedThemes.length > 0 ? 0.95 : 1 }}
                      >
                        Zum Lernplan hinzufügen ({selectedThemes.length})
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LearningPlan
