'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useLang } from '../../lib/LangContext'

const FLOW_STEPS = [
  { icon: '💬', labelAr: 'رسالة واردة',     labelEn: 'Incoming Message',  desc_ar: 'واتساب، انستغرام، إيميل', desc_en: 'WhatsApp, Instagram, Email' },
  { icon: '🧠', labelAr: 'تحليل الذكاء',     labelEn: 'AI Analysis',       desc_ar: 'النية، السياق، الأولوية', desc_en: 'Intent, context, priority' },
  { icon: '⚡', labelAr: 'إجراء تلقائي',     labelEn: 'Auto Action',       desc_ar: 'رد، تصنيف، إشعار', desc_en: 'Reply, classify, notify' },
  { icon: '🎯', labelAr: 'نتيجة محققة',      labelEn: 'Result Achieved',   desc_ar: 'عميل راضٍ، عقد محتمل', desc_en: 'Satisfied customer, lead' },
]

const AUTOMATIONS = [
  {
    icon: '⏰',
    titleAr: 'الرد بعد الدوام',
    titleEn: 'After-Hours Reply',
    descAr: 'يرد على كل رسالة خارج ساعات العمل فوراً',
    descEn: 'Instantly replies to every message outside business hours',
    trigger_ar: 'بعد الساعة 9م',
    trigger_en: 'After 9PM',
    result_ar: '100% ردود',
    result_en: '100% coverage',
  },
  {
    icon: '⭐',
    titleAr: 'استرداد التقييمات',
    titleEn: 'Review Recovery',
    descAr: 'يكتشف عدم الرضا ويتصل بالعميل قبل التقييم السلبي',
    descEn: 'Detects dissatisfaction and contacts customers before bad reviews',
    trigger_ar: 'إشارات سلبية',
    trigger_en: 'Negative signals',
    result_ar: '-60% تقييمات سلبية',
    result_en: '-60% bad reviews',
  },
  {
    icon: '💰',
    titleAr: 'أتمتة المبيعات',
    titleEn: 'Sales Automation',
    descAr: 'يحول الاستفسارات إلى مبيعات بمسار منظم',
    descEn: 'Converts inquiries into sales through a structured funnel',
    trigger_ar: 'سؤال عن سعر',
    trigger_en: 'Price inquiry',
    result_ar: '+35% معدل تحويل',
    result_en: '+35% conversion',
  },
]

export default function AutomationEcosystem() {
  const { isRTL } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => setActiveStep(s => (s + 1) % FLOW_STEPS.length), 1400)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <section
      ref={sectionRef}
      className={`py-28 relative overflow-hidden os-section ${visible ? 'visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass"
            style={{ border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--accent)' }}>◈</span>
            <span className="text-xs font-semibold tracking-widest" style={{ color: 'var(--accent)' }}>
              {isRTL ? 'نظام الأتمتة' : 'AUTOMATION ECOSYSTEM'}
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}
          >
            {isRTL ? 'الرسالة تصل. الذكاء يعمل.' : 'Message in. Magic out.'}
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isRTL
              ? 'مسارات تلقائية تعمل في الخلفية، بدون تدخل منك.'
              : 'Automated workflows running silently in the background — without you.'}
          </p>
        </div>

        {/* Main flow diagram */}
        <div className="relative mb-20">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div
                  className="flex-1 flex flex-col items-center gap-3"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`,
                  }}
                >
                  <div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-500"
                    style={{
                      background: activeStep === i
                        ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                        : 'var(--surface)',
                      border: `2px solid ${activeStep === i ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: activeStep === i ? '0 0 40px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
                    }}
                  >
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <div
                      className="text-xs sm:text-sm font-bold mb-1 transition-colors duration-300"
                      style={{ color: activeStep === i ? 'var(--accent)' : 'var(--text-primary)' }}
                    >
                      {isRTL ? step.labelAr : step.labelEn}
                    </div>
                    <div className="text-xs hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
                      {isRTL ? step.desc_ar : step.desc_en}
                    </div>
                  </div>
                </div>

                {i < FLOW_STEPS.length - 1 && (
                  <div className="flex-shrink-0 flex flex-col items-center gap-1" style={{ width: 40 }}>
                    <div className="relative w-full h-1 rounded-full" style={{ background: 'var(--divider)' }}>
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{ width: '30%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', left: visible ? '35%' : '-30%', transition: 'left 0.6s ease' }}
                      />
                    </div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                      {isRTL ? '←' : '→'}
                    </span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Automation cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {AUTOMATIONS.map((auto, i) => (
            <div
              key={i}
              className="card-os rounded-2xl p-5 glass group"
              style={{
                background: 'var(--surface)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.6s ease ${0.4 + i * 0.12}s, transform 0.6s ease ${0.4 + i * 0.12}s`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)' }}
                >
                  {auto.icon}
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                >
                  {isRTL ? auto.trigger_ar : auto.trigger_en}
                </div>
              </div>

              <h3 className="text-base font-black mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {isRTL ? auto.titleAr : auto.titleEn}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? auto.descAr : auto.descEn}
              </p>

              <div
                className="flex items-center gap-2 pt-4"
                style={{ borderTop: '1px solid var(--divider)' }}
              >
                <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {isRTL ? auto.result_ar : auto.result_en}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
