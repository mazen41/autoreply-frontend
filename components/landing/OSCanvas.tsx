'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

// ─── Scroll-driven section phases ────────────────────────────────────────────
// Phase 0: 0–0.12   — THE CORE (boot)
// Phase 1: 0.12–0.28 — UNIFIED INBOX (channels connect)
// Phase 2: 0.28–0.46 — AI BRAIN (neural network)
// Phase 3: 0.46–0.63 — AUTOMATION NETWORK (workflow)
// Phase 4: 0.63–0.78 — BUSINESS IMPACT (outcomes)
// Phase 5: 0.78–1.0  — DEPLOY YOUR AI (pricing)

const CHANNELS = [
  { id: 'wa',  label: 'WhatsApp',  icon: '💬', color: 'var(--accent)', angle: -130 },
  { id: 'ig',  label: 'Instagram', icon: '📸', color: 'var(--accent)', angle: -80  },
  { id: 'em',  label: 'Email',     icon: '📧', color: 'var(--accent)', angle: 80   },
  { id: 'web', label: 'Website',   icon: '🌐', color: 'var(--accent)', angle: 130  },
]

const CAPABILITIES = [
  { id: 'lead',    labelAr: 'تأهيل العملاء',     labelEn: 'Lead Qualification', icon: '🎯', x: 15,  y: 18  },
  { id: 'support', labelAr: 'دعم العملاء',        labelEn: 'Customer Support',   icon: '💬', x: 80,  y: 12  },
  { id: 'review',  labelAr: 'استرداد التقييمات',  labelEn: 'Review Recovery',    icon: '⭐', x: 88,  y: 52  },
  { id: 'content', labelAr: 'توليد المحتوى',      labelEn: 'Content Generation', icon: '✍️', x: 72,  y: 86  },
  { id: 'sales',   labelAr: 'أتمتة المبيعات',     labelEn: 'Sales Automation',   icon: '💰', x: 22,  y: 82  },
  { id: 'inbox',   labelAr: 'الوارد الموحد',       labelEn: 'Unified Inbox',      icon: '📥', x: 8,   y: 50  },
]

const MESSAGES = [
  { from: 'Ahmed K.',  platform: 'WhatsApp',  color: 'var(--accent)', icon: '💬', msgAr: 'هل التوصيل متاح؟',          msgEn: 'Is delivery available?',    statusAr: 'تم الرد',   statusEn: 'Responded', sc: 'var(--accent)' },
  { from: 'سارة م.',   platform: 'Instagram', color: 'var(--accent)', icon: '📸', msgAr: 'ما هي ساعات العمل؟',         msgEn: 'What are the hours?',       statusAr: 'يعالج...',  statusEn: 'Processing', sc: 'var(--accent)' },
  { from: 'Nora H.',   platform: 'Email',     color: 'var(--accent)', icon: '📧', msgAr: 'أريد حجز طاولة لـ 4 أشخاص', msgEn: 'Table for 4 please',        statusAr: 'تم الرد',   statusEn: 'Responded', sc: 'var(--accent)' },
  { from: 'خالد ع.',   platform: 'Website',   color: 'var(--accent)', icon: '🌐', msgAr: 'كم سعر الباقة؟',             msgEn: 'Business plan price?',      statusAr: 'عميل ⚡',   statusEn: 'Lead ⚡',   sc: 'var(--warning)' },
  { from: 'Omar F.',   platform: 'WhatsApp',  color: 'var(--accent)', icon: '💬', msgAr: 'شكراً على الرد السريع!',     msgEn: 'Thanks for the quick reply!', statusAr: 'مغلق',    statusEn: 'Closed',    sc: 'var(--text-tertiary)' },
]

const WORKFLOW = [
  { icon: '💬', labelAr: 'رسالة واردة',   labelEn: 'Message In',       color: 'var(--accent)' },
  { icon: '🧠', labelAr: 'الذكاء يحلل',   labelEn: 'AI Analyzes',      color: 'var(--accent)' },
  { icon: '⚡', labelAr: 'إجراء تلقائي',  labelEn: 'Auto Action',      color: 'var(--accent)' },
  { icon: '🎯', labelAr: 'نتيجة محققة',   labelEn: 'Result Achieved',  color: 'var(--accent)' },
]

const IMPACT = [
  { before: '48h', after: '8s',   labelAr: 'وقت الرد',       labelEn: 'Response Time',  icon: '⚡' },
  { before: '3.1', after: '4.8',  labelAr: 'تقييم جوجل',     labelEn: 'Google Rating',  icon: '⭐' },
  { before: '12%', after: '41%',  labelAr: 'معدل التحويل',   labelEn: 'Conversion Rate',icon: '💰' },
  { before: '60%', after: '100%', labelAr: 'تغطية الردود',   labelEn: 'Reply Coverage', icon: '✅' },
]

