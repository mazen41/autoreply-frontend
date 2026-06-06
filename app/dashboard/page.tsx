'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

function StatCard({ icon, label, value, sub, color = '#C6FF00', delay = 0 }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string; delay?: number
}) {
  const isNum = typeof value === 'number'
  const counted = useCountUp(isNum ? value : 0)
  return (
    <motion.div className="rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, filter: 'blur(20px)' }} />
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-[11px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
        {label.toUpperCase()}
      </div>
      <div className="text-3xl font-black mb-1" style={{ color: '#F5F5F5' }}>
        {isNum ? counted : value}
      </div>
      {sub && <div className="text-xs font-semibold" style={{ color }}>{sub}</div>}
    </motion.div>
  )
}

const RECENT_CONVS = [
  { ch: '📸', name: 'أحمد الشمري', preview: 'متى تفتحون؟ أريد حجز طاولة...', time: '2د', status: 'auto' },
  { ch: '📧', name: 'sara@gmail.com', preview: 'Do you deliver to Riyadh?', time: '15د', status: 'draft' },
  { ch: '🔵', name: 'محمد العتيبي', preview: 'شكراً جزيلاً على الخدمة الممتازة', time: '1س', status: 'auto' },
  { ch: '📸', name: 'Lina Hassan', preview: 'What are your prices for catering?', time: '2س', status: 'alert' },
  { ch: '📧', name: 'info@example.com', preview: 'بخصوص الطلب رقم #1204...', time: 'أمس', status: 'auto' },
]

const STATUS_MAP: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
  auto:  { label: 'تم الرد', labelEn: 'Auto-replied', color: '#C6FF00', bg: 'rgba(198,255,0,0.1)' },
  draft: { label: 'مسودة',   labelEn: 'Draft',        color: '#FFA500', bg: 'rgba(255,165,0,0.1)' },
  alert: { label: 'تنبيه',   labelEn: 'Alert',        color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
}

const CHECKLIST = [
  { ar: 'أنشأت حسابك',           en: 'Account created',            done: true },
  { ar: 'أكملت بيانات العمل',    en: 'Business info completed',    done: true },
  { ar: 'ربطت Gmail',            en: 'Connected Gmail',            done: true },
  { ar: 'استقبل أول رسالة',     en: 'Received first message',     done: false },
  { ar: 'شاهد أول رد تلقائي',   en: 'Saw first auto-reply',       done: false },
  { ar: 'اربط قناة ثانية',       en: 'Connect a second channel',   done: false },
]

const CHANNELS_STATUS = [
  { icon: '📸', name: 'Instagram', color: '#E1306C', connected: true, msgs: 124 },
  { icon: '📧', name: 'Gmail',     color: '#EA4335', connected: true, msgs: 89 },
  { icon: '🔵', name: 'Facebook',  color: '#1877F2', connected: false, msgs: 0 },
  { icon: '⭐', name: 'Google Reviews', color: '#FBBC05', connected: false, msgs: 0 },
]

export default function DashboardHome() {
  const { isRTL } = useLang()

  const allDone = CHECKLIST.every(c => c.done)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💬" label={isRTL ? 'الرسائل اليوم' : "Today's Messages"} value={47} sub="↑ 12%" color="#C6FF00" delay={0} />
        <StatCard icon="🤖" label={isRTL ? 'تم الرد تلقائياً' : 'Auto-replied'} value={43} sub={isRTL ? '91% معدل الرد' : '91% reply rate'} color="#7DF9FF" delay={0.08} />
        <StatCard icon="⏱️" label={isRTL ? 'ساعات وُفِّرت' : 'Hours Saved'} value="3.2h" sub={isRTL ? 'هذا الأسبوع' : 'This week'} color="#FF9500" delay={0.16} />
        <StatCard icon="⭐" label={isRTL ? 'تقييم Google' : 'Google Rating'} value="4.7" sub="↑ +0.2" color="#FBBC05" delay={0.24} />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent conversations */}
        <motion.div className="lg:col-span-3 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
              {isRTL ? 'آخر المحادثات' : 'Recent Conversations'}
            </h2>
            <Link href="/dashboard/inbox" className="text-xs font-bold" style={{ color: '#C6FF00' }}>
              {isRTL ? 'عرض الكل ←' : 'View all →'}
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {RECENT_CONVS.map((c, i) => {
              const s = STATUS_MAP[c.status]
              return (
                <Link key={i} href="/dashboard/inbox"
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span className="text-xl flex-shrink-0">{c.ch}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ color: '#F5F5F5' }}>{c.name}</span>
                      <span className="text-[11px] flex-shrink-0 mr-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.time}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.preview}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: s.bg, color: s.color }}>
                    {isRTL ? s.label : s.labelEn}
                  </span>
                </Link>
              )
            })}
          </div>
        </motion.div>

        {/* Getting started checklist */}
        {!allDone && (
          <motion.div className="lg:col-span-2 rounded-2xl p-5"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-bold mb-1" style={{ color: '#F5F5F5' }}>
              {isRTL ? '🚀 ابدأ من هنا' : '🚀 Getting Started'}
            </h2>
            <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isRTL ? `${CHECKLIST.filter(c => c.done).length} من ${CHECKLIST.length} مكتملة` : `${CHECKLIST.filter(c => c.done).length} of ${CHECKLIST.length} complete`}
            </p>
            {/* Progress bar */}
            <div className="h-1 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(CHECKLIST.filter(c => c.done).length / CHECKLIST.length) * 100}%`, background: 'linear-gradient(to right, #C6FF00, #7DF9FF)' }} />
            </div>
            <div className="space-y-2.5">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.done ? 'rgba(198,255,0,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${item.done ? '#C6FF00' : 'rgba(255,255,255,0.1)'}` }}>
                    {item.done && <span style={{ color: '#C6FF00', fontSize: 10 }}>✓</span>}
                  </div>
                  <span className="text-xs" style={{ color: item.done ? 'rgba(255,255,255,0.5)' : '#F5F5F5', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {isRTL ? item.ar : item.en}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Channel status */}
        <motion.div className="rounded-2xl p-5"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
              {isRTL ? '🔗 حالة القنوات' : '🔗 Channel Status'}
            </h2>
            <Link href="/dashboard/channels" className="text-xs font-bold" style={{ color: '#C6FF00' }}>
              {isRTL ? 'إدارة' : 'Manage'}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CHANNELS_STATUS.map((ch, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${ch.color}15` }}>
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: '#F5F5F5' }}>{ch.name}</div>
                  {ch.connected ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {ch.msgs} {isRTL ? 'رسالة' : 'msgs'}
                      </span>
                    </div>
                  ) : (
                    <Link href="/dashboard/channels"
                      className="text-[10px] font-bold mt-0.5 inline-block"
                      style={{ color: '#C6FF00' }}>
                      + {isRTL ? 'ربط' : 'Connect'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top question */}
        <motion.div className="rounded-2xl p-5"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#F5F5F5' }}>
            {isRTL ? '🔥 السؤال الأكثر هذا الأسبوع' : '🔥 Top Question This Week'}
          </h2>
          <div className="p-4 rounded-xl mb-4"
            style={{ background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.12)' }}>
            <p className="text-sm font-bold mb-1" style={{ color: '#C6FF00' }}>
              {isRTL ? '"ما هي ساعات العمل لديكم؟"' : '"What are your working hours?"'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isRTL ? 'سُئل 18 مرة هذا الأسبوع' : 'Asked 18 times this week'}
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(255,160,0,0.05)', border: '1px solid rgba(255,160,0,0.12)' }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <p className="text-xs" style={{ color: 'rgba(255,160,0,0.85)' }}>
              {isRTL
                ? 'أضف إجابة أوضح لساعات العمل في إعدادات الذكاء الاصطناعي'
                : 'Add a clearer working hours answer in AI Settings'}
            </p>
          </div>
          <Link href="/dashboard/settings"
            className="mt-3 block text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = 'rgba(198,255,0,0.3)'; e.currentTarget.style.color = '#C6FF00' }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
            {isRTL ? 'تحديث إعدادات الذكاء الاصطناعي ←' : 'Update AI Settings →'}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
