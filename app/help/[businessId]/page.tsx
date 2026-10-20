'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useParams } from 'next/navigation'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type ArticlePreview = { id: number; title: string; slug: string; category: string; excerpt?: string | null }

export default function PublicHelpCenterPage() {
  const params = useParams<{ businessId: string }>()
  const businessId = Number(params.businessId)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [articles, setArticles] = useState<ArticlePreview[]>([])
  const [businessName, setBusinessName] = useState('Help Center')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const search = appliedQuery ? `?q=${encodeURIComponent(appliedQuery)}` : ''
      const response = await fetch(`${API}/public/help-center/${businessId}${search}`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not load the Help Center.')
      setArticles(body.articles || []); setBusinessName(body.business?.name || 'Help Center')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the Help Center.') }
    finally { setLoading(false) }
  }, [businessId, appliedQuery])
  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])
  const categories = useMemo(() => [...new Set(articles.map((article) => article.category))], [articles])
  function submitSearch(event: FormEvent) { event.preventDefault(); setAppliedQuery(query.trim()) }

  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><div className="mx-auto max-w-3xl">
    <p className="text-sm font-medium text-emerald-700">{businessName}</p><h1 className="mt-2 text-3xl font-bold">Help Center</h1><p className="mt-2 text-slate-600">Find answers to common questions.</p>
    <form className="mt-6 flex gap-2" onSubmit={submitSearch}><input aria-label="Search help articles" className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3" placeholder="Search articles" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="rounded-xl bg-emerald-600 px-4 text-white" aria-label="Search"><Search size={18} /></button></form>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading articles…</p> : articles.length === 0 ? <p className="mt-8 rounded-xl border bg-white p-6 text-slate-600">No published articles match this search.</p> : <div className="mt-8 space-y-8">{categories.map((category) => <section key={category}><h2 className="mb-3 text-lg font-semibold">{category}</h2><div className="space-y-3">{articles.filter((article) => article.category === category).map((article) => <Link key={article.id} href={`/help/${businessId}/${article.slug}`} className="block rounded-xl border bg-white p-5 hover:border-emerald-500"><h3 className="font-semibold">{article.title}</h3>{article.excerpt && <p className="mt-2 text-sm text-slate-600">{article.excerpt}</p>}</Link>)}</div></section>)}</div>}
  </div></main>
}
