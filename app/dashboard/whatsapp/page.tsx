'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '../../../components/ui/PageHeader'
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  MessageCircle,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Channel {
  id: number
  type: string
  page_id: string
  page_name: string
  phone?: string | null
  status: string
  ai_enabled?: boolean
  effective_ai_enabled?: boolean
  ai_pause_reason?: string | null
  status_message?: string | null
  metadata?: Record<string, unknown>
}

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function metadataText(channel: Channel, key: string): string | null {
  const value = channel.metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function statusStyle(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (['connected', 'active', 'ready'].includes(status.toLowerCase())) return 'success'
  if (['warning', 'pending', 'connecting', 'qr_pending'].includes(status.toLowerCase())) return 'warning'
  if (['error', 'failed', 'disconnected'].includes(status.toLowerCase())) return 'error'
  return 'neutral'
}

export default function WhatsAppPage() {
  const { isRTL } = useLang()
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadChannels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const authToken = getToken()
      if (!authToken) throw new Error(isRTL ? 'انتهت جلستك. سجّل الدخول مجدداً.' : 'Your session expired. Sign in again.')
      if (!getSelectedBusinessId()) throw new Error(isRTL ? 'اختر نشاطاً تجارياً قبل إدارة واتساب.' : 'Select a business before managing WhatsApp.')
      const response = await fetch(`${API}/api/channels`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || (isRTL ? 'تعذر تحميل قنوات واتساب.' : 'Could not load WhatsApp channels.'))
      const rows: Channel[] = Array.isArray(data) ? data : (data.data || [])
      const whatsapp = rows.filter(channel => channel.type === 'whatsapp')
      setChannels(whatsapp)
      setSelectedChannelId(current => whatsapp.some(channel => String(channel.id) === current)
        ? current
        : String(whatsapp[0]?.id || ''))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isRTL ? 'تعذر تحميل قنوات واتساب.' : 'Could not load WhatsApp channels.'))
    } finally {
      setLoading(false)
    }
  }, [isRTL])

  useEffect(() => { void loadChannels() }, [loadChannels])

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return channels
    return channels.filter(channel => [
      channel.page_name,
      channel.page_id,
      channel.phone,
      metadataText(channel, 'display_phone_number'),
      metadataText(channel, 'phone_number'),
    ].some(value => value?.toLocaleLowerCase().includes(query)))
  }, [channels, search])

  const selectedChannel = channels.find(channel => String(channel.id) === selectedChannelId) || null
  const connectedCount = channels.filter(channel => ['connected', 'active', 'ready'].includes(channel.status.toLowerCase())).length
  const aiEnabledCount = channels.filter(channel => channel.effective_ai_enabled ?? channel.ai_enabled ?? false).length
  const attentionCount = channels.filter(channel => ['warning', 'error', 'failed', 'disconnected'].includes(channel.status.toLowerCase()) || Boolean(channel.ai_pause_reason)).length
  const connectHref = '/dashboard/channels?connect=true'

  return (
    <main className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isRTL ? 'واتساب للأعمال' : 'WhatsApp Business'}
        description={isRTL
          ? 'تابع أرقام واتساب المتصلة وحالة الردود الآلية لكل حساب.'
          : 'Review connected WhatsApp numbers and the reply readiness of each account.'}
        breadcrumbs={[{ label: 'NazBiz', href: '/dashboard' }, { label: isRTL ? 'واتساب' : 'WhatsApp' }]}
        primaryAction={(
          <Link href={connectHref}>
            <Button icon={<Plus size={15} />}>
              {isRTL ? 'ربط رقم واتساب' : 'Connect WhatsApp'}
            </Button>
          </Link>
        )}
        secondaryActions={(
          <Button variant="secondary" size="sm" onClick={() => void loadChannels()} loading={loading} icon={<RefreshCw size={14} />}>
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        )}
      />

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadChannels()}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={isRTL ? 'ملخص واتساب' : 'WhatsApp overview'}>
        <Card className="border-border bg-surface-card">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div><p className="text-xs font-medium text-text-secondary">{isRTL ? 'الأرقام المتصلة' : 'Connected numbers'}</p><p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{loading ? '—' : channels.length}</p></div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-success/20 bg-success/10 text-success"><Phone size={19} /></span>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-card">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div><p className="text-xs font-medium text-text-secondary">{isRTL ? 'الاتصال جاهز' : 'Connection ready'}</p><p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{loading ? '—' : connectedCount}</p></div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand"><Radio size={19} /></span>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-card sm:col-span-2 xl:col-span-1">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div><p className="text-xs font-medium text-text-secondary">{isRTL ? 'الردود الآلية النشطة' : 'AI replies active'}</p><p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{loading ? '—' : aiEnabledCount}</p><p className="mt-1 text-[11px] text-text-tertiary">{attentionCount > 0 ? (isRTL ? `${attentionCount} تحتاج إلى متابعة` : `${attentionCount} need attention`) : (isRTL ? 'لا توجد مشكلات ظاهرة' : 'No visible issues')}</p></div>
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${attentionCount > 0 ? 'border-warning/20 bg-warning/10 text-warning' : 'border-success/20 bg-success/10 text-success'}`}>{attentionCount > 0 ? <ShieldAlert size={19} /> : <Sparkles size={19} />}</span>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="min-w-0 border-border bg-surface-card">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>{isRTL ? 'حسابات واتساب' : 'WhatsApp accounts'}</CardTitle><CardDescription>{isRTL ? 'اختر حساباً لعرض معلومات الاتصال وحالة الردود.' : 'Select an account to inspect its connection and reply status.'}</CardDescription></div>
            <Badge variant="neutral" size="sm">{channels.length} {isRTL ? 'حساب' : channels.length === 1 ? 'account' : 'accounts'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ltr:left-3 rtl:right-3" />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                aria-label={isRTL ? 'البحث في أرقام واتساب' : 'Search WhatsApp accounts'}
                placeholder={isRTL ? 'ابحث بالاسم أو الرقم...' : 'Search by name or number...'}
                className="h-10 w-full rounded-xl border border-border bg-surface-elevated/50 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9"
              />
            </div>

            {loading ? (
              <div className="space-y-3" aria-live="polite">
                {[0, 1, 2].map(item => <div key={item} className="h-[76px] animate-pulse rounded-xl bg-surface-elevated/60" />)}
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-text-tertiary"><MessageCircle size={19} /></span>
                <p className="mt-3 text-sm font-semibold text-text-primary">{search ? (isRTL ? 'لا توجد نتائج' : 'No matching accounts') : (isRTL ? 'لا توجد أرقام واتساب متصلة' : 'No WhatsApp numbers connected')}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-text-secondary">{search ? (isRTL ? 'جرّب البحث باسم أو رقم مختلف.' : 'Try another name or phone number.') : (isRTL ? 'اربط حساباً من صفحة القنوات للبدء في استقبال المحادثات.' : 'Connect a number from Channels to start receiving conversations.')}</p>
                {!search && <Link href={connectHref} className="mt-4 inline-flex"><Button size="sm" icon={<Plus size={14} />}>{isRTL ? 'ربط واتساب' : 'Connect WhatsApp'}</Button></Link>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChannels.map(channel => {
                  const number = channel.phone || metadataText(channel, 'display_phone_number') || metadataText(channel, 'phone_number') || channel.page_id
                  const selected = selectedChannelId === String(channel.id)
                  const style = statusStyle(channel.status)
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setSelectedChannelId(String(channel.id))}
                      aria-pressed={selected}
                      className={`w-full rounded-xl border p-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${selected ? 'border-brand/40 bg-brand/5 shadow-sm' : 'border-border bg-surface-elevated/20 hover:border-border-hover hover:bg-surface-elevated/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/10 text-success"><Phone size={17} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-text-primary">{channel.page_name || number}</span>
                          <span dir="ltr" className="mt-0.5 block truncate text-start text-xs text-text-secondary">{number}</span>
                        </span>
                        <Badge variant={style} size="xs" dot>{channel.status}</Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-surface-card">
          <CardHeader>
            <CardTitle>{isRTL ? 'تفاصيل الحساب' : 'Account details'}</CardTitle>
            <CardDescription>{isRTL ? 'معلومات الحساب المحدد وحالة جاهزيته.' : 'Connection information and readiness for the selected account.'}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChannel ? (() => {
              const number = selectedChannel.phone || metadataText(selectedChannel, 'display_phone_number') || metadataText(selectedChannel, 'phone_number') || selectedChannel.page_id
              const effectiveAI = selectedChannel.effective_ai_enabled ?? selectedChannel.ai_enabled ?? false
              const riskAcknowledged = selectedChannel.metadata?.unofficial_risk_accepted
              return <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface-elevated/30 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-success/20 bg-success/10 text-success"><MessageCircle size={22} /></span>
                    <div className="min-w-0"><h3 className="truncate text-base font-semibold text-text-primary">{selectedChannel.page_name || (isRTL ? 'رقم واتساب' : 'WhatsApp number')}</h3><p dir="ltr" className="mt-1 text-start text-sm text-text-secondary">{number}</p></div>
                  </div>
                  <Badge variant={statusStyle(selectedChannel.status)} size="sm" dot>{selectedChannel.status}</Badge>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-3"><dt className="text-[11px] text-text-tertiary">{isRTL ? 'معرّف الحساب' : 'Account ID'}</dt><dd dir="ltr" className="mt-1 break-all text-start font-mono text-xs text-text-primary">{selectedChannel.page_id || selectedChannel.id}</dd></div>
                  <div className="rounded-xl border border-border p-3"><dt className="text-[11px] text-text-tertiary">{isRTL ? 'حالة الرد الآلي' : 'AI reply status'}</dt><dd className="mt-1 flex items-center gap-2 text-xs font-medium text-text-primary">{effectiveAI ? <CheckCircle2 size={14} className="text-success" /> : <AlertCircle size={14} className="text-warning" />}{effectiveAI ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'متوقف' : 'Paused')}</dd></div>
                  {metadataText(selectedChannel, 'provider') && <div className="rounded-xl border border-border p-3"><dt className="text-[11px] text-text-tertiary">{isRTL ? 'مزود الخدمة' : 'Provider'}</dt><dd className="mt-1 text-xs font-medium capitalize text-text-primary">{metadataText(selectedChannel, 'provider')}</dd></div>}
                  {metadataText(selectedChannel, 'phone_number_id') && <div className="rounded-xl border border-border p-3"><dt className="text-[11px] text-text-tertiary">{isRTL ? 'معرّف رقم الهاتف' : 'Phone number ID'}</dt><dd dir="ltr" className="mt-1 break-all text-start font-mono text-xs text-text-primary">{metadataText(selectedChannel, 'phone_number_id')}</dd></div>}
                </dl>

                {selectedChannel.ai_pause_reason && <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-warning"><AlertCircle size={15} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{isRTL ? 'الردود الآلية متوقفة مؤقتاً' : 'AI replies are paused'}</p><p className="mt-1">{selectedChannel.status_message || selectedChannel.ai_pause_reason.replaceAll('_', ' ')}</p><Link href="/dashboard/bots" className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2">{isRTL ? 'إدارة الوكلاء' : 'Manage agents'} <ArrowUpRight size={12} /></Link></div></div>}

                {riskAcknowledged === false && <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-warning"><ShieldAlert size={15} className="mt-0.5 shrink-0" /><p>{isRTL ? 'يلزم مراجعة إقرار مخاطر الاتصال لهذا الحساب من إعدادات القنوات.' : 'Review the connection risk acknowledgment for this account in Channels settings.'}</p></div>}

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Link href="/dashboard/channels"><Button variant="secondary" size="sm" icon={<ArrowUpRight size={14} />}>{isRTL ? 'إدارة الحساب' : 'Manage account'}</Button></Link>
                  <Link href="/dashboard/inbox"><Button variant="outline" size="sm" icon={<MessageCircle size={14} />}>{isRTL ? 'فتح صندوق الوارد' : 'Open inbox'}</Button></Link>
                </div>
              </div>
            })() : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-text-tertiary"><Phone size={19} /></span>
                <p className="mt-3 text-sm font-semibold text-text-primary">{isRTL ? 'اختر حساب واتساب' : 'Select a WhatsApp account'}</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-secondary">{isRTL ? 'ستظهر حالة الاتصال والردود الآلية هنا.' : 'Connection and reply status will appear here.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
