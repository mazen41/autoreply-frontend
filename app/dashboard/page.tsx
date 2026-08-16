'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import ChannelIcon from '../../components/ui/ChannelIcon'
import WebChatWidget from '../../components/webchat/WebChatWidget'
import {
  LightningIcon,
  TrendUpIcon,
  TrendDownIcon,
  PlusIcon,
  InboxIcon,
  ChannelsIcon
} from '../../components/ui/DashboardIcons'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

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

function StatCard({
  label,
  value,
  sub,
  delay = 0,
  trend,
  icon
}: {
  label: string
  value: string | number
  sub?: string
  delay?: number
  trend?: { value: number; isPositive: boolean }
  icon: React.ReactNode
}) {
  const isNum = typeof value === 'number'
  const counted = useCountUp(isNum ? value : 0)

  return (
    <motion.div
      className="relative overflow-hidden border border-white/[0.05] bg-[#14151D] rounded-2xl p-5 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Brand accent hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-[#8B3FFB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-accent group-hover:border-accent/20 group-hover:bg-accent/5 transition-colors">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
            trend.isPositive 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {trend.isPositive ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="text-[10px] font-black mb-1 uppercase tracking-widest text-text-secondary relative z-10">
        {label}
      </div>

      <div className="text-3xl font-black mb-1.5 text-white tracking-tight relative z-10">
        {isNum ? counted : value}
      </div>

      {sub && (
        <div className="text-xs text-text-tertiary relative z-10">
          {sub}
        </div>
      )}
    </motion.div>
  )
}

function ActivityFeedItem({ item, index }: { item: any; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] transition-all group"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] group-hover:border-accent/20 transition-all">
        <ChannelIcon type={item.channel?.type || 'facebook'} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-white truncate">
            {item.sender_name}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/20">
            <LightningIcon size={8} />
            AI Replied
          </span>
        </div>
        <p className="text-xs text-text-secondary truncate">
          {item.message_preview}
        </p>
      </div>
      <span className="text-xs text-text-tertiary">
        {item.time}
      </span>
    </motion.div>
  )
}

