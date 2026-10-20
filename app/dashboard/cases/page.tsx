'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquarePlus, RefreshCw, Send } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders } from '../../../lib/businessContext'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'
type Option = { id: number; label: string }
type Assignee = { id: number; name: string }
type CaseComment = { id: number; body: string; author?: { name?: string }; created_at: string }
type SupportCase = {
  id: number; case_number: string; subject: string; description?: string | null; status: string; priority: string; due_at?: string | null
  conversation_id?: number | null; commerce_order_id?: number | null; conversation?: { id: number; sender_name?: string | null; sender_id: string; channel?: { type?: string } } | null
  commerce_order?: { order_number?: string | null; external_id: string; total: number; currency?: string | null } | null
  assigned_to?: number | null; assignee?: { id: number; name: string } | null; creator?: { name: string } | null; comments?: CaseComment[]; comments_count?: number
  events?: { id: number; event_type: string; details?: Record<string, { from?: string | null; to?: string | null }>; actor?: { name?: string }; created_at: string }[]
}

function authHeaders() {
  const token = typeof document === 'undefined' ? '' : decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
  return { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }
}

export default function CasesPage() {
  const [cases, setCases] = useState<SupportCase[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [conversations, setConversations] = useState<Option[]>([])
  const [orders, setOrders] = useState<Option[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [selected, setSelected] = useState<SupportCase | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('normal')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [caseResponse, optionsResponse] = await Promise.all([
        fetch(`${API}/cases?per_page=50`, { headers: authHeaders() }),
        fetch(`${API}/cases/options`, { headers: authHeaders() }),
      ])
      const caseBody = await caseResponse.json().catch(() => ({}))
      const optionBody = await optionsResponse.json().catch(() => ({}))
      if (!caseResponse.ok) throw new Error(caseBody.message || 'Could not load cases.')
      if (!optionsResponse.ok) throw new Error(optionBody.message || 'Could not load conversation and order links.')
      setCases(caseBody.data || [])
      setCounts(caseBody.counts || {})
      setConversations(optionBody.conversations || [])
      setOrders(optionBody.orders || [])
      setAssignees(optionBody.assignees || [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load cases.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  async function createCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/cases`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({
        subject: subject.trim(), description: description.trim() || null, priority,
        assigned_to: assignedTo ? Number(assignedTo) : null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        conversation_id: conversationId ? Number(conversationId) : null,
        commerce_order_id: orderId ? Number(orderId) : null,
      }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not create case.')
      setSubject(''); setDescription(''); setConversationId(''); setOrderId(''); setAssignedTo(''); setDueAt(''); setPriority('normal')
      await load(); setSelected(body.case); setStatus(body.case.status)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create case.') }
    finally { setBusy(false) }
  }

  async function saveStatus() {
    if (!selected || (status === selected.status && priority === selected.priority && (assignedTo ? Number(assignedTo) : null) === (selected.assigned_to ?? null) && (dueAt ? new Date(dueAt).toISOString() : null) === (selected.due_at ?? null))) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/cases/${selected.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status, priority, assigned_to: assignedTo ? Number(assignedTo) : null, due_at: dueAt ? new Date(dueAt).toISOString() : null }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not update case.')
      setSelected(body.case); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update case.') }
    finally { setBusy(false) }
  }

  async function selectCase(item: SupportCase) {
    setSelected(item); setStatus(item.status); setPriority(item.priority)
    setAssignedTo(item.assigned_to ? String(item.assigned_to) : '')
    setDueAt(item.due_at ? new Date(new Date(item.due_at).getTime() - new Date(item.due_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
    try {
      const response = await fetch(`${API}/cases/${item.id}`, { headers: authHeaders() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not load case details.')
      setSelected(body.case)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load case details.') }
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !comment.trim()) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/cases/${selected.id}/comments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ body: comment.trim() }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not add internal note.')
      setComment(''); const detail = await fetch(`${API}/cases/${selected.id}`, { headers: authHeaders() }); const detailBody = await detail.json()
      if (detail.ok) setSelected(detailBody.case)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add internal note.') }
    finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
    <PageHeader title="Cases" description="Track customer issues independently from conversations, with order links and internal notes." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cases' }]} />
    {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{['open', 'pending', 'resolved', 'closed'].map((value) => <Card key={value}><CardContent className="p-3"><p className="text-xs capitalize text-text-muted">{value}</p><p className="text-xl font-semibold">{counts[value] || 0}</p></CardContent></Card>)}</div>
        <Card><CardContent>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquarePlus size={17} /> Create a case</h2>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void createCase(event)}>
            <input required maxLength={191} className="rounded-md border bg-surface px-3 py-2 text-sm md:col-span-2" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            <textarea maxLength={10000} className="min-h-20 rounded-md border bg-surface px-3 py-2 text-sm md:col-span-2" placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} />
            <select aria-label="New case priority" className="rounded-md border bg-surface px-3 py-2 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>{['low', 'normal', 'high', 'urgent'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select aria-label="New case assignee" className="rounded-md border bg-surface px-3 py-2 text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">No assignee</option>{assignees.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
            <label className="text-xs text-text-secondary">SLA target (optional)<input type="datetime-local" className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
            <select className="rounded-md border bg-surface px-3 py-2 text-sm" value={conversationId} onChange={(event) => setConversationId(event.target.value)}><option value="">Link a conversation (optional)</option>{conversations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <select className="rounded-md border bg-surface px-3 py-2 text-sm" value={orderId} onChange={(event) => setOrderId(event.target.value)}><option value="">Link an order (optional)</option>{orders.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <div className="md:col-span-2"><Button type="submit" disabled={busy || !subject.trim()}><MessageSquarePlus size={15} /> Create case</Button></div>
          </form>
        </CardContent></Card>
        <div className="flex items-center justify-between"><h2 className="font-semibold">Cases</h2><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</Button></div>
        {loading && cases.length === 0 ? <p className="p-5 text-sm text-text-muted">Loading cases…</p> : cases.length === 0 ? <Card><CardContent className="text-sm text-text-muted">No cases yet. Create one above to track an issue.</CardContent></Card> : <div className="space-y-2">{cases.map((item) => <button key={item.id} type="button" onClick={() => void selectCase(item)} className={`w-full rounded-xl border bg-surface p-4 text-left transition hover:border-brand/50 ${selected?.id === item.id ? 'border-brand' : 'border-border'}`}>
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-text-muted">{item.case_number}</span><span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs">{item.status}</span><span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs">{item.priority}</span></div>
          <h3 className="mt-2 font-medium">{item.subject}</h3><p className="mt-1 text-xs text-text-muted">{item.conversation ? `${item.conversation.sender_name || item.conversation.sender_id} · ${item.conversation.channel?.type || 'conversation'}` : item.commerce_order ? `Order #${item.commerce_order.order_number || item.commerce_order.external_id}` : 'No linked conversation or order'} · {item.comments_count || 0} internal notes</p>
        </button>)}</div>}
        <p className="text-xs text-text-muted">Showing up to 50 cases. <Link href="/dashboard/handoffs" className="text-brand hover:underline">Open handoffs</Link></p>
      </div>
      <Card><CardContent className="space-y-4">
        {!selected ? <p className="py-8 text-sm text-text-muted">Select a case to review its details and add an internal note.</p> : <>
          <div><p className="font-mono text-xs text-text-muted">{selected.case_number}</p><h2 className="mt-1 text-lg font-semibold">{selected.subject}</h2>{selected.description && <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{selected.description}</p>}</div>
          {selected.conversation && <Link className="block text-sm text-brand hover:underline" href={`/dashboard/inbox?conversation=${selected.conversation.id}`}>Open conversation · {selected.conversation.sender_name || selected.conversation.sender_id}</Link>}
          {selected.commerce_order && <p className="text-sm">Order #{selected.commerce_order.order_number || selected.commerce_order.external_id} · {selected.commerce_order.total} {selected.commerce_order.currency}</p>}
          <div className="grid gap-2 sm:grid-cols-2"><select aria-label="Case status" className="rounded-md border bg-surface px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>{['open', 'pending', 'resolved', 'closed'].map((value) => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Case priority" className="rounded-md border bg-surface px-3 py-2 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>{['low', 'normal', 'high', 'urgent'].map((value) => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Case assignee" className="rounded-md border bg-surface px-3 py-2 text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Unassigned</option>{assignees.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><input aria-label="SLA target" type="datetime-local" className="rounded-md border bg-surface px-3 py-2 text-sm" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /><Button variant="outline" size="sm" onClick={() => void saveStatus()} disabled={busy || (status === selected.status && priority === selected.priority && (assignedTo ? Number(assignedTo) : null) === (selected.assigned_to ?? null) && (dueAt ? new Date(dueAt).toISOString() : null) === (selected.due_at ?? null))}>Save case</Button></div>
          <section><h3 className="mb-2 text-sm font-semibold">Internal notes</h3><div className="max-h-72 space-y-2 overflow-y-auto">{(selected.comments || []).length === 0 ? <p className="text-xs text-text-muted">No internal notes yet.</p> : selected.comments?.map((entry) => <article key={entry.id} className="rounded-lg bg-surface-elevated p-3"><p className="whitespace-pre-wrap text-sm">{entry.body}</p><p className="mt-2 text-xs text-text-muted">{entry.author?.name || 'Team member'} · {new Date(entry.created_at).toLocaleString()}</p></article>)}</div>
            <form className="mt-3 flex gap-2" onSubmit={(event) => void addComment(event)}><textarea required aria-label="Internal note" maxLength={10000} className="min-h-16 flex-1 rounded-md border bg-surface px-3 py-2 text-sm" placeholder="Write an internal note…" value={comment} onChange={(event) => setComment(event.target.value)} /><Button type="submit" disabled={busy || !comment.trim()} aria-label="Add internal note"><Send size={15} /></Button></form>
          </section>
          <section><h3 className="mb-2 text-sm font-semibold">Activity history</h3><div className="space-y-2">{(selected.events || []).map((entry) => <p key={entry.id} className="text-xs text-text-muted">{entry.actor?.name || 'Team member'} {entry.event_type} · {new Date(entry.created_at).toLocaleString()}</p>)}</div></section>
        </>}
      </CardContent></Card>
    </div>
  </div>
}
