'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'

const BADGE_PHRASES = [
  'ذكاء اصطناعي · AI Automation',
  'ردود فورية · Instant Replies',
  'يعمل 24/7 · Always On',
  'متعدد القنوات · Omnichannel',
]

// Looping inbox animation messages
const INBOX_SEQUENCE = [
  { platform: '📸', name: 'سارة محمد', msg: 'ما هي ساعات العمل؟', type: 'incoming' },
  { platform: '🤖', name: 'AI يرد الآن...', msg: null, type: 'typing' },
  { platform: '✅', name: 'تم الإرسال', msg: 'ساعات العمل: 9 صباحاً – 9 مساءً 🕘', type: 'sent' },
]

export default function Hero() {
  const { t, isRTL } = useLang()
  const [badgeIdx, setBadgeIdx] = useState(0)
  const [badgeVisible, setBadgeVisible] = useState(true)
  const [inboxStep, setInboxStep] = useState(0)

  // Badge cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setBadgeVisible(false)
      setTimeout(() => {
        setBadgeIdx(i => (i + 1) % BADGE_PHRASES.length)
        setBadgeVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Inbox loop
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const runSequence = () => {
      setInboxStep(0)
      timers.push(setTimeout(() => setInboxStep(1), 1400))
      timers.push(setTimeout(() => setInboxStep(2), 2800))
      timers.push(setTimeout(() => {
        setInboxStep(0)
        runSequence()
      }, 5000))
    }
    runSequence()
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-[60%_40%] gap-12 lg:gap-16 items-center py-20">

          {/* LEFT: Text */}
          <div className={isRTL ? 'order-1 lg:order-1 text-right' : 'order-1 text-left'}>

            {/* Animated Badge */}
            <div className={`flex mb-7 ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  background: 'rgba(0,255,178,0.08)',
                  border: '1px solid rgba(0,255,178,0.25)',
                  color: '#00FFB2',
                  opacity: badgeVisible ? 1 : 0,
                  transform: badgeVisible ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FFB2', display: 'inline-block', boxShadow: '0 0 6px #00FFB2', animation: 'tealPulse 2s infinite' }} />
                {BADGE_PHRASES[badgeIdx]}
              </div>
            </div>

            {/* Headline — 3 lines, each different animation */}
            <h1
              className={`font-black leading-[1.05] mb-6 ${isRTL ? 'font-arabic' : ''}`}
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 5rem)',
                letterSpacing: '-0.03em',
              }}
            >
              <span className="block slide-left" style={{ color: '#F0F0FF' }}>
                {t.hero.headline1}
              </span>
              <span
                className="block slide-right delay-200"
                style={{
                  background: 'linear-gradient(135deg, #00FFB2 0%, #BF00FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t.hero.headline2}
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className={`text-lg leading-relaxed mb-8 fade-up delay-300 max-w-lg ${isRTL ? 'mr-0 ml-auto' : ''}`}
              style={{ color: 'rgba(240,240,255,0.5)' }}
            >
              {t.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className={`flex flex-col sm:flex-row gap-4 mb-8 fade-up delay-400 ${isRTL ? 'sm:flex-row-reverse justify-end' : ''}`}>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-bold btn-pulse transition-all duration-200"
                style={{
                  background: '#00FFB2',
                  color: '#050508',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#00E8A0'
                  e.currentTarget.style.transform = 'scale(1.03)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#00FFB2'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {t.hero.ctaPrimary}
              </Link>
              <button
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(240,240,255,0.7)',
                  background: 'rgba(255,255,255,0.03)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)'
                  e.currentTarget.style.color = '#F0F0FF'
                  e.currentTarget.style.background = 'rgba(0,255,178,0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.color = 'rgba(240,240,255,0.7)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                <span style={{ fontSize: 13 }}>▶</span>
                {t.hero.ctaSecondary}
              </button>
            </div>

            {/* Social proof */}
            <div className={`flex items-center gap-3 fade-in delay-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {['🧑‍💼','👩‍💼','👨‍💼','🧑‍🍳'].map((e, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: '#0F0F1A',
                      border: '2px solid #050508',
                    }}
                  >
                    {e}
                  </div>
                ))}
              </div>
              <span style={{ color: 'rgba(240,240,255,0.45)', fontSize: 14 }}>
                ⭐ {t.hero.socialProof}
              </span>
            </div>
          </div>

          {/* RIGHT: Animated inbox card */}
          <div className="relative flex justify-center lg:justify-end order-2 fade-in delay-300">

            {/* Depth layer — blurred card behind */}
            <div
              className="absolute"
              style={{
                width: '88%',
                top: '12px',
                left: '6%',
                bottom: '-12px',
                borderRadius: 20,
                background: '#0A0A12',
                border: '1px solid rgba(255,255,255,0.04)',
                filter: 'blur(2px)',
                transform: 'scale(0.97)',
              }}
            />

            {/* Main inbox card */}
            <div
              className="relative w-full max-w-sm"
              style={{
                background: 'rgba(15,15,26,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: '2px solid #00FFB2',
                boxShadow: '0 0 60px rgba(0,255,178,0.08), 0 0 120px rgba(191,0,255,0.04)',
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: '#00FFB2', fontSize: 13, fontWeight: 700 }}>✦ Naz</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,255,178,0.1)', color: '#00FFB2' }}
                  >
                    Inbox
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FFB2', boxShadow: '0 0 6px #00FFB2', animation: 'tealPulse 2s infinite' }} />
                  <span style={{ color: 'rgba(240,240,255,0.4)', fontSize: 11 }}>AI Active</span>
                </div>
              </div>

              {/* Inbox items (static) */}
              <div className="px-4 py-3 space-y-2.5">
                {[
                  { platform: '📸', name: 'Ahmed K.', msg: 'Is delivery available?', time: '5s', done: true },
                  { platform: '📘', name: 'خالد العمري', msg: 'كم سعر الباقة؟', time: '8s', done: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span>{item.platform}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span style={{ color: '#F0F0FF', fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                        <span style={{ color: 'rgba(240,240,255,0.3)', fontSize: 11 }}>{item.time} ago</span>
                      </div>
                      <p style={{ color: 'rgba(240,240,255,0.4)', fontSize: 12, marginTop: 2 }} className="truncate">{item.msg}</p>
                    </div>
                    <span style={{ color: '#00FFB2', fontSize: 11, fontWeight: 700 }}>AI ✓</span>
                  </div>
                ))}

                {/* Animated sequence */}
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(5,5,8,0.6)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    minHeight: 64,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {inboxStep === 0 && (
                    <div className="flex items-start gap-3 fade-in">
                      <span>📸</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span style={{ color: '#F0F0FF', fontSize: 13, fontWeight: 600 }}>سارة محمد</span>
                          <span style={{ color: 'rgba(240,240,255,0.3)', fontSize: 11 }}>now</span>
                        </div>
                        <p style={{ color: 'rgba(240,240,255,0.5)', fontSize: 12, marginTop: 2 }}>ما هي ساعات العمل؟</p>
                      </div>
                    </div>
                  )}
                  {inboxStep === 1 && (
                    <div className="flex items-center gap-3 fade-in">
                      <span>🤖</span>
                      <div>
                        <span style={{ color: 'rgba(240,240,255,0.5)', fontSize: 13 }}>AI يرد الآن</span>
                        <div className="flex gap-1 mt-1">
                          {[0,1,2].map(i => (
                            <div
                              key={i}
                              style={{
                                width: 5, height: 5, borderRadius: '50%',
                                background: '#00FFB2',
                                animation: `typingDot 1.2s ease ${i * 0.2}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {inboxStep === 2 && (
                    <div className="flex items-start gap-3 fade-in">
                      <span>✅</span>
                      <div className="flex-1">
                        <p style={{ color: '#F0F0FF', fontSize: 13 }}>ساعات العمل: 9 صباحاً – 9 مساءً 🕘</p>
                        <span style={{ color: '#00FFB2', fontSize: 11, display: 'block', marginTop: 4 }}>✓ تم الإرسال</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom bar */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ color: 'rgba(240,240,255,0.35)', fontSize: 12 }}>340 رد اليوم</span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(0,255,178,0.1)', color: '#00FFB2' }}
                >
                  ⚡ 8 ثوانٍ avg
                </span>
              </div>
            </div>

            {/* Floating stat pills */}
            <div
              className="absolute -top-5 -right-4 px-3 py-2 rounded-xl text-xs font-bold hidden sm:flex items-center gap-1.5"
              style={{
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(0,255,178,0.2)',
                color: '#00FFB2',
                boxShadow: '0 0 20px rgba(0,255,178,0.08)',
                animation: 'floatPill 4s ease-in-out infinite',
                backdropFilter: 'blur(12px)',
              }}
            >
              ⚡ 8 ثوانٍ
            </div>

            <div
              className="absolute top-1/3 -left-5 px-3 py-2 rounded-xl text-xs font-bold hidden sm:flex items-center gap-1.5"
              style={{
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(191,0,255,0.2)',
                color: '#BF00FF',
                boxShadow: '0 0 20px rgba(191,0,255,0.08)',
                animation: 'floatPill 5s ease-in-out infinite 1s',
                backdropFilter: 'blur(12px)',
              }}
            >
              ⭐ 4.9
            </div>

            <div
              className="absolute -bottom-4 right-8 px-3 py-2 rounded-xl text-xs font-bold hidden sm:flex items-center gap-1.5"
              style={{
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
                animation: 'floatPill 6s ease-in-out infinite 2s',
                backdropFilter: 'blur(12px)',
              }}
            >
              340 رد اليوم
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
