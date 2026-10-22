'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import Checkbox from '../../../components/ui/Checkbox'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'
type Member = { id: number; name: string; email?: string; role: string }
type HandoffTask = {
  id: number; reason: string; priority: string; status: string; due_at: string | null; resolved_at: string | null; resolution_note: string | null; assigned_to: number | null
  conversation?: { id: number; sender_name?: string | null; sender_id?: string; channel?: { type?: string; page_name?: string } }
  assignee?: { id: number; name: string }
}

function token() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

function toLocalDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function HandoffsPage() {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
  const [tasks, setTasks] = useState<HandoffTask[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [status, setStatus] = useState('open')
  const [priority, setPriority] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyTask, setBusyTask] = useState<number | null>(null)
  const [error, setError] = useState('')
  const loadGeneration = useRef(0)
  const memberGeneration = useRef(0)
  const loadRef = useRef<() => Promise<void>>(async () => {})

  const headers = useCallback(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }), [])
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current
    setLoading(true); setError('')
    try {
      if (!getSelectedBusinessId()) throw new Error(L('Select a business before viewing handoffs.', 'اختر نشاطًا تجاريًا قبل عرض المتابعات.'))
      const params = new URLSearchParams({ status, per_page: '50' })
      if (priority) params.set('priority', priority)
      if (overdue) params.set('overdue', 'true')
      if (search.trim()) params.set('search', search.trim())
      const response = await fetch(`${API}/handoff-tasks?${params.toString()}`, { headers: headers() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not load handoff tasks.', 'تعذر تحميل مهام المتابعة.'))
      if (generation !== loadGeneration.current) return
      setTasks(body.data || [])
    } catch (cause) { if (generation === loadGeneration.current) setError(cause instanceof Error ? cause.message : L('Could not load handoff tasks.', 'تعذر تحميل مهام المتابعة.')) }
    finally { if (generation === loadGeneration.current) setLoading(false) }
  }, [headers, status, priority, overdue, search, L])

  useEffect(() => { void load() }, [load])
  useEffect(() => { loadRef.current = load }, [load])
  useEffect(() => {
    const syncBusiness = (refreshTasks: boolean) => {
      const generation = ++memberGeneration.current
      if (!getSelectedBusinessId()) { setMembers([]); return }
      fetch(`${API}/handoff-tasks/assignees`, { headers: headers() }).then(async (response) => {
        if (response.ok) {
          const result = await response.json()
          if (generation === memberGeneration.current) setMembers(result)
        }
      }).catch(() => {})
      if (refreshTasks) void loadRef.current()
    }
    syncBusiness(false)
    const refreshBusiness = () => syncBusiness(true)
    window.addEventListener('naz:business-changed', refreshBusiness)
    window.addEventListener('storage', refreshBusiness)
    return () => {
      memberGeneration.current++
      window.removeEventListener('naz:business-changed', refreshBusiness)
      window.removeEventListener('storage', refreshBusiness)
    }
  }, [headers])

  async function updateTask(taskId: number, patch: Record<string, unknown>) {
    setBusyTask(taskId); setError('')
    try {
      const response = await fetch(`${API}/handoff-tasks/${taskId}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not update this task.', 'تعذر تحديث هذه المهمة.'))
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not update this task.', 'تعذر تحديث هذه المهمة.')) }
    finally { setBusyTask(null) }
  }

  async function assignTask(taskId: number, assignedTo: string) {
    if (!assignedTo) return
    setBusyTask(taskId); setError('')
    try {
      const response = await fetch(`${API}/handoff-tasks/${taskId}/assign`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ assigned_to: Number(assignedTo) }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not assign this handoff.', 'تعذر إسناد هذه المتابعة.'))
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not assign this handoff.', 'تعذر إسناد هذه المتابعة.')) }
    finally { setBusyTask(null) }
  }

  async function resolve(taskId: number) {
    const resolutionNote = window.prompt(L('Resolution note (optional):', 'ملاحظة الحل (اختيارية):'))
    if (resolutionNote === null) return
    setBusyTask(taskId); setError('')
    try {
      const response = await fetch(`${API}/handoff-tasks/${taskId}/resolve`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify(resolutionNote.trim() ? { resolution_note: resolutionNote.trim() } : {}),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not resolve this task.', 'تعذر إغلاق هذه المهمة.'))
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not resolve this task.', 'تعذر إغلاق هذه المهمة.')) }
    finally { setBusyTask(null) }
  }

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={L('Handoff inbox', 'صندوق المتابعات')} description={L('Assign escalated requests, set priority and due times, and record how each request was resolved.', 'أسند الطلبات المصعّدة وحدد الأولوية وموعد الاستحقاق وسجّل طريقة حل كل طلب.')} breadcrumbs={[{ label: L('Dashboard', 'لوحة التحكم'), href: '/dashboard' }, { label: L('Handoffs', 'المتابعات') }]} primaryAction={<Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>{L('Refresh', 'تحديث')}</Button>} />
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}
    <Card><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(12rem,0.8fr)_minmax(12rem,0.8fr)_auto_minmax(14rem,1.2fr)_auto] md:items-end">
      <Select dir={isRTL ? 'rtl' : 'ltr'} label={L('Status', 'الحالة')} className="w-full" value={status} onValueChange={setStatus} options={[{ value: 'open', label: L('Open', 'مفتوحة') }, { value: 'resolved', label: L('Resolved', 'تم الحل') }]} />
      <Select dir={isRTL ? 'rtl' : 'ltr'} label={L('Priority', 'الأولوية')} className="w-full" value={priority} onValueChange={setPriority} options={[{ value: '', label: L('All priorities', 'كل الأولويات') }, { value: 'urgent', label: L('Urgent', 'عاجلة') }, { value: 'high', label: L('High', 'مرتفعة') }, { value: 'normal', label: L('Normal', 'عادية') }, { value: 'low', label: L('Low', 'منخفضة') }]} />
      <Checkbox checked={overdue} onChange={setOverdue} label={L('Overdue only', 'المتأخرة فقط')} className="self-center rounded-lg border border-border bg-surface-elevated px-3 py-2.5" />
      <input aria-label={L('Search customer or reason', 'ابحث عن العميل أو السبب')} className="min-w-0 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand" placeholder={L('Search customer or reason', 'ابحث عن العميل أو السبب')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void load() }} />
      <Button variant="primary" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}>{L('Apply filters', 'تطبيق الفلاتر')}</Button>
    </CardContent></Card>
    {loading && tasks.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-text-tertiary">{L('Loading handoffs…', 'جارٍ تحميل المتابعات…')}</CardContent></Card> : tasks.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-text-tertiary">{L('No handoff tasks match these filters.', 'لا توجد مهام متابعة تطابق عوامل التصفية.')}</CardContent></Card> : <div className="grid gap-4 xl:grid-cols-2">{tasks.map((task) => {
      const isOverdue = task.status === 'open' && Boolean(task.due_at && new Date(task.due_at).getTime() < Date.now())
      const conversation = task.conversation
      const name = conversation?.sender_name || conversation?.sender_id || `Conversation #${conversation?.id}`
      return <Card key={task.id} className="transition-colors hover:border-border-hover"><CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-text-primary">{name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue ? 'bg-error/10 text-error' : task.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{isOverdue ? L('Overdue', 'متأخرة') : L(task.status, task.status === 'open' ? 'مفتوحة' : 'تم الحل')}</span><span className="text-xs text-text-tertiary">{conversation?.channel?.type || L('Channel', 'القناة')} · #{task.id}</span></div><p className="mt-2 text-sm text-text-secondary">{task.reason.replaceAll('_', ' ')}</p><Link href={`/dashboard/inbox?conversation=${conversation?.id || ''}`} className="mt-2 inline-flex items-center rounded-md text-xs font-medium text-brand hover:underline">{L('Open conversation', 'فتح المحادثة')}</Link></div>
          {task.status === 'open' && <Button variant="secondary" size="sm" onClick={() => void resolve(task.id)} loading={busyTask === task.id} disabled={busyTask !== null}><CheckCircle2 size={15} /> {L('Resolve', 'تم الحل')}</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select dir={isRTL ? 'rtl' : 'ltr'} label={L('Priority', 'الأولوية')} className="min-w-32" value={task.priority} disabled={task.status !== 'open' || busyTask !== null} onValueChange={(value) => void updateTask(task.id, { priority: value })} options={[{ value: 'urgent', label: L('Urgent', 'عاجلة') }, { value: 'high', label: L('High', 'مرتفعة') }, { value: 'normal', label: L('Normal', 'عادية') }, { value: 'low', label: L('Low', 'منخفضة') }]} />
          <Select dir={isRTL ? 'rtl' : 'ltr'} label={L('Assigned to', 'المسند إليه')} className="min-w-48" value={task.assigned_to || ''} disabled={task.status !== 'open' || busyTask !== null} onValueChange={(value) => void assignTask(task.id, value)} options={[{ value: '', label: L('Unassigned', 'غير مسند') }, ...members.map((member) => ({ value: String(member.id), label: `${member.name} · ${member.role}` }))]} />
          <label className="text-xs font-semibold text-text-secondary">{L('SLA due time', 'موعد الاستحقاق')}<div className="mt-1 flex gap-2"><input aria-label={L('SLA due time', 'موعد الاستحقاق')} type="datetime-local" className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-2 py-2 text-sm text-text-primary outline-none focus:border-brand" value={toLocalDateTime(task.due_at)} disabled={task.status !== 'open' || busyTask !== null} onChange={(e) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, due_at: e.target.value ? new Date(e.target.value).toISOString() : null } : item))} onBlur={(e) => void updateTask(task.id, { due_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div></label>
        </div>
        {task.resolution_note && <p className="rounded-xl bg-surface-elevated p-3 text-sm text-text-secondary"><strong className="text-text-primary">{L('Resolution note:', 'ملاحظة الحل:')}</strong> {task.resolution_note}</p>}
        {isOverdue && <p className="flex items-center gap-2 text-xs text-error"><AlertTriangle size={14} />{L('This task is past its SLA due time.', 'تجاوزت هذه المهمة موعد الاستحقاق.')}</p>}
        {task.due_at && <p className="flex items-center gap-2 text-xs text-text-tertiary"><Clock3 size={14} />{L('Due', 'تستحق')} {new Date(task.due_at).toLocaleString(isRTL ? 'ar' : undefined)}</p>}
      </CardContent></Card>
    })}</div>}
    <p className="text-xs text-text-tertiary">{L('Showing up to 50 tasks.', 'يتم عرض ما يصل إلى ٥٠ مهمة.')} <Link href="/dashboard/inbox" className="text-brand hover:underline">{L('Return to inbox', 'العودة إلى صندوق الوارد')}</Link></p>
  </main>
}
