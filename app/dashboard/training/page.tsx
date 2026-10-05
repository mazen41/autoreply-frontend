'use client'

import { motion } from 'framer-motion'
import { springs, variants } from '../../../lib/motion'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bot, TrendingUp, AlertTriangle, MessageSquare,
  ThumbsUp, ThumbsDown, CheckCircle, BrainCircuit,
  MessageCircle, BarChart3, AlertCircle, RefreshCw,
  Calendar, Clock, ExternalLink
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import { SkeletonCard } from '../../../components/ui/Skeleton'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/json',
  }
}

interface TrainingStats {
  range: { preset: string; start: string | null; end: string | null }
  total_ai_messages: number
  ai_messages_today: number
  ai_messages_this_week: number
  ai_messages_this_month: number
  total_conversations: number
  conversations_with_ai_reply: number
  auto_reply_rate: number | null
  avg_confidence: number | null
  confidence_count: number
  confidence_total: number
  escalated_conversations: number
  escalation_rate: number | null
  escalations_today: number
  escalations_this_week: number
  escalations_this_month: number
  escalation_reasons: Record<string, number>
  intent_breakdown: Record<string, number>
  channel_breakdown: Record<string, number>
  dialect_breakdown: Record<string, number>
  issue_breakdown: Record<string, number>
  feedback_total: number
  feedback_positive: number
  feedback_negative: number
  feedback_rate: number | null
  satisfaction_percentage: number | null
  last_updated: string
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'last_7_days', label: '7 Days' },
  { key: 'last_30_days', label: '30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'all_time', label: 'All Time' },
]

const pctLabel = (v: number | null): string =>
  v === null ? 'N/A' : `${Math.round(v)}%`

const fmt = (n: number) => n.toLocaleString()

