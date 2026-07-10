'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import ChannelIcon from '../../components/ui/ChannelIcon'

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

function StatCard({ icon, label, value, sub, color = 'var(--primary)', delay = 0, trend }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string; delay?: number; trend?: { value: number; isPositive: boolean }
}) {
  const isNum = typeof value === 'number'
  const counted = useCountUp(isNum ? value : 0)
  return (
    <motion.div className="rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: `0 8px 30px ${color}20` }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)',
        borderTop: `3px solid ${color}`
      }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, filter: 'blur(20px)' }} />
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
        {label.toUpperCase()}
      </div>
      <div className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
        {isNum ? counted : value}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: trend.isPositive ? 'var(--success)' : 'var(--danger)' }}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
      {sub && !trend && <div className="text-xs font-semibold" style={{ color }}>{sub}</div>}
    </motion.div>
  )
}


export default function DashboardHome() {
  const { isRTL, t } = useLang()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])

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
          setConversations(inboxData.data?.slice(0, 5) || [])
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
            <div key={i} className="rounded-2xl p-5 h-32 animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--text-primary)' }}>
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
          icon="💬" 
          label={t.dashboard.totalMessages} 
          value={stats?.total_messages || 0} 
          trend={stats?.messages_trend} 
          color="var(--primary)" 
          delay={0} 
        />
        <StatCard 
          icon="🤖" 
          label={t.dashboard.aiReplies} 
          value={stats?.ai_replies || 0} 
          sub={`${stats?.response_rate || 0}% ${t.dashboard.responseRate}`} 
          color="var(--success)" 
          delay={0.08} 
        />
        <StatCard 
          icon="⏱️" 
          label={isRTL ? 'ساعات وُفِّرت' : 'Hours Saved'} 
          value={stats?.hours_saved || '0'} 
          sub={isRTL ? 'هذا الأسبوع' : 'This week'} 
          color="var(--warning)" 
          delay={0.16} 
        />
        <StatCard 
          icon="⭐" 
          label={isRTL ? 'تقييم Google' : 'Google Rating'} 
          value={stats?.google_rating || '0'} 
          trend={stats?.rating_trend} 
          color="var(--primary)" 
          delay={0.24} 
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent conversations */}
        <motion.div className="lg:col-span-3 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t.dashboard.recentConversations}
            </h2>
            <Link href="/dashboard/inbox" className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {isRTL ? 'عرض الكل ←' : 'View all →'}
            </Link>
          </div>
          {conversations.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm">{t.inbox.noConversations}</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {conversations.map((c, i) => (
                <Link key={i} href={`/dashboard/inbox?conversation=${c.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-all"
                  style={{ borderLeft: '3px solid transparent' }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = 'rgba(108,99,255,0.05)'
                    e.currentTarget.style.borderLeftColor = 'var(--primary)'
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderLeftColor = 'transparent'
                  }}>
                  <ChannelIcon type={(c.channel_type || 'facebook') as any} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.customer_name || 'Unknown'}</span>
                      <span className="text-[11px] flex-shrink-0 mr-2" style={{ color: 'var(--text-secondary)' }}>{c.time_ago || ''}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.last_message || ''}</p>
                  </div>
                  {c.is_active && (
                    <div className="w-2 h-2 rounded-full status-live" style={{ background: 'var(--success)' }} />
                  )}
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Getting started checklist - only show if no channels */}
        {channels.length === 0 && (
          <motion.div className="lg:col-span-2 rounded-2xl p-5"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {t.dashboard.noChannels}
            </h2>
            <p className="text-[11px] mb-4" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'ابدأ بربط قنواتك الأولى' : 'Start by connecting your first channels'}
            </p>
            <Link href="/dashboard/channels"
              className="block w-full py-3 rounded-xl text-center text-sm font-bold animate-pulse"
              style={{ background: 'var(--primary)', color: 'var(--text-primary)' }}>
              {t.dashboard.connectChannel}
            </Link>
          </motion.div>
        )}
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Channel status */}
        <motion.div className="rounded-2xl p-5"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t.channels.title}
            </h2>
            <Link href="/dashboard/channels" className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {t.channels.connect}
            </Link>
          </div>
          {channels.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-4xl mb-3">🔗</div>
              <p className="text-sm">{t.channels.noChannels}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {channels.slice(0, 4).map((ch, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <ChannelIcon type={(ch.type || 'facebook') as any} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{ch.name || ch.type}</div>
                    {ch.connected ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--success)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          {t.channels.connected}
                        </span>
                      </div>
                    ) : (
                      <Link href="/dashboard/channels"
                        className="text-[10px] font-bold mt-0.5 inline-block"
                        style={{ color: 'var(--primary)' }}>
                        + {t.channels.connect}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top question */}
        <motion.div className="rounded-2xl p-5"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isRTL ? '🔥 السؤال الأكثر هذا الأسبوع' : '🔥 Top Question This Week'}
          </h2>
          <div className="p-4 rounded-xl mb-4"
            style={{ background: 'rgba(108,99,255,0.04)', border: '1px solid rgba(108,99,255,0.12)' }}>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--primary)' }}>
              {stats?.top_question || isRTL ? '"ما هي ساعات العمل لديكم؟"' : '"What are your working hours?"'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {stats?.question_count ? `${isRTL ? 'سُئل' : 'Asked'} ${stats.question_count} ${isRTL ? 'مرة' : 'times'} ${isRTL ? 'هذا الأسبوع' : 'this week'}` : isRTL ? 'سُئل 18 مرة هذا الأسبوع' : 'Asked 18 times this week'}
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.12)' }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <p className="text-xs" style={{ color: 'rgba(255,184,0,0.85)' }}>
              {isRTL
                ? 'أضف إجابة أوضح لساعات العمل في إعدادات الذكاء الاصطناعي'
                : 'Add a clearer working hours answer in AI Settings'}
            </p>
          </div>
          <Link href="/dashboard/settings"
            className="mt-3 block text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
            {isRTL ? 'تحديث إعدادات الذكاء الاصطناعي ←' : 'Update AI Settings →'}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
