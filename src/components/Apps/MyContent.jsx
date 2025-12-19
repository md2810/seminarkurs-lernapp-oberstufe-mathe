/**
 * MyContent Component - "Meine Inhalte"
 * Displays all saved content from KI-Labor and GeoGebra
 */

import React, { useState, memo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/useAppStore'
import {
  FolderOpen,
  Flask,
  Function as FunctionIcon,
  Trash,
  Eye,
  Code,
  Clock,
  MagnifyingGlass,
  X,
  Warning,
  DownloadSimple,
  ArrowsOutSimple
} from '@phosphor-icons/react'

// Tab configuration
const CONTENT_TABS = [
  { id: 'all', label: 'Alle', icon: FolderOpen },
  { id: 'miniApps', label: 'Simulationen', icon: Flask },
  { id: 'geogebra', label: 'GeoGebra', icon: FunctionIcon }
]

// Content Card Component
const ContentCard = memo(function ContentCard({ item, type, onView, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    onDelete(item.id)
    setShowDeleteConfirm(false)
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      className="content-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
    >
      <div className="card-header">
        <div className={`card-type-badge ${type}`}>
          {type === 'miniApp' ? <Flask weight="bold" /> : <FunctionIcon weight="bold" />}
          <span>{type === 'miniApp' ? 'Simulation' : 'GeoGebra'}</span>
        </div>
        <div className="card-date">
          <Clock weight="regular" size={12} />
          <span>{formatDate(item.savedAt)}</span>
        </div>
      </div>

      <h3 className="card-title">{item.title || 'Unbenannt'}</h3>
      {item.description && (
        <p className="card-description">{item.description}</p>
      )}
      {item.prompt && (
        <p className="card-prompt">"{item.prompt.substring(0, 100)}..."</p>
      )}

      <div className="card-actions">
        <motion.button
          className="card-btn view"
          onClick={() => onView(item, type)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Eye weight="bold" />
          Anzeigen
        </motion.button>

        <AnimatePresence mode="wait">
          {showDeleteConfirm ? (
            <motion.div
              className="delete-confirm"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <button className="confirm-btn yes" onClick={handleDelete}>
                <Trash weight="bold" />
              </button>
              <button className="confirm-btn no" onClick={() => setShowDeleteConfirm(false)}>
                <X weight="bold" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              className="card-btn delete"
              onClick={() => setShowDeleteConfirm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Trash weight="bold" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

// Preview Modal Component
const PreviewModal = memo(function PreviewModal({ item, type, onClose }) {
  const iframeRef = useRef(null)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    if (type === 'miniApp' && item?.html && iframeRef.current && !showCode) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow.document
      doc.open()
      doc.write(item.html)
      doc.close()
    }
  }, [item, type, showCode])

  const handleDownload = () => {
    if (type === 'miniApp' && item?.html) {
      const blob = new Blob([item.html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'simulation'}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <motion.div
      className="preview-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="preview-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            {type === 'miniApp' ? <Flask weight="duotone" /> : <FunctionIcon weight="duotone" />}
            <h2>{item?.title || 'Vorschau'}</h2>
          </div>
          <div className="modal-actions">
            {type === 'miniApp' && (
              <>
                <button
                  className={`modal-btn ${showCode ? 'active' : ''}`}
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <Eye weight="bold" /> : <Code weight="bold" />}
                  {showCode ? 'Vorschau' : 'Code'}
                </button>
                <button className="modal-btn" onClick={handleDownload}>
                  <DownloadSimple weight="bold" />
                  Download
                </button>
              </>
            )}
            <button className="modal-close" onClick={onClose}>
              <X weight="bold" />
            </button>
          </div>
        </div>

        <div className="modal-content">
          {type === 'miniApp' ? (
            showCode ? (
              <pre className="code-preview">
                <code>{item?.html}</code>
              </pre>
            ) : (
              <iframe
                ref={iframeRef}
                className="preview-iframe"
                sandbox="allow-scripts allow-same-origin"
                title="Vorschau"
              />
            )
          ) : (
            <div className="geogebra-preview">
              <div className="geogebra-info">
                <h3>GeoGebra Projekt</h3>
                {item?.commands && (
                  <div className="commands-list">
                    <h4>Befehle:</h4>
                    <ul>
                      {item.commands.map((cmd, i) => (
                        <li key={i}><code>{typeof cmd === 'string' ? cmd : cmd.command}</code></li>
                      ))}
                    </ul>
                  </div>
                )}
                {item?.explanation && (
                  <div className="explanation">
                    <h4>Erklärung:</h4>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
})

// Main MyContent Component
function MyContent() {
  const { savedContent, deleteMiniApp, deleteGeoGebraProject } = useAppStore()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewItem, setPreviewItem] = useState(null)
  const [previewType, setPreviewType] = useState(null)

  // Combine and filter content
  const allContent = [
    ...savedContent.miniApps.map(item => ({ ...item, type: 'miniApp' })),
    ...savedContent.geogebraProjects.map(item => ({ ...item, type: 'geogebra' }))
  ].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))

  const filteredContent = allContent.filter(item => {
    // Filter by tab
    if (activeTab === 'miniApps' && item.type !== 'miniApp') return false
    if (activeTab === 'geogebra' && item.type !== 'geogebra') return false

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.prompt?.toLowerCase().includes(query)
      )
    }

    return true
  })

  const handleView = (item, type) => {
    setPreviewItem(item)
    setPreviewType(type)
  }

  const handleDelete = (id, type) => {
    if (type === 'miniApp') {
      deleteMiniApp(id)
    } else {
      deleteGeoGebraProject(id)
    }
  }

  const handleClosePreview = () => {
    setPreviewItem(null)
    setPreviewType(null)
  }

  return (
    <div className="my-content">
      {/* Header */}
      <div className="content-header">
        <div className="header-info">
          <div className="header-icon">
            <FolderOpen weight="duotone" />
          </div>
          <div>
            <h2>Meine Inhalte</h2>
            <p>{allContent.length} gespeicherte Elemente</p>
          </div>
        </div>

        {/* Search */}
        <div className="content-search">
          <MagnifyingGlass weight="bold" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="content-tabs">
        {CONTENT_TABS.map((tab) => {
          const Icon = tab.icon
          const count = tab.id === 'all'
            ? allContent.length
            : tab.id === 'miniApps'
              ? savedContent.miniApps.length
              : savedContent.geogebraProjects.length

          return (
            <motion.button
              key={tab.id}
              className={`content-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon weight={activeTab === tab.id ? 'fill' : 'bold'} />
              <span>{tab.label}</span>
              <span className="tab-count">{count}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        <AnimatePresence mode="popLayout">
          {filteredContent.length > 0 ? (
            filteredContent.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                type={item.type}
                onView={() => handleView(item, item.type)}
                onDelete={(id) => handleDelete(id, item.type)}
              />
            ))
          ) : (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FolderOpen weight="duotone" size={48} />
              <h3>Keine Inhalte gefunden</h3>
              <p>
                {searchQuery
                  ? 'Versuche einen anderen Suchbegriff.'
                  : 'Erstelle Simulationen im KI-Labor oder visualisiere Aufgaben in GeoGebra.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal
            item={previewItem}
            type={previewType}
            onClose={handleClosePreview}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default memo(MyContent)
