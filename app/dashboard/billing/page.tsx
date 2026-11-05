'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Calendar, CreditCard, Zap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import toast from 'react-hot-toast'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

type Plan = { id?: number; name: string; price_monthly?: number; price_yearly?: number; ai_replies_limit?: number; ai_credits_monthly?: number; outbound_messages_limit?: number; channels_limit?: number; features?: string[] }
type Subscription = { id: number; status: string; billing_cycle?: string; amount_paid?: number; starts_at?: string; ends_at?: string | null; cancelled_at?: string | null; auto_renew_enabled?: boolean; package?: Plan }
type SubscriptionResponse = { subscription?: Subscription | null; package?: Plan | null; is_free?: boolean }
type UsageMetric = { used: number; limit: number; remaining: number | null; unlimited: boolean; percentage: number | null; allowed: boolean }
type UsageResponse = { business_id: number; period: { starts_at: string; ends_at: string }; usage: { ai_replies: UsageMetric; outbound_messages: UsageMetric; channels: UsageMetric } }
type AiCreditSummary = { subscription: { plan: string; allowance: number; renewal_at: string | null }; wallet: { subscription_balance: number; purchased_balance: number; reserved_balance: number; available_balance: number; total_consumed: number; period_ends_at: string | null }; cycle_usage: { credits_consumed: number; allowance: number; percentage: number | null }; by_task?: { task_type: string; credits: number; requests: number }[]; daily?: { date: string; credits: number; requests: number }[] }
type AiCreditPackage = { id: number; name: string; credits: number; price_sar: number }
type AiUsageRow = { id: number; task_type: string; provider: string | null; model_key: string | null; input_tokens: number; output_tokens: number; credits_consumed: number; status: string; created_at: string }
type CreditTransaction = { id: number; type: string; source: string; amount: number; description: string | null; created_at: string }
type AiCreditSettings = { operating_mode: 'auto' | 'economy' | 'premium'; available_modes?: ('auto' | 'economy' | 'premium')[] }

