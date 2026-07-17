'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'
import { motion } from 'framer-motion'

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    const startTime = Date.now()
    const frame = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration, start])
  return value
}

const METRICS = [
  { labelAr: 'محادثة نشطة',    labelEn: 'Active Convos',    value: 247,    suffix: '',  color: '#C6FF00' },
  { labelAr: 'رد اليوم',        labelEn: 'Replies Today',    value: 3842,   suffix: '+', color: '#7DF9FF' },
  { labelAr: 'عميل محتمل',      labelEn: 'Leads Generated', value: 128,    suffix: '',  color: '#C6FF00' },
  { labelAr: 'وقت الرد (ثانية)', labelEn: 'Avg Response',   value: 8,      suffix: 's', color: '#7DF9FF' },
]

export default function CommandCenter() {
  const { isRTL } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const m0 = useCountUp(METRICS[0].value, 1800, visible)
  const m1 = useCountUp(METRICS[1].value, 2200, visible)
  const m2 = useCountUp(METRICS[2].value, 1600, visible)
  const m3 = useCountUp(METRICS[3].value, 1000, visible)
  const counts = [m0, m1, m2, m3]

  return (
    <section
      id="command-center"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden"
    >
      {/* Top status bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center gap-3 mb-10 px-5 py-2.5 rounded-full glass"
        style={{ border: '1px solid rgba(198,255,0,0.15)' }}
      >
        <div className="w-2 h-2 rounded-full status-live" style={{ background: '#C6FF00' }} />
        <span className="text-xs font-semibold" style={{ color: '#C6FF00', letterSpacing: '0.08em' }}>
          {isRTL ? 'نظام الذكاء الاصطناعي — نشط' : 'AI OPERATING SYSTEM — ONLINE'}
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>v4.1.0</span>
      </motion.div>

      {/* Metrics row */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 w-full max-w-3xl px-4"
      >
        {METRICS.map((m, i) => (
          <div
            key={i}
            className="card-os rounded-2xl p-4 text-center glass"
            style={{ background: 'rgba(17,17,17,0.8)' }}
          >
            <div
              className="text-3xl font-black mb-1 count-reveal"
              style={{ color: m.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {counts[i].toLocaleString()}{m.suffix}
            </div>
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isRTL ? m.labelAr : m.labelEn}
            </div>
            <div className="mt-2 h-px shimmer-line rounded-full" />
          </div>
        ))}
      </motion.div>

      {/* Central AI Core + Headline */}
      <div className="flex flex-col items-center relative">

        {/* AI Core */}
        <motion.div
          className="relative flex items-center justify-center mb-8"
          style={{ width: 220, height: 220 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={visible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] as any }}
        >
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="energy-pulse" style={{ width: 140, height: 140, borderRadius: '50%' }} />
            <div className="energy-pulse" style={{ width: 140, height: 140, borderRadius: '50%' }} />
            <div className="energy-pulse" style={{ width: 140, height: 140, borderRadius: '50%' }} />
          </div>

          {/* Outer orbit ring */}
          <div
            className="absolute core-rotate"
            style={{
              width: 200, height: 200,
              borderRadius: '50%',
              border: '1px solid transparent',
              borderTop: '1px solid rgba(198,255,0,0.4)',
              borderRight: '1px solid rgba(198,255,0,0.15)',
            }}
          />
          {/* Inner orbit ring */}
          <div
            className="absolute core-rotate-rev"
            style={{
              width: 160, height: 160,
              borderRadius: '50%',
              border: '1px solid transparent',
              borderBottom: '1px solid rgba(125,249,255,0.4)',
              borderLeft: '1px solid rgba(125,249,255,0.15)',
            }}
          />

          {/* Core */}
          <div
            className="relative core-glow"
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, rgba(198,255,0,0.25) 0%, rgba(198,255,0,0.05) 50%, transparent 75%)',
              border: '2px solid rgba(198,255,0,0.3)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 40, filter: 'drop-shadow(0 0 20px rgba(198,255,0,0.8))' }}>✦</span>
          </div>

          {/* Orbit dots */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: i % 2 === 0 ? '#C6FF00' : '#7DF9FF',
                boxShadow: `0 0 8px ${i % 2 === 0 ? '#C6FF00' : '#7DF9FF'}`,
                top: `${50 - 47 * Math.cos((deg * Math.PI) / 180)}%`,
                left: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
                transform: 'translate(-50%, -50%)',
                opacity: 0.8,
              }}
            />
          ))}
        </motion.div>

        {/* Headline — integrated into interface */}
        <motion.div
          className="text-center px-4 max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* System label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to left, rgba(198,255,0,0.4), transparent)' }} />
            <span className="text-xs font-semibold tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isRTL ? 'نظام الردود الذكية' : 'INTELLIGENT REPLY SYSTEM'}
            </span>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to right, rgba(198,255,0,0.4), transparent)' }} />
          </div>

          <h1
            className="font-black leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', letterSpacing: '-0.04em' }}
          >
            <span className="block" style={{ color: '#F5F5F5' }}>
              {isRTL ? 'عملك لا ينام.' : 'Your Business Never Sleeps.'}
            </span>
            <span className="block text-dual" style={{ paddingBottom: '0.05em' }}>
              {isRTL ? 'وكذلك ذكاؤك الاصطناعي.' : 'Neither Does Your AI.'}
            </span>
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {isRTL
              ? 'منصة ذكاء اصطناعي تتولى الردود، تبني العلاقات، وتحول الرسائل إلى عملاء — تلقائياً، على مدار الساعة.'
              : 'An AI platform that handles replies, builds relationships, and converts messages into customers — automatically, around the clock.'}
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="btn-lime px-8 py-3.5 rounded-xl font-bold text-base"
              style={{ letterSpacing: '-0.01em', minWidth: 200, textAlign: 'center' }}
            >
              {isRTL ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
            </Link>
            <button
              className="btn-ghost px-7 py-3.5 rounded-xl font-semibold text-base flex items-center gap-2"
              style={{ minWidth: 180, justifyContent: 'center' }}
            >
              <span style={{ fontSize: 12 }}>▶</span>
              {isRTL ? 'شاهد النظام' : 'Watch System'}
            </button>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { icon: '⚡', text: isRTL ? 'رد في 8 ثوانٍ' : '8s avg response' },
              { icon: '🔒', text: isRTL ? 'آمن 100%' : '100% secure' },
              { icon: '⭐', text: isRTL ? '4.9 تقييم' : '4.9 rating' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {isRTL ? 'مرر للاكتشاف' : 'SCROLL TO EXPLORE'}
        </span>
        <div
          className="w-px h-12"
          style={{ background: 'linear-gradient(to bottom, rgba(198,255,0,0.5), transparent)' }}
        />
      </motion.div>
    </section>
  )
}
