'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { getBusinessHeaders } from '../../lib/businessContext'
import { useLang } from '../../lib/LangContext'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() }
}

interface Correction {
  id: number
  ai_draft: string
  human_correction: string
  approved: boolean
  learning_type: string
  created_at: string
}

interface TrainingReviewProps {
  onApprove: (id: number) => Promise<void>
  onReject: (id: number) => Promise<void>
}

export default function TrainingReview({ onApprove, onReject }: TrainingReviewProps) {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const requestVersion = useRef(0)

  const fetchCorrections = useCallback(async () => {
    const version = ++requestVersion.current
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch(`${API}/training/corrections`, { headers: authHeaders() })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || L('Could not load AI corrections.', 'تعذر تحميل تصحيحات الذكاء الاصطناعي.'))
      if (version === requestVersion.current) setCorrections(Array.isArray(data.corrections) ? data.corrections : [])
    } catch (error) {
      if (version === requestVersion.current) {
        setCorrections([])
        setLoadError(error instanceof Error ? error.message : L('Could not load AI corrections.', 'تعذر تحميل تصحيحات الذكاء الاصطناعي.'))
      }
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [L])

  useEffect(() => {
    void fetchCorrections()
    const refresh = () => { setSelectedCorrection(null); setCorrections([]); void fetchCorrections() }
    window.addEventListener('naz:business-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('naz:business-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [fetchCorrections])

  async function review(id: number, action: 'approve' | 'reject') {
    setBusyId(id)
    try {
      if (action === 'approve') await onApprove(id)
      else await onReject(id)
      setCorrections(current => action === 'approve'
        ? current.map(item => item.id === id ? { ...item, approved: true } : item)
        : current.filter(item => item.id !== id))
      setSelectedCorrection(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : L('Could not update this correction.', 'تعذر تحديث هذا التصحيح.'))
    } finally { setBusyId(null) }
  }

  const pending = corrections.filter(item => !item.approved)
  const approvedCount = corrections.filter(item => item.approved).length

  if (loading) return <div role="status" className="flex min-h-48 items-center justify-center gap-3 p-6 text-sm text-text-tertiary"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />{L('Loading corrections…', 'جارٍ تحميل التصحيحات…')}</div>

  return <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-5 p-4 md:p-6">
    {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => void fetchCorrections()} disabled={loading}><RefreshCw size={14} />{L('Retry', 'إعادة المحاولة')}</Button></div>}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-lg font-semibold text-text-primary">{L('AI training review', 'مراجعة تدريب الذكاء الاصطناعي')}</h2><p className="mt-1 text-sm text-text-secondary">{L('Review human corrections before they are used to improve future responses.', 'راجع تصحيحات الفريق قبل استخدامها لتحسين الردود المستقبلية.')}</p></div>
      <div className="flex gap-3"><div className="rounded-xl border border-border bg-surface-elevated px-4 py-3"><p className="text-xl font-bold tabular-nums text-text-primary">{pending.length}</p><p className="text-xs text-text-tertiary">{L('Pending', 'قيد المراجعة')}</p></div><div className="rounded-xl border border-border bg-surface-elevated px-4 py-3"><p className="text-xl font-bold tabular-nums text-success">{approvedCount}</p><p className="text-xs text-text-tertiary">{L('Approved', 'تمت الموافقة')}</p></div></div>
    </div>

    {selectedCorrection ? <article className="space-y-5 rounded-2xl border border-border bg-surface-elevated/40 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => setSelectedCorrection(null)}><ArrowLeft className={isRTL ? 'rotate-180' : ''} size={15} />{L('Back to review list', 'العودة إلى قائمة المراجعة')}</Button>
      <div className="grid gap-4 lg:grid-cols-2"><section className="space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{L('AI draft', 'مسودة الذكاء الاصطناعي')}</h3><p className="min-h-28 whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-text-primary">{selectedCorrection.ai_draft}</p></section><section className="space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{L('Human correction', 'تصحيح الفريق')}</h3><p className="min-h-28 whitespace-pre-wrap rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm leading-6 text-text-primary">{selectedCorrection.human_correction}</p></section></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline">{selectedCorrection.learning_type}</Badge><div className="flex gap-2"><Button variant="outline" onClick={() => void review(selectedCorrection.id, 'reject')} disabled={busyId !== null}><ThumbsDown size={15} />{L('Reject', 'رفض')}</Button><Button onClick={() => void review(selectedCorrection.id, 'approve')} disabled={busyId !== null} loading={busyId === selectedCorrection.id}><ThumbsUp size={15} />{L('Approve for training', 'الموافقة للتدريب')}</Button></div></div>
    </article> : pending.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success"><Check size={19} /></span><p className="mt-3 font-medium text-text-primary">{L('All corrections reviewed', 'تمت مراجعة جميع التصحيحات')}</p><p className="mt-1 text-sm text-text-secondary">{L('New corrections will appear here when your team reviews AI replies.', 'ستظهر التصحيحات الجديدة هنا بعد مراجعة فريقك لردود الذكاء الاصطناعي.')}</p></div> : <div className="grid gap-3 md:grid-cols-2">{pending.map(item => <button key={item.id} type="button" onClick={() => setSelectedCorrection(item)} className="rounded-xl border border-border bg-surface p-4 text-start transition hover:border-brand/40 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-text-tertiary">{new Date(item.created_at).toLocaleDateString(isRTL ? 'ar' : undefined)}</span><Badge variant="outline" size="sm">{item.learning_type}</Badge></div><p className="line-clamp-3 text-sm leading-6 text-text-primary">{item.ai_draft}</p><p className="mt-3 line-clamp-2 border-s-2 border-brand/50 ps-3 text-xs text-text-secondary">{item.human_correction}</p><span className="mt-3 inline-flex text-xs font-semibold text-brand">{L('Review correction', 'مراجعة التصحيح')} →</span></button>)}</div>}
  </div>
}
