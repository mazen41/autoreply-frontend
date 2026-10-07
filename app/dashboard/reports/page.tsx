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
import Tabs from '../../../components/ui/Tabs'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import toast from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
function Sparkline({ data, color = 'var(--brand)' }: { data: number[]; color?: string }) {
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
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily messages chart" className="w-full h-24 overflow-visible">
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

export default function ReportsPage() {
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [dailyData, setDailyData] = useState<number[]>([])
  const [channelData, setChannelData] = useState<any[]>([])
  const [aiPerformance, setAiPerformance] = useState<any>(null)
  const [topQuestions, setTopQuestions] = useState<any[]>([])
  const [timeSaved, setTimeSaved] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchReports() }, [range])

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to load reports.')
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30

      const [dailyRes, channelRes, aiRes, questionsRes, timeRes] = await Promise.all([
        fetch(`${API}/api/reports/daily-messages?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/channel-breakdown`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/ai-performance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/top-questions?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/time-saved`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (![dailyRes, channelRes, aiRes, questionsRes, timeRes].every((res) => res.ok)) {
        throw new Error('Could not load all report data. Retry to refresh.')
      }
      const [daily, channel, ai, questions, saved] = await Promise.all([
        dailyRes.json(), channelRes.json(), aiRes.json(), questionsRes.json(), timeRes.json(),
      ])
      setDailyData(Array.isArray(daily.data) ? daily.data.map(Number) : [])
      setChannelData(Array.isArray(channel.channels) ? channel.channels : [])
      setAiPerformance(ai)
      setTopQuestions(Array.isArray(questions.questions) ? questions.questions : [])
      setTimeSaved(saved)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format: 'pdf' | 'csv') {
    const token = getToken()
    if (!token) return
    try {
      const url = `${API}/api/reports/export/${format}?type=messages`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = `report.${format}`
      a.click()
    } catch {
      toast.error('Could not export this report.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Comprehensive reporting on conversations, AI performance, and business impact."
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
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
          ]}
          activeTab={range}
          onChange={setRange}
        />
      </PageHeader>

      {error && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchReports()}>Retry</Button></div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="AI Auto-Reply Rate"
          value={`${aiPerformance?.auto_reply_rate || 0}%`}
          icon={<Bot size={18} />}
          variant="ai"
          subValue={`${aiPerformance?.auto_replies ?? 0} AI replies`}
        />
        <MetricCard
          label="Avg Response Time"
          value={`${aiPerformance?.avg_response_time_formatted || 'No data'}`}
          icon={<Clock size={18} />}
          subValue="End-to-end"
        />
        <MetricCard
          label="Time Saved"
          value={`${timeSaved?.time_saved_hours ?? 0}h`}
          icon={<Zap size={18} />}
          subValue={`${timeSaved?.messages_handled ?? 0} AI replies handled`}
        />
        <MetricCard
          label="Estimated value saved"
          value={`${(timeSaved?.estimated_value ?? 0).toLocaleString()} SAR`}
          icon={<TrendingUp size={18} />}
          subValue="Based on configured reply-time and hourly-rate estimates"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Volume */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conversation Volume</CardTitle>
                  <CardDescription className="mt-1">Daily message trends</CardDescription>
                </div>
                <Badge variant="outline">
                  {dailyData.reduce((a, b) => a + b, 0).toLocaleString()} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {dailyData.length > 1 ? <Sparkline data={dailyData} color="var(--brand)" /> : <p className="py-8 text-center text-sm text-text-tertiary">No message history for this period.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {channelData.length === 0 ? <p className="text-sm text-text-tertiary">No channel message data.</p> : channelData.map((ch: any) => {
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
                      <span className="text-[11px] text-text-tertiary">{pct}% · {Number(ch.messages_count || 0)} messages</span>
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
              <CardTitle>Top Customer Questions</CardTitle>
              <CardDescription className="mt-1">Most frequently asked questions handled by AI</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {topQuestions.length === 0 ? <p className="px-5 py-8 text-center text-sm text-text-tertiary">No customer questions found for this account.</p> : topQuestions.map((q: any, i: number) => (
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
