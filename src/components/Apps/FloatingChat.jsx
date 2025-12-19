/**
 * FloatingChat Component
 * Draggable floating chat window for GeoGebra AI assistant
 */

import React, { useState, useRef, useCallback, memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/useAppStore'
import {
  X,
  PaperPlaneTilt,
  CircleNotch,
  ArrowsOutCardinal,
  Robot,
  Trash
} from '@phosphor-icons/react'
import './FloatingChat.css'

// Chat message component
const ChatMessage = memo(function ChatMessage({ message }) {
  return (
    <div className={`chat-message ${message.role}`}>
      {message.role === 'assistant' && (
        <div className="message-avatar">
          <Robot weight="fill" />
        </div>
      )}
      <div className="message-content">
        <p>{message.content}</p>
        {message.commands && message.commands.length > 0 && (
          <div className="message-commands">
            <span className="commands-label">GeoGebra-Befehle:</span>
            {message.commands.map((cmd, i) => (
              <code key={i}>{typeof cmd === 'string' ? cmd : cmd.command}</code>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

function FloatingChat({
  isOpen,
  onClose,
  onSendMessage,
  isLoading,
  messages = [],
  onClearChat,
  annotationImage = null
}) {
  const [input, setInput] = useState('')
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  const chatContainerRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle drag
  const handleDragStart = useCallback((e) => {
    if (e.target.closest('.chat-input-area') || e.target.closest('.chat-messages')) return
    setIsDragging(true)
  }, [])

  const handleDrag = useCallback((e, info) => {
    if (!isDragging) return
    setPosition(prev => ({
      x: prev.x + info.delta.x,
      y: prev.y + info.delta.y
    }))
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle send message
  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim(), annotationImage)
    setInput('')
  }, [input, isLoading, onSendMessage, annotationImage])

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (!isOpen) return null

  return (
    <motion.div
      ref={dragRef}
      className="floating-chat"
      style={{
        x: position.x,
        y: position.y
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* Header - Draggable area */}
      <div className="chat-header">
        <div className="chat-title">
          <Robot weight="duotone" />
          <span>KI-Assistent</span>
        </div>
        <div className="chat-header-actions">
          <button
            className="header-btn"
            onClick={onClearChat}
            title="Chat leeren"
          >
            <Trash weight="bold" />
          </button>
          <button
            className="header-btn close"
            onClick={onClose}
            title="Schließen"
          >
            <X weight="bold" />
          </button>
        </div>
        <div className="drag-hint">
          <ArrowsOutCardinal weight="bold" size={12} />
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Robot weight="duotone" size={32} />
            <p>Stelle eine Frage zu deiner GeoGebra-Visualisierung oder markiere einen Bereich.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))
        )}
        {isLoading && (
          <div className="chat-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <CircleNotch weight="bold" />
            </motion.div>
            <span>Denke nach...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Annotation preview */}
      {annotationImage && (
        <div className="annotation-preview">
          <img src={annotationImage} alt="Markierung" />
          <span>Markierung wird mit der Frage gesendet</span>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Frage stellen..."
          rows={1}
          disabled={isLoading}
        />
        <motion.button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PaperPlaneTilt weight="fill" />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default memo(FloatingChat)
