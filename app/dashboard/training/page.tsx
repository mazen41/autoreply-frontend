'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
  }
}

/* Real response shape from GET /api/training/stats (TrainingController@getStats) */
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

const PRESETS: { key: string; en: string; ar: string }[] = [
  { key: 'today', en: 'Today', ar: 'اليوم' },
  { key: 'last_7_days', en: 'Last 7 days', ar: 'آخر 7 أيام' },
  { key: 'last_30_days', en: 'Last 30 days', ar: 'آخر 30 يوم' },
  { key: 'this_month', en: 'This month', ar: 'هذا الشهر' },
  { key: 'all_time', en: 'All time', ar: 'كل الوقت' },
]

const pctLabel = (v: number | null): string =>
  v === null ? 'N/A' : `${Math.round(v)}%`

const intentLabels: Record<string, [string, string]> = {
  greeting: ['Greeting', 'تحية'],
  question: ['Question', 'سؤال'],
  order_status: ['Order Status', 'حالة طلب'],
  place_order: ['Place Order', 'طلب جديد'],
  order: ['Order', 'طلب'],
  escalation: ['Escalation', 'تصعيد'],
  unknown: ['Unknown', 'غير معروف'],
}

const dialectLabels: Record<string, [string, string]> = {
  egyptian: ['Egyptian', 'مصري'],
  gulf: ['Gulf', 'خليجي'],
  msa: ['MSA', 'فصحى'],
  mixed: ['Mixed', 'مختلط'],
  english: ['English', 'إنجليزي'],
  unknown: ['Unknown', 'غير معروف'],
}

const issueLabels: Record<string, [string, string]> = {
  inaccurate: ['Inaccurate', 'غير دقيق'],
  inappropriate: ['Inappropriate', 'غير مناسب'],
  off_topic: ['Off-topic', 'غير ذي صلة'],
  poor_quality: ['Poor Quality', 'جودة منخفضة'],
  other: ['Other', 'أخرى'],
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-6"
    >
      <h3 className="text-sm font-bold text-text-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  )
}

