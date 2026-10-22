'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../../../lib/LangContext'
import {
  RefreshCw, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Trash2, RotateCw, Activity, HeartPulse
} from 'lucide-react'
import Link from 'next/link'
import Button from '../../../../components/ui/Button'
import PageHeader from '../../../../components/ui/PageHeader'

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
      job_name: string
      exception_type: string
      retry_safe: boolean
      failed_at: string
    }>
  }
}

export default function QueueMonitorPage() {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedJob, setExpandedJob] = useState<number | null>(null)
  const [retrying, setRetrying] = useState<number | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجدداً.'))
      const res = await fetch(`${API}/api/admin/queue/stats`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || (res.status === 403 ? L('Admin access is required.', 'يتطلب الوصول صلاحية مسؤول.') : L('Could not load queue statistics.', 'تعذر تحميل إحصائيات الطوابير.')))
      setStats(body)
    } catch (error) {
      setStats(null)
      setError(error instanceof Error ? error.message : L('Could not load queue statistics.', 'تعذر تحميل إحصائيات الطوابير.'))
    } finally {
      setLoading(false)
    }
  }, [L])

  useEffect(() => {
    // This effect synchronizes the remote queue snapshot; state changes occur
    // after the fetch promise settles, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats()
  }, [fetchStats])

  const retryJob = useCallback(async (jobId: number) => {
    setRetrying(jobId)
    setError('')
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجدداً.'))
      const response = await fetch(`${API}/api/admin/queue/retry/${jobId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not retry this job.', 'تعذرت إعادة محاولة هذه المهمة.'))
      await fetchStats()
    } catch (error) {
      setError(error instanceof Error ? error.message : L('Could not retry this job.', 'تعذرت إعادة محاولة هذه المهمة.'))
    } finally {
      setRetrying(null)
    }
  }, [fetchStats, L])

  const deleteJob = useCallback(async (jobId: number) => {
    if (!window.confirm(L(`Permanently delete failed job #${jobId}?`, `هل تريد حذف المهمة الفاشلة رقم ${jobId} نهائياً؟`))) return
    setError('')
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجدداً.'))
      const response = await fetch(`${API}/api/admin/queue/failed/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not delete this failed job.', 'تعذر حذف هذه المهمة الفاشلة.'))
      await fetchStats()
    } catch (error) {
      setError(error instanceof Error ? error.message : L('Could not delete this failed job.', 'تعذر حذف هذه المهمة الفاشلة.'))
    }
  }, [fetchStats])

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={L('Queue Monitor', 'مراقبة الطوابير')} description={L('Monitor queue workers and failed jobs.', 'راقب عمال الطوابير والمهام الفاشلة.')} />
        <Button variant="outline" size="sm" onClick={() => void fetchStats()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{L('Refresh', 'تحديث')}</Button>
        <Link href="/dashboard/admin/system-health" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--surface-elevated)]">
          <HeartPulse size={16} /> {L('System health', 'صحة النظام')}
        </Link>
      </div>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchStats()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

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
              <p className="text-2xl font-black text-[var(--text-primary)]">{stats?.queues?.filter(queue => queue.pending > 0).length ?? '—'}</p>
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
                  <span className="rounded-lg bg-info/10 px-2.5 py-1 text-sm font-bold tabular-nums text-info">{queue.pending}</span>
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
                <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                  <button type="button" aria-expanded={expandedJob === job.id} onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-start hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{job.job_name || `Job #${job.id}`}</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">{job.queue} • {new Date(job.failed_at).toLocaleString()}</span>
                    </span>
                    {expandedJob === job.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void retryJob(job.id)}
                      disabled={retrying === job.id || !job.retry_safe}
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                      aria-label={L(`Retry job ${job.id}`, `إعادة محاولة المهمة ${job.id}`)}
                      title={job.retry_safe ? L('Retry safe job', 'إعادة محاولة آمنة') : L('Manual review required before retry', 'تتطلب إعادة المحاولة مراجعة يدوية')}
                    >
                      <RotateCw size={14} className={retrying === job.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteJob(job.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-[var(--text-secondary)] hover:text-error transition-colors"
                      aria-label={L(`Delete failed job ${job.id}`, `حذف المهمة الفاشلة ${job.id}`)}
                      title={L('Delete', 'حذف')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expandedJob === job.id && (
                  <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-bold text-[var(--text-tertiary)] mb-2">{L('Failure type', 'نوع الفشل')}</p>
                    <p className="text-xs text-error bg-error/5 p-3 rounded-lg">{job.exception_type || L('Unclassified failure', 'فشل غير مصنف')}</p>
                    {!job.retry_safe && <p className="text-xs text-[var(--text-secondary)] mt-2">{L('Retry is disabled until an operator verifies this job’s external side effects.', 'إعادة المحاولة متوقفة حتى يتحقق المسؤول من الآثار الخارجية للمهمة.')}</p>}
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
    </main>
  )
}
