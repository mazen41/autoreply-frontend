'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { springs, variants } from '../../lib/motion'
import MetricCard from '../../components/ui/MetricCard'
import Select, { type SelectOption } from '../../components/ui/Select'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ChannelIcon from '../../components/ui/ChannelIcon'
import { MetricCardSkeleton } from '../../components/ui/Skeleton'
import { getBusinessHeaders } from '../../lib/businessContext'
import { useLang } from '../../lib/LangContext'
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
  TrendingUp,
  BarChart2,
  Inbox,
  Zap,
  Bot,
  CalendarDays,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

type DashboardSection = 'stats' | 'ai' | 'channels' | 'daily' | 'inbox'

const SECTION_LABELS: Record<DashboardSection, string> = {
  stats:    'Message totals',
  ai:       'AI performance',
  channels: 'Connected channels',
  daily:    'Message chart',
  inbox:    'Recent activity',
}

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

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : ''
}

function formatRelativeTime(iso: string | null, isRTL: boolean): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff  = Date.now() - d.getTime()
  const mins  = Math.round(diff / 60_000)
  const hours = Math.round(diff / 3_600_000)
  const relativeTime = new Intl.RelativeTimeFormat(isRTL ? 'ar' : 'en', { numeric: 'auto' })
  if (mins < 1) return relativeTime.format(0, 'second')
  if (mins < 60) return relativeTime.format(-mins, 'minute')
  if (hours < 24) return relativeTime.format(-hours, 'hour')
  return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })
}

function formatChartDate(iso: string, total: number, isRTL: boolean): string {
  const d = new Date(iso + 'T00:00:00')
  // For 7d show day name, for 30d+ show M/D
  if (total <= 7) return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'short' })
  return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'numeric', day: 'numeric' })
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 < 100 ? 1 : 0)}k`
  return n.toLocaleString()
}


/* ─────────────────────────────────────────────────────────────────────────────
   Shared inline sub-components
───────────────────────────────────────────────────────────────────────────── */

/** Centred error state for any section */
function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { isRTL } = useLang()
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 min-h-[96px]
                 rounded-xl border border-error/20 bg-error/5 p-6 text-center"
    >
      <AlertCircle size={18} className="text-error/60" aria-hidden />
      <p className="text-sm text-text-secondary max-w-[24rem]">{message}</p>
      <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={onRetry}>
        {isRTL ? 'حاول مرة أخرى' : 'Try again'}
      </Button>
    </div>
  )
}

/** Centred empty state */
function EmptyState({
  icon,
  heading,
  body,
  action,
}: {
  icon: React.ReactNode
  heading: string
  body?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 min-h-[108px] py-8 text-center px-4">
      <span className="text-text-disabled/70" aria-hidden>{icon}</span>
      <p className="text-sm font-medium text-text-secondary">{heading}</p>
      {body && <p className="text-xs text-text-tertiary max-w-xs">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/** Inline skeleton shimmer row */
function SkeletonRow({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-3 animate-pulse py-3 px-5">
      {widths.map((w, i) => (
        <div key={i} className="h-2.5 rounded bg-surface-elevated" style={{ width: w }} />
      ))}
    </div>
  )
}

/** A compact, square identity marker that keeps the channel recognizable
 * without stacking a circular badge over a circular avatar. */
function ConversationAvatar({ name, channel }: { name: string; channel: DashboardChannelType }) {
  const normalizedName = name.trim()
  const initial = normalizedName.charAt(0).toUpperCase() || '?'
  const paletteIndex = (normalizedName.charCodeAt(0) || 0) % 5
  const palette = [
    'from-brand-blue/20 to-brand-cyan/10 text-brand-cyan',
    'from-brand-cyan/20 to-brand-blue/10 text-brand-cyan',
    'from-brand-violet/20 to-brand-blue/10 text-ai-accent',
    'from-brand-violet/20 to-brand-blue/20 text-ai-accent',
    'from-brand-magenta/20 to-brand-violet/10 text-brand-magenta',
  ][paletteIndex]

  return (
    <span className="relative inline-flex h-10 w-10 shrink-0" aria-hidden="true">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-br ${palette} text-sm font-semibold shadow-sm`}>
        {initial}
      </span>
      <span className="absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-md border border-border bg-surface-elevated shadow-sm">
        <ChannelIcon type={channel} size={12} />
      </span>
    </span>
  )
}


