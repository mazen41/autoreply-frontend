'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/json',
  }
}

interface FeedbackStats {
  total_feedback: number
  positive_count: number
  negative_count: number
  positive_rate: number
  issue_breakdown: Record<string, number>
  dialect_breakdown: Record<string, number>
  avg_confidence: number
  positive_avg_confidence: number
  negative_avg_confidence: number
}

export default function TrainingDashboard() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/feedback/statistics`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setStats(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const getIssueLabel = (issue: string) => {
    const labels: Record<string, string> = {
      inaccurate: isRTL ? 'غير دقيق' : 'Inaccurate',
      inappropriate: isRTL ? 'غير مناسب' : 'Inappropriate',
      off_topic: isRTL ? 'غير ذي صلة' : 'Off-topic',
      poor_quality: isRTL ? 'جودة منخفضة' : 'Poor Quality',
      other: isRTL ? 'أخرى' : 'Other',
    }
    return labels[issue] || issue
  }

  const getDialectLabel = (dialect: string) => {
    const labels: Record<string, string> = {
      egyptian: isRTL ? 'مصري' : 'Egyptian',
      gulf: isRTL ? 'خليجي' : 'Gulf',
      msa: isRTL ? 'فصحى' : 'MSA',
      mixed: isRTL ? 'مختلط' : 'Mixed',
      unknown: isRTL ? 'غير معروف' : 'Unknown',
    }
    return labels[dialect] || dialect
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-text-primary mb-2">
          {isRTL ? 'لوحة التدريب' : 'Training Dashboard'}
        </h1>
        <p className="text-sm text-text-secondary">
          {isRTL ? 'إحصائيات ومؤشرات أداء الذكاء الاصطناعي' : 'AI Performance Metrics & Statistics'}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-text-tertiary">
          {error}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                {isRTL ? 'إجمالي التغذية' : 'Total Feedback'}
              </div>
              <div className="text-2xl font-black text-text-primary">{stats.total_feedback}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                {isRTL ? 'معدل الإيجابية' : 'Positive Rate'}
              </div>
              <div className="text-2xl font-black text-green-500">{stats.positive_rate}%</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                {isRTL ? 'الثقة المتوسطة' : 'Avg Confidence'}
              </div>
              <div className="text-2xl font-black text-accent">{Math.round(stats.avg_confidence * 100)}%</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                {isRTL ? 'الثقة الإيجابية' : 'Positive Confidence'}
              </div>
              <div className="text-2xl font-black text-green-500">{Math.round(stats.positive_avg_confidence * 100)}%</div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-bold text-text-primary mb-4">
                {isRTL ? 'توزيع المشاكل' : 'Issue Breakdown'}
              </h3>
              {Object.keys(stats.issue_breakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.issue_breakdown).map(([issue, count]) => (
                    <div key={issue} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-text-secondary">{getIssueLabel(issue)}</span>
                          <span className="text-xs font-bold text-text-primary">{count}</span>
                        </div>
                        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${(count / stats.negative_count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-text-tertiary text-center py-4">
                  {isRTL ? 'لا توجد مشاكل مسجلة' : 'No issues recorded'}
                </div>
              )}
            </motion.div>

            {/* Dialect Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-bold text-text-primary mb-4">
                {isRTL ? 'توزيع اللهجات' : 'Dialect Breakdown'}
              </h3>
              {Object.keys(stats.dialect_breakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.dialect_breakdown).map(([dialect, count]) => (
                    <div key={dialect} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-text-secondary">{getDialectLabel(dialect)}</span>
                          <span className="text-xs font-bold text-text-primary">{count}</span>
                        </div>
                        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${(count / stats.total_feedback) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-text-tertiary text-center py-4">
                  {isRTL ? 'لا توجد لهجات مسجلة' : 'No dialects recorded'}
                </div>
              )}
            </motion.div>
          </div>

          {/* Confidence Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <h3 className="text-sm font-bold text-text-primary mb-4">
              {isRTL ? 'تحليل الثقة' : 'Confidence Analysis'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-elevated/40 rounded-lg p-4">
                <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                  {isRTL ? 'المتوسط العام' : 'Overall Average'}
                </div>
                <div className="text-xl font-black text-text-primary">
                  {Math.round(stats.avg_confidence * 100)}%
                </div>
              </div>
              <div className="bg-surface-elevated/40 rounded-lg p-4">
                <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                  {isRTL ? 'متوسط الإيجابي' : 'Positive Average'}
                </div>
                <div className="text-xl font-black text-green-500">
                  {Math.round(stats.positive_avg_confidence * 100)}%
                </div>
              </div>
              <div className="bg-surface-elevated/40 rounded-lg p-4">
                <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                  {isRTL ? 'متوسط السلبي' : 'Negative Average'}
                </div>
                <div className="text-xl font-black text-red-500">
                  {Math.round(stats.negative_avg_confidence * 100)}%
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}
