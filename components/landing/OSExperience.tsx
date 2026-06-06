'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  motion, useScroll, useTransform, useSpring, AnimatePresence, MotionValue,
} from 'framer-motion'
import { useLang } from '../../lib/LangContext'

// ─── SCROLL MAP ───────────────────────────────────────────────────────────────
// Each state occupies exactly 1/7 of the scroll range.
// Transition: 0.06 to fade-in, 0.06 to fade-out = clean crossfade, never overlap.
//
// State 0  0.000 → 0.143   AI Core boot + headline
// State 1  0.143 → 0.286   Channels emerge
// State 2  0.286 → 0.429   Messages flow in
// State 3  0.429 → 0.571   Neural brain
// State 4  0.571 → 0.714   Automations
// State 5  0.714 → 0.857   Business outcomes
// State 6  0.857 → 1.000   Pricing deployment

const S = 1 / 7  // one slot = ~0.1428

// For a given slot index, return [fadeIn_start, fadeIn_end, fadeOut_start, fadeOut_end]
function slot(i: number): [number, number, number, number] {
  const start = i * S
  const end = (i + 1) * S
  const fade = S * 0.38  // 38% of slot = fade window
  return [start, start + fade, end - fade, end]
}

// Build opacity transform for a state slot
function slotOpacity(p: MotionValue<number>, i: number): MotionValue<number> {
  const [a, b, c, d] = slot(i)
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0])
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'wa',  label: 'WhatsApp',  icon: '💬', color: '#25D366', angle: -130, dist: 155 },
  { id: 'ig',  label: 'Instagram', icon: '📸', color: '#E1306C', angle: -60,  dist: 150 },
  { id: 'em',  label: 'Email',     icon: '📧', color: '#7DF9FF', angle:  60,  dist: 150 },
  { id: 'web', label: 'Website',   icon: '🌐', color: '#C6FF00', angle:  130, dist: 155 },
  { id: 'fb',  label: 'Facebook',  icon: '🔵', color: '#1877F2', angle:  180, dist: 148 },
]

const CAPS = [
  { id: 'lead',    ar: 'تأهيل العملاء',    en: 'Lead Qualification', icon: '🎯', angle: -115, dist: 210 },
  { id: 'support', ar: 'دعم العملاء',       en: 'Customer Support',   icon: '💬', angle:  -45, dist: 220 },
  { id: 'review',  ar: 'استرداد التقييمات', en: 'Review Recovery',    icon: '⭐', angle:   30, dist: 215 },
  { id: 'content', ar: 'توليد المحتوى',     en: 'Content Creation',   icon: '✍️', angle:  105, dist: 210 },
  { id: 'sales',   ar: 'أتمتة المبيعات',    en: 'Sales Automation',   icon: '💰', angle:  170, dist: 218 },
  { id: 'inbox',   ar: 'الوارد الموحد',      en: 'Unified Inbox',      icon: '📥', angle: -168, dist: 208 },
]

const MSGS = [
  { from: 'Ahmed K.', icon: '💬', color: '#25D366', ar: 'هل التوصيل متاح؟',          en: 'Is delivery available?',   status: 'Responded',  sc: '#C6FF00' },
  { from: 'سارة م.',  icon: '📸', color: '#E1306C', ar: 'ما هي ساعات العمل؟',         en: 'What are your hours?',     status: 'Processing', sc: '#C6FF00' },
  { from: 'Nora H.',  icon: '📧', color: '#7DF9FF', ar: 'أريد حجز طاولة لـ 4',       en: 'Table for 4 please',       status: 'Responded',  sc: '#C6FF00' },
  { from: 'خالد ع.',  icon: '🌐', color: '#C6FF00', ar: 'كم سعر الباقة؟',             en: 'Business plan price?',     status: 'Lead ⚡',   sc: '#FFD700' },
  { from: 'Omar F.',  icon: '💬', color: '#25D366', ar: 'شكراً على الرد السريع!',     en: 'Thanks for quick reply!',  status: 'Closed',    sc: 'rgba(255,255,255,0.4)' },
]

