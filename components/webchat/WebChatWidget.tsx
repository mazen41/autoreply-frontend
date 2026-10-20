'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../lib/LangContext'
import { MessageSquare, X, Send, Minimize2, Maximize2 } from 'lucide-react'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`

export default function WebChatWidget({ businessId }: { businessId: number }) {
  const { isRTL } = useLang()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: 'user' | 'bot' }>>([])
  const [inputText, setInputText] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [sessionError, setSessionError] = useState('')

  const createSession = useCallback(async () => {
    try {
      const visitorSessionId = window.localStorage.getItem(`naz_web_chat_${businessId}`)
      const pageUrl = window.location.href
      const referrerUrl = document.referrer || pageUrl
      const query = new URLSearchParams(window.location.search)
      const siteUrl = query.get('embed') === '1' ? referrerUrl : pageUrl
      const response = await fetch(`${API}/web-chat/sessions?business_id=${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: businessId,
          ...(visitorSessionId ? { session_id: visitorSessionId } : {}),
          page_url: pageUrl,
          referrer_url: referrerUrl,
          site_url: siteUrl,
          visitor_name: visitorName.trim() || null,
          visitor_email: visitorEmail.trim() || null,
          utm_source: query.get('utm_source'),
          utm_medium: query.get('utm_medium'),
          utm_campaign: query.get('utm_campaign'),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.session_id) throw new Error(data.message || 'Could not start this chat.')
      window.localStorage.setItem(`naz_web_chat_${businessId}`, data.session_id)
      setSessionId(data.session_id)
      setSessionError('')
      
      // Add welcome message
      setMessages([
        { id: 1, text: isRTL ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?', sender: 'bot' }
      ])
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Could not start this chat.')
      console.error('Failed to create session:', error)
    }
  }, [businessId, isRTL, visitorName, visitorEmail])

  useEffect(() => {
    if (isOpen && hasStarted && !sessionId) queueMicrotask(() => { void createSession() })
  }, [isOpen, hasStarted, sessionId, createSession])

  useEffect(() => {
    if (!sessionId) return
    const poll = async () => {
      try {
        const response = await fetch(`${API}/web-chat/sessions/${encodeURIComponent(sessionId)}/messages?business_id=${businessId}`)
        if (!response.ok) return
        const data = await response.json()
        const nextMessages = (data.messages || []).map((message: { id: number; content: string; direction: string }) => ({
          id: message.id,
          text: message.content,
          sender: message.direction === 'inbound' ? 'user' as const : 'bot' as const,
        }))
        setMessages((current) => {
          const welcome = current.find((message) => message.id === 1 && message.sender === 'bot')
          return [ ...(welcome ? [welcome] : []), ...nextMessages ]
        })
      } catch { /* Keep the conversation visible if a poll is temporarily unavailable. */ }
    }
    void poll()
    const timer = window.setInterval(() => { void poll() }, 3000)
    return () => window.clearInterval(timer)
  }, [businessId, sessionId])

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId) return

    const userMessage = { id: Date.now(), text: inputText, sender: 'user' as const }
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    try {
      const response = await fetch(`${API}/web-chat/messages?business_id=${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: inputText,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.message || 'Message could not be sent.')
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
            {!hasStarted ? <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setHasStarted(true) }}>
              <p className="text-sm">{isRTL ? 'مرحباً! ابدأ المحادثة. يمكنك إضافة اسمك وبريدك الإلكتروني اختيارياً.' : 'Hello! Start a chat. You can optionally share your name and email.'}</p>
              <input aria-label={isRTL ? 'الاسم' : 'Your name (optional)'} maxLength={191} value={visitorName} onChange={(event) => setVisitorName(event.target.value)} placeholder={isRTL ? 'الاسم (اختياري)' : 'Your name (optional)'} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input aria-label={isRTL ? 'البريد الإلكتروني' : 'Your email (optional)'} type="email" maxLength={191} value={visitorEmail} onChange={(event) => setVisitorEmail(event.target.value)} placeholder={isRTL ? 'البريد الإلكتروني (اختياري)' : 'Your email (optional)'} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>{isRTL ? 'ابدأ المحادثة' : 'Start chat'}</button>
            </form> : messages.map((msg) => (
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
            {sessionError && <p role="alert" className="text-sm text-red-600">{sessionError} <button className="underline" onClick={() => void createSession()}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</button></p>}
          </div>

          {/* Input */}
          {hasStarted && <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
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
          </div>}
        </>
      )}
    </div>
  )
}
