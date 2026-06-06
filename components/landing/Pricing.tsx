'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible') }, { threshold: 0.1 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return ref
}

export default function Pricing() {
  const { t, isRTL } = useLang()
  const [annual, setAnnual] = useState(false)
  const sectionRef = useReveal()

  const getPrice = (price: number) => annual ? Math.round(price * 0.8) : price

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={sectionRef} className="reveal text-center mb-4">
          <h2
            className={`text-3xl sm:text-4xl font-black ${isRTL ? 'font-arabic' : ''}`}
            style={{ color: '#F0F0FF', letterSpacing: '-0.03em' }}
          >
            {t.pricing.title}
          </h2>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className="text-sm font-medium" style={{ color: !annual ? '#F0F0FF' : 'rgba(240,240,255,0.4)' }}>
            {t.pricing.monthly}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 rounded-full transition-colors duration-300"
            style={{ background: annual ? '#00FFB2' : 'rgba(255,255,255,0.1)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
              style={{ [isRTL ? 'right' : 'left']: annual ? 26 : 4 }}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: annual ? '#F0F0FF' : 'rgba(240,240,255,0.4)' }}>
            {t.pricing.annual}
            {annual && (
              <span className="ms-2 text-xs font-semibold" style={{ color: '#00FFB2' }}>
                ({t.pricing.annualSave})
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {t.pricing.plans.map((plan, i) => (
            <PricingCard
              key={i}
              plan={plan}
              price={getPrice(plan.price)}
              origPrice={plan.price}
              annual={annual}
              isRTL={isRTL}
              t={t}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({
  plan, price, origPrice, annual, isRTL, t, delay,
}: {
  plan: { popular?: boolean; nameAr: string; desc: string; price: number; features: string[] }
  price: number
  origPrice: number
  annual: boolean
  isRTL: boolean
  t: { pricing: { monthly: string; mostPopular: string; startFree: string } }
  delay: number
}) {
  const ref = useReveal()

  if (plan.popular) {
    return (
      <div
        ref={ref}
        className="reveal relative rounded-2xl p-[2px] flex flex-col"
        style={{
          background: 'conic-gradient(from var(--angle, 0deg), #00FFB2, #BF00FF, #00FFB2)',
          animation: 'rotateBorder 3s linear infinite',
          transform: 'scale(1.03)',
          animationDelay: `${delay}s`,
        }}
      >
        {/* Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className="text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
              color: '#050508',
              boxShadow: '0 0 20px rgba(0,255,178,0.3)',
            }}
          >
            {t.pricing.mostPopular}
          </span>
        </div>

        <div
          className="flex flex-col h-full rounded-[14px] p-6"
          style={{ background: '#141424' }}
        >
          <CardInner plan={plan} price={price} origPrice={origPrice} annual={annual} isRTL={isRTL} t={t} popular />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="reveal card-hover rounded-2xl p-6 flex flex-col"
      style={{ background: '#0F0F1A', animationDelay: `${delay}s` }}
    >
      <CardInner plan={plan} price={price} origPrice={origPrice} annual={annual} isRTL={isRTL} t={t} />
    </div>
  )
}

function CardInner({
  plan, price, origPrice, annual, isRTL, t, popular = false,
}: {
  plan: { popular?: boolean; nameAr: string; desc: string; price: number; features: string[] }
  price: number
  origPrice: number
  annual: boolean
  isRTL: boolean
  t: { pricing: { monthly: string; startFree: string } }
  popular?: boolean
}) {
  return (
    <>
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-1" style={{ color: '#F0F0FF' }}>{plan.nameAr}</h3>
        <p className="text-xs mb-4" style={{ color: 'rgba(240,240,255,0.4)' }}>{plan.desc}</p>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black" style={{ color: '#F0F0FF', letterSpacing: '-0.03em' }}>
            ${price}
          </span>
          <span className="text-sm mb-2" style={{ color: 'rgba(240,240,255,0.4)' }}>/{t.pricing.monthly}</span>
        </div>
        {annual && (
          <p className="text-xs mt-1" style={{ color: '#00FFB2' }}>بدلاً من ${origPrice}</p>
        )}
      </div>

      <ul className="space-y-3 flex-1 mb-6">
        {plan.features.map((f, j) => (
          <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,240,255,0.55)' }}>
            <span style={{ color: popular ? '#00FFB2' : '#00FFB2', fontSize: 14 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className="block text-center py-3 rounded-xl text-sm font-bold transition-all duration-200"
        style={
          popular
            ? {
                background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                color: '#050508',
              }
            : {
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
                background: 'transparent',
              }
        }
        onMouseEnter={e => {
          if (!popular) {
            e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)'
            e.currentTarget.style.color = '#00FFB2'
          } else {
            e.currentTarget.style.opacity = '0.9'
          }
        }}
        onMouseLeave={e => {
          if (!popular) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = '#F0F0FF'
          } else {
            e.currentTarget.style.opacity = '1'
          }
        }}
      >
        {t.pricing.startFree}
      </Link>
    </>
  )
}