const OUTCOMES = [
  { before: '48h',   after: '8s',   icon: '⚡', ar: 'وقت الرد',      en: 'Response Time'   },
  { before: '3.1★',  after: '4.8★', icon: '⭐', ar: 'تقييم جوجل',    en: 'Google Rating'   },
  { before: '12%',   after: '41%',  icon: '💰', ar: 'معدل التحويل',  en: 'Conversion Rate' },
  { before: '60%',   after: '100%', icon: '✅', ar: 'تغطية الردود',  en: 'Reply Coverage'  },
]

const PLANS = [
  { ar: 'تجريبي',  en: 'Starter',    mo: 0,   yr: 0,
    f: ['50 replies/mo', '1 channel', 'Basic AI'] },
  { ar: 'أساسي',   en: 'Basic',      mo: 49,  yr: 39,
    f: ['500 replies/mo', '2 channels', 'Reports', 'Email support'] },
  { ar: 'أعمال',   en: 'Business',   mo: 99,  yr: 79, pop: true,
    f: ['Unlimited replies', 'All channels', 'Advanced AI', '24/7 support'] },
  { ar: 'مؤسسات',  en: 'Enterprise', mo: 249, yr: 199,
    f: ['Everything in Business', 'Dedicated server', 'SLA', 'Full API'] },
]

const LABELS = [
  { ar: 'تمهيد النظام',       en: 'System Boot'           },
  { ar: 'القنوات تتصل',       en: 'Channels Connecting'   },
  { ar: 'الرسائل تتدفق',      en: 'Messages Flow In'      },
  { ar: 'عقل الذكاء يتشكل',   en: 'AI Brain Forming'      },
  { ar: 'الأتمتة تنشط',       en: 'Automations Active'    },
  { ar: 'النتائج تتحقق',      en: 'Outcomes Generated'    },
  { ar: 'النشر جاهز',         en: 'Ready to Deploy'       },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function polar(deg: number, dist: number) {
  const r = (deg * Math.PI) / 180
  return { x: Math.sin(r) * dist, y: -Math.cos(r) * dist }
}

function useCountUp(target: string, run: boolean) {
  const [val, setVal] = useState(target.replace(/[0-9.]/g, '') === target ? target : '0')
  useEffect(() => {
    if (!run) return
    const num = parseFloat(target.replace(/[^0-9.]/g, ''))
    const suffix = target.replace(/[0-9.]/g, '')
    if (isNaN(num)) { setVal(target); return }
    const t0 = Date.now(), dur = 1400
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1)
      const v = num < 10 ? ((1-(1-p)**3)*num).toFixed(1) : Math.round((1-(1-p)**3)*num).toString()
      setVal(v + suffix)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [run, target])
  return val
}

// ─── AI CORE ──────────────────────────────────────────────────────────────────
function AICore({ size = 130 }: { size?: number }) {
  const s = size
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: s, height: s }}>
      {[0,1,2].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: s * 0.96, height: s * 0.96,
          border: '1px solid rgba(198,255,0,0.28)',
          animation: `energyPulse 2.6s ease-out ${i * 0.87}s infinite`,
        }} />
      ))}
      <div className="absolute rounded-full core-rotate" style={{
        width: s * 0.88, height: s * 0.88,
        border: '1px solid transparent',
        borderTop: '1px solid rgba(198,255,0,0.45)',
        borderRight: '1px solid rgba(198,255,0,0.15)',
      }} />
      <div className="absolute rounded-full core-rotate-rev" style={{
        width: s * 0.68, height: s * 0.68,
        border: '1px solid transparent',
        borderBottom: '1px solid rgba(125,249,255,0.45)',
        borderLeft: '1px solid rgba(125,249,255,0.15)',
      }} />
      <div className="relative core-glow flex items-center justify-center" style={{
        width: s * 0.5, height: s * 0.5, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 33%, rgba(198,255,0,0.2) 0%, rgba(198,255,0,0.04) 55%, transparent 80%)',
        border: '2px solid rgba(198,255,0,0.4)',
      }}>
        <span style={{ fontSize: s * 0.2, filter: 'drop-shadow(0 0 14px rgba(198,255,0,1))' }}>✦</span>
      </div>
      {[0,72,144,216,288].map((deg, i) => (
        <div key={i} className="absolute" style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i % 2 === 0 ? '#C6FF00' : '#7DF9FF',
          boxShadow: `0 0 6px ${i % 2 === 0 ? '#C6FF00' : '#7DF9FF'}`,
          top: `${50 - 43 * Math.cos((deg * Math.PI) / 180)}%`,
          left: `${50 + 43 * Math.sin((deg * Math.PI) / 180)}%`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}
    </div>
  )
}