function ChannelStatusCard({ channel, index }: { channel: any; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <ChannelIcon type={channel.type || 'facebook'} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate">
          {channel.page_name || channel.type}
        </div>
        <div className="text-[10px] text-text-secondary capitalize mt-0.5">
          {channel.type || 'Unknown'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>
    </motion.div>
  )
}

export default function DashboardHome() {
  const { isRTL, t } = useLang()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [topSenders, setTopSenders] = useState<any[]>([])
  const [chartData, setChartData] = useState<number[]>([40, 35, 45, 30, 38, 42, 35])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        if (!token) return

        const [statsRes, inboxRes, channelsRes, reportsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/stats`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/inbox`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/channels`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/ai-performance`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
        ])

        if (!statsRes.ok) {
          console.error('Stats API failed:', statsRes.status)
          setStats({ total_messages: 0, ai_replies: 0, hours_saved: 0, messages_trend: null, response_rate: 0 })
        } else {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (!inboxRes.ok) {
          console.error('Inbox API failed:', inboxRes.status)
          setActivity([])
        } else {
          const inboxData = await inboxRes.json()
          const allConversations = inboxData.data || []
          setActivity(allConversations.slice(0, 5) || [])

          // Calculate top senders
          const senderCounts = new Map<string, { count: number; channel: any; name: string }>()
          allConversations.forEach((conv: any) => {
            const senderKey = conv.sender_id
            const existing = senderCounts.get(senderKey)
            if (existing) {
              existing.count++
            } else {
              senderCounts.set(senderKey, {
                count: 1,
                channel: conv.channel,
                name: conv.sender_name || conv.sender_id
              })
            }
          })

          const sortedSenders = Array.from(senderCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
          setTopSenders(sortedSenders)
        }

        if (!channelsRes.ok) {
          console.error('Channels API failed:', channelsRes.status)
          setChannels([])
        } else {
          const channelsData = await channelsRes.json()
          setChannels(Array.isArray(channelsData) ? channelsData : channelsData.data || [])
        }

        if (!reportsRes.ok) {
          console.error('Reports API failed:', reportsRes.status)
          setChartData([40, 35, 45, 30, 38, 42, 35])
        } else {
          const reportsData = await reportsRes.json()
          const responseTimes = reportsData.data?.map((item: any) => 
            parseInt(item.avg_response_time_seconds) || 0
          ) || [40, 35, 45, 30, 38, 42, 35]
          setChartData(responseTimes)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
          <div className="h-80 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
          ⚠️
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{isRTL ? 'حدث خطأ' : 'Failed to load Dashboard'}</h3>
        <p className="text-sm text-text-secondary mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl font-bold bg-accent text-white hover:brightness-110 transition-all">
          {t.common.retry}
        </button>
      </div>
    )
  }

  // Calculate efficiency / reply rate
  const autoReplyRate = stats?.response_rate || 87

  // Custom SVG liquid line chart generator
  const maxVal = Math.max(...chartData, 10)
  const chartW = 500, chartH = 160
  const points = chartData.map((v, i) => `${(i / (chartData.length - 1)) * chartW},${chartH - (v / maxVal) * (chartH - 24)}`)
  const chartPath = `M${points.join('L')}`
  const areaPath = `${chartPath} V${chartH} H0 Z`

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Command Hero Header ── */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 rounded-3xl border border-white/[0.05] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(20,21,29,0.8) 0%, rgba(26,27,38,0.8) 100%)', backdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8B3FFB]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="text-xs font-black tracking-widest text-accent uppercase">
            {isRTL ? 'مركز التحكم بالذكاء الاصطناعي' : 'AI Command Center'}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {isRTL ? 'مرحباً بك في ناز للخدمات' : 'Command Center Status'}
          </h2>
          <p className="text-sm text-text-secondary max-w-lg">
            {isRTL 
              ? 'يقوم الذكاء الاصطناعي بمراقبة ومعالجة جميع رسائل عملائك عبر قنوات التواصل المفعلة.'
              : 'The AI brain is active and responding to customer queries in real-time.'}
          </p>
        </div>

        {/* Circular AI Health / Performance Ring */}
        <div className="flex items-center gap-6 mt-6 md:mt-0 bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl relative z-10">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-white/[0.04]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <motion.path 
                className="text-accent" 
                strokeWidth="3.2" 
                strokeDasharray={`${autoReplyRate}, 100`} 
                strokeLinecap="round" 
                stroke="url(#gradientRing)" 
                fill="none" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${autoReplyRate}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0E7AFE" />
                  <stop offset="100%" stopColor="#8B3FFB" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
              {autoReplyRate}%
            </div>
          </div>
          <div>
            <div className="text-xs font-black text-white">{isRTL ? 'معدل الاستجابة التلقائية' : 'AI Autoreply Rate'}</div>
            <div className="text-[10px] text-text-secondary mt-1">
              {isRTL ? 'من إجمالي الرسائل الواردة' : 'Of all incoming messages'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.dashboard.totalMessages}
          value={stats?.total_messages || 0}
          trend={stats?.messages_trend}
          delay={0}
          icon={<InboxIcon size={20} />}
        />
        <StatCard
          label={t.dashboard.aiReplies}
          value={stats?.ai_replies || 0}
          sub={`${stats?.response_rate || 0}% ${t.dashboard.responseRate}`}
          delay={0.08}
          icon={<LightningIcon size={20} />}
        />
        <StatCard
          label={isRTL ? 'ساعات وُفِّرت' : 'Hours Saved'}
          value={stats?.hours_saved || 0}
          sub={isRTL ? 'هذا الأسبوع' : 'This week'}
          delay={0.16}
          icon={<TrendUpIcon size={20} />}
        />
        <StatCard
          label={isRTL ? 'القنوات النشطة' : 'Active Channels'}
          value={channels.length}
          sub={isRTL ? 'متصل ومحمي' : 'Connected & secure'}
          delay={0.24}
          icon={<ChannelsIcon size={20} />}
        />
      </div>

      {/* ── Middle Row: AI Activity Feed & Channel Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live AI Activity Feed */}
        <motion.div
          className="lg:col-span-2 rounded-2xl border border-white/[0.05] bg-[#14151D] overflow-hidden flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isRTL ? 'نشاط الذكاء الاصطناعي الحي' : 'Live AI Activity Feed'}
              </h3>
            </div>
            <Link href="/dashboard/inbox" className="text-xs font-bold text-accent hover:brightness-110 transition-all">
              {isRTL ? 'لوحة الرسائل ←' : 'Inbox Console →'}
            </Link>
          </div>

          <div className="p-4 space-y-1.5 flex-1">
            {activity.length === 0 ? (
              <div className="text-center py-16">
                <LightningIcon size={32} className="text-text-tertiary mx-auto mb-3 animate-pulse" />
                <p className="text-xs text-text-secondary">
                  {isRTL ? 'بانتظار الرسائل الواردة...' : 'Waiting for incoming messages...'}
                </p>
              </div>
            ) : (
              activity.map((item, i) => (
                <ActivityFeedItem key={i} item={item} index={i} />
              ))
            )}
          </div>
        </motion.div>

        {/* Channels Control Panel */}
        <motion.div
          className="rounded-2xl border border-white/[0.05] bg-[#14151D] overflow-hidden flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.04]">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isRTL ? 'حالة القنوات' : 'Channel Connections'}
            </h3>
            <Link href="/dashboard/channels" className="p-1 rounded-lg hover:bg-white/[0.03] text-text-secondary hover:text-white transition-all">
              <PlusIcon size={18} />
            </Link>
          </div>

          <div className="p-4 space-y-2 flex-1">
            {channels.length === 0 ? (
              <div className="text-center py-12">
                <ChannelsIcon size={32} className="text-text-tertiary mx-auto mb-3" />
                <p className="text-xs text-text-secondary">
                  {isRTL ? 'لا توجد قنوات متصلة بعد' : 'No connected channels yet'}
                </p>
                <Link href="/dashboard/channels" className="inline-block mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-accent text-white hover:brightness-110 transition-all">
                  {isRTL ? 'ربط قناة جديدة' : 'Connect Channel'}
                </Link>
              </div>
            ) : (
              channels.map((channel, i) => (
                <ChannelStatusCard key={i} channel={channel} index={i} />
              ))
            )}
          </div>

          {/* Bottom energy signal */}
          <div className="p-4 bg-white/[0.01] border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-white">
                  {isRTL ? 'مزامنة نشطة' : 'Live Syncing'}
                </div>
                <div className="text-[9px] text-text-tertiary truncate">
                  {isRTL ? 'كل القنوات تعمل بكفاءة' : 'All channels are fully functional'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row: Liquid Chart & Top Senders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Custom Liquid Response Time Chart */}
        <motion.div
          className="rounded-2xl border border-white/[0.05] bg-[#14151D] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="px-6 py-4.5 border-b border-white/[0.04]">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isRTL ? 'وقت استجابة النظام' : 'Average System Response Time'}
            </h3>
          </div>

          <div className="p-6">
            <div className="relative h-40">
              <svg className="w-full h-full" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0E7AFE" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8B3FFB" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0E7AFE" />
                    <stop offset="100%" stopColor="#8B3FFB" />
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <motion.path 
                  d={areaPath} 
                  fill="url(#chartGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                />
                {/* Smooth line */}
                <motion.path 
                  d={chartPath} 
                  fill="none" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            </div>
            <div className="flex justify-between mt-4 text-xs text-text-secondary font-semibold">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Senders list */}
        <motion.div
          className="rounded-2xl border border-white/[0.05] bg-[#14151D] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <div className="px-6 py-4.5 border-b border-white/[0.04]">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isRTL ? 'أكثر العملاء تفاعلاً' : 'Most Active Customers'}
            </h3>
          </div>

          <div className="p-4 space-y-1">
            {topSenders.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-tertiary">
                {isRTL ? 'لا توجد بيانات تفاعل بعد' : 'No customer interactions recorded yet'}
              </div>
            ) : (
              topSenders.map((sender, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.01] transition-all border border-transparent hover:border-white/[0.03]"
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black bg-gradient-to-br from-accent to-[#8B3FFB] text-white">
                    {i + 1}
                  </div>
                  <div className="p-1 rounded-lg bg-white/[0.02]">
                    <ChannelIcon type={sender.channel?.type || 'facebook'} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {sender.name}
                    </div>
                    <div className="text-[9px] text-text-tertiary capitalize mt-0.5">
                      {sender.channel?.type || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-xs font-black text-accent bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/15">
                    {sender.count} {isRTL ? 'رسائل' : 'msgs'}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <WebChatWidget />
    </div>
  )
}
