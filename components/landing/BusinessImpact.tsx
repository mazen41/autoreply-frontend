'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    const startTime = Date.now()
    const frame = () => {
      const p = Math.min((Date.now() - startTime) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(e * target))
      if (p < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration, start])
  return value
}

const IMPACTS = [
  {
    before: { val: 4.2, label_ar: 'تقييم قبل ناز', label_en: 'Rating before Naz', suffix: '★' },
    after:  { val: 4.9, label_ar: 'تقييم بعد ناز',  label_en: 'Rating after Naz',  suffix: '★' },
    icon: '⭐', title_ar: 'تقييمات أعلى', title_en: 'Higher Ratings', color: '#C6FF00',
  },
  {
    before: { val: 45,  label_ar: 'وقت الرد قبل (دقيقة)', label_en: 'Response time before (min)', suffix: 'm' },
    after:  { val: 8,   label_ar: 'وقت الرد بعد (ثانية)',  label_en: 'Response time after (sec)',  suffix: 's' },
    icon: '⚡', title_ar: 'ردود أسرع', title_en: 'Faster Replies', color: '#7DF9FF',
  },
  {
    before: { val: 12,  label_ar: 'تحويل قبل (%)', label_en: 'Conversion before (%)', suffix: '%' },
    after:  { val: 38,  label_ar: 'تحويل بعد (%)', label_en: 'Conversion after (%)',  suffix: '%' },
    icon: '💰', title_ar: 'مبيعات أكثر', title_en: 'More Sales', color: '#C6FF00',
  },
]

const TESTIMONIALS = [
  {
    name: 'أحمد السالم',
    biz_ar: 'مطعم، الرياض',
    biz_en: 'Restaurant, Riyadh',
    quote_ar: 'بعد ناز أصبحت ردودنا فورية حتى وقت النوم. التقييمات ارتفعت بشكل ملحوظ.',
    quote_en: 'After Naz, our replies became instant even at night. Ratings improved noticeably.',
    rating: 5,
  },
  {
    name: 'سارة المطيري',
    biz_ar: 'عيادة تجميل، جدة',
    biz_en: 'Clinic, Jeddah',
    quote_ar: 'كنت أضيع ساعات يومياً في الرد على نفس الأسئلة. الآن الذكاء الاصطناعي يتكفل بكل شيء.',
    quote_en: 'I used to waste hours daily answering the same questions. Now the AI handles everything.',
    rating: 5,
  },
  {
    name: 'محمد الزهراني',
    biz_ar: 'كافيه، الدمام',
    biz_en: 'Café, Dammam',
    quote_ar: 'نظام استرداد التقييمات أنقذني أكثر من مرة. أعرف بمشكلة العميل قبل أن يتركني تقييماً سيئاً.',
    quote_en: 'The review recovery system has saved me multiple times. I know about issues before bad reviews.',
    rating: 5,
  },
]

export default function BusinessImpact() {
  const { isRTL } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const counts = IMPACTS.map(imp => ({
    before: useCountUp(imp.before.val * 10, 1500, visible),
    after:  useCountUp(imp.after.val * 10,  2000, visible),
  }))

  return (
    <section
      ref={sectionRef}
      className={`py-28 relative overflow-hidden os-section ${visible ? 'visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass"
            style={{ border: '1px solid rgba(125,249,255,0.15)' }}>
            <span style={{ color: '#7DF9FF' }}>◎</span>
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#7DF9FF' }}>
              {isRTL ? 'الأثر على العمل' : 'BUSINESS IMPACT'}
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}
          >
            {isRTL ? 'الأرقام تتحول أمامك.' : 'Watch numbers transform.'}
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isRTL
              ? 'قبل وبعد — نتائج حقيقية من أعمال حقيقية.'
              : 'Before and after — real results from real businesses.'}
          </p>
        </div>

        {/* Before/After impact cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {IMPACTS.map((imp, i) => (
            <motion.div
              key={i}
              className="card-os rounded-2xl p-6 glass"
              style={{ background: 'rgba(17,17,17,0.7)' }}
              initial={{ opacity: 0, y: 40 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
            >
              <div className="text-3xl mb-3">{imp.icon}</div>
              <h3 className="text-base font-black mb-5" style={{ color: imp.color, letterSpacing: '-0.02em' }}>
                {isRTL ? imp.title_ar : imp.title_en}
              </h3>

              {/* Before */}
              <div className="mb-3">
                <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {isRTL ? imp.before.label_ar : imp.before.label_en}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.03em' }}>
                    {(counts[i].before / 10).toFixed(imp.before.val % 1 !== 0 ? 1 : 0)}
                  </span>
                  <span className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{imp.before.suffix}</span>
                </div>
                {/* Bar */}
                <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(imp.before.val / Math.max(imp.before.val, imp.after.val)) * 100}%`,
                      background: 'rgba(255,255,255,0.15)',
                    }}
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="text-center my-2" style={{ color: imp.color, fontSize: 20 }}>↓</div>

              {/* After */}
              <div>
                <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isRTL ? imp.after.label_ar : imp.after.label_en}
                </div>
                <div className="flex items-end gap-1">
                  <motion.span
                    className="text-4xl font-black"
                    style={{ color: imp.color, letterSpacing: '-0.03em' }}
                  >
                    {(counts[i].after / 10).toFixed(imp.after.val % 1 !== 0 ? 1 : 0)}
                  </motion.span>
                  <span className="text-sm mb-1" style={{ color: imp.color + '80' }}>{imp.after.suffix}</span>
                </div>
                {/* Bar */}
                <div className="mt-2 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: imp.color, boxShadow: `0 0 10px ${imp.color}60` }}
                    initial={{ width: 0 }}
                    animate={visible ? { width: `${(imp.after.val / Math.max(imp.before.val, imp.after.val)) * 100}%` } : {}}
                    transition={{ duration: 1.5, delay: 0.3 + i * 0.15 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="card-os rounded-2xl p-5 glass"
              style={{ background: 'rgba(17,17,17,0.6)' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={visible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.12 }}
            >
              <div className="flex mb-3">
                {Array(t.rating).fill(0).map((_, j) => (
                  <span key={j} style={{ color: '#C6FF00', fontSize: 14 }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                &ldquo;{isRTL ? t.quote_ar : t.quote_en}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.15)' }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#F5F5F5' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{isRTL ? t.biz_ar : t.biz_en}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