function Bars({ data, color }: { data: Record<string, number>; color: string }) {
  const fmt = (n: number) => n.toLocaleString()
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
  const total = entries.reduce((s, [, c]) => s + c, 0)
  return (
    <div className="space-y-3">
      {entries.map(([key, count]) => {
        const width = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-text-secondary capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold text-text-primary">
                {fmt(count)} · {width > 0 ? `${Math.round(width)}%` : '0%'}
              </span>
            </div>
            <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="text-xs text-text-tertiary text-center py-6">{text}</div>
  )
}

export default function TrainingDashboard() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => (isRTL ? ar : en)

  const [preset, setPreset] = useState('last_30_days')
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inflight = useRef(false)
  const wanted = useRef(preset) // latest preset the user asked for

  const load = useCallback(async (p: string) => {
    wanted.current = p
    if (inflight.current) return // a request is already running; handled after it finishes
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
      }
    } finally {
      inflight.current = false
      setRefreshing(false)
      setLoading(false)
      // A newer preset was requested while we were busy — run it now.
      if (wanted.current !== p) {
        void load(wanted.current)
      }
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
  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header + controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-text-primary mb-2">
            {L('Training Dashboard', 'لوحة التدريب')}
          </h1>
          <p className="text-sm text-text-secondary">
            {L('AI performance metrics from real conversations', 'إحصائيات الذكاء الاصطناعي من المحادثات الفعلية')}
          </p>
          {stats && (
            <p className="text-xs text-text-tertiary mt-1">
              {L('Last updated', 'آخر تحديث')}: {stats.last_updated}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={busy}
          className="text-xs px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-40"
        >
          {busy ? '…' : L('Refresh', 'تحديث')}
        </button>
      </motion.div>

      {/* Date range selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            disabled={busy}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 ${
              preset === p.key
                ? 'bg-accent border-accent text-white'
                : 'border-border text-text-secondary hover:text-text-primary hover:border-accent'
            }`}
          >
            {L(p.en, p.ar)}
          </button>
        ))}
      </div>

      {busy && !stats ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error && !stats ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button onClick={refresh} className="text-xs text-accent underline">
            {L('Try again', 'حاول مجدداً')}
          </button>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {refreshing && (
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
              {L('Refreshing…', 'جارٍ التحديث…')}
            </div>
          )}

          {stats.total_ai_messages === 0 && (
            <div className="bg-surface border border-border rounded-xl p-4 text-sm text-text-secondary">
              {L(
                'No AI data yet — stats appear once the AI starts replying to conversations.',
                'لا توجد بيانات بعد — تظهر الإحصائيات بمجرد أن يبدأ الذكاء الاصطناعي بالرد على المحادثات.',
              )}
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card label={L('AI Replies', 'ردود الذكاء الاصطناعي')} value={fmt(stats.total_ai_messages)} color="text-accent" />
            <Card label={L('Today', 'اليوم')} value={fmt(stats.ai_messages_today)} color="text-text-primary" />
            <Card label={L('This Week', 'هذا الأسبوع')} value={fmt(stats.ai_messages_this_week)} color="text-text-primary" />
            <Card label={L('This Month', 'هذا الشهر')} value={fmt(stats.ai_messages_this_month)} color="text-text-primary" />
            <Card label={L('Auto-Reply Rate', 'معدل الرد التلقائي')} value={pctLabel(stats.auto_reply_rate)} color="text-green-500" />
            <Card label={L('Avg Confidence', 'متوسط الثقة')} value={pctLabel(stats.avg_confidence)} color={stats.avg_confidence === null ? 'text-text-tertiary' : stats.avg_confidence >= 70 ? 'text-green-500' : 'text-yellow-400'} />
          </div>

          {/* Confidence detail */}
          <SectionCard title={L('Confidence', 'الثقة')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SubStat
                label={L('Average confidence', 'متوسط الثقة')}
                value={pctLabel(stats.avg_confidence)}
                note={stats.avg_confidence === null ? L('no confidence recorded', 'لا توجد قيم ثقة') : undefined}
              />
              <SubStat
                label={L('Messages with confidence', 'رسائل بقيمة ثقة')}
                value={stats.confidence_count === 0 ? '0' : fmt(stats.confidence_count)}
                note={stats.confidence_total > 0 ? `${L('of', 'من')} ${fmt(stats.confidence_total)} ${L('AI replies', 'رداً تلقائياً')}` : undefined}
              />
              <SubStat
                label={L('Coverage', 'التغطية')}
                value={
                  stats.confidence_total > 0
                    ? `${Math.round((stats.confidence_count / stats.confidence_total) * 100)}%`
                    : 'N/A'
                }
                note={stats.confidence_total === 0 ? L('no AI replies yet', 'لا توجد ردود تلقائية بعد') : undefined}
              />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Escalation */}
            <SectionCard title={L('Escalations', 'التصعيد')}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card label={L('Total', 'الإجمالي')} value={fmt(stats.escalated_conversations)} color="text-red-400" />
                <Card label={L('Rate', 'المعدل')} value={pctLabel(stats.escalation_rate)} color="text-yellow-400" />
                <Card label={L('Today', 'اليوم')} value={fmt(stats.escalations_today)} color="text-text-primary" />
                <Card label={L('This Month', 'هذا الشهر')} value={fmt(stats.escalations_this_month)} color="text-text-primary" />
              </div>
              {Object.keys(stats.escalation_reasons).length > 0 ? (
                <Bars data={stats.escalation_reasons} color="bg-red-400" />
              ) : (
                <EmptyNote text={L('No escalation reasons recorded', 'لا توجد أسباب تصعيد مسجلة')} />
              )}
            </SectionCard>

            {/* Intent */}
            <SectionCard title={L('Intent Breakdown', 'توزيع النوايا')}>
              {Object.keys(stats.intent_breakdown).length > 0 ? (
                <Bars data={stats.intent_breakdown} color="bg-accent" />
              ) : (
                <EmptyNote text={L('No intent data yet', 'لا توجد بيانات نوايا بعد')} />
              )}
            </SectionCard>

            {/* Channels */}
            <SectionCard title={L('Channel Breakdown', 'توزيع القنوات')}>
              {Object.keys(stats.channel_breakdown).length > 0 ? (
                <Bars data={stats.channel_breakdown} color="bg-purple-400" />
              ) : (
                <EmptyNote text={L('No channel data yet', 'لا توجد بيانات قنوات بعد')} />
              )}
            </SectionCard>

            {/* Dialects / language */}
            <SectionCard title={L('Language & Dialect', 'اللغة واللهجة')}>
              {Object.keys(stats.dialect_breakdown).length > 0 ? (
                <Bars data={stats.dialect_breakdown} color="bg-blue-400" />
              ) : (
                <EmptyNote text={L('No language data yet', 'لا توجد بيانات لغة بعد')} />
              )}
              {/* Dialect names read better localized; render a small legend */}
              <div className="mt-3 pt-3 border-t border-border">
                {Object.keys(stats.dialect_breakdown)
                  .filter((k) => dialectLabels[k])
                  .map((k) => (
                    <span key={k} className="inline-block text-[10px] text-text-tertiary mr-3 capitalize">
                      {k}: {dialectLabels[k][isRTL ? 1 : 0]}
                    </span>
                  ))}
              </div>
            </SectionCard>
          </div>

          {/* Feedback */}
          <SectionCard title={L('Feedback', 'التغذية الراجعة')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card label={L('Total Feedback', 'إجمالي التغذية')} value={fmt(stats.feedback_total)} color="text-text-primary" />
              <Card label={L('Positive', 'إيجابي')} value={fmt(stats.feedback_positive)} color="text-green-500" />
              <Card label={L('Negative', 'سلبي')} value={fmt(stats.feedback_negative)} color="text-red-400" />
              <Card
                label={L('Satisfaction', 'مؤشر الرضا')}
                value={
                  stats.feedback_total > 0 ? `${Math.round(stats.satisfaction_percentage ?? 0)}%` : 'N/A'
                }
                color={stats.feedback_total > 0 ? 'text-green-500' : 'text-text-tertiary'}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <SubStat
                label={L('Feedback rate', 'معدل التغذية')}
                value={pctLabel(stats.feedback_rate)}
                note={stats.feedback_rate === null ? L('no AI replies to rate', 'لا توجد ردود لتقييمها') : undefined}
              />
              <div className="md:col-span-2">
                <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                  {L('Reported issues (negative feedback)', 'المشاكل المبلَّغ عنها (تغذية سلبية)')}
                </div>
                {Object.keys(stats.issue_breakdown).length > 0 ? (
                  <Bars data={stats.issue_breakdown} color="bg-red-500" />
                ) : (
                  <EmptyNote text={stats.feedback_negative > 0 ? L('No issue types recorded', 'لا توجد أنواع مشاكل مسجلة') : L('No negative feedback', 'لا توجد تغذية سلبية')} />
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="text-center py-20 text-sm text-text-tertiary">
          {L('No data yet', 'لا توجد بيانات بعد')}
        </div>
      )}
    </div>
  )
}

function Card({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-border rounded-xl p-4"
    >
      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </motion.div>
  )
}

function SubStat({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="bg-surface-elevated/40 rounded-lg p-4">
      <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-black text-text-primary">{value}</div>
      {note ? <div className="text-[10px] text-text-tertiary mt-1">{note}</div> : null}
    </div>
  )
}