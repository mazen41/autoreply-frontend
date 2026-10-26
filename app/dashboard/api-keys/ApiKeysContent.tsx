'use client'

import React, { useState, useEffect } from 'react'
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Shield,
  Clock,
  Calendar,
  Code2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Checkbox from '../../../components/ui/Checkbox'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import EmptyState from '../../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

interface ApiKey {
  id: number
  business_id: number
  name: string
  key: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

const SCOPE_GROUPS = [
  {
    category: 'Conversations & Messaging',
    scopes: [
      { id: 'conversations:read', label: 'Read Conversations', desc: 'Query conversation threads and metadata' },
      { id: 'messages:read', label: 'Read Messages', desc: 'Access message history and attachments' },
      { id: 'messages:write', label: 'Send Messages', desc: 'Dispatch replies and initiate outbound chats' },
    ],
  },
]

export default function ApiKeysContent() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    scopes: ['conversations:read', 'messages:read'] as string[],
    expires_at: '',
  })

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

  useEffect(() => { void fetchApiKeys() }, [businessId])

  const fetchApiKeys = async () => {
    if (!businessId) { setApiKeys([]); setLoading(false); return }
    try {
      setLoading(true)
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error(L('Your session expired. Sign in again to load API keys.', 'انتهت جلستك. سجّل الدخول مجددًا لتحميل مفاتيح API.'))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(isRTL ? `تعذر تحميل مفاتيح API (HTTP ${res.status}).` : data?.message || `Could not load API keys (HTTP ${res.status}).`)
      const fetched = Array.isArray(data) ? data : (data.data || [])
      setApiKeys(fetched)
      setLoadError(null)
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : L('Could not load API keys.', 'تعذر تحميل مفاتيح API.'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error(L('Please assign an identifier name for the API key', 'أدخل اسمًا تعريفيًا لمفتاح API'))
      return
    }
    if (form.scopes.length === 0) {
      toast.error(L('Please enable at least one permission scope', 'فعّل نطاق صلاحية واحدًا على الأقل'))
      return
    }

    setLoadError(null)
    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error(L('Your session expired. Sign in again to create API keys.', 'انتهت جلستك. سجّل الدخول مجددًا لإنشاء مفاتيح API.'))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok && data.key) {
        setNewKey(data.key)
        setForm({ name: '', scopes: ['conversations:read'], expires_at: '' })
        void fetchApiKeys()
        toast.success(L('API Key generated successfully', 'تم إنشاء مفتاح API بنجاح'))
      } else {
        toast.error(isRTL ? 'تعذر إنشاء مفتاح API.' : data.error || data.message || 'Failed to create API key')
      }
    } catch {
      toast.error(L('Failed to create API key', 'تعذر إنشاء مفتاح API'))
    }
  }

  const handleRevoke = async (keyId: number) => {
    if (!confirm(L('Are you sure you want to permanently revoke this API key? External systems using it will immediately cease working.', 'هل تريد إلغاء مفتاح API نهائيًا؟ ستتوقف الأنظمة الخارجية التي تستخدمه عن العمل فورًا.'))) return

    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys/${keyId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
      if (!res.ok) throw new Error(L('Revoke request failed.', 'تعذر إلغاء المفتاح.'))
      setApiKeys(prev => prev.filter(k => k.id !== keyId))
      toast.success(L('API Key revoked', 'تم إلغاء مفتاح API'))
    } catch {
      toast.error(L('Failed to revoke API key', 'تعذر إلغاء مفتاح API'))
    }
  }

  const handleToggle = async (keyId: number, currentStatus: boolean) => {
    try {
      const token = decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/api-keys/${keyId}/toggle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
      if (!res.ok) throw new Error(L('Status update failed.', 'تعذر تحديث الحالة.'))
      setApiKeys(prev =>
        prev.map(k => (k.id === keyId ? { ...k, is_active: !currentStatus } : k))
      )
      toast.success(!currentStatus ? L('API Key activated', 'تم تفعيل مفتاح API') : L('API Key disabled', 'تم تعطيل مفتاح API'))
    } catch {
      toast.error(L('Failed to update API key status', 'تعذر تحديث حالة مفتاح API'))
    }
  }

  const copyToClipboard = async (text: string, id: number | string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success(L('Secret key copied to clipboard', 'تم نسخ المفتاح السري'))
      window.setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error(L('Could not copy the key. Select and copy it manually.', 'تعذر نسخ المفتاح. حدده وانسخه يدويًا.'))
    }
  }

  const toggleScope = (scopeId: string) => {
    setForm(prev => {
      const exists = prev.scopes.includes(scopeId)
      return {
        ...prev,
        scopes: exists ? prev.scopes.filter(s => s !== scopeId) : [...prev.scopes, scopeId],
      }
    })
  }

  const activeKeysCount = apiKeys.filter(k => k.is_active).length

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-xs text-text-tertiary">{L('Loading API credentials...', 'جارٍ تحميل بيانات اعتماد API...')}</span>
      </div>
    )
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader
        title={L('API Keys', 'مفاتيح API')}
        description={L('Provision programmatic authentication tokens to interface with NazBiz APIs, automated webhooks, and third-party CRM connectors.', 'أنشئ رموز مصادقة لاستخدام واجهات NazBiz وخطافات الويب الآلية وربط أنظمة إدارة العملاء الخارجية.')}
        badge={
          <Badge variant="outline" size="sm" className="font-mono">
            REST API v2
          </Badge>
        }
        primaryAction={
          <Button
            variant="primary"
            disabled={!businessId || loading}
            onClick={() => {
              setNewKey(null)
              setShowModal(true)
            }}
            icon={<Plus size={14} />}
          >
            {L('Create API Key', 'إنشاء مفتاح API')}
          </Button>
        }
      />

      {!businessId && <p role="status" className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{L('Select a business to manage its API keys.', 'اختر نشاطًا تجاريًا لإدارة مفاتيح API الخاصة به.')}</p>}

      {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => void fetchApiKeys()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={L('Provisioned Keys', 'المفاتيح المُنشأة')}
          value={apiKeys.length}
          subValue={`${activeKeysCount} ${L('active', 'نشط')}`}
          icon={<Key size={18} />}
        />
        <MetricCard
          label={L('Authentication Scheme', 'طريقة المصادقة')}
          value="Bearer Token"
          subValue="HTTP Authorization Header"
          icon={<Lock size={18} />}
        />
        <MetricCard label={L('Access model', 'نموذج الوصول')} value={L('Scoped', 'مقيّد بالصلاحيات')} subValue={L('Permissions assigned per key', 'صلاحيات محددة لكل مفتاح')} icon={<Shield size={18} />} />
      </div>

      {/* Keys Directory Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{L('Active Credentials', 'بيانات الاعتماد النشطة')}</CardTitle>
              <CardDescription>
                {L('Tokens should never be exposed in client-side code repositories or public web browsers.', 'لا تكشف الرموز في مستودعات الشيفرة الأمامية أو متصفحات الويب العامة.')}
              </CardDescription>
            </div>
            <a
              href="https://docs.nazbiz.com/api"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand hover:underline flex items-center gap-1 font-medium"
            >
              {L('Developer API Docs', 'وثائق API للمطورين')} <ExternalLink size={12} />
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadError ? <p className="px-5 py-8 text-center text-sm text-text-muted">{L('API key data is unavailable until the request succeeds.', 'بيانات مفاتيح API غير متاحة حتى ينجح الطلب.')}</p> : apiKeys.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Key}
                title={L('No API keys provisioned', 'لم يتم إنشاء مفاتيح API')}
                description={L('Generate your first secret key to integrate NazBiz omnichannel messages into external apps.', 'أنشئ أول مفتاح سري لربط رسائل NazBiz متعددة القنوات بالتطبيقات الخارجية.')}
                primaryAction={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setNewKey(null)
                      setShowModal(true)
                    }}
                  >
                    {L('Generate First Key', 'إنشاء أول مفتاح')}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {apiKeys.map((apiKey) => {
                return (
                  <div
                    key={apiKey.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-text-primary text-sm tracking-tight">
                          {apiKey.name}
                        </span>
                        <Badge variant={apiKey.is_active ? 'success' : 'outline'} dot size="sm">
                          {apiKey.is_active ? L('Active', 'نشط') : L('Disabled', 'معطّل')}
                        </Badge>
                      </div>

                      {/* Secret preview & copy */}
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-mono text-text-tertiary">••••••••••••••••••••</code>
                        <span className="text-[11px] text-text-tertiary">{L('Secret shown once when created', 'يُعرض المفتاح السري مرة واحدة عند إنشائه')}</span>
                      </div>

                      {/* Metadata Details */}
                      <div className="flex items-center gap-4 text-[11px] text-text-tertiary flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {L('Created', 'تاريخ الإنشاء')} {new Date(apiKey.created_at).toLocaleDateString(isRTL ? 'ar' : undefined)}
                        </span>
                        {apiKey.last_used_at ? (
                          <span className="flex items-center gap-1 text-success/90">
                            <Clock size={12} />
                            {L('Last used', 'آخر استخدام')} {new Date(apiKey.last_used_at).toLocaleTimeString(isRTL ? 'ar' : undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">{L('Never used', 'لم يُستخدم بعد')}</span>
                        )}
                        {apiKey.expires_at && (
                          <span className="text-warning/90 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {L('Expires', 'ينتهي')} {new Date(apiKey.expires_at).toLocaleDateString(isRTL ? 'ar' : undefined)}
                          </span>
                        )}
                      </div>

                      {/* Scopes Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {apiKey.scopes.map(s => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-elevated text-text-secondary border border-border/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <Button
                        variant={apiKey.is_active ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggle(apiKey.id, apiKey.is_active)}
                        icon={<Power size={13} />}
                      >
                        {apiKey.is_active ? L('Disable', 'تعطيل') : L('Enable', 'تفعيل')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(apiKey.id)}
                        className="text-text-tertiary hover:text-error hover:bg-error/10"
                        icon={<Trash2 size={14} />}
                      >
                        {L('Revoke', 'إلغاء')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setNewKey(null)
        }}
        title={newKey ? L('API Key Generated', 'تم إنشاء مفتاح API') : L('Create New API Key', 'إنشاء مفتاح API جديد')}
        size="lg"
      >
        {newKey ? (
          <div className="space-y-5 p-6">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-warning">
                <AlertTriangle size={14} /> {L('Please save this secret key immediately', 'احفظ هذا المفتاح السري الآن')}
              </div>
              <p>{L('For your security, we will never show you this token again. Store it securely in your environment variables.', 'لحمايتك، لن نعرض هذا الرمز مرة أخرى. احفظه بأمان ضمن متغيرات البيئة.')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">{L('Secret Token', 'الرمز السري')}</label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                <code className="flex-1 font-mono text-xs text-success px-2 break-all select-all">
                  {newKey}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(newKey, 'modal-key')}
                  icon={copiedId === 'modal-key' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                >
                  {copiedId === 'modal-key' ? L('Copied!', 'تم النسخ!') : L('Copy', 'نسخ')}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setShowModal(false)
                  setNewKey(null)
                }}
              >
                {L('I have saved my key', 'لقد حفظت المفتاح')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">{L('Key Identifier *', 'اسم المفتاح *')}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={L('e.g., Shopify Outbound Webhook or Mobile Backend', 'مثال: خطاف Shopify أو خادم تطبيق الهاتف')}
              />
              <span className="text-[11px] text-text-tertiary">{L('A human-readable label to identify where this credential is used.', 'اسم واضح يحدد مكان استخدام بيانات الاعتماد هذه.')}</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                <span>{L('Permission Scopes *', 'نطاقات الصلاحيات *')}</span>
                <span className="text-[11px] text-brand font-normal">{form.scopes.length} {L('selected', 'محدد')}</span>
              </label>

              <div className="space-y-4">
                {SCOPE_GROUPS.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                      {L(group.category, 'المحادثات والمراسلة')}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.scopes.map((s) => {
                        const isChecked = form.scopes.includes(s.id)
                        return (
                          <div
                            key={s.id}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              isChecked
                                ? 'bg-brand/10 border-brand/40 text-text-primary'
                                : 'bg-surface-elevated/40 border-border text-text-secondary hover:border-border-hover'
                            }`}
                          >
                            <div className="mb-1"><Checkbox checked={isChecked} onChange={() => toggleScope(s.id)} label={L(s.label, ({ 'Read Conversations': 'قراءة المحادثات', 'Read Messages': 'قراءة الرسائل', 'Send Messages': 'إرسال الرسائل' }[s.label] || s.label))} /></div>
                            <span className="text-[11px] text-text-tertiary block leading-snug">
                              {L(s.desc, ({ 'Query conversation threads and metadata': 'الاستعلام عن سلاسل المحادثات وبياناتها الوصفية', 'Access message history and attachments': 'الوصول إلى سجل الرسائل والمرفقات', 'Dispatch replies and initiate outbound chats': 'إرسال الردود وبدء المحادثات الصادرة' }[s.desc] || s.desc))}
                            </span>
                            <span className="font-mono text-[10px] text-text-tertiary/70 mt-1 block">
                              {s.id}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-text-primary">{L('Expiry Date (Optional)', 'تاريخ الانتهاء (اختياري)')}</label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
              <span className="text-[11px] text-text-tertiary">{L('Leave empty for a permanent production key with no expiration.', 'اتركه فارغًا لإنشاء مفتاح دائم بلا تاريخ انتهاء.')}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
              >
                {L('Cancel', 'إلغاء')}
              </Button>
                <Button
                variant="primary"
                onClick={handleCreate}
                  disabled={!businessId || loading}
                icon={<Code2 size={14} />}
              >
                {L('Generate Key', 'إنشاء مفتاح')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
