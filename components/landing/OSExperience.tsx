'use client'

import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  motion, useScroll, useTransform, useSpring, AnimatePresence, MotionValue,
} from 'framer-motion'
import { useLang } from '../../lib/LangContext'

// ─── SVG ICON SET ─────────────────────────────────────────────────────────────
const IC = {
  WhatsApp: ({ c = '#25D366', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.657 1.435 5.163L2 22l4.926-1.41A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8.5 9.5c.5 1 1.5 2.5 3 3.5s2.5 1.5 3 1l.5-.5c.3-.3.3-.7 0-1l-1-1c-.3-.3-.7-.3-1 0l-.3.3c-.7-.4-1.3-1-1.7-1.7l.3-.3c.3-.3.3-.7 0-1l-1-1c-.3-.3-.7-.3-1 0L8.5 8c-.5.5 0 1.5 0 1.5z" fill={c}/>
    </svg>
  ),
  Instagram: ({ c = '#E1306C', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill={c} stroke="none"/>
    </svg>
  ),
  Facebook: ({ c = '#1877F2', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  ),
  Mail: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  ),
  Globe: ({ c = '#3B82F6', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  Zap: ({ c = '#3B82F6', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Star: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Target: ({ c = '#3B82F6', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill={c} stroke="none"/>
    </svg>
  ),
  MessageSquare: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  Users: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  PenTool: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
    </svg>
  ),
  DollarSign: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  Inbox: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
    </svg>
  ),
  Moon: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  TrendingUp: ({ c = '#10B981', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  CheckCircle: ({ c = '#10B981', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: ({ c = '#A0A0A0', s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Shield: ({ c = '#10B981', s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Sparkle: ({ c = '#3B82F6', s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  ),
}

// ─── SCROLL SLOTS ─────────────────────────────────────────────────────────────
const S = 1 / 7
function slot(i: number): [number, number, number, number] {
  const start = i * S, end = (i + 1) * S, fade = S * 0.38
  return [start, start + fade, end - fade, end]
}
function slotOpacity(p: MotionValue<number>, i: number): MotionValue<number> {
  const [a, b, c, d] = slot(i)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0])
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'wa',  label: 'WhatsApp',  Icon: IC.WhatsApp,  color: '#25D366', angle: -130, dist: 155 },
  { id: 'ig',  label: 'Instagram', Icon: IC.Instagram, color: '#E1306C', angle: -60,  dist: 150 },
  { id: 'em',  label: 'Gmail',     Icon: IC.Mail,      color: '#7DF9FF', angle:  60,  dist: 150 },
  { id: 'web', label: 'Website',   Icon: IC.Globe,     color: '#C6FF00', angle:  130, dist: 155 },
  { id: 'fb',  label: 'Facebook',  Icon: IC.Facebook,  color: '#1877F2', angle:  180, dist: 148 },
]

const CAPS = [
  { id: 'lead',    ar: 'تأهيل العملاء',    en: 'Lead Qualification', Icon: IC.Target,       angle: -115, dist: 210 },
  { id: 'support', ar: 'دعم العملاء',       en: 'Customer Support',   Icon: IC.MessageSquare,angle:  -45, dist: 220 },
  { id: 'review',  ar: 'استرداد التقييمات', en: 'Review Recovery',    Icon: IC.Star,         angle:   30, dist: 215 },
  { id: 'content', ar: 'توليد المحتوى',     en: 'Content Creation',   Icon: IC.PenTool,      angle:  105, dist: 210 },
  { id: 'sales',   ar: 'أتمتة المبيعات',    en: 'Sales Automation',   Icon: IC.DollarSign,   angle:  170, dist: 218 },
  { id: 'inbox',   ar: 'الوارد الموحد',      en: 'Unified Inbox',      Icon: IC.Inbox,        angle: -168, dist: 208 },
]

const MSGS = [
  { from: 'Ahmed K.', Icon: IC.WhatsApp, color: '#25D366', ar: 'هل التوصيل متاح؟',      en: 'Is delivery available?',  status: 'Replied',    sc: '#C6FF00' },
  { from: 'سارة م.',  Icon: IC.Instagram,color: '#E1306C', ar: 'ما هي ساعات العمل؟',    en: 'What are your hours?',    status: 'Processing', sc: '#7DF9FF' },
  { from: 'Nora H.',  Icon: IC.Mail,     color: '#7DF9FF', ar: 'أريد حجز طاولة لـ 4',   en: 'Table for 4 please',      status: 'Replied',    sc: '#C6FF00' },
  { from: 'خالد ع.',  Icon: IC.Globe,    color: '#C6FF00', ar: 'كم سعر الباقة؟',         en: 'Business plan price?',    status: 'Lead ⚡',   sc: '#FFB800' },
  { from: 'Omar F.',  Icon: IC.WhatsApp, color: '#25D366', ar: 'شكراً على الرد السريع!', en: 'Thanks for quick reply!', status: 'Closed',    sc: 'rgba(255,255,255,0.35)' },
]

const OUTCOMES = [
  { before: '48h',  after: '8s',   Icon: IC.Clock,      ar: 'وقت الرد',     en: 'Response Time'   },
  { before: '3.1★', after: '4.8★', Icon: IC.Star,       ar: 'تقييم جوجل',   en: 'Google Rating'   },
  { before: '12%',  after: '41%',  Icon: IC.TrendingUp, ar: 'معدل التحويل', en: 'Conversion Rate' },
  { before: '60%',  after: '100%', Icon: IC.CheckCircle,ar: 'تغطية الردود', en: 'Reply Coverage'  },
]

const PLANS = [
  { ar: 'تجريبي',  en: 'Starter',    mo: 0,   yr: 0,   f: ['50 replies/mo', '1 channel', 'Basic AI'] },
  { ar: 'أساسي',   en: 'Basic',      mo: 49,  yr: 39,  f: ['500 replies/mo', '2 channels', 'Reports'] },
  { ar: 'أعمال',   en: 'Business',   mo: 99,  yr: 79,  pop: true, f: ['Unlimited replies', 'All channels', 'Advanced AI', '24/7 support'] },
  { ar: 'مؤسسات',  en: 'Enterprise', mo: 249, yr: 199, f: ['Everything', 'Dedicated server', 'SLA', 'Full API'] },
]

const LABELS = [
  { ar: 'تمهيد النظام',     en: 'System Boot'         },
  { ar: 'القنوات تتصل',     en: 'Channels Connecting' },
  { ar: 'الرسائل تتدفق',    en: 'Messages Flow In'    },
  { ar: 'عقل الذكاء يتشكل', en: 'AI Brain Forming'    },
  { ar: 'الأتمتة تنشط',     en: 'Automations Active'  },
  { ar: 'النتائج تتحقق',    en: 'Outcomes Generated'  },
  { ar: 'النشر جاهز',       en: 'Ready to Deploy'     },
]

interface RealPackage {
  id: number; name: string; name_ar: string; price_monthly: number
  price_yearly: number; features: string[]; features_ar: string[]; is_popular: boolean
}

function polar(deg: number, dist: number) {
  const r = (deg * Math.PI) / 180
  return { x: Math.sin(r) * dist, y: -Math.cos(r) * dist }
}

function useCountUp(target: string, run: boolean) {
  const [val, setVal] = useState('0')
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
          border: '1px solid rgba(198,255,0,0.22)',
          animation: `energyPulse 2.6s ease-out ${i * 0.87}s infinite`,
        }} />
      ))}
      <div className="absolute rounded-full core-rotate" style={{
        width: s * 0.88, height: s * 0.88,
        border: '1px solid transparent',
        borderTop: '1px solid rgba(198,255,0,0.5)',
        borderRight: '1px solid rgba(198,255,0,0.12)',
      }} />
      <div className="absolute rounded-full core-rotate-rev" style={{
        width: s * 0.68, height: s * 0.68,
        border: '1px solid transparent',
        borderBottom: '1px solid rgba(125,249,255,0.5)',
        borderLeft: '1px solid rgba(125,249,255,0.12)',
      }} />
      <div className="relative core-glow flex items-center justify-center" style={{
        width: s * 0.5, height: s * 0.5, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 33%, rgba(198,255,0,0.18) 0%, rgba(198,255,0,0.03) 55%, transparent 80%)',
        border: '1.5px solid rgba(198,255,0,0.45)',
      }}>
        <svg width={s * 0.18} height={s * 0.18} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
            fill="#C6FF00" style={{ filter: 'drop-shadow(0 0 8px rgba(198,255,0,0.9))' }}/>
        </svg>
      </div>
      {[0,72,144,216,288].map((deg, i) => {
        const top = 50 - 43 * Math.cos((deg * Math.PI) / 180)
        const left = 50 + 43 * Math.sin((deg * Math.PI) / 180)
        return (
          <div key={i} className="absolute" style={{
            width: 4, height: 4, borderRadius: '50%',
            background: i % 2 === 0 ? '#C6FF00' : '#7DF9FF',
            boxShadow: `0 0 6px ${i % 2 === 0 ? '#C6FF00' : '#7DF9FF'}`,
            top: `${top.toFixed(2)}%`, left: `${left.toFixed(2)}%`,
            transform: 'translate(-50%,-50%)',
          }} />
        )
      })}
    </div>
  )
}

// ─── STATE 0 — Hero (visible immediately on load) ─────────────────────────────
function State0({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }),
  }
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: useTransform(op, v => v > 0.05 ? 'auto' : 'none') as any }}>

      <motion.div custom={0} initial="hidden" animate="visible" variants={variants}
        className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid rgba(198,255,0,0.2)' }}>
        <div className="w-2 h-2 rounded-full status-live" style={{ background: '#C6FF00' }} />
        <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
          {isRTL ? 'نظام الذكاء الاصطناعي — مشغّل' : 'AI OPERATING SYSTEM — ONLINE'}
        </span>
      </motion.div>

      <motion.div custom={1} initial="hidden" animate="visible" variants={variants} className="mb-10">
        <AICore size={160} />
      </motion.div>

      <motion.div custom={2} initial="hidden" animate="visible" variants={variants}
        className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {[
          { v: '247',   l: isRTL ? 'محادثة نشطة' : 'Active Convos', c: '#C6FF00' },
          { v: '3,842', l: isRTL ? 'رد اليوم'    : 'Replies Today', c: '#7DF9FF' },
          { v: '128',   l: isRTL ? 'عميل محتمل'  : 'Leads Today',   c: '#C6FF00' },
          { v: '8s',    l: isRTL ? 'وقت الرد'    : 'Avg Response',  c: '#7DF9FF' },
        ].map((m, i) => (
          <div key={i} className="glass rounded-xl px-4 py-2.5 text-center"
            style={{ border: '1px solid rgba(255,255,255,0.06)', minWidth: 80 }}>
            <div className="text-xl font-black" style={{ color: m.c, letterSpacing: '-0.04em' }}>{m.v}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.l}</div>
          </div>
        ))}
      </motion.div>

      <motion.h1 custom={3} initial="hidden" animate="visible" variants={variants}
        className="font-black leading-[1.05] text-center mb-4"
        style={{ fontSize: 'clamp(2rem,5vw,4.2rem)', letterSpacing: '-0.04em' }}>
        <span className="block" style={{ color: '#F5F5F5' }}>
          {isRTL ? 'عملك لا ينام.' : 'Your Business Never Sleeps.'}
        </span>
        <span className="block text-dual">{isRTL ? 'وكذلك ذكاؤك الاصطناعي.' : 'Neither Does Your AI.'}</span>
      </motion.h1>

      <motion.p custom={4} initial="hidden" animate="visible" variants={variants}
        className="text-base text-center mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.42)' }}>
        {isRTL
          ? 'منصة ذكاء اصطناعي تتولى الردود وتحوّل الرسائل إلى عملاء — تلقائياً.'
          : 'AI that handles replies, builds relationships, and converts messages into customers — automatically.'}
      </motion.p>

      <motion.div custom={5} initial="hidden" animate="visible" variants={variants}
        className="flex flex-wrap gap-4 justify-center">
        <Link href="/register" className="btn-lime px-8 py-3.5 rounded-xl font-bold text-base"
          style={{ minWidth: 190, textAlign: 'center', letterSpacing: '-0.01em' }}>
          {isRTL ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
        </Link>
        <button className="btn-ghost px-8 py-3.5 rounded-xl font-bold text-base"
          style={{ minWidth: 150 }}>
          {isRTL ? 'شاهد العرض' : 'Watch Demo'}
        </button>
      </motion.div>

      <motion.div custom={6} initial="hidden" animate="visible" variants={variants}
        className="mt-10 flex items-center justify-center gap-2 text-xs"
        style={{ color: 'rgba(255,255,255,0.18)' }}>
        <span className="tracking-[0.18em]">{isRTL ? '▼ مرر للاستكشاف ▼' : '▼ SCROLL TO EXPLORE ▼'}</span>
      </motion.div>
    </motion.div>
  )
}

