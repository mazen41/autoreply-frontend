'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { BookOpen, ExternalLink, Plus, Save, Trash2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { Select } from '../../../components/ui/Select'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type Article = { id: number; title: string; slug: string; category: string; excerpt: string | null; content: string; status: 'draft' | 'published'; published_at: string | null }
type Draft = Omit<Article, 'id' | 'published_at'>
const emptyDraft: Draft = { title: '', slug: '', category: 'General', excerpt: '', content: '', status: 'draft' }
const fieldClass = 'w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/15'

function headers() {
  const match = typeof document === 'undefined' ? null : document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return { Authorization: `Bearer ${match ? decodeURIComponent(match[1]) : ''}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }
}

export default function HelpCenterAdminPage() {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const syncBusiness = () => setBusinessId(getSelectedBusinessId())
    syncBusiness()
    window.addEventListener('naz:business-changed', syncBusiness)
    window.addEventListener('storage', syncBusiness)
    return () => { window.removeEventListener('naz:business-changed', syncBusiness); window.removeEventListener('storage', syncBusiness) }
  }, [])

  const load = useCallback(async () => {
    if (!businessId) { setArticles([]); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const response = await fetch(`${API}/help-center/articles`, { headers: headers() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not load Help Center articles.', 'تعذر تحميل مقالات مركز المساعدة.'))
      setArticles(Array.isArray(body.articles) ? body.articles : [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not load articles.', 'تعذر تحميل المقالات.')) }
    finally { setLoading(false) }
  }, [businessId, L])

  useEffect(() => { void load() }, [load])

  function editArticle(article: Article) {
    setSelected(article.id)
    setDraft({ title: article.title, slug: article.slug, category: article.category, excerpt: article.excerpt || '', content: article.content, status: article.status })
    setNotice('')
  }

  function newArticle() { setSelected(null); setDraft(emptyDraft); setError(''); setNotice('') }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API}/help-center/articles${selected ? `/${selected}` : ''}`, { method: selected ? 'PATCH' : 'POST', headers: headers(), body: JSON.stringify(draft) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not save article.', 'تعذر حفظ المقال.'))
      setDraft(emptyDraft); setSelected(null); setNotice(L('Article saved.', 'تم حفظ المقال.')); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not save article.', 'تعذر حفظ المقال.')) }
    finally { setBusy(false) }
  }

  async function removeArticle(article: Article) {
    if (!window.confirm(L(`Delete “${article.title}”?`, `هل تريد حذف «${article.title}»؟`))) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/help-center/articles/${article.id}`, { method: 'DELETE', headers: headers() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not delete article.', 'تعذر حذف المقال.'))
      if (selected === article.id) newArticle()
      setNotice(L('Article deleted.', 'تم حذف المقال.')); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not delete article.', 'تعذر حذف المقال.')) }
    finally { setBusy(false) }
  }

  const publishedCount = articles.filter((article) => article.status === 'published').length
  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={L('Help Center', 'مركز المساعدة')} description={L('Publish customer-facing answers. These articles are separate from your private bot knowledge files.', 'انشر إجابات للعملاء. هذه المقالات منفصلة عن ملفات المعرفة الخاصة بالبوت.')} breadcrumbs={[{ label: L('Dashboard', 'لوحة التحكم'), href: '/dashboard' }, { label: L('Help Center', 'مركز المساعدة') }]} primaryAction={<Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>{L('Refresh', 'تحديث')}</Button>} />
    {businessId ? <Card><CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{L('Public Help Center', 'مركز المساعدة العام')}</p><p className="mt-1 truncate text-sm text-text-secondary">{typeof window === 'undefined' ? `/help/${businessId}` : `${window.location.origin}/help/${businessId}`}</p></div><Link className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-brand hover:underline" href={`/help/${businessId}`} target="_blank" rel="noopener noreferrer">{L('Open public page', 'فتح الصفحة العامة')}<ExternalLink size={15} /></Link></CardContent></Card> : <p className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{L('Select a business before managing Help Center content.', 'اختر نشاطًا تجاريًا قبل إدارة محتوى مركز المساعدة.')}</p>}
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}
    {notice && <p role="status" className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">{notice}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <section className="space-y-3" aria-labelledby="help-articles-heading"><div className="flex items-center justify-between gap-3"><div><h2 id="help-articles-heading" className="font-semibold text-text-primary">{L('Articles', 'المقالات')}</h2><p className="text-xs text-text-tertiary">{publishedCount} {L('published', 'منشور')} · {articles.length - publishedCount} {L('drafts', 'مسودات')}</p></div><Button variant="primary" size="sm" onClick={newArticle} disabled={busy || !businessId}><Plus size={15} /> {L('New article', 'مقال جديد')}</Button></div>
        {loading ? <Card><CardContent className="p-5 text-sm text-text-tertiary">{L('Loading articles…', 'جارٍ تحميل المقالات…')}</CardContent></Card> : articles.length === 0 ? <Card><CardContent className="p-5 text-sm text-text-tertiary">{L('No articles yet. Add approved customer-facing content to publish.', 'لا توجد مقالات بعد. أضف محتوى معتمدًا للعملاء لنشره.')}</CardContent></Card> : articles.map((article) => <Card key={article.id} className={`transition-colors ${selected === article.id ? 'border-brand/50 bg-brand/5' : 'hover:border-border-hover'}`}><CardContent className="flex items-start justify-between gap-3 p-4"><button type="button" className="min-w-0 flex-1 text-start" onClick={() => editArticle(article)}><p className="text-xs text-text-tertiary">{article.category} · {L(article.status, article.status === 'draft' ? 'مسودة' : 'منشور')}</p><h3 className="mt-1 font-medium text-text-primary">{article.title}</h3><p className="mt-1 truncate text-xs text-text-secondary">{article.excerpt || article.slug}</p></button><button type="button" disabled={busy} aria-label={L(`Delete ${article.title}`, `حذف ${article.title}`)} title={L('Delete article', 'حذف المقال')} className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50" onClick={() => void removeArticle(article)}><Trash2 size={15} /></button></CardContent></Card>)}
      </section>
      <Card><CardContent className="p-5 md:p-6"><h2 className="mb-1 flex items-center gap-2 font-semibold text-text-primary"><BookOpen size={17} /> {L(selected ? 'Edit article' : 'New article', selected ? 'تعديل المقال' : 'مقال جديد')}</h2><p className="mb-5 text-sm text-text-tertiary">{L('Only published articles are visible to customers.', 'المقالات المنشورة فقط تظهر للعملاء.')}</p>
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <label className="block space-y-1.5 text-sm font-medium text-text-secondary"><span>{L('Title', 'العنوان')}</span><input required maxLength={191} className={fieldClass} placeholder={L('Article title', 'عنوان المقال')} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1.5 text-sm font-medium text-text-secondary"><span>{L('URL slug', 'رابط المقال')}</span><input maxLength={191} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={fieldClass} placeholder="slug-like-this" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label><label className="block space-y-1.5 text-sm font-medium text-text-secondary"><span>{L('Category', 'التصنيف')}</span><input required maxLength={100} className={fieldClass} placeholder={L('General', 'عام')} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label></div>
          <label className="block space-y-1.5 text-sm font-medium text-text-secondary"><span>{L('Short description (optional)', 'وصف مختصر (اختياري)')}</span><textarea maxLength={500} className={`${fieldClass} min-h-20 resize-y`} placeholder={L('A brief summary for customers', 'ملخص قصير للعملاء')} value={draft.excerpt || ''} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} /></label>
          <label className="block space-y-1.5 text-sm font-medium text-text-secondary"><span>{L('Article content', 'محتوى المقال')}</span><textarea required maxLength={50000} className={`${fieldClass} min-h-64 resize-y`} placeholder={L('Write customer-facing article text…', 'اكتب محتوى المقال الموجّه للعملاء…')} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label>
          <p className="text-xs text-text-tertiary">{L('Plain text only. Internal knowledge files are never copied into the public Help Center.', 'نص عادي فقط. لا يتم نسخ ملفات المعرفة الداخلية إلى مركز المساعدة العام.')}</p>
          <div className="flex flex-wrap items-end justify-between gap-3"><Select dir={isRTL ? 'rtl' : 'ltr'} className="max-w-xs" label={L('Visibility', 'الظهور')} value={draft.status} options={[{ value: 'draft', label: L('Draft · private', 'مسودة · خاص') }, { value: 'published', label: L('Published · public', 'منشور · عام') }]} onValueChange={(value) => setDraft({ ...draft, status: value as Draft['status'] })} /><Button type="submit" disabled={busy || !businessId || !draft.title.trim() || !draft.content.trim()}><Save size={15} /> {busy ? L('Saving…', 'جارٍ الحفظ…') : L('Save article', 'حفظ المقال')}</Button></div>
        </form>
      </CardContent></Card>
    </div>
  </main>
}
