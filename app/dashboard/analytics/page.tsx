'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Bot, Clock, MessageSquare, RefreshCw, ThumbsUp } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Button from '../../../components/ui/Button'
import { MetricCardSkeleton } from '../../../components/ui/Skeleton'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'

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
  const responseTime = medianMinutes == null ? 'No data' : medianMinutes < 1 ? `${Math.round(medianMinutes * 60)} sec` : `${medianMinutes} min`

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Conversation and AI metrics calculated from your business activity." primaryAction={
        <Button variant="outline" size="sm" onClick={() => void fetchAnalytics()} disabled={loading} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>Refresh</Button>
      }>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Analytics date range">
          {Object.keys(PRESETS).map((range) => <button key={range} type="button" aria-pressed={dateRange === range} onClick={() => setDateRange(range)} className={`border px-3 py-1.5 text-sm ${dateRange === range ? 'border-brand text-brand' : 'border-border text-text-secondary'}`}>{range === 'today' ? 'Today' : range === '7d' ? '7 days' : '30 days'}</button>)}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Analytics filters">
          <label className="sr-only" htmlFor="analytics-account-filter">Connected account</label>
          <select id="analytics-account-filter" value={channelId} onChange={(event) => setChannelId(event.target.value)} className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary">
            <option value="">All connected accounts</option>
            {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.page_name || channel.name || channel.type || channel.page_id || `Account ${channel.id}`}</option>)}
          </select>
          <label className="sr-only" htmlFor="analytics-bot-filter">Bot</label>
          <select id="analytics-bot-filter" value={botId} onChange={(event) => setBotId(event.target.value)} className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary">
            <option value="">All bots</option>
            {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name || `Bot ${bot.id}`}</option>)}
          </select>
        </div>
      </PageHeader>

      {error && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchAnalytics()}>Retry</Button></div>}

      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <MetricCardSkeleton key={index} />)}</div> : data && <>
        <section aria-label="Conversation metrics" className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">Conversations</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total" value={data.conversations?.total ?? 0} icon={<MessageSquare size={18} />} />
            <MetricCard label="New in period" value={data.conversations?.new ?? 0} icon={<Activity size={18} />} />
            <MetricCard label="Open" value={data.conversations?.open ?? 0} icon={<MessageSquare size={18} />} />
            <MetricCard label="Closed" value={data.conversations?.closed ?? 0} icon={<MessageSquare size={18} />} />
          </div>
        </section>
        <section aria-label="AI metrics" className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">AI activity</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="AI conversations" value={data.ai?.ai_conversations ?? 0} icon={<Bot size={18} />} />
            <MetricCard label="AI replies" value={data.ai?.ai_responses ?? 0} icon={<Bot size={18} />} />
            <MetricCard label="Escalated conversations" value={data.ai?.escalated_conversations ?? 0} icon={<Activity size={18} />} />
            <MetricCard label="Median first reply" value={responseTime} icon={<Clock size={18} />} />
          </div>
          <p className="text-xs text-text-tertiary">AI share of replies: {data.ai?.ai_share_of_replies ?? 0}% of eligible customer replies in {data.range?.timezone ?? 'your business timezone'}.</p>
        </section>
        <section aria-label="Customer feedback metrics" className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">Customer feedback</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Positive rating share" value={csat === null ? 'Unavailable' : csat.total_ratings === 0 ? 'No ratings' : `${csat.csat_score ?? '—'}%`} icon={<ThumbsUp size={18} />} />
            <MetricCard label="Total ratings" value={csat?.total_ratings ?? 'Unavailable'} icon={<MessageSquare size={18} />} />
            <MetricCard label="Positive ratings" value={csat?.positive_ratings ?? 'Unavailable'} icon={<ThumbsUp size={18} />} />
            <MetricCard label="Negative ratings" value={csat?.negative_ratings ?? 'Unavailable'} icon={<Activity size={18} />} />
          </div>
          <p className="text-xs text-text-tertiary">Positive rating share is calculated from recorded positive and negative ratings for the selected period. No rating data is shown as “No ratings,” not 0%.</p>
        </section>
      </>}
    </div>
  )
}
