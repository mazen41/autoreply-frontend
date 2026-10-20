'use client'

import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
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
  const [error, setError] = useState('')

  const headers = useCallback(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }), [])
  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(`${API}${url}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) } })
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Could not update automation controls.')
    return response.json()
  }, [headers])

  const load = useCallback(async (id: number) => {
    setError('')
    const [control, campaignRows, emailRows, sequencePayload, workflowRows, rolloutPayload] = await Promise.all([
      request(`/businesses/${id}/automation-run-control`),
      request(`/businesses/${id}/campaigns`),
      request('/email-campaigns'),
      request('/sequences'),
      request('/workflows'),
      request(`/businesses/${id}/rollout-flags`),
    ])
    setPaused(Boolean(control.paused))
    setCampaigns(Array.isArray(campaignRows) ? campaignRows : [])
    setEmailCampaigns(emailRows.data || [])
    setSequences(sequencePayload.data || [])
    setWorkflows(Array.isArray(workflowRows) ? workflowRows : [])
    setRolloutFlags(rolloutPayload.flags || [])
  }, [request])

  useEffect(() => {
    const sync = () => {
      const id = getSelectedBusinessId()
      setBusinessId(id)
      if (!id) { setError('Select a business to manage automation runs.'); return }
      load(id).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load automation controls.'))
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
    return <Card><CardContent className="space-y-3 p-5"><h2 className="font-semibold">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">{t('Nothing configured.', 'لا توجد عناصر مهيأة.')}</p> : items.map((row) => {
        const itemPaused = kind === 'sequences' ? row.status === 'paused' : kind === 'workflows' ? row.is_active === false : Boolean(row.paused_at)
        const canToggle = canToggleItem(kind, row)
        const stateLabel = kind === 'campaigns' || kind === 'email-campaigns'
          ? campaignStateLabel(row.status, row.paused_at, t)
          : kind === 'sequences'
            ? (row.status === 'paused' ? t('Paused', 'متوقف مؤقتًا') : row.status === 'active' ? t('Active', 'نشط') : row.status || t('Status unavailable', 'الحالة غير متاحة'))
            : (row.is_active ? t('Active', 'نشط') : t('Paused', 'متوقف مؤقتًا'))
        return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{stateLabel}</p></div>
          {canToggle && <Button variant={itemPaused ? 'outline' : 'destructive'} disabled={busy} onClick={() => toggleItem(kind, row)}>{itemPaused ? t('Resume', 'استئناف') : t('Pause', 'إيقاف مؤقت')}</Button>}
        </div>
      })}
    </CardContent></Card>
  }

  return <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
    <PageHeader title={t('Automation run controls', 'التحكم في تشغيل الأتمتة')} description={t('Pause all queued campaigns, sequences, proactive sends, and workflows for this business, or manage each run separately.', 'أوقف مؤقتًا الحملات والتسلسلات والرسائل الاستباقية وسير العمل لهذا النشاط، أو تحكم في كل عنصر على حدة.')} />
    {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>}
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div><h2 className="font-semibold">{t('Business kill switch', 'إيقاف كل الأتمتة')}</h2><p className="text-sm text-muted-foreground">{paused ? t('Pending automated sends are paused and will continue after resume.', 'تم إيقاف الإرسالات الآلية مؤقتًا وستستأنف بعد إعادة التشغيل.') : t('Automated sends are enabled.', 'الإرسالات الآلية مفعلة.')}</p></div>
      <Button variant={paused ? 'outline' : 'destructive'} disabled={busy || !businessId} onClick={toggleBusiness}>{paused ? t('Resume all', 'استئناف الكل') : t('Pause all', 'إيقاف الكل')}</Button>
    </CardContent></Card>
    <Card><CardContent className="space-y-3 p-5">
      <div><h2 className="font-semibold">{t('Safety behavior', 'سلوكيات الأمان')}</h2><p className="text-sm text-muted-foreground">{t('Platform-wide safety settings are managed globally. Business-specific settings can be managed here when available.', 'تتم إدارة إعدادات الأمان العامة على مستوى المنصة. ويمكن إدارة إعدادات النشاط عند توفرها.')}</p></div>
      {rolloutFlags.length === 0 ? <p className="text-sm text-muted-foreground">{t('No rollout settings are available.', 'لا توجد إعدادات تفعيل متاحة.')}</p> : rolloutFlags.map((flag) => <div key={flag.key} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div><p className="font-medium">{flag.name}</p><p className="text-sm text-muted-foreground">{flag.description || flag.key}</p><p className="text-xs text-muted-foreground">{flag.global ? t('Enabled globally', 'مفعل على مستوى المنصة') : flag.enabled ? t('Enabled for this business', 'مفعل لهذا النشاط') : t('Off by default', 'متوقف افتراضيًا')}</p></div>
        {!flag.global && <Button variant={flag.enabled ? 'outline' : 'primary'} disabled={busy || !businessId} onClick={() => toggleRolloutFlag(flag)}>{flag.enabled ? t('Disable', 'تعطيل') : t('Enable', 'تفعيل')}</Button>}
      </div>)}
    </CardContent></Card>
    {rows(t('Messaging campaigns', 'الحملات'), 'campaigns', campaigns)}
    {rows(t('Email campaigns', 'حملات البريد الإلكتروني'), 'email-campaigns', emailCampaigns)}
    {rows(t('Sequences', 'التسلسلات'), 'sequences', sequences)}
    {rows(t('Workflows', 'سير العمل'), 'workflows', workflows)}
  </div>
}
