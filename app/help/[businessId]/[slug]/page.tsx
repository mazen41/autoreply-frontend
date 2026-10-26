'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type Article = { title: string; slug: string; category: string; excerpt?: string | null; content: string; published_at: string | null }

export default function PublicHelpArticlePage() {
  const params = useParams<{ businessId: string; slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [businessName, setBusinessName] = useState('Help Center')
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API}/public/help-center/${params.businessId}/${encodeURIComponent(params.slug)}`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'This published article could not be found.')
      setArticle(body.article); setBusinessName(body.business?.name || 'Help Center')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load article.') }
  }, [params.businessId, params.slug])
  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><article className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 md:p-10">
    <Link className="text-sm text-emerald-700 hover:underline" href={`/help/${params.businessId}`}>← {businessName} Help Center</Link>
    {error ? <p role="alert" className="mt-6 text-red-700">{error}</p> : !article ? <p className="mt-6 text-slate-500">Loading article…</p> : <><p className="mt-8 text-sm text-brand">{article.category}</p><h1 className="mt-2 text-3xl font-bold">{article.title}</h1>{article.excerpt && <p className="mt-4 text-lg text-slate-600">{article.excerpt}</p>}<div className="mt-8 whitespace-pre-wrap leading-7">{article.content}</div></>}
  </article></main>
}
