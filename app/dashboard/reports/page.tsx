'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const RANGES = ['هذا الأسبوع', 'هذا الشهر', 'آخر 3 أشهر']
const RANGES_EN = ['This week', 'This month', 'Last 3 months']

const DAILY_DATA = [12, 19, 8, 24, 31, 18, 27, 22, 35, 29, 41, 38, 24, 33, 27, 45, 52, 38, 44, 36, 29, 47, 53, 41, 38, 44, 47, 39, 43, 37]

const CHANNEL_DATA = [
  { ch: '📸', name: 'Instagram', msgs: 340, color: '#E1306C' },
  { ch: '📧', name: 'Gmail',     msgs: 287, color: '#EA4335' },
  { ch: '🔵', name: 'Facebook',  msgs: 220, color: '#1877F2' },
]

const TOP_QUESTIONS = [
  { q: 'ما هي ساعات العمل؟',     qEn: 'What are your hours?',         count: 89 },
  { q: 'هل يوجد توصيل؟',         qEn: 'Do you deliver?',              count: 67 },
  { q: 'كم سعر الوجبة؟',         qEn: 'What is the meal price?',      count: 45 },
  { q: 'هل يوجد حجز مسبق؟',      qEn: 'Do you take reservations?',    count: 38 },
  { q: 'أين موقعكم؟',             qEn: 'Where are you located?',       count: 29 },
]

function MiniLineChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const w = 400, h = 80
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 12)}`)
  const area = `M${pts.join('L')}V${h}H0Z`
  const line = `M${pts.join('L')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C6FF00" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#C6FF00" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)"/>
      <path d={line} fill="none" stroke="#C6FF00" strokeWidth="2"/>
    </svg>
  )
}

export default function ReportsPage() {
  const { isRTL } = useLang()
  const [range, setRange] = useState(1)

  const maxMsg = Math.max(...CHANNEL_DATA.map(c => c.msgs))

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Range picker */}
      <div className="flex gap-1.5">
        {(isRTL ? RANGES : RANGES_EN).map((r, i) => (
          <button key={i} onClick={() => setRange(i)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: range === i ? 'rgba(198,255,0,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${range === i ? 'rgba(198,255,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: range === i ? '#C6FF00' : 'rgba(255,255,255,0.45)',
            }}>
            {r}
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
              {isRTL ? 'الرسائل اليومية' : 'Daily Messages'}
            </h3>
            <span className="text-2xl font-black" style={{ color: '#C6FF00' }}>847</span>
          </div>
          <MiniLineChart data={DAILY_DATA} />
        </motion.div>

        {/* Bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#F5F5F5' }}>
            {isRTL ? 'توزيع حسب القناة' : 'By Channel'}
          </h3>
          <div className="space-y-3">
            {CHANNEL_DATA.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-6">{c.ch}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: c.color }}
                    initial={{ width: 0 }} animate={{ width: `${(c.msgs / maxMsg) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <span className="text-sm font-bold w-10 text-right" style={{ color: '#F5F5F5' }}>{c.msgs}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Performance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="p-5 rounded-2xl"
        style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#F5F5F5' }}>
          {isRTL ? '🤖 أداء الذكاء الاصطناعي' : '🤖 AI Performance'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: isRTL ? 'الرسائل الواردة' : 'Total messages',      value: '847', color: '#F5F5F5' },
            { label: isRTL ? 'ردود تلقائية' : 'Auto-replies',           value: '791 (93.4%)', color: '#C6FF00' },
            { label: isRTL ? 'مسودات مُوافق عليها' : 'Drafts approved', value: '38', color: '#7DF9FF' },
            { label: isRTL ? 'تدخل يدوي' : 'Manual intervention',       value: '18', color: '#FFA500' },
            { label: isRTL ? 'متوسط وقت الرد' : 'Avg reply time',       value: '6.2s', color: '#C6FF00' },
            { label: isRTL ? 'متوسط السوق' : 'Market average',           value: '4.3h', color: 'rgba(255,255,255,0.4)' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</div>
              <div className="text-lg font-black" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top questions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="p-5 rounded-2xl"
        style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#F5F5F5' }}>
          {isRTL ? '❓ أكثر الأسئلة تكراراً' : '❓ Top Questions'}
        </h3>
        <div className="space-y-3">
          {TOP_QUESTIONS.map((q, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-black w-5 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>#{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: '#F5F5F5' }}>{isRTL ? q.q : q.qEn}</span>
                  <span className="text-xs font-bold" style={{ color: '#C6FF00' }}>{q.count}</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #C6FF00, #7DF9FF)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(q.count / TOP_QUESTIONS[0].count) * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.07, duration: 0.8 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Time saved */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl relative overflow-hidden"
        style={{ background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.15)' }}>
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(198,255,0,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <h3 className="text-sm font-bold mb-4 relative" style={{ color: '#C6FF00' }}>
          ⏱️ {isRTL ? 'الوقت الذي وفّره البوت' : 'Time Saved by the Bot'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {[
            { label: isRTL ? 'رسائل أُجيب عليها' : 'Messages handled', value: '791' },
            { label: isRTL ? 'متوسط وقت الرد يدوياً' : 'Avg manual time', value: '3 دقائق' },
            { label: isRTL ? 'وقت وُفِّر هذا الشهر' : 'Time saved/month', value: '39.5h', highlight: true },
            { label: isRTL ? 'القيمة التقديرية' : 'Estimated value', value: '3,950 ريال', highlight: true },
          ].map((item, i) => (
            <div key={i}>
              <div className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</div>
              <div className="text-xl font-black" style={{ color: item.highlight ? '#C6FF00' : '#F5F5F5' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Export */}
      <div className="flex gap-3">
        {[
          { icon: '📄', ar: 'تصدير PDF', en: 'Export PDF', color: '#FF3B30', bg: 'rgba(255,59,48,0.07)', border: 'rgba(255,59,48,0.2)' },
          { icon: '📊', ar: 'تصدير Excel', en: 'Export Excel', color: '#C6FF00', bg: 'rgba(198,255,0,0.07)', border: 'rgba(198,255,0,0.2)' },
        ].map((btn, i) => (
          <button key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: btn.bg, border: `1px solid ${btn.border}`, color: btn.color }}>
            {btn.icon} {isRTL ? btn.ar : btn.en}
          </button>
        ))}
      </div>
    </div>
  )
}
