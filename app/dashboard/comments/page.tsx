'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Camera, Check, CheckCheck, Clock3, Globe2, MessageCircle, MessageSquareText, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

type CommentEvent = {
  id: number
  platform: 'facebook' | 'instagram' | string
  event_type: string
  post_id: string | null
  comment_id: string
  commenter_id: string | null
  comment_text: string | null
  platform_created_at: string | null
  created_at: string
  status: string
  failure_code: string | null
  failure_reason: string | null
  channel?: { id: number; type: string; page_name?: string | null; page_id?: string | null }
  bot?: { id: number; name: string } | null
  reply?: { content: string; source: string; created_at: string } | null
}

type CommentsResponse = {
  data: CommentEvent[]
  current_page: number
  last_page: number
  total: number
  stats: { total: number; replied: number; needs_attention: number }
}

function token() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

function dateLabel(value: string | null | undefined, isRTL: boolean) {
  if (!value) return isRTL ? 'وقت غير معروف' : 'Time unavailable'
  return new Intl.DateTimeFormat(isRTL ? 'ar' : undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status: string, isRTL: boolean) {
  const labels: Record<string, [string, string]> = {
    processed: ['Replied', 'تم الرد'], received: ['Received', 'مستلم'], processing: ['Processing', 'قيد المعالجة'],
    skipped: ['Skipped', 'تم التخطي'], failed: ['Failed', 'فشل'], retryable: ['Retry pending', 'بانتظار إعادة المحاولة'],
  }
  const [en, ar] = labels[status] || [status, status]
  return isRTL ? ar : en
}

export default function CommentsPage() {
  const { isRTL } = useLang()
  const [comments, setComments] = useState<CommentEvent[]>([])
  const [stats, setStats] = useState({ total: 0, replied: 0, needs_attention: 0 })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ per_page: '50', status, page: String(page) })
      if (platform !== 'all') params.set('platform', platform)
      if (search.trim()) params.set('search', search.trim())
      const response = await fetch(`${API}/social-comments?${params}`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const body = await response.json().catch(() => ({})) as CommentsResponse & { message?: string }
      if (!response.ok) throw new Error(body.message || `Could not load comments (HTTP ${response.status}).`)
      const rows = Array.isArray(body.data) ? body.data : []
      setComments(rows)
      setStats(body.stats || { total: body.total || 0, replied: 0, needs_attention: 0 })
      setLastPage(body.last_page || 1)
      setSelectedId((current) => rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load comments.')
      if (!silent) setComments([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [page, platform, search, status])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const timer = window.setInterval(() => { void load(true) }, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const selected = useMemo(() => comments.find((comment) => comment.id === selectedId) || null, [comments, selectedId])
  const title = isRTL ? 'تعليقات الصفحات' : 'Page comments'
  const subtitle = isRTL
    ? 'تابع تعليقات فيسبوك وإنستغرام والردود العامة في مساحة منفصلة عن محادثات العملاء.'
    : 'Review Facebook and Instagram comments and public replies in a workspace separate from customer chats.'

  return (
    <main className="mx-auto h-full max-w-[1500px] space-y-6 overflow-y-auto p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-brand/10 p-6 md:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <MessageCircle size={14} /> {isRTL ? 'مركز التعليقات' : 'COMMENT CENTER'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{subtitle}</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text-primary transition hover:bg-surface-elevated disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label={isRTL ? 'كل التعليقات' : 'All comments'} value={stats.total} icon={<MessageSquareText size={18} />} tone="brand" />
        <StatCard label={isRTL ? 'تم الرد علنًا' : 'Publicly replied'} value={stats.replied} icon={<CheckCheck size={18} />} tone="success" />
        <StatCard label={isRTL ? 'تحتاج مراجعة' : 'Needs attention'} value={stats.needs_attention} icon={<TriangleAlert size={18} />} tone="warning" />
      </section>

      {error && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-text-tertiary ltr:left-3 rtl:right-3" />
            <input aria-label={isRTL ? 'بحث في التعليقات' : 'Search comments'} value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder={isRTL ? 'ابحث في نص التعليق أو معرّف الحساب...' : 'Search comment text or account ID...'} className="h-10 w-full rounded-xl border border-border bg-background text-sm text-text-primary outline-none transition focus:border-brand ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9" />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={status === 'all'} onClick={() => { setPage(1); setStatus('all') }}>{isRTL ? 'الكل' : 'All'}</FilterButton>
            <FilterButton active={status === 'needs_attention'} onClick={() => { setPage(1); setStatus('needs_attention') }}>{isRTL ? 'تحتاج مراجعة' : 'Needs attention'}</FilterButton>
            <FilterButton active={status === 'replied'} onClick={() => { setPage(1); setStatus('replied') }}>{isRTL ? 'تم الرد' : 'Replied'}</FilterButton>
          </div>
          <select value={platform} onChange={(event) => { setPage(1); setPlatform(event.target.value) }} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-brand">
            <option value="all">{isRTL ? 'كل المنصات' : 'All platforms'}</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <div className="grid min-h-[520px] lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="max-h-[72vh] overflow-y-auto border-b border-border lg:border-b-0 lg:border-e">
            {loading && comments.length === 0 ? <div className="space-y-3 p-4">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-elevated" />)}</div> : comments.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-text-tertiary"><MessageCircle size={22} /></div>
                <p className="font-semibold text-text-primary">{isRTL ? 'لا توجد تعليقات هنا' : 'No comments here yet'}</p>
                <p className="mt-1 max-w-xs text-sm text-text-tertiary">{isRTL ? 'ستظهر تعليقات الصفحات هنا عند وصولها.' : 'New comments from your connected pages will appear here.'}</p>
              </div>
            ) : comments.map((comment) => (
              <button key={comment.id} onClick={() => setSelectedId(comment.id)} className={`block w-full border-b border-border/70 p-4 text-start transition hover:bg-surface-elevated/50 ${selectedId === comment.id ? 'bg-brand/5 shadow-[inset_3px_0_0_var(--color-brand)]' : ''}`}>
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={comment.platform} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{comment.channel?.page_name || comment.channel?.page_id || (isRTL ? 'صفحة متصلة' : 'Connected page')}</span>
                  <StatusPill status={comment.status} isRTL={isRTL} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-text-secondary">{comment.comment_text || (isRTL ? 'تعليق بدون نص' : 'Comment has no text')}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-text-tertiary">
                  <span className="truncate">{comment.bot?.name || (isRTL ? 'لم يتم تعيين وكيل' : 'No agent assigned')}</span>
                  <span className="shrink-0">{dateLabel(comment.platform_created_at || comment.created_at, isRTL)}</span>
                </div>
              </button>
            ))}
          </div>

          <article className="min-w-0 p-5 md:p-7">
            {selected ? <>
              <div className="flex flex-wrap items-center gap-2">
                <PlatformIcon platform={selected.platform} />
                <span className="text-sm font-semibold text-text-primary">{selected.platform === 'instagram' ? 'Instagram' : 'Facebook'}</span>
                <span className="text-text-tertiary">·</span>
                <span className="text-sm text-text-secondary">{selected.channel?.page_name || selected.channel?.page_id}</span>
                <span className="ms-auto"><StatusPill status={selected.status} isRTL={isRTL} /></span>
              </div>
              <div className="mt-6 rounded-2xl border border-border bg-background p-5 md:p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"><MessageCircle size={14} /> {isRTL ? 'التعليق الوارد' : 'Incoming comment'}</div>
                <p className="whitespace-pre-wrap break-words text-base leading-7 text-text-primary">{selected.comment_text || (isRTL ? 'تعليق بدون نص' : 'Comment has no text')}</p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-tertiary">
                  <span>{isRTL ? 'الحساب' : 'Commenter'}: {selected.commenter_id || '—'}</span>
                  <span>{isRTL ? 'المنشور' : 'Post'}: {selected.post_id || '—'}</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"><CheckCheck size={14} /> {isRTL ? 'الرد العام' : 'Public reply'}</div>
                {selected.reply?.content ? (
                  <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-text-primary">{selected.reply.content}</p>
                    <p className="mt-4 text-xs text-text-tertiary">{dateLabel(selected.reply.created_at, isRTL)}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-text-secondary">
                    <Clock3 size={17} className="mt-0.5 shrink-0 text-text-tertiary" />
                    <span>{selected.failure_reason || selected.failure_code || (isRTL ? 'لم يتم تسجيل رد عام لهذا التعليق.' : 'No public reply is recorded for this comment.')}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-border pt-4 text-xs text-text-tertiary">{isRTL ? 'وقت وصول التعليق' : 'Received'} · {dateLabel(selected.platform_created_at || selected.created_at, isRTL)}</div>
            </> : <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-text-tertiary"><MessageSquareText size={28} className="mb-3 opacity-50" /><p className="text-sm">{isRTL ? 'اختر تعليقًا لعرض التفاصيل' : 'Select a comment to see its details'}</p></div>}
          </article>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-text-tertiary">
          <span>{isRTL ? `الصفحة ${page} من ${lastPage}` : `Page ${page} of ${lastPage}`}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-border px-3 py-1.5 text-text-secondary hover:bg-surface-elevated disabled:opacity-40">{isRTL ? 'السابق' : 'Previous'}</button>
            <button disabled={page >= lastPage || loading} onClick={() => setPage((value) => Math.min(lastPage, value + 1))} className="rounded-lg border border-border px-3 py-1.5 text-text-secondary hover:bg-surface-elevated disabled:opacity-40">{isRTL ? 'التالي' : 'Next'}</button>
          </div>
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'brand' | 'success' | 'warning' }) {
  const styles = { brand: 'text-brand bg-brand/10', success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10' }
  return <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="text-sm text-text-secondary">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</span></div><p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">{value.toLocaleString()}</p></div>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`h-10 rounded-xl border px-3 text-sm font-medium transition ${active ? 'border-brand bg-brand text-white' : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'}`}>{children}</button>
}

function PlatformIcon({ platform }: { platform: string }) {
  return platform === 'instagram'
    ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500"><Camera size={15} /></span>
    : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"><Globe2 size={15} /></span>
}

function StatusPill({ status, isRTL }: { status: string; isRTL: boolean }) {
  const replied = status === 'processed'
  const failed = status === 'failed' || status === 'retryable'
  const palette = replied ? 'border-success/20 bg-success/10 text-success' : failed ? 'border-error/20 bg-error/10 text-error' : 'border-warning/20 bg-warning/10 text-warning'
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${palette}`}>{replied ? <Check size={11} /> : null}{statusLabel(status, isRTL)}</span>
}
