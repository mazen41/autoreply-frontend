'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Sparkles, Send, RotateCcw, Bot, User, CheckCheck, Loader2, AlertTriangle, Info } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { BotAvatarOption } from './types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  time: string
  isError?: boolean
}

interface Step06SimulatorProps {
  avatar: BotAvatarOption
  botName: string
  instructions: string
  replyStyle: string
  confidenceThreshold: number
  escalationKeywords: string[]
  assignments?: Array<{ file_id: number; channel_id: number | null }>
  onBotTypingState?: (isTyping: boolean) => void
}

export default function Step06Simulator({
  avatar,
  botName,
  instructions,
  replyStyle,
  confidenceThreshold,
  escalationKeywords,
  assignments = [],
  onBotTypingState,
}: Step06SimulatorProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  const displayName = botName.trim() || (isRTL ? avatar.nameAr : avatar.nameEn)

  const initialGreeting: ChatMessage = {
    id: 'welcome',
    sender: 'bot',
    text: isRTL
      ? `مرحباً بك! أنا ${displayName}، المساعد الذكي الخاص بك. كيف يمكنني خدمتك ومساعدتك اليوم؟`
      : `Hello! I'm ${displayName}, your AI assistant. How can I help you today?`,
    time: '12:00 PM',
  }

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isTyping])

  const suggestedQuestions = [
    copy.q1 || (isRTL ? 'ما هي مواعيد العمل والتوصيل؟' : 'What are your working & delivery hours?'),
    copy.q2 || (isRTL ? 'هل يمكنني الاستفسار عن سياسة الاستبدال؟' : 'Can I ask about your return & exchange policy?'),
    copy.q3 || (isRTL ? 'أريد التحدث مع موظف دعم بشري' : 'I want to speak with a human support agent'),
    copy.q4 || (isRTL ? 'ما هي أحدث العروض والمنتجات المتوفرة؟' : 'What are your featured products and offers?'),
  ]

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim()
    if (!text || isTyping) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: timeStr,
    }

    setMessages((cur) => [...cur, userMsg])
    setInputValue('')
    setIsTyping(true)
    if (onBotTypingState) onBotTypingState(true)

    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = getToken()
      const res = await fetch(`${API}/api/knowledge/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify({ test_question: text }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || errBody.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const botReply = data.test_response || (isRTL ? 'لم يتم إرجاع استجابة من الوكيل.' : 'No response returned from the AI.')

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((cur) => [...cur, botMsg])
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: isRTL
          ? `⚠️ تعذر الحصول على رد من الوكيل الذكي. ${err?.message || 'خطأ غير معروف'}`
          : `⚠️ Could not get a response from the AI agent. ${err?.message || 'Unknown error'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      }
      setMessages((cur) => [...cur, errorMsg])
    } finally {
      setIsTyping(false)
      if (onBotTypingState) onBotTypingState(false)
    }
  }

  const resetChat = () => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([initialGreeting])
    setInputValue('')
    setIsTyping(false)
  }

  const hasKnowledge = assignments.length > 0

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 06 · تجربة الوكيل' : 'Step 06 · Test Your Bot'}</span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {copy.step6Title || (isRTL ? 'شاهد مساعدك أثناء العمل' : "Let's see your assistant in action")}
          </h1>
          <button
            type="button"
            onClick={resetChat}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <RotateCcw size={13} />
            <span>{copy.resetConversation || (isRTL ? 'إعادة تعيين المحادثة' : 'Reset Conversation')}</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step6Subtitle ||
            (isRTL
              ? 'بيئة محاكاة حية تستخدم الذكاء الاصطناعي فعلياً لاختبار ردود الوكيل بناءً على قاعدة المعرفة والتعليمات المحددة.'
              : 'Live simulator using your actual AI to test responses based on your knowledge base and configured instructions.')}
        </p>
      </div>

      {/* ── Important Notice Banner ──────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 mt-0.5">
          <Info size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-300 mb-1">
            {isRTL ? 'ملاحظة حول بيئة الاختبار' : 'Test Environment Notice'}
          </p>
          <p className="text-[11px] text-amber-200/70 leading-relaxed">
            {isRTL
              ? 'هذه البيئة تختبر قاعدة المعرفة وشخصية الوكيل الذكي فقط. ميزات التجارة الإلكترونية (تتبع الطلبات، استعلامات المنتجات، كتالوج المتجر) يمكن اختبارها فقط من رسالة عميل حقيقية عبر قناة متصلة، لأنها تعتمد على القناة والمتجر المعيّن.'
              : 'This simulator tests knowledge base retrieval and AI personality only. E-commerce features (order tracking, product queries, store catalog) can only be tested from a real customer message on a connected channel, as they depend on the assigned store and channel context.'}
          </p>
        </div>
      </div>

      {/* Knowledge status pill */}
      {!hasKnowledge && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3.5 py-2.5">
          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          <p className="text-[11px] text-rose-300/80">
            {isRTL
              ? 'لم يتم تعيين ملفات معرفة لهذا الوكيل. الردود ستعتمد فقط على التعليمات العامة.'
              : 'No knowledge files assigned to this bot. Responses will rely on general instructions only.'}
          </p>
        </div>
      )}

      {/* Suggested Quick Prompt Pills */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-text-tertiary">
          {copy.suggestedQuestionsTitle || (isRTL ? 'أسئلة مقترحة للتجربة السريعة:' : 'Suggested test questions:')}
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => void handleSend(q)}
              disabled={isTyping}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-text-secondary transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-white disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Interactive Chat Window ────────────────────────────── */}
      <div className="flex flex-col h-[400px] sm:h-[440px] rounded-3xl border border-white/10 bg-surface-elevated/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#070b14]/70 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden p-0.5 border border-white/15 bg-surface">
              <Image
                src={avatar.image}
                alt={displayName}
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{displayName}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-text-tertiary">{replyStyle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
              {isRTL ? 'ذكاء اصطناعي حقيقي' : 'Live AI'}
            </span>
            <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase">
              {isRTL ? 'محاكاة حية' : 'Live Simulator'}
            </span>
          </div>
        </div>

        {/* Message Log */}
        <div
          ref={chatScrollRef}
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot'
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-surface p-0.5 mb-1">
                    <Image
                      src={avatar.image}
                      alt={displayName}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isBot
                      ? msg.isError
                        ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200 rounded-bl-sm'
                        : 'border border-white/10 bg-surface-elevated/90 text-white rounded-bl-sm'
                      : 'bg-gradient-to-r from-brand to-brand-violet text-white rounded-br-sm shadow-md shadow-brand/10'
                  }`}
                >
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/50">
                    <span>{msg.time}</span>
                    {!isBot && <CheckCheck size={12} className="text-cyan-300" />}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2.5 justify-start">
              <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-surface p-0.5 mb-1">
                <Image
                  src={avatar.image}
                  alt={displayName}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-surface-elevated/90 px-4 py-3 text-xs text-text-tertiary flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-brand" />
                <span className="text-[10px]">{isRTL ? 'يفكّر...' : 'Thinking...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSend()
          }}
          className="border-t border-white/[0.08] bg-[#070b14]/90 p-3 sm:p-4 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={copy.testChatInputPlaceholder || (isRTL ? 'اكتب رسالة تجريبية لمساعدك الذكي...' : 'Type a test message to your assistant...')}
            className="flex-1 rounded-xl border border-white/10 bg-surface-elevated px-4 py-2.5 text-xs text-white placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md hover:brightness-110 disabled:opacity-40 transition-all"
          >
            <Send size={15} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </form>
      </div>
    </div>
  )
}
