'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Frown, Heart, MessageSquare } from 'lucide-react'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`

export default function CustomerFeedbackPage() {
  const params = useParams<{ token: string }>()
  const token = params.token
  const [businessName, setBusinessName] = useState('Customer Support')
  const [active, setActive] = useState(false)
  const [rating, setRating] = useState<'positive' | 'negative' | ''>('')
  const [feedback, setFeedback] = useState('')
  const [done, setDone] = useState(false)
  const [optedOut, setOptedOut] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API}/public/csat-surveys/${encodeURIComponent(token)}`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'This feedback link is unavailable.')
      setBusinessName(body.business_name || 'Customer Support'); setActive(Boolean(body.active))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'This feedback link is unavailable.') }
  }, [token])
  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!rating) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/public/csat-surveys/${encodeURIComponent(token)}/response`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, feedback: feedback.trim() || null }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Your response could not be saved.')
      setDone(true); setActive(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your response could not be saved.') }
    finally { setBusy(false) }
  }

  async function optOut() {
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/public/csat-surveys/${encodeURIComponent(token)}/opt-out`, { method: 'POST', headers: { Accept: 'application/json' } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not save your preference.')
      setOptedOut(true); setActive(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save your preference.') }
    finally { setBusy(false) }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900"><section className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm md:p-8">
    <p className="text-sm font-medium text-brand">{businessName}</p><h1 className="mt-2 text-2xl font-bold">How was your support experience?</h1><p className="mt-2 text-sm text-slate-600">Your feedback helps the support team improve.</p>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {done ? <div role="status" className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 size={18} /> Thank you for your feedback.</div> : optedOut ? <p role="status" className="mt-6 rounded-lg bg-slate-100 p-4 text-sm">Your preference is saved. We will not send you future feedback requests for this business.</p> : active ? <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
      <div className="grid grid-cols-2 gap-3"><button type="button" aria-pressed={rating === 'positive'} onClick={() => setRating('positive')} className={`flex items-center justify-center gap-2 rounded-xl border p-4 ${rating === 'positive' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50'}`}><Heart size={18} /> Good</button><button type="button" aria-pressed={rating === 'negative'} onClick={() => setRating('negative')} className={`flex items-center justify-center gap-2 rounded-xl border p-4 ${rating === 'negative' ? 'border-amber-600 bg-amber-50 text-amber-800' : 'hover:bg-slate-50'}`}><Frown size={18} /> Could be better</button></div>
      <label className="block text-sm">Comment (optional)<span className="mt-1 flex items-start gap-2 rounded-xl border p-3"><MessageSquare size={16} className="mt-1 text-slate-400" /><textarea maxLength={500} className="min-h-20 w-full resize-y outline-none" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Tell us a little more" /></span></label>
      <button type="submit" disabled={busy || !rating} className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit feedback'}</button>
      <button type="button" disabled={busy} onClick={() => void optOut()} className="w-full py-2 text-xs text-slate-500 underline">Do not ask me for feedback again</button>
    </form> : !error ? <p className="mt-6 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">This survey has expired or was already submitted.</p> : null}
  </section></main>
}
