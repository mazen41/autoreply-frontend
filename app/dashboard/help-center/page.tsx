'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type Article = { id: number; title: string; slug: string; category: string; excerpt: string | null; content: string; status: 'draft' | 'published'; published_at: string | null }
type Draft = Omit<Article, 'id' | 'published_at'>
const emptyDraft: Draft = { title: '', slug: '', category: 'General', excerpt: '', content: '', status: 'draft' }
function headers() {
  const match = typeof document === 'undefined' ? null : document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return { Authorization: `Bearer ${match ? decodeURIComponent(match[1]) : ''}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }
}

export default function HelpCenterAdminPage() {
  const businessId = getSelectedBusinessId()
  const [articles, setArticles] = useState<Article[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    const response = await fetch(`${API}/help-center/articles`, { headers: headers() })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || 'Could not load Help Center articles.')
    setArticles(body.articles || [])
  }, [])
  useEffect(() => { queueMicrotask(() => { void load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load articles.')) }) }, [load])

  function editArticle(article: Article) {
    setSelected(article.id)
    setDraft({ title: article.title, slug: article.slug, category: article.category, excerpt: article.excerpt || '', content: article.content, status: article.status })
    setNotice('')
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API}/help-center/articles${selected ? `/${selected}` : ''}`, { method: selected ? 'PATCH' : 'POST', headers: headers(), body: JSON.stringify(draft) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not save article.')
      setDraft(emptyDraft); setSelected(null); setNotice('Article saved.'); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save article.') }
    finally { setBusy(false) }
  }

  async function removeArticle(article: Article) {
    if (!window.confirm(`Delete “${article.title}”?`)) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/help-center/articles/${article.id}`, { method: 'DELETE', headers: headers() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not delete article.')
      if (selected === article.id) { setSelected(null); setDraft(emptyDraft) }
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete article.') }
    finally { setBusy(false) }
  }

  const publishedCount = articles.filter((article) => article.status === 'published').length
  return <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
    <PageHeader title="Help Center" description="Publish customer-facing answers. These articles are separate from your private bot knowledge files." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Help Center' }]} />
    {businessId && <p className="text-sm text-text-muted">Public Help Center: <Link className="text-brand hover:underline" href={`/help/${businessId}`} target="_blank">{typeof window === 'undefined' ? `/help/${businessId}` : `${window.location.origin}/help/${businessId}`}</Link></p>}
    {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>}{notice && <p role="status" className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">{notice}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <section className="space-y-3"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Articles</h2><p className="text-xs text-text-muted">{publishedCount} published · {articles.length - publishedCount} drafts</p></div><Button variant="outline" size="sm" onClick={() => { setSelected(null); setDraft(emptyDraft); setNotice('') }}><Plus size={15} /> New article</Button></div>
        {articles.length === 0 ? <Card><CardContent className="text-sm text-text-muted">No articles yet. Add approved customer-facing content to publish.</CardContent></Card> : articles.map((article) => <Card key={article.id}><CardContent className="flex items-start justify-between gap-3"><button className="min-w-0 flex-1 text-left" onClick={() => editArticle(article)}><p className="text-xs text-text-muted">{article.category} · {article.status}</p><h3 className="mt-1 font-medium">{article.title}</h3><p className="mt-1 truncate text-xs text-text-muted">{article.excerpt || article.slug}</p></button><button aria-label={`Delete ${article.title}`} className="rounded p-2 text-text-muted hover:text-error" onClick={() => void removeArticle(article)}><Trash2 size={15} /></button></CardContent></Card>)}
      </section>
      <Card><CardContent><h2 className="mb-4 flex items-center gap-2 font-semibold"><BookOpen size={17} /> {selected ? 'Edit article' : 'New article'}</h2>
        <form className="space-y-3" onSubmit={(event) => void save(event)}>
          <input required maxLength={191} className="w-full rounded-md border bg-surface px-3 py-2 text-sm" placeholder="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2"><input maxLength={191} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="rounded-md border bg-surface px-3 py-2 text-sm" placeholder="slug-like-this (optional)" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /><input required maxLength={100} className="rounded-md border bg-surface px-3 py-2 text-sm" placeholder="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></div>
          <textarea maxLength={500} className="min-h-16 w-full rounded-md border bg-surface px-3 py-2 text-sm" placeholder="Short description (optional)" value={draft.excerpt || ''} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} />
          <textarea required maxLength={50000} className="min-h-64 w-full rounded-md border bg-surface px-3 py-2 text-sm" placeholder="Customer-facing article text" value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} />
          <p className="text-xs text-text-muted">Plain text only. Internal knowledge files are never copied into the public Help Center.</p>
          <div className="flex flex-wrap items-center justify-between gap-3"><select aria-label="Article status" className="rounded-md border bg-surface px-3 py-2 text-sm" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })}><option value="draft">Draft (private)</option><option value="published">Published (public)</option></select><Button type="submit" disabled={busy || !draft.title.trim() || !draft.content.trim()}><Save size={15} /> {busy ? 'Saving…' : 'Save article'}</Button></div>
        </form>
      </CardContent></Card>
    </div>
  </div>
}