export default function BillingPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [data, setData] = useState<SubscriptionResponse | null>(null)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [disablingRenewal, setDisablingRenewal] = useState(false)
  const [aiCredits, setAiCredits] = useState<AiCreditSummary | null>(null)
  const [aiPackages, setAiPackages] = useState<AiCreditPackage[]>([])
  const [aiSettings, setAiSettings] = useState<AiCreditSettings>({ operating_mode: 'auto' })
  const [aiCreditsError, setAiCreditsError] = useState<string | null>(null)
  const [buyingPackage, setBuyingPackage] = useState<number | null>(null)
  const [savingAiMode, setSavingAiMode] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [usageHistory, setUsageHistory] = useState<AiUsageRow[]>([])
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([])

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
      try {
        const [creditsResponse, packagesResponse, settingsResponse] = await Promise.all([
          fetch(`${API}/api/ai/usage`, { headers }),
          fetch(`${API}/api/ai/credits/packages`, { headers }),
          fetch(`${API}/api/ai/settings`, { headers }),
        ])
        const [creditsResult, packagesResult, settingsResult] = await Promise.all([
          creditsResponse.json(), packagesResponse.json(), settingsResponse.json(),
        ])
        if (!creditsResponse.ok || !packagesResponse.ok || !settingsResponse.ok) throw new Error(L('AI credit details are temporarily unavailable.', 'تفاصيل رصيد الذكاء الاصطناعي غير متاحة مؤقتًا.'))
        setAiCredits(creditsResult)
        setAiPackages(Array.isArray(packagesResult) ? packagesResult : [])
        setAiSettings({ operating_mode: settingsResult.operating_mode || 'auto', available_modes: settingsResult.available_modes || ['auto'] })
        setAiCreditsError(null)
      } catch (aiError) {
        setAiCreditsError(aiError instanceof Error ? aiError.message : L('Could not load AI credit details.', 'تعذر تحميل تفاصيل رصيد الذكاء الاصطناعي.'))
      }
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

  const saveAiMode = async (mode: AiCreditSettings['operating_mode']) => {
    setSavingAiMode(true)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const response = await fetch(`${API}/api/ai/settings`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ operating_mode: mode }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || L('Could not update AI mode.', 'تعذر تحديث وضع الذكاء الاصطناعي.'))
      setAiSettings((current) => ({ ...current, operating_mode: mode }))
      toast.success(L('AI mode updated.', 'تم تحديث وضع الذكاء الاصطناعي.'))
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : L('Could not update AI mode.', 'تعذر تحديث وضع الذكاء الاصطناعي.')) }
    finally { setSavingAiMode(false) }
  }

  const buyCredits = async (packageId: number) => {
    setBuyingPackage(packageId)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const response = await fetch(`${API}/api/ai/credits/purchase`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ package_id: packageId }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.payment_url) throw new Error(result.message || L('Could not start the credit purchase.', 'تعذر بدء شراء الرصيد.'))
      window.location.assign(result.payment_url)
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : L('Could not start the credit purchase.', 'تعذر بدء شراء الرصيد.')) }
    finally { setBuyingPackage(null) }
  }

  const toggleAiHistory = async () => {
    const shouldOpen = !historyOpen
    setHistoryOpen(shouldOpen)
    if (!shouldOpen || usageHistory.length || creditHistory.length) return
    setHistoryLoading(true)
    try {
      const token = getToken()
      if (!token) throw new Error(L('Your session expired. Sign in again.', 'انتهت جلستك. سجّل الدخول مجددًا.'))
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() }
      const [usageResponse, ledgerResponse] = await Promise.all([
        fetch(`${API}/api/ai/usage/history?per_page=10`, { headers }),
        fetch(`${API}/api/ai/credits/transactions?per_page=10`, { headers }),
      ])
      const [usageResult, ledgerResult] = await Promise.all([usageResponse.json(), ledgerResponse.json()])
      if (!usageResponse.ok || !ledgerResponse.ok) throw new Error(L('Could not load AI usage history.', 'تعذر تحميل سجل استخدام الذكاء الاصطناعي.'))
      setUsageHistory(Array.isArray(usageResult.data) ? usageResult.data : [])
      setCreditHistory(Array.isArray(ledgerResult.data) ? ledgerResult.data : [])
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : L('Could not load AI usage history.', 'تعذر تحميل سجل استخدام الذكاء الاصطناعي.'))
      setHistoryOpen(false)
    } finally { setHistoryLoading(false) }
  }

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
            [L('AI credits', 'أرصدة الذكاء الاصطناعي'), usage.usage.ai_replies],
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
        <CardHeader className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{L('AI credits', 'رصيد الذكاء الاصطناعي')}</CardTitle><p className="mt-1 text-sm text-text-muted">{L('AI usage is billed by actual model usage. Subscription and purchased balances are shown separately.', 'يُحسب استخدام الذكاء الاصطناعي حسب الاستهلاك الفعلي. يظهر رصيد الاشتراك والرصيد المشترى كلٌ على حدة.')}</p></div>
          <div className="flex items-center gap-2 text-sm"><span>{L('AI mode', 'وضع الذكاء الاصطناعي')}</span><Select ariaLabel={L('AI operating mode', 'وضع تشغيل الذكاء الاصطناعي')} dir={isRTL ? 'rtl' : 'ltr'} value={aiSettings.operating_mode} options={[
            { value: 'auto', label: L('Auto', 'تلقائي'), disabled: !aiSettings.available_modes?.includes('auto') },
            { value: 'economy', label: L('Economy', 'اقتصادي'), disabled: !aiSettings.available_modes?.includes('economy') },
            { value: 'premium', label: L('Premium', 'متقدم'), disabled: !aiSettings.available_modes?.includes('premium') },
          ]} disabled={savingAiMode || !aiCredits} onValueChange={(value) => void saveAiMode(value as AiCreditSettings['operating_mode'])} /> </div>
        </CardHeader>
        <CardContent>
          {aiCreditsError ? <div role="alert" className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">{aiCreditsError}</div> : !aiCredits ? <p role="status" className="py-4 text-sm text-text-muted">{L('Loading AI credit details…', 'جارٍ تحميل تفاصيل الرصيد…')}</p> : <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[[L('Available credits', 'الرصيد المتاح'), aiCredits.wallet.available_balance.toLocaleString()], [L('Monthly allowance', 'الرصيد الشهري'), aiCredits.cycle_usage.allowance.toLocaleString()], [L('Used this cycle', 'المستخدم في هذه الدورة'), aiCredits.cycle_usage.credits_consumed.toLocaleString()], [L('Purchased balance', 'الرصيد المشترى'), aiCredits.wallet.purchased_balance.toLocaleString()]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-surface-muted/30 p-4"><p className="text-sm text-text-muted">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>)}
            </div>
            <div className="mt-5"><div className="mb-2 flex justify-between gap-3 text-sm"><span>{L('Monthly credit usage', 'استهلاك الرصيد الشهري')}</span><span>{aiCredits.cycle_usage.percentage ?? 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, aiCredits.cycle_usage.percentage ?? 0)}%` }} /></div><p className="mt-2 text-xs text-text-muted">{aiCredits.subscription.renewal_at ? L('Renews', 'يتجدد في') + ' ' + new Date(aiCredits.subscription.renewal_at).toLocaleDateString(isRTL ? 'ar' : undefined) : L('Unused monthly credits expire at the end of the billing cycle.', 'تنتهي صلاحية الرصيد الشهري غير المستخدم بنهاية دورة الفوترة.')}</p></div>
            {!!aiCredits.by_task?.length && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold">{L('Usage by AI operation', 'الاستخدام حسب عملية الذكاء الاصطناعي')}</h3><div className="divide-y divide-border rounded-xl border border-border">{aiCredits.by_task.map((item) => <div key={item.task_type} className="flex justify-between gap-3 px-4 py-3 text-sm"><span className="capitalize">{item.task_type.replaceAll('_', ' ')}</span><span className="tabular-nums">{Number(item.credits).toLocaleString()} {L('credits', 'رصيد')} · {item.requests} {L('requests', 'طلب')}</span></div>)}</div></div>}
            {!!aiCredits.daily?.length && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold">{L('Daily usage this billing cycle', 'الاستخدام اليومي في دورة الفوترة')}</h3><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[420px] text-sm"><thead><tr className="border-b border-border text-start text-text-muted"><th className="p-3 text-start">{L('Date', 'التاريخ')}</th><th className="p-3 text-end">{L('AI requests', 'طلبات الذكاء الاصطناعي')}</th><th className="p-3 text-end">{L('Credits', 'الرصيد')}</th></tr></thead><tbody>{aiCredits.daily.map((day) => <tr key={day.date} className="border-b border-border/60 last:border-0"><td className="p-3">{new Date(`${day.date}T00:00:00`).toLocaleDateString(isRTL ? 'ar' : undefined)}</td><td className="p-3 text-end tabular-nums">{Number(day.requests).toLocaleString()}</td><td className="p-3 text-end tabular-nums">{Number(day.credits).toLocaleString()}</td></tr>)}</tbody></table></div></div>}
            <div className="mt-6 border-t border-border pt-5"><h3 className="mb-3 font-semibold">{L('Buy additional AI credits', 'شراء رصيد إضافي للذكاء الاصطناعي')}</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{aiPackages.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"><div><p className="font-medium">{Number(item.credits).toLocaleString()} {L('credits', 'رصيد')}</p><p className="text-sm text-text-muted">{Number(item.price_sar).toLocaleString()} SAR</p></div><Button size="sm" variant="outline" loading={buyingPackage === item.id} disabled={buyingPackage !== null} onClick={() => void buyCredits(item.id)}>{L('Buy', 'شراء')}</Button></div>)}</div><p className="mt-3 text-xs text-text-muted">{L('Purchased credits are added only after payment is verified and do not expire during an active account.', 'يُضاف الرصيد المشترى بعد التحقق من الدفع ولا تنتهي صلاحيته ما دام الحساب نشطًا.')}</p></div>
            <div className="mt-6 border-t border-border pt-5">
              <Button variant="outline" loading={historyLoading} onClick={() => void toggleAiHistory()}>{historyOpen ? L('Hide usage history', 'إخفاء سجل الاستخدام') : L('View usage history', 'عرض سجل الاستخدام')}</Button>
              {historyOpen && <div className="mt-4 grid gap-5 xl:grid-cols-2">
                <section><h3 className="mb-2 font-semibold">{L('Recent AI requests', 'طلبات الذكاء الاصطناعي الأخيرة')}</h3>{usageHistory.length ? <div className="divide-y divide-border rounded-xl border border-border">{usageHistory.map((row) => <div key={row.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span><span className="font-medium">{row.task_type.replaceAll('_', ' ')}</span><span className="ms-2 text-text-muted">{row.provider || L('Provider pending', 'بانتظار المزوّد')}</span><span className="ms-2 text-text-muted">{new Date(row.created_at).toLocaleString(isRTL ? 'ar' : undefined)}</span></span><span className="tabular-nums">{Number(row.credits_consumed).toLocaleString()} {L('credits', 'رصيد')} · {row.status}</span></div>)}</div> : <p className="rounded-xl border border-border p-4 text-sm text-text-muted">{L('No AI requests recorded yet.', 'لا توجد طلبات ذكاء اصطناعي مسجلة بعد.')}</p>}</section>
                <section><h3 className="mb-2 font-semibold">{L('Credit transactions', 'حركات الرصيد')}</h3>{creditHistory.length ? <div className="divide-y divide-border rounded-xl border border-border">{creditHistory.map((row) => <div key={row.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span><span className="font-medium">{row.description || row.type}</span><span className="ms-2 text-text-muted">{new Date(row.created_at).toLocaleString(isRTL ? 'ar' : undefined)}</span></span><span className="tabular-nums">{row.type === 'debit' || row.type === 'expiration' ? '−' : '+'}{Number(row.amount).toLocaleString()} {L('credits', 'رصيد')}</span></div>)}</div> : <p className="rounded-xl border border-border p-4 text-sm text-text-muted">{L('No credit transactions recorded yet.', 'لا توجد حركات رصيد مسجلة بعد.')}</p>}</section>
              </div>}
            </div>
          </>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>{L('Plan details', 'تفاصيل الباقة')}</CardTitle><Badge variant={subscription?.status === 'active' ? 'success' : 'outline'} dot>{subscription?.status || (data?.is_free ? L('Free', 'مجاني') : L('No subscription', 'لا يوجد اشتراك'))}</Badge></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-text-muted">{L('Monthly AI credits', 'رصيد الذكاء الاصطناعي الشهري')}</span><div className="font-medium">{(plan.ai_credits_monthly ?? 0).toLocaleString()}</div></div>
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
