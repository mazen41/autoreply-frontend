'use client'

import React from 'react'
import { useLang } from '../../lib/LangContext'

const logos = [
  { icon: '🍽️', label: 'مطاعم' },
  { icon: '🏥', label: 'عيادات' },
  { icon: '☕', label: 'كافيهات' },
  { icon: '🛍️', label: 'متاجر' },
  { icon: '💆', label: 'سبا' },
  { icon: '🏋️', label: 'صالات' },
  { icon: '📚', label: 'تعليم' },
  { icon: '🚗', label: 'سيارات' },
  { icon: '💇', label: 'صالونات' },
  { icon: '🏨', label: 'فنادق' },
]

export default function TrustedBy() {
  const { t } = useLang()
  const doubled = [...logos, ...logos]

  return (
    <section
      className="py-14 overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <p
        className="text-center text-sm mb-8 px-4"
        style={{ color: 'rgba(240,240,255,0.35)' }}
      >
        {t.trustedBy.title}
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div
          className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #050508, transparent)' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #050508, transparent)' }}
        />
        <div
          className="flex gap-6 whitespace-nowrap"
          style={{ animation: 'scroll 30s linear infinite' }}
        >
          {doubled.map((logo, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl flex-shrink-0 transition-all duration-200"
              style={{
                background: '#0F0F1A',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-xl">{logo.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'rgba(240,240,255,0.45)' }}>{logo.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
