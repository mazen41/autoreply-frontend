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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const RANGE_DAYS = [7, 30, 90]

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = 'var(--brand)' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 400, h = 60
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v / max) * (h - 8)),
  ])
  const line = `M${pts.map(([x, y]) => `${x},${y}`).join('L')}`
  const area = `${line}V${h}H0Z`
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
      )}
    </svg>
  )
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO = {
  daily: [45, 62, 38, 74, 89, 56, 93, 67, 82, 45, 71, 98, 64, 85, 72, 91, 58, 79, 86, 54, 73, 88, 65, 95, 70, 83, 77, 92, 69, 87],
  channels: [
    { name: 'whatsapp', messages: 2340, pct: 42 },
    { name: 'instagram', messages: 1560, pct: 28 },
    { name: 'gmail', messages: 890, pct: 16 },
    { name: 'telegram', messages: 450, pct: 8 },
    { name: 'facebook', messages: 340, pct: 6 },
  ],
  ai: { auto_reply_rate: 83.2, avg_confidence: 87.5, total_resolved: 2847, avg_response_ms: 1230 },
  questions: [
    { question: 'ما هو سعر المنتج؟', count: 234, category: 'pricing' },
    { question: 'هل التوصيل مجاني؟', count: 189, category: 'shipping' },
    { question: 'كيف يمكنني إرجاع المنتج؟', count: 156, category: 'returns' },
    { question: 'هل يوجد ضمان؟', count: 132, category: 'warranty' },
    { question: 'ما هي طرق الدفع المتاحة؟', count: 98, category: 'payment' },
  ],
  timeSaved: { hours: 342, equivalent_agents: 2.4, cost_saved: 8540 },
}

export default function ReportsPage() {
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [dailyData, setDailyData] = useState<number[]>(DEMO.daily)
  const [channelData, setChannelData] = useState<any[]>(DEMO.channels)
  const [aiPerformance, setAiPerformance] = useState<any>(DEMO.ai)
  const [topQuestions, setTopQuestions] = useState<any[]>(DEMO.questions)
  const [timeSaved, setTimeSaved] = useState<any>(DEMO.timeSaved)

  useEffect(() => { fetchReports() }, [range])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) { setLoading(false); return }
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30

      const [dailyRes, channelRes, aiRes, questionsRes, timeRes] = await Promise.all([
        fetch(`${API}/api/reports/daily-messages?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/channel-breakdown`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/ai-performance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/top-questions?limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/reports/time-saved`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (dailyRes.ok) { const j = await dailyRes.json(); if (j.data?.length) setDailyData(j.data) }
      if (channelRes.ok) { const j = await channelRes.json(); if (j.channels?.length) setChannelData(j.channels) }
      if (aiRes.ok) { const j = await aiRes.json(); setAiPerformance(j) }
      if (questionsRes.ok) { const j = await questionsRes.json(); if (j.questions?.length) setTopQuestions(j.questions) }
      if (timeRes.ok) { const j = await timeRes.json(); setTimeSaved(j) }
    } catch {
      // Keep demo data on error
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
      // silent fail
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="AI Auto-Reply Rate"
          value={`${aiPerformance?.auto_reply_rate || 0}%`}
          icon={<Bot size={18} />}
          variant="ai"
          trend={{ value: 5.2, isPositive: true }}
        />
        <MetricCard
          label="Avg Response Time"
          value={`${((aiPerformance?.avg_response_ms || 0) / 1000).toFixed(1)}s`}
          icon={<Clock size={18} />}
          subValue="End-to-end"
        />
        <MetricCard
          label="Time Saved"
          value={`${timeSaved?.hours || 0}h`}
          icon={<Zap size={18} />}
          subValue={`≈ ${timeSaved?.equivalent_agents || 0} agents`}
        />
        <MetricCard
          label="Cost Saved"
          value={`$${(timeSaved?.cost_saved || 0).toLocaleString()}`}
          icon={<TrendingUp size={18} />}
          trend={{ value: 12, isPositive: true }}
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
              <Sparkline data={dailyData} color="var(--brand)" />
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
              {channelData.map((ch: any) => (
                <div key={ch.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center bg-surface-elevated shrink-0">
                    <ChannelIcon type={ch.name} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary capitalize">{ch.name}</span>
                      <span className="text-[11px] text-text-tertiary">{ch.pct || ch.percentage || 0}%</span>
                    </div>
                    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${ch.pct || ch.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
            {topQuestions.map((q: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-elevated/40 transition-colors">
                <div className="w-7 h-7 rounded-md bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-tertiary shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{q.question}</p>
                </div>
                <Badge variant="outline" size="sm">{q.category || 'general'}</Badge>
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
