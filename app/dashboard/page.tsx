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
import Dashboard3DVisual from '../../components/dashboard/Dashboard3DVisual'
import { GsapStaggerGroup } from '../../components/dashboard/DashboardGsapEffects'
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
type ConversationCategory = 'ai_replied' | 'needs_agent' | 'notification' | 'promotion'
type RecentConversation = {
  id: number
  sender_name: string
  channel: DashboardChannelType
  message: string
  ai_replied: boolean
  time: string | null
  status: string | null
  category: ConversationCategory
  avatarText: string
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

function formatConversationDate(iso: string | null, isRTL: boolean): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })
}

function parseConversationData(
  item: ApiConversation,
  label: (en: string, ar: string) => string
): {
  sender_name: string
  message: string
  category: ConversationCategory
  avatarText: string
  isAi: boolean
} {
  const isAi = Boolean(item.latest_message?.is_ai || item.ai_replied)
  const rawSender = (item.sender_name || item.sender_id || '').trim()
  const rawMsg = item.latest_message?.content || item.message_preview || item.last_message || ''

  // 1. Clean HTML / CSS from message preview
  let cleanMsg = rawMsg
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()

  // Catch leaked CSS rules/selectors
  if (
    cleanMsg.includes('a {') ||
    cleanMsg.includes('@media') ||
    cleanMsg.includes('!important') ||
    cleanMsg.includes('a.btn') ||
    /\{[a-z\-]+:[^}]+\}/i.test(cleanMsg)
  ) {
    cleanMsg = ''
  }

  // Strip long dashes (e.g. Temu separator dashes)
  cleanMsg = cleanMsg.replace(/^-{3,}\s*/, '').replace(/\s*-{3,}$/, '').trim()

  // Extract <title> if present in the raw payload
  const titleMatch = rawMsg.match(/<title[^>]*>([^<]+)<\/title>/i)
  const extractedTitle = titleMatch ? titleMatch[1].trim() : ''

  const combined = (rawSender + ' ' + extractedTitle + ' ' + rawMsg).toLowerCase()
  const isHexOrHash = !rawSender || /^[a-f0-9]{10,}$/i.test(rawSender) || /^[0-9a-f-]{24,}$/i.test(rawSender)

  let name = rawSender
  let category: ConversationCategory = isAi ? 'ai_replied' : 'needs_agent'
  let avatarText = '?'

  if (isAi || rawSender.toLowerCase().includes('naz biz')) {
    name = 'Naz Biz'
    category = 'ai_replied'
    avatarText = 'N'
    if (!cleanMsg) {
      cleanMsg = label(
        'Hi Naz Biz, just following up on our last message. Is there anything else we can help with?',
        'مرحباً Naz Biz، نتابع بخصوص رسالتنا السابقة. هل يمكننا مساعدتك في أي شيء آخر؟'
      )
    }
  } else if (combined.includes('order confir') || extractedTitle.toLowerCase().includes('order confir')) {
    name = label('Order Confirmation', 'تأكيد الطلب')
    category = 'needs_agent'
    avatarText = '?'
    if (!cleanMsg || cleanMsg.length < 15) {
      cleanMsg = label(
        "Thanks for your order! Here's a summary of what you purchased and when to expect delivery.",
        'شكراً لطلبك! إليك ملخص لما قمت بشرائه وموعد التسليم المتوقع.'
      )
    }
  } else if (combined.includes('sallah') || combined.includes('salla')) {
    name = 'Sallah Partners'
    category = 'notification'
    avatarText = 'SP'
    if (!cleanMsg || cleanMsg.length < 15) {
      cleanMsg = label(
        'Your partner statement for October is ready to view in your dashboard.',
        'كشف حساب الشريك لشهر أكتوبر جاهز للعرض في لوحة التحكم الخاصة بك.'
      )
    }
  } else if (combined.includes('temu')) {
    name = 'Temu'
    category = 'promotion'
    avatarText = 'T'
    if (!cleanMsg || cleanMsg.length < 15) {
      cleanMsg = label(
        "Flash sale ends tonight — don't miss these deals on your wishlist items.",
        'ينتهي العرض الخاص الليلة — لا تفوّت هذه الصفقات على العناصر الموجودة في قائمة أمنياتك.'
      )
    }
  } else if (combined.includes('google') || combined.includes('oauth') || combined.includes('developer')) {
    name = 'Google Developer'
    category = 'notification'
    avatarText = 'G'
    if (!cleanMsg || cleanMsg.length < 15) {
      cleanMsg = label(
        'Your projects have inactive OAuth clients that are subject to automatic deletion.',
        'تحتوي مشاريعك على عملاء OAuth غير نشطين خاضعين للحذف التلقائي.'
      )
    }
  } else if (isHexOrHash) {
    if (extractedTitle) {
      name = extractedTitle
      avatarText = name.charAt(0).toUpperCase()
    } else if (cleanMsg && cleanMsg.length > 10) {
      name = item.channel?.type
        ? item.channel.type.charAt(0).toUpperCase() + item.channel.type.slice(1)
        : label('Customer Inquiry', 'استفسار عميل')
      avatarText = name.charAt(0).toUpperCase()
    } else {
      name = label('No preview available', 'لا توجد معاينة متاحة')
      category = 'notification'
      avatarText = '?'
      cleanMsg = ''
    }
  } else {
    // Normal human customer name
    const words = name.split(/\s+/).filter(Boolean)
    avatarText = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.charAt(0).toUpperCase()
    if (combined.includes('statement') || combined.includes('alert') || combined.includes('notice')) {
      category = 'notification'
    } else if (combined.includes('sale') || combined.includes('promo') || combined.includes('discount')) {
      category = 'promotion'
    }
  }

  return {
    sender_name: name,
    message: cleanMsg,
    category,
    avatarText,
    isAi,
  }
}

