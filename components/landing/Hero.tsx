'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'
import { useAuth } from '../../lib/AuthContext'

const BADGE_PHRASES = [
  'ذكاء اصطناعي · AI Automation',
  'ردود فورية · Instant Replies',
  'يعمل 24/7 · Always On',
  'متعدد القنوات · Omnichannel',
]

const MESSAGES = [
  { icon: '📸', name: 'سارة محمد',  msgAr: 'ما هي ساعات العمل؟',   msgEn: 'What are your hours?',   done: false },
  { icon: '💬', name: 'Ahmed K.',   msgAr: 'هل التوصيل متاح؟',     msgEn: 'Is delivery available?', done: true  },
  { icon: '📧', name: 'Nora H.',    msgAr: 'أريد حجز طاولة لـ 4',  msgEn: 'Table for 4 please',     done: true  },
]

export default function Hero() {
  const { t, isRTL } = useLang()
  const { user } = useAuth()
  const [badgeIdx, setBadgeIdx] = useState(0)

  // Lightweight badge cycle – just a state swap, no animation library needed
  useEffect(() => {
    const iv = setInterval(() => setBadgeIdx(i => (i + 1) % BADGE_PHRASES.length), 3000)
    return () => clearInterval(iv)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-[58%_42%] gap-12 lg:gap-16 items-center py-20">

          {/* ── LEFT: Text ─────────────────────────────────────────────────── */}
          <div className={isRTL ? 'text-right' : 'text-left'}>

            {/* Badge */}
            <div className={`flex mb-7 ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  transition: 'opacity 0.35s ease',
                }}
              >
                <span className="hero-pulse-dot" style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'inline-block',
                }} />
                {BADGE_PHRASES[badgeIdx]}
              </div>
            </div>

            {/* Headline – CSS fade-in only */}
            <h1
              className="font-black leading-[1.05] mb-6 hero-fade-up"
              style={{ fontSize: 'clamp(2.5rem,5.5vw,5rem)', letterSpacing: '-0.03em' }}
            >
              <span className="block" style={{ color: 'var(--text-primary)' }}>
                {t.hero.headline1}
              </span>
              <span
                className="block"
                style={{
                  background: 'var(--accent)',
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
              className="text-lg leading-relaxed mb-8 hero-fade-up-2 max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className={`flex flex-col sm:flex-row gap-4 mb-8 hero-fade-up-3 ${isRTL ? 'sm:flex-row-reverse justify-end' : ''}`}>
              {user ? (
                <Link href="/dashboard" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-bold btn-primary">
                  {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                </Link>
              ) : (
                <>
                  <Link href="/register" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-bold btn-primary">
                    {t.hero.ctaPrimary}
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold btn-secondary">
                    <span style={{ fontSize: 13 }}>▶</span>
                    {t.hero.ctaSecondary}
                  </Link>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className={`flex items-center gap-3 hero-fade-up-4 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <div className="flex -space-x-2">
                {['🧑‍💼', '👩‍💼', '👨‍💼', '🧑‍🍳'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: 'var(--surface)', border: '2px solid var(--background)' }}>
                    {e}
                  </div>
                ))}
              </div>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>⭐ {t.hero.socialProof}</span>
            </div>
          </div>

          {/* ── RIGHT: Inbox card (static, no JS animation) ──────────────── */}
          <div className="relative flex justify-center lg:justify-end hero-fade-in">

            {/* Depth layer */}
            <div className="absolute"
              style={{
                width: '88%', top: 12, left: '6%', bottom: -12,
                borderRadius: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                filter: 'blur(2px)',
                transform: 'scale(0.97)',
                opacity: 0.5,
              }}
            />

            {/* Main card */}
            <div
              className="relative w-full max-w-sm"
              style={{
                background: 'var(--surface)',
                borderRadius: 20,
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--accent)',
                boxShadow: '0 0 40px var(--accent-subtle)',
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>✦</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    Inbox
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hero-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>AI Active</span>
                </div>
              </div>

              {/* Messages */}
              <div className="px-4 py-3 space-y-2.5">
                {MESSAGES.map((m, i) => (
                  <div key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
                  >
                    <span>{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                      </div>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }} className="truncate">
                        {isRTL ? m.msgAr : m.msgEn}
                      </p>
                    </div>
                    {m.done
                      ? <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>AI ✓</span>
                      : <div className="flex items-center gap-0.5">
                          {[0, 1, 2].map(j => (
                            <div key={j} className="hero-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', animationDelay: `${j * 0.2}s` }} />
                          ))}
                        </div>
                    }
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>340 {isRTL ? 'رد اليوم' : 'replies today'}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  ⚡ 8s avg
                </span>
              </div>
            </div>

            {/* Floating pills – CSS animation only */}
            <div className="absolute -top-5 -right-4 px-3 py-2 rounded-xl text-xs font-bold hidden sm:flex items-center gap-1.5 hero-float"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
              ⚡ 8s
            </div>
            <div className="absolute top-1/3 -left-5 px-3 py-2 rounded-xl text-xs font-bold hidden sm:flex items-center gap-1.5 hero-float-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              ⭐ 4.9
            </div>
          </div>

        </div>
      </div>

      {/* CSS-only keyframes — no JS */}
      <style>{`
        .hero-fade-up   { animation: hfu 0.6s ease both; }
        .hero-fade-up-2 { animation: hfu 0.6s ease 0.1s both; }
        .hero-fade-up-3 { animation: hfu 0.6s ease 0.2s both; }
        .hero-fade-up-4 { animation: hfu 0.6s ease 0.3s both; }
        .hero-fade-in   { animation: hfi 0.7s ease 0.2s both; }
        .hero-float     { animation: hfloat 4s ease-in-out infinite; }
        .hero-float-2   { animation: hfloat 5s ease-in-out 1s infinite; }
        .hero-pulse-dot { animation: hpulse 2s ease-in-out infinite; }
        .hero-dot       { animation: hdot 1.2s ease infinite; }

        @keyframes hfu    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes hfi    { from { opacity:0; } to { opacity:1; } }
        @keyframes hfloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes hpulse { 0%,100% { opacity:1; box-shadow:0 0 0 0 var(--accent); } 50% { opacity:0.5; box-shadow:0 0 0 4px transparent; } }
        @keyframes hdot   { 0%,80%,100% { transform:scale(0.8); opacity:0.4; } 40% { transform:scale(1.2); opacity:1; } }
      `}</style>
    </section>
  )
}
