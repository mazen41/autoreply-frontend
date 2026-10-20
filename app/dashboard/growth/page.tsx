'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { CheckCircle2, Clipboard, Download, Rocket, Save } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`
type AttributionRow = { source: string; medium: string; campaign: string; sessions: number }
function headers() {
  const match = typeof document === 'undefined' ? null : document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return { Authorization: `Bearer ${match ? decodeURIComponent(match[1]) : ''}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }
}

export default function GrowthToolsPage() {
  const businessId = getSelectedBusinessId()
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

  const load = useCallback(async () => {
    if (!businessId) { setError('Select a business first.'); setBusy(false); return }
    setBusy(true); setError('')
    try {
      const [response, attributionResponse] = await Promise.all([
        fetch(`${API}/web-chat/configuration`, { headers: headers() }),
        fetch(`${API}/web-chat/attribution?days=30`, { headers: headers() }),
      ])
      const body = await response.json().catch(() => ({}))
      const attributionBody = await attributionResponse.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not load website chat settings.')
      if (!attributionResponse.ok) throw new Error(attributionBody.message || 'Could not load campaign attribution.')
      setEnabled(Boolean(body.enabled)); setDomainsText((body.allowed_domains || []).join('\n'))
      setAttribution(attributionBody.sources || []); setTotalSessions(attributionBody.total_sessions || 0)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load website chat settings.') }
    finally { setBusy(false) }
  }, [businessId])

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
      if (!response.ok) throw new Error(body.message || 'Could not save website chat settings.')
      setDomainsText((body.allowed_domains || []).join('\n')); setNotice('Website chat configuration saved.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save website chat settings.') }
    finally { setSaving(false) }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  return <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
    <PageHeader title="Growth tools" description="Set up website chat, shareable chat links, QR codes, and campaign attribution." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Growth tools' }]} />
    {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>}{notice && <p role="status" className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">{notice}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <Card><CardContent><h2 className="mb-4 flex items-center gap-2 font-semibold"><Rocket size={18} /> Website chat setup</h2>
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Enable public website chat</label>
          <label className="block text-sm font-medium">Allowed website domains <span className="font-normal text-text-muted">(one per line, such as example.com)</span><textarea aria-label="Allowed website domains" required={enabled} className="mt-2 min-h-28 w-full rounded-md border bg-surface px-3 py-2 font-mono text-sm" placeholder="example.com\nshop.example.com" value={domainsText} onChange={(event) => setDomainsText(event.target.value)} /></label>
          <p className="text-xs text-text-muted">Only listed domains and the hosted chat link can create visitor sessions. Add a domain before enabling the widget.</p>
          <Button type="submit" disabled={saving || busy}><Save size={15} /> Save setup</Button>
        </form>
      </CardContent></Card>
      <Card><CardContent><h2 className="mb-3 font-semibold">Setup diagnostics</h2><div className="space-y-2 text-sm"><p className="flex items-center gap-2"><CheckCircle2 size={16} className={enabled ? 'text-success' : 'text-text-muted'} /> Chat {enabled ? 'enabled' : 'disabled'}</p><p className="flex items-center gap-2"><CheckCircle2 size={16} className={domainsText.trim() ? 'text-success' : 'text-text-muted'} /> {domainsText.split(/\r?\n/).filter((item) => item.trim()).length} allowed domain(s)</p><p className="flex items-center gap-2"><CheckCircle2 size={16} className={businessId ? 'text-success' : 'text-text-muted'} /> Business context {businessId ? `#${businessId}` : 'not selected'}</p></div></CardContent></Card>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardContent><h2 className="font-semibold">Shareable chat link and QR</h2><p className="mt-1 text-sm text-text-muted">Use the hosted chat page in social bios, printed materials, or campaigns.</p>
        <label className="mt-4 block text-xs text-text-secondary">Campaign source<input className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm" value={utmSource} onChange={(event) => setUtmSource(event.target.value)} /></label>
        <label className="mt-3 block text-xs text-text-secondary">Campaign medium<input className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm" value={utmMedium} onChange={(event) => setUtmMedium(event.target.value)} /></label>
        <label className="mt-3 block text-xs text-text-secondary">Campaign name<input className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm" value={utmCampaign} onChange={(event) => setUtmCampaign(event.target.value)} placeholder="summer-launch" /></label>
        <div className="mt-3 flex gap-2"><input readOnly className="min-w-0 flex-1 rounded-md border bg-surface px-3 py-2 text-sm" value={attributedUrl} aria-label="Attributed chat link" /><Button variant="outline" onClick={() => void copy(attributedUrl)} disabled={!attributedUrl}><Clipboard size={15} /> {copied ? 'Copied' : 'Copy'}</Button></div>
        {qr && <div className="mt-4 flex items-center gap-3"><Image src={qr} alt="QR code for the attributed chat link" width={128} height={128} unoptimized /><a className="inline-flex items-center gap-2 text-sm text-brand hover:underline" href={qr} download={`naz-chat-${businessId}.png`}><Download size={15} /> Download QR</a></div>}
      </CardContent></Card>
      <Card><CardContent><h2 className="font-semibold">Website embed</h2><p className="mt-1 text-sm text-text-muted">Paste this iframe into your site. Visitor source and UTM campaign values are stored with the chat session.</p><textarea readOnly aria-label="Website chat embed code" className="mt-4 min-h-36 w-full rounded-md border bg-surface px-3 py-2 font-mono text-xs" value={embedCode} /><Button className="mt-3" variant="outline" onClick={() => void copy(embedCode)} disabled={!attributedUrl}><Clipboard size={15} /> Copy embed code</Button></CardContent></Card>
    </div>
    <Card><CardContent><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold">Chat campaign attribution</h2><p className="text-xs text-text-muted">Visitor sessions grouped by UTM source, medium, and campaign over the last 30 days.</p></div><span className="rounded-full bg-surface-elevated px-3 py-1 text-sm">{totalSessions} sessions</span></div>
      {attribution.length === 0 ? <p className="text-sm text-text-muted">No visitor sessions yet. New sessions will appear here by campaign source.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-text-muted"><th className="py-2 pr-4">Source</th><th className="py-2 pr-4">Medium</th><th className="py-2 pr-4">Campaign</th><th className="py-2 text-right">Sessions</th></tr></thead><tbody>{attribution.map((row, index) => <tr key={`${row.source}-${row.medium}-${row.campaign}-${index}`} className="border-b border-border/60"><td className="py-2 pr-4">{row.source}</td><td className="py-2 pr-4">{row.medium}</td><td className="py-2 pr-4">{row.campaign}</td><td className="py-2 text-right">{row.sessions}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>
}
