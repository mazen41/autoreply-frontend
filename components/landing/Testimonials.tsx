'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useLang } from '../../lib/LangContext'

export default function Testimonials() {
  const { t, isRTL } = useLang()
  const [active, setActive] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const items = t.testimonials.items

  const startAuto = () => {
    intervalRef.current = setInterval(() => {
      setActive(a => (a + 1) % items.length)
    }, 3500)
  }

  useEffect(() => {
    startAuto()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [items.length])

  const goTo = (i: number) => {
    setActive(i)
    if (intervalRef.current) clearInterval(intervalRef.current)
    startAuto()
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Faint mid glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,178,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className={`text-3xl sm:text-4xl font-black text-center mb-12 ${isRTL ? 'font-arabic' : ''}`}
          style={{ color: '#F0F0FF', letterSpacing: '-0.03em' }}
        >
          {t.testimonials.title}
        </h2>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: `translateX(${isRTL ? '' : '-'}${active * 100}%)` }}
          >
            {items.map((item, i) => (
              <div key={i} className="min-w-full px-4 sm:px-16 md:px-32">
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: '#0F0F1A',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: i === active ? '0 0 40px rgba(0,255,178,0.06)' : 'none',
                  }}
                >
                  <div className="flex gap-1 justify-center mb-5">
                    {Array.from({ length: item.rating }).map((_, j) => (
                      <span key={j} style={{ color: '#FFB800' }}>★</span>
                    ))}
                  </div>
                  <p
                    className="text-base sm:text-lg leading-relaxed mb-8 italic"
                    style={{ color: 'rgba(240,240,255,0.65)', maxWidth: 600, margin: '0 auto 2rem' }}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,255,178,0.15), rgba(191,0,255,0.15))',
                        border: '1px solid rgba(0,255,178,0.2)',
                        color: '#00FFB2',
                      }}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-semibold text-sm" style={{ color: '#F0F0FF' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(240,240,255,0.4)' }}>{item.business}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? 28 : 8,
                height: 8,
                background: i === active ? '#00FFB2' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
