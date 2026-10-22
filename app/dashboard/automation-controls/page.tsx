'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { RefreshCw } from 'lucide-react'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'
type Row = { id: number; name: string; status?: string; is_active?: boolean; paused_at?: string | null }
type RolloutFlag = { key: string; name: string; description: string | null; enabled: boolean; global: boolean }

const TERMINAL_CAMPAIGN_STATUSES = new Set(['sent', 'dispatched', 'completed', 'failed', 'partially_sent', 'partially_failed', 'cancelled'])

function campaignStateLabel(status: string | undefined, pausedAt: string | null | undefined, t: (en: string, ar: string) => string) {
  const labels: Record<string, [string, string]> = {
    sent: ['Sent', 'تم الإرسال'], dispatched: ['Dispatched', 'تم الإرسال'], completed: ['Completed', 'مكتمل'],
    failed: ['Failed', 'فشل'], partially_sent: ['Partially sent', 'تم الإرسال جزئيًا'],
    partially_failed: ['Partially failed', 'فشل جزئيًا'], cancelled: ['Cancelled', 'ملغي'],
    draft: ['Draft', 'مسودة'], scheduled: ['Scheduled', 'مجدول'], sending: ['Sending', 'قيد الإرسال'],
    active: ['Active', 'نشط'],
  }
  if (status && TERMINAL_CAMPAIGN_STATUSES.has(status)) {
    const [en, ar] = labels[status] || [status, status]
    return t(en, ar)
  }
  if (pausedAt) return t('Paused', 'متوقف مؤقتًا')
  const [en, ar] = labels[status || ''] || ['Status unavailable', 'الحالة غير متاحة']
  return t(en, ar)
}

function token() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

