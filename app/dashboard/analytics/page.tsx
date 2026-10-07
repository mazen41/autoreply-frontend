'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Bot, Clock, MessageSquare, RefreshCw } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Button from '../../../components/ui/Button'
import { MetricCardSkeleton } from '../../../components/ui/Skeleton'

type Analytics = {
  conversations?: { total?: number; new?: number; open?: number; closed?: number; avg_response_time_minutes?: number | null }
  ai?: { ai_conversations?: number; ai_responses?: number; escalated_conversations?: number; ai_success_rate?: number }
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const PRESETS: Record<string, string> = { today: 'today', '7d': 'last_7_days', '30d': 'last_30_days' }

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find((cookie) => cookie.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to view analytics.')
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      const userResponse = await fetch(`${API}/api/auth/user`, { headers })
      if (!userResponse.ok) throw new Error(`Could not load your account (HTTP ${userResponse.status}).`)
      const user = await userResponse.json()
      if (!user.business_id) throw new Error('No business profile is available for analytics.')
      const response = await fetch(`${API}/api/businesses/${user.business_id}/analytics/dashboard?preset=${PRESETS[dateRange]}`, { headers })
      if (!response.ok) throw new Error(`Could not load analytics (HTTP ${response.status}).`)
      setData(await response.json())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load analytics.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { void fetchAnalytics() }, [fetchAnalytics])

  const avgMinutes = data?.conversations?.avg_response_time_minutes
  const responseTime = avgMinutes == null ? 'No data' : avgMinutes < 1 ? `${Math.round(avgMinutes * 60)} sec` : `${avgMinutes} min`

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Conversation and AI metrics calculated from your business activity." primaryAction={
        <Button variant="outline" size="sm" onClick={() => void fetchAnalytics()} disabled={loading} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>Refresh</Button>
      }>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Analytics date range">
          {Object.keys(PRESETS).map((range) => <button key={range} type="button" aria-pressed={dateRange === range} onClick={() => setDateRange(range)} className={`border px-3 py-1.5 text-sm ${dateRange === range ? 'border-brand text-brand' : 'border-border text-text-secondary'}`}>{range === 'today' ? 'Today' : range === '7d' ? '7 days' : '30 days'}</button>)}
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
            <MetricCard label="Average first reply" value={responseTime} icon={<Clock size={18} />} />
          </div>
          <p className="text-xs text-text-tertiary">AI success rate: {data.ai?.ai_success_rate ?? 0}% of outbound messages in the selected period.</p>
        </section>
      </>}
    </div>
  )
}
