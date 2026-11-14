'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Sparkles, Send, RotateCcw, Bot, User, CheckCheck, Loader2 } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { BotAvatarOption } from './types'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  time: string
}

interface Step06SimulatorProps {
  avatar: BotAvatarOption
  botName: string
  instructions: string
  replyStyle: string
  confidenceThreshold: number
  escalationKeywords: string[]
  onBotTypingState?: (isTyping: boolean) => void
}

export default function Step06Simulator({
  avatar,
  botName,
  instructions,
  replyStyle,
  confidenceThreshold,
  escalationKeywords,
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

  const handleSend = (textToSend?: string) => {
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

    // Simulate smart dynamic response evaluating keywords, tone, and personality
    setTimeout(() => {
      let botReply = ''
      const lower = text.toLowerCase()

      // 1. Check if user triggered escalation keywords
      const hitEscalation = escalationKeywords.some((kw) =>
        lower.includes(kw.trim().toLowerCase())
      ) || lower.includes('human') || lower.includes('موظف') || lower.includes('شخص') || lower.includes('بشري')

      if (hitEscalation) {
        botReply = isRTL
          ? `أهلاً بك! لقد تم تحويل محادثتك فوراً إلى أحد مسؤولي خدمة العملاء المتخصصين. سيكون معك زميلي في أقرب لحظة لمساعدتك.`
          : `I have escalated your request to one of our human support specialists. A team member will join this conversation shortly to assist you.`
      } else if (lower.includes('ساعات') || lower.includes('مواعيد') || lower.includes('hours') || lower.includes('time')) {
        botReply = isRTL
          ? `أوقات العمل واستقبال الطلبات لدينا على مدار الساعة عبر متجرنا الإلكتروني، وفريق الدعم متاح يومياً من 9:00 صباحاً حتى 11:00 مساءً.`
          : `Our online store receives orders 24/7. Our customer care team is available daily from 9:00 AM to 11:00 PM.`
      } else if (lower.includes('استبدال') || lower.includes('استرجاع') || lower.includes('return') || lower.includes('refund')) {
        botReply = isRTL
          ? `يسعدنا خدمتك! يمكنك استبدال أو استرجاع أي منتج خلال 14 يوماً من تاريخ الاستلام بشرط أن يكون بحالته الأصلية وتغليفه الأصلي.`
          : `We are glad to help! You can return or exchange any product within 14 days of receipt, provided it is in its original condition and packaging.`
      } else if (lower.includes('عروض') || lower.includes('منتجات') || lower.includes('سعر') || lower.includes('product') || lower.includes('price')) {
        botReply = isRTL
          ? `لدينا تشكيلة مميزة من المنتجات مع خصومات تصل إلى 20% هذا الأسبوع. يمكنك استعراض الكتالوج المباشر واختيار ما يناسبك!`
          : `We currently offer select featured items with up to 20% discounts this week! Feel free to browse our direct catalog links.`
      } else {
        // Dynamic contextual response based on the bot instructions & tone
        const tonePrefix = replyStyle.includes('ودود') || replyStyle.includes('Friendly')
          ? (isRTL ? 'يسعدني جداً الإجابة عن سؤالك!' : "I'm delighted to assist you with this!")
          : (isRTL ? 'شكراً لتواصلك معنا.' : 'Thank you for reaching out.')

        botReply = isRTL
          ? `${tonePrefix} وفقاً لقواعد النشاط والتعليمات المحددة، أنا هنا للإجابة عن كل ما يتعلق بالمنتجات، تفاصيل الشحن، وتتبع الطلبات.`
          : `${tonePrefix} In accordance with our store guidelines, I am ready to help you with product queries, order tracking, and store policies.`
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((cur) => [...cur, botMsg])
      setIsTyping(false)
      if (onBotTypingState) onBotTypingState(false)
    }, 950)
  }

  const resetChat = () => {
    setMessages([initialGreeting])
    setInputValue('')
    setIsTyping(false)
  }

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
              ? 'بيئة محاكاة حية لاختبار ردود الوكيل والتأكد من دقته ونبرته وقدرته على التعامل مع العملاء قبل إطلاقه.'
              : 'Interactive simulator evaluating responses against your configured persona and instructions.')}
        </p>
      </div>

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
              onClick={() => handleSend(q)}
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
          <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase">
            {isRTL ? 'محاكاة حية' : 'Live Simulator'}
          </span>
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
                      ? 'border border-white/10 bg-surface-elevated/90 text-white rounded-bl-sm'
                      : 'bg-gradient-to-r from-brand to-brand-violet text-white rounded-br-sm shadow-md shadow-brand/10'
                  }`}
                >
                  <p>{msg.text}</p>
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
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
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