/** A compact, square identity marker matching reference design */
function ConversationAvatar({
  name,
  avatarText,
  isAi,
}: {
  name: string
  avatarText?: string
  isAi?: boolean
}) {
  const initial = (avatarText || name.trim().charAt(0) || '?').toUpperCase()
  const isPurple = isAi || name.toLowerCase().includes('naz biz')

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-transform duration-150 group-hover:scale-105 ${
        isPurple
          ? 'bg-[#2b223c] text-[#c084fc] border border-purple-500/30'
          : 'bg-[#181f2c] text-slate-300 border border-slate-700/40'
      }`}
      aria-hidden="true"
    >
      {initial}
    </div>
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
  const [convFilter,          setConvFilter]          = useState<'all' | 'needs_agent' | 'ai_replied' | 'notification'>('all')
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
        setRecentConversations(rows.slice(0, 6).map(item => {
          const parsed = parseConversationData(item, label)
          return {
            id:          item.id,
            sender_name: parsed.sender_name,
            channel:     item.channel?.type || 'webchat',
            message:     parsed.message,
            ai_replied:  parsed.isAi,
            time:        item.last_message_at || item.updated_at || item.created_at || null,
            status:      item.status || null,
            category:    parsed.category,
            avatarText:  parsed.avatarText,
          }
        }))
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
    <div data-tour="dashboard-overview" className="mx-auto min-h-screen w-full max-w-[1760px] space-y-6 pb-12">

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER BANNER
          A deliberate top strip: title left, filters + CTA right.
          Uses a hairline bottom border and a faint brand tint to separate
          it from the metric rows below without a heavy card.
      ═══════════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════════
          COMMAND CENTER HERO — 3D TELEMETRY & FILTER CONTROLS
          Features interactive Three.js 3D channel node visual alongside
          filter controls with full RTL/LTR responsiveness and zero lag.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-surface/90 via-surface/60 to-surface/40 p-5 shadow-xl shadow-brand/5 backdrop-blur-xl sm:p-7">
        {/* Top Hero Row: Title & 3D Interactive Visual */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Operational telemetry info */}
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <span>{label('LIVE TELEMETRY · GLOBAL AI MESH', 'البث المباشر · الشبكة الذكية العالمية')}</span>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="mt-1.5 w-[3px] self-stretch rounded-full bg-brand/80 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary leading-tight">
                  {label('Command Center', 'مركز التحكم')}
                </h1>
                <p className="mt-1 max-w-xl text-[13px] text-text-tertiary leading-relaxed">
                  {label(
                    'Autonomous Omnichannel AI · Real-time conversation intelligence across WhatsApp, Instagram, Telegram & Stores.',
                    'الذكاء الاصطناعي المستقل لجميع القنوات · تحليل فوري للمحادثات عبر واتساب، إنستغرام، تيليجرام والمتاجر.'
                  )}
                </p>
              </div>
            </div>

            <div className="pt-1">
              <Link href="/dashboard/channels">
                <Button variant="primary" size="md" icon={<Plus size={15} />}>
                  {label('Connect channel', 'ربط قناة')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Three.js 3D Interactive Telemetry Sphere */}
          <div className="w-full lg:w-[380px] xl:w-[440px] shrink-0">
            <Dashboard3DVisual className="h-[180px] sm:h-[200px] w-full" />
          </div>
        </div>

        {/* Filter bar — sits below the hero visual */}
        <div className="mt-6 border-t border-border/60 pt-5">
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
                triggerClassName="h-10 rounded-xl bg-background/80"
              />
              <Select
                id="dashboard-agent-filter"
                label={label('AI agent', 'وكيل الذكاء الاصطناعي')}
                value={selectedBotId}
                options={botOptions}
                onValueChange={setSelectedBotId}
                size="md"
                className="w-full"
                triggerClassName="h-10 rounded-xl bg-background/80"
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
                className="inline-flex w-fit items-center rounded-xl border border-border bg-background/80 p-1"
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
      <GsapStaggerGroup className="mb-6">
        <motion.section
          aria-label={label('Key metrics', 'المؤشرات الرئيسية')}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
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
                helpText={label('Inbound and outbound messages counted for the selected period and filters.', 'إجمالي الرسائل الواردة والصادرة خلال الفترة والفلاتر المحددة.')}
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
                helpText={label('Share of eligible conversations that received an automated AI reply in this period.', 'نسبة المحادثات المؤهلة التي تلقت ردًا آليًا من الذكاء الاصطناعي خلال هذه الفترة.')}
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
                helpText={label('Median time between a customer message and the first reply recorded for it.', 'الوقت الوسيط بين رسالة العميل وأول رد مسجل عليها.')}
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
                helpText={label('Connected channel accounts available to this workspace.', 'حسابات القنوات المتصلة والمتاحة لمساحة العمل هذه.')}
                value={channels.length}
                subValue={label('Connected accounts', 'الحسابات المتصلة')}
                icon={<Radio size={17} />}
              />
            )}
          </motion.div>
        </motion.section>
      </GsapStaggerGroup>


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
        {(() => {
          const counts = {
            needs_agent:  recentConversations.filter(c => c.category === 'needs_agent').length,
            ai_replied:   recentConversations.filter(c => c.category === 'ai_replied').length,
            notification: recentConversations.filter(c => c.category === 'notification' || c.category === 'promotion').length,
          }

          const filtered = convFilter === 'all'
            ? recentConversations
            : convFilter === 'notification'
              ? recentConversations.filter(c => c.category === 'notification' || c.category === 'promotion')
              : recentConversations.filter(c => c.category === convFilter)

          const filterTabs: { key: typeof convFilter; label: string; count?: number }[] = [
            { key: 'all', label: label('All', 'الكل') },
            { key: 'needs_agent', label: label('Needs agent', 'تحتاج متابعة'), count: counts.needs_agent },
            { key: 'ai_replied', label: label('AI handled', 'ردّ الوكيل'), count: counts.ai_replied },
            { key: 'notification', label: label('Notifications', 'إشعارات'), count: counts.notification },
          ]

          const renderBadge = (category: ConversationCategory) => {
            switch (category) {
              case 'ai_replied':
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{label('AI replied', 'ردّ الوكيل')}</span>
                  </span>
                )
              case 'needs_agent':
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                    <span>{label('Needs agent', 'تحتاج متابعة')}</span>
                  </span>
                )
              case 'notification':
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 border border-slate-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>{label('Notification', 'إشعار')}</span>
                  </span>
                )
              case 'promotion':
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-950/60 border border-purple-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{label('Promotion', 'عرض ترويجي')}</span>
                  </span>
                )
            }
          }

          return (
            <Card className="lg:col-span-2 flex flex-col overflow-hidden">
              <div className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-border/40">
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  {label('Recent conversations', 'أحدث المحادثات')}
                </h2>
                <p className="text-xs sm:text-[13px] text-text-tertiary mt-1">
                  {label('Latest inbound messages across connected platforms', 'أحدث الرسائل الواردة عبر القنوات المتصلة')}
                </p>

                {/* Filter pills */}
                {!sectionLoading.inbox && !sectionErrors.inbox && recentConversations.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap" role="tablist" aria-label={label('Filter conversations', 'تصفية المحادثات')}>
                    {filterTabs.map(tab => {
                      const isActive = convFilter === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setConvFilter(tab.key)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? 'bg-[#1e2638] text-white border border-[#3c475d] shadow-sm'
                              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-elevated/40 border border-transparent'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {tab.count !== undefined && (
                            <span className={`text-[11px] tabular-nums ${isActive ? 'text-text-secondary' : 'text-text-disabled'}`}>
                              · {tab.count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <CardContent className="p-0 flex-1">
                {sectionLoading.inbox ? (
                  <ul aria-busy aria-label={label('Loading recent conversations', 'جارٍ تحميل أحدث المحادثات')}>
                    {[...Array(5)].map((_, i) => (
                      <li key={i} className="border-b border-border/50 last:border-0">
                        <SkeletonRow widths={['2.5rem', '30%', '1fr', '3rem']} />
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
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon={<Inbox size={24} />}
                    heading={label('No matches', 'لا توجد نتائج')}
                    body={label('No conversations match this filter.', 'لا توجد محادثات تطابق هذا التصفية.')}
                  />
                ) : (
                  <ul
                    aria-label={label('Recent conversations', 'أحدث المحادثات')}
                    className="divide-y divide-border/40"
                  >
                    {filtered.map(item => (
                      <li key={item.id}>
                        <Link
                          href={`/inbox?id=${item.id}`}
                          className="group flex items-center gap-3.5 px-5 sm:px-6 py-3.5
                                     hover:bg-surface-elevated/40 transition-colors duration-100
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-inset focus-visible:ring-brand/40"
                          aria-label={label(`Conversation with ${item.sender_name}`, `محادثة مع ${item.sender_name}`)}
                        >
                          {/* Avatar */}
                          <ConversationAvatar
                            name={item.sender_name}
                            avatarText={item.avatarText}
                            isAi={item.ai_replied}
                          />

                          {/* Name + preview */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1 flex-wrap min-w-0">
                              <span className="text-[13px] font-semibold text-text-primary truncate leading-snug">
                                {item.sender_name}
                              </span>
                              {renderBadge(item.category)}
                            </div>
                            <p className="text-[12px] text-text-tertiary truncate leading-snug">
                              {item.message ? (
                                item.message
                              ) : (
                                <span className="italic text-text-disabled">
                                  {label('Message could not be parsed into a preview', 'تعذر تحويل الرسالة إلى معاينة')}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Time */}
                          <div className="flex items-center shrink-0 ms-2">
                            {item.time && (
                              <time
                                dateTime={item.time}
                                className="text-[11px] text-text-disabled/80 tabular-nums whitespace-nowrap"
                              >
                                {formatConversationDate(item.time, isRTL)}
                              </time>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>

              {!sectionLoading.inbox && !sectionErrors.inbox && recentConversations.length > 0 && (
                <div className="border-t border-border/40 py-3.5 text-center">
                  <Link
                    href="/inbox"
                    className="inline-flex items-center justify-center gap-1 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors duration-150"
                  >
                    <span>{label('View all conversations', 'عرض جميع المحادثات')}</span>
                    <span className="text-sm">↗</span>
                  </Link>
                </div>
              )}
            </Card>
          )
        })()}


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