// ─── STATE SCREENS ────────────────────────────────────────────────────────────

function State0({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: useTransform(op, v => v > 0.05 ? 'auto' : 'none') as any }}>
      {/* Status */}
      <div className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid rgba(198,255,0,0.22)' }}>
        <div className="w-2 h-2 rounded-full status-live" style={{ background: '#C6FF00' }} />
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
          {isRTL ? 'نظام الذكاء الاصطناعي — مشغّل' : 'AI OPERATING SYSTEM — ONLINE'}
        </span>
      </div>

      {/* Core */}
      <div className="mb-10"><AICore size={160} /></div>

      {/* Metrics */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {[
          { v: '247',   l: isRTL ? 'محادثة نشطة' : 'Active Convos', c: '#C6FF00' },
          { v: '3,842', l: isRTL ? 'رد اليوم'    : 'Replies Today', c: '#7DF9FF' },
          { v: '128',   l: isRTL ? 'عميل محتمل'  : 'Leads Today',   c: '#C6FF00' },
          { v: '8s',    l: isRTL ? 'وقت الرد'    : 'Avg Response',  c: '#7DF9FF' },
        ].map((m, i) => (
          <div key={i} className="glass rounded-xl px-4 py-2.5 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.06)', minWidth: 80 }}>
            <div className="text-xl font-black" style={{ color: m.c, letterSpacing: '-0.04em' }}>{m.v}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Headline */}
      <h1 className="font-black leading-[1.05] text-center mb-4"
        style={{ fontSize: 'clamp(2rem,5vw,4.2rem)', letterSpacing: '-0.04em' }}>
        <span className="block" style={{ color: '#F5F5F5' }}>
          {isRTL ? 'عملك لا ينام.' : 'Your Business Never Sleeps.'}
        </span>
        <span className="block text-dual">{isRTL ? 'وكذلك ذكاؤك الاصطناعي.' : 'Neither Does Your AI.'}</span>
      </h1>
      <p className="text-base text-center mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {isRTL
          ? 'منصة ذكاء اصطناعي تتولى الردود وتحوّل الرسائل إلى عملاء — تلقائياً.'
          : 'AI that handles replies, builds relationships, and converts messages into customers — automatically.'}
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/register" className="btn-lime px-8 py-3.5 rounded-xl font-bold text-base" style={{ minWidth: 190, textAlign: 'center' }}>
          {isRTL ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
        </Link>
      </div>
      <div className="mt-10 flex items-center justify-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        <span className="tracking-[0.18em]">{isRTL ? '▼ مرر للاستكشاف ▼' : '▼ SCROLL TO EXPLORE ▼'}</span>
      </div>
    </motion.div>
  )
}

function State1({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % CHANNELS.length), 800)
    return () => clearInterval(iv)
  }, [])

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ opacity: op, pointerEvents: 'none' }}>

      {/* Title */}
      <div className="absolute top-24 text-center">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(125,249,255,0.22)' }}>
          <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#7DF9FF' }} />
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#7DF9FF' }}>
            {isRTL ? 'القنوات تتصل بالنظام' : 'CHANNELS CONNECTING'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'كل قنواتك في مكان واحد.' : 'All your channels. One system.'}
        </h2>
      </div>

      {/* Core */}
      <AICore size={140} />

      {/* Channels orbit */}
      {CHANNELS.map((ch, i) => {
        const pos = polar(ch.angle, ch.dist)
        const isHot = pulse === i
        return (
          <div key={ch.id} className="absolute" style={{
            left: `calc(50% + ${pos.x}px - 24px)`,
            top:  `calc(50% + ${pos.y}px - 24px)`,
          }}>
            <div className="flex flex-col items-center gap-1.5 transition-all duration-300"
              style={{ transform: isHot ? 'scale(1.12)' : 'scale(1)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{
                  background: `${ch.color}15`,
                  border: `2px solid ${ch.color}${isHot ? '70' : '30'}`,
                  boxShadow: isHot ? `0 0 28px ${ch.color}40` : 'none',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                }}>
                {ch.icon}
              </div>
              <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: ch.color }}>{ch.label}</span>
            </div>
            {/* Connection line */}
            <svg className="absolute pointer-events-none" style={{
              position: 'fixed',
              left: `calc(50% + ${pos.x / 2}px)`,
              top: `calc(50% + ${pos.y / 2}px)`,
              width: Math.abs(pos.x) + 4, height: Math.abs(pos.y) + 4,
              overflow: 'visible', pointerEvents: 'none',
            }}>
              <line x1="0" y1="0" x2={-pos.x/2} y2={-pos.y/2}
                stroke={ch.color} strokeWidth="1"
                strokeOpacity={isHot ? 0.5 : 0.2}
                strokeDasharray="4 5"
                style={{ transition: 'stroke-opacity 0.3s' }}
              />
            </svg>
          </div>
        )
      })}
    </motion.div>
  )
}

