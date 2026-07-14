'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const OUTCOME_MAP = {
  redirected: { ar: 'وُجِّه لـ Google',    en: 'Sent to Google',  color: '#C6FF00', bg: 'rgba(198,255,0,0.08)', icon: '🟢' },
  complaint:  { ar: 'شكوى خاصة — تنبيه',  en: 'Private complaint',color: '#FF3B30', bg: 'rgba(255,59,48,0.08)', icon: '🔴' },
  pending:    { ar: 'لم يرد بعد',          en: 'No response yet', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', icon: '⚪' },
}

const STATUS_MAP = {
  replied: { ar: 'تم الرد', en: 'Replied', color: '#C6FF00', bg: 'rgba(198,255,0,0.08)' },
  draft:   { ar: 'مسودة جاهزة', en: 'Draft ready', color: '#7DF9FF', bg: 'rgba(125,249,255,0.08)' },
  pending: { ar: 'لم يُرد بعد', en: 'Needs reply', color: '#FF3B30', bg: 'rgba(255,59,48,0.08)' },
}

function Stars({ n }: { n: number }) {
  return <span>{Array.from({ length: 5 }, (_, i) => <span key={i} style={{ color: i < n ? '#FBBC05' : 'rgba(255,255,255,0.15)', fontSize: 14 }}>★</span>)}</span>
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

      // For now, this is a placeholder - would need actual API endpoints
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
          { icon: '⭐', label: isRTL ? 'تقييمك الحالي' : 'Current Rating', value: '4.7', color: '#FBBC05' },
          { icon: '📝', label: isRTL ? 'تقييمات الشهر' : 'Reviews this month', value: '+12', color: '#C6FF00' },
          { icon: '🛡️', label: isRTL ? 'شكاوى حُلّت خاصةً' : 'Private resolutions', value: '8', color: '#7DF9FF' },
          { icon: '🔗', label: isRTL ? 'وُجِّهوا لـ Google' : 'Sent to Google', value: '23', color: '#FF9500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 rounded-2xl"
            style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label.toUpperCase()}</div>
            <div className="text-2xl font-black" style={{ color: '#F5F5F5' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Reviews */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
            {isRTL ? '⭐ تقييمات Google' : '⭐ Google Reviews'}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6FF00]"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isRTL ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {reviews.map(r => {
              const s = STATUS_MAP[r.status as keyof typeof STATUS_MAP]
              const expanded = expandedReview === r.id
              return (
                <div key={r.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#F5F5F5' }}>
                      {r.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: '#F5F5F5' }}>{r.name || 'Anonymous'}</span>
                        <Stars n={r.rating || 5} />
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {r.date ? new Date(r.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : ''}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: s.bg, color: s.color }}>
                          {isRTL ? s.ar : s.en}
                        </span>
                      </div>
                      <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.text || ''}</p>
                    </div>
                  </div>
                  {r.status !== 'replied' && (
                    <div className="flex gap-2 mr-12">
                      <button onClick={() => setExpandedReview(expanded ? null : r.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(125,249,255,0.08)', border: '1px solid rgba(125,249,255,0.2)', color: '#7DF9FF' }}>
                        {isRTL ? 'عرض الرد المقترح' : 'View AI Reply'}
                      </button>
                      {expanded && r.reply && (
                        <button className="px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #C6FF00, #a8e000)', color: '#050508' }}>
                          {isRTL ? 'نشر الرد' : 'Publish Reply'}
                        </button>
                      )}
                    </div>
                  )}
                  {expanded && r.reply && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 mr-12 p-3 rounded-xl"
                      style={{ background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.12)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span style={{ fontSize: 12 }}>⚡</span>
                        <span className="text-[11px] font-bold" style={{ color: '#C6FF00' }}>
                          {isRTL ? 'رد مقترح من الذكاء الاصطناعي' : 'AI-suggested reply'}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{r.reply}</p>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Follow-up campaigns */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#F5F5F5' }}>
              {isRTL ? '📬 حملة المتابعة التلقائية' : '📬 Auto Follow-up Campaign'}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isRTL ? 'أرسل للعميل قبل أن يشتكي' : 'Reach out before they complain'}
            </p>
          </div>
          <button onClick={() => setFollowupOn(o => !o)}
            className="relative w-12 h-6 rounded-full transition-all duration-200"
            style={{ background: followupOn ? '#C6FF00' : 'rgba(255,255,255,0.1)' }}>
            <div className="absolute top-1 transition-all duration-200 w-4 h-4 rounded-full"
              style={{ background: followupOn ? '#050505' : 'rgba(255,255,255,0.4)', left: followupOn ? 'auto' : 4, right: followupOn ? 4 : 'auto' }} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {isRTL ? 'يُرسل رسالة تلقائية بعد 2 ساعة من اكتمال الطلب' : 'Sends auto message 2 hours after order completion'}
          </p>
          <div className="space-y-2">
            {followups.map((f, i) => {
              const o = OUTCOME_MAP[f.outcome as keyof typeof OUTCOME_MAP]
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span>{o.icon}</span>
                  <span className="text-sm font-semibold flex-1" style={{ color: '#F5F5F5' }}>{f.name}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{f.sent}</span>
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
