'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

function useRevealSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

export default function PricingDeployment() {
  const { t, isRTL } = useLang()
  const [annual, setAnnual] = useState(false)
  const { ref, visible } = useRevealSection()

  const getPrice = (price: number) => annual ? Math.round(price * 0.8) : price

  return (
    <section
      id="pricing"
      ref={ref}
      className={`py-28 relative overflow-hidden os-section ${visible ? 'visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass"
            style={{ border: '1px solid rgba(198,255,0,0.15)' }}>
            <span style={{ color: '#C6FF00' }}>⬡</span>
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#C6FF00' }}>
              {isRTL ? 'نشر بنية الذكاء الاصطناعي' : 'DEPLOY AI INFRASTRUCTURE'}
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}
          >
            {isRTL ? 'اختر مستوى التفعيل.' : 'Choose your activation tier.'}
          </h2>
          <p className="text-lg max-w-lg mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isRTL
              ? 'كل خطة وحدة ذكاء مستقلة — جاهزة للنشر فوراً.'
              : 'Each plan is a standalone AI module — ready to deploy instantly.'}
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium" style={{ color: !annual ? '#F5F5F5' : 'rgba(255,255,255,0.4)' }}>
              {t.pricing.monthly}
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{ background: annual ? '#C6FF00' : 'rgba(255,255,255,0.1)' }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-black transition-all duration-300"
                style={{ [isRTL ? 'right' : 'left']: annual ? 26 : 4 }}
              />
            </button>
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: annual ? '#F5F5F5' : 'rgba(255,255,255,0.4)' }}>
              {t.pricing.annual}
              {annual && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(198,255,0,0.12)', color: '#C6FF00' }}>
                  {t.pricing.annualSave}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start pt-10">
          {t.pricing.plans.map((plan, i) => {
            const price = getPrice(plan.price)
            const isPopular = !!plan.popular

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="relative"
                style={{ transform: isPopular ? 'scale(1.04)' : undefined }}
              >
                {/* Module frame */}
                {isPopular ? (
                  <div className="animated-border rounded-2xl p-[2px]">
                    <PlanCard plan={plan} price={price} annual={annual} isPopular isRTL={isRTL} t={t} />
                  </div>
                ) : (
                  <PlanCard plan={plan} price={price} annual={annual} isPopular={false} isRTL={isRTL} t={t} />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          className="text-center mt-12 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-6">
            {[
              { icon: '🔒', text_ar: 'بدون بطاقة ائتمان', text_en: 'No credit card' },
              { icon: '✓',  text_ar: '14 يوم مجاني',      text_en: '14-day free trial' },
              { icon: '⚡', text_ar: 'إلغاء في أي وقت',   text_en: 'Cancel anytime' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: '#C6FF00' }}>{item.icon}</span>
                <span>{isRTL ? item.text_ar : item.text_en}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PlanCard({ plan, price, annual, isPopular, isRTL, t }: {
  plan: { nameAr: string; desc: string; price: number; features: string[]; popular?: boolean }
  price: number
  annual: boolean
  isPopular: boolean
  isRTL: boolean
  t: { pricing: { monthly: string; mostPopular: string; startFree: string } }
}) {
  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col h-full ${isPopular ? '' : 'card-os'}`}
      style={{
        background: isPopular ? 'rgba(22,22,22,0.98)' : 'rgba(17,17,17,0.75)',
        border: isPopular ? 'none' : '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span
            className="text-xs font-bold px-4 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #C6FF00, #7DF9FF)', color: '#050505' }}
          >
            {t.pricing.mostPopular}
          </span>
        </div>
      )}

      {/* Module ID */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            MODULE
          </div>
          <h3 className="text-lg font-black" style={{ color: isPopular ? '#C6FF00' : '#F5F5F5' }}>
            {plan.nameAr}
          </h3>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: isPopular ? 'rgba(198,255,0,0.1)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span style={{ color: isPopular ? '#C6FF00' : 'rgba(255,255,255,0.3)', fontSize: 14 }}>◈</span>
        </div>
      </div>

      <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.desc}</p>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span
            className="text-4xl font-black"
            style={{ color: isPopular ? '#C6FF00' : '#F5F5F5', letterSpacing: '-0.04em' }}
          >
            ${price}
          </span>
          <span className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>/{t.pricing.monthly}</span>
        </div>
        {annual && (
          <div className="text-xs mt-1" style={{ color: '#C6FF00' }}>
            {isRTL ? `بدلاً من $${plan.price}` : `Was $${plan.price}`}
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((f, j) => (
          <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span style={{ color: '#C6FF00', fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* Deploy button */}
      <Link
        href="/register"
        className="block text-center py-3 rounded-xl text-sm font-bold transition-all duration-200"
        style={isPopular
          ? { background: 'linear-gradient(135deg, #C6FF00, #7DF9FF)', color: '#050505' }
          : { border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5', background: 'rgba(255,255,255,0.02)' }
        }
        onMouseEnter={e => {
          if (!isPopular) {
            e.currentTarget.style.borderColor = 'rgba(198,255,0,0.3)'
            e.currentTarget.style.color = '#C6FF00'
          }
        }}
        onMouseLeave={e => {
          if (!isPopular) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = '#F5F5F5'
          }
        }}
      >
        {isRTL ? 'تفعيل الوحدة' : 'Deploy Module'}
      </Link>
    </div>
  )
}
