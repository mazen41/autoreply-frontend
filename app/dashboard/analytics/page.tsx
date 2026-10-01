'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../../lib/LangContext'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle,
  Bot, Cpu, RefreshCw, Calendar
} from 'lucide-react'

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
  token_usage_by_bot: Array<{ bot_name: string; provider: string; model: string; total_tokens: number; total_calls: number; total_cost: number }>
}

export default function AnalyticsPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
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
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {L('Analytics', 'التحليلات')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {L('AI performance, revenue attribution, and token cost analysis', 'أداء AI، إسناد الإيرادات، وتحليل تكلفة الرموز')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="h-9 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="today">{L('Today', 'اليوم')}</option>
            <option value="7d">{L('Last 7 Days', 'آخر 7 أيام')}</option>
            <option value="30d">{L('Last 30 Days', 'آخر 30 يوم')}</option>
            <option value="custom">{L('Custom Range', 'نطاق مخصص')}</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Hero Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign size={20} />}
          label={L('Total AI Cost', 'التكلفة الإجمالية لـ AI')}
          value={formatCurrency(data?.total_ai_cost || 0)}
          color="text-amber-500"
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label={L('AI Revenue Generated', 'الإيرادات المولدة بواسطة AI')}
          value={formatCurrency(data?.total_ai_revenue || 0)}
          color="text-emerald-500"
        />
        <SummaryCard
          icon={<Clock size={20} />}
          label={L('Avg Response Time', 'متوسط وقت الاستجابة')}
          value={`${(data?.avg_response_time_ms || 0).toFixed(0)}ms`}
          color="text-blue-500"
        />
        <SummaryCard
          icon={<AlertTriangle size={20} />}
          label={L('Escalation Rate', 'معدل التصعيد')}
          value={`${(data?.escalation_rate || 0).toFixed(1)}%`}
          color="text-red-500"
        />
      </div>

      {/* Revenue Attribution */}
      <div className="p-6 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{L('Revenue Attribution', 'إسناد الإيرادات')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RevenueCard
            title={L('AI-Driven', 'مدفوع بـ AI')}
            revenue={data?.revenue_breakdown?.ai_driven?.revenue || 0}
            orders={data?.revenue_breakdown?.ai_driven?.orders || 0}
            percentage={data?.revenue_breakdown?.ai_driven?.percentage || 0}
            color="bg-emerald-500"
          />
          <RevenueCard
            title={L('Agent-Assisted', 'بمساعدة وكيل')}
            revenue={data?.revenue_breakdown?.agent_assisted?.revenue || 0}
            orders={data?.revenue_breakdown?.agent_assisted?.orders || 0}
            percentage={data?.revenue_breakdown?.agent_assisted?.percentage || 0}
            color="bg-blue-500"
          />
          <RevenueCard
            title={L('Direct', 'مباشر')}
            revenue={data?.revenue_breakdown?.direct?.revenue || 0}
            orders={data?.revenue_breakdown?.direct?.orders || 0}
            percentage={data?.revenue_breakdown?.direct?.percentage || 0}
            color="bg-gray-500"
          />
        </div>
      </div>

      {/* Token Usage Table */}
      <div className="p-6 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{L('Token Usage by Bot & Model', 'استخدام الرموز حسب البوت والنموذج')}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-bold">{L('Bot', 'البوت')}</th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-bold">{L('Provider', 'المزود')}</th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-bold">{L('Model', 'النموذج')}</th>
                  <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-bold">{L('Total Tokens', 'إجمالي الرموز')}</th>
                  <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-bold">{L('Calls', 'المكالمات')}</th>
                  <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-bold">{L('Est. Cost', 'التكلفة التقديرية')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.token_usage_by_bot || []).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 px-4 text-[var(--text-primary)] font-medium">{row.bot_name || '—'}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{row.provider}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-mono text-xs">{row.model}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-primary)]">{(row.total_tokens || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-primary)]">{row.total_calls || 0}</td>
                    <td className="py-3 px-4 text-right text-amber-500 font-bold">{formatCurrency(row.total_cost || 0)}</td>
                  </tr>
                ))}
                {(!data?.token_usage_by_bot || data.token_usage_by_bot.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-tertiary)]">
                      {L('No token usage data available', 'لا توجد بيانات استخدام الرموز')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color} bg-opacity-10`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function RevenueCard({ title, revenue, orders, percentage, color }: { title: string; revenue: number; orders: number; percentage: number; color: string }) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm font-bold text-[var(--text-primary)]">{title}</span>
      </div>
      <p className="text-xl font-black text-[var(--text-primary)]">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revenue)}
      </p>
      <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-tertiary)]">
        <span>{orders} {L('orders', 'طلب')}</span>
        <span className="font-bold text-[var(--text-primary)]">{percentage}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
    </div>
  )
}
