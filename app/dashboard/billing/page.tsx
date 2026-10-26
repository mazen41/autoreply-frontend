'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Calendar, CreditCard, Zap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import toast from 'react-hot-toast'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

type Plan = { id?: number; name: string; price_monthly?: number; price_yearly?: number; ai_replies_limit?: number; outbound_messages_limit?: number; channels_limit?: number; features?: string[] }
type Subscription = { id: number; status: string; billing_cycle?: string; amount_paid?: number; starts_at?: string; ends_at?: string | null; cancelled_at?: string | null; auto_renew_enabled?: boolean; package?: Plan }
type SubscriptionResponse = { subscription?: Subscription | null; package?: Plan | null; is_free?: boolean }
type UsageMetric = { used: number; limit: number; remaining: number | null; unlimited: boolean; percentage: number | null; allowed: boolean }
type UsageResponse = { business_id: number; period: { starts_at: string; ends_at: string }; usage: { ai_replies: UsageMetric; outbound_messages: UsageMetric; channels: UsageMetric } }

export default function BillingPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [data, setData] = useState<SubscriptionResponse | null>(null)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [disablingRenewal, setDisablingRenewal] = useState(false)

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again to view billing.', 'انتهت جلستك. سجّل الدخول مجددًا لعرض الفوترة.'))
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() }
      const [response, usageResponse] = await Promise.all([
        fetch(`${API}/api/subscriptions/current`, { headers }),
        fetch(`${API}/api/billing/usage`, { headers }),
      ])
      const [result, usageResult] = await Promise.all([response.json(), usageResponse.json()])
      if (!response.ok) throw new Error(isRTL ? `تعذر تحميل الاشتراك (HTTP ${response.status}).` : result.message || `Could not load subscription (HTTP ${response.status}).`)
      if (!usageResponse.ok) throw new Error(isRTL ? `تعذر تحميل الاستخدام (HTTP ${usageResponse.status}).` : usageResult.message || `Could not load usage (HTTP ${usageResponse.status}).`)
      setData(result)
      setUsage(usageResult)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L('Could not load billing information.', 'تعذر تحميل معلومات الفوترة.'))
      setData(null)
    } finally { setLoading(false) }
  }, [isRTL])

  useEffect(() => {
    void fetchSubscription()
    const refreshForBusiness = () => { void fetchSubscription() }
    window.addEventListener('naz:business-changed', refreshForBusiness)
    window.addEventListener('storage', refreshForBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', refreshForBusiness)
      window.removeEventListener('storage', refreshForBusiness)
    }
  }, [fetchSubscription])

  const handleCancel = async () => {
    if (!confirm(L('Cancel this subscription?', 'هل تريد إلغاء هذا الاشتراك؟'))) return
    setCancelling(true)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const response = await fetch(`${API}/api/subscriptions`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(isRTL ? 'تعذر إلغاء الاشتراك.' : result.message || 'Subscription cancellation failed.')
      toast.success(isRTL ? 'تم إرسال طلب إلغاء الاشتراك.' : result.message || 'Subscription cancellation requested.')
      await fetchSubscription()
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : L('Could not cancel subscription.', 'تعذر إلغاء الاشتراك.')) }
    finally { setCancelling(false) }
  }

  const handleDisableAutoRenew = async () => {
    if (!confirm(L('Turn off automatic renewal? Your current plan stays active until its end date.', 'هل تريد إيقاف التجديد التلقائي؟ ستظل باقتك الحالية فعالة حتى تاريخ انتهائها.'))) return
    setDisablingRenewal(true)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const response = await fetch(`${API}/api/subscriptions/auto-renew/disable`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(isRTL ? 'تعذر إيقاف التجديد التلقائي.' : result.message || 'Could not turn off automatic renewal.')
      toast.success(isRTL ? 'تم إيقاف التجديد التلقائي.' : result.message)
      await fetchSubscription()
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : L('Could not turn off automatic renewal.', 'تعذر إيقاف التجديد التلقائي.')) }
    finally { setDisablingRenewal(false) }
  }

  const plan = data?.subscription?.package || data?.package || null
  const subscription = data?.subscription || null
  const endDate = subscription?.ends_at ? new Date(subscription.ends_at) : null

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={L('Plans & Billing', 'الباقات والفوترة')} description={L('View your current subscription and plan limits.', 'اطّلع على اشتراكك الحالي وحدود باقتك.')} primaryAction={<Link href="/pricing"><Button variant="primary" icon={<ArrowUpRight size={14} />}>{L('View plans', 'عرض الباقات')}</Button></Link>} />
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchSubscription()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}
    {loading ? <div className="py-16 text-center text-sm text-text-muted" role="status">{L('Loading subscription…', 'جارٍ تحميل الاشتراك…')}</div> : plan ? <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={L('Current plan', 'الباقة الحالية')} value={plan.name} subValue={subscription?.billing_cycle || (data?.is_free ? L('Free plan', 'باقة مجانية') : L('Plan', 'باقة'))} icon={<Zap size={18} />} />
        <MetricCard label={L('Plan price', 'سعر الباقة')} value={data?.is_free ? L('Free', 'مجاني') : `${subscription?.amount_paid ?? plan.price_monthly ?? '—'}`} subValue={subscription?.billing_cycle === 'yearly' ? L('Billed yearly', 'الفوترة سنوية') : L('Billing amount from subscription', 'قيمة الفوترة حسب الاشتراك')} icon={<CreditCard size={18} />} />
        <MetricCard label={L('Current term ends', 'تنتهي الفترة الحالية')} value={endDate ? endDate.toLocaleDateString(isRTL ? 'ar' : undefined) : '—'} subValue={subscription?.status || L('No active subscription', 'لا يوجد اشتراك نشط')} icon={<Calendar size={18} />} />
      </div>
      {usage && <Card>
        <CardHeader><CardTitle>{L('Monthly usage', 'الاستخدام الشهري')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {([
            [L('AI replies', 'ردود الذكاء الاصطناعي'), usage.usage.ai_replies],
            [L('Outbound messages', 'الرسائل الصادرة'), usage.usage.outbound_messages],
            [L('Channel accounts', 'حسابات القنوات'), usage.usage.channels],
          ] as [string, UsageMetric][]).map(([label, metric]) => {
            const percentage = metric.unlimited ? 0 : Math.min(metric.percentage ?? 0, 100)
            return <div key={label}>
              <div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><span className="font-medium">{metric.used} / {metric.unlimited ? L('Unlimited', 'غير محدود') : metric.limit}</span></div>
              {!metric.unlimited && <div className="h-2 overflow-hidden rounded-full bg-surface-muted"><div className={`h-full ${metric.allowed ? 'bg-brand' : 'bg-error'}`} style={{ width: `${percentage}%` }} /></div>}
            </div>
          })}
        </CardContent>
      </Card>}
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>{L('Plan details', 'تفاصيل الباقة')}</CardTitle><Badge variant={subscription?.status === 'active' ? 'success' : 'outline'} dot>{subscription?.status || (data?.is_free ? L('Free', 'مجاني') : L('No subscription', 'لا يوجد اشتراك'))}</Badge></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-text-muted">{L('AI replies included', 'ردود الذكاء الاصطناعي المشمولة')}</span><div className="font-medium">{plan.ai_replies_limit ?? L('Not provided by plan data', 'غير متاح ضمن بيانات الباقة')}</div></div>
            <div><span className="text-text-muted">{L('Channel limit', 'حد القنوات')}</span><div className="font-medium">{plan.channels_limit ?? L('Not provided by plan data', 'غير متاح ضمن بيانات الباقة')}</div></div>
            <div><span className="text-text-muted">{L('Monthly outbound limit', 'حد الرسائل الصادرة شهريًا')}</span><div className="font-medium">{plan.outbound_messages_limit == null || plan.outbound_messages_limit < 0 ? L('Unlimited', 'غير محدود') : plan.outbound_messages_limit}</div></div>
          </div>
          {plan.features?.length ? <ul className="list-disc space-y-1 ps-5 text-sm text-text-secondary">{plan.features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul> : <p className="text-sm text-text-muted">{L('No feature list is available for this plan.', 'لا تتوفر قائمة بمزايا هذه الباقة.')}</p>}
          {subscription && subscription.status === 'active' && !subscription.cancelled_at && <div className="border-t border-border pt-4"><Button variant="outline" loading={cancelling} onClick={() => void handleCancel()}>{L('Cancel subscription', 'إلغاء الاشتراك')}</Button></div>}
          {subscription?.auto_renew_enabled && <div className="border-t border-border pt-4 space-y-2"><p className="text-sm text-text-secondary">{L('Monthly automatic renewal is on. You can turn it off and keep access through the current term.', 'التجديد التلقائي الشهري مفعّل. يمكنك إيقافه مع الاحتفاظ بإمكانية الوصول حتى نهاية الفترة الحالية.')}</p><Button variant="outline" loading={disablingRenewal} onClick={() => void handleDisableAutoRenew()}>{L('Turn off auto-renew', 'إيقاف التجديد التلقائي')}</Button></div>}
        </CardContent>
      </Card>
    </> : !error && <Card className="p-6"><p className="text-sm text-text-muted">{L('No subscription or plan details were returned for this account.', 'لم يتم إرجاع تفاصيل اشتراك أو باقة لهذا الحساب.')}</p></Card>}
  </main>
}
