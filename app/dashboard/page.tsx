'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { springs, variants } from '../../lib/motion'
import PageHeader from '../../components/ui/PageHeader'
import MetricCard from '../../components/ui/MetricCard'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
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
  AlertCircle,
  RefreshCw,
  Wifi,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type DashboardSection = 'stats' | 'ai' | 'channels' | 'daily' | 'inbox'

const SECTION_LABELS: Record<DashboardSection, string> = {
  stats:    'Message totals',
  ai:       'AI performance',
  channels: 'Connected channels',
  daily:    'Message chart',
  inbox:    'Recent activity',
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

type DashboardStats         = { total_messages?: number }
type DashboardAiPerformance = { ai_share_of_replies?: number; auto_replies?: number; median_response_time_formatted?: string }
type DashboardChannelType   = React.ComponentProps<typeof ChannelIcon>['type']
type DashboardChannel       = { id: number; type: DashboardChannelType; page_name?: string | null; page_id?: string | null; status: string }
type DashboardBot           = { id: number; name: string; status: string }
type ApiConversation        = {
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

/* ─────────────────────────────────────────────────────────────────────────── */
/* Sub-components                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-[100px] flex-col items-center justify-center gap-3 rounded-xl
                 border border-error/20 bg-error/5 p-6 text-center"
    >
      <AlertCircle size={20} className="text-error/70" aria-hidden="true" />
      <p className="text-sm text-text-secondary max-w-xs">{message}</p>
      <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function EmptyState({ icon, message, action }: {
  icon: React.ReactNode
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100px] flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="text-text-disabled" aria-hidden="true">{icon}</span>
      <p className="text-sm text-text-tertiary max-w-xs">{message}</p>
      {action}
    </div>
  )
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff  = Date.now() - d.getTime()
  const mins  = Math.round(diff / 60_000)
  const hours = Math.round(diff / 3_600_000)
  if (mins  <  1)  return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatChartDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
}


/* ─────────────────────────────────────────────────────────────────────────── */
/* Bar chart component                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function MessageVolumeChart({
  data,
  dates,
  loading,
  error,
  onRetry,
}: {
  data: number[]
  dates: string[]
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="h-52 flex gap-3 animate-pulse" aria-busy="true" aria-label="Loading chart">
        <div className="flex flex-col justify-between py-1 w-9 shrink-0 gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-2 rounded bg-surface-elevated" />
          ))}
        </div>
        <div className="flex-1 flex items-end gap-1.5">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-surface-elevated"
              style={{ height: `${30 + (i * 11) % 60}%` }}
            />
          ))}
        </div>
      </div>
    )
  }
  if (error) return <SectionError message={error} onRetry={onRetry} />
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={28} />}
        message="No message history for this period."
      />
    )
  }

  const max  = Math.max(...data, 1)
  const yMax = Math.ceil(max / 10) * 10
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax))
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 < 100 ? 1 : 0)}k` : String(n)

  return (
    <figure aria-label={`Bar chart of daily message volume. ${data.length} days. Peak: ${max.toLocaleString()} messages.`}>
      <div className="flex gap-2" style={{ height: '13rem' }}>
        {/* Y-axis labels */}
        <div
          className="flex flex-col-reverse justify-between pb-px text-[10px] text-text-disabled shrink-0 text-end leading-none"
          aria-hidden="true"
          style={{ width: '2.25rem' }}
        >
          {yTicks.map(v => <span key={v}>{fmt(v)}</span>)}
        </div>

        {/* Chart area */}
        <div className="relative flex-1 flex flex-col">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none" aria-hidden="true">
            {yTicks.map(v => (
              <div key={v} className="border-t border-border/50 w-full" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex-1 flex items-end gap-1 sm:gap-1.5">
            {data.map((value, i) => {
              const pct   = yMax > 0 ? (value / yMax) * 100 : 0
              const date  = dates[i] ?? ''
              return (
                <div key={`${date}-${i}`} className="flex-1 flex items-end justify-center h-full group">
                  <div
                    className="relative w-full"
                    style={{ height: `${Math.max(pct, 1.5)}%` }}
                    role="img"
                    aria-label={`${date ? formatChartDate(date) : `Day ${i + 1}`}: ${value.toLocaleString()} messages`}
                  >
                    <div className="absolute inset-0 rounded-t-sm bg-brand/60 group-hover:bg-brand transition-colors duration-150" />
                    {/* Tooltip */}
                    <div
                      className="opacity-0 group-hover:opacity-100 pointer-events-none
                                 absolute -top-8 left-1/2 -translate-x-1/2
                                 bg-surface-overlay border border-border shadow-md
                                 text-[11px] font-semibold text-text-primary
                                 px-2 py-1 rounded-md whitespace-nowrap z-10
                                 transition-opacity duration-150"
                      role="tooltip"
                    >
                      {value.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex mt-1.5 gap-1 sm:gap-1.5" aria-hidden="true" style={{ paddingInlineStart: '2.5rem' }}>
        {data.map((_, i) => {
          const date  = dates[i] ?? ''
          const label = date ? formatChartDate(date) : ''
          const hide  = data.length > 14 && i % 2 !== 0
          return (
            <div
              key={`lbl-${i}`}
              className={`flex-1 text-center text-[10px] text-text-disabled truncate select-none
                          ${hide ? 'opacity-0' : ''}`}
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* Accessible data table (screen readers) */}
      <table className="sr-only">
        <caption>Daily message volume</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Messages</th></tr></thead>
        <tbody>
          {data.map((v, i) => (
            <tr key={i}><td>{dates[i] ?? `Day ${i + 1}`}</td><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}


/* ─────────────────────────────────────────────────────────────────────────── */
/* Dashboard page                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  /* ── state ── */
  const [stats,               setStats]               = useState<DashboardStats | null>(null)
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([])
  const [channels,            setChannels]            = useState<DashboardChannel[]>([])
  const [bots,                setBots]                = useState<DashboardBot[]>([])
  const [selectedChannelId,   setSelectedChannelId]   = useState('')
  const [selectedBotId,       setSelectedBotId]       = useState('')
  const [dailyMessages,       setDailyMessages]       = useState<number[]>([])
  const [dailyDates,          setDailyDates]          = useState<string[]>([])
  const [aiPerformance,       setAiPerformance]       = useState<DashboardAiPerformance | null>(null)
  const [timeRange,           setTimeRange]           = useState<'7d' | '30d' | '90d'>('7d')

  const [sectionLoading, setSectionLoading] = useState<Record<DashboardSection, boolean>>(
    { stats: true, ai: true, channels: true, daily: true, inbox: true },
  )
  const [sectionErrors, setSectionErrors] = useState<Record<DashboardSection, string | null>>(
    { stats: null,  ai: null,  channels: null,  daily: null,  inbox: null },
  )

  /* ── generic section loader ── */
  const loadSection = useCallback(async <T,>(
    section: DashboardSection,
    path: string,
    onData: (data: T) => void,
  ) => {
    setSectionLoading(prev => ({ ...prev, [section]: true  }))
    setSectionErrors (prev => ({ ...prev, [section]: null  }))
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const res = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!res.ok) throw new Error(`Could not load ${SECTION_LABELS[section].toLowerCase()} (${res.status}).`)
      onData(await res.json() as T)
    } catch (err) {
      setSectionErrors(prev => ({
        ...prev,
        [section]: err instanceof Error ? err.message : `Could not load ${SECTION_LABELS[section].toLowerCase()}.`,
      }))
    } finally {
      setSectionLoading(prev => ({ ...prev, [section]: false }))
    }
  }, [])

  /* ── query strings ── */
  const timezone      = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const days          = Number.parseInt(timeRange, 10)
  const dashboardParams = new URLSearchParams({ days: String(days), timezone })
  if (selectedChannelId) dashboardParams.set('channel_id', selectedChannelId)
  if (selectedBotId)     dashboardParams.set('bot_id',     selectedBotId)
  const dashboardQuery  = dashboardParams.toString()
  const inboxParams     = new URLSearchParams()
  if (selectedChannelId) inboxParams.set('channel_id', selectedChannelId)
  if (selectedBotId)     inboxParams.set('bot_id',     selectedBotId)
  const inboxQuery = inboxParams.toString()

  /* ── section loaders ── */
  const loadStats = useCallback(
    () => loadSection('stats', `/api/stats?${dashboardQuery}`, setStats),
    [dashboardQuery, loadSection],
  )
  const loadAi = useCallback(
    () => loadSection('ai', `/api/reports/ai-performance?${dashboardQuery}`, setAiPerformance),
    [dashboardQuery, loadSection],
  )
  const loadDaily = useCallback(
    () => loadSection<{ data?: number[]; dates?: string[] }>(
      'daily', `/api/reports/daily-messages?${dashboardQuery}`,
      data => {
        setDailyMessages(Array.isArray(data.data)  ? data.data.map(Number)  : [])
        setDailyDates   (Array.isArray(data.dates) ? data.dates              : [])
      },
    ),
    [dashboardQuery, loadSection],
  )
  const loadChannels = useCallback(
    () => loadSection<DashboardChannel[] | { data?: DashboardChannel[] }>(
      'channels', '/api/channels',
      data => {
        const list = Array.isArray(data) ? data : (data.data ?? [])
        setChannels(list.filter(ch => ch.status === 'connected'))
      },
    ),
    [loadSection],
  )
  const loadBots = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const res = await fetch(`${API}/api/bots`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!res.ok) throw new Error(`Could not load bots (${res.status}).`)
      const payload = await res.json()
      const list    = Array.isArray(payload) ? payload as DashboardBot[] : (payload.bots ?? payload.data ?? []) as DashboardBot[]
      setBots(list)
    } catch (err) {
      setSectionErrors(prev => ({
        ...prev,
        channels: err instanceof Error ? err.message : 'Could not load bots.',
      }))
    }
  }, [])
  const loadInbox = useCallback(
    () => loadSection<{ data?: ApiConversation[] }>(
      'inbox', `/api/inbox${inboxQuery ? `?${inboxQuery}` : ''}`,
      data => {
        const rows = Array.isArray(data.data) ? data.data : []
        setRecentConversations(
          rows.slice(0, 5).map(item => ({
            id:          item.id,
            sender_name: item.sender_name || item.sender_id || 'Unknown customer',
            channel:     item.channel?.type || 'webchat',
            message:     item.latest_message?.content || item.message_preview || item.last_message || '',
            ai_replied:  Boolean(item.latest_message?.is_ai || item.ai_replied),
            time:        item.last_message_at || item.updated_at || item.created_at || null,
            status:      item.status || null,
          })),
        )
      },
    ),
    [inboxQuery, loadSection],
  )

  /* ── effects ── */
  useEffect(() => { void loadStats(); void loadAi(); void loadDaily() }, [loadStats, loadAi, loadDaily])
  useEffect(() => { void loadChannels(); void loadBots() }, [loadChannels, loadBots])
  useEffect(() => { void loadInbox() }, [loadInbox])


  /* ── render ── */
  return (
    <div className="space-y-6 pb-8">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Page header                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
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
          /* Filters row — stacks on mobile, inline on sm+ */
          <div className="flex flex-wrap items-center gap-2">
            {/* Channel selector */}
            <label className="sr-only" htmlFor="dash-channel-filter">Channel or account</label>
            <select
              id="dash-channel-filter"
              className="h-9 max-w-[11rem] rounded-lg border border-border bg-surface-elevated
                         px-2.5 text-xs text-text-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand/40"
              value={selectedChannelId}
              onChange={e => setSelectedChannelId(e.target.value)}
            >
              <option value="">All channels</option>
              {channels.map(ch => (
                <option key={ch.id} value={ch.id}>
                  {ch.page_name || ch.page_id || ch.type}
                </option>
              ))}
            </select>

            {/* Bot selector */}
            <label className="sr-only" htmlFor="dash-bot-filter">Bot</label>
            <select
              id="dash-bot-filter"
              className="h-9 max-w-[9rem] rounded-lg border border-border bg-surface-elevated
                         px-2.5 text-xs text-text-primary focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand/40"
              value={selectedBotId}
              onChange={e => setSelectedBotId(e.target.value)}
            >
              <option value="">All bots</option>
              {bots.map(bot => (
                <option key={bot.id} value={bot.id}>{bot.name}</option>
              ))}
            </select>

            {/* Time-range toggle */}
            <div
              className="flex items-center gap-0.5 p-1 bg-surface-elevated border border-border rounded-lg"
              role="group"
              aria-label="Time range"
            >
              {(['7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors
                              focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none
                              ${timeRange === range
                                ? 'bg-surface-overlay text-text-primary shadow-sm'
                                : 'text-text-tertiary hover:text-text-primary'}`}
                  aria-pressed={timeRange === range}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Handoff task alert                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <HandoffTaskQueue />


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KPI metric cards                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Total messages */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.stats
            ? <MetricCardSkeleton />
            : sectionErrors.stats
            ? <SectionError message={sectionErrors.stats} onRetry={() => void loadStats()} />
            : <MetricCard
                label="Total Messages"
                value={(stats?.total_messages ?? 0).toLocaleString()}
                subValue={`${timeRange} · across all channels`}
                icon={<MessageSquare size={18} />}
              />}
        </motion.div>

        {/* AI share */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.ai
            ? <MetricCardSkeleton />
            : sectionErrors.ai
            ? <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} />
            : <MetricCard
                label="AI Share of Replies"
                value={`${aiPerformance?.ai_share_of_replies ?? 0}%`}
                subValue={`${(aiPerformance?.auto_replies ?? 0).toLocaleString()} AI replies · ${timeRange}`}
                variant="ai"
                icon={<Sparkles size={18} />}
              />}
        </motion.div>

        {/* Median response time */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.ai
            ? <MetricCardSkeleton />
            : sectionErrors.ai
            ? <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} />
            : <MetricCard
                label="Median Response Time"
                value={aiPerformance?.median_response_time_formatted || '—'}
                subValue={`Message to first reply · ${timeRange}`}
                icon={<Clock size={18} />}
              />}
        </motion.div>

        {/* Connected channels */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.channels
            ? <MetricCardSkeleton />
            : sectionErrors.channels
            ? <SectionError message={sectionErrors.channels} onRetry={() => void loadChannels()} />
            : <MetricCard
                label="Connected Channels"
                value={channels.length}
                subValue="Active accounts"
                icon={<Radio size={18} />}
              />}
        </motion.div>
      </motion.div>


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Main content grid                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ── Left 2 cols: Message volume chart ── */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between pb-3 gap-4">
            <div className="min-w-0">
              <CardTitle>Message volume</CardTitle>
              <CardDescription>Daily totals for the selected period.</CardDescription>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-text-tertiary mt-0.5">
              <span className="w-3 h-3 rounded-sm bg-brand/60 border border-brand/30 shrink-0" />
              <span>Messages</span>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <MessageVolumeChart
              data={dailyMessages}
              dates={dailyDates}
              loading={sectionLoading.daily}
              error={sectionErrors.daily}
              onRetry={() => void loadDaily()}
            />
          </CardContent>
        </Card>

        {/* ── Right col: Connected channels ── */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Connected channels</CardTitle>
            <CardDescription>Accounts active in this workspace.</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {sectionLoading.channels ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 animate-pulse">
                    <div className="w-5 h-5 rounded-full bg-surface-elevated shrink-0" />
                    <div className="h-3 flex-1 rounded bg-surface-elevated" />
                    <div className="h-3 w-14 rounded bg-surface-elevated" />
                  </div>
                ))}
              </div>
            ) : sectionErrors.channels ? (
              <div className="p-4">
                <SectionError message={sectionErrors.channels} onRetry={() => void loadChannels()} />
              </div>
            ) : channels.length === 0 ? (
              <EmptyState
                icon={<Wifi size={24} />}
                message="No channels connected yet."
                action={
                  <Link href="/dashboard/channels">
                    <Button variant="outline" size="sm" icon={<Plus size={13} />}>
                      Connect a channel
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border/60 px-5">
                {channels.map(ch => (
                  <li key={ch.id} className="flex items-center gap-3 py-3">
                    <ChannelIcon type={ch.type} size={18} />
                    <span className="flex-1 truncate text-sm font-medium text-text-primary">
                      {ch.page_name || ch.page_id || ch.type}
                    </span>
                    <Badge variant="success" size="xs" dot>Connected</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>

          <CardFooter className="mt-auto">
            <Link href="/dashboard/channels" className="w-full">
              <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} className="w-full justify-between">
                Manage channels
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Recent inbound activity (full width)                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3 gap-4">
          <div className="min-w-0">
            <CardTitle>Recent inbound activity</CardTitle>
            <CardDescription>Latest conversations across connected platforms.</CardDescription>
          </div>
          <Link href="/inbox" className="shrink-0 self-center">
            <Button variant="ghost" size="sm" iconRight={<ArrowUpRight size={14} />}>
              View inbox
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {sectionLoading.inbox ? (
            /* Loading skeletons */
            <ul aria-busy="true" aria-label="Loading recent activity">
              {[...Array(5)].map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border/50 last:border-0 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-elevated shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-2.5 w-1/3 rounded bg-surface-elevated" />
                    <div className="h-2 w-2/3 rounded bg-surface-elevated" />
                  </div>
                  <div className="h-2.5 w-12 rounded bg-surface-elevated shrink-0" />
                </li>
              ))}
            </ul>
          ) : sectionErrors.inbox ? (
            <div className="p-5">
              <SectionError message={sectionErrors.inbox} onRetry={() => void loadInbox()} />
            </div>
          ) : recentConversations.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={28} />}
              message="No conversations yet. They'll appear here once messages arrive."
            />
          ) : (
            <ul className="divide-y divide-border/60" aria-label="Recent conversations">
              {recentConversations.map(item => (
                <li key={item.id}>
                  <Link
                    href={`/inbox?id=${item.id}`}
                    className="flex items-center gap-3.5 px-5 py-3.5
                               hover:bg-surface-elevated/60 transition-colors
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-inset focus-visible:ring-brand/40
                               group"
                    aria-label={`Open conversation with ${item.sender_name}`}
                  >
                    {/* Avatar with channel badge */}
                    <Avatar
                      name={item.sender_name}
                      size="md"
                      channelIcon={<ChannelIcon type={item.channel} size={12} />}
                    />

                    {/* Name + message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-text-primary truncate">
                          {item.sender_name}
                        </span>
                        {item.ai_replied ? (
                          <Badge variant="ai" size="xs">AI replied</Badge>
                        ) : (
                          <Badge variant="warning" size="xs" dot dotPulse>Needs agent</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate leading-relaxed">
                        {item.message || <span className="italic text-text-disabled">No message preview</span>}
                      </p>
                    </div>

                    {/* Time + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.time && (
                        <time
                          dateTime={item.time}
                          className="text-[11px] text-text-disabled whitespace-nowrap"
                          title={new Date(item.time).toLocaleString()}
                        >
                          {formatTime(item.time)}
                        </time>
                      )}
                      <ChevronRight
                        size={15}
                        className="text-text-disabled group-hover:text-text-secondary transition-colors"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>

        {!sectionLoading.inbox && !sectionErrors.inbox && recentConversations.length > 0 && (
          <CardFooter>
            <Link href="/inbox" className="w-full">
              <Button variant="ghost" size="sm" iconRight={<ArrowUpRight size={13} />} className="w-full justify-center">
                View all conversations
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>

    </div>
  )
}
