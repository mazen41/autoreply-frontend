'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { TrendUpIcon, LightningIcon, InboxIcon, ReportsIcon } from '../../../components/ui/DashboardIcons'
import ChannelIcon from '../../../components/ui/ChannelIcon'

const RANGES = ['هذا الأسبوع', 'هذا الشهر', 'آخر 3 أشهر']
const RANGES_EN = ['This Week', 'This Month', 'Last 3 Months']
const RANGE_DAYS = [7, 30, 90]

const CHANNEL_COLORS: Record<string, string> = {
  instagram: '#D62976',
  gmail:     '#EA4335',
  facebook:  '#0E7AFE',
  whatsapp:  '#25D366',
  telegram:  '#0088cc',
  tiktok:    '#ff0050',
}

function MiniAreaChart({ data, color = '#0E7AFE' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 400, h = 80
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v / max) * (h - 12)),
  ])
  const line = `M${pts.map(([x, y]) => `${x},${y}`).join('L')}`
  const area = `${line}V${h}H0Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 72 }}>
      <defs>
        <linearGradient id={`areaGrad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#areaGrad-${color.slice(1)})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => (
        i === pts.length - 1 && (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        )
      ))}
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

  useEffect(() => { fetchReports() }, [range])

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) { setError('Please login to view reports'); setLoading(false); return }

      const days = RANGE_DAYS[range]
      const lang = isRTL ? 'ar' : 'en'
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const [dailyRes, channelRes, aiRes, questionsRes, timeRes] = await Promise.all([
        fetch(`${API}/api/reports/daily-messages?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/channel-breakdown`,           { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/ai-performance`,              { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/top-questions?limit=5`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/time-saved?lang=${lang}`,     { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (dailyRes.ok)     { const j = await dailyRes.json();     setDailyData(j.data || []) }
      if (channelRes.ok)   { const j = await channelRes.json();   setChannelData(j.channels || []) }
      if (aiRes.ok)        { const j = await aiRes.json();        setAiPerformance(j) }
      if (questionsRes.ok) { const j = await questionsRes.json(); setTopQuestions(j.questions || []) }
      if (timeRes.ok)      { const j = await timeRes.json();      setTimeSaved(j) }
    } catch (err) {
      setError('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format: 'pdf' | 'csv') {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (!token) return
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/reports/export/${format}?type=messages`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = `report_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch { alert(isRTL ? 'فشل التصدير' : 'Export failed') }
  }

  const maxMsg = channelData.length > 0 ? Math.max(...channelData.map((c: any) => c.messages_count)) : 0

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <p className="text-sm text-text-secondary">{error}</p>
      <button onClick={fetchReports} className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110">Retry</button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header + range picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">
            {isRTL ? 'التقارير والتحليلات' : 'Reports & Analytics'}
          </h2>
          <p className="text-sm text-text-secondary">
            {isRTL ? 'تتبع أداء المنصة في الوقت الفعلي' : 'Track your platform performance over time'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {(isRTL ? RANGES : RANGES_EN).map((r, i) => (
            <button
              key={i}
              onClick={() => setRange(i)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                range === i
                  ? 'bg-accent/15 border-accent/25 text-accent'
                  : 'bg-white/[0.02] border-white/[0.05] text-text-secondary hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary row */}
      {aiPerformance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRTL ? 'إجمالي الرسائل' : 'Total Messages',   value: aiPerformance.total_messages,             icon: '💬' },
            { label: isRTL ? 'ردود تلقائية'   : 'Auto Replies',      value: aiPerformance.auto_replies,               icon: '⚡', accent: true },
            { label: isRTL ? 'معدل التشغيل'   : 'AI Rate',           value: `${aiPerformance.auto_reply_rate}%`,       icon: '🤖', accent: true },
            { label: isRTL ? 'متوسط وقت الرد' : 'Avg Reply Time',    value: aiPerformance.avg_response_time_formatted, icon: '⏱️' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4 bg-[#14151D] border border-white/[0.04] space-y-1"
            >
              <div className="text-base">{kpi.icon}</div>
              <div className={`text-xl font-black ${kpi.accent ? 'text-accent' : 'text-white'}`}>{kpi.value}</div>
              <div className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">{kpi.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts row: Daily messages + Channel breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Line chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 bg-[#14151D] border border-white/[0.04] space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{isRTL ? 'الرسائل اليومية' : 'Daily Messages'}</div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                {isRTL ? 'خلال الفترة المحددة' : `Over the last ${RANGE_DAYS[range]} days`}
              </div>
            </div>
            <div className="text-xl font-black text-accent">
              {dailyData.reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
          </div>
          <MiniAreaChart data={dailyData.length > 0 ? dailyData : [0, 0]} color="#0E7AFE" />
        </motion.div>

        {/* Bar breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
          className="rounded-2xl p-5 bg-[#14151D] border border-white/[0.04] space-y-4"
        >
          <div className="text-xs font-bold text-white">{isRTL ? 'توزيع حسب القناة' : 'By Channel'}</div>
          {channelData.length === 0 ? (
            <p className="text-xs text-text-secondary">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
          ) : (
            <div className="space-y-3">
              {channelData.map((c: any, i: number) => {
                const color = CHANNEL_COLORS[c.type] || '#0E7AFE'
                const pct = maxMsg > 0 ? Math.round((c.messages_count / maxMsg) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <ChannelIcon type={c.type} size={22} className="rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-white capitalize">{c.type}</span>
                        <span className="text-text-secondary">{c.messages_count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.04]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom row: top questions + time saved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Questions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-5 bg-[#14151D] border border-white/[0.04] space-y-4"
        >
          <div className="text-xs font-bold text-white">{isRTL ? 'أكثر الأسئلة تكراراً' : 'Top Questions'}</div>
          {topQuestions.length === 0 ? (
            <p className="text-xs text-text-secondary">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
          ) : (
            <div className="space-y-3">
              {topQuestions.map((q: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black text-text-tertiary flex-shrink-0">#{i + 1}</span>
                      <span className="text-xs text-white truncate">{q.question}</span>
                    </div>
                    <span className="text-[10px] font-bold text-accent flex-shrink-0">{q.count}</span>
                  </div>
                  <div className="h-0.5 rounded-full bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-[#8B3FFB]"
                      initial={{ width: 0 }}
                      animate={{ width: topQuestions.length > 0 ? `${(q.count / topQuestions[0].count) * 100}%` : '0%' }}
                      transition={{ delay: 0.4 + i * 0.07, duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Time Saved Highlight Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="rounded-2xl p-5 bg-gradient-to-br from-accent/10 to-[#8B3FFB]/10 border border-accent/15 space-y-4 relative overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-2">
            <LightningIcon size={14} />
            <div className="text-xs font-bold text-accent">{isRTL ? 'الوقت الذي وفّره البوت' : 'Time Saved by AI'}</div>
          </div>
          {timeSaved ? (
            <div className="grid grid-cols-2 gap-4 relative">
              {[
                { label: isRTL ? 'رسائل أُجيب عليها' : 'Messages Handled', value: timeSaved.messages_handled, big: false },
                { label: isRTL ? 'متوسط الوقت اليدوي' : 'Avg Manual Time',  value: timeSaved.avg_manual_reply_time, big: false },
                { label: isRTL ? 'وقت وُفِّر / شهر' : 'Time Saved / Month', value: `${timeSaved.time_saved_hours}h`, big: true },
                { label: isRTL ? 'القيمة التقديرية' : 'Est. Value',          value: timeSaved.estimated_value_formatted, big: true },
              ].map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <div className={`font-black ${item.big ? 'text-2xl text-accent' : 'text-base text-white'}`}>{item.value}</div>
                  <div className="text-[9px] text-text-secondary uppercase font-bold tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
          )}
        </motion.div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] text-white transition-all"
        >
          <ReportsIcon size={14} />
          {isRTL ? 'تصدير PDF' : 'Export PDF'}
        </button>
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-accent/15 border border-accent/25 text-accent hover:brightness-110 transition-all"
        >
          <ReportsIcon size={14} />
          {isRTL ? 'تصدير Excel' : 'Export Excel'}
        </button>
      </div>
    </div>
  )
}
