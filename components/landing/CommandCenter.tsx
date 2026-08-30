'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'

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
  { labelAr: 'محادثة نشطة',    labelEn: 'Active Convos',    value: 247,    suffix: '',  color: 'var(--accent)' },
  { labelAr: 'رد اليوم',        labelEn: 'Replies Today',    value: 3842,   suffix: '+', color: 'var(--accent)' },
  { labelAr: 'عميل محتمل',      labelEn: 'Leads Generated', value: 128,    suffix: '',  color: 'var(--accent)' },
  { labelAr: 'وقت الرد (ثانية)', labelEn: 'Avg Response',   value: 8,      suffix: 's', color: 'var(--accent)' },
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
      <div
        className="flex items-center gap-3 mb-10 px-5 py-2.5 rounded-full glass"
        style={{
          border: '1px solid var(--border)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-15px)',
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
        }}
      >
        <div className="w-2 h-2 rounded-full status-live" style={{ background: 'var(--accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>
          {isRTL ? 'نظام الذكاء الاصطناعي — نشط' : 'AI OPERATING SYSTEM — ONLINE'}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>v4.1.0</span>
      </div>

      {/* Metrics row */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 w-full max-w-3xl px-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
        }}
      >
        {METRICS.map((m, i) => (
          <div
            key={i}
            className="card-os rounded-2xl p-4 text-center glass"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="text-3xl font-black mb-1 count-reveal"
              style={{ color: m.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {counts[i].toLocaleString()}{m.suffix}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? m.labelAr : m.labelEn}
            </div>
            <div className="mt-2 h-px shimmer-line rounded-full" />
          </div>
        ))}
      </div>

      {/* Central AI Core + Headline */}
      <div className="flex flex-col items-center relative">

        {/* AI Core */}
        <div
          className="relative flex items-center justify-center mb-8"
          style={{
            width: 220,
            height: 220,
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease 0.4s',
          }}
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
              borderTop: '1px solid var(--accent-subtle)',
              borderRight: '1px solid var(--border)',
            }}
          />
          {/* Inner orbit ring */}
          <div
            className="absolute core-rotate-rev"
            style={{
              width: 160, height: 160,
              borderRadius: '50%',
              border: '1px solid transparent',
              borderBottom: '1px solid var(--accent-subtle)',
              borderLeft: '1px solid var(--border)',
            }}
          />

          {/* Core */}
          <div
            className="relative core-glow"
            style={{
              width: 120, height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, var(--accent-subtle) 0%, var(--accent-subtle) 50%, transparent 75%)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 40, filter: 'drop-shadow(0 0 20px var(--accent-subtle))' }}>✦</span>
          </div>

          {/* Orbit dots */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 8px var(--accent)',
                top: `${50 - 47 * Math.cos((deg * Math.PI) / 180)}%`,
                left: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
                transform: 'translate(-50%, -50%)',
                opacity: 0.8,
              }}
            />
          ))}
        </div>

        {/* Headline — integrated into interface */}
        <div
          className="text-center px-4 max-w-3xl"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s',
          }}
        >
          {/* System label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to left, var(--accent-subtle), transparent)' }} />
            <span className="text-xs font-semibold tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? 'نظام الردود الذكية' : 'INTELLIGENT REPLY SYSTEM'}
            </span>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to right, var(--accent-subtle), transparent)' }} />
          </div>

          <h1
            className="font-black leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', letterSpacing: '-0.04em' }}
          >
            <span className="block" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'ندير مراسلاتك' : 'Manage Your Messages'}
            </span>
            <span className="block text-dual" style={{ paddingBottom: '0.05em' }}>
              {isRTL ? 'و مبيعاتك بذكاء.' : 'And Sales With AI.'}
            </span>
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
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
              <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease 1.2s',
        }}
      >
        <span className="text-xs tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          {isRTL ? 'مرر للاكتشاف' : 'SCROLL TO EXPLORE'}
        </span>
        <div
          className="w-px h-12"
          style={{ background: 'linear-gradient(to bottom, var(--accent-subtle), transparent)' }}
        />
      </div>
    </section>
  )
}
