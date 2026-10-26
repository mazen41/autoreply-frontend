'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3, Download, RefreshCw, FileText, TrendingUp,
  MessageSquare, Clock, Bot, Users, ArrowUpRight,
  ArrowDownRight, Zap
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { Select } from '../../../components/ui/Select'
import Tabs from '../../../components/ui/Tabs'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import toast from 'react-hot-toast'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
function Sparkline({ data, color = 'var(--brand)', isRTL }: { data: number[]; color?: string; isRTL: boolean }) {
  if (data.length < 2) return null
  const width = 400
  const height = 90
  const max = Math.max(...data, 1)
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - (value / max) * (height - 8) - 4
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={isRTL ? 'مخطط الرسائل اليومية' : 'Daily messages chart'} className="w-full h-24 overflow-visible">
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

export default function ReportsPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [dailyData, setDailyData] = useState<number[]>([])
  const [channelData, setChannelData] = useState<any[]>([])
  const [aiPerformance, setAiPerformance] = useState<any>(null)
  const [topQuestions, setTopQuestions] = useState<any[]>([])
  const [timeSaved, setTimeSaved] = useState<any>(null)
  const [minutesPerReply, setMinutesPerReply] = useState(3)
  const [hourlyRate, setHourlyRate] = useState(100)
  const [hourlyRateCurrency, setHourlyRateCurrency] = useState('SAR')
  const [savingEstimates, setSavingEstimates] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchReports()
    const refreshForBusiness = () => { void fetchReports() }
    window.addEventListener('naz:business-changed', refreshForBusiness)
    window.addEventListener('storage', refreshForBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', refreshForBusiness)
      window.removeEventListener('storage', refreshForBusiness)
    }
  }, [range])

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again to load reports.', 'انتهت جلستك. سجّل الدخول مجددًا لتحميل التقارير.'))
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30

      const [dailyRes, channelRes, aiRes, questionsRes, timeRes] = await Promise.all([
        fetch(`${API}/api/reports/daily-messages?days=${days}`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } }),
        fetch(`${API}/api/reports/channel-breakdown`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } }),
        fetch(`${API}/api/reports/ai-performance?days=${days}`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } }),
        fetch(`${API}/api/reports/top-questions?limit=5&days=${days}`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } }),
        fetch(`${API}/api/reports/time-saved?days=${days}`, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } }),
      ])

      if (![dailyRes, channelRes, aiRes, questionsRes, timeRes].every((res) => res.ok)) {
        throw new Error(L('Could not load all report data. Retry to refresh.', 'تعذر تحميل بيانات التقارير كاملة. أعد المحاولة للتحديث.'))
      }
      const [daily, channel, ai, questions, saved] = await Promise.all([
        dailyRes.json(), channelRes.json(), aiRes.json(), questionsRes.json(), timeRes.json(),
      ])
      setDailyData(Array.isArray(daily.data) ? daily.data.map(Number) : [])
      setChannelData(Array.isArray(channel.channels) ? channel.channels : [])
      setAiPerformance(ai)
      setTopQuestions(Array.isArray(questions.questions) ? questions.questions : [])
      setTimeSaved(saved)
      setMinutesPerReply(Number(saved.estimate_inputs?.minutes_per_reply ?? 3))
      setHourlyRate(Number(saved.estimate_inputs?.hourly_rate ?? 100))
      setHourlyRateCurrency(String(saved.estimate_inputs?.hourly_rate_currency ?? 'SAR'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L('Could not load reports.', 'تعذر تحميل التقارير.'))
    } finally {
      setLoading(false)
    }
  }

  async function saveEstimateInputs() {
    const token = getToken()
    if (!token) return
    if (!Number.isFinite(minutesPerReply) || minutesPerReply < 1 || minutesPerReply > 60 || !Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 1000000) {
      toast.error(L('Enter valid estimate values before saving.', 'أدخل قيمًا صحيحة للتقدير قبل الحفظ.'))
      return
    }
    setSavingEstimates(true)
    try {
      const response = await fetch(`${API}/api/reports/time-saved/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify({ minutes_per_reply: minutesPerReply, hourly_rate: hourlyRate, currency: hourlyRateCurrency }),
      })
      if (!response.ok) throw new Error(L('Could not save estimate settings', 'تعذر حفظ إعدادات التقدير'))
      toast.success(L('Estimate inputs saved', 'تم حفظ قيم التقدير'))
      await fetchReports()
    } catch {
      toast.error(L('Could not save estimate inputs', 'تعذر حفظ قيم التقدير'))
    } finally {
      setSavingEstimates(false)
    }
  }

  async function handleExport(format: 'pdf' | 'csv') {
    const token = getToken()
    if (!token) return
    try {
      const url = `${API}/api/reports/export/${format}?type=messages`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() } })
      if (!res.ok) throw new Error(L('Export failed', 'فشل تصدير التقرير'))
      const blob = await res.blob()
      const a = document.createElement('a')
      const objectUrl = window.URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = `report.${format}`
      a.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error(L('Could not export this report.', 'تعذر تصدير هذا التقرير.'))
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader
        title={L('Reports', 'التقارير')}
        description={L('Comprehensive reporting on conversations, AI performance, and business impact.', 'تقارير شاملة عن المحادثات وأداء الذكاء الاصطناعي وأثره على النشاط.')}
        primaryAction={
          <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => handleExport('csv')}>
              CSV
            </Button>
            <Button variant="outline" size="sm" icon={<FileText size={14} />} onClick={() => handleExport('pdf')}>
              PDF
            </Button>
          </div>
        }
      >
        <Tabs
          variant="pills"
          tabs={[
            { id: '7d', label: L('7 Days', '٧ أيام') },
            { id: '30d', label: L('30 Days', '٣٠ يومًا') },
            { id: '90d', label: L('90 Days', '٩٠ يومًا') },
          ]}
          activeTab={range}
          onChange={setRange}
        />
      </PageHeader>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchReports()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={L('AI share of replies', 'نسبة ردود الذكاء الاصطناعي')}
          value={`${aiPerformance?.ai_share_of_replies || 0}%`}
          icon={<Bot size={18} />}
          variant="ai"
          subValue={`${aiPerformance?.auto_replies ?? 0} ${L('AI replies', 'ردود الذكاء الاصطناعي')}`}
        />
        <MetricCard
          label={L('Median Response Time', 'متوسط زمن الاستجابة')}
          value={`${aiPerformance?.median_response_time_formatted || L('No data', 'لا توجد بيانات')}`}
          icon={<Clock size={18} />}
          subValue={L('End-to-end', 'من البداية إلى النهاية')}
        />
        <MetricCard
          label={L('Time Saved', 'الوقت المُوفّر')}
          value={`${timeSaved?.time_saved_hours ?? 0}h`}
          icon={<Zap size={18} />}
          subValue={`${timeSaved?.messages_handled ?? 0} ${L('AI replies handled', 'رد من الذكاء الاصطناعي تمت معالجته')}`}
        />
        <MetricCard
          label={L('Estimated value saved', 'القيمة التقديرية المُوفّرة')}
          value={`${(timeSaved?.estimated_value ?? 0).toLocaleString()} ${timeSaved?.estimate_inputs?.hourly_rate_currency ?? 'SAR'}`}
          icon={<TrendingUp size={18} />}
          subValue={`${timeSaved?.estimate_inputs?.minutes_per_reply ?? 3} ${L('min/reply', 'دقيقة/رد')} · ${timeSaved?.estimate_inputs?.hourly_rate ?? 100} ${timeSaved?.estimate_inputs?.hourly_rate_currency ?? 'SAR'} ${L('/hr estimate', '/ساعة تقديريًا')}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{L('Estimate inputs', 'مدخلات التقدير')}</CardTitle>
          <CardDescription>{L('These merchant-provided assumptions estimate time and value saved. They are estimates, not measured savings.', 'تُستخدم هذه القيم التي يحددها التاجر لتقدير الوقت والقيمة المُوفّرة، وهي تقديرات وليست قياسات فعلية.')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            {L('Minutes per manual reply', 'دقائق لكل رد يدوي')}
            <input type="number" min={1} max={60} value={minutesPerReply} onChange={(event) => setMinutesPerReply(event.target.value === '' ? 0 : Number(event.target.value))} className="h-10 w-40 rounded-xl border border-border bg-surface-elevated px-3 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            {L('Hourly rate', 'الأجر بالساعة')}
            <input type="number" min={0} step="0.01" max={1000000} value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value === '' ? 0 : Number(event.target.value))} className="h-10 w-40 rounded-xl border border-border bg-surface-elevated px-3 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          <Select dir={isRTL ? 'rtl' : 'ltr'} label={L('Currency', 'العملة')} value={hourlyRateCurrency} onValueChange={setHourlyRateCurrency} options={['SAR', 'EGP', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'USD', 'EUR'].map((currency) => ({ value: currency, label: currency }))} />
          <Button variant="outline" onClick={saveEstimateInputs} loading={savingEstimates} disabled={loading || savingEstimates}>{L('Save estimates', 'حفظ التقديرات')}</Button>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Volume */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{L('Conversation Volume', 'حجم المحادثات')}</CardTitle>
                  <CardDescription className="mt-1">{L('Daily message trends', 'اتجاهات الرسائل اليومية')}</CardDescription>
                </div>
                <Badge variant="outline">
                  {dailyData.reduce((a, b) => a + b, 0).toLocaleString(isRTL ? 'ar' : undefined)} {L('total', 'الإجمالي')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {dailyData.length > 1 ? <Sparkline data={dailyData} color="var(--brand)" isRTL={isRTL} /> : <p className="py-8 text-center text-sm text-text-tertiary">{L('No message history for this period.', 'لا يوجد سجل رسائل خلال هذه الفترة.')}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{L('Channel Distribution', 'توزيع القنوات')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {channelData.length === 0 ? <p className="text-sm text-text-tertiary">{L('No channel message data.', 'لا توجد بيانات لرسائل القنوات.')}</p> : channelData.map((ch: any) => {
                const total = channelData.reduce((sum: number, item: any) => sum + Number(item.messages_count || 0), 0)
                const pct = total > 0 ? Math.round((Number(ch.messages_count || 0) / total) * 100) : 0
                return (
                <div key={ch.id || ch.type || ch.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center bg-surface-elevated shrink-0">
                    <ChannelIcon type={ch.type || ch.name} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary capitalize">{ch.name || ch.type}</span>
                      <span className="text-[11px] text-text-tertiary">{pct}% · {Number(ch.messages_count || 0)} {L('messages', 'رسالة')}</span>
                    </div>
                    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{L('Top Customer Questions', 'أكثر أسئلة العملاء شيوعًا')}</CardTitle>
              <CardDescription className="mt-1">{L('Most frequently asked questions handled by AI', 'الأسئلة الأكثر تكرارًا التي عالجها الذكاء الاصطناعي')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {topQuestions.length === 0 ? <p className="px-5 py-8 text-center text-sm text-text-tertiary">{L('No customer questions found for this account.', 'لم يتم العثور على أسئلة عملاء لهذا الحساب.')}</p> : topQuestions.map((q: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-elevated/40 transition-colors">
                <div className="w-7 h-7 rounded-md bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-tertiary shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{q.question}</p>
                </div>
                <span className="text-xs font-semibold text-text-primary tabular-nums shrink-0">
                  {q.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
