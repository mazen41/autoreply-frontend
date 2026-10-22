'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { CheckCircle2, Clipboard, Download, Rocket, Save } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type AttributionRow = { source: string; medium: string; campaign: string; sessions: number }
function headers() {
  const match = typeof document === 'undefined' ? null : document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return { Authorization: `Bearer ${match ? decodeURIComponent(match[1]) : ''}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }
}

export default function GrowthToolsPage() {
  const { isRTL } = useLang()
  const L = useCallback((en: string, ar: string) => isRTL ? ar : en, [isRTL])
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [domainsText, setDomainsText] = useState('')
  const [utmSource, setUtmSource] = useState('website')
  const [utmMedium, setUtmMedium] = useState('widget')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [qr, setQr] = useState('')
  const [attribution, setAttribution] = useState<AttributionRow[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [attributionError, setAttributionError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const baseUrl = useMemo(() => typeof window === 'undefined' || !businessId ? '' : `${window.location.origin}/chat/${businessId}?hosted=1`, [businessId])
  const attributedUrl = useMemo(() => {
    if (!baseUrl) return ''
    const url = new URL(baseUrl)
    if (utmSource) url.searchParams.set('utm_source', utmSource)
    if (utmMedium) url.searchParams.set('utm_medium', utmMedium)
    if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign)
    return url.toString()
  }, [baseUrl, utmSource, utmMedium, utmCampaign])
  const embedUrl = useMemo(() => { if (!attributedUrl) return ''; const url = new URL(attributedUrl); url.searchParams.delete('hosted'); url.searchParams.set('embed', '1'); return url.toString() }, [attributedUrl])
  const embedCode = `<iframe src="${embedUrl}" title="Customer support chat" width="380" height="620" loading="lazy" style="border:0;border-radius:16px" referrerpolicy="strict-origin-when-cross-origin"></iframe>`

  useEffect(() => {
    const syncBusiness = () => setBusinessId(getSelectedBusinessId())
    syncBusiness()
    window.addEventListener('naz:business-changed', syncBusiness)
    window.addEventListener('storage', syncBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', syncBusiness)
      window.removeEventListener('storage', syncBusiness)
    }
  }, [])

  const load = useCallback(async () => {
    if (!businessId) { setError(L('Select a business first.', 'اختر نشاطًا تجاريًا أولًا.')); setBusy(false); return }
    setBusy(true); setError('')
    try {
      const [response, attributionResponse] = await Promise.all([
        fetch(`${API}/web-chat/configuration`, { headers: headers() }),
        fetch(`${API}/web-chat/attribution?days=30`, { headers: headers() }),
      ])
      const body = await response.json().catch(() => ({}))
      const attributionBody = await attributionResponse.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not load website chat settings.', 'تعذر تحميل إعدادات دردشة الموقع.'))
      setEnabled(Boolean(body.enabled)); setDomainsText((body.allowed_domains || []).join('\n'))
      if (attributionResponse.ok) {
        setAttribution(attributionBody.sources || []); setTotalSessions(attributionBody.total_sessions || 0); setAttributionError('')
      } else {
        setAttribution([]); setTotalSessions(0); setAttributionError(attributionBody.message || L('Attribution data is temporarily unavailable.', 'بيانات الإحالة غير متاحة مؤقتًا.'))
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not load website chat settings.', 'تعذر تحميل إعدادات دردشة الموقع.')) }
    finally { setBusy(false) }
  }, [businessId, L])

  useEffect(() => { queueMicrotask(() => { void load() }) }, [load])
  useEffect(() => {
    if (!attributedUrl) return
    let cancelled = false
    void QRCode.toDataURL(attributedUrl, { width: 256, margin: 2, errorCorrectionLevel: 'M' }).then((dataUrl) => { if (!cancelled) setQr(dataUrl) }).catch(() => setQr(''))
    return () => { cancelled = true }
  }, [attributedUrl])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const domains = domainsText.split(/\r?\n/).map((domain) => domain.trim()).filter(Boolean)
      const response = await fetch(`${API}/web-chat/configuration`, { method: 'PUT', headers: headers(), body: JSON.stringify({ enabled, allowed_domains: domains }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || L('Could not save website chat settings.', 'تعذر حفظ إعدادات دردشة الموقع.'))
      setDomainsText((body.allowed_domains || []).join('\n')); setNotice(L('Website chat configuration saved.', 'تم حفظ إعدادات دردشة الموقع.'))
    } catch (cause) { setError(cause instanceof Error ? cause.message : L('Could not save website chat settings.', 'تعذر حفظ إعدادات دردشة الموقع.')) }
    finally { setSaving(false) }
  }

  async function copy(text: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(L('Copied to clipboard', 'تم النسخ'))
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(L('Clipboard access was denied. Copy the text manually.', 'تعذر الوصول إلى الحافظة. انسخ النص يدويًا.'))
    }
  }

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={L('Growth tools', 'أدوات النمو')} description={L('Set up website chat, shareable links, QR codes, and campaign attribution.', 'جهّز دردشة الموقع والروابط القابلة للمشاركة ورموز QR وقياس الحملات.')} breadcrumbs={[{ label: L('Dashboard', 'لوحة التحكم'), href: '/dashboard' }, { label: L('Growth tools', 'أدوات النمو') }]} primaryAction={<Button variant="secondary" size="sm" disabled={busy} onClick={() => void load()}>{L('Refresh', 'تحديث')}</Button>} />
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" disabled={busy} onClick={() => void load()}>{L('Retry', 'إعادة المحاولة')}</Button></div>}{notice && <p role="status" className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">{notice}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <Card><CardContent className="space-y-5"><div><h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-text-primary"><Rocket size={18} className="text-brand" /> {L('Website chat setup', 'إعداد دردشة الموقع')}</h2><p className="text-sm text-text-secondary">{L('Configure where your hosted chat and embedded widget can be used.', 'حدد الأماكن التي يمكن فيها استخدام الدردشة المستضافة والنافذة المضمنة.')}</p></div>
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4 text-sm"><input type="checkbox" className="mt-0.5 accent-[var(--brand)]" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span><span className="block font-medium text-text-primary">{L('Enable public website chat', 'تفعيل دردشة الموقع العامة')}</span><span className="mt-1 block text-xs text-text-tertiary">{L('Allow visitors to start a chat from your website.', 'السماح لزوار الموقع ببدء محادثة.')}</span></span></label>
          <label className="block text-xs font-semibold text-text-secondary">{L('Allowed website domains', 'نطاقات المواقع المسموح بها')} <span className="font-normal text-text-tertiary">{L('(one per line, e.g. example.com)', '(نطاق واحد في كل سطر، مثل example.com)')}</span><textarea aria-label={L('Allowed website domains', 'نطاقات المواقع المسموح بها')} required={enabled} className="mt-2 min-h-28 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand focus:ring-1 focus:ring-brand/30" placeholder={'example.com\nshop.example.com'} value={domainsText} onChange={(event) => setDomainsText(event.target.value)} /></label>
          <p className="text-xs text-text-tertiary">{L('Only listed domains and your hosted chat link can create visitor sessions. Add at least one domain before enabling the embedded widget.', 'يمكن بدء جلسات الزوار من النطاقات المدرجة ورابط الدردشة المستضاف فقط. أضف نطاقًا قبل تفعيل النافذة المضمنة.')}</p>
          <Button type="submit" disabled={saving || busy} loading={saving}><Save size={15} /> {L('Save setup', 'حفظ الإعدادات')}</Button>
        </form>
      </CardContent></Card>
      <Card><CardContent className="space-y-4"><div><h2 className="mb-1 text-base font-semibold text-text-primary">{L('Setup diagnostics', 'حالة الإعداد')}</h2><p className="text-sm text-text-secondary">{L('Check the key requirements at a glance.', 'تحقق من المتطلبات الأساسية بسرعة.')}</p></div><div className="space-y-2">{[
        [enabled, L('Public chat is enabled', 'الدردشة العامة مفعلة')],
        [domainsText.trim().length > 0, `${domainsText.split(/\r?\n/).filter((item) => item.trim()).length} ${L('allowed domain(s)', 'نطاق مسموح')}`],
        [Boolean(businessId), businessId ? `${L('Business context', 'النشاط المحدد')} #${businessId}` : L('No business selected', 'لم يتم اختيار نشاط')],
      ].map(([ok, label]) => <p key={String(label)} className="flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-2.5 text-sm"><CheckCircle2 size={16} className={ok ? 'text-success' : 'text-text-tertiary'} /><span className={ok ? 'text-text-primary' : 'text-text-secondary'}>{label}</span></p>)}</div></CardContent></Card>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardContent className="space-y-4"><div><h2 className="text-base font-semibold text-text-primary">{L('Shareable chat link and QR', 'رابط الدردشة ورمز QR')}</h2><p className="mt-1 text-sm text-text-secondary">{L('Use the hosted chat page in social bios, printed materials, or campaigns.', 'استخدم صفحة الدردشة المستضافة في حسابات التواصل أو المواد المطبوعة أو الحملات.')}</p></div>
        <label className="block text-xs font-semibold text-text-secondary">{L('Campaign source', 'مصدر الحملة')}<input className="mt-1.5 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" value={utmSource} onChange={(event) => setUtmSource(event.target.value)} /></label>
        <label className="block text-xs font-semibold text-text-secondary">{L('Campaign medium', 'وسيط الحملة')}<input className="mt-1.5 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" value={utmMedium} onChange={(event) => setUtmMedium(event.target.value)} /></label>
        <label className="block text-xs font-semibold text-text-secondary">{L('Campaign name', 'اسم الحملة')}<input className="mt-1.5 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" value={utmCampaign} onChange={(event) => setUtmCampaign(event.target.value)} placeholder="summer-launch" /></label>
        <div className="flex flex-col gap-2 sm:flex-row"><input readOnly className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary" value={attributedUrl} aria-label={L('Attributed chat link', 'رابط الدردشة مع بيانات الحملة')} /><Button variant="secondary" onClick={() => void copy(attributedUrl)} disabled={!attributedUrl}><Clipboard size={15} /> {copied ? L('Copied', 'تم النسخ') : L('Copy link', 'نسخ الرابط')}</Button></div>
        {qr && <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface-elevated p-4"><Image src={qr} alt={L('QR code for the attributed chat link', 'رمز QR لرابط الدردشة')} width={128} height={128} unoptimized /><a className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand/50 hover:text-brand" href={qr} download={`naz-chat-${businessId}.png`}><Download size={15} /> {L('Download QR', 'تنزيل رمز QR')}</a></div>}
      </CardContent></Card>
      <Card><CardContent className="space-y-4"><div><h2 className="text-base font-semibold text-text-primary">{L('Website embed', 'تضمين الدردشة بالموقع')}</h2><p className="mt-1 text-sm text-text-secondary">{L('Paste this iframe into your site. Visitor source and campaign values are saved with each chat session.', 'أضف كود iframe إلى موقعك. يُحفظ مصدر الزائر وبيانات الحملة مع جلسة الدردشة.')}</p></div><textarea readOnly aria-label={L('Website chat embed code', 'كود تضمين دردشة الموقع')} className="min-h-36 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none" value={embedCode} /><Button variant="secondary" onClick={() => void copy(embedCode)} disabled={!attributedUrl}><Clipboard size={15} /> {L('Copy embed code', 'نسخ كود التضمين')}</Button></CardContent></Card>
    </div>
    <Card><CardContent className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-text-primary">{L('Chat campaign attribution', 'إحالات حملات الدردشة')}</h2><p className="mt-1 text-sm text-text-secondary">{L('Visitor sessions grouped by UTM source, medium, and campaign over the last 30 days.', 'جلسات الزوار مجمعة حسب مصدر UTM ووسيطه والحملة خلال آخر ٣٠ يومًا.')}</p></div><span className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-sm font-semibold tabular-nums text-text-primary">{totalSessions.toLocaleString()} {L('sessions', 'جلسة')}</span></div>
      {attributionError && <p role="status" className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-text-secondary">{attributionError}</p>}
      {busy ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{L('Loading attribution…', 'جارٍ تحميل بيانات الإحالة…')}</p> : attribution.length === 0 ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{L('No visitor sessions yet. New sessions will appear here by campaign source.', 'لا توجد جلسات زوار بعد. ستظهر الجلسات الجديدة هنا حسب مصدر الحملة.')}</p> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[520px] text-start text-sm"><thead><tr className="border-b border-border bg-surface-elevated text-xs text-text-tertiary"><th scope="col" className="px-4 py-3 font-semibold">{L('Source', 'المصدر')}</th><th scope="col" className="px-4 py-3 font-semibold">{L('Medium', 'الوسيط')}</th><th scope="col" className="px-4 py-3 font-semibold">{L('Campaign', 'الحملة')}</th><th scope="col" className="px-4 py-3 text-end font-semibold">{L('Sessions', 'الجلسات')}</th></tr></thead><tbody>{attribution.map((row, index) => <tr key={`${row.source}-${row.medium}-${row.campaign}-${index}`} className="border-b border-border/60 last:border-0 hover:bg-surface-elevated/50"><td className="px-4 py-3 text-text-primary">{row.source || '—'}</td><td className="px-4 py-3 text-text-secondary">{row.medium || '—'}</td><td className="px-4 py-3 text-text-secondary">{row.campaign || '—'}</td><td className="px-4 py-3 text-end font-medium tabular-nums text-text-primary">{row.sessions.toLocaleString()}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </main>
}