function useCountUp(target: string, start: boolean) {
  const [val, setVal] = useState('0')
  useEffect(() => {
    if (!start) return
    const num = parseFloat(target.replace(/[^0-9.]/g, ''))
    const suffix = target.replace(/[0-9.]/g, '')
    if (isNaN(num)) { setVal(target); return }
    const dur = 1400
    const t0 = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const v = num < 10 ? (ease * num).toFixed(1) : Math.round(ease * num).toString()
      setVal(v + suffix)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [start, target])
  return val
}

// ─── THE PERSISTENT AI CORE ───────────────────────────────────────────────────
function AICore({ phase, size = 120 }: { phase: number; size?: number }) {
  const s = size
  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {/* Pulse rings */}
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: s * 0.95, height: s * 0.95,
          border: '1px solid var(--border)',
          animation: `energyPulse 2.5s ease-out ${i * 0.83}s infinite`,
        }} />
      ))}
      {/* Outer orbit */}
      <div className="absolute rounded-full core-rotate" style={{
        width: s * 0.93, height: s * 0.93,
        border: '1px solid transparent',
        borderTop: '1px solid var(--accent-focus)',
        borderRight: '1px solid var(--accent-subtle)',
      }} />
      {/* Inner orbit */}
      <div className="absolute rounded-full core-rotate-rev" style={{
        width: s * 0.72, height: s * 0.72,
        border: '1px solid transparent',
        borderBottom: '1px solid var(--accent-focus)',
        borderLeft: '1px solid var(--accent-subtle)',
      }} />
      {/* Core sphere */}
      <div className="relative core-glow" style={{
        width: s * 0.52, height: s * 0.52,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 33%, var(--accent-subtle) 0%, var(--accent-subtle) 55%, transparent 80%)',
        border: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: s * 0.18, filter: 'drop-shadow(0 0 16px var(--accent-subtle))' }}>✦</span>
      </div>
      {/* Orbit dots */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <div key={i} className="absolute" style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent)',
          top: `${50 - 46 * Math.cos((deg * Math.PI) / 180)}%`,
          left: `${50 + 46 * Math.sin((deg * Math.PI) / 180)}%`,
          transform: 'translate(-50%,-50%)',
        }} />
      ))}
    </div>
  )
}

// ─── SCREEN 01 — THE CORE ────────────────────────────────────────────────────
function ScreenCore({ visible, isRTL, phase }: { visible: boolean; isRTL: boolean; phase: number }) {
  function useCount(t: number, d = 2000) {
    const [v, setV] = useState(0)
    useEffect(() => {
      if (!visible) return
      const t0 = Date.now()
      const f = () => {
        const p = Math.min((Date.now() - t0) / d, 1)
        setV(Math.round((1 - Math.pow(1 - p, 3)) * t))
        if (p < 1) requestAnimationFrame(f)
      }
      requestAnimationFrame(f)
    }, [visible, t, d])
    return v
  }
  const c0 = useCount(247, 1800)
  const c1 = useCount(3842, 2200)
  const c2 = useCount(128, 1600)
  const c3 = useCount(8, 1000)
  const counts = [c0, c1, c2, c3]

  const metrics = [
    { labelAr: 'محادثة نشطة',    labelEn: 'Active Convos',    val: counts[0], suffix: '',  color: 'var(--accent)' },
    { labelAr: 'رد اليوم',        labelEn: 'Replies Today',    val: counts[1], suffix: '+', color: 'var(--accent)' },
    { labelAr: 'عميل محتمل',      labelEn: 'Leads Generated', val: counts[2], suffix: '',  color: 'var(--accent)' },
    { labelAr: 'وقت الرد ثانية', labelEn: 'Avg Response',    val: counts[3], suffix: 's', color: 'var(--accent)' },
  ]

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4">

      {/* System status pill */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="flex items-center gap-2.5 mb-10 px-5 py-2 rounded-full glass"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="w-2 h-2 rounded-full status-live" style={{ background: 'var(--accent)' }} />
        <span className="text-xs font-bold tracking-[0.1em]" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'نظام الذكاء الاصطناعي — مشغّل' : 'AI OPERATING SYSTEM — ONLINE'}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>v4.1.0</span>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 w-full max-w-2xl"
      >
        {metrics.map((m, i) => (
          <div key={i} className="card-os rounded-2xl p-4 text-center glass" style={{ background: 'var(--surface)' }}>
            <div className="text-2xl font-black mb-1" style={{ color: m.color, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {m.val.toLocaleString()}{m.suffix}
            </div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? m.labelAr : m.labelEn}
            </div>
            <div className="mt-2 h-px shimmer-line rounded-full" />
          </div>
        ))}
      </motion.div>

      {/* AI Core + headline */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={visible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] as any }}
          className="mb-10"
        >
          <AICore phase={phase} size={200} />
        </motion.div>

        <motion.div
          className="text-center max-w-3xl"
          initial={{ opacity: 0, y: 32 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.55 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, var(--accent-subtle), transparent)' }} />
            <span className="text-[11px] font-bold tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? 'نظام الردود الذكية' : 'INTELLIGENT REPLY SYSTEM'}
            </span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, var(--accent-subtle), transparent)' }} />
          </div>

          <h1 className="font-black leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(2.4rem,5.5vw,4.5rem)', letterSpacing: '-0.04em' }}>
            <span className="block" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'ندير مراسلاتك' : 'Manage Your Messages'}
            </span>
            <span className="block text-dual" style={{ paddingBottom: '0.05em' }}>
              {isRTL ? 'و مبيعاتك بذكاء.' : 'And Sales With AI.'}
            </span>
          </h1>

          <p className="text-lg leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isRTL
              ? 'منصة ذكاء اصطناعي تتولى الردود، تبني العلاقات، وتحول الرسائل إلى عملاء — تلقائياً.'
              : 'An AI that handles replies, builds relationships, and converts messages into customers — automatically.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-lime px-8 py-3.5 rounded-xl font-bold text-base"
              style={{ letterSpacing: '-0.01em', minWidth: 200, textAlign: 'center' }}>
              {isRTL ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
            </Link>
            <button className="btn-ghost px-7 py-3.5 rounded-xl font-semibold text-base flex items-center gap-2 justify-center" style={{ minWidth: 180 }}>
              <span style={{ fontSize: 11 }}>▶</span>
              {isRTL ? 'شاهد النظام' : 'Watch System'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }} animate={visible ? { opacity: 1 } : {}} transition={{ delay: 1.4 }}>
        <span className="text-[10px] tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
          {isRTL ? 'مرر للاكتشاف' : 'SCROLL TO EXPLORE'}
        </span>
        <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, var(--accent-subtle), transparent)' }} />
      </motion.div>
    </div>
  )
}

