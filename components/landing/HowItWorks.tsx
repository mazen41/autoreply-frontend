'use client'

import React, { useEffect, useRef } from 'react'
import { useLang } from '../../lib/LangContext'

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible') }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return ref
}

export default function HowItWorks() {
  const { t, isRTL } = useLang()
  const lineRef = useRef<SVGLineElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        lineRef.current?.classList.add('drawn')
      }
    }, { threshold: 0.1 })
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  const steps = t.howItWorks.steps

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" ref={sectionRef}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-3xl sm:text-4xl font-black ${isRTL ? 'font-arabic' : ''}`}
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            {t.howItWorks.title}
          </h2>
        </div>

        {/* Desktop timeline */}
        <div className="hidden lg:block relative">
          {/* SVG vertical line */}
          <svg
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 pointer-events-none"
            style={{ height: steps.length * 180 }}
            overflow="visible"
          >
            <defs>
              <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <line
              ref={lineRef}
              className="timeline-line"
              x1="0.5" y1="0"
              x2="0.5" y2={steps.length * 180}
              stroke="url(#timelineGrad)"
              strokeWidth="2"
            />
          </svg>

          <div className="space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0
              const stepRef = useReveal(0.2)
              return (
                <div key={i} className="relative flex items-center min-h-[180px]">
                  {/* Left side */}
                  <div className={`w-1/2 pr-12 ${isLeft ? '' : 'opacity-0 pointer-events-none'}`}>
                    {isLeft && (
                      <div
                        ref={stepRef}
                        className="reveal card-hover p-6 rounded-2xl text-right"
                        style={{ background: 'var(--surface)', animationDelay: `${i * 0.15}s` }}
                      >
                        <StepContent step={step} i={i} />
                      </div>
                    )}
                  </div>

                  {/* Center dot */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm z-10"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--text-primary)',
                      boxShadow: '0 0 20px var(--accent-subtle)',
                    }}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </div>

                  {/* Right side */}
                  <div className={`w-1/2 pl-12 ${!isLeft ? '' : 'opacity-0 pointer-events-none'}`}>
                    {!isLeft && (
                      <div
                        ref={stepRef}
                        className="reveal card-hover p-6 rounded-2xl text-left"
                        style={{ background: 'var(--surface)', animationDelay: `${i * 0.15}s` }}
                      >
                        <StepContent step={step} i={i} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: vertical list */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2" style={{ background: 'var(--divider)' }} />
                )}
              </div>
              <div className="pb-6">
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StepContent({ step, i }: { step: { num: string; title: string; desc: string }; i: number }) {
  return (
    <>
      <div
        className="text-4xl font-black mb-2"
        style={{
          background: 'var(--accent)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
        }}
      >
        {(i + 1).toString().padStart(2, '0')}
      </div>
      <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
    </>
  )
}
