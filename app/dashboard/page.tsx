'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import ChannelIcon from '../../components/ui/ChannelIcon'
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
      className="card-os rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
      style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="shimmer-line absolute inset-0" />
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ 
            background: trend.isPositive ? 'rgba(0,214,143,0.1)' : 'rgba(255,77,109,0.1)',
            color: trend.isPositive ? '#00D68F' : '#FF4D6D'
          }}>
            {trend.isPositive ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'rgba(136,136,170,0.8)' }}>
        {label}
      </div>
      
      <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent)' }}>
        {isNum ? counted : value}
      </div>
      
      {sub && (
        <div className="text-xs font-semibold" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <ChannelIcon type={item.channel?.type || 'facebook'} size={24} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold truncate" style={{ color: '#F0F0FF' }}>
            {item.sender_name}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            <LightningIcon size={10} />
            AI
          </div>
        </div>
        <p className="text-xs truncate" style={{ color: 'rgba(136,136,170,0.6)' }}>
          {item.message_preview}
        </p>
      </div>
      <span className="text-xs" style={{ color: 'rgba(136,136,170,0.4)' }}>
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
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <ChannelIcon type={channel.type || 'facebook'} size={24} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: '#F0F0FF' }}>
          {channel.page_name || channel.type}
        </div>
        <div className="text-xs" style={{ color: 'rgba(136,136,170,0.6)' }}>
          {channel.type || 'Unknown'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full status-live" style={{ background: '#3B82F6' }} />
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
        const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
        
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

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        
        if (inboxRes.ok) {
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
        
        if (channelsRes.ok) {
          const channelsData = await channelsRes.json()
          setChannels(channelsData.data || [])
        }
      } catch (err) {
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
            <div key={i} className="rounded-2xl p-5 h-32 animate-pulse" style={{ background: 'rgba(17,17,17,0.7)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="card-os rounded-2xl p-6 text-center" style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-sm mb-4" style={{ color: 'rgba(136,136,170,0.8)' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-lime px-4 py-2 rounded-lg text-sm font-bold"
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
          icon={<InboxIcon size={20} style={{ color: '#3B82F6' }} />}
        />
        <StatCard 
          label={t.dashboard.aiReplies} 
          value={stats?.ai_replies || 0} 
          sub={`${stats?.response_rate || 0}% ${t.dashboard.responseRate}`} 
          delay={0.08}
          icon={<LightningIcon size={20} style={{ color: '#60A5FA' }} />}
        />
        <StatCard 
          label={isRTL ? 'ساعات وُفِّرت' : 'Hours Saved'} 
          value={stats?.hours_saved || '0'} 
          sub={isRTL ? 'هذا الأسبوع' : 'This week'} 
          delay={0.16}
          icon={<TrendUpIcon size={20} style={{ color: '#FFB800' }} />}
        />
        <StatCard 
          label={isRTL ? 'القنوات النشطة' : 'Active Channels'} 
          value={channels.length} 
          sub={isRTL ? 'متصل' : 'Connected'} 
          delay={0.24}
          icon={<ChannelsIcon size={20} style={{ color: '#00D68F' }} />}
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
          style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <h2 className="text-sm font-bold" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
              {isRTL ? 'نشاط الذكاء الاصطناعي' : 'AI Activity Feed'}
            </h2>
            <Link href="/dashboard/inbox" className="text-xs font-bold btn-ghost px-3 py-1.5 rounded-lg">
              {isRTL ? 'عرض الكل ←' : 'View all →'}
            </Link>
          </div>
          
          <div className="p-4 space-y-2">
            {activity.length === 0 ? (
              <div className="text-center py-8">
                <LightningIcon size={32} style={{ color: 'rgba(136,136,170,0.3)' }} />
                <p className="text-sm mt-3" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
          style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <h2 className="text-sm font-bold" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
              {isRTL ? 'حالة القنوات' : 'Channel Status'}
            </h2>
            <Link href="/dashboard/channels" className="btn-ghost p-2 rounded-lg">
              <PlusIcon size={18} />
            </Link>
          </div>
          
          <div className="p-4 space-y-2">
            {channels.length === 0 ? (
              <div className="text-center py-8">
                <ChannelsIcon size={32} style={{ color: 'rgba(136,136,170,0.3)' }} />
                <p className="text-sm mt-3" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
          <div className="p-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full status-live" style={{ background: '#10B981' }} />
                <div className="absolute inset-0 w-3 h-3 rounded-full" style={{ 
                  background: '#10B981',
                  animation: 'energyPulse 2s ease-out infinite'
                }} />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: '#F0F0FF' }}>
                  {isRTL ? 'الذكاء الاصطناعي نشط' : 'AI Active'}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
          style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <h2 className="text-2xl font-bold" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
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
            <div className="flex justify-between mt-2 text-xs" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
          style={{ background: 'rgba(17,17,17,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <h2 className="text-2xl font-bold" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
              {isRTL ? 'أكثر المرسلين' : 'Top Senders'}
            </h2>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {topSenders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ 
                      background: i < 3 ? 'var(--accent)' : 'rgba(136,136,170,0.3)',
                      color: i < 3 ? '#FFFFFF' : '#F0F0FF'
                    }}>
                      {i + 1}
                    </div>
                    <ChannelIcon type={sender.channel?.type || 'facebook'} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: '#F0F0FF' }}>
                        {sender.name}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
    </div>
  )
}
