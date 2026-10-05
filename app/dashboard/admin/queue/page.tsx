'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../../../lib/LangContext'
import {
  RefreshCw, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Trash2, RotateCw, Activity
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : ''
}

interface QueueStats {
  pending_jobs: number
  failed_jobs: number
  queues: Array<{ name: string; pending: number }>
  failed_jobs_list: {
    data: Array<{
      id: number
      queue: string
      payload: string
      exception: string
      failed_at: string
    }>
  }
}

export default function QueueMonitorPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedJob, setExpandedJob] = useState<number | null>(null)
  const [retrying, setRetrying] = useState<number | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/admin/queue/stats`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch queue stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const retryJob = useCallback(async (jobId: number) => {
    setRetrying(jobId)
    try {
      const token = getToken()
      await fetch(`${API}/api/admin/queue/retry/${jobId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      await fetchStats()
    } catch (error) {
      console.error('Failed to retry job:', error)
    } finally {
      setRetrying(null)
    }
  }, [fetchStats])

  const deleteJob = useCallback(async (jobId: number) => {
    try {
      const token = getToken()
      await fetch(`${API}/api/admin/queue/failed/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      await fetchStats()
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }, [fetchStats])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">{L('Queue Monitor', 'مراقب الانتظار')}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{L('Monitor queue workers and failed jobs', 'مراقبة عمال الانتظار والمهام الفاشلة')}</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Activity size={20} className="text-info" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{L('Pending Jobs', 'المهام المعلقة')}</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">{stats?.pending_jobs ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
              <XCircle size={20} className="text-error" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{L('Failed Jobs', 'المهام الفاشلة')}</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">{stats?.failed_jobs ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle size={20} className="text-success" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{L('Active Queues', 'الطوابير النشطة')}</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">{stats?.queues?.length ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Breakdown */}
      {stats?.queues && stats.queues.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{L('Queue Breakdown', 'تفصيل الطوابير')}</h2>
          <div className="space-y-3">
            {stats.queues.map(queue => (
              <div key={queue.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-sm font-bold text-[var(--text-primary)]">{queue.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-info"
                      style={{ width: `${Math.min(100, queue.pending)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)] w-8 text-right">{queue.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Jobs */}
      <div className="p-6 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{L('Failed Jobs', 'المهام الفاشلة')}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {(stats?.failed_jobs_list?.data || []).map(job => (
              <div key={job.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--surface)] transition-colors"
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-error" />
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Job #{job.id}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{job.queue} • {new Date(job.failed_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); retryJob(job.id) }}
                      disabled={retrying === job.id}
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                      title={L('Retry', 'إعادة المحاولة')}
                    >
                      <RotateCw size={14} className={retrying === job.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteJob(job.id) }}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-[var(--text-secondary)] hover:text-error transition-colors"
                      title={L('Delete', 'حذف')}
                    >
                      <Trash2 size={14} />
                    </button>
                    {expandedJob === job.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                {expandedJob === job.id && (
                  <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-bold text-[var(--text-tertiary)] mb-2">{L('Exception', 'الاستثناء')}</p>
                    <pre className="text-xs text-error bg-error/5 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {job.exception || 'No exception details available'}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {(!stats?.failed_jobs_list?.data || stats.failed_jobs_list.data.length === 0) && (
              <p className="text-center py-8 text-[var(--text-tertiary)]">{L('No failed jobs', 'لا توجد مهام فاشلة')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
