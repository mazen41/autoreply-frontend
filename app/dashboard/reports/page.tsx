'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { TrendUpIcon, LightningIcon, InboxIcon, ReportsIcon } from '../../../components/ui/DashboardIcons'

const RANGES = ['هذا الأسبوع', 'هذا الشهر', 'آخر 3 أشهر']
const RANGES_EN = ['This week', 'This month', 'Last 3 months']

const RANGE_DAYS = [7, 30, 90]

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [dailyData, setDailyData] = useState<number[]>([])
  const [channelData, setChannelData] = useState<any[]>([])
  const [aiPerformance, setAiPerformance] = useState<any>(null)
  const [topQuestions, setTopQuestions] = useState<any[]>([])
  const [timeSaved, setTimeSaved] = useState<any>(null)

  useEffect(() => {
    fetchReports()
  }, [range])

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) {
        setError('Please login to view reports')
        setLoading(false)
        return
      }

      const days = RANGE_DAYS[range]
      const lang = isRTL ? 'ar' : 'en'

      const [dailyRes, channelRes, aiRes, questionsRes, timeRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/daily-messages?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/channel-breakdown`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/ai-performance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/top-questions?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/time-saved?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])

      if (dailyRes.ok) {
        const dailyJson = await dailyRes.json()
        setDailyData(dailyJson.data || [])
      }

      if (channelRes.ok) {
        const channelJson = await channelRes.json()
        setChannelData(channelJson.channels || [])
      }

      if (aiRes.ok) {
        const aiJson = await aiRes.json()
        setAiPerformance(aiJson)
      }

      if (questionsRes.ok) {
        const questionsJson = await questionsRes.json()
        setTopQuestions(questionsJson.questions || [])
      }

      if (timeRes.ok) {
        const timeJson = await timeRes.json()
        setTimeSaved(timeJson)
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  const maxMsg = channelData.length > 0 ? Math.max(...channelData.map((c: any) => c.messages_count)) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6FF00]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(13,13,13,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{error}</p>
          <button onClick={fetchReports} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#C6FF00', color: '#050508' }}>
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Range picker */}
      <div className="flex gap-1.5">
        {(isRTL ? RANGES : RANGES_EN).map((r, i) => (
          <button key={i} onClick={() => setRange(i)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 btn-ghost"
            style={{
              background: range === i ? 'rgba(198,255,0,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${range === i ? 'rgba(198,255,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: range === i ? '#C6FF00' : 'rgba(136,136,170,0.8)',
            }}>
            {r}
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-os p-5 rounded-2xl"
          style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
              {isRTL ? 'الرسائل اليومية' : 'Daily Messages'}
            </h3>
            <span className="text-2xl font-black text-lime">{dailyData.reduce((a, b) => a + b, 0)}</span>
          </div>
          <MiniLineChart data={dailyData.length > 0 ? dailyData : [0]} />
        </motion.div>

        {/* Bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="card-os p-5 rounded-2xl"
          style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
            {isRTL ? 'توزيع حسب القناة' : 'By Channel'}
          </h3>
          {channelData.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(136,136,170,0.6)' }}>
              {isRTL ? 'لا توجد بيانات' : 'No data available'}
            </p>
          ) : (
            <div className="space-y-3">
              {channelData.map((c, i) => {
                const colors: Record<string, string> = {
                  instagram: '#E1306C',
                  gmail: '#EA4335',
                  facebook: '#1877F2',
                  whatsapp: '#25D366',
                }
                const color = colors[c.type] || '#C6FF00'
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${color}20`, color }}>
                      <InboxIcon size={14} />
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: color }}
                        initial={{ width: 0 }} animate={{ width: maxMsg > 0 ? `${(c.messages_count / maxMsg) * 100}%` : '0%' }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: '#F0F0FF' }}>{c.messages_count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Performance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card-os p-5 rounded-2xl"
        style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
          <LightningIcon size={16} style={{ color: '#C6FF00' }} />
          {isRTL ? 'أداء الذكاء الاصطناعي' : 'AI Performance'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {aiPerformance ? [
            { label: isRTL ? 'الرسائل الواردة' : 'Total messages',      value: aiPerformance.total_messages, color: '#F0F0FF' },
            { label: isRTL ? 'ردود تلقائية' : 'Auto-replies',           value: `${aiPerformance.auto_replies} (${aiPerformance.auto_reply_rate}%)`, color: '#C6FF00' },
            { label: isRTL ? 'تدخل يدوي' : 'Manual intervention',       value: aiPerformance.manual_interventions, color: '#FFB800' },
            { label: isRTL ? 'متوسط وقت الرد' : 'Avg reply time',       value: aiPerformance.avg_response_time_formatted, color: '#C6FF00' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'rgba(136,136,170,0.6)' }}>{item.label}</div>
              <div className="text-lg font-black" style={{ color: item.color }}>{item.value}</div>
            </div>
          )) : (
            <p className="text-sm col-span-3" style={{ color: 'rgba(136,136,170,0.6)' }}>
              {isRTL ? 'لا توجد بيانات' : 'No data available'}
            </p>
          )}
        </div>
      </motion.div>

      {/* Top questions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="card-os p-5 rounded-2xl"
        style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
          {isRTL ? 'أكثر الأسئلة تكراراً' : 'Top Questions'}
        </h3>
        {topQuestions.length === 0 ? (
          <p className="text-sm" style={{ color: 'rgba(136,136,170,0.6)' }}>
            {isRTL ? 'لا توجد بيانات' : 'No data available'}
          </p>
        ) : (
          <div className="space-y-3">
            {topQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black w-5 text-center" style={{ color: 'rgba(136,136,170,0.4)' }}>#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: '#F0F0FF' }}>{q.question}</span>
                    <span className="text-xs font-bold text-lime">{q.count}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #C6FF00, #7DF9FF)' }}
                      initial={{ width: 0 }}
                      animate={{ width: topQuestions.length > 0 ? `${(q.count / topQuestions[0].count) * 100}%` : '0%' }}
                      transition={{ delay: 0.4 + i * 0.07, duration: 0.8 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Time saved */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl relative overflow-hidden card-os"
        style={{ background: 'rgba(198,255,0,0.04)', border: '1px solid rgba(198,255,0,0.15)' }}>
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(198,255,0,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <h3 className="text-sm font-bold mb-4 relative flex items-center gap-2" style={{ color: '#C6FF00', letterSpacing: '-0.02em' }}>
          <TrendUpIcon size={16} />
          {isRTL ? 'الوقت الذي وفّره البوت' : 'Time Saved by the Bot'}
        </h3>
        {timeSaved ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {[
              { label: isRTL ? 'رسائل أُجيب عليها' : 'Messages handled', value: timeSaved.messages_handled },
              { label: isRTL ? 'متوسط وقت الرد يدوياً' : 'Avg manual time', value: timeSaved.avg_manual_reply_time },
              { label: isRTL ? 'وقت وُفِّر هذا الشهر' : 'Time saved/month', value: timeSaved.time_saved_hours + 'h', highlight: true },
              { label: isRTL ? 'القيمة التقديرية' : 'Estimated value', value: timeSaved.estimated_value_formatted, highlight: true },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-[11px] mb-1" style={{ color: 'rgba(136,136,170,0.6)' }}>{item.label}</div>
                <div className="text-xl font-black" style={{ color: item.highlight ? '#C6FF00' : '#F0F0FF' }}>{item.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm relative" style={{ color: 'rgba(136,136,170,0.6)' }}>
            {isRTL ? 'لا توجد بيانات' : 'No data available'}
          </p>
        )}
      </motion.div>

      {/* Export */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold btn-ghost">
          <ReportsIcon size={16} />
          {isRTL ? 'تصدير PDF' : 'Export PDF'}
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold btn-lime">
          <ReportsIcon size={16} />
          {isRTL ? 'تصدير Excel' : 'Export Excel'}
        </button>
      </div>
    </div>
  )
}
