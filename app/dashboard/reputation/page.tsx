'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { LightningIcon, InboxIcon, StarIcon, TrendUpIcon } from '../../../components/ui/DashboardIcons'

const OUTCOME_MAP = {
  redirected: { ar: 'وُجِّه لـ Google',    en: 'Sent to Google',  color: 'var(--accent)', bg: 'var(--accent-subtle)', icon: 'check' },
  complaint:  { ar: 'شكوى خاصة — تنبيه',  en: 'Private complaint',color: 'var(--accent)', bg: 'var(--accent-subtle)', icon: 'alert' },
  pending:    { ar: 'لم يرد بعد',          en: 'No response yet', color: 'var(--text-tertiary)', bg: 'var(--divider)', icon: 'clock' },
}

const STATUS_MAP = {
  replied: { ar: 'تم الرد', en: 'Replied', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  draft:   { ar: 'مسودة جاهزة', en: 'Draft ready', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  pending: { ar: 'لم يُرد بعد', en: 'Needs reply', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          size={14}
          style={{ color: i < n ? 'var(--accent)' : 'var(--border)' }}
        />
      ))}
    </div>
  )
}

export default function ReputationPage() {
  const { isRTL } = useLang()
  const [followupOn, setFollowupOn] = useState(true)
  const [expandedReview, setExpandedReview] = useState<number | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getToken = () => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  useEffect(() => {
    fetchReputationData()
  }, [])

  const fetchReputationData = async () => {
    try {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      // TODO: Implement backend endpoint for reviews
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // })
      // if (res.ok) {
      //   const data = await res.json()
      //   setReviews(data.reviews || [])
      //   setFollowups(data.followups || [])
      // }
    } catch (err) {
      console.error('Failed to fetch reputation data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <StarIcon size={24} style={{ color: 'var(--accent)' }} />, label: isRTL ? 'تقييمك الحالي' : 'Current Rating', value: '—', color: 'var(--accent)' },
          { icon: <InboxIcon size={24} style={{ color: 'var(--accent)' }} />, label: isRTL ? 'تقييمات الشهر' : 'Reviews this month', value: '0', color: 'var(--accent)' },
          { icon: <LightningIcon size={24} style={{ color: 'var(--accent)' }} />, label: isRTL ? 'شكاوى حُلّت خاصةً' : 'Private resolutions', value: '0', color: 'var(--accent)' },
          { icon: <TrendUpIcon size={24} style={{ color: 'var(--warning)' }} />, label: isRTL ? 'وُجِّهوا لـ Google' : 'Sent to Google', value: '0', color: 'var(--warning)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-os p-4 rounded-2xl"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{s.label.toUpperCase()}</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Reviews */}
      <div className="card-os rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <h2 className="text-2xl font-black tracking-[-0.03em] flex items-center gap-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            <StarIcon size={16} style={{ color: 'var(--accent)' }} />
            {isRTL ? 'تقييمات Google' : 'Google Reviews'}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <StarIcon size={32} style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
            {reviews.map(r => {
              const s = STATUS_MAP[r.status as keyof typeof STATUS_MAP]
              const expanded = expandedReview === r.id
              return (
                <div key={r.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: 'var(--border)', color: 'var(--text-primary)' }}>
                      {r.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.name || 'Anonymous'}</span>
                        <Stars n={r.rating || 5} />
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {r.date ? new Date(r.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : ''}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: s.bg, color: s.color }}>
                          {isRTL ? s.ar : s.en}
                        </span>
                      </div>
                      <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>{r.text || ''}</p>
                    </div>
                  </div>
                  {r.status !== 'replied' && (
                    <div className="flex gap-2 mr-12">
                      <button onClick={() => setExpandedReview(expanded ? null : r.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold btn-ghost"
                        style={{ color: 'var(--accent)' }}>
                        {isRTL ? 'عرض الرد المقترح' : 'View AI Reply'}
                      </button>
                      {expanded && r.reply && (
                        <button className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)', color: 'var(--accent)' }}>
                          {isRTL ? 'نشر الرد' : 'Publish Reply'}
                        </button>
                      )}
                    </div>
                  )}
                  {expanded && r.reply && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 mr-12 p-3 rounded-xl"
                      style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-subtle)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <LightningIcon size={12} style={{ color: 'var(--accent)' }} />
                        <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                          {isRTL ? 'رد مقترح من الذكاء الاصطناعي' : 'AI-suggested reply'}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.reply}</p>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Follow-up campaigns */}
      <div className="card-os rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--divider)' }}>
          <div>
            <h2 className="text-2xl font-black tracking-[-0.03em] flex items-center gap-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              <InboxIcon size={16} style={{ color: 'var(--accent)' }} />
              {isRTL ? 'حملة المتابعة التلقائية' : 'Auto Follow-up Campaign'}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'أرسل للعميل قبل أن يشتكي' : 'Reach out before they complain'}
            </p>
          </div>
          <button onClick={() => setFollowupOn(o => !o)}
            className="relative w-12 h-6 rounded-full transition-all duration-200"
            style={{ background: followupOn ? 'var(--accent)' : 'var(--border)' }}>
            <div className="absolute top-1 transition-all duration-200 w-4 h-4 rounded-full"
              style={{ background: followupOn ? 'var(--text-primary)' : 'var(--text-tertiary)', left: followupOn ? 'auto' : 4, right: followupOn ? 4 : 'auto' }} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'يُرسل رسالة تلقائية بعد 2 ساعة من اكتمال الطلب' : 'Sends auto message 2 hours after order completion'}
          </p>
          <div className="space-y-2">
            {followups.map((f, i) => {
              const o = OUTCOME_MAP[f.outcome as keyof typeof OUTCOME_MAP]
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--divider)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                  <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.sent}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: o.bg, color: o.color }}>
                    {isRTL ? o.ar : o.en}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
