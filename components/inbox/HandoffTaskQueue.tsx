'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock, ChevronDown, UserPlus } from 'lucide-react'
import { getBusinessHeaders } from '../../lib/businessContext'
import { useLang } from '../../lib/LangContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Assignee = { id: number; name: string | null; email: string | null; role: string }

type HandoffTask = {
  id: number
  reason: string
  priority: string
  assignee?: Assignee | null
  due_at: string | null
  conversation?: { id: number; sender_name?: string | null; channel?: { type?: string; page_name?: string } }
}

function token(): string {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

export default function HandoffTaskQueue({ onSelect, onResolved }: { onSelect?: (conversationId: number) => void; onResolved?: () => void }) {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [tasks, setTasks] = useState<HandoffTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overdueCount, setOverdueCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [openAssignFor, setOpenAssignFor] = useState<number | null>(null)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [resolveTaskId, setResolveTaskId] = useState<number | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/handoff-tasks/assignees`, {
      headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
    }).then(r => r.ok ? r.json() : []).then(data => setAssignees(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const assignTask = async (taskId: number, userId: number) => {
    setAssigning(taskId)
    try {
      const response = await fetch(`${API}/api/handoff-tasks/${taskId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify({ assigned_to: userId }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || body.message || L('Could not assign this handoff.', 'تعذر إسناد هذه المتابعة.'))
      const data = body
      setTasks(current => current.map(t => t.id === taskId ? { ...t, assignee: data.task?.assignee ?? t.assignee } : t))
      setOpenAssignFor(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L('Could not assign this handoff.', 'تعذر إسناد هذه المتابعة.'))
    } finally {
      setAssigning(null)
    }
  }


  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API}/api/handoff-tasks?status=open`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!response.ok) throw new Error('Could not load handoff tasks')
      const data = await response.json()
      setTasks(Array.isArray(data.data) ? data.data : [])
      const overdueResponse = await fetch(`${API}/api/handoff-tasks?status=open&overdue=true&per_page=1`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (overdueResponse.ok) {
        const overdueData = await overdueResponse.json()
        setOverdueCount(Number(overdueData.meta?.total || 0))
      }
      setError('')
    } catch {
      setError(L('Could not load handoff tasks.', 'تعذر تحميل مهام المتابعة.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const resolve = async (taskId: number) => {
    setResolving(true)
    try {
      const response = await fetch(`${API}/api/handoff-tasks/${taskId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify(resolutionNote.trim() ? { resolution_note: resolutionNote.trim() } : {}),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || body.message || L('Send a manual reply from this inbox before marking this handled.', 'أرسل ردًا يدويًا من صندوق الوارد قبل إنهاء المتابعة.'))
      }
      setResolveTaskId(null)
      setResolutionNote('')
      await refresh()
      onResolved?.()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      if (message.toLowerCase().includes('manual reply')) {
        setError(L('Send a manual reply from this inbox first, then mark the handoff handled.', 'أرسل ردًا يدويًا من صندوق الوارد أولًا، ثم أنهِ المتابعة.'))
      } else if (message.toLowerCase().includes('already been handled')) {
        setError(L('This handoff has already been handled. Refresh the list.', 'تم التعامل مع هذه المتابعة بالفعل. حدّث القائمة.'))
      } else {
        setError(message || L('Could not complete that action. Check the conversation and try again.', 'تعذر إتمام الإجراء. راجع المحادثة وحاول مرة أخرى.'))
      }
    } finally {
      setResolving(false)
    }
  }

  if (loading && tasks.length === 0) return <div className="border-b border-border px-3 py-2 text-[11px] text-text-tertiary">{L('Loading handoffs…', 'جارٍ تحميل طلبات المتابعة…')}</div>
  if (error && tasks.length === 0) return <div className="border-b border-border px-3 py-2 text-[11px] text-warning">{L('Handoff task list is unavailable.', 'قائمة طلبات المتابعة غير متاحة.')}</div>
  if (tasks.length === 0 && overdueCount === 0) return null

  const compact = Boolean(onSelect)

  return (
    <>
    <section dir={isRTL ? 'rtl' : 'ltr'} className={`border-b border-warning/20 bg-warning/5 ${compact ? 'px-3 py-2' : 'rounded-2xl border p-4'}`} aria-label={L('Open handoff tasks', 'طلبات المتابعة المفتوحة')}>
      <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <span>{tasks.length} {L('open handoff tasks', 'طلبات متابعة مفتوحة')}</span>
        {overdueCount > 0 && <span className="ms-auto text-warning">{overdueCount} {L('overdue', 'متأخرة')}</span>}
        {!compact && <Link className="text-brand hover:underline" href="/dashboard/handoffs">{L('Manage handoffs', 'إدارة طلبات المتابعة')}</Link>}
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className={`rounded p-0.5 text-text-tertiary hover:text-text-primary ${overdueCount > 0 || !compact ? '' : 'ms-auto'}`}
          aria-expanded={!collapsed}
          aria-label={collapsed ? L('Expand handoff tasks', 'إظهار طلبات المتابعة') : L('Collapse handoff tasks', 'إخفاء طلبات المتابعة')}
        >
          <ChevronDown size={13} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>
      {!collapsed && (
      <ul className={`mt-2 space-y-1.5 ${compact ? 'max-h-24 overflow-y-auto' : ''}`}>
        {tasks.slice(0, compact ? 3 : 5).map(task => {
          const conversationId = task.conversation?.id
          const overdue = Boolean(task.due_at && new Date(task.due_at).getTime() < Date.now())
          return (
            <li key={task.id} className="relative flex items-center gap-2 text-[11px] text-text-secondary">
              <Clock className={`h-3.5 w-3.5 shrink-0 ${overdue ? 'text-error' : 'text-text-tertiary'}`} />
              <button type="button" className="min-w-0 flex-1 truncate text-start hover:text-brand" onClick={() => conversationId && onSelect?.(conversationId)}>
                {task.conversation?.sender_name || `${L('Conversation', 'محادثة')} #${conversationId}`} · {task.reason.replaceAll('_', ' ')}
              </button>
              {task.due_at && <time className={overdue ? 'text-error' : 'text-text-tertiary'}>{overdue ? L('Overdue', 'متأخرة') : new Date(task.due_at).toLocaleTimeString(isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}</time>}
              <button
                type="button"
                onClick={() => setOpenAssignFor(v => v === task.id ? null : task.id)}
                disabled={assigning === task.id}
                className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 ${task.assignee ? 'text-text-primary' : 'text-text-tertiary hover:text-brand'}`}
                title={task.assignee ? `${L('Assigned to', 'مُسند إلى')}: ${task.assignee.name}` : L('Assign', 'إسناد')}
              >
                <UserPlus size={12} />
                {task.assignee && <span className="max-w-[5rem] truncate">{task.assignee.name}</span>}
              </button>
              {openAssignFor === task.id && (
                <div className="absolute end-0 top-6 z-20 w-44 rounded-lg border border-border bg-surface-elevated p-1 shadow-lg">
                  {assignees.length === 0 && <div className="px-2 py-1 text-text-tertiary">{L('No assignees found', 'لا يوجد أعضاء متاحون')}</div>}
                  {assignees.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => void assignTask(task.id, a.id)}
                      className="block w-full truncate rounded px-2 py-1 text-start text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    >
                      {a.name || a.email} <span className="text-text-tertiary">· {a.role}</span>
                    </button>
                  ))}
                </div>
              )}
              {onSelect && <button type="button" className="rounded p-1 text-text-tertiary hover:text-success" title={L('Resolve handoff', 'إنهاء طلب المتابعة')} onClick={() => { setResolutionNote(''); setResolveTaskId(task.id) }}><CheckCircle2 size={14} /></button>}
            </li>
          )
        })}
      </ul>
      )}
      {error && <p role="alert" className="mt-2 text-[11px] text-warning">{error}</p>}
    </section>
    <Modal isOpen={resolveTaskId !== null} onClose={() => { if (!resolving) setResolveTaskId(null) }} title={L('Mark handoff handled', 'تأكيد التعامل مع المتابعة')} description={L('Send a manual reply in the conversation first. This resumes AI replies for that conversation.', 'أرسل ردًا يدويًا في المحادثة أولًا. بعد ذلك ستُستأنف الردود الآلية للمحادثة.')} footer={<>
      <Button variant="outline" disabled={resolving} onClick={() => setResolveTaskId(null)}>{L('Cancel', 'إلغاء')}</Button>
      <Button variant="primary" loading={resolving} disabled={resolveTaskId === null || resolving} onClick={() => resolveTaskId !== null && void resolve(resolveTaskId)}>{L('Mark handled', 'تم التعامل')}</Button>
    </>}>
      <label className="block space-y-2 text-sm font-medium text-text-secondary">{L('Resolution note (optional)', 'ملاحظة الحل (اختيارية)')}
        <textarea value={resolutionNote} maxLength={2000} rows={3} onChange={(event) => setResolutionNote(event.target.value)} className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" />
      </label>
    </Modal>
    </>
  )
}
