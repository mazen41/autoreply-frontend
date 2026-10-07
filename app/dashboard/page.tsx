'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import { springs, variants } from '../../lib/motion'
import PageHeader from '../../components/ui/PageHeader'
import MetricCard from '../../components/ui/MetricCard'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import ChannelIcon from '../../components/ui/ChannelIcon'
import { MetricCardSkeleton } from '../../components/ui/Skeleton'
import {
  MessageSquare,
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  Radio,
  ArrowUpRight,
  AlertTriangle,
  Send,
  Zap,
  CheckCircle2,
  ChevronRight,
  Bot,
  RefreshCw,
  Plus,
  ExternalLink,
} from 'lucide-react'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [dailyMessages, setDailyMessages] = useState<number[]>([])
  const [aiPerformance, setAiPerformance] = useState<any>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const token = getToken()
      if (!token) {
        throw new Error('Your session expired. Sign in again to load dashboard data.')
      }

      const days = Number.parseInt(timeRange, 10)
      const [statsRes, inboxRes, channelsRes, dailyRes, aiRes] = await Promise.all([
        fetch(`${API}/api/stats`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${API}/api/inbox`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${API}/api/channels`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${API}/api/reports/daily-messages?days=${days}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${API}/api/reports/ai-performance`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      ])

      if (!statsRes.ok || !inboxRes.ok || !channelsRes.ok || !dailyRes.ok || !aiRes.ok) {
        throw new Error('Some dashboard data could not be loaded. Retry to refresh it.')
      }
      const [statsData, inboxData, channelData, dailyData, aiData] = await Promise.all([
        statsRes.json(), inboxRes.json(), channelsRes.json(), dailyRes.json(), aiRes.json(),
      ])
      setStats(statsData)
      setAiPerformance(aiData)
      setDailyMessages(Array.isArray(dailyData.data) ? dailyData.data.map(Number) : [])
      const chList = Array.isArray(channelData) ? channelData : channelData.data || []
      setChannels(chList.filter((channel: any) => channel.status === 'connected'))

      const rows = Array.isArray(inboxData.data) ? inboxData.data : []
      setRecentConversations(rows.slice(0, 5).map((item: any) => ({
        id: item.id,
        sender_name: item.sender_name || item.sender_id || 'Unknown customer',
        channel: item.channel?.type || 'unknown',
        message: item.latest_message?.content || item.message_preview || item.last_message || '',
        ai_replied: Boolean(item.latest_message?.is_ai || item.ai_replied),
        time: item.last_message_at || item.updated_at || item.created_at,
        status: item.status,
      })))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const maxDayVolume = Math.max(...dailyMessages, 1)

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Command Center"
        description="Real-time omnichannel engagement, AI agent autonomy, and conversation triage across all channels."
        breadcrumbs={[
          { label: 'NazBiz', href: '/dashboard' },
          { label: 'Dashboard' },
        ]}
        primaryAction={
          <Link href="/dashboard/channels">
            <Button variant="primary" size="md" icon={<Plus size={16} />}>
              Connect Channel
            </Button>
          </Link>
        }
        secondaryActions={
          <div className="flex items-center gap-1 p-1 bg-surface-elevated border border-border rounded-lg">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-surface-overlay text-text-primary shadow-xs'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        }
      />

      {loadError && (
        <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm text-text-primary">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>Retry</Button>
        </div>
      )}

      {/* ─── Top-Level KPIs Row ─────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={variants.fadeUp} transition={springs.standard}>
              <MetricCardSkeleton />
            </motion.div>
          ))
        ) : (
          <>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="Total Messages"
                value={(stats?.total_messages ?? 0).toLocaleString()}
                subValue="Messages across your channels"
                icon={<MessageSquare size={18} />}
              />
            </motion.div>

            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="AI Autonomy Rate"
                value={`${aiPerformance?.auto_reply_rate ?? 0}%`}
                subValue={`${aiPerformance?.auto_replies ?? 0} AI replies`}
                variant="ai"
                icon={<Sparkles size={18} />}
              />
            </motion.div>

            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="Avg Response Time"
                value={aiPerformance?.avg_response_time_formatted || 'No data'}
                subValue="Average reply time"
                icon={<Clock size={18} />}
              />
            </motion.div>

            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="Connected Channels"
                value={channels.length}
                subValue="Active communication accounts"
                icon={<Radio size={18} />}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ─── Main Grid: Charts & Performance ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Conversation Volume & AI Handling Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Message volume</CardTitle>
              <CardDescription>Daily message totals for the selected period.</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-sm bg-surface-secondary border border-border" />
                <span>Messages</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2">
              {dailyMessages.map((total, index) => {
                const totalPct = Math.round((total / maxDayVolume) * 100)
                const day = new Date(Date.now() - (dailyMessages.length - index - 1) * 86400000)
                  .toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })

                return (
                  <div
                    key={`${day}-${index}`}
                    className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                  >
                    <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full">
                      {/* Total Bar */}
                      <div
                        className="w-2/3 bg-brand hover:bg-brand-hover rounded-t-md transition-all relative group/bar"
                        style={{ height: `${totalPct}%` }}
                      >
                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-overlay text-[10px] font-bold text-text-primary px-1.5 py-0.5 rounded border border-border shadow-xs pointer-events-none transition-opacity">
                          {total}
                        </div>
                      </div>

                    </div>

                    <span className="text-[11px] font-medium text-text-tertiary">
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
            {dailyMessages.length === 0 && <p className="py-10 text-center text-sm text-text-tertiary">No message history for this period.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected channels</CardTitle>
            <CardDescription>Accounts currently connected to this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.length === 0 ? <p className="text-sm text-text-tertiary">No connected channels.</p> : channels.map((channel) => (
              <div key={channel.id} className="flex items-center gap-2 border-b border-border py-2 last:border-0">
                <ChannelIcon type={channel.type} size={16} />
                <span className="truncate text-sm text-text-primary">{channel.page_name || channel.page_id || channel.type}</span>
                <span className="ml-auto text-xs text-text-tertiary">Connected</span>
              </div>
            ))}
          </CardContent>
          <div className="border-t border-border p-4"><Link href="/dashboard/channels"><Button variant="ghost" size="sm" className="w-full">Manage channels</Button></Link></div>
        </Card>
      </div>

      {/* ─── Bottom Grid: Live Conversations & Channel Breakdown ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Omnichannel Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Live Inbound Activity Feed</CardTitle>
              <CardDescription>
                Incoming messages streaming in real-time across all connected platforms.
              </CardDescription>
            </div>
            <Link href="/inbox">
              <Button variant="ghost" size="sm" iconRight={<ArrowUpRight size={14} />}>
                View All in Inbox
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recentConversations.length === 0 ? <p className="px-4 py-10 text-center text-sm text-text-tertiary">No conversations yet.</p> : recentConversations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar
                      name={item.sender_name}
                      size="md"
                      channelIcon={<ChannelIcon type={item.channel} size={12} />}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {item.sender_name}
                        </span>
                        {item.ai_replied ? (
                          <Badge variant="ai" size="xs">
                            AI Replied
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="xs">
                            Waiting Agent
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate mt-0.5 max-w-md">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-text-tertiary">
                      {item.time ? new Date(item.time).toLocaleString() : 'Time unavailable'}
                    </span>
                    <Link href={`/inbox?id=${item.id}`}>
                      <button
                        type="button"
                        className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        title="Open Conversation"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Col: Channel Volume Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>
                Conversation volume by platform
              </CardDescription>
            </div>
            <Link href="/dashboard/channels">
              <Button variant="ghost" size="xs">
                Manage
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="space-y-4 pt-3">
            {channels.length === 0 ? <p className="text-sm text-text-tertiary">No connected channels.</p> : channels.map((channel) => (
              <div key={channel.id} className="flex items-center gap-2 border-b border-border py-2 last:border-0">
                <ChannelIcon type={channel.type} size={16} />
                <span className="truncate text-sm text-text-primary">{channel.page_name || channel.page_id || channel.type}</span>
                <span className="ml-auto text-xs text-text-tertiary">Connected</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
