'use client'

import React, { useEffect, useRef } from 'react'
import { useLang } from '../../lib/LangContext'

// Per-card micro-interaction animations
const cardAnimations = [
  { hover: 'Unified Inbox — icons fly in on hover', icon: '📥' },
  { hover: 'Rating rising 3.2→4.8', icon: '⭐' },
  { hover: 'Calendar checkmarks', icon: '📅' },
  { hover: 'Speed counter', icon: '⚡' },
  { hover: 'AI brain pulse', icon: '🤖' },
  { hover: 'Analytics chart', icon: '📊' },
]

// Bento cell sizes: [colSpan, rowSpan]
const BENTO_LAYOUT = [
  { cols: 2, rows: 1, glow: 'teal' },   // 0 large
  { cols: 1, rows: 1, glow: 'magenta' },// 1 small
  { cols: 1, rows: 1, glow: 'teal' },   // 2 small
  { cols: 1, rows: 1, glow: 'magenta' },// 3 medium
  { cols: 1, rows: 1, glow: 'teal' },   // 4 small
  { cols: 1, rows: 1, glow: 'magenta' },// 5 small
]

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function FeatureCard({
  item,
  layout,
  idx,
}: {
  item: { icon: string; title: string; desc: string }
  layout: { cols: number; rows: number; glow: string }
  idx: number
}) {
  const isTeal = layout.glow === 'teal'
  const glowColor = 'var(--accent-subtle)'
  const borderHover = 'var(--accent-subtle)'
  const iconBg = 'var(--accent-subtle)'
  const iconColor = 'var(--accent)'

  return (
    <div
      className="reveal card-hover group relative flex flex-col justify-between rounded-2xl p-6 cursor-default overflow-hidden"
      style={{
        gridColumn: `span ${layout.cols}`,
        gridRow: `span ${layout.rows}`,
        background: 'var(--surface)',
        animationDelay: `${idx * 0.08}s`,
        minHeight: layout.cols === 2 ? 180 : 160,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = borderHover
        el.style.boxShadow = `0 0 40px ${glowColor}`
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Icon glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, filter: 'blur(12px)' }}
      />

      <div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 transition-all duration-300 group-hover:scale-110"
          style={{ background: iconBg, fontSize: 22 }}
        >
          <span style={{ filter: `drop-shadow(0 0 6px var(--accent))` }}>{item.icon}</span>
        </div>
        <h3
          className="font-bold text-base mb-2 leading-tight"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {item.desc}
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
        style={{ background: `linear-gradient(to right, var(--accent), transparent)` }}
      />
    </div>
  )
}

export default function Features() {
  const { t, isRTL } = useLang()
  const sectionRef = useReveal()
  const titleRef = useReveal()

  return (
    <section id="features" className="py-24 relative">
      {/* Top divider */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--accent-subtle))' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Problems block */}
        <div ref={sectionRef} className="reveal mb-20">
          <h2
            className={`text-3xl sm:text-4xl font-black text-center mb-12 ${isRTL ? 'font-arabic' : ''}`}
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            {t.problems.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {t.problems.items.map((item, i) => (
              <div
                key={i}
                className="card-hover flex items-start gap-4 p-5 rounded-2xl transition-all duration-300"
                style={{ background: 'var(--surface)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-subtle)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow divider */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
          <span style={{ color: 'var(--accent)', fontSize: 24, filter: 'drop-shadow(0 0 8px var(--accent-subtle))' }}>↓</span>
          <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
        </div>

        {/* Features bento grid */}
        <div ref={titleRef} className="reveal text-center mb-12">
          <h2
            className={`text-3xl sm:text-4xl font-black mb-3 ${isRTL ? 'font-arabic' : ''}`}
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            {t.features.title}
          </h2>
        </div>

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {t.features.items.map((item, i) => (
            <FeatureCard
              key={i}
              item={item}
              layout={BENTO_LAYOUT[i] || { cols: 1, rows: 1, glow: 'teal' }}
              idx={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
