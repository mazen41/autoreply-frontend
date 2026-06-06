'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

const FEED_ITEMS = [
  { platform: 'WhatsApp',  icon: '💬', name: 'Ahmed K.',    msgAr: 'هل التوصيل متاح؟',            msgEn: 'Is delivery available?',      status: 'responded', time: '2s' },
  { platform: 'Instagram', icon: '📸', name: 'سارة م.',      msgAr: 'ما هي ساعات العمل؟',           msgEn: 'What are your hours?',        status: 'processing', time: '5s' },
  { platform: 'Email',     icon: '📧', name: 'Nora H.',     msgAr: 'أريد حجز طاولة لـ 4 أشخاص',   msgEn: 'Book table for 4',            status: 'responded', time: '8s' },
  { platform: 'Website',   icon: '🌐', name: 'خالد ع.',      msgAr: 'كم سعر الباقة الأعمال؟',       msgEn: 'Business plan price?',        status: 'lead',       time: '12s' },
  { platform: 'WhatsApp',  icon: '💬', name: 'Omar F.',     msgAr: 'شكراً على الرد السريع!',        msgEn: 'Thanks for the quick reply!', status: 'closed',    time: '18s' },
  { platform: 'Instagram', icon: '📸', name: 'ريم س.',       msgAr: 'هل لديكم منتجات جديدة؟',       msgEn: 'Any new products?',           status: 'responded', time: '22s' },
  { platform: 'Email',     icon: '📧', name: 'Faris B.',    msgAr: 'أريد إلغاء الطلب رقم 4421',   msgEn: 'Cancel order #4421',          status: 'processing', time: '29s' },
]

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; bg: string }> = {
  received:   { label: 'Received',   labelAr: 'واصلت',    color: '#7DF9FF', bg: 'rgba(125,249,255,0.08)' },
  processing: { label: 'Processing', labelAr: 'يعالج...',  color: '#C6FF00', bg: 'rgba(198,255,0,0.08)' },
  responded:  { label: 'Responded',  labelAr: 'تم الرد',   color: '#C6FF00', bg: 'rgba(198,255,0,0.08)' },
  lead:       { label: 'Lead ⚡',    labelAr: 'عميل محتمل', color: '#FFD700', bg: 'rgba(255,215,0,0.08)' },
  closed:     { label: 'Closed',     labelAr: 'مغلق',      color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)' },
}

const PLATFORM_COLORS: Record<string, string> = {
  WhatsApp: '#25D366', Instagram: '#E1306C', Email: '#7DF9FF', Website: '#C6FF00',
}

export default function ActivityStream() {
  const { isRTL } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeItems, setActiveItems] = useState<typeof FEED_ITEMS>([])
  const [processingIdx, setProcessingIdx] = useState<number | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // Cycle through feed items
  useEffect(() => {
    if (!visible) return
    let idx = 0
    const add = () => {
      setActiveItems(prev => {
        const next = [FEED_ITEMS[idx], ...prev].slice(0, 6)
        return next
      })
      setProcessingIdx(idx)
      setTimeout(() => setProcessingIdx(null), 1500)
      idx = (idx + 1) % FEED_ITEMS.length
    }
    add()
    const interval = setInterval(add, 2200)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <section
      ref={sectionRef}
      className={`py-28 relative overflow-hidden os-section ${visible ? 'visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass"
            style={{ border: '1px solid rgba(125,249,255,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#7DF9FF' }} />
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#7DF9FF' }}>
              {isRTL ? 'بث مباشر' : 'LIVE ACTIVITY STREAM'}
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}
          >
            {isRTL ? 'رسائل تتحول إلى نتائج' : 'Messages become outcomes.'}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isRTL
              ? 'كل قناة تتدفق في نظام واحد. الذكاء الاصطناعي يعالج. النتائج تظهر.'
              : 'Every channel flows into one system. AI processes. Results appear.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* Feed */}
          <div className="relative">
            {/* Channel icons header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {isRTL ? 'القنوات المتصلة' : 'CONNECTED CHANNELS'}
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              {Object.entries(PLATFORM_COLORS).map(([name, color]) => (
                <div
                  key={name}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Live feed items */}
            <div className="space-y-2 min-h-[400px]">
              {activeItems.map((item, i) => {
                const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.received
                const isProcessing = processingIdx !== null && FEED_ITEMS[processingIdx] === item
                return (
                  <motion.div
                    key={`${item.name}-${i}`}
                    initial={{ opacity: 0, x: isRTL ? -40 : 40, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-4 p-4 rounded-2xl glass card-os"
                    style={{ background: 'rgba(17,17,17,0.8)' }}
                  >
                    {/* Platform icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        background: `${PLATFORM_COLORS[item.platform]}15`,
                        border: `1px solid ${PLATFORM_COLORS[item.platform]}25`,
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: '#F5F5F5' }}>{item.name}</span>
                        <span className="text-xs" style={{ color: PLATFORM_COLORS[item.platform] }}>
                          {item.platform}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {isRTL ? item.msgAr : item.msgEn}
                      </p>
                    </div>

                    {/* AI Processing indicator */}
                    {isProcessing && (
                      <div className="flex items-center gap-1">
                        {[0,1,2].map(j => (
                          <div key={j} style={{
                            width: 5, height: 5, borderRadius: '50%', background: '#C6FF00',
                            animation: `typingDot 1.2s ease ${j * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <div
                      className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {isRTL ? s.labelAr : s.label}
                    </div>

                    {/* Time */}
                    <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {item.time}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* AI Processing panel */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* AI Brain card */}
            <div
              className="rounded-2xl p-5 glass animated-border"
              style={{ background: 'rgba(17,17,17,0.9)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(198,255,0,0.1)', border: '1px solid rgba(198,255,0,0.2)' }}
                >
                  <span style={{ color: '#C6FF00', fontSize: 18 }}>🧠</span>
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
                    {isRTL ? 'نواة الذكاء الاصطناعي' : 'AI Core Processing'}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {isRTL ? 'يعمل بتفاني كامل' : 'Running at full capacity'}
                  </div>
                </div>
                <div className="ms-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
                  <span className="text-xs" style={{ color: '#C6FF00' }}>Live</span>
                </div>
              </div>

              {/* Progress bars */}
              {[
                { label: isRTL ? 'تحليل النص' : 'Text Analysis', pct: 94, color: '#C6FF00' },
                { label: isRTL ? 'توليد الرد' : 'Response Gen', pct: 88, color: '#7DF9FF' },
                { label: isRTL ? 'إدارة السياق' : 'Context Mgmt', pct: 97, color: '#C6FF00' },
              ].map((bar, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{bar.label}</span>
                    <span style={{ color: bar.color }}>{bar.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: bar.color, boxShadow: `0 0 8px ${bar.color}60` }}
                      initial={{ width: 0 }}
                      animate={visible ? { width: `${bar.pct}%` } : {}}
                      transition={{ duration: 1.2, delay: 0.5 + i * 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats mini */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: '99.9%', label: isRTL ? 'نسبة التشغيل' : 'Uptime', color: '#C6FF00' },
                { val: '<10ms', label: isRTL ? 'زمن الاستجابة' : 'Latency', color: '#7DF9FF' },
                { val: '128',   label: isRTL ? 'نموذج AI' : 'Model Size', color: '#C6FF00' },
                { val: '4.9★',  label: isRTL ? 'رضا العملاء' : 'Satisfaction', color: '#7DF9FF' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl text-center card-os glass"
                  style={{ background: 'rgba(17,17,17,0.7)' }}
                >
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
