import React, { useState, useRef, useEffect } from 'react'
import { FiMessageCircle, FiX, FiSend, FiMinimize2 } from 'react-icons/fi'
import { chatbotAPI } from '../services/api'
import './Chatbot.css'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your medical imaging assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          text: msg.text,
          sender: msg.sender
        }))

      // Call the backend API
      const response = await chatbotAPI.sendMessage(currentInput, conversationHistory)
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.response || 'I apologize, but I encountered an error processing your message.',
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chatbot error:', error)
      
      // Show error message to user
      const errorMessage = {
        id: Date.now() + 1,
        text: error.message.includes('Network error') 
          ? 'Unable to connect to the chatbot service. Please make sure the backend server is running.'
          : 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const toggleChat = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true)
    } else if (isOpen && isMinimized) {
      setIsMinimized(false)
      setIsOpen(true)
    } else {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label="Open chatbot"
      >
        {isOpen && !isMinimized ? (
          <FiMinimize2 />
        ) : (
          <FiMessageCircle />
        )}
        {!isOpen && (
          <span className="chatbot-badge">1</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <FiMessageCircle />
              </div>
              <div>
                <h3>Medical Assistant</h3>
                <p className="chatbot-status">Online</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="chatbot-minimize-btn"
                aria-label="Minimize chat"
              >
                <FiMinimize2 />
              </button>
              <button 
                onClick={closeChat}
                className="chatbot-close-btn"
                aria-label="Close chat"
              >
                <FiX />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`chatbot-message ${message.sender}`}
                  >
                    <div className="message-content">
                      <p>{message.text}</p>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chatbot-message bot typing">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chatbot-input-form" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="chatbot-input"
                />
                <button 
                  type="submit" 
                  className="chatbot-send-btn"
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                >
                  <FiSend />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default Chatbot

