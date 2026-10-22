'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquarePlus, RefreshCw, Send } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { Select } from '../../../components/ui/Select'
import { useLang } from '../../../lib/LangContext'

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
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
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
      if (!caseResponse.ok) throw new Error(caseBody.message || L('Could not load cases.', 'تعذر تحميل الحالات.'))
      if (!optionsResponse.ok) throw new Error(optionBody.message || L('Could not load conversation and order links.', 'تعذر تحميل المحادثات والطلبات المرتبطة.'))
      setCases(caseBody.data || [])
      setCounts(caseBody.counts || {})
      setConversations(optionBody.conversations || [])
      setOrders(optionBody.orders || [])
      setAssignees(optionBody.assignees || [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not load cases.', 'تعذر تحميل الحالات.')) }
    finally { setLoading(false) }
  }, [L])

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
      if (!response.ok) throw new Error(body.message || L('Could not create case.', 'تعذر إنشاء الحالة.'))
      setSubject(''); setDescription(''); setConversationId(''); setOrderId(''); setAssignedTo(''); setDueAt(''); setPriority('normal')
      await load(); setSelected(body.case); setStatus(body.case.status)
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not create case.', 'تعذر إنشاء الحالة.')) }
    finally { setBusy(false) }
  }

  async function saveStatus() {
    if (!selected || (status === selected.status && priority === selected.priority && (assignedTo ? Number(assignedTo) : null) === (selected.assigned_to ?? null) && (dueAt ? new Date(dueAt).toISOString() : null) === (selected.due_at ?? null))) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/cases/${selected.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status, priority, assigned_to: assignedTo ? Number(assignedTo) : null, due_at: dueAt ? new Date(dueAt).toISOString() : null }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not update case.', 'تعذر تحديث الحالة.'))
      setSelected(body.case); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not update case.', 'تعذر تحديث الحالة.')) }
    finally { setBusy(false) }
  }

  async function selectCase(item: SupportCase) {
    setSelected(item); setStatus(item.status); setPriority(item.priority)
    setAssignedTo(item.assigned_to ? String(item.assigned_to) : '')
    setDueAt(item.due_at ? new Date(new Date(item.due_at).getTime() - new Date(item.due_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
    try {
      const response = await fetch(`${API}/cases/${item.id}`, { headers: authHeaders() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not load case details.', 'تعذر تحميل تفاصيل الحالة.'))
      setSelected(body.case)
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not load case details.', 'تعذر تحميل تفاصيل الحالة.')) }
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !comment.trim()) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/cases/${selected.id}/comments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ body: comment.trim() }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not add internal note.', 'تعذرت إضافة الملاحظة الداخلية.'))
      setComment(''); const detail = await fetch(`${API}/cases/${selected.id}`, { headers: authHeaders() }); const detailBody = await detail.json()
      if (detail.ok) setSelected(detailBody.case)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not add internal note.', 'تعذرت إضافة الملاحظة الداخلية.')) }
    finally { setBusy(false) }
  }

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={L('Cases', 'الحالات')} description={L('Track customer issues with ownership, priority, order links, and private team notes.', 'تابع مشكلات العملاء مع تحديد المسؤول والأولوية وربط الطلبات والملاحظات الداخلية.')} breadcrumbs={[{ label: L('Dashboard', 'لوحة التحكم'), href: '/dashboard' }, { label: L('Cases', 'الحالات') }]} primaryAction={<Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>{L('Refresh', 'تحديث')}</Button>} />
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{['open', 'pending', 'resolved', 'closed'].map((value) => <Card key={value}><CardContent className="p-4"><p className="text-xs font-medium capitalize text-text-tertiary">{L(value, value === 'open' ? 'مفتوحة' : value === 'pending' ? 'قيد الانتظار' : value === 'resolved' ? 'تم الحل' : 'مغلقة')}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{counts[value] || 0}</p></CardContent></Card>)}</div>
        <Card><CardContent className="space-y-4">
          <div><h2 className="flex items-center gap-2 text-base font-semibold text-text-primary"><MessageSquarePlus size={17} className="text-brand" /> {L('Create a case', 'إنشاء حالة')}</h2><p className="mt-1 text-sm text-text-secondary">{L('Record an issue and optionally link it to a customer conversation or commerce order.', 'سجّل مشكلة واربطها اختياريًا بمحادثة عميل أو بطلب متجر.')}</p></div>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void createCase(event)}>
            <input required maxLength={191} aria-label={L('Subject', 'الموضوع')} className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand md:col-span-2" placeholder={L('Subject', 'الموضوع')} value={subject} onChange={(event) => setSubject(event.target.value)} />
            <textarea maxLength={10000} aria-label={L('Description (optional)', 'الوصف (اختياري)')} className="min-h-20 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand md:col-span-2" placeholder={L('Description (optional)', 'الوصف (اختياري)')} value={description} onChange={(event) => setDescription(event.target.value)} />
            <Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('New case priority', 'أولوية الحالة الجديدة')} value={priority} onValueChange={setPriority} options={['low', 'normal', 'high', 'urgent'].map((value) => ({ value, label: L(value, value === 'low' ? 'منخفضة' : value === 'normal' ? 'عادية' : value === 'high' ? 'مرتفعة' : 'عاجلة') }))} />
            <Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('New case assignee', 'المسؤول عن الحالة الجديدة')} value={assignedTo} onValueChange={setAssignedTo} options={[{ value: '', label: L('No assignee', 'دون مسؤول') }, ...assignees.map((member) => ({ value: String(member.id), label: member.name }))]} />
            <label className="text-xs font-semibold text-text-secondary">{L('SLA target (optional)', 'موعد الاستحقاق (اختياري)')}<input aria-label={L('SLA target', 'موعد الاستحقاق')} type="datetime-local" className="mt-1.5 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
            <Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('Link a conversation (optional)', 'ربط محادثة (اختياري)')} value={conversationId} onValueChange={setConversationId} options={[{ value: '', label: L('Link a conversation (optional)', 'ربط محادثة (اختياري)') }, ...conversations.map((item) => ({ value: String(item.id), label: item.label }))]} />
            <Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('Link an order (optional)', 'ربط طلب (اختياري)')} value={orderId} onValueChange={setOrderId} options={[{ value: '', label: L('Link an order (optional)', 'ربط طلب (اختياري)') }, ...orders.map((item) => ({ value: String(item.id), label: item.label }))]} />
            <div className="md:col-span-2"><Button type="submit" disabled={busy || loading || !subject.trim()} loading={busy}><MessageSquarePlus size={15} /> {L('Create case', 'إنشاء الحالة')}</Button></div>
          </form>
        </CardContent></Card>
        <div className="flex items-center justify-between"><h2 className="font-semibold text-text-primary">{L('Cases', 'الحالات')}</h2><span className="text-xs text-text-tertiary">{L('Latest 50', 'أحدث ٥٠')}</span></div>
        {loading && cases.length === 0 ? <Card><CardContent className="p-6 text-sm text-text-tertiary">{L('Loading cases…', 'جارٍ تحميل الحالات…')}</CardContent></Card> : cases.length === 0 ? <Card><CardContent className="p-6 text-sm text-text-tertiary">{L('No cases yet. Create one above to track an issue.', 'لا توجد حالات بعد. أنشئ حالة أعلاه لمتابعة مشكلة.')}</CardContent></Card> : <div className="space-y-2">{cases.map((item) => <button key={item.id} type="button" aria-pressed={selected?.id === item.id} onClick={() => void selectCase(item)} className={`w-full rounded-xl border bg-surface p-4 text-start transition hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${selected?.id === item.id ? 'border-brand bg-brand/5' : 'border-border'}`}>
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-text-tertiary">{item.case_number}</span><span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs">{L(item.status, item.status === 'open' ? 'مفتوحة' : item.status === 'pending' ? 'قيد الانتظار' : item.status === 'resolved' ? 'تم الحل' : 'مغلقة')}</span><span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs">{L(item.priority, item.priority === 'urgent' ? 'عاجلة' : item.priority === 'high' ? 'مرتفعة' : item.priority === 'normal' ? 'عادية' : 'منخفضة')}</span></div>
          <h3 className="mt-2 font-medium text-text-primary">{item.subject}</h3><p className="mt-1 text-xs text-text-tertiary">{item.conversation ? `${item.conversation.sender_name || item.conversation.sender_id} · ${item.conversation.channel?.type || L('conversation', 'محادثة')}` : item.commerce_order ? `${L('Order', 'طلب')} #${item.commerce_order.order_number || item.commerce_order.external_id}` : L('No linked conversation or order', 'لا توجد محادثة أو طلب مرتبط')} · {item.comments_count || 0} {L('internal notes', 'ملاحظات داخلية')}</p>
        </button>)}</div>}
        <p className="text-xs text-text-tertiary">{L('Showing up to 50 cases.', 'يتم عرض ما يصل إلى ٥٠ حالة.')} <Link href="/dashboard/handoffs" className="text-brand hover:underline">{L('Open handoffs', 'فتح المتابعات')}</Link></p>
      </div>
      <Card className="h-fit xl:sticky xl:top-5"><CardContent className="space-y-5 p-5">
        {!selected ? <div className="py-10 text-center"><MessageSquarePlus className="mx-auto mb-3 text-text-tertiary" size={24} /><p className="text-sm text-text-secondary">{L('Select a case to review its details and add an internal note.', 'اختر حالة لمراجعة تفاصيلها وإضافة ملاحظة داخلية.')}</p></div> : <>
          <div className="border-b border-border/60 pb-4"><p className="font-mono text-xs text-text-tertiary">{selected.case_number}</p><h2 className="mt-1 text-lg font-semibold text-text-primary">{selected.subject}</h2>{selected.description && <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{selected.description}</p>}</div>
          {selected.conversation && <Link className="block rounded-lg bg-brand/5 p-3 text-sm text-brand hover:bg-brand/10" href={`/dashboard/inbox?conversation=${selected.conversation.id}`}>{L('Open conversation', 'فتح المحادثة')} · {selected.conversation.sender_name || selected.conversation.sender_id}</Link>}
          {selected.commerce_order && <p className="rounded-lg bg-surface-elevated p-3 text-sm text-text-primary">{L('Order', 'طلب')} #{selected.commerce_order.order_number || selected.commerce_order.external_id} · {selected.commerce_order.total} {selected.commerce_order.currency}</p>}
          <div className="grid gap-3 sm:grid-cols-2"><Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('Case status', 'حالة التذكرة')} value={status} onValueChange={setStatus} options={['open', 'pending', 'resolved', 'closed'].map((value) => ({ value, label: L(value, value === 'open' ? 'مفتوحة' : value === 'pending' ? 'قيد الانتظار' : value === 'resolved' ? 'تم الحل' : 'مغلقة') }))} /><Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('Case priority', 'أولوية الحالة')} value={priority} onValueChange={setPriority} options={['low', 'normal', 'high', 'urgent'].map((value) => ({ value, label: L(value, value === 'low' ? 'منخفضة' : value === 'normal' ? 'عادية' : value === 'high' ? 'مرتفعة' : 'عاجلة') }))} /><Select dir={isRTL ? 'rtl' : 'ltr'} ariaLabel={L('Case assignee', 'المسؤول عن الحالة')} value={assignedTo} onValueChange={setAssignedTo} options={[{ value: '', label: L('Unassigned', 'غير مسندة') }, ...assignees.map((member) => ({ value: String(member.id), label: member.name }))]} /><input aria-label={L('SLA target', 'موعد الاستحقاق')} type="datetime-local" className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div><Button variant="primary" size="sm" onClick={() => void saveStatus()} loading={busy} disabled={busy || (status === selected.status && priority === selected.priority && (assignedTo ? Number(assignedTo) : null) === (selected.assigned_to ?? null) && (dueAt ? new Date(dueAt).toISOString() : null) === (selected.due_at ?? null))}>{L('Save case', 'حفظ الحالة')}</Button>
          <section className="border-t border-border/60 pt-4"><h3 className="mb-2 text-sm font-semibold text-text-primary">{L('Internal notes', 'ملاحظات داخلية')}</h3><div className="max-h-72 space-y-2 overflow-y-auto">{(selected.comments || []).length === 0 ? <p className="rounded-lg bg-surface-elevated p-3 text-xs text-text-tertiary">{L('No internal notes yet.', 'لا توجد ملاحظات داخلية بعد.')}</p> : selected.comments?.map((entry) => <article key={entry.id} className="rounded-xl bg-surface-elevated p-3"><p className="whitespace-pre-wrap text-sm text-text-primary">{entry.body}</p><p className="mt-2 text-xs text-text-tertiary">{entry.author?.name || L('Team member', 'عضو الفريق')} · {new Date(entry.created_at).toLocaleString(isRTL ? 'ar' : undefined)}</p></article>)}</div>
            <form className="mt-3 flex gap-2" onSubmit={(event) => void addComment(event)}><textarea required aria-label={L('Internal note', 'ملاحظة داخلية')} maxLength={10000} className="min-h-16 min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand" placeholder={L('Write an internal note…', 'اكتب ملاحظة داخلية…')} value={comment} onChange={(event) => setComment(event.target.value)} /><Button type="submit" disabled={busy || !comment.trim()} loading={busy} aria-label={L('Add internal note', 'إضافة ملاحظة داخلية')} title={L('Add internal note', 'إضافة ملاحظة داخلية')}><Send size={15} /></Button></form>
          </section>
          <section className="border-t border-border/60 pt-4"><h3 className="mb-2 text-sm font-semibold text-text-primary">{L('Activity history', 'سجل النشاط')}</h3><div className="space-y-2">{(selected.events || []).length === 0 ? <p className="text-xs text-text-tertiary">{L('No activity recorded yet.', 'لا يوجد نشاط مسجل بعد.')}</p> : (selected.events || []).map((entry) => <p key={entry.id} className="rounded-lg bg-surface-elevated px-3 py-2 text-xs text-text-secondary">{entry.actor?.name || L('Team member', 'عضو الفريق')} {entry.event_type} · {new Date(entry.created_at).toLocaleString(isRTL ? 'ar' : undefined)}</p>)}</div></section>
        </>}
      </CardContent></Card>
    </div>
  </main>
}
