'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'

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
  const [tasks, setTasks] = useState<HandoffTask[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [status, setStatus] = useState('open')
  const [priority, setPriority] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyTask, setBusyTask] = useState<number | null>(null)
  const [error, setError] = useState('')

  const headers = useCallback(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }), [])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ status, per_page: '50' })
      if (priority) params.set('priority', priority)
      if (overdue) params.set('overdue', 'true')
      if (search.trim()) params.set('search', search.trim())
      const response = await fetch(`${API}/handoff-tasks?${params.toString()}`, { headers: headers() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not load handoff tasks.')
      setTasks(body.data || [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load handoff tasks.') }
    finally { setLoading(false) }
  }, [headers, status, priority, overdue, search])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const businessId = getSelectedBusinessId()
    if (!businessId) return
    fetch(`${API}/handoff-tasks/assignees`, { headers: headers() }).then(async (response) => {
      if (response.ok) setMembers(await response.json())
    }).catch(() => {})
  }, [headers])

  async function updateTask(taskId: number, patch: Record<string, unknown>) {
    setBusyTask(taskId); setError('')
    try {
      const response = await fetch(`${API}/handoff-tasks/${taskId}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not update this task.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this task.') }
    finally { setBusyTask(null) }
  }

  async function resolve(taskId: number) {
    const resolutionNote = window.prompt('Resolution note (optional):')
    if (resolutionNote === null) return
    setBusyTask(taskId); setError('')
    try {
      const response = await fetch(`${API}/handoff-tasks/${taskId}/resolve`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify(resolutionNote.trim() ? { resolution_note: resolutionNote.trim() } : {}),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not resolve this task.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not resolve this task.') }
    finally { setBusyTask(null) }
  }

  return <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
    <PageHeader title="Handoff inbox" description="Assign customer escalations, set priority and SLA due times, and record how each request was resolved." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Handoffs' }]} />
    {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>}
    <Card><CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
      <label className="text-xs text-text-secondary">Status<select className="mt-1 block w-full rounded-md border bg-surface px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="open">Open</option><option value="resolved">Resolved</option></select></label>
      <label className="text-xs text-text-secondary">Priority<select className="mt-1 block w-full rounded-md border bg-surface px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
      <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm"><input type="checkbox" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} />Overdue only</label>
      <input className="min-w-0 flex-1 rounded-md border bg-surface px-3 py-2 text-sm" placeholder="Search customer or reason" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void load() }} />
      <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Apply filters</Button>
    </CardContent></Card>
    {loading && tasks.length === 0 ? <p className="p-6 text-sm text-text-muted">Loading handoffs…</p> : tasks.length === 0 ? <Card><CardContent className="text-sm text-text-muted">No handoff tasks match these filters.</CardContent></Card> : <div className="space-y-3">{tasks.map((task) => {
      const isOverdue = task.status === 'open' && Boolean(task.due_at && new Date(task.due_at).getTime() < Date.now())
      const conversation = task.conversation
      const name = conversation?.sender_name || conversation?.sender_id || `Conversation #${conversation?.id}`
      return <Card key={task.id}><CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{name}</h2><span className={`rounded-full px-2 py-0.5 text-xs ${isOverdue ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>{isOverdue ? 'Overdue' : task.status}</span><span className="text-xs text-text-muted">{conversation?.channel?.type || 'channel'} · #{task.id}</span></div><p className="mt-1 text-sm text-text-secondary">{task.reason.replaceAll('_', ' ')}</p><Link href={`/dashboard/inbox?conversation=${conversation?.id || ''}`} className="mt-1 inline-block text-xs text-brand hover:underline">Open conversation</Link></div>
          {task.status === 'open' && <Button variant="outline" size="sm" onClick={() => void resolve(task.id)} disabled={busyTask === task.id}><CheckCircle2 size={15} /> Resolve</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-text-secondary">Priority<select className="mt-1 block w-full rounded-md border bg-surface px-3 py-2 text-sm" value={task.priority} disabled={task.status !== 'open' || busyTask === task.id} onChange={(e) => void updateTask(task.id, { priority: e.target.value })}><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
          <label className="text-xs text-text-secondary">Assigned to<select className="mt-1 block w-full rounded-md border bg-surface px-3 py-2 text-sm" value={task.assigned_to || ''} disabled={task.status !== 'open' || busyTask === task.id} onChange={(e) => e.target.value && void fetch(`${API}/handoff-tasks/${task.id}/assign`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ assigned_to: Number(e.target.value) }) }).then(load).catch(() => setError('Could not assign this handoff.'))}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}</select></label>
          <label className="text-xs text-text-secondary">SLA due time<div className="mt-1 flex gap-2"><input type="datetime-local" className="min-w-0 flex-1 rounded-md border bg-surface px-2 py-2 text-sm" value={toLocalDateTime(task.due_at)} disabled={task.status !== 'open' || busyTask === task.id} onChange={(e) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, due_at: e.target.value ? new Date(e.target.value).toISOString() : null } : item))} onBlur={(e) => void updateTask(task.id, { due_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div></label>
        </div>
        {task.resolution_note && <p className="rounded-lg bg-surface-elevated p-3 text-sm"><strong>Resolution note:</strong> {task.resolution_note}</p>}
        {isOverdue && <p className="flex items-center gap-2 text-xs text-error"><AlertTriangle size={14} />This task is past its SLA due time.</p>}
        {task.due_at && <p className="flex items-center gap-2 text-xs text-text-muted"><Clock3 size={14} />Due {new Date(task.due_at).toLocaleString()}</p>}
      </CardContent></Card>
    })}</div>}
    <p className="text-xs text-text-muted">Showing up to 50 tasks. <Link href="/dashboard/inbox" className="text-brand hover:underline">Return to inbox</Link></p>
  </div>
}
