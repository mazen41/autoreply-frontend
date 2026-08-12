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
      className="relative overflow-hidden border border-border/60 bg-surface-elevated rounded-2xl p-5 transition-all duration-300 hover:border-accent/25 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-default group"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
    >
      <div className="shimmer-line absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-accent/10 border border-accent/15 text-accent">
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/15 text-accent">
            {trend.isPositive ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="text-[10px] font-bold mb-1.5 uppercase tracking-wider text-text-secondary">
        {label}
      </div>

      <div className="text-3xl font-black mb-1.5 text-text-primary tracking-tight">
        {isNum ? counted : value}
      </div>

      {sub && (
        <div className="text-xs text-text-tertiary">
          {sub}
        </div>
      )}
    </motion.div>
  )
}

function ActivityFeedItem({ item, index }: { item: any; index: number }) {
  return (
    <motion.div
      className="feed-item flex items-center gap-3 p-3 rounded-xl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }}
      style={{ background: 'var(--surface-elevated)', border: '1px solid var(--divider)' }}
    >
      <ChannelIcon type={item.channel?.type || 'facebook'} size={24} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {item.sender_name}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <LightningIcon size={10} />
            AI
          </div>
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {item.message_preview}
        </p>
      </div>
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {item.time}
      </span>
    </motion.div>
  )
}

function ChannelStatusCard({ channel, index }: { channel: any; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{ background: 'var(--surface-elevated)', border: '1px solid var(--divider)' }}
    >
      <ChannelIcon type={channel.type || 'facebook'} size={24} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {channel.page_name || channel.type}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {channel.type || 'Unknown'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full status-live" style={{ background: 'var(--accent)' }} />
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        
        if (!token) {
          console.error('No token found in cookies')
          window.location.href = '/login'
          return
        }

        const [statsRes, inboxRes, channelsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inbox`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/channels`, {
            headers: { Authorization: `Bearer ${token}` }
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

          // Calculate top senders from all conversations
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

          // Convert to array and sort by count
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
          setChannels(channelsData.data || [])
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
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: '8rem' }} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton" style={{ height: '12rem' }} />
          <div className="skeleton" style={{ height: '12rem' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="empty-state alert-error">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="empty-state-title">{isRTL ? 'حدث خطأ' : 'Error'}</h3>
          <p className="empty-state-description">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-lime"
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.dashboard.totalMessages}
          value={stats?.total_messages || 0}
          trend={stats?.messages_trend}
          delay={0}
          icon={<InboxIcon size={20} style={{ color: 'var(--accent)' }} />}
        />
        <StatCard
          label={t.dashboard.aiReplies}
          value={stats?.ai_replies || 0}
          sub={`${stats?.response_rate || 0}% ${t.dashboard.responseRate}`}
          delay={0.08}
          icon={<LightningIcon size={20} style={{ color: 'var(--accent)' }} />}
        />
        <StatCard
          label={isRTL ? 'ساعات وُفِّرت' : 'Hours Saved'}
          value={stats?.hours_saved || '0'}
          sub={isRTL ? 'هذا الأسبوع' : 'This week'}
          delay={0.16}
          icon={<TrendUpIcon size={20} style={{ color: 'var(--accent)' }} />}
        />
        <StatCard
          label={isRTL ? 'القنوات النشطة' : 'Active Channels'}
          value={channels.length}
          sub={isRTL ? 'متصل' : 'Connected'}
          delay={0.24}
          icon={<ChannelsIcon size={20} style={{ color: 'var(--accent)' }} />}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* AI Activity Feed */}
        <motion.div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {isRTL ? 'نشاط الذكاء الاصطناعي' : 'AI Activity Feed'}
            </h2>
            <Link href="/dashboard/inbox" className="text-xs font-bold btn-ghost px-3 py-1.5 rounded-lg">
              {isRTL ? 'عرض الكل ←' : 'View all →'}
            </Link>
          </div>

          <div className="p-4 space-y-2">
            {activity.length === 0 ? (
              <div className="text-center py-8">
                <LightningIcon size={32} style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'لا يوجد نشاط بعد — قم بتوصيل قناة' : 'No activity yet — connect a channel'}
                </p>
              </div>
            ) : (
              activity.map((item, i) => (
                <ActivityFeedItem key={i} item={item} index={i} />
              ))
            )}
          </div>
        </motion.div>

        {/* Channel Status */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {isRTL ? 'حالة القنوات' : 'Channel Status'}
            </h2>
            <Link href="/dashboard/channels" className="btn-ghost p-2 rounded-lg">
              <PlusIcon size={18} />
            </Link>
          </div>

          <div className="p-4 space-y-2">
            {channels.length === 0 ? (
              <div className="text-center py-8">
                <ChannelsIcon size={32} style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'لا توجد قنوات متصلة' : 'No connected channels'}
                </p>
              </div>
            ) : (
              channels.map((channel, i) => (
                <ChannelStatusCard key={i} channel={channel} index={i} />
              ))
            )}
          </div>

          {/* AI Status Indicator */}
          <div className="p-4 mt-2" style={{ borderTop: '1px solid var(--divider)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full status-live" style={{ background: 'var(--accent)' }} />
                <div className="absolute inset-0 w-3 h-3 rounded-full" style={{
                  background: 'var(--accent)',
                  animation: 'energyPulse 2s ease-out infinite'
                }} />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'الذكاء الاصطناعي نشط' : 'AI Active'}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'يعالج الرسائل تلقائياً' : 'Processing messages automatically'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Response Time Chart */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <h2 className="text-2xl font-black tracking-[-0.03em]" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {isRTL ? 'وقت الاستجابة' : 'Response Time'}
            </h2>
          </div>

          <div className="p-4">
            <div className="h-40 flex items-end gap-2">
              {[40, 35, 45, 30, 38, 42, 35].map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                  style={{
                    background: 'var(--accent)',
                    minHeight: '20px'
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Senders */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <h2 className="text-2xl font-black tracking-[-0.03em]" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {isRTL ? 'أكثر المرسلين' : 'Top Senders'}
            </h2>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              {topSenders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}
                  </div>
                </div>
              ) : (
                topSenders.map((sender, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                    style={{
                      background: 'var(--surface-elevated)',
                      borderBottom: i < 3 ? '1px solid var(--divider)' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-elevated)'}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                      background: i < 3 ? 'var(--accent)' : 'var(--text-tertiary)',
                      color: i < 3 ? 'var(--text-primary)' : 'var(--text-primary)'
                    }}>
                      {i + 1}
                    </div>
                    <ChannelIcon type={sender.channel?.type || 'facebook'} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {sender.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {sender.channel?.type || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                      {sender.count}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Web Chat Widget */}
      <WebChatWidget />
    </div>
  )
}