function State2({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [activeMsg, setActiveMsg] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setActiveMsg(p => (p + 1) % MSGS.length), 1600)
    return () => clearInterval(iv)
  }, [])

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: 'none' }}>
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-8">

        {/* Left: message feed */}
        <div className="flex-1 max-w-sm w-full">
          <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: '#C6FF00' }}>
            {isRTL ? 'رسائل واردة — مباشر' : 'INCOMING — LIVE'}
          </div>
          <div className="rounded-2xl overflow-hidden glass" style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
              <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>5 {isRTL ? 'محادثة نشطة' : 'active conversations'}</span>
            </div>
            <div className="p-2 space-y-1.5">
              {MSGS.map((msg, i) => (
                <div key={msg.from}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300"
                  style={{ background: activeMsg === i ? 'rgba(198,255,0,0.06)' : 'rgba(255,255,255,0.02)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${msg.color}15`, border: `1px solid ${msg.color}25` }}>
                    {msg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold" style={{ color: '#F5F5F5' }}>{msg.from}</div>
                    <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {isRTL ? msg.ar : msg.en}
                    </div>
                  </div>
                  {activeMsg === i ? (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: '#C6FF00',
                          animation: `typingDot 1.2s ease ${j * 0.2}s infinite` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: `${msg.sc}15`, color: msg.sc }}>
                      {msg.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: core */}
        <div className="flex flex-col items-center gap-4">
          <AICore size={130} />
          <div className="text-xs font-bold text-center" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 180 }}>
            {isRTL ? 'كل قناة تتدفق في نظام واحد' : 'Every channel flows into one system'}
          </div>
        </div>

        {/* Right: AI processing */}
        <div className="flex-1 max-w-xs w-full">
          <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: '#C6FF00' }}>
            {isRTL ? 'معالجة الذكاء الاصطناعي' : 'AI PROCESSING'}
          </div>
          <div className="rounded-2xl p-4 glass" style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(198,255,0,0.12)' }}>
            {[
              { l: isRTL ? 'تحليل النص'    : 'Text Analysis',    p: 94, c: '#C6FF00' },
              { l: isRTL ? 'توليد الرد'    : 'Response Gen',     p: 88, c: '#7DF9FF' },
              { l: isRTL ? 'إدارة السياق'  : 'Context Handling', p: 97, c: '#C6FF00' },
              { l: isRTL ? 'اكتشاف النية'  : 'Intent Detection', p: 91, c: '#7DF9FF' },
            ].map((b, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{b.l}</span>
                  <span style={{ color: b.c }}>{b.p}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${b.p}%`,
                    background: b.c,
                    boxShadow: `0 0 6px ${b.c}60`,
                    animation: `barGrow 1.2s ease ${i * 0.15}s both`,
                  }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-1 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{isRTL ? 'متوسط الرد' : 'Avg reply time'}</span>
              <span className="text-sm font-black" style={{ color: '#C6FF00' }}>8s</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function State3({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [pulse, setPulse] = useState<string | null>(null)
  const [vw, setVw] = useState(1200)
  const [vh, setVh] = useState(700)
  useEffect(() => {
    setVw(window.innerWidth)
    setVh(window.innerHeight)
  }, [])
  useEffect(() => {
    const ids = CAPS.map(c => c.id)
    const iv = setInterval(() => {
      const p = ids[Math.floor(Math.random() * ids.length)]
      setPulse(p)
      setTimeout(() => setPulse(null), 700)
    }, 1300)
    return () => clearInterval(iv)
  }, [])

  const cx = vw / 2
  const cy = vh / 2

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center z-10"
      style={{ opacity: op, pointerEvents: 'none' }}>
      {/* Title */}
      <div className="absolute top-24 text-center">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(198,255,0,0.2)' }}>
          <span style={{ color: '#C6FF00', fontSize: 12 }}>⬡</span>
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
            {isRTL ? 'الشبكة العصبية' : 'NEURAL CAPABILITY NETWORK'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'عقل متصل بكل شيء.' : 'A brain connected to everything.'}
        </h2>
      </div>

      {/* SVG neural lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {CAPS.map(cap => {
          const pos = polar(cap.angle, cap.dist)
          const isHot = pulse === cap.id
          return (
            <line key={cap.id}
              x1={cx} y1={cy}
              x2={cx + pos.x} y2={cy + pos.y}
              stroke={isHot ? '#C6FF00' : '#7DF9FF'}
              strokeWidth={isHot ? 1.5 : 0.5}
              strokeOpacity={isHot ? 0.8 : 0.22}
              strokeDasharray="4 6"
              style={{ transition: 'stroke-opacity 0.3s, stroke-width 0.3s' }}
            />
          )
        })}
        {/* Cross-connections */}
        {CAPS.map((a, ai) => CAPS.slice(ai + 1, ai + 3).map((b, bi) => {
          const pa = polar(a.angle, a.dist)
          const pb = polar(b.angle, b.dist)
          const isHot = pulse === a.id || pulse === b.id
          return (
            <line key={`${a.id}-${b.id}-${bi}`}
              x1={cx + pa.x} y1={cy + pa.y}
              x2={cx + pb.x} y2={cy + pb.y}
              stroke={isHot ? '#C6FF00' : '#7DF9FF'}
              strokeWidth={isHot ? 0.8 : 0.25}
              strokeOpacity={isHot ? 0.5 : 0.1}
              style={{ transition: 'stroke-opacity 0.3s' }}
            />
          )
        }))}
      </svg>

      {/* Core */}
      <AICore size={120} />

      {/* Capability nodes */}
      {CAPS.map(cap => {
        const pos = polar(cap.angle, cap.dist)
        const isHot = pulse === cap.id
        return (
          <div key={cap.id} className="absolute flex flex-col items-center gap-1.5"
            style={{
              left: `calc(50% + ${pos.x}px - 22px)`,
              top: `calc(50% + ${pos.y}px - 22px)`,
            }}>
            {isHot && (
              <div className="absolute rounded-full" style={{
                width: 52, height: 52,
                border: '2px solid rgba(198,255,0,0.6)',
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                animation: 'nodePulse 0.7s ease-out infinite',
              }} />
            )}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: isHot ? 'rgba(198,255,0,0.14)' : 'rgba(14,14,14,0.9)',
                border: `2px solid ${isHot ? 'rgba(198,255,0,0.55)' : 'rgba(198,255,0,0.14)'}`,
                boxShadow: isHot ? '0 0 28px rgba(198,255,0,0.25)' : 'none',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
              }}>
              {cap.icon}
            </div>
            <div className="text-[10px] font-bold text-center whitespace-nowrap px-1.5 py-0.5 rounded-lg"
              style={{
                background: 'rgba(5,5,5,0.92)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: isHot ? '#C6FF00' : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(6px)',
                transition: 'color 0.3s',
              }}>
              {isRTL ? cap.ar : cap.en}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

function State4({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % 4), 1000)
    return () => clearInterval(iv)
  }, [])

  const flow = [
    { icon: '💬', ar: 'رسالة',  en: 'Message', c: '#7DF9FF' },
    { icon: '🧠', ar: 'ذكاء',   en: 'AI',      c: '#C6FF00' },
    { icon: '⚡', ar: 'إجراء',  en: 'Action',  c: '#C6FF00' },
    { icon: '🎯', ar: 'نتيجة',  en: 'Result',  c: '#7DF9FF' },
  ]
  const cards = [
    { icon: '🌙', ar: 'رد ما بعد الدوام',    en: 'After-Hours Reply',  r_ar: '100% ردود',    r_en: '100% coverage' },
    { icon: '⭐', ar: 'استرداد التقييمات', en: 'Review Recovery',    r_ar: '−60% سلبية',   r_en: '−60% bad reviews' },
    { icon: '💰', ar: 'أتمتة المبيعات',    en: 'Sales Automation',   r_ar: '+35% تحويل',   r_en: '+35% conversion' },
  ]

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: 'none' }}>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(198,255,0,0.18)' }}>
          <span style={{ color: '#C6FF00', fontSize: 12 }}>◈</span>
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
            {isRTL ? 'شبكة الأتمتة' : 'AUTOMATION NETWORK'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'الرسالة تصل. الذكاء يعمل.' : 'Message in. Magic out.'}
        </h2>
      </div>

      {/* Flow */}
      <div className="flex items-center gap-2 mb-12">
        {flow.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2 transition-all duration-300"
              style={{ transform: step === i ? 'scale(1.12)' : 'scale(1)' }}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300"
                style={{
                  background: step === i ? `${s.c}18` : 'rgba(14,14,14,0.8)',
                  border: `2px solid ${step === i ? s.c : `${s.c}25`}`,
                  boxShadow: step === i ? `0 0 32px ${s.c}30` : 'none',
                }}>
                {s.icon}
              </div>
              <span className="text-xs font-bold" style={{ color: step === i ? s.c : 'rgba(255,255,255,0.4)' }}>
                {isRTL ? s.ar : s.en}
              </span>
            </div>
            {i < flow.length - 1 && (
              <div className="flex items-center pb-5 mx-1">
                <div className="h-px w-10 sm:w-16 rounded-full" style={{
                  background: step > i
                    ? `linear-gradient(to right, ${flow[i].c}, ${flow[i+1].c})`
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: step > i ? `0 0 6px ${flow[i].c}50` : 'none',
                  transition: 'all 0.4s ease',
                }} />
                <span style={{ color: step > i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', fontSize: 14 }}>›</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((c, i) => (
          <div key={i} className="glass rounded-2xl p-5 w-44 sm:w-52"
            style={{ background: 'rgba(14,14,14,0.88)', border: '1px solid rgba(198,255,0,0.1)' }}>
            <div className="text-2xl mb-3">{c.icon}</div>
            <div className="text-sm font-bold mb-2" style={{ color: '#F5F5F5' }}>
              {isRTL ? c.ar : c.en}
            </div>
            <div className="text-[11px] font-bold" style={{ color: '#C6FF00' }}>
              {isRTL ? c.r_ar : c.r_en}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function State5({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [run, setRun] = useState(false)
  useEffect(() => {
    const unsub = op.on('change', v => { if (v > 0.3) setRun(true) })
    return () => unsub()
  }, [op])
  const v0 = useCountUp(OUTCOMES[0].after, run)
  const v1 = useCountUp(OUTCOMES[1].after, run)
  const v2 = useCountUp(OUTCOMES[2].after, run)
  const v3 = useCountUp(OUTCOMES[3].after, run)
  const vals = [v0, v1, v2, v3]

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: 'none' }}>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(125,249,255,0.22)' }}>
          <span style={{ color: '#7DF9FF', fontSize: 12 }}>◉</span>
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#7DF9FF' }}>
            {isRTL ? 'التأثير على الأعمال' : 'BUSINESS IMPACT'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'الأعمال تتحول أمام عينيك.' : 'Watch your business transform.'}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-10">
        {OUTCOMES.map((item, i) => (
          <div key={i} className="glass rounded-2xl p-5 text-center card-os"
            style={{ background: 'rgba(14,14,14,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-[11px] mb-2" style={{ color: 'rgba(255,120,120,0.75)' }}>
              {isRTL ? 'قبل: ' : 'Before: '}{item.before}
            </div>
            <div className="text-3xl font-black" style={{ color: '#C6FF00', letterSpacing: '-0.04em' }}>
              {vals[i]}
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {isRTL ? item.ar : item.en}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span style={{ color: '#C6FF00', fontSize: 10 }}>▲</span>
              <span className="text-[10px] font-bold" style={{ color: '#C6FF00' }}>
                {isRTL ? 'تحسن' : 'Improved'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 w-full max-w-xl"
        style={{ background: 'rgba(14,14,14,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[10px] font-bold tracking-widest mb-4 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isRTL ? 'متوسط النتائج — بعد 30 يوم' : 'AVERAGE RESULTS — AFTER 30 DAYS'}
        </div>
        {[
          { l: isRTL ? 'رضا العملاء'  : 'Customer Satisfaction', p: 94, c: '#C6FF00' },
          { l: isRTL ? 'سرعة الرد'    : 'Response Speed',        p: 98, c: '#7DF9FF' },
          { l: isRTL ? 'معدل التحويل' : 'Conversion Rate',       p: 41, c: '#C6FF00' },
        ].map((b, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{b.l}</span>
              <span style={{ color: b.c }}>{b.p}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{
                width: run ? `${b.p}%` : '0%',
                background: b.c,
                boxShadow: `0 0 8px ${b.c}60`,
                transition: `width 1.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.2}s`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function State6({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [annual, setAnnual] = useState(false)

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 pt-20 pb-4 overflow-y-auto"
      style={{ opacity: op, pointerEvents: useTransform(op, v => v > 0.1 ? 'auto' : 'none') as any }}>

      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(198,255,0,0.22)' }}>
          <span style={{ color: '#C6FF00', fontSize: 12 }}>⬡</span>
          <span className="text-[11px] font-bold tracking-widest" style={{ color: '#C6FF00' }}>
            {isRTL ? 'نشر بنية الذكاء الاصطناعي' : 'DEPLOY AI INFRASTRUCTURE'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.5rem,2.8vw,2.6rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'اختر مستوى التفعيل.' : 'Choose your activation tier.'}
        </h2>
        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="text-xs font-medium" style={{ color: !annual ? '#F5F5F5' : 'rgba(255,255,255,0.4)' }}>
            {isRTL ? 'شهري' : 'Monthly'}
          </span>
          <button onClick={() => setAnnual(a => !a)}
            className="relative w-10 h-5 rounded-full transition-colors duration-300"
            style={{ background: annual ? '#C6FF00' : 'rgba(255,255,255,0.1)' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all duration-300"
              style={{ left: annual ? 22 : 2 }} />
          </button>
          <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: annual ? '#F5F5F5' : 'rgba(255,255,255,0.4)' }}>
            {isRTL ? 'سنوي' : 'Annual'}
            {annual && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(198,255,0,0.12)', color: '#C6FF00' }}>
              {isRTL ? 'وفر 20%' : 'Save 20%'}
            </span>}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full max-w-5xl">
        {PLANS.map((plan, i) => {
          const price = annual ? plan.yr : plan.mo
          const isPop = !!plan.pop
          const inner = (
            <div className="relative rounded-2xl p-4 flex flex-col h-full"
              style={{
                background: isPop ? 'rgba(20,20,20,0.99)' : 'rgba(14,14,14,0.88)',
                border: isPop ? 'none' : '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
              }}>
              {isPop && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{ background: 'linear-gradient(135deg,#C6FF00,#7DF9FF)', color: '#050505' }}>
                    {isRTL ? 'الأكثر طلباً' : 'Most Popular'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black" style={{ color: isPop ? '#C6FF00' : '#F5F5F5' }}>
                  {isRTL ? plan.ar : plan.en}
                </h3>
                <span style={{ color: isPop ? '#C6FF00' : 'rgba(255,255,255,0.2)', fontSize: 13 }}>◈</span>
              </div>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-2xl font-black" style={{ color: isPop ? '#C6FF00' : '#F5F5F5', letterSpacing: '-0.04em' }}>
                  ${price}
                </span>
                <span className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>/{isRTL ? 'شهر' : 'mo'}</span>
              </div>
              <ul className="space-y-1.5 flex-1 mb-4">
                {plan.f.map((f, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.48)' }}>
                    <span style={{ color: '#C6FF00', fontSize: 10, marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="block text-center py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={isPop
                  ? { background: 'linear-gradient(135deg,#C6FF00,#7DF9FF)', color: '#050505' }
                  : { border: '1px solid rgba(255,255,255,0.09)', color: '#F5F5F5', background: 'rgba(255,255,255,0.02)' }
                }>
                {isRTL ? 'تفعيل الوحدة' : 'Deploy Module'}
              </Link>
            </div>
          )
          return (
            <div key={i} style={{ transform: isPop ? 'scale(1.04)' : undefined, transformOrigin: 'center' }}>
              {isPop ? <div className="animated-border rounded-2xl p-[2px] h-full">{inner}</div> : inner}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-6 mt-4">
        {[
          { icon: '🔒', ar: 'بدون بطاقة', en: 'No credit card' },
          { icon: '✓',  ar: '14 يوم مجاني', en: '14-day free' },
          { icon: '⚡', ar: 'إلغاء بأي وقت', en: 'Cancel anytime' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
            <span style={{ color: '#C6FF00' }}>{item.icon}</span>
            {isRTL ? item.ar : item.en}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function OSExperience() {
  const { isRTL } = useLang()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: scrollRef })
  const smooth = useSpring(scrollYProgress, { stiffness: 55, damping: 20 })

  const [stateIdx, setStateIdx] = useState(0)
  useEffect(() => {
    return scrollYProgress.on('change', v => {
      setStateIdx(Math.min(6, Math.floor(v * 7)))
    })
  }, [scrollYProgress])

  // All opacity transforms — declared at top level (no hooks in loops)
  const op0 = slotOpacity(smooth, 0)
  const op1 = slotOpacity(smooth, 1)
  const op2 = slotOpacity(smooth, 2)
  const op3 = slotOpacity(smooth, 3)
  const op4 = slotOpacity(smooth, 4)
  const op5 = slotOpacity(smooth, 5)
  const op6 = slotOpacity(smooth, 6)
  const ops = [op0, op1, op2, op3, op4, op5, op6]

  // Core persists but fades back for pricing
  const coreOpacity = useTransform(smooth, [0, 0.04, 0.82, 0.90], [0, 1, 1, 0])
  const coreScale   = useTransform(smooth, [0, 0.04, 3/7, 4/7, 5/7], [0.5, 1, 1.15, 1.25, 0.85])

  // Progress bar
  const barWidth = useTransform(scrollYProgress, [0,1], ['0%','100%'])

  // Label opacity
  const labelOpacity = useTransform(smooth, [0.03, 0.10], [0, 1])

  return (
    <div ref={scrollRef} style={{ height: '700vh' }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* ── Persistent AI Core (behind everything in states 1–5) ── */}
        <motion.div className="absolute z-0 pointer-events-none"
          style={{
            left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            opacity: coreOpacity,
            scale: coreScale,
          }}>
          <AICore size={130} />
        </motion.div>

        {/* ── State layers (each fully isolated) ── */}
        <State0 op={op0} isRTL={isRTL} />
        <State1 op={op1} isRTL={isRTL} />
        <State2 op={op2} isRTL={isRTL} />
        <State3 op={op3} isRTL={isRTL} />
        <State4 op={op4} isRTL={isRTL} />
        <State5 op={op5} isRTL={isRTL} />
        <State6 op={op6} isRTL={isRTL} />

        {/* ── Persistent: state indicator ── */}
        <motion.div
          className="absolute bottom-8 flex flex-col gap-1.5 z-50 pointer-events-none"
          style={{ left: 24, opacity: labelOpacity }}>
          {LABELS.map((lbl, i) => (
            <div key={i} className="flex items-center gap-2"
              style={{ opacity: stateIdx === i ? 1 : 0.2, transition: 'opacity 0.3s' }}>
              <div className="rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                  width: stateIdx === i ? 20 : 4,
                  height: 4,
                  background: stateIdx === i ? '#C6FF00' : 'rgba(255,255,255,0.18)',
                }} />
              {stateIdx === i && (
                <span className="text-[10px] font-bold whitespace-nowrap"
                  style={{ color: '#C6FF00', letterSpacing: '0.08em' }}>
                  {isRTL ? lbl.ar : lbl.en}
                </span>
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Persistent: progress bar ── */}
        <motion.div className="absolute bottom-0 left-0 h-[2px] z-50"
          style={{
            width: barWidth,
            background: 'linear-gradient(to right, #C6FF00, #7DF9FF)',
            boxShadow: '0 0 8px rgba(198,255,0,0.5)',
          }} />

      </div>
    </div>
  )
}
