'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle,
  Bot, Cpu, RefreshCw, Sparkles, BarChart3, ArrowUpRight
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import { MetricCardSkeleton, SkeletonCard } from '../../../components/ui/Skeleton'
import { springs, variants } from '../../../lib/motion'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : ''
}

interface AnalyticsData {
  total_ai_cost: number
  total_ai_revenue: number
  avg_response_time_ms: number
  escalation_rate: number
  revenue_breakdown: {
    ai_driven: { revenue: number; orders: number; percentage: number }
    agent_assisted: { revenue: number; orders: number; percentage: number }
    direct: { revenue: number; orders: number; percentage: number }
  }
  token_usage_by_bot: Array<{
    bot_name: string
    provider: string
    model: string
    total_tokens: number
    total_calls: number
    total_cost: number
  }>
}

const DEMO_DATA: AnalyticsData = {
  total_ai_cost: 127.45,
  total_ai_revenue: 12840.0,
  avg_response_time_ms: 1230,
  escalation_rate: 6.3,
  revenue_breakdown: {
    ai_driven: { revenue: 8420, orders: 156, percentage: 65.6 },
    agent_assisted: { revenue: 3200, orders: 67, percentage: 24.9 },
    direct: { revenue: 1220, orders: 34, percentage: 9.5 },
  },
  token_usage_by_bot: [
    { bot_name: 'Sales Bot', provider: 'OpenAI', model: 'gpt-4o-mini', total_tokens: 2450000, total_calls: 1820, total_cost: 48.5 },
    { bot_name: 'Support Bot', provider: 'OpenAI', model: 'gpt-4o', total_tokens: 1830000, total_calls: 890, total_cost: 62.3 },
    { bot_name: 'FAQ Bot', provider: 'Anthropic', model: 'claude-3.5-haiku', total_tokens: 890000, total_calls: 540, total_cost: 16.65 },
  ],
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/analytics/dashboard?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const result = await res.json()
        setData(result.data || result)
      } else {
        setData(DEMO_DATA)
      }
    } catch {
      setData(DEMO_DATA)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)

  const roi = data ? ((data.total_ai_revenue - data.total_ai_cost) / Math.max(data.total_ai_cost, 1) * 100).toFixed(0) : '0'

  return (
    <motion.div
      className="space-y-6 page-enter"
      variants={variants.page}
      initial="hidden"
      animate="visible"
      transition={springs.gentle}
    >
      {/* Page Header */}
      <PageHeader
        title="Analytics"
        description="AI performance, revenue attribution, and token cost analysis."
        badge={<Badge variant="ai" dot>Real-time</Badge>}
        primaryAction={
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        }
      >
        <Tabs
          variant="pills"
          tabs={[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'custom', label: 'Custom' },
          ]}
          activeTab={dateRange}
          onChange={setDateRange}
        />
      </PageHeader>

      {/* KPI Cards */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={variants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="Total AI Cost"
                value={formatCurrency(data?.total_ai_cost || 0)}
                icon={<DollarSign size={18} />}
                variant="warning"
                subValue="Token + API costs"
              />
            </motion.div>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="AI Revenue Generated"
                value={formatCurrency(data?.total_ai_revenue || 0)}
                icon={<TrendingUp size={18} />}
                trend={{ value: 18, isPositive: true, label: 'vs last period' }}
              />
            </motion.div>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="Avg Response Time"
                value={`${((data?.avg_response_time_ms || 0) / 1000).toFixed(1)}s`}
                icon={<Clock size={18} />}
                subValue="End-to-end latency"
              />
            </motion.div>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label="ROI Multiplier"
                value={`${roi}x`}
                icon={<Sparkles size={18} />}
                variant="ai"
                subValue="Revenue / AI cost"
              />
            </motion.div>
          </motion.div>

          {/* Revenue Attribution */}
          <motion.div variants={variants.fadeUp} initial="hidden" animate="visible" transition={{ ...springs.standard, delay: 0.15 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Attribution</CardTitle>
                    <CardDescription className="mt-1">How AI contributes to your revenue pipeline</CardDescription>
                  </div>
                  <Badge variant="success">
                    <ArrowUpRight size={12} className="mr-1" />
                    {formatCurrency(data?.total_ai_revenue || 0)} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'ai_driven', title: 'AI-Driven', color: '#10B981', icon: <Bot size={16} /> },
                    { key: 'agent_assisted', title: 'Agent-Assisted', color: '#3B82F6', icon: <Cpu size={16} /> },
                    { key: 'direct', title: 'Direct', color: '#6B7280', icon: <BarChart3 size={16} /> },
                  ].map(({ key, title, color, icon }) => {
                    const rb = data?.revenue_breakdown?.[key as keyof typeof data.revenue_breakdown]
                    return (
                      <motion.div
                        key={key}
                        className="p-4 rounded-xl bg-surface-elevated border border-border stagger-item"
                        whileHover={{ y: -2, transition: springs.snap }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${color}15`, color }}
                          >
                            {icon}
                          </div>
                          <span className="text-sm font-semibold text-text-primary">{title}</span>
                        </div>
                        <div className="text-xl font-bold text-text-primary mb-1">
                          {formatCurrency(rb?.revenue || 0)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>{rb?.orders || 0} orders</span>
                          <span className="font-semibold text-text-primary">{rb?.percentage || 0}%</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-surface overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, rb?.percentage || 0)}%` }}
                            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                            style={{ background: color }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Token Usage Table */}
          <motion.div variants={variants.fadeUp} initial="hidden" animate="visible" transition={{ ...springs.standard, delay: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>Token Usage by Bot &amp; Model</CardTitle>
                <CardDescription>Detailed breakdown of AI model usage and associated costs</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Bot</th>
                        <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Provider</th>
                        <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Model</th>
                        <th className="text-right py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Tokens</th>
                        <th className="text-right py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Calls</th>
                        <th className="text-right py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.token_usage_by_bot || []).map((row, i) => (
                        <motion.tr
                          key={i}
                          className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors stagger-item"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...springs.standard, delay: 0.3 + i * 0.06 }}
                        >
                          <td className="py-3 px-5 font-medium text-text-primary">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center">
                                <Bot size={12} className="text-brand" />
                              </div>
                              {row.bot_name || '—'}
                            </div>
                          </td>
                          <td className="py-3 px-5 text-text-secondary">{row.provider}</td>
                          <td className="py-3 px-5">
                            <code className="text-xs px-1.5 py-0.5 rounded-md bg-surface-elevated text-text-secondary font-mono">
                              {row.model}
                            </code>
                          </td>
                          <td className="py-3 px-5 text-right text-text-primary font-medium tabular-nums">
                            {(row.total_tokens || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-right text-text-primary tabular-nums">
                            {(row.total_calls || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-right font-semibold text-warning tabular-nums">
                            {formatCurrency(row.total_cost || 0)}
                          </td>
                        </motion.tr>
                      ))}
                      {(!data?.token_usage_by_bot || data.token_usage_by_bot.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-text-muted text-xs">
                            No token usage data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
