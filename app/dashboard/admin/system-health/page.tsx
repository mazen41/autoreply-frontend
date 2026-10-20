'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '../../../../lib/LangContext'
import { Activity, AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const token = () => typeof document === 'undefined' ? '' : decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')

type HealthData = {
  generated_at: string
  queue: { pending_jobs: number; failed_jobs: number; queues: Array<{ queue: string; pending: number }> }
  channels: Array<{
    id: number; business_id: number | null; provider: string; label: string | null
    authorization_status: string; connected_at: string | null; last_event_at: string | null
    last_delivery_status: string | null; last_sync_at: string | null; last_error_at: string | null
    last_error_code: string | null; webhook_status: string | null; evidence: string
  }>
  failed_jobs: Array<{ id: number; queue: string; job_name: string; exception_type: string; retry_safe: boolean; failed_at: string }>
  events: Array<{ id: number; component: string; status: string; message: string; details: Record<string, unknown>; is_resolved: boolean; created_at: string }>
}

export default function AdminSystemHealthPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [data, setData] = useState<HealthData | null>(null)
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (provider) params.set('provider', provider)
      if (status) params.set('status', status)
      const response = await fetch(`${API}/api/admin/system-health?${params}`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(response.status === 403 ? 'Admin access is required.' : 'Could not load health data.')
      setData(await response.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load health data.') }
    finally { setLoading(false) }
  }, [provider, status])

  useEffect(() => {
    // This effect synchronizes the page with the remote health snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const card = (title: string, value: number, kind: 'info' | 'warning' | 'success') => {
    const Icon = kind === 'info' ? Activity : kind === 'warning' ? AlertTriangle : CheckCircle
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5" key={title}>
      <div className="flex items-center gap-3"><Icon size={20} className={kind === 'warning' ? 'text-warning' : kind === 'success' ? 'text-success' : 'text-info'} />
        <div><p className="text-xs text-[var(--text-secondary)]">{title}</p><p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p></div>
      </div>
    </div>
  }

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-[var(--text-primary)]">{L('System health & delivery', 'صحة النظام والتسليم')}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{L('Connection authorization is shown separately from message delivery evidence.', 'حالة الاتصال منفصلة عن دليل تسليم الرسائل.')}</p></div>
      <div className="flex items-center gap-2">
        <select value={provider} onChange={e => setProvider(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
          <option value="">{L('All providers', 'كل المزوّدين')}</option>
          {['facebook','instagram','whatsapp','gmail','telegram','salla','shopify','woocommerce'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
          <option value="">{L('Any connection state', 'كل حالات الاتصال')}</option><option value="connected">connected</option><option value="disconnected">disconnected</option>
        </select>
        <button onClick={() => { setLoading(true); setError(''); void load() }} disabled={loading} className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-primary)]"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button>
      </div>
    </header>
    <div className="flex gap-3 text-sm"><Link href="/dashboard/admin/queue" className="text-[var(--accent)] underline">{L('Queue monitor', 'مراقبة المهام')}</Link></div>
    {error && <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</div>}
    {data && <>
      <section className="grid gap-4 sm:grid-cols-3">
        {card(L('Pending jobs', 'المهام المعلقة'), data.queue.pending_jobs, 'info')}
        {card(L('Failed jobs', 'المهام الفاشلة'), data.queue.failed_jobs, data.queue.failed_jobs ? 'warning' : 'success')}
        {card(L('Connected accounts', 'الحسابات المتصلة'), data.channels.filter(c => c.authorization_status === 'connected').length, 'success')}
      </section>
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="border-b border-[var(--border)] p-4"><h2 className="font-semibold text-[var(--text-primary)]">{L('Connected accounts', 'الحسابات المتصلة')}</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-[var(--text-secondary)]"><tr>{['Provider','Account','Connection','Webhooks','Last event','Last delivery','Last sync','Last error'].map(x => <th key={x} className="px-4 py-3">{L(x, x)}</th>)}</tr></thead>
          <tbody>{data.channels.map(c => <tr key={c.id} className="border-t border-[var(--border)] text-[var(--text-primary)]">
            <td className="px-4 py-3">{c.provider}</td><td className="px-4 py-3">{c.label || `Account ${c.id}`}</td><td className="px-4 py-3">{c.authorization_status}</td><td className="px-4 py-3">{c.webhook_status || '—'}</td>
            <td className="px-4 py-3">{c.last_event_at ? new Date(c.last_event_at).toLocaleString() : L('No message evidence', 'لا يوجد دليل رسالة')}</td>
            <td className="px-4 py-3">{c.last_delivery_status || '—'}</td><td className="px-4 py-3">{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : '—'}</td>
            <td className="px-4 py-3">{c.last_error_code ? `${c.last_error_code} · ${c.last_error_at ? new Date(c.last_error_at).toLocaleString() : ''}` : '—'}</td>
          </tr>)}</tbody></table></div>
        {!data.channels.length && <p className="p-6 text-sm text-[var(--text-secondary)]">{L('No accounts match these filters.', 'لا توجد حسابات مطابقة.')}</p>}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <h2 className="mb-3 font-semibold text-[var(--text-primary)]">{L('Recent failed jobs', 'المهام الفاشلة الأخيرة')}</h2>
          {data.failed_jobs.map(j => <div key={j.id} className="border-t border-[var(--border)] py-3 text-sm text-[var(--text-primary)]"><div className="flex items-center gap-2"><XCircle size={15} className="text-error"/><b>{j.job_name}</b><span className="text-[var(--text-secondary)]">#{j.id} · {j.queue}</span></div><p className="mt-1 text-xs text-[var(--text-secondary)]">{j.exception_type} · {new Date(j.failed_at).toLocaleString()} · {j.retry_safe ? L('Safe retry available', 'إعادة محاولة آمنة') : L('Review side effects before retry', 'راجع الآثار قبل الإعادة')}</p></div>)}
          {!data.failed_jobs.length && <p className="text-sm text-[var(--text-secondary)]">{L('No failed jobs.', 'لا توجد مهام فاشلة.')}</p>}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <h2 className="mb-3 font-semibold text-[var(--text-primary)]">{L('Recent operational events', 'الأحداث التشغيلية الأخيرة')}</h2>
          {data.events.map(e => <div key={e.id} className="border-t border-[var(--border)] py-3 text-sm text-[var(--text-primary)]"><div className="flex items-center gap-2"><AlertTriangle size={15} className={e.status === 'critical' ? 'text-error' : 'text-warning'}/><b>{e.component}</b><span>{e.status}</span>{e.is_resolved && <span className="text-success">{L('resolved', 'تم الحل')}</span>}</div><p className="mt-1 text-xs text-[var(--text-secondary)]">{e.message} · {new Date(e.created_at).toLocaleString()}</p></div>)}
          {!data.events.length && <p className="text-sm text-[var(--text-secondary)]">{L('No operational events recorded.', 'لا توجد أحداث مسجلة.')}</p>}
        </div>
      </section>
      <p className="text-xs text-[var(--text-secondary)]">{L('Updated', 'آخر تحديث')}: {new Date(data.generated_at).toLocaleString()}</p>
    </>}
  </main>
}