export default function AutomationControlsPage() {
  const { isRTL } = useLang()
  const t = (en: string, ar: string) => isRTL ? ar : en
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [campaigns, setCampaigns] = useState<Row[]>([])
  const [emailCampaigns, setEmailCampaigns] = useState<Row[]>([])
  const [sequences, setSequences] = useState<Row[]>([])
  const [workflows, setWorkflows] = useState<Row[]>([])
  const [rolloutFlags, setRolloutFlags] = useState<RolloutFlag[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadGeneration = useRef(0)
  const lastBusinessId = useRef<number | null>(null)

  const headers = useCallback(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }), [])
  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(`${API}${url}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) } })
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Could not update automation controls.')
    return response.json()
  }, [headers])

  const load = useCallback(async (id: number, clearExisting = false) => {
    const generation = ++loadGeneration.current
    setError('')
    if (clearExisting) {
      setPaused(false)
      setCampaigns([])
      setEmailCampaigns([])
      setSequences([])
      setWorkflows([])
      setRolloutFlags([])
    }
    setLoading(true)
    try {
      const [control, campaignRows, emailRows, sequencePayload, workflowRows, rolloutPayload] = await Promise.all([
        request(`/businesses/${id}/automation-run-control`),
        request(`/businesses/${id}/campaigns`),
        request('/email-campaigns'),
        request('/sequences'),
        request('/workflows'),
        request(`/businesses/${id}/rollout-flags`),
      ])
      if (generation !== loadGeneration.current) return
      setPaused(Boolean(control.paused))
      setCampaigns(Array.isArray(campaignRows) ? campaignRows : [])
      setEmailCampaigns(emailRows.data || [])
      setSequences(sequencePayload.data || [])
      setWorkflows(Array.isArray(workflowRows) ? workflowRows : [])
      setRolloutFlags(rolloutPayload.flags || [])
    } catch (cause) {
      if (generation === loadGeneration.current) {
        setError(cause instanceof Error ? cause.message : 'Could not load automation controls.')
      }
    } finally {
      if (generation === loadGeneration.current) setLoading(false)
    }
  }, [request])

  useEffect(() => {
    const sync = () => {
      const id = getSelectedBusinessId()
      const businessChanged = lastBusinessId.current !== id
      lastBusinessId.current = id
      setBusinessId(id)
      if (!id) {
        loadGeneration.current += 1
        setPaused(false)
        setCampaigns([])
        setEmailCampaigns([])
        setSequences([])
        setWorkflows([])
        setRolloutFlags([])
        setLoading(false)
        setError('Select a business to manage automation runs.')
        return
      }
      void load(id, businessChanged)
    }
    sync()
    window.addEventListener('naz:business-changed', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('naz:business-changed', sync); window.removeEventListener('storage', sync) }
  }, [load])

  async function toggleBusiness() {
    if (!businessId) return
    setBusy(true); setError('')
    try {
      const result = await request(`/businesses/${businessId}/automation-run-control`, { method: 'PUT', body: JSON.stringify({ paused: !paused }) })
      setPaused(Boolean(result.paused))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update automation controls.') }
    finally { setBusy(false) }
  }

  async function toggleItem(kind: 'campaigns' | 'email-campaigns' | 'sequences' | 'workflows', row: Row) {
    if (!businessId || !canToggleItem(kind, row)) return
    setBusy(true); setError('')
    try {
      if (kind === 'campaigns') await request(`/businesses/${businessId}/campaigns/${row.id}/${row.paused_at ? 'resume' : 'pause'}`, { method: 'POST', body: '{}' })
      if (kind === 'email-campaigns') await request(`/email-campaigns/${row.id}/${row.paused_at ? 'resume' : 'pause'}`, { method: 'POST', body: '{}' })
      if (kind === 'sequences') await request(`/sequences/${row.id}/${row.status === 'paused' ? 'activate' : 'pause'}`, { method: 'POST', body: '{}' })
      if (kind === 'workflows') await request(`/workflows/${row.id}/toggle`, { method: 'POST', body: '{}' })
      await load(businessId)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update automation controls.') }
    finally { setBusy(false) }
  }

  function canToggleItem(kind: 'campaigns' | 'email-campaigns' | 'sequences' | 'workflows', row: Row) {
    if (kind === 'campaigns' || kind === 'email-campaigns') {
      return !TERMINAL_CAMPAIGN_STATUSES.has(row.status || '')
        && (row.status === 'sending' || row.status === 'scheduled' || Boolean(row.paused_at))
    }
    if (kind === 'sequences') return row.status === 'active' || row.status === 'paused'
    return typeof row.is_active === 'boolean'
  }

  async function toggleRolloutFlag(flag: RolloutFlag) {
    if (!businessId) return
    setBusy(true); setError('')
    try {
      await request(`/businesses/${businessId}/rollout-flags/${encodeURIComponent(flag.key)}`, {
        method: 'PUT', body: JSON.stringify({ enabled: !flag.enabled }),
      })
      await load(businessId)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update rollout setting.') }
    finally { setBusy(false) }
  }

  function rows(title: string, kind: 'campaigns' | 'email-campaigns' | 'sequences' | 'workflows', items: Row[]) {
    return <Card className="overflow-hidden"><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-text-primary">{title}</h2><Badge variant="outline" size="sm">{items.length}</Badge></div>
      {loading ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{t('Loading…', 'جارٍ التحميل…')}</p> : items.length === 0 && error ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{t('Could not load automation data.', 'تعذر تحميل بيانات الأتمتة.')}</p> : items.length === 0 ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{t('Nothing configured yet.', 'لا توجد عناصر مهيأة بعد.')}</p> : items.map((row) => {
        const itemPaused = kind === 'sequences' ? row.status === 'paused' : kind === 'workflows' ? row.is_active === false : Boolean(row.paused_at)
        const canToggle = canToggleItem(kind, row)
        const stateLabel = kind === 'campaigns' || kind === 'email-campaigns'
          ? campaignStateLabel(row.status, row.paused_at, t)
          : kind === 'sequences'
            ? (row.status === 'paused' ? t('Paused', 'متوقف مؤقتًا') : row.status === 'active' ? t('Active', 'نشط') : row.status || t('Status unavailable', 'الحالة غير متاحة'))
            : (row.is_active ? t('Active', 'نشط') : t('Paused', 'متوقف مؤقتًا'))
        return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
          <div className="min-w-0"><p className="truncate text-sm font-medium text-text-primary">{row.name}</p><p className="mt-1 text-xs text-text-tertiary">{stateLabel}</p></div>
          {canToggle && <Button variant={itemPaused ? 'outline' : 'destructive'} disabled={busy || loading || Boolean(error)} onClick={() => toggleItem(kind, row)}>{itemPaused ? t('Resume', 'استئناف') : t('Pause', 'إيقاف مؤقت')}</Button>}
        </div>
      })}
    </CardContent></Card>
  }

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={t('Automation run controls', 'التحكم في تشغيل الأتمتة')} description={t('Pause all queued campaigns, sequences, proactive sends, and workflows for this business, or manage each run separately.', 'أوقف مؤقتًا الحملات والتسلسلات والرسائل الاستباقية وسير العمل لهذا النشاط، أو تحكم في كل عنصر على حدة.')} primaryAction={<Button variant="secondary" size="sm" disabled={loading || busy || !businessId} onClick={() => businessId && void load(businessId)} icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>{t('Refresh status', 'تحديث الحالة')}</Button>} />
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" disabled={loading || !businessId} onClick={() => businessId && void load(businessId)}>{t('Retry', 'إعادة المحاولة')}</Button></div>}
    <Card className={`overflow-hidden border ${paused ? 'border-warning/40 bg-warning/5' : 'border-success/20'}`}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
      <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-text-primary">{t('Business-wide automation', 'الأتمتة على مستوى النشاط')}</h2><Badge variant={paused ? 'warning' : 'success'} dot>{paused ? t('Paused', 'متوقفة مؤقتًا') : t('Running', 'تعمل')}</Badge></div><p className="max-w-2xl text-sm text-text-secondary">{paused ? t('Pending automated sends are paused and will continue after you resume them.', 'الإرسالات الآلية المعلقة متوقفة مؤقتًا وستستأنف عند إعادة تشغيلها.') : t('Automated sends are enabled for this business.', 'الإرسالات الآلية مفعلة لهذا النشاط.')}</p></div>
      <Button variant={paused ? 'outline' : 'destructive'} disabled={busy || loading || Boolean(error) || !businessId} onClick={toggleBusiness}>{paused ? t('Resume all', 'استئناف الكل') : t('Pause all', 'إيقاف الكل')}</Button>
    </CardContent></Card>
    <Card className="overflow-hidden"><CardContent className="space-y-4 p-5 md:p-6">
      <div><h2 className="text-sm font-semibold text-text-primary">{t('Safety behavior', 'سلوكيات الأمان')}</h2><p className="mt-1 text-sm text-text-secondary">{t('Platform-wide safety settings are managed globally. Business-specific settings can be managed here when available.', 'تتم إدارة إعدادات الأمان العامة على مستوى المنصة. ويمكن إدارة إعدادات النشاط عند توفرها.')}</p></div>
      {loading ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{t('Loading settings…', 'جارٍ تحميل الإعدادات…')}</p> : rolloutFlags.length === 0 && error ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{t('Could not load safety settings.', 'تعذر تحميل إعدادات الأمان.')}</p> : rolloutFlags.length === 0 ? <p className="rounded-xl bg-surface-elevated p-4 text-sm text-text-tertiary">{t('No rollout settings are available.', 'لا توجد إعدادات تفعيل متاحة.')}</p> : rolloutFlags.map((flag) => <div key={flag.key} className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="min-w-0"><p className="text-sm font-medium text-text-primary">{flag.name}</p><p className="mt-1 text-sm text-text-secondary">{flag.description || flag.key}</p><p className="mt-1 text-xs text-text-tertiary">{flag.global ? t('Enabled globally', 'مفعل على مستوى المنصة') : flag.enabled ? t('Enabled for this business', 'مفعل لهذا النشاط') : t('Off by default', 'متوقف افتراضيًا')}</p></div>
        {!flag.global && <Button variant={flag.enabled ? 'outline' : 'primary'} disabled={busy || loading || Boolean(error) || !businessId} onClick={() => toggleRolloutFlag(flag)}>{flag.enabled ? t('Disable', 'تعطيل') : t('Enable', 'تفعيل')}</Button>}
      </div>)}
    </CardContent></Card>
    <div className="grid gap-4 xl:grid-cols-2">
      {rows(t('Messaging campaigns', 'الحملات'), 'campaigns', campaigns)}
      {rows(t('Email campaigns', 'حملات البريد الإلكتروني'), 'email-campaigns', emailCampaigns)}
      {rows(t('Sequences', 'التسلسلات'), 'sequences', sequences)}
      {rows(t('Workflows', 'سير العمل'), 'workflows', workflows)}
    </div>
  </main>
}
