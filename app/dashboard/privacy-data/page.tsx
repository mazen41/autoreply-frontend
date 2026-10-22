'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, FileArchive, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'
import { Select } from '../../../components/ui/Select'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'
const fieldClass = 'w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/15'
type Retention = { message_retention_days: number; media_retention_days: number; consent_retention_days: number | null }
type Customer = { id: number; name: string; phone: string | null; email: string | null }
type RightsRequest = { id: number; type: string; status: string; receipt: Record<string, unknown> | null; archive_expires_at: string | null; created_at: string }

function token() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

export default function PrivacyDataPage() {
  const { isRTL } = useLang()
  const t = (english: string, arabic: string) => isRTL ? arabic : english
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [retention, setRetention] = useState<Retention>({ message_retention_days: 365, media_retention_days: 30, consent_retention_days: null })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [requests, setRequests] = useState<RightsRequest[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const headers = useCallback(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }), [])

  const load = useCallback(async (id: number, search = '') => {
    setLoading(true); setError('')
    try {
    const [retentionResponse, customerResponse, requestsResponse] = await Promise.all([
      fetch(`${API}/businesses/${id}/data-retention`, { headers: headers() }),
      fetch(`${API}/businesses/${id}/data-rights/customers?per_page=50&search=${encodeURIComponent(search)}`, { headers: headers() }),
      fetch(`${API}/businesses/${id}/data-rights-requests`, { headers: headers() }),
    ])
    if (!retentionResponse.ok || !customerResponse.ok || !requestsResponse.ok) throw new Error('Could not load privacy settings for this business.')
    setRetention(await retentionResponse.json())
    const customerPayload = await customerResponse.json()
    setCustomers(customerPayload.data || [])
    setRequests(await requestsResponse.json())
    } catch (cause) {
      throw cause
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => {
    const syncBusiness = () => {
      const id = getSelectedBusinessId()
      setSelectedCustomer('')
      setCustomers([])
      if (!id) { setBusinessId(null); setRequests([]); setLoading(false); setError('Select a business to manage its privacy settings.'); return }
      setBusinessId(id)
      load(id).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load privacy settings.'))
    }
    syncBusiness()
    window.addEventListener('naz:business-changed', syncBusiness)
    window.addEventListener('storage', syncBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', syncBusiness)
      window.removeEventListener('storage', syncBusiness)
    }
  }, [load])

  async function saveRetention() {
    if (!businessId) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API}/businesses/${businessId}/data-retention`, { method: 'PUT', headers: headers(), body: JSON.stringify(retention) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not save retention settings.')
      setRetention(body); setNotice('Retention settings saved. Scheduled cleanup applies them daily.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save retention settings.') }
    finally { setBusy(false) }
  }

  async function createExport() {
    if (!businessId) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API}/businesses/${businessId}/data-exports`, { method: 'POST', headers: headers(), body: '{}' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not start the export.')
      setNotice('Export request created. Refresh the request list to see when the archive is ready.')
      await load(businessId)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start the export.') }
    finally { setBusy(false) }
  }

  async function downloadExport(requestId: number) {
    if (!businessId) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API}/businesses/${businessId}/data-exports/${requestId}/download`, { headers: headers() })
      if (!response.ok) throw new Error('Archive is not ready or has expired.')
      const blob = await response.blob(); const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `customer-data-export-${requestId}.zip`; anchor.click(); URL.revokeObjectURL(url)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not download the archive.') }
    finally { setBusy(false) }
  }

  async function eraseCustomer() {
    if (!businessId || !selectedCustomer) return
    const customer = customers.find((item) => String(item.id) === selectedCustomer)
    if (!customer || !window.confirm(`Permanently delete ${customer.name || 'this customer'}'s conversations, messages, media, consents, notes, and customer profile? A suppression record will remain to prevent marketing re-import.`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API}/businesses/${businessId}/customers/${selectedCustomer}/data`, { method: 'DELETE', headers: headers(), body: JSON.stringify({ confirm: true }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Could not erase customer data.')
      setNotice(`Erasure completed. Receipt #${body.request.id} is saved below.`)
      setSelectedCustomer(''); await load(businessId)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not erase customer data.') }
    finally { setBusy(false) }
  }

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={t('Privacy & customer data', 'الخصوصية وبيانات العملاء')} description={t('Manage data retention, create a business data export, and fulfill customer erasure requests.', 'إدارة مدة الاحتفاظ بالبيانات وتصدير بيانات النشاط وتنفيذ طلبات حذف العملاء.')} />
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{error}</span>{businessId && <Button variant="outline" size="sm" onClick={() => void load(businessId, customerSearch)} disabled={loading}>{t('Retry', 'إعادة المحاولة')}</Button>}</div>}
    {notice && <p role="status" className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">{notice}</p>}

    <Card><CardContent className="space-y-5 p-5">
      <div className="flex items-center gap-3"><ShieldCheck className="text-brand" /><div><h2 className="font-semibold">{t('Retention settings', 'إعدادات الاحتفاظ')}</h2><p className="text-sm text-muted-foreground">{t('Messages default to 365 days. Media defaults to 30 days. Consent records are kept until you set a period.', 'الافتراضي للرسائل ٣٦٥ يومًا وللوسائط ٣٠ يومًا. تُحتفظ بسجلات الموافقة حتى تحدد مدة لها.')}</p></div></div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1.5 text-sm text-text-secondary">{t('Messages (days)', 'الرسائل (أيام)')}<input type="number" min="30" max="3650" className={fieldClass} value={retention.message_retention_days} onChange={(e) => setRetention({ ...retention, message_retention_days: Number(e.target.value) })} /></label>
        <label className="space-y-1.5 text-sm text-text-secondary">{t('Media (days)', 'الوسائط (أيام)')}<input type="number" min="1" max="3650" className={fieldClass} value={retention.media_retention_days} onChange={(e) => setRetention({ ...retention, media_retention_days: Number(e.target.value) })} /></label>
        <label className="space-y-1.5 text-sm text-text-secondary">{t('Consent records (days)', 'سجلات الموافقة (أيام)')}<input type="number" min="30" max="36500" placeholder={t('Keep indefinitely', 'احتفظ بها دون مدة انتهاء')} className={fieldClass} value={retention.consent_retention_days ?? ''} onChange={(e) => setRetention({ ...retention, consent_retention_days: e.target.value ? Number(e.target.value) : null })} /></label>
      </div>
      <Button onClick={saveRetention} disabled={busy}>{t('Save retention settings', 'حفظ إعدادات الاحتفاظ')}</Button>
    </CardContent></Card>

    <Card><CardContent className="space-y-4">
      <div className="flex items-center gap-3"><FileArchive className="text-brand" /><div><h2 className="font-semibold">{t('Export business customer data', 'تصدير بيانات عملاء النشاط')}</h2><p className="text-sm text-muted-foreground">{t('Creates a ZIP with customer profiles, conversations, messages, notes, consents, suppressions, and synced commerce orders. Download links expire after 7 days.', 'ينشئ ملف ZIP يتضمن ملفات العملاء والمحادثات والرسائل والملاحظات والموافقات وقيود التواصل والطلبات المتزامنة. تنتهي صلاحية التنزيل بعد ٧ أيام.')}</p></div></div>
      <Button onClick={createExport} disabled={busy}>{t('Request data export', 'طلب تصدير البيانات')}</Button>
    </CardContent></Card>

    <Card><CardContent className="space-y-4 p-5">
      <div className="flex items-center gap-3"><Trash2 className="text-error" /><div><h2 className="font-semibold">{t('Erase customer data', 'حذف بيانات العميل')}</h2><p className="text-sm text-muted-foreground">{t('Deletes the customer profile, notes, conversations, messages, media, and consent records. Synced order records remain with customer details anonymized; a suppression record remains.', 'يحذف ملف العميل والملاحظات والمحادثات والرسائل والوسائط وسجلات الموافقة. تبقى الطلبات المتزامنة بعد إزالة بيانات العميل الشخصية، ويُحتفظ بسجل منع التواصل.')}</p></div></div>
      <div className="flex flex-col gap-3 sm:flex-row"><input className={`${fieldClass} min-w-0 flex-1`} placeholder={t('Search name, email, or phone', 'ابحث بالاسم أو البريد أو الهاتف')} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} /><Button variant="outline" onClick={() => businessId && load(businessId, customerSearch)} disabled={busy || loading}>{t('Search customers', 'بحث عن العملاء')}</Button></div>
      <div className="flex flex-col gap-3 sm:flex-row"><Select dir={isRTL ? 'rtl' : 'ltr'} className="min-w-0 flex-1" label={t('Customer', 'العميل')} value={selectedCustomer} onValueChange={setSelectedCustomer} options={[{ value: '', label: t('Select a customer', 'اختر عميلًا') }, ...customers.map((customer) => ({ value: String(customer.id), label: `${customer.name || t('Unnamed', 'بدون اسم')}${customer.email ? ` · ${customer.email}` : ''}${customer.phone ? ` · ${customer.phone}` : ''}` }))]} /><Button variant="destructive" onClick={eraseCustomer} disabled={busy || !selectedCustomer}>{t('Erase data', 'حذف البيانات')}</Button></div>
    </CardContent></Card>

    <Card><CardContent className="space-y-4 p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{t('Data rights history', 'سجل طلبات البيانات')}</h2><Button variant="outline" onClick={() => businessId && load(businessId, customerSearch)} disabled={busy || loading}><RefreshCw size={15} /> {t('Refresh', 'تحديث')}</Button></div>
      {loading ? <p role="status" className="py-4 text-sm text-text-tertiary">{t('Loading privacy data…', 'جارٍ تحميل بيانات الخصوصية…')}</p> : requests.length === 0 ? <p className="text-sm text-muted-foreground">{t('No requests yet.', 'لا توجد طلبات بعد.')}</p> : <div className="divide-y">{requests.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><span className="font-medium capitalize">{item.type === 'erasure' ? t('Customer erasure', 'حذف عميل') : t('Data export', 'تصدير بيانات')}</span><span className="ms-2 text-muted-foreground">#{item.id} · {item.status} · {new Date(item.created_at).toLocaleString()}</span>{item.receipt && <pre className="mt-2 max-w-xl overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(item.receipt, null, 2)}</pre>}</div>{item.type === 'export' && item.status === 'completed' && item.archive_expires_at && new Date(item.archive_expires_at) > new Date() && <Button variant="outline" onClick={() => downloadExport(item.id)} disabled={busy}><Download size={15} /> {t('Download', 'تنزيل')}</Button>}</div>)}</div>}
    </CardContent></Card>
  </main>
}