// ─── SCREEN 02 — UNIFIED INBOX ────────────────────────────────────────────────
function ScreenInbox({ visible, isRTL }: { visible: boolean; isRTL: boolean }) {
  const [activeMsg, setActiveMsg] = useState(0)
  useEffect(() => {
    if (!visible) return
    const iv = setInterval(() => setActiveMsg(p => (p + 1) % MESSAGES.length), 2000)
    return () => clearInterval(iv)
  }, [visible])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4">
      {/* Section label */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={visible ? { opacity: 1, y: 0 } : {}}
        className="flex items-center gap-2.5 mb-12 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid var(--border)' }}>
        <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'بث مباشر — الصندوق الموحد' : 'LIVE — UNIFIED INBOX'}
        </span>
      </motion.div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">

        {/* Left — channels + core visual */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={visible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative flex items-center justify-center" style={{ height: 380 }}>

          {/* Center core */}
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <AICore phase={2} size={100} />
          </div>

          {/* Channel satellites */}
          {CHANNELS.map((ch, i) => {
            const rad = 150
            const angle = (ch.angle * Math.PI) / 180
            const cx = 50 + (rad / 190) * 100 * Math.sin(angle)
            const cy = 50 - (rad / 190) * 100 * Math.cos(angle)
            return (
              <motion.div key={ch.id}
                className="absolute"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%,-50%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={visible ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] as any }}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: `${ch.color}14`, border: `2px solid ${ch.color}35`, boxShadow: `0 0 20px ${ch.color}20` }}>
                    {ch.icon}
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: ch.color }}>{ch.label}</span>
                </div>
              </motion.div>
            )
          })}

          {/* Animated connection lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 190 380" preserveAspectRatio="xMidYMid meet">
            {CHANNELS.map((ch, i) => {
              const rad = 150
              const angle = (ch.angle * Math.PI) / 180
              const x2 = 95 + rad * Math.sin(angle)
              const y2 = 190 - rad * Math.cos(angle)
              return (
                <g key={ch.id}>
                  <line x1="95" y1="190" x2={x2} y2={y2}
                    stroke={ch.color} strokeWidth="0.8" strokeOpacity="0.25"
                    style={{ transition: 'stroke-opacity 0.4s' }}
                    strokeDasharray="4 4"
                  />
                  {visible && (
                    <circle r="3" fill={ch.color}
                      style={{ filter: `drop-shadow(0 0 4px ${ch.color})` }}
                    >
                      <animateMotion dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`}>
                        <mpath href={`#path-${ch.id}`} />
                      </animateMotion>
                    </circle>
                  )}
                  <path id={`path-${ch.id}`}
                    d={`M${x2},${y2} L95,190`}
                    fill="none" />
                </g>
              )
            })}
          </svg>
        </motion.div>

        {/* Right — live feed */}
        <div>
          <motion.h2 className="font-black mb-2" initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            {isRTL ? 'رسائل تتحول إلى نتائج.' : 'Messages become outcomes.'}
          </motion.h2>
          <motion.p className="text-base mb-8" initial={{ opacity: 0 }} animate={visible ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }} style={{ color: 'var(--text-tertiary)' }}>
            {isRTL
              ? 'كل قناة تتدفق في نظام واحد. الذكاء الاصطناعي يرد، يصنّف، ويتابع.'
              : 'Every channel flows into one system. AI replies, classifies, and follows up.'}
          </motion.p>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {MESSAGES.slice(0, 4).map((msg, i) => (
                <motion.div key={msg.from}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl glass card-os"
                  style={{ background: 'var(--surface)', opacity: visible ? 1 : 0 }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${msg.color}14`, border: `1px solid ${msg.color}28` }}>
                    {msg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{msg.from}</span>
                      <span className="text-[11px]" style={{ color: msg.color }}>{msg.platform}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {isRTL ? msg.msgAr : msg.msgEn}
                    </p>
                  </div>
                  {activeMsg === i && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)',
                          animation: `typingDot 1.2s ease ${j * 0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                  <div className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                    style={{ background: `${msg.sc}14`, color: msg.sc }}>
                    {isRTL ? msg.statusAr : msg.statusEn}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN 03 — AI BRAIN ────────────────────────────────────────────────────
function ScreenBrain({ visible, isRTL }: { visible: boolean; isRTL: boolean }) {
  const [active, setActive] = useState<Set<string>>(new Set())
  const [pulse, setPulse] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    CAPABILITIES.forEach((c, i) => {
      setTimeout(() => setActive(p => new Set([...p, c.id])), 180 + i * 220)
    })
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const ids = CAPABILITIES.map(c => c.id)
    const iv = setInterval(() => {
      const pick = ids[Math.floor(Math.random() * ids.length)]
      setPulse(pick)
      setTimeout(() => setPulse(null), 700)
    }, 1600)
    return () => clearInterval(iv)
  }, [visible])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={visible ? { opacity: 1, y: 0 } : {}}
        className="flex items-center gap-2.5 mb-12 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>⬡</span>
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'شبكة الذكاء العصبي' : 'NEURAL CAPABILITY NETWORK'}
        </span>
      </motion.div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Neural map */}
        <motion.div initial={{ opacity: 0 }} animate={visible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="relative" style={{ height: 440 }}>

          {/* SVG connections */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.05" />
                <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {CAPABILITIES.map((a, ai) =>
              CAPABILITIES.slice(ai + 1).map((b, bi) => {
                const isActive = active.has(a.id) && active.has(b.id)
                const isHot = pulse === a.id || pulse === b.id
                return (
                  <line key={`${a.id}-${b.id}-${bi}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isHot ? 'var(--accent)' : 'url(#ng)'}
                    strokeWidth={isHot ? 0.4 : 0.2}
                    strokeOpacity={isActive ? (isHot ? 0.9 : 0.35) : 0}
                    style={{ transition: 'stroke-opacity 0.4s, stroke-width 0.3s' }}
                  />
                )
              })
            )}
            {/* Core connections */}
            {CAPABILITIES.map(c => {
              const isHot = pulse === c.id
              return (
                <line key={`core-${c.id}`}
                  x1="50" y1="50" x2={c.x} y2={c.y}
                  stroke={isHot ? 'var(--accent)' : 'var(--accent)'}
                  strokeWidth={isHot ? 0.5 : 0.15}
                  strokeOpacity={active.has(c.id) ? (isHot ? 0.8 : 0.2) : 0}
                  strokeDasharray="2 3"
                  style={{ transition: 'stroke-opacity 0.5s' }}
                />
              )
            })}
          </svg>

          {/* Capability nodes */}
          {CAPABILITIES.map(cap => {
            const isOn = active.has(cap.id)
            const isHot = pulse === cap.id
            return (
              <motion.div key={cap.id}
                className="absolute"
                style={{ left: `${cap.x}%`, top: `${cap.y}%`, transform: 'translate(-50%,-50%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={isOn ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as any }}
              >
                <div className="flex flex-col items-center gap-1.5 cursor-default"
                  onMouseEnter={() => setPulse(cap.id)}
                  onMouseLeave={() => setPulse(null)}>
                  {isHot && (
                    <motion.div className="absolute rounded-full"
                      style={{ width: 52, height: 52, border: '2px solid var(--accent-subtle)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                      initial={{ scale: 0.85, opacity: 0.8 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 0.7, repeat: Infinity }} />
                  )}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all duration-250"
                    style={{
                      background: isHot ? 'var(--accent-subtle)' : 'var(--surface)',
                      border: `2px solid ${isHot ? 'var(--accent-subtle)' : 'var(--border)'}`,
                      boxShadow: isHot ? '0 0 28px var(--accent-subtle)' : 'none',
                      backdropFilter: 'blur(8px)',
                    }}>
                    {cap.icon}
                  </div>
                  <div className="text-[10px] font-bold text-center whitespace-nowrap px-1.5 py-0.5 rounded-lg"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                      color: isHot ? 'var(--accent)' : 'var(--text-secondary)', backdropFilter: 'blur(6px)', maxWidth: 110 }}>
                    {isRTL ? cap.labelAr : cap.labelEn}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Center core */}
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={visible ? { scale: 1, opacity: 1 } : {}} transition={{ duration: 0.9 }}>
              <AICore phase={3} size={88} />
            </motion.div>
          </div>
        </motion.div>

        {/* Right copy */}
        <div>
          <motion.h2 className="font-black mb-3" initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
            {isRTL ? 'عقل متصل بكل شيء.' : 'A brain connected to everything.'}
          </motion.h2>
          <motion.p className="text-base mb-8" initial={{ opacity: 0 }} animate={visible ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }} style={{ color: 'var(--text-tertiary)' }}>
            {isRTL
              ? 'كل قدرة تتفعّل أثناء التمرير. مرّر فوق أي عقدة لاكتشافها.'
              : 'Every capability activates as you scroll. Hover a node to explore it.'}
          </motion.p>
          <div className="grid grid-cols-2 gap-3">
            {CAPABILITIES.map((cap, i) => (
              <motion.div key={cap.id}
                initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.08 }}
                onMouseEnter={() => setPulse(cap.id)}
                onMouseLeave={() => setPulse(null)}
                className="flex items-center gap-2.5 p-3 rounded-xl card-os glass cursor-default transition-all duration-200"
                style={{ background: pulse === cap.id ? 'var(--accent-subtle)' : 'var(--surface)' }}>
                <span className="text-xl">{cap.icon}</span>
                <span className="text-xs font-semibold" style={{ color: pulse === cap.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {isRTL ? cap.labelAr : cap.labelEn}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN 04 — AUTOMATION NETWORK ──────────────────────────────────────────
function ScreenAutomation({ visible, isRTL }: { visible: boolean; isRTL: boolean }) {
  const [activeStep, setActiveStep] = useState(0)
  useEffect(() => {
    if (!visible) return
    const iv = setInterval(() => setActiveStep(s => (s + 1) % WORKFLOW.length), 1200)
    return () => clearInterval(iv)
  }, [visible])

  const automations = [
    { icon: '🌙', titleAr: 'الرد بعد الدوام', titleEn: 'After-Hours Reply',
      descAr: 'يرد على كل رسالة خارج ساعات العمل فوراً', descEn: 'Instantly replies outside business hours',
      triggerAr: 'بعد الساعة 9م', triggerEn: 'After 9PM', resultAr: '100% ردود', resultEn: '100% coverage' },
    { icon: '⭐', titleAr: 'استرداد التقييمات', titleEn: 'Review Recovery',
      descAr: 'يكتشف عدم الرضا ويتواصل قبل التقييم السلبي', descEn: 'Detects dissatisfaction before a bad review',
      triggerAr: 'إشارات سلبية', triggerEn: 'Negative signals', resultAr: '−60% تقييمات سلبية', resultEn: '−60% bad reviews' },
    { icon: '💰', titleAr: 'أتمتة المبيعات', titleEn: 'Sales Automation',
      descAr: 'يحول الاستفسارات إلى مبيعات بمسار منظم', descEn: 'Converts inquiries into sales with a structured funnel',
      triggerAr: 'سؤال عن سعر', triggerEn: 'Price inquiry', resultAr: '+35% معدل تحويل', resultEn: '+35% conversion' },
  ]

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={visible ? { opacity: 1, y: 0 } : {}}
        className="flex items-center gap-2.5 mb-12 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>◈</span>
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'شبكة الأتمتة' : 'AUTOMATION NETWORK'}
        </span>
      </motion.div>

      <motion.h2 className="font-black text-center mb-3" initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
        style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
        {isRTL ? 'الرسالة تصل. الذكاء يعمل.' : 'Message in. Magic out.'}
      </motion.h2>
      <motion.p className="text-base text-center mb-14 max-w-lg" initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
        style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'مسارات تلقائية تعمل في الخلفية بدون تدخل.' : 'Automated workflows running silently — without you.'}
      </motion.p>

      {/* Flow steps */}
      <div className="w-full max-w-3xl mb-14">
        <div className="flex items-center justify-between gap-2">
          {WORKFLOW.map((step, i) => (
            <React.Fragment key={i}>
              <motion.div className="flex-1 flex flex-col items-center gap-2.5"
                initial={{ opacity: 0, y: 30 }} animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 + i * 0.12 }}>
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-400"
                  style={{
                    background: activeStep === i ? 'var(--accent-subtle)' : 'var(--surface)',
                    border: `2px solid ${activeStep === i ? 'var(--accent)' : 'var(--border)'}`,
                    boxShadow: activeStep === i ? '0 0 40px var(--accent-subtle)' : 'none',
                  }}>
                  {step.icon}
                  {activeStep === i && (
                    <motion.div className="absolute inset-0 rounded-2xl"
                      style={{ border: `1px solid ${step.color}` }}
                      initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.35, opacity: 0 }}
                      transition={{ duration: 0.7, repeat: Infinity }} />
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-center transition-colors duration-300"
                  style={{ color: activeStep === i ? step.color : 'var(--text-secondary)' }}>
                  {isRTL ? step.labelAr : step.labelEn}
                </div>
              </motion.div>

              {i < WORKFLOW.length - 1 && (
                <div className="flex-shrink-0" style={{ width: 36 }}>
                  <div className="relative h-0.5 rounded-full" style={{ background: 'var(--divider)' }}>
                    <motion.div className="absolute top-0 h-full rounded-full"
                      style={{ width: '35%', background: WORKFLOW[i].color, boxShadow: `0 0 6px ${WORKFLOW[i].color}` }}
                      animate={visible ? { left: ['-35%', '135%'], opacity: [0, 1, 1, 0] } : {}}
                      transition={{ duration: 1.2, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }} />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Automation cards */}
      <div className="w-full max-w-4xl grid md:grid-cols-3 gap-4">
        {automations.map((a, i) => (
          <motion.div key={i} className="card-os rounded-2xl p-5 glass"
            initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35 + i * 0.12 }}
            style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)' }}>
                {a.icon}
              </div>
              <div className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                {isRTL ? a.triggerAr : a.triggerEn}
              </div>
            </div>
            <h3 className="text-sm font-black mb-1.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {isRTL ? a.titleAr : a.titleEn}
            </h3>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? a.descAr : a.descEn}
            </p>
            <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
              <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>
              <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                {isRTL ? a.resultAr : a.resultEn}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── SCREEN 05 — BUSINESS IMPACT ─────────────────────────────────────────────
function ImpactStat({ item, visible, isRTL }: { item: typeof IMPACT[0]; visible: boolean; isRTL: boolean }) {
  const afterVal = useCountUp(item.after, visible)
  return (
    <motion.div className="card-os rounded-2xl p-5 glass text-center"
      initial={{ opacity: 0, y: 30 }} animate={visible ? { opacity: 1, y: 0 } : {}}
      style={{ background: 'var(--surface)' }}>
      <div className="text-2xl mb-3">{item.icon}</div>
      <div className="text-xs mb-3 font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'قبل' : 'Before'} → <span style={{ color: 'var(--accent)' }}>{item.before}</span>
      </div>
      <div className="text-3xl font-black mb-1 text-lime" style={{ letterSpacing: '-0.04em' }}>
        {afterVal}
      </div>
      <div className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? item.labelAr : item.labelEn}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <span style={{ color: 'var(--accent)', fontSize: 11 }}>▲</span>
        <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{isRTL ? 'تحسن' : 'Improved'}</span>
      </div>
    </motion.div>
  )
}

function ScreenImpact({ visible, isRTL }: { visible: boolean; isRTL: boolean }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={visible ? { opacity: 1, y: 0 } : {}}
        className="flex items-center gap-2.5 mb-12 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>◉</span>
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'التأثير على الأعمال' : 'BUSINESS IMPACT'}
        </span>
      </motion.div>

      <motion.h2 className="font-black text-center mb-3" initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
        style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
        {isRTL ? 'الأعمال تتحول أمام عينيك.' : 'Watch your business transform.'}
      </motion.h2>
      <motion.p className="text-base text-center mb-14 max-w-lg" initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
        style={{ color: 'var(--text-tertiary)' }}>
        {isRTL
          ? 'أرقام حقيقية من عملاء حقيقيين. التحسين يبدأ من أول أسبوع.'
          : 'Real numbers from real customers. Improvement starts week one.'}
      </motion.p>

      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {IMPACT.map((item, i) => (
          <ImpactStat key={i} item={item} visible={visible} isRTL={isRTL} />
        ))}
      </div>

      {/* Visual transformation bar */}
      <motion.div className="w-full max-w-2xl glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 30 }} animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }} style={{ background: 'var(--surface)' }}>
        <div className="text-center text-sm font-bold mb-5" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'متوسط النتائج بعد 30 يوم' : 'Average results after 30 days'}
        </div>
        {[
          { labelAr: 'رضا العملاء', labelEn: 'Customer Satisfaction', pct: 94, color: 'var(--accent)' },
          { labelAr: 'سرعة الرد',   labelEn: 'Response Speed',        pct: 98, color: 'var(--accent)' },
          { labelAr: 'معدل التحويل', labelEn: 'Conversion Rate',      pct: 41, color: 'var(--accent)' },
        ].map((bar, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-secondary)' }}>{isRTL ? bar.labelAr : bar.labelEn}</span>
              <span style={{ color: bar.color }}>{bar.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: bar.color, boxShadow: `0 0 8px ${bar.color}60` }}
                initial={{ width: 0 }}
                animate={visible ? { width: `${bar.pct}%` } : {}}
                transition={{ duration: 1.4, delay: 0.6 + i * 0.2, ease: [0.22, 1, 0.36, 1] as any }} />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── SCREEN 06 — DEPLOY YOUR AI (PRICING) ────────────────────────────────────
function ScreenDeploy({ visible, isRTL }: { visible: boolean; isRTL: boolean }) {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      nameAr: 'تجريبي', nameEn: 'Starter',
      descAr: 'للأعمال الناشئة', descEn: 'For new businesses',
      price: 0, priceAnnual: 0,
      features: isRTL
        ? ['50 رد/شهر', 'قناة واحدة', 'لوحة تحكم أساسية']
        : ['50 replies/mo', '1 channel', 'Basic dashboard'],
    },
    {
      nameAr: 'أساسي', nameEn: 'Basic',
      descAr: 'للأعمال المتنامية', descEn: 'For growing businesses',
      price: 49, priceAnnual: 39,
      features: isRTL
        ? ['500 رد/شهر', 'قناتان', 'تقارير أسبوعية', 'دعم بريد']
        : ['500 replies/mo', '2 channels', 'Weekly reports', 'Email support'],
    },
    {
      nameAr: 'أعمال', nameEn: 'Business',
      descAr: 'للأعمال المتقدمة', descEn: 'For advanced businesses',
      price: 99, priceAnnual: 79, popular: true,
      features: isRTL
        ? ['ردود غير محدودة', 'كل القنوات', 'ذكاء اصطناعي متقدم', 'تقارير يومية', 'دعم 24/7']
        : ['Unlimited replies', 'All channels', 'Advanced AI', 'Daily reports', '24/7 support'],
    },
    {
      nameAr: 'مؤسسات', nameEn: 'Enterprise',
      descAr: 'للمؤسسات الكبيرة', descEn: 'For large enterprises',
      price: 249, priceAnnual: 199,
      features: isRTL
        ? ['كل شيء في أعمال', 'خادم مخصص', 'SLA مضمون', 'مدير حساب', 'API كامل']
        : ['Everything in Business', 'Dedicated server', 'Guaranteed SLA', 'Account manager', 'Full API'],
    },
  ]

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-24 px-4">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={visible ? { opacity: 1, y: 0 } : {}}
        className="flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 13 }}>⬡</span>
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'نشر بنية الذكاء الاصطناعي' : 'DEPLOY AI INFRASTRUCTURE'}
        </span>
      </motion.div>

      <motion.h2 className="font-black text-center mb-2" initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
        style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
        {isRTL ? 'اختر مستوى التفعيل.' : 'Choose your activation tier.'}
      </motion.h2>
      <motion.p className="text-base text-center mb-8" initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
        style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'كل خطة وحدة ذكاء مستقلة — جاهزة للنشر فوراً.' : 'Each plan is a standalone AI module — ready to deploy instantly.'}
      </motion.p>

      {/* Toggle */}
      <motion.div className="flex items-center gap-4 mb-10" initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}} transition={{ delay: 0.25 }}>
        <span className="text-sm font-medium" style={{ color: !annual ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
          {isRTL ? 'شهري' : 'Monthly'}
        </span>
        <button onClick={() => setAnnual(!annual)}
          className="relative w-11 h-6 rounded-full transition-colors duration-300"
          style={{ background: annual ? 'var(--accent)' : 'var(--surface-elevated)' }}>
          <span className="absolute top-1 w-4 h-4 rounded-full bg-black transition-all duration-300"
            style={{ [isRTL ? 'right' : 'left']: annual ? 24 : 4 }} />
        </button>
        <span className="text-sm font-medium flex items-center gap-2" style={{ color: annual ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
          {isRTL ? 'سنوي' : 'Annual'}
          {annual && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            {isRTL ? 'وفر 20%' : 'Save 20%'}
          </span>}
        </span>
      </motion.div>

      {/* Plan cards */}
      <div className="w-full max-w-5xl grid sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {plans.map((plan, i) => {
          const price = annual ? plan.priceAnnual : plan.price
          const isPopular = !!plan.popular
          const inner = (
            <div className={`relative rounded-2xl p-5 flex flex-col h-full ${isPopular ? '' : 'card-os'}`}
              style={{
                background: isPopular ? 'var(--surface-elevated)' : 'var(--surface)',
                border: isPopular ? 'none' : '1px solid var(--border)',
                backdropFilter: 'blur(20px)',
              }}>
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="text-xs font-bold px-4 py-1.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent))', color: 'var(--text-primary)' }}>
                    {isRTL ? 'الأكثر طلباً' : 'Most Popular'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-tertiary)' }}>MODULE</div>
                  <h3 className="text-base font-black" style={{ color: isPopular ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {isRTL ? plan.nameAr : plan.nameEn}
                  </h3>
                </div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: isPopular ? 'var(--accent-subtle)' : 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
                  <span style={{ color: isPopular ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 12 }}>◈</span>
                </div>
              </div>
              <p className="text-[11px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? plan.descAr : plan.descEn}
              </p>
              <div className="mb-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black" style={{ color: isPopular ? 'var(--accent)' : 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                    ${price}
                  </span>
                  <span className="text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>/{isRTL ? 'شهر' : 'mo'}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent)', fontSize: 11, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={isPopular
                  ? { background: 'linear-gradient(135deg,var(--accent),var(--accent))', color: 'var(--text-primary)' }
                  : { border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface-elevated)' }
                }>
                {isRTL ? 'تفعيل الوحدة' : 'Deploy Module'}
              </Link>
            </div>
          )
          return (
            <motion.div key={i} className="relative"
              initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              style={{ transform: isPopular ? 'scale(1.04)' : undefined }}>
              {isPopular ? <div className="animated-border rounded-2xl p-[2px]">{inner}</div> : inner}
            </motion.div>
          )
        })}
      </div>

      {/* Bottom trust */}
      <motion.div className="flex items-center gap-6 mt-10" initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}} transition={{ delay: 0.7 }}>
        {[
          { icon: '🔒', ar: 'بدون بطاقة ائتمان', en: 'No credit card' },
          { icon: '✓',  ar: '14 يوم مجاني',      en: '14-day free trial' },
          { icon: '⚡', ar: 'إلغاء في أي وقت',   en: 'Cancel anytime' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
            <span>{isRTL ? item.ar : item.en}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── SECTION DIVIDER with flowing connection ─────────────────────────────────
function FlowDivider({ phase }: { phase: number }) {
  return (
    <div className="relative flex items-center justify-center py-4 overflow-hidden">
      <div className="absolute left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--accent-subtle), var(--accent-subtle), transparent)' }} />
      <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center glass"
        style={{ border: '1px solid var(--border)', boxShadow: '0 0 20px var(--accent-subtle)' }}>
        <span style={{ color: 'var(--accent)', fontSize: 12 }}>✦</span>
      </div>
      {/* Phase label */}
      <div className="absolute right-8 text-[10px] font-bold tracking-[0.15em]" style={{ color: 'var(--text-tertiary)' }}>
        0{phase + 1}
      </div>
    </div>
  )
}

// ─── MAIN CANVAS ─────────────────────────────────────────────────────────────
export default function OSCanvas() {
  const { isRTL } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })

  // Which screen is "active" based on scroll
  const [phase, setPhase] = useState(0)
  const [screenVisible, setScreenVisible] = useState([true, false, false, false, false, false])

  useEffect(() => {
    const THRESHOLDS = [0, 0.14, 0.30, 0.48, 0.64, 0.80]
    const unsub = scrollYProgress.on('change', v => {
      for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
        if (v >= THRESHOLDS[i]) { setPhase(i); break }
      }
      // Reveal screens as they come into view
      setScreenVisible(prev => {
        const next = [...prev]
        THRESHOLDS.forEach((t, i) => { if (v >= t - 0.05) next[i] = true })
        return next
      })
    })
    return () => unsub()
  }, [scrollYProgress])

  return (
    <div ref={containerRef} className="relative">
      {/* ── Screen 01 ── */}
      <ScreenCore visible={screenVisible[0]} isRTL={isRTL} phase={phase} />
      <FlowDivider phase={0} />

      {/* ── Screen 02 ── */}
      <ScreenInbox visible={screenVisible[1]} isRTL={isRTL} />
      <FlowDivider phase={1} />

      {/* ── Screen 03 ── */}
      <ScreenBrain visible={screenVisible[2]} isRTL={isRTL} />
      <FlowDivider phase={2} />

      {/* ── Screen 04 ── */}
      <ScreenAutomation visible={screenVisible[3]} isRTL={isRTL} />
      <FlowDivider phase={3} />

      {/* ── Screen 05 ── */}
      <ScreenImpact visible={screenVisible[4]} isRTL={isRTL} />
      <FlowDivider phase={4} />

      {/* ── Screen 06 ── */}
      <ScreenDeploy visible={screenVisible[5]} isRTL={isRTL} />
    </div>
  )
}
