'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Bot, Clock, MessageSquare, RefreshCw, ThumbsUp } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import { MetricCardSkeleton } from '../../../components/ui/Skeleton'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

type Analytics = {
  range?: { start?: string; end?: string; timezone?: string }
  conversations?: { total?: number; new?: number; open?: number; closed?: number; median_response_time_minutes?: number | null }
  ai?: { ai_conversations?: number; ai_responses?: number; escalated_conversations?: number; ai_share_of_replies?: number }
}
type CsatAnalytics = { csat_score: number | null; total_ratings: number; positive_ratings: number; negative_ratings: number }
type FilterOption = { id: number; name: string; type?: string; page_name?: string; page_id?: string }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const PRESETS: Record<string, string> = { today: 'today', '7d': 'last_7_days', '30d': 'last_30_days' }

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find((cookie) => cookie.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

export default function AnalyticsPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [data, setData] = useState<Analytics | null>(null)
  const [csat, setCsat] = useState<CsatAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [channelId, setChannelId] = useState('')
  const [botId, setBotId] = useState('')
  const [channels, setChannels] = useState<FilterOption[]>([])
  const [bots, setBots] = useState<FilterOption[]>([])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to view analytics.')
      const businessId = getSelectedBusinessId()
      if (!businessId) throw new Error('Select a business before viewing analytics.')
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() }
      const params = new URLSearchParams({ preset: PRESETS[dateRange] })
      if (channelId) params.set('channel_id', channelId)
      if (botId) params.set('bot_id', botId)
      const response = await fetch(`${API}/api/businesses/${businessId}/analytics/dashboard?${params}`, { headers })
      if (!response.ok) throw new Error(`Could not load analytics (HTTP ${response.status}).`)
      setData(await response.json())
      const days = dateRange === 'today' ? 1 : dateRange === '7d' ? 7 : 30
      const csatParams = new URLSearchParams({ days: String(days) })
      if (channelId) csatParams.set('channel_id', channelId)
      if (botId) csatParams.set('bot_id', botId)
      const csatResponse = await fetch(`${API}/api/businesses/${businessId}/analytics/csat?${csatParams}`, { headers })
      setCsat(csatResponse.ok ? await csatResponse.json() : null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load analytics.')
      setData(null)
      setCsat(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange, channelId, botId])

  useEffect(() => {
    void Promise.resolve().then(() => fetchAnalytics())
  }, [fetchAnalytics])

  useEffect(() => {
    const loadFilterOptions = async () => {
      const token = getToken()
      const businessId = getSelectedBusinessId()
      if (!token || !businessId) return
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() }
      const [channelsResponse, botsResponse] = await Promise.all([
        fetch(`${API}/api/channels`, { headers }),
        fetch(`${API}/api/bots`, { headers }),
      ])
      const [channelsResult, botsResult] = await Promise.all([
        channelsResponse.ok ? channelsResponse.json() : [],
        botsResponse.ok ? botsResponse.json() : [],
      ])
      const rows = (result: unknown): FilterOption[] => {
        const envelope = result as { data?: unknown; bots?: unknown; channels?: unknown } | null
        const data = Array.isArray(result) ? result : envelope?.data ?? envelope?.bots ?? envelope?.channels
        return Array.isArray(data) ? data as FilterOption[] : []
      }
      setChannels(rows(channelsResult))
      setBots(rows(botsResult))
    }
    void Promise.resolve().then(loadFilterOptions).catch((cause) => {
      console.warn('Could not load analytics filter options:', cause)
    })
  }, [])

  const medianMinutes = data?.conversations?.median_response_time_minutes
  const responseTime = medianMinutes == null ? L('No data', 'لا توجد بيانات') : medianMinutes < 1 ? `${Math.round(medianMinutes * 60)} ${L('sec', 'ثانية')}` : `${medianMinutes} ${L('min', 'دقيقة')}`

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader title={L('Analytics', 'التحليلات')} description={L('Understand conversation volume, AI activity, and customer feedback across your business.', 'تابع حجم المحادثات ونشاط الذكاء الاصطناعي وملاحظات العملاء عبر نشاطك التجاري.')} primaryAction={
        <Button variant="secondary" size="sm" onClick={() => void fetchAnalytics()} disabled={loading} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>{L('Refresh', 'تحديث')}</Button>
      }>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-card p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{L('Reporting period', 'الفترة الزمنية')}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={L('Analytics date range', 'النطاق الزمني للتحليلات')}>
              {Object.keys(PRESETS).map((range) => {
                const label = range === 'today' ? L('Today', 'اليوم') : range === '7d' ? L('7 days', '٧ أيام') : L('30 days', '٣٠ يومًا')
                return <button key={range} type="button" aria-pressed={dateRange === range} onClick={() => setDateRange(range)} className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${dateRange === range ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-surface-elevated text-text-secondary hover:border-brand/50 hover:text-text-primary'}`}>{label}</button>
              })}
            </div>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              label={L('Channel account', 'حساب القناة')}
              ariaLabel={L('Channel account filter', 'تصفية حسب حساب القناة')}
              value={channelId}
              onValueChange={setChannelId}
              placeholder={L('All connected accounts', 'كل الحسابات المتصلة')}
              options={[{ value: '', label: L('All connected accounts', 'كل الحسابات المتصلة') }, ...channels.map((channel) => ({ value: String(channel.id), label: channel.page_name || channel.name || channel.type || channel.page_id || `Account ${channel.id}` }))]}
            />
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              label={L('Agent', 'الوكيل')}
              ariaLabel={L('Filter by agent', 'تصفية حسب الوكيل')}
              value={botId}
              onValueChange={setBotId}
              placeholder={L('All agents', 'كل الوكلاء')}
              options={[{ value: '', label: L('All agents', 'كل الوكلاء') }, ...bots.map((bot) => ({ value: String(bot.id), label: bot.name || `Agent ${bot.id}` }))]}
            />
          </div>
        </div>
      </PageHeader>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchAnalytics()}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <MetricCardSkeleton key={index} />)}</div> : data && <>
        <section aria-label={L('Conversation metrics', 'مؤشرات المحادثات')} className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">{L('Conversations', 'المحادثات')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={L('Total', 'الإجمالي')} value={data.conversations?.total ?? 0} icon={<MessageSquare size={18} />} />
            <MetricCard label={L('New in period', 'جديدة خلال الفترة')} value={data.conversations?.new ?? 0} icon={<Activity size={18} />} />
            <MetricCard label={L('Open', 'مفتوحة')} value={data.conversations?.open ?? 0} icon={<MessageSquare size={18} />} />
            <MetricCard label={L('Closed', 'مغلقة')} value={data.conversations?.closed ?? 0} icon={<MessageSquare size={18} />} />
          </div>
        </section>
        <section aria-label={L('AI metrics', 'مؤشرات الذكاء الاصطناعي')} className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">{L('AI activity', 'نشاط الذكاء الاصطناعي')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={L('AI conversations', 'محادثات الذكاء الاصطناعي')} value={data.ai?.ai_conversations ?? 0} icon={<Bot size={18} />} />
            <MetricCard label={L('AI replies', 'ردود الذكاء الاصطناعي')} value={data.ai?.ai_responses ?? 0} icon={<Bot size={18} />} />
            <MetricCard label={L('Escalated conversations', 'المحادثات المصعّدة')} value={data.ai?.escalated_conversations ?? 0} icon={<Activity size={18} />} />
            <MetricCard label={L('Median first reply', 'وسيط زمن أول رد')} value={responseTime} icon={<Clock size={18} />} />
          </div>
          <p className="text-xs text-text-tertiary">{L('AI share of replies', 'نسبة ردود الذكاء الاصطناعي')}: {data.ai?.ai_share_of_replies ?? 0}% {L('of eligible customer replies in', 'من ردود العملاء المؤهلة حسب')}{' '}{data.range?.timezone ?? L('your business timezone', 'المنطقة الزمنية للنشاط')}.</p>
        </section>
        <section aria-label={L('Customer feedback metrics', 'مؤشرات ملاحظات العملاء')} className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">{L('Customer feedback', 'ملاحظات العملاء')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={L('Positive rating share', 'نسبة التقييمات الإيجابية')} value={csat === null ? L('Unavailable', 'غير متاح') : csat.total_ratings === 0 ? L('No ratings', 'لا توجد تقييمات') : `${csat.csat_score ?? '—'}%`} icon={<ThumbsUp size={18} />} />
            <MetricCard label={L('Total ratings', 'إجمالي التقييمات')} value={csat?.total_ratings ?? L('Unavailable', 'غير متاح')} icon={<MessageSquare size={18} />} />
            <MetricCard label={L('Positive ratings', 'التقييمات الإيجابية')} value={csat?.positive_ratings ?? L('Unavailable', 'غير متاح')} icon={<ThumbsUp size={18} />} />
            <MetricCard label={L('Negative ratings', 'التقييمات السلبية')} value={csat?.negative_ratings ?? L('Unavailable', 'غير متاح')} icon={<Activity size={18} />} />
          </div>
          <p className="text-xs text-text-tertiary">{L('Positive rating share uses recorded ratings for this period. When there are no ratings, the page says “No ratings” instead of showing 0%.', 'تُحسب نسبة التقييمات الإيجابية من التقييمات المسجلة لهذه الفترة. عند عدم وجود تقييمات، تظهر عبارة «لا توجد تقييمات» بدلًا من ٠٪.')}</p>
        </section>
      </>}
    </main>
  )
}
