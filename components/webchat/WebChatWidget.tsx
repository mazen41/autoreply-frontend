'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import { MessageSquare, X, Send, Minimize2, Maximize2 } from 'lucide-react'

export default function WebChatWidget() {
  const { t, isRTL } = useLang()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: 'user' | 'bot' }>>([])
  const [inputText, setInputText] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    // Create session when widget opens
    if (isOpen && !sessionId) {
      createSession()
    }
  }, [isOpen])

  const createSession = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/web-chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      })
      const data = await response.json()
      setSessionId(data.session_id)
      
      // Add welcome message
      setMessages([
        { id: 1, text: isRTL ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?', sender: 'bot' }
      ])
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId) return

    const userMessage = { id: Date.now(), text: inputText, sender: 'user' as const }
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/web-chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: inputText,
        }),
      })
      
      const data = await response.json()
      
      if (data.reply) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'bot' }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: isRTL ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred. Please try again.', 
        sender: 'bot' 
      }])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          background: 'var(--accent)',
          color: 'var(--on-accent-text)',
          zIndex: 1000,
        }}
        title={isRTL ? 'دردشة' : 'Chat'}
      >
        <MessageSquare size={24} />
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 shadow-2xl rounded-2xl overflow-hidden"
      style={{
        width: isMinimized ? 'auto' : '380px',
        height: isMinimized ? 'auto' : '500px',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <span className="font-semibold">{isRTL ? 'دردشة' : 'Chat'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: '380px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'ml-auto'
                    : 'mr-auto'
                }`}
                style={{
                  background: msg.sender === 'user' ? 'var(--accent)' : 'var(--surface)',
                  color: msg.sender === 'user' ? 'var(--on-accent-text)' : 'var(--text-primary)',
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                className="flex-1 px-4 py-2 rounded-xl"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="p-2 rounded-xl transition-colors"
                style={{
                  background: inputText.trim() ? 'var(--accent)' : 'var(--border)',
                  color: inputText.trim() ? 'var(--on-accent-text)' : 'var(--text-secondary)',
                }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}