// ─── STATE 1 — Channels ───────────────────────────────────────────────────────
function State1({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % CHANNELS.length), 900)
    return () => clearInterval(iv)
  }, [])

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ opacity: op, pointerEvents: 'none' }}>
      <div className="absolute top-24 text-center">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(125,249,255,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#7DF9FF' }} />
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#7DF9FF' }}>
            {isRTL ? 'القنوات تتصل بالنظام' : 'CHANNELS CONNECTING'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'كل قنواتك في مكان واحد.' : 'All your channels. One system.'}
        </h2>
      </div>

      <AICore size={140} />

      {CHANNELS.map((ch, i) => {
        const pos = polar(ch.angle, ch.dist)
        const isHot = pulse === i
        return (
          <div key={ch.id} className="absolute flex flex-col items-center gap-2"
            style={{ left: `calc(50% + ${pos.x}px - 26px)`, top: `calc(50% + ${pos.y}px - 26px)`, transition: 'transform 0.3s ease', transform: isHot ? 'scale(1.14)' : 'scale(1)' }}>
            <div className="w-13 h-13 flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${ch.color}12`,
                  border: `1.5px solid ${ch.color}${isHot ? '60' : '22'}`,
                  boxShadow: isHot ? `0 0 24px ${ch.color}35` : 'none',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                }}>
                <ch.Icon c={ch.color} s={22} />
              </div>
              <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: isHot ? ch.color : 'rgba(255,255,255,0.4)', transition: 'color 0.3s' }}>{ch.label}</span>
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

// ─── STATE 2 — Messages ───────────────────────────────────────────────────────
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

        <div className="flex-1 max-w-sm w-full">
          <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: '#C6FF00' }}>
            {isRTL ? 'رسائل واردة — مباشر' : 'INCOMING — LIVE'}
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,8,12,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
              <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>5 {isRTL ? 'محادثة نشطة' : 'active conversations'}</span>
            </div>
            <div className="p-2 space-y-1.5">
              {MSGS.map((msg, i) => (
                <div key={msg.from} className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300"
                  style={{ background: activeMsg === i ? 'rgba(198,255,0,0.05)' : 'rgba(255,255,255,0.02)', borderLeft: activeMsg === i ? '2px solid rgba(198,255,0,0.4)' : '2px solid transparent' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${msg.color}12`, border: `1px solid ${msg.color}20` }}>
                    <msg.Icon c={msg.color} s={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold" style={{ color: '#F5F5F5' }}>{msg.from}</div>
                    <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {isRTL ? msg.ar : msg.en}
                    </div>
                  </div>
                  {activeMsg === i ? (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[0,1,2].map(j => <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: '#C6FF00', animation: `typingDot 1.2s ease ${j*0.2}s infinite` }} />)}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: `${msg.sc}12`, color: msg.sc, border: `1px solid ${msg.sc}20` }}>
                      {msg.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <AICore size={130} />
          <div className="text-xs font-medium text-center" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 180 }}>
            {isRTL ? 'كل قناة تتدفق في نظام واحد' : 'Every channel flows into one system'}
          </div>
        </div>

        <div className="flex-1 max-w-xs w-full">
          <div className="text-[10px] font-bold tracking-widest mb-3" style={{ color: '#7DF9FF' }}>
            {isRTL ? 'معالجة الذكاء الاصطناعي' : 'AI PROCESSING'}
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(8,8,12,0.95)', border: '1px solid rgba(198,255,0,0.1)' }}>
            {[
              { l: isRTL ? 'تحليل النص'   : 'Text Analysis',    p: 94, c: '#C6FF00' },
              { l: isRTL ? 'توليد الرد'   : 'Response Gen',     p: 88, c: '#7DF9FF' },
              { l: isRTL ? 'إدارة السياق' : 'Context Handling', p: 97, c: '#C6FF00' },
              { l: isRTL ? 'اكتشاف النية' : 'Intent Detection', p: 91, c: '#7DF9FF' },
            ].map((b, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{b.l}</span>
                  <span style={{ color: b.c }}>{b.p}%</span>
                </div>
                <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${b.p}%`, background: b.c, boxShadow: `0 0 6px ${b.c}50`, animation: `barGrow 1.2s ease ${i*0.15}s both` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{isRTL ? 'متوسط الرد' : 'Avg reply'}</span>
              <span className="text-sm font-black" style={{ color: '#C6FF00' }}>8s</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── STATE 3 — Neural Brain ───────────────────────────────────────────────────
function State3({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [pulse, setPulse] = useState<string | null>(null)
  const [dim, setDim] = useState({ w: 1200, h: 700 })
  useEffect(() => { setDim({ w: window.innerWidth, h: window.innerHeight }) }, [])
  useEffect(() => {
    const ids = CAPS.map(c => c.id)
    const iv = setInterval(() => {
      const p = ids[Math.floor(Math.random() * ids.length)]
      setPulse(p)
      setTimeout(() => setPulse(null), 700)
    }, 1200)
    return () => clearInterval(iv)
  }, [])
  const cx = dim.w / 2, cy = dim.h / 2

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center z-10"
      style={{ opacity: op, pointerEvents: 'none' }}>
      <div className="absolute top-24 text-center">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(198,255,0,0.18)' }}>
          <IC.Sparkle c="#C6FF00" s={12} />
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
            {isRTL ? 'الشبكة العصبية' : 'NEURAL CAPABILITY NETWORK'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'عقل متصل بكل شيء.' : 'A brain connected to everything.'}
        </h2>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {CAPS.map(cap => {
          const pos = polar(cap.angle, cap.dist)
          const isHot = pulse === cap.id
          return (
            <line key={cap.id} x1={cx} y1={cy} x2={cx+pos.x} y2={cy+pos.y}
              stroke={isHot ? '#C6FF00' : '#7DF9FF'}
              strokeWidth={isHot ? 1.5 : 0.5}
              strokeOpacity={isHot ? 0.75 : 0.18}
              strokeDasharray="3 5"
              style={{ transition: 'all 0.3s' }}
            />
          )
        })}
        {CAPS.map((a, ai) => CAPS.slice(ai+1, ai+3).map((b, bi) => {
          const pa = polar(a.angle, a.dist), pb = polar(b.angle, b.dist)
          const isHot = pulse === a.id || pulse === b.id
          return (
            <line key={`${a.id}-${b.id}-${bi}`}
              x1={cx+pa.x} y1={cy+pa.y} x2={cx+pb.x} y2={cy+pb.y}
              stroke={isHot ? '#C6FF00' : '#7DF9FF'}
              strokeWidth={isHot ? 0.8 : 0.25}
              strokeOpacity={isHot ? 0.45 : 0.08}
              style={{ transition: 'all 0.3s' }}
            />
          )
        }))}
      </svg>

      <AICore size={120} />

      {CAPS.map(cap => {
        const pos = polar(cap.angle, cap.dist)
        const isHot = pulse === cap.id
        return (
          <div key={cap.id} className="absolute flex flex-col items-center gap-1.5"
            style={{ left: `calc(50% + ${pos.x}px - 22px)`, top: `calc(50% + ${pos.y}px - 22px)` }}>
            {isHot && (
              <div className="absolute rounded-full" style={{
                width: 52, height: 52, border: '1.5px solid rgba(198,255,0,0.55)',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                animation: 'nodePulse 0.7s ease-out infinite',
              }} />
            )}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: isHot ? 'rgba(198,255,0,0.12)' : 'rgba(12,12,16,0.95)',
                border: `1.5px solid ${isHot ? 'rgba(198,255,0,0.5)' : 'rgba(198,255,0,0.12)'}`,
                boxShadow: isHot ? '0 0 24px rgba(198,255,0,0.22)' : 'none',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
              }}>
              <cap.Icon c={isHot ? '#C6FF00' : 'rgba(255,255,255,0.45)'} s={18} />
            </div>
            <div className="text-[10px] font-bold text-center whitespace-nowrap px-2 py-0.5 rounded-lg"
              style={{
                background: 'rgba(5,5,8,0.95)', border: '1px solid rgba(255,255,255,0.05)',
                color: isHot ? '#C6FF00' : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(6px)', transition: 'color 0.3s',
              }}>
              {isRTL ? cap.ar : cap.en}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

// ─── STATE 4 — Automations ────────────────────────────────────────────────────
function State4({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % 4), 1000)
    return () => clearInterval(iv)
  }, [])

  const flow = [
    { Icon: IC.MessageSquare, ar: 'رسالة',  en: 'Message', c: '#7DF9FF' },
    { Icon: IC.Sparkle,       ar: 'ذكاء',   en: 'AI',      c: '#C6FF00' },
    { Icon: IC.Zap,           ar: 'إجراء',  en: 'Action',  c: '#C6FF00' },
    { Icon: IC.Target,        ar: 'نتيجة',  en: 'Result',  c: '#7DF9FF' },
  ]
  const cards = [
    { Icon: IC.Moon,       ar: 'رد ما بعد الدوام',    en: 'After-Hours Reply',  r_ar: '100% ردود',  r_en: '100% coverage' },
    { Icon: IC.Star,       ar: 'استرداد التقييمات',   en: 'Review Recovery',    r_ar: '−60% سلبية', r_en: '−60% bad reviews' },
    { Icon: IC.TrendingUp, ar: 'أتمتة المبيعات',      en: 'Sales Automation',   r_ar: '+35% تحويل', r_en: '+35% conversion' },
  ]

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: 'none' }}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(198,255,0,0.16)' }}>
          <IC.Zap c="#C6FF00" s={12} />
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#C6FF00' }}>
            {isRTL ? 'شبكة الأتمتة' : 'AUTOMATION NETWORK'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'الرسالة تصل. الذكاء يعمل.' : 'Message in. Magic out.'}
        </h2>
      </div>

      <div className="flex items-center gap-2 mb-12">
        {flow.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2 transition-all duration-300"
              style={{ transform: step === i ? 'scale(1.12)' : 'scale(1)' }}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: step === i ? `${s.c}14` : 'rgba(12,12,16,0.9)',
                  border: `1.5px solid ${step === i ? s.c : `${s.c}22`}`,
                  boxShadow: step === i ? `0 0 28px ${s.c}28` : 'none',
                }}>
                <s.Icon c={step === i ? s.c : 'rgba(255,255,255,0.3)'} s={22} />
              </div>
              <span className="text-xs font-bold" style={{ color: step === i ? s.c : 'rgba(255,255,255,0.35)' }}>
                {isRTL ? s.ar : s.en}
              </span>
            </div>
            {i < flow.length - 1 && (
              <div className="flex items-center pb-5 mx-1">
                <div className="h-px w-10 sm:w-16 rounded-full" style={{
                  background: step > i ? `linear-gradient(to right, ${flow[i].c}, ${flow[i+1].c})` : 'rgba(255,255,255,0.07)',
                  transition: 'all 0.4s ease',
                }} />
                <span style={{ color: step > i ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)', fontSize: 14 }}>›</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl p-5 w-44 sm:w-52"
            style={{ background: 'rgba(12,12,16,0.92)', border: '1px solid rgba(198,255,0,0.08)' }}>
            <div className="mb-3"><c.Icon c="#C6FF00" s={22} /></div>
            <div className="text-sm font-bold mb-2" style={{ color: '#F5F5F5' }}>{isRTL ? c.ar : c.en}</div>
            <div className="text-[11px] font-bold" style={{ color: '#C6FF00' }}>{isRTL ? c.r_ar : c.r_en}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── STATE 5 — Outcomes ───────────────────────────────────────────────────────
function State5({ op, isRTL }: { op: MotionValue<number>; isRTL: boolean }) {
  const [run, setRun] = useState(false)
  useEffect(() => { const u = op.on('change', v => { if (v > 0.3) setRun(true) }); return u }, [op])
  const v0 = useCountUp(OUTCOMES[0].after, run)
  const v1 = useCountUp(OUTCOMES[1].after, run)
  const v2 = useCountUp(OUTCOMES[2].after, run)
  const v3 = useCountUp(OUTCOMES[3].after, run)
  const vals = [v0, v1, v2, v3]

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
      style={{ opacity: op, pointerEvents: 'none' }}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(125,249,255,0.2)' }}>
          <IC.TrendingUp c="#7DF9FF" s={12} />
          <span className="text-xs font-bold tracking-[0.12em]" style={{ color: '#7DF9FF' }}>
            {isRTL ? 'التأثير على الأعمال' : 'BUSINESS IMPACT'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.6rem,3vw,2.8rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'الأعمال تتحول أمام عينيك.' : 'Watch your business transform.'}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-8">
        {OUTCOMES.map((item, i) => (
          <div key={i} className="card-os rounded-2xl p-5 text-center"
            style={{ background: 'rgba(12,12,16,0.92)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-center mb-2"><item.Icon c="#7DF9FF" s={20} /></div>
            <div className="text-[10px] mb-2" style={{ color: 'rgba(255,100,100,0.65)' }}>
              {isRTL ? 'قبل: ' : 'Before: '}{item.before}
            </div>
            <div className="text-3xl font-black" style={{ color: '#C6FF00', letterSpacing: '-0.04em' }}>
              {vals[i]}
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isRTL ? item.ar : item.en}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <IC.TrendingUp c="#C6FF00" s={10} />
              <span className="text-[10px] font-bold" style={{ color: '#C6FF00' }}>{isRTL ? 'تحسن' : 'Improved'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 w-full max-w-xl"
        style={{ background: 'rgba(12,12,16,0.92)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-[10px] font-bold tracking-widest mb-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isRTL ? 'متوسط النتائج — بعد 30 يوم' : 'AVERAGE RESULTS — AFTER 30 DAYS'}
        </div>
        {[
          { l: isRTL ? 'رضا العملاء'  : 'Customer Satisfaction', p: 94, c: '#C6FF00' },
          { l: isRTL ? 'سرعة الرد'    : 'Response Speed',        p: 98, c: '#7DF9FF' },
          { l: isRTL ? 'معدل التحويل' : 'Conversion Rate',       p: 41, c: '#C6FF00' },
        ].map((b, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span style={{ color: 'rgba(255,255,255,0.42)' }}>{b.l}</span>
              <span style={{ color: b.c }}>{b.p}%</span>
            </div>
            <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full" style={{
                width: run ? `${b.p}%` : '0%',
                background: b.c, boxShadow: `0 0 8px ${b.c}50`,
                transition: `width 1.4s cubic-bezier(0.22,1,0.36,1) ${i*0.2}s`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── STATE 6 — Pricing ────────────────────────────────────────────────────────
function State6({ op, isRTL, packages }: { op: MotionValue<number>; isRTL: boolean; packages: RealPackage[] }) {
  const [annual, setAnnual] = useState(false)
  const displayPlans = packages.length > 0 ? packages : null

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 pt-20 pb-4 overflow-y-auto"
      style={{ opacity: op, pointerEvents: useTransform(op, v => v > 0.1 ? 'auto' : 'none') as any }}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full glass"
          style={{ border: '1px solid rgba(198,255,0,0.2)' }}>
          <IC.Sparkle c="#C6FF00" s={12} />
          <span className="text-[11px] font-bold tracking-widest" style={{ color: '#C6FF00' }}>
            {isRTL ? 'نشر بنية الذكاء الاصطناعي' : 'DEPLOY AI INFRASTRUCTURE'}
          </span>
        </div>
        <h2 className="font-black" style={{ fontSize: 'clamp(1.5rem,2.8vw,2.6rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'اختر مستوى التفعيل.' : 'Choose your activation tier.'}
        </h2>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="text-xs font-medium" style={{ color: !annual ? '#F5F5F5' : 'rgba(255,255,255,0.35)' }}>
            {isRTL ? 'شهري' : 'Monthly'}
          </span>
          <button onClick={() => setAnnual(a => !a)}
            className="relative w-10 h-5 rounded-full transition-colors duration-300"
            style={{ background: annual ? '#C6FF00' : 'rgba(255,255,255,0.1)' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all duration-300"
              style={{ left: annual ? 22 : 2 }} />
          </button>
          <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: annual ? '#F5F5F5' : 'rgba(255,255,255,0.35)' }}>
            {isRTL ? 'سنوي' : 'Annual'}
            {annual && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.2)' }}>
              {isRTL ? 'وفر 20%' : 'Save 20%'}
            </span>}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full max-w-5xl">
        {(displayPlans ?? PLANS).map((plan: any, i: number) => {
          const isReal = displayPlans !== null
          const price = isReal ? (annual ? plan.price_yearly : plan.price_monthly) : (annual ? plan.yr : plan.mo)
          const isPop = isReal ? !!plan.is_popular : !!plan.pop
          const name = isReal ? (isRTL ? plan.name_ar : plan.name) : (isRTL ? plan.ar : plan.en)
          const feats = isReal ? (isRTL ? plan.features_ar : plan.features) : plan.f
          const href = isReal ? `/checkout?package=${plan.id}&billing=${annual ? 'yearly' : 'monthly'}` : '/register'
          const inner = (
            <div className="relative rounded-2xl p-4 flex flex-col h-full"
              style={{ background: isPop ? 'rgba(16,16,20,0.99)' : 'rgba(12,12,16,0.92)', border: isPop ? 'none' : '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
              {isPop && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{ background: 'linear-gradient(135deg,#C6FF00,#7DF9FF)', color: '#050505' }}>
                    {isRTL ? 'الأكثر طلباً' : 'Most Popular'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black" style={{ color: isPop ? '#C6FF00' : '#F5F5F5' }}>{name}</h3>
                <IC.Sparkle c={isPop ? '#C6FF00' : 'rgba(255,255,255,0.18)'} s={13} />
              </div>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-2xl font-black" style={{ color: isPop ? '#C6FF00' : '#F5F5F5', letterSpacing: '-0.04em' }}>
                  {price === 0 ? (isRTL ? 'مجاني' : 'Free') : (isReal ? `${price} SAR` : `$${price}`)}
                </span>
                {price > 0 && <span className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/{isRTL ? 'شهر' : 'mo'}</span>}
              </div>
              <ul className="space-y-1.5 flex-1 mb-4">
                {feats.map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <IC.CheckCircle c="#C6FF00" s={11} />
                    <span className="mt-px">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={href}
                className="block text-center py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={isPop
                  ? { background: 'linear-gradient(135deg,#C6FF00,#7DF9FF)', color: '#050505' }
                  : { border: '1px solid rgba(255,255,255,0.08)', color: '#F5F5F5', background: 'rgba(255,255,255,0.02)' }
                }>
                {isRTL ? 'تفعيل الوحدة' : 'Deploy Module'}
              </Link>
            </div>
          )
          return (
            <div key={isReal ? plan.id : i} style={{ transform: isPop ? 'scale(1.04)' : undefined, transformOrigin: 'center' }}>
              {isPop ? <div className="animated-border rounded-2xl p-[2px] h-full">{inner}</div> : inner}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-6 mt-5">
        {[
          { Icon: IC.Shield,   ar: 'بدون بطاقة',    en: 'No credit card'  },
          { Icon: IC.Sparkle,  ar: '14 يوم مجاني',  en: '14-day free'     },
          { Icon: IC.Zap,      ar: 'إلغاء بأي وقت', en: 'Cancel anytime'  },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <item.Icon c="#C6FF00" />
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

  const [packages, setPackages] = useState<RealPackage[]>([])
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages`)
      .then(r => r.json())
      .then(d => setPackages(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const [stateIdx, setStateIdx] = useState(0)
  useEffect(() => scrollYProgress.on('change', v => setStateIdx(Math.min(6, Math.floor(v * 7)))), [scrollYProgress])

  // State0: visible immediately, fades OUT as you scroll away
  const op0 = useTransform(smooth, [0, 0.06, 0.14], [1, 1, 0])
  // States 1-6: fade in + out per slot
  const op1 = slotOpacity(smooth, 1)
  const op2 = slotOpacity(smooth, 2)
  const op3 = slotOpacity(smooth, 3)
  const op4 = slotOpacity(smooth, 4)
  const op5 = slotOpacity(smooth, 5)
  const op6 = slotOpacity(smooth, 6)

  const coreOpacity = useTransform(smooth, [0, 0.04, 0.82, 0.90], [0, 1, 1, 0])
  const coreScale   = useTransform(smooth, [0, 0.04, 3/7, 4/7, 5/7], [0.5, 1, 1.15, 1.25, 0.85])
  const barWidth    = useTransform(scrollYProgress, [0,1], ['0%','100%'])
  const labelOpacity = useTransform(smooth, [0.03, 0.10], [0, 1])

  return (
    <div ref={scrollRef} style={{ height: '700vh' }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Persistent AI Core */}
        <motion.div className="absolute z-0 pointer-events-none"
          style={{ left:'50%', top:'50%', transform:'translate(-50%,-50%)', opacity: coreOpacity, scale: coreScale }}>
          <AICore size={130} />
        </motion.div>

        {/* States */}
        <State0 op={op0} isRTL={isRTL} />
        <State1 op={op1} isRTL={isRTL} />
        <State2 op={op2} isRTL={isRTL} />
        <State3 op={op3} isRTL={isRTL} />
        <State4 op={op4} isRTL={isRTL} />
        <State5 op={op5} isRTL={isRTL} />
        <State6 op={op6} isRTL={isRTL} packages={packages} />

        {/* State indicator */}
        <motion.div className="absolute bottom-8 flex flex-col gap-1.5 z-50 pointer-events-none"
          style={{ left: 24, opacity: labelOpacity }}>
          {LABELS.map((lbl, i) => (
            <div key={i} className="flex items-center gap-2"
              style={{ opacity: stateIdx === i ? 1 : 0.18, transition: 'opacity 0.3s' }}>
              <div className="rounded-full flex-shrink-0 transition-all duration-300"
                style={{ width: stateIdx === i ? 20 : 4, height: 4, background: stateIdx === i ? '#C6FF00' : 'rgba(255,255,255,0.15)' }} />
              {stateIdx === i && (
                <span className="text-[10px] font-bold whitespace-nowrap"
                  style={{ color: '#C6FF00', letterSpacing: '0.08em' }}>
                  {isRTL ? lbl.ar : lbl.en}
                </span>
              )}
            </div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div className="absolute bottom-0 left-0 h-[2px] z-50"
          style={{ width: barWidth, background: 'linear-gradient(to right, #C6FF00, #7DF9FF)', boxShadow: '0 0 8px rgba(198,255,0,0.5)' }} />
      </div>
    </div>
  )
}
