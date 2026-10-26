'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { getBusinessHeaders } from '../../lib/businessContext'
import { useLang } from '../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type HandoffTask = {
  id: number
  reason: string
  priority: string
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
  const [error, setError] = useState(false)
  const [overdueCount, setOverdueCount] = useState(0)

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
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const resolve = async (taskId: number) => {
    try {
      const resolutionNote = window.prompt(L('Add a resolution note (optional):', 'أضف ملاحظة للحل (اختياري):'))
      if (resolutionNote === null) return
      const response = await fetch(`${API}/api/handoff-tasks/${taskId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify(resolutionNote.trim() ? { resolution_note: resolutionNote.trim() } : {}),
      })
      if (!response.ok) throw new Error('Could not resolve this handoff')
      await refresh()
      onResolved?.()
    } catch {
      setError(true)
    }
  }

  if (loading && tasks.length === 0) return <div className="border-b border-border px-3 py-2 text-[11px] text-text-tertiary">{L('Loading handoffs…', 'جارٍ تحميل طلبات المتابعة…')}</div>
  if (error && tasks.length === 0) return <div className="border-b border-border px-3 py-2 text-[11px] text-warning">{L('Handoff task list is unavailable.', 'قائمة طلبات المتابعة غير متاحة.')}</div>
  if (tasks.length === 0 && overdueCount === 0) return null

  const compact = Boolean(onSelect)

  return (
    <section dir={isRTL ? 'rtl' : 'ltr'} className={`border-b border-warning/20 bg-warning/5 ${compact ? 'px-3 py-2' : 'rounded-2xl border p-4'}`} aria-label={L('Open handoff tasks', 'طلبات المتابعة المفتوحة')}>
      <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <span>{tasks.length} {L('open handoff tasks', 'طلبات متابعة مفتوحة')}</span>
        {overdueCount > 0 && <span className="ms-auto text-warning">{overdueCount} {L('overdue', 'متأخرة')}</span>}
        {!compact && <Link className="ms-auto text-brand hover:underline" href="/dashboard/handoffs">{L('Manage handoffs', 'إدارة طلبات المتابعة')}</Link>}
      </div>
      <ul className={`mt-2 space-y-1.5 ${compact ? 'max-h-24 overflow-y-auto' : ''}`}>
        {tasks.slice(0, compact ? 3 : 5).map(task => {
          const conversationId = task.conversation?.id
          const overdue = Boolean(task.due_at && new Date(task.due_at).getTime() < Date.now())
          return (
            <li key={task.id} className="flex items-center gap-2 text-[11px] text-text-secondary">
              <Clock className={`h-3.5 w-3.5 shrink-0 ${overdue ? 'text-error' : 'text-text-tertiary'}`} />
              <button type="button" className="min-w-0 flex-1 truncate text-start hover:text-brand" onClick={() => conversationId && onSelect?.(conversationId)}>
                {task.conversation?.sender_name || `${L('Conversation', 'محادثة')} #${conversationId}`} · {task.reason.replaceAll('_', ' ')}
              </button>
              {task.due_at && <time className={overdue ? 'text-error' : 'text-text-tertiary'}>{overdue ? L('Overdue', 'متأخرة') : new Date(task.due_at).toLocaleTimeString(isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}</time>}
              {onSelect && <button type="button" className="rounded p-1 text-text-tertiary hover:text-success" title={L('Resolve handoff', 'إنهاء طلب المتابعة')} onClick={() => void resolve(task.id)}><CheckCircle2 size={14} /></button>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