/* ─────────────────────────────────────────────────────────────────────────────
   Message volume bar chart
───────────────────────────────────────────────────────────────────────────── */

function VolumeChart({
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
  const { isRTL } = useLang()
  if (loading) {
    return (
      <div aria-busy aria-label={isRTL ? 'جارٍ تحميل الرسم البياني' : 'Loading chart'} className="flex gap-3 pt-1" style={{ height: '11rem' }}>
        {/* Y-axis */}
        <div className="flex flex-col-reverse justify-between w-8 shrink-0 py-1 gap-1 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-2 rounded bg-surface-elevated" />
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end gap-1.5 animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-surface-elevated"
              style={{ height: `${25 + (i * 13 + 7) % 55}%` }}
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
        icon={<BarChart2 size={30} />}
        heading={isRTL ? 'لا توجد بيانات رسائل بعد' : 'No message data yet'}
        body={isRTL ? 'سيظهر حجم الرسائل هنا عند وصول رسائل خلال الفترة المحددة.' : 'Volume will appear here once messages arrive in the selected period.'}
      />
    )
  }

  const max    = Math.max(...data, 1)
  const yMax   = max <= 5 ? 5 : Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax))
  const total  = data.length

  const summary = isRTL
    ? `رسم بياني للرسائل: ${total} يوم، والذروة ${max.toLocaleString('ar-EG')} رسالة`
    : `Bar chart: ${total} day${total === 1 ? '' : 's'}, peak ${max.toLocaleString()} messages`

  return (
    <figure aria-label={summary}>
      <div className="flex gap-2.5" style={{ height: '11rem' }}>
        {/* Y axis */}
        <div
          aria-hidden
          className="flex flex-col-reverse justify-between shrink-0 text-[10px] leading-none text-text-disabled pb-px text-end"
          style={{ width: '2.25rem' }}
        >
          {yTicks.map(v => <span key={v}>{fmtNum(v)}</span>)}
        </div>

        {/* Chart area */}
        <div className="relative flex-1 flex flex-col">
          {/* Grid lines */}
          <div aria-hidden className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none">
            {yTicks.map(v => (
              <div key={v} className="border-t border-border/40 w-full" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex-1 flex items-end gap-px sm:gap-0.5">
            {data.map((value, i) => {
              const pct  = yMax > 0 ? (value / yMax) * 100 : 0
              const date = dates[i] ?? ''
              const lbl  = date ? formatChartDate(date, total, isRTL) : (isRTL ? `اليوم ${i + 1}` : `Day ${i + 1}`)
              const hide = total > 14 && i % 2 !== 0
              return (
                <div
                  key={`bar-${date}-${i}`}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  <div
                    className="relative w-full"
                    style={{ height: `${Math.max(pct, 1)}%` }}
                    role="img"
                    aria-label={isRTL ? `${lbl}: ${value.toLocaleString('ar-EG')} رسالة` : `${lbl}: ${value.toLocaleString()} messages`}
                  >
                    {/* Bar fill */}
                    <div
                      className="absolute inset-0 rounded-t-[3px] bg-brand/50
                                 group-hover:bg-brand transition-colors duration-100"
                    />
                    {/* Hover tooltip */}
                    <div
                      role="tooltip"
                      className="pointer-events-none opacity-0 group-hover:opacity-100
                                 absolute -top-9 left-1/2 -translate-x-1/2
                                 whitespace-nowrap rounded-lg border border-border
                                 bg-surface-overlay px-2.5 py-1.5 shadow-lg
                                 text-[11px] font-semibold text-text-primary z-10
                                 transition-opacity duration-100"
                    >
                      <span className="block text-text-tertiary text-[10px] font-normal mb-px">{lbl}</span>
                      {value.toLocaleString()}
                    </div>
                  </div>
                  {/* X label */}
                  <span
                    aria-hidden
                    className={`mt-1 text-[10px] text-text-disabled truncate select-none leading-none max-w-full px-px
                                ${hide ? 'opacity-0' : ''}`}
                  >
                    {lbl}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hidden accessible table */}
      <table className="sr-only">
        <caption>{isRTL ? 'حجم الرسائل اليومي' : 'Daily message volume'}</caption>
        <thead>
          <tr><th scope="col">{isRTL ? 'التاريخ' : 'Date'}</th><th scope="col">{isRTL ? 'الرسائل' : 'Messages'}</th></tr>
        </thead>
        <tbody>
          {data.map((v, i) => (
            <tr key={i}><td>{dates[i] ?? `Day ${i + 1}`}</td><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}


/* ─────────────────────────────────────────────────────────────────────────────
   Dashboard page
───────────────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { isRTL } = useLang()
  const label = useCallback((english: string, arabic: string) => isRTL ? arabic : english, [isRTL])

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
    { stats: null, ai: null, channels: null, daily: null, inbox: null },
  )

  /* ── generic loader ── */
  const loadSection = useCallback(async <T,>(
    section: DashboardSection,
    path: string,
    onData: (data: T) => void,
  ) => {
    setSectionLoading(prev => ({ ...prev, [section]: true  }))
    setSectionErrors (prev => ({ ...prev, [section]: null  }))
    try {
      const token = getToken()
      if (!token) throw new Error(label('Your session expired. Sign in again.', 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.'))
      const res = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!res.ok) throw new Error(label(`Could not load ${SECTION_LABELS[section].toLowerCase()} (${res.status}).`, `تعذر تحميل ${({ stats: 'إجمالي الرسائل', ai: 'أداء الذكاء الاصطناعي', channels: 'القنوات المتصلة', daily: 'الرسم البياني للرسائل', inbox: 'أحدث المحادثات' } as const)[section]} (${res.status}).`))
      onData(await res.json() as T)
    } catch (err) {
      setSectionErrors(prev => ({
        ...prev,
        [section]: err instanceof Error
          ? err.message
          : label(`Could not load ${SECTION_LABELS[section].toLowerCase()}.`, `تعذر تحميل ${({ stats: 'إجمالي الرسائل', ai: 'أداء الذكاء الاصطناعي', channels: 'القنوات المتصلة', daily: 'الرسم البياني للرسائل', inbox: 'أحدث المحادثات' } as const)[section]}.`),
      }))
    } finally {
      setSectionLoading(prev => ({ ...prev, [section]: false }))
    }
  }, [label])

  /* ── query strings ── */
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const days     = Number.parseInt(timeRange, 10)
  const dashQ    = (() => {
    const p = new URLSearchParams({ days: String(days), timezone })
    if (selectedChannelId) p.set('channel_id', selectedChannelId)
    if (selectedBotId)     p.set('bot_id',     selectedBotId)
    return p.toString()
  })()
  const inboxQ = (() => {
    const p = new URLSearchParams()
    if (selectedChannelId) p.set('channel_id', selectedChannelId)
    if (selectedBotId)     p.set('bot_id',     selectedBotId)
    return p.toString()
  })()

  /* ── loaders ── */
  const loadStats = useCallback(
    () => loadSection('stats', `/api/stats?${dashQ}`, setStats),
    [dashQ, loadSection],
  )
  const loadAi = useCallback(
    () => loadSection('ai', `/api/reports/ai-performance?${dashQ}`, setAiPerformance),
    [dashQ, loadSection],
  )
  const loadDaily = useCallback(
    () => loadSection<{ data?: number[]; dates?: string[] }>(
      'daily', `/api/reports/daily-messages?${dashQ}`,
      d => {
        setDailyMessages(Array.isArray(d.data)  ? d.data.map(Number) : [])
        setDailyDates   (Array.isArray(d.dates) ? d.dates             : [])
      },
    ),
    [dashQ, loadSection],
  )
  const loadChannels = useCallback(
    () => loadSection<DashboardChannel[] | { data?: DashboardChannel[] }>(
      'channels', '/api/channels',
      d => {
        const list = Array.isArray(d) ? d : (d.data ?? [])
        setChannels(list.filter(c => c.status === 'connected'))
      },
    ),
    [loadSection],
  )
  const loadBots = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) throw new Error(label('Session expired.', 'انتهت صلاحية الجلسة.'))
      const res = await fetch(`${API}/api/bots`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!res.ok) throw new Error(label(`Could not load bots (${res.status}).`, `تعذر تحميل الوكلاء (${res.status}).`))
      const p    = await res.json()
      const list = Array.isArray(p) ? p as DashboardBot[] : (p.bots ?? p.data ?? []) as DashboardBot[]
      setBots(list)
    } catch (err) {
      setSectionErrors(prev => ({
        ...prev,
        channels: err instanceof Error ? err.message : label('Could not load bots.', 'تعذر تحميل الوكلاء.'),
      }))
    }
  }, [label])
  const loadInbox = useCallback(
    () => loadSection<{ data?: ApiConversation[] }>(
      'inbox', `/api/inbox${inboxQ ? `?${inboxQ}` : ''}`,
      d => {
        const rows = Array.isArray(d.data) ? d.data : []
        setRecentConversations(rows.slice(0, 6).map(item => ({
          id:         item.id,
          sender_name:item.sender_name || item.sender_id || label('Unknown', 'غير معروف'),
          channel:    item.channel?.type || 'webchat',
          message:    item.latest_message?.content || item.message_preview || item.last_message || '',
          ai_replied: Boolean(item.latest_message?.is_ai || item.ai_replied),
          time:       item.last_message_at || item.updated_at || item.created_at || null,
          status:     item.status || null,
        })))
      },
    ),
    [inboxQ, loadSection, label],
  )

  /* ── effects ── */
  useEffect(() => { void loadStats(); void loadAi(); void loadDaily() }, [loadStats, loadAi, loadDaily])
  useEffect(() => { void loadChannels(); void loadBots() }, [loadChannels, loadBots])
  useEffect(() => { void loadInbox() }, [loadInbox])

  /* ── derived ── */
  const aiShare    = aiPerformance?.ai_share_of_replies ?? 0
  const autoReplies = aiPerformance?.auto_replies ?? 0
  const selectedChannel = channels.find(channel => String(channel.id) === selectedChannelId)
  const selectedBot = bots.find(bot => String(bot.id) === selectedBotId)
  const channelOptions: SelectOption[] = [
    { value: '', label: label('All channels', 'كل القنوات'), icon: <Radio size={14} /> },
    ...channels.map(channel => ({
      value: String(channel.id),
      label: channel.page_name || channel.page_id || channel.type,
      icon: <ChannelIcon type={channel.type} size={14} />,
      description: channel.type,
    })),
  ]
  const botOptions: SelectOption[] = [
    { value: '', label: label('All AI agents', 'كل الوكلاء'), icon: <Bot size={14} /> },
    ...bots.map(bot => ({
      value: String(bot.id),
      label: bot.name,
      icon: <Bot size={14} />,
      badge: bot.status === 'active' ? label('Active', 'نشط') : undefined,
    })),
  ]
  const periodLabel = timeRange === '7d' ? label('Last 7 days', 'آخر 7 أيام') : timeRange === '30d' ? label('Last 30 days', 'آخر 30 يوماً') : label('Last 90 days', 'آخر 90 يوماً')


  /* ── render ── */
  return (
    <div className="min-h-screen pb-12">

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER BANNER
          A deliberate top strip: title left, filters + CTA right.
          Uses a hairline bottom border and a faint brand tint to separate
          it from the metric rows below without a heavy card.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        {/* Title row */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: title + sub-line */}
          <div className="flex items-start gap-3">
            {/* Brand accent */}
            <div
              className="mt-1 w-[3px] self-stretch rounded-full bg-brand/70 shrink-0"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-text-primary leading-tight">
                {label('Command Center', 'مركز التحكم')}
              </h1>
              <p className="mt-1 text-[13px] text-text-tertiary leading-relaxed">
                {label('Omnichannel performance · AI agent metrics · real-time conversation feed', 'أداء جميع القنوات · مؤشرات الوكلاء · المحادثات أولاً بأول')}
              </p>
            </div>
          </div>

          {/* Right: primary CTA */}
          <div className="shrink-0 self-start">
            <Link href="/dashboard/channels">
              <Button variant="primary" size="md" icon={<Plus size={15} />}>
                {label('Connect channel', 'ربط قناة')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter bar — sits below the title, full-width, separated by a subtle rule */}
        <div className="mt-6 rounded-2xl border border-border/70 bg-surface/70 p-3 sm:p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[min(100%,34rem)]">
              <Select
                id="dashboard-channel-filter"
                label={label('Channel account', 'حساب القناة')}
                value={selectedChannelId}
                options={channelOptions}
                onValueChange={setSelectedChannelId}
                size="md"
                className="w-full"
                triggerClassName="h-10 rounded-xl bg-background/70"
              />
              <Select
                id="dashboard-agent-filter"
                label={label('AI agent', 'وكيل الذكاء الاصطناعي')}
                value={selectedBotId}
                options={botOptions}
                onValueChange={setSelectedBotId}
                size="md"
                className="w-full"
                triggerClassName="h-10 rounded-xl bg-background/70"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-text-tertiary">
                <CalendarDays size={14} className="text-brand" aria-hidden="true" />
                {periodLabel}
              </span>
              <div
                role="group"
                aria-label={label('Time range', 'النطاق الزمني')}
                className="inline-flex w-fit items-center rounded-xl border border-border bg-background/70 p-1"
              >
                {(['7d', '30d', '90d'] as const).map((range, index) => (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={timeRange === range}
                    onClick={() => setTimeRange(range)}
                    className={`min-w-16 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                      timeRange === range
                        ? 'bg-surface-elevated text-text-primary shadow-sm ring-1 ring-border/70'
                        : 'text-text-tertiary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    {isRTL ? ['7 أيام', '30 يوماً', '90 يوماً'][index] : ['7 days', '30 days', '90 days'][index]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════════
          HANDOFF ALERT
          Shown only when tasks exist. Given a raised treatment so agents
          can't miss it, but it doesn't shout when the queue is clear.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <HandoffTaskQueue />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          METRICS ROW
          Visual hierarchy: Total Messages is the hero stat — wider, taller,
          with the brand colour. The three supporting stats sit beside it in
          a compact column on desktop and stack on mobile.
      ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        aria-label={label('Key metrics', 'المؤشرات الرئيسية')}
        className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* ── Hero: Total messages ── */}
        <motion.div
          variants={variants.fadeUp}
          transition={springs.standard}
          className="sm:col-span-2 lg:col-span-1"
        >
          {sectionLoading.stats ? (
            <MetricCardSkeleton />
          ) : sectionErrors.stats ? (
            <SectionError message={sectionErrors.stats} onRetry={() => void loadStats()} />
          ) : (
            <MetricCard
              label={label('Total Messages', 'إجمالي الرسائل')}
              value={(stats?.total_messages ?? 0).toLocaleString()}
              subValue={`${periodLabel} · ${selectedChannel?.page_name || selectedChannel?.type || label('all channels', 'كل القنوات')}${selectedBot ? ` · ${selectedBot.name}` : ''}`}
              variant="hero"
              icon={<MessageSquare size={17} />}
            />
          )}
        </motion.div>

        {/* ── AI share ── */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.ai ? (
            <MetricCardSkeleton />
          ) : sectionErrors.ai ? (
            <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} />
          ) : (
            <MetricCard
              label={label('AI Reply Rate', 'معدل ردود الذكاء الاصطناعي')}
              value={`${aiShare}%`}
              subValue={`${autoReplies.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} ${label('auto-replies', 'رد تلقائي')}`}
              variant="ai"
              icon={<Sparkles size={17} />}
            />
          )}
        </motion.div>

        {/* ── Response time ── */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.ai ? (
            <MetricCardSkeleton />
          ) : sectionErrors.ai ? (
            <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} />
          ) : (
            <MetricCard
              label={label('Median Response', 'متوسط زمن الرد')}
              value={aiPerformance?.median_response_time_formatted || '—'}
              subValue={label('Message to first reply', 'من استلام الرسالة إلى أول رد')}
              icon={<Clock size={17} />}
            />
          )}
        </motion.div>

        {/* ── Channels ── */}
        <motion.div variants={variants.fadeUp} transition={springs.standard}>
          {sectionLoading.channels ? (
            <MetricCardSkeleton />
          ) : sectionErrors.channels ? (
            <SectionError message={sectionErrors.channels} onRetry={() => void loadChannels()} />
          ) : (
            <MetricCard
              label={label('Active Channels', 'القنوات النشطة')}
              value={channels.length}
              subValue={label('Connected accounts', 'الحسابات المتصلة')}
              icon={<Radio size={17} />}
            />
          )}
        </motion.div>
      </motion.section>


      {/* ═══════════════════════════════════════════════════════════════════════
          MIDDLE ROW  —  Chart (2/3)  +  AI panel (1/3)
          The chart is the primary analytical view. The AI panel surfaces
          the two AI stats with extra context alongside the chart.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* ── Message volume chart (2 cols) ── */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pb-3 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp size={14} className="text-brand shrink-0" aria-hidden />
                <CardTitle>{label('Message volume', 'حجم الرسائل')}</CardTitle>
              </div>
              <CardDescription>
                {label('Daily totals', 'الإجمالي اليومي')}
                {selectedChannelId
                  ? ` ${label('for', 'لـ')} ${selectedChannel?.page_name ?? label('selected channel', 'القناة المحددة')}`
                  : ` ${label('across all channels', 'عبر جميع القنوات')}`}
                {selectedBot ? ` · ${selectedBot.name}` : ''}
                {' '}· {periodLabel}
              </CardDescription>
            </div>

            {/* Legend chip */}
            <div
              className="flex items-center gap-1.5 shrink-0 self-center
                         text-[10px] font-medium text-text-tertiary
                         border border-border/60 bg-surface-elevated
                         rounded-full px-2 py-1"
              aria-hidden
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-brand/50 shrink-0" />
              {label('Messages', 'الرسائل')}
            </div>
          </CardHeader>

          <CardContent className="flex-1 pt-1 pb-5">
            <VolumeChart
              data={dailyMessages}
              dates={dailyDates}
              loading={sectionLoading.daily}
              error={sectionErrors.daily}
              onRetry={() => void loadDaily()}
            />
          </CardContent>
        </Card>

        {/* ── AI performance panel (1 col) ── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles size={14} className="text-brand shrink-0" aria-hidden />
              <CardTitle>{label('AI performance', 'أداء الذكاء الاصطناعي')}</CardTitle>
            </div>
            <CardDescription>{label('Automation metrics for the period.', 'مؤشرات الأتمتة خلال الفترة المحددة.')}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 pt-0">
            {sectionLoading.ai ? (
              <div className="space-y-4 pt-1 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2.5 w-1/2 rounded bg-surface-elevated" />
                    <div className="h-7 w-2/3 rounded bg-surface-elevated" />
                    <div className="h-2 w-1/3 rounded bg-surface-elevated" />
                  </div>
                ))}
              </div>
            ) : sectionErrors.ai ? (
              <SectionError message={sectionErrors.ai} onRetry={() => void loadAi()} />
            ) : (
              <>
                {/* AI Share stat */}
                <div
                  className="rounded-xl border border-brand/15 bg-brand/5 p-4"
                  aria-label={`AI reply rate: ${aiShare}%`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={12} className="text-brand" aria-hidden />
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                      {label('AI reply rate', 'معدل ردود الذكاء الاصطناعي')}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-text-primary tracking-tight">
                    {aiShare}
                    <span className="text-xl font-semibold text-text-secondary ms-0.5">%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-tertiary">
                    {autoReplies.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} {label('auto-replies', 'رد تلقائي')} · {periodLabel}
                  </p>
                  {/* Progress bar */}
                  <div
                    className="mt-3 h-1.5 w-full rounded-full bg-brand/15"
                    role="progressbar"
                    aria-valuenow={aiShare}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={label(`AI replied to ${aiShare}% of messages`, `رد الذكاء الاصطناعي على ${aiShare}% من الرسائل`)}
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min(aiShare, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Response time stat */}
                <div
                  className="rounded-xl border border-border/70 bg-surface-elevated/60 p-4"
                  aria-label={`Median response time: ${aiPerformance?.median_response_time_formatted ?? '—'}`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={12} className="text-text-secondary" aria-hidden />
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                      {label('Median response', 'متوسط زمن الرد')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary tracking-tight">
                    {aiPerformance?.median_response_time_formatted || '—'}
                  </div>
                  <p className="mt-1 text-[11px] text-text-tertiary">{label('Message to first reply', 'من استلام الرسالة إلى أول رد')}</p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter>
            <Link href="/dashboard/analytics" className="w-full">
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ChevronRight size={13} />}
                className="w-full justify-between text-text-secondary"
              >
                {label('Full analytics', 'عرض كل التحليلات')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM ROW  —  Recent conversations (2/3)  +  Channels (1/3)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* ── Recent inbound conversations (2 cols) ── */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pb-3 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Inbox size={14} className="text-text-secondary shrink-0" aria-hidden />
                <CardTitle>{label('Recent conversations', 'أحدث المحادثات')}</CardTitle>
              </div>
              <CardDescription>{label('Latest inbound messages across connected platforms.', 'أحدث الرسائل الواردة عبر القنوات المتصلة.')}</CardDescription>
            </div>
            <Link href="/inbox" className="shrink-0 self-center">
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ArrowUpRight size={13} />}
                className="text-text-tertiary hover:text-text-primary"
              >
                {label('Open inbox', 'فتح صندوق الوارد')}
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {sectionLoading.inbox ? (
              <ul aria-busy aria-label={label('Loading recent conversations', 'جارٍ تحميل أحدث المحادثات')}>
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="border-b border-border/50 last:border-0">
                    <SkeletonRow widths={['2rem', '30%', '1fr', '3rem']} />
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
                heading={label('No conversations yet', 'لا توجد محادثات بعد')}
                body={label("They'll appear here once messages arrive on your connected channels.", 'ستظهر المحادثات هنا عند وصول رسائل إلى قنواتك المتصلة.')}
              />
            ) : (
              <ul
                aria-label={label('Recent conversations', 'أحدث المحادثات')}
                className="divide-y divide-border/50"
              >
                {recentConversations.map(item => (
                  <li key={item.id}>
                    <Link
                      href={`/inbox?id=${item.id}`}
                      className="group flex items-center gap-3 px-5 py-3.5
                                 hover:bg-surface-elevated/60 transition-colors duration-100
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-inset focus-visible:ring-brand/40"
                      aria-label={label(`Conversation with ${item.sender_name}`, `محادثة مع ${item.sender_name}`)}
                    >
                      {/* Avatar */}
                      <ConversationAvatar name={item.sender_name} channel={item.channel} />

                      {/* Name + preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 min-w-0">
                          <span className="text-[13px] font-semibold text-text-primary truncate leading-snug">
                            {item.sender_name}
                          </span>
                          {item.ai_replied ? (
                            <Badge variant="ai" size="xs" className="shrink-0">{label('AI replied', 'ردّ الوكيل')}</Badge>
                          ) : (
                            <Badge variant="warning" size="xs" dot dotPulse className="shrink-0">
                              {label('Needs agent', 'تحتاج إلى متابعة')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[12px] text-text-tertiary truncate leading-snug">
                          {item.message
                            ? item.message
                            : <span className="italic text-text-disabled">{label('No preview', 'لا يوجد محتوى للعرض')}</span>}
                        </p>
                      </div>

                      {/* Time + chevron */}
                      <div className="flex items-center gap-1.5 shrink-0 ms-2">
                        {item.time && (
                          <time
                            dateTime={item.time}
                            title={new Date(item.time).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                            className="text-[11px] text-text-disabled tabular-nums whitespace-nowrap"
                          >
                            {formatRelativeTime(item.time, isRTL)}
                          </time>
                        )}
                        <ChevronRight
                          size={14}
                          className="text-text-disabled/60 group-hover:text-text-tertiary
                                     transition-colors duration-100 shrink-0"
                          aria-hidden
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
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={<ArrowUpRight size={13} />}
                  className="w-full justify-center text-text-tertiary"
                >
                  {label('View all conversations', 'عرض جميع المحادثات')}
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>


        {/* ── Connected channels panel (1 col) ── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <Wifi size={14} className="text-text-secondary shrink-0" aria-hidden />
              <CardTitle>{label('Connected channels', 'القنوات المتصلة')}</CardTitle>
            </div>
            <CardDescription>{label('Active accounts in this workspace.', 'الحسابات النشطة في مساحة العمل.')}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {sectionLoading.channels ? (
              <div className="px-5 py-2 space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 py-2.5 animate-pulse"
                  >
                    <div className="w-5 h-5 rounded-full bg-surface-elevated shrink-0" />
                    <div className="h-2.5 flex-1 rounded bg-surface-elevated" />
                    <div className="h-2.5 w-14 rounded bg-surface-elevated" />
                  </div>
                ))}
              </div>
            ) : sectionErrors.channels ? (
              <div className="p-4">
                <SectionError
                  message={sectionErrors.channels}
                  onRetry={() => void loadChannels()}
                />
              </div>
            ) : channels.length === 0 ? (
              <EmptyState
                icon={<Wifi size={26} />}
                heading={label('No channels yet', 'لا توجد قنوات بعد')}
                body={label('Connect a channel to start receiving messages.', 'اربط قناة لبدء استقبال الرسائل.')}
                action={
                  <Link href="/dashboard/channels">
                    <Button variant="outline" size="sm" icon={<Plus size={13} />}>
                      {label('Connect channel', 'ربط قناة')}
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul
                aria-label={label('Connected channels', 'القنوات المتصلة')}
                className="divide-y divide-border/50"
              >
                {channels.map(ch => (
                  <li key={ch.id} className="flex items-center gap-3 px-5 py-3">
                    <ChannelIcon type={ch.type} size={17} />
                    <span className="flex-1 truncate text-[13px] font-medium text-text-primary">
                      {ch.page_name || ch.page_id || ch.type}
                    </span>
                    {/* Connected indicator — small dot is enough; don't need a full badge */}
                    <span
                      className="w-2 h-2 rounded-full bg-success shrink-0"
                      aria-label={label('Connected', 'متصل')}
                      title={label('Connected', 'متصل')}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>

          <CardFooter>
            <Link href="/dashboard/channels" className="w-full">
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ChevronRight size={13} />}
                className="w-full justify-between text-text-tertiary"
              >
                {label('Manage channels', 'إدارة القنوات')}
              </Button>
            </Link>
          </CardFooter>
        </Card>

      </div>{/* end bottom row */}

    </div>
  )
}
