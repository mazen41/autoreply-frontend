'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { springs, variants } from '../../lib/motion'
import PageHeader from '../../components/ui/PageHeader'
import MetricCard from '../../components/ui/MetricCard'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import ChannelIcon from '../../components/ui/ChannelIcon'
import { MetricCardSkeleton } from '../../components/ui/Skeleton'
import { getBusinessHeaders } from '../../lib/businessContext'
import HandoffTaskQueue from '../../components/inbox/HandoffTaskQueue'
import {
  MessageSquare,
  Sparkles,
  Clock,
  Radio,
  ArrowUpRight,
  ChevronRight,
  Plus,
} from 'lucide-react'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
type DashboardSection = 'stats' | 'ai' | 'channels' | 'daily' | 'inbox'

const SECTION_LABELS: Record<DashboardSection, string> = {
  stats: 'Message totals', ai: 'AI performance', channels: 'Connected channels', daily: 'Message chart', inbox: 'Recent activity',
}

type DashboardStats = { total_messages?: number }
type DashboardAiPerformance = { ai_share_of_replies?: number; auto_replies?: number; median_response_time_formatted?: string }
type DashboardChannelType = React.ComponentProps<typeof ChannelIcon>['type']
type DashboardChannel = { id: number; type: DashboardChannelType; page_name?: string | null; page_id?: string | null; status: string }
type DashboardBot = { id: number; name: string; status: string }
type ApiConversation = {
  id: number
  sender_name?: string | null
  sender_id?: string | null
  channel?: { type?: DashboardChannelType | null }
  latest_message?: { content?: string | null; is_ai?: boolean | null } | null
  message_preview?: string | null
  last_message?: string | null
  ai_replied?: boolean | null
  last_message_at?: string | null
  updated_at?: string | null
  created_at?: string | null
  status?: string | null
}
type RecentConversation = {
  id: number
  sender_name: string
  channel: DashboardChannelType
  message: string
  ai_replied: boolean
  time: string | null
  status: string | null
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex min-h-[116px] flex-col items-start justify-center gap-2 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-text-primary">
      <span>{message}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([])
  const [channels, setChannels] = useState<DashboardChannel[]>([])
  const [bots, setBots] = useState<DashboardBot[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [selectedBotId, setSelectedBotId] = useState('')
  const [dailyMessages, setDailyMessages] = useState<number[]>([])
  const [dailyDates, setDailyDates] = useState<string[]>([])
  const [aiPerformance, setAiPerformance] = useState<DashboardAiPerformance | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [sectionLoading, setSectionLoading] = useState<Record<DashboardSection, boolean>>({ stats: true, ai: true, channels: true, daily: true, inbox: true })
  const [sectionErrors, setSectionErrors] = useState<Record<DashboardSection, string | null>>({ stats: null, ai: null, channels: null, daily: null, inbox: null })

  const loadSection = useCallback(async <T,>(section: DashboardSection, path: string, onData: (data: T) => void) => {
    setSectionLoading(previous => ({ ...previous, [section]: true }))
    setSectionErrors(previous => ({ ...previous, [section]: null }))
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!response.ok) throw new Error(`Could not load ${SECTION_LABELS[section].toLowerCase()} (${response.status}).`)
      onData(await response.json() as T)
    } catch (cause) {
      setSectionErrors(previous => ({ ...previous, [section]: cause instanceof Error ? cause.message : `Could not load ${SECTION_LABELS[section].toLowerCase()}.` }))
    } finally {
      setSectionLoading(previous => ({ ...previous, [section]: false }))
    }
  }, [])

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const days = Number.parseInt(timeRange, 10)
  const dashboardParams = new URLSearchParams({ days: String(days), timezone })
  if (selectedChannelId) dashboardParams.set('channel_id', selectedChannelId)
  if (selectedBotId) dashboardParams.set('bot_id', selectedBotId)
  const dashboardQuery = dashboardParams.toString()
  const inboxParams = new URLSearchParams()
  if (selectedChannelId) inboxParams.set('channel_id', selectedChannelId)
  if (selectedBotId) inboxParams.set('bot_id', selectedBotId)
  const inboxQuery = inboxParams.toString()
  const loadStats = useCallback(() => loadSection('stats', `/api/stats?${dashboardQuery}`, setStats), [dashboardQuery, loadSection])
  const loadAi = useCallback(() => loadSection('ai', `/api/reports/ai-performance?${dashboardQuery}`, setAiPerformance), [dashboardQuery, loadSection])
  const loadDaily = useCallback(() => loadSection<{data?: number[]; dates?: string[]}>('daily', `/api/reports/daily-messages?${dashboardQuery}`, (data) => {
    setDailyMessages(Array.isArray(data.data) ? data.data.map(Number) : [])
    setDailyDates(Array.isArray(data.dates) ? data.dates : [])
  }), [dashboardQuery, loadSection])
  const loadChannels = useCallback(() => loadSection<DashboardChannel[] | {data?: DashboardChannel[]}>('channels', '/api/channels', (data) => {
    const channelList = Array.isArray(data) ? data : data.data || []
    setChannels(channelList.filter((channel) => channel.status === 'connected'))
  }), [loadSection])
  const loadBots = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/bots`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      if (!response.ok) throw new Error(`Could not load bots (${response.status}).`)
      const payload = await response.json()
      const botList = Array.isArray(payload) ? payload as DashboardBot[] : (payload.bots || payload.data || []) as DashboardBot[]
      setBots(botList)
    } catch (cause) {
      setSectionErrors(previous => ({ ...previous, channels: cause instanceof Error ? cause.message : 'Could not load bots.' }))
    }
  }, [])
  const loadInbox = useCallback(() => loadSection<{data?: ApiConversation[]}>('inbox', `/api/inbox${inboxQuery ? `?${inboxQuery}` : ''}`, (data) => {
    const rows = Array.isArray(data.data) ? data.data : []
    setRecentConversations(rows.slice(0, 5).map((item) => ({
      id: item.id,
      sender_name: item.sender_name || item.sender_id || 'Unknown customer',
      channel: item.channel?.type || 'webchat',
      message: item.latest_message?.content || item.message_preview || item.last_message || '',
      ai_replied: Boolean(item.latest_message?.is_ai || item.ai_replied),
      time: item.last_message_at || item.updated_at || item.created_at || null,
      status: item.status || null,
    })))
  }), [inboxQuery, loadSection])

  useEffect(() => { void loadStats(); void loadAi(); void loadDaily() }, [loadStats, loadAi, loadDaily])
  useEffect(() => { void loadChannels(); void loadBots() }, [loadChannels, loadBots])
  useEffect(() => { void loadInbox() }, [loadInbox])

  const maxDayVolume = Math.max(...dailyMessages, 1)

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Command Center"
        description="Omnichannel engagement, AI agent performance, and recent conversation activity across connected channels."
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
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="dashboard-channel-filter">Channel or connected account</label>
            <select id="dashboard-channel-filter" aria-label="Channel or connected account" className="h-9 max-w-52 rounded-lg border border-border bg-surface-elevated px-2 text-xs text-text-primary" value={selectedChannelId} onChange={event => setSelectedChannelId(event.target.value)}>
              <option value="">All channels and accounts</option>
              {channels.map(channel => <option key={channel.id} value={channel.id}>{channel.page_name || channel.page_id || channel.type}</option>)}
            </select>
            <label className="sr-only" htmlFor="dashboard-bot-filter">Bot</label>
            <select id="dashboard-bot-filter" aria-label="Bot" className="h-9 max-w-44 rounded-lg border border-border bg-surface-elevated px-2 text-xs text-text-primary" value={selectedBotId} onChange={event => setSelectedBotId(event.target.value)}>
              <option value="">All bots</option>
              {bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
            </select>
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
          </div>
        }
      />

      <HandoffTaskQueue />

      {/* ─── Top-Level KPIs Row ─────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.stats ? <MetricCardSkeleton /> : sectionErrors.stats ? <SectionError message={sectionErrors.stats} onRetry={() => void loadStats()} /> : <MetricCard label="Total Messages" value={(stats?.total_messages ?? 0).toLocaleString()} subValue={`${timeRange} · messages across your channels`} icon={<MessageSquare size={18} />} />}
        </motion.div>
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.ai ? <MetricCardSkeleton /> : sectionErrors.ai ? <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} /> : <MetricCard label="AI Share of Replies" value={`${aiPerformance?.ai_share_of_replies ?? 0}%`} subValue={`${aiPerformance?.auto_replies ?? 0} AI replies · ${timeRange}`} variant="ai" icon={<Sparkles size={18} />} />}
        </motion.div>
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.ai ? <MetricCardSkeleton /> : sectionErrors.ai ? <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} /> : <MetricCard label="Median Response Time" value={aiPerformance?.median_response_time_formatted || 'No data'} subValue={`Customer message to first reply · ${timeRange}`} icon={<Clock size={18} />} />}
        </motion.div>
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.channels ? <MetricCardSkeleton /> : sectionErrors.channels ? <SectionError message={sectionErrors.channels} onRetry={() => void loadChannels()} /> : <MetricCard label="Connected Channels" value={channels.length} subValue="Active communication accounts" icon={<Radio size={18} />} />}
        </motion.div>
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
            {sectionLoading.daily ? <div className="h-60 animate-pulse rounded-lg bg-surface-elevated" /> : sectionErrors.daily ? <SectionError message={sectionErrors.daily} onRetry={() => void loadDaily()} /> : <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2">
              {dailyMessages.map((total, index) => {
                const totalPct = Math.round((total / maxDayVolume) * 100)
                const date = dailyDates[index]
                const day = date ? `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}` : ''

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
            </div>}
            {!sectionLoading.daily && !sectionErrors.daily && dailyMessages.length === 0 && <p className="py-10 text-center text-sm text-text-tertiary">No message history for this period.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected channels</CardTitle>
            <CardDescription>Accounts currently connected to this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectionLoading.channels ? <p className="text-sm text-text-tertiary">Loading channels…</p> : sectionErrors.channels ? <SectionError message={sectionErrors.channels} onRetry={() => void loadChannels()} /> : channels.length === 0 ? <p className="text-sm text-text-tertiary">No connected channels.</p> : channels.map((channel) => (
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
              <CardTitle>Recent inbound activity</CardTitle>
              <CardDescription>
                The latest conversations across connected platforms.
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
              {sectionLoading.inbox ? <p className="px-4 py-10 text-center text-sm text-text-tertiary">Loading recent activity…</p> : sectionErrors.inbox ? <div className="p-4"><SectionError message={sectionErrors.inbox} onRetry={() => void loadInbox()} /></div> : recentConversations.length === 0 ? <p className="px-4 py-10 text-center text-sm text-text-tertiary">No conversations yet.</p> : recentConversations.map((item) => (
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