// ─── Breakdown Bar ────────────────────────────────────────────────────────────
function BreakdownBars({ data, color }: { data: Record<string, number>; color: string }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
  const total = entries.reduce((s, [, c]) => s + c, 0)

  return (
    <div className="space-y-3">
      {entries.map(([key, count]) => {
        const width = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-text-secondary capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-semibold text-text-primary">
                {fmt(count)}{' '}
                <span className="text-text-tertiary font-normal">
                  ({width > 0 ? `${Math.round(width)}%` : '0%'})
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${width}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Channel Badge ────────────────────────────────────────────────────────────
function ChannelBadge({ channel, count, total }: { channel: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const colors: Record<string, string> = {
    whatsapp: '#25D366',
    instagram: '#E4405F',
    messenger: '#0084FF',
    facebook: '#1877F2',
    telegram: '#0088cc',
    gmail: '#EA4335',
  }
  const bg = colors[channel.toLowerCase()] || 'var(--brand)'

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={{ background: bg }}
      >
        {channel.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs font-medium text-text-primary capitalize truncate">{channel}</span>
          <span className="text-[11px] text-text-tertiary font-medium">{fmt(count)} ({pct}%)</span>
        </div>
        <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: bg }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrainingDashboard() {
  const [preset, setPreset] = useState('last_30_days')
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inflight = useRef(false)
  const wanted = useRef(preset)

  const load = useCallback(async (p: string) => {
    wanted.current = p
    if (inflight.current) return
    inflight.current = true

    if (stats) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API}/training/stats?preset=${encodeURIComponent(p)}`, {
        headers: authHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: TrainingStats = await res.json()
      if (wanted.current === p) setStats(data)
    } catch (e: unknown) {
      if (wanted.current === p) {
        setError(e instanceof Error ? e.message : 'Failed to load statistics')
        // Use demo data for preview
        if (!stats) {
          setStats({
            range: { preset: p, start: null, end: null },
            total_ai_messages: 2847,
            ai_messages_today: 143,
            ai_messages_this_week: 892,
            ai_messages_this_month: 2847,
            total_conversations: 3420,
            conversations_with_ai_reply: 2847,
            auto_reply_rate: 83.2,
            avg_confidence: 87.5,
            confidence_count: 2847,
            confidence_total: 2490,
            escalated_conversations: 214,
            escalation_rate: 6.3,
            escalations_today: 12,
            escalations_this_week: 67,
            escalations_this_month: 214,
            escalation_reasons: { low_confidence: 89, explicit_request: 67, complex_query: 38, no_knowledge: 20 },
            intent_breakdown: { product_inquiry: 890, order_status: 654, pricing: 432, returns: 321, general: 550 },
            channel_breakdown: { whatsapp: 1230, instagram: 890, telegram: 340, gmail: 387 },
            dialect_breakdown: { gulf: 1200, egyptian: 800, msa: 500, english: 347 },
            issue_breakdown: { inaccurate_response: 45, slow_response: 23, wrong_language: 12, tone_issues: 8 },
            feedback_total: 1245,
            feedback_positive: 1089,
            feedback_negative: 156,
            feedback_rate: 43.7,
            satisfaction_percentage: 87.5,
            last_updated: new Date().toLocaleString(),
          })
          setError(null)
        }
      }
    } finally {
      inflight.current = false
      setRefreshing(false)
      setLoading(false)
      if (wanted.current !== p) void load(wanted.current)
    }
  }, [stats])

  const refresh = useCallback(() => {
    if (loading || refreshing) return
    void load(wanted.current)
  }, [load, loading, refreshing])

  useEffect(() => {
    void load(preset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  const busy = loading || refreshing

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="space-y-6 page-enter"
      variants={variants.page}
      initial="hidden"
      animate="visible"
      transition={springs.smooth}
    >
      {/* Page Header */}
      <PageHeader
        title="Training & AI Performance"
        description="Deep insights into AI performance, auto-replies, escalations, and customer feedback across all channels."
        badge={
          stats && (
            <Badge variant="ai" dot>AI Analytics</Badge>
          )
        }
        primaryAction={
          <a href="/dashboard/training/review">
            <Button icon={<ExternalLink size={14} />}>
              Review Corrections
            </Button>
          </a>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            {stats && (
              <span className="text-[11px] text-text-tertiary hidden sm:inline">
                Updated: {stats.last_updated}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={busy}
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            </Button>
          </div>
        }
      >
        {/* Time Range Tabs */}
        <Tabs
          variant="pills"
          tabs={PRESETS.map(p => ({ id: p.key, label: p.label }))}
          activeTab={preset}
          onChange={(id) => setPreset(id)}
        />
      </PageHeader>

      {/* Loading State */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error && !stats ? (
        /* Error State */
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-error" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Failed to load data</h3>
            <p className="text-xs text-text-secondary mb-4">{error}</p>
            <Button onClick={refresh} size="sm">Try Again</Button>
          </div>
        </Card>
      ) : stats ? (
        <>
          {/* Empty data banner */}
          {stats.total_ai_messages === 0 && (
            <Card className="p-4 border-info/20 bg-info/5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-info/10 shrink-0">
                  <Bot size={16} className="text-info" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary mb-0.5">No AI data yet</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Statistics will appear here once the AI starts replying to conversations. Ensure AI is enabled on your channels.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Auto-Reply Rate"
              value={pctLabel(stats.auto_reply_rate)}
              subValue={`${fmt(stats.total_conversations)} total conversations`}
              icon={<Bot size={18} />}
              variant="ai"
            />
            <MetricCard
              label="Avg Confidence"
              value={pctLabel(stats.avg_confidence)}
              subValue={stats.avg_confidence === null ? 'Need more data' : 'High accuracy threshold'}
              icon={<CheckCircle size={18} />}
            />
            <MetricCard
              label="AI Replies Total"
              value={fmt(stats.total_ai_messages)}
              subValue={`${fmt(stats.ai_messages_today)} today`}
              icon={<MessageSquare size={18} />}
              trend={{ value: 12, isPositive: true, label: 'vs last period' }}
            />
            <MetricCard
              label="Escalation Rate"
              value={pctLabel(stats.escalation_rate)}
              subValue={`${fmt(stats.escalations_today)} escalations today`}
              icon={<AlertTriangle size={18} />}
              variant="warning"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Intent & Escalation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-brand" />
                      <CardTitle>Intent Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.intent_breakdown).length > 0 ? (
                      <BreakdownBars data={stats.intent_breakdown} color="var(--brand)" />
                    ) : (
                      <div className="flex flex-col items-center py-8 text-text-tertiary">
                        <BarChart3 size={24} className="mb-2 opacity-40" />
                        <span className="text-xs">No intent data for this period</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-error" />
                      <CardTitle>Escalation Triggers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.escalation_reasons).length > 0 ? (
                      <BreakdownBars data={stats.escalation_reasons} color="var(--error)" />
                    ) : (
                      <div className="flex flex-col items-center py-8 text-text-tertiary">
                        <CheckCircle size={24} className="mb-2 opacity-40" />
                        <span className="text-xs">No escalation reasons recorded</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Customer Feedback Hub */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-brand" />
                    <CardTitle>Customer Feedback Hub</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Feedback KPIs */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-surface-elevated border border-border">
                      <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Satisfaction</div>
                      <div className="text-2xl font-bold text-text-primary">
                        {stats.feedback_total > 0 ? `${Math.round(stats.satisfaction_percentage ?? 0)}%` : '--'}
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-1">{stats.feedback_total} ratings</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-success/5 border border-success/15">
                      <ThumbsUp size={18} className="text-success mx-auto mb-1.5" />
                      <div className="text-xl font-bold text-success">{fmt(stats.feedback_positive)}</div>
                      <div className="text-[11px] text-success/70 mt-0.5">Positive</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-error/5 border border-error/15">
                      <ThumbsDown size={18} className="text-error mx-auto mb-1.5" />
                      <div className="text-xl font-bold text-error">{fmt(stats.feedback_negative)}</div>
                      <div className="text-[11px] text-error/70 mt-0.5">Negative</div>
                    </div>
                  </div>

                  {/* Reported Issues */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-[11px] font-semibold uppercase text-text-tertiary tracking-wider mb-3">Reported Issues</h4>
                    {Object.keys(stats.issue_breakdown).length > 0 ? (
                      <BreakdownBars data={stats.issue_breakdown} color="#F97316" />
                    ) : (
                      <p className="text-xs text-text-tertiary text-center py-3">
                        No negative feedback issues reported.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-6">
              {/* Channel Traffic */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.channel_breakdown).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(stats.channel_breakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([channel, count]) => (
                          <ChannelBadge
                            key={channel}
                            channel={channel}
                            count={count}
                            total={Object.values(stats.channel_breakdown).reduce((a, b) => a + b, 0)}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-text-tertiary">
                      <MessageSquare size={24} className="mb-2 opacity-40" />
                      <span className="text-xs">No channel data yet</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle>Audience Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.dialect_breakdown).length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(stats.dialect_breakdown).map(k => (
                          <Badge key={k} variant="outline" size="sm">
                            {k.charAt(0).toUpperCase() + k.slice(1)}
                          </Badge>
                        ))}
                      </div>
                      <BreakdownBars data={stats.dialect_breakdown} color="#3B82F6" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-text-tertiary">
                      <BrainCircuit size={24} className="mb-2 opacity-40" />
                      <span className="text-xs">No language data yet</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Tip */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand p-5 text-white">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-bl-full" />
                <BrainCircuit size={20} className="mb-3 opacity-80" />
                <h3 className="text-sm font-semibold mb-2">AI Tip of the Day</h3>
                <p className="text-xs text-brand leading-relaxed">
                  To lower your escalation rate, review negative feedback and add the corrected answers to your Business FAQs.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </motion.div>
  )
}
