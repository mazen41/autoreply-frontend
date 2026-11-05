'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Calendar, CheckCircle2, CircleHelp, Clock3, CreditCard, MessageSquare, Sparkles, Store, Zap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
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
  const formatNumber = (value: number) => Number(value || 0).toLocaleString(isRTL ? 'ar' : undefined)
  const formattedEndDate = endDate && !Number.isNaN(endDate.getTime()) ? endDate.toLocaleDateString(isRTL ? 'ar' : undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null
  const availableCredits = aiCredits?.wallet.available_balance ?? 0
  const reservedCredits = aiCredits?.wallet.reserved_balance ?? 0
  const monthlyAllowance = aiCredits?.cycle_usage.allowance ?? plan?.ai_credits_monthly ?? 0
  const consumedCredits = aiCredits?.cycle_usage.credits_consumed ?? 0
  const creditUsagePercent = monthlyAllowance > 0 ? Math.min(100, Math.round(consumedCredits / monthlyAllowance * 100)) : 0

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

  const Metric = ({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) => <div className="rounded-xl border border-border bg-surface-muted/30 p-4 md:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-text-muted">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p></div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">{icon}</span></div><p className="mt-3 text-xs leading-5 text-text-muted">{note}</p></div>

  const ResourceMeter = ({ label, icon, metric, explanation }: { label: string; icon: React.ReactNode; metric: UsageMetric; explanation: string }) => {
    const percentage = metric.unlimited ? 0 : Math.min(metric.percentage ?? 0, 100)
    return <div className="rounded-xl border border-border bg-surface-muted/20 p-4 md:p-5">
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">{icon}</span><div className="min-w-0 flex-1"><p className="font-semibold">{label}</p><p className="mt-1 text-sm text-text-muted">{explanation}</p></div></div>
      <div className="mt-5 flex items-baseline justify-between gap-3"><span className="text-sm text-text-muted">{L('Used this billing period', 'المستخدم خلال فترة الفوترة')}</span><strong className="text-lg tabular-nums">{formatNumber(metric.used)} <span className="text-sm font-normal text-text-muted">/ {metric.unlimited ? L('Unlimited', 'غير محدود') : formatNumber(metric.limit)}</span></strong></div>
      {!metric.unlimited && <><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-muted"><div className={`h-full rounded-full transition-[width] ${metric.allowed ? 'bg-brand' : 'bg-error'}`} style={{ width: `${percentage}%` }} /></div><p className="mt-2 text-end text-xs text-text-muted">{formatNumber(metric.remaining ?? Math.max(0, metric.limit - metric.used))} {L('remaining', 'متبقية')} · {percentage}%</p></>}
      {metric.unlimited && <p className="mt-4 rounded-lg bg-success/5 px-3 py-2 text-xs font-medium text-success">{L('This resource has no monthly cap on your plan.', 'لا يوجد حد شهري لهذا المورد في باقتك.')}</p>}
    </div>
  }

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
    <PageHeader title={L('Plans & Billing', 'الباقات والفوترة')} description={L('A clear view of your plan, what it includes, what you have used, and how AI credits are counted.', 'عرض واضح لباقتك ومزاياها واستخدامك الحالي وطريقة احتساب رصيد الذكاء الاصطناعي.')} primaryAction={<Link href="/pricing"><Button variant="primary" icon={<ArrowUpRight size={14} />}>{L('Compare plans', 'مقارنة الباقات')}</Button></Link>} />
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchSubscription()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}
    {loading ? <div className="py-16 text-center text-sm text-text-muted" role="status">{L('Loading your plan and usage…', 'جارٍ تحميل الباقة والاستخدام…')}</div> : plan ? <>
      <section aria-labelledby="billing-overview-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{L('Your account', 'حسابك')}</p><h2 id="billing-overview-title" className="mt-1 text-xl font-bold">{L('Subscription overview', 'ملخص الاشتراك')}</h2><p className="mt-1 text-sm text-text-muted">{L('The key dates and payment details for the plan currently assigned to this workspace.', 'أهم التواريخ وتفاصيل الدفع للباقة المفعلة على مساحة العمل.')}</p></div><Badge variant={subscription?.status === 'active' ? 'success' : 'outline'} dot>{subscription?.status || (data?.is_free ? L('Free plan', 'باقة مجانية') : L('No active subscription', 'لا يوجد اشتراك نشط'))}</Badge></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Metric icon={<Zap size={18} />} label={L('Current plan', 'الباقة الحالية')} value={plan.name} note={subscription?.billing_cycle === 'yearly' ? L('Billed yearly. Plan benefits follow the limits listed below.', 'تُحاسب سنويًا. مزايا الباقة حسب الحدود الموضحة أدناه.') : L('Billed monthly. Plan benefits follow the limits listed below.', 'تُحاسب شهريًا. مزايا الباقة حسب الحدود الموضحة أدناه.')} />
          <Metric icon={<CreditCard size={18} />} label={L('Recorded subscription payment', 'دفعة الاشتراك المسجلة')} value={data?.is_free ? L('No charge', 'بلا رسوم') : `${Number(subscription?.amount_paid ?? (subscription?.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly) ?? 0).toLocaleString(isRTL ? 'ar' : undefined)} SAR`} note={L('Amount recorded for this subscription. Your payment provider statement is the source for the final transaction status.', 'المبلغ المسجل لهذا الاشتراك. راجع كشف مزود الدفع لمعرفة الحالة النهائية للمعاملة.')} />
          <Metric icon={<Calendar size={18} />} label={subscription?.auto_renew_enabled ? L('Next renewal date', 'موعد التجديد القادم') : L('Plan access through', 'استمرار الباقة حتى')} value={formattedEndDate || L('Not scheduled', 'غير محدد')} note={subscription?.auto_renew_enabled ? L('Automatic renewal is enabled. You can turn it off below and keep access until this date.', 'التجديد التلقائي مفعّل. يمكنك إيقافه أدناه مع استمرار الوصول حتى هذا التاريخ.') : L('Automatic renewal is off. Renew manually before this date to avoid an interruption.', 'التجديد التلقائي متوقف. جدد يدويًا قبل هذا التاريخ لتجنب انقطاع الخدمة.')} />
        </div>
      </section>

      {usage && <section aria-labelledby="plan-usage-title" className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{L('Limits & activity', 'الحدود والنشاط')}</p><h2 id="plan-usage-title" className="mt-1 text-xl font-bold">{L('How much of your plan is in use?', 'ما مقدار استخدامك من الباقة؟')}</h2><p className="mt-1 text-sm text-text-muted">{L('Counters cover the current billing period. AI credits are explained separately below because they use a different balance.', 'تغطي العدادات فترة الفوترة الحالية. يظهر رصيد الذكاء الاصطناعي منفصلًا أدناه لأنه يُحسب برصيد مختلف.')}</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ResourceMeter label={L('Outbound messages', 'الرسائل الصادرة')} icon={<MessageSquare size={18} />} metric={usage.usage.outbound_messages} explanation={L('Messages your connected channels send to customers.', 'الرسائل التي ترسلها قنواتك المتصلة إلى العملاء.')} />
          <ResourceMeter label={L('Connected channel accounts', 'حسابات القنوات المتصلة')} icon={<Store size={18} />} metric={usage.usage.channels} explanation={L('Social, messaging, and email accounts connected to this workspace.', 'حسابات التواصل والمراسلة والبريد الإلكتروني المتصلة بمساحة العمل.')} />
        </div>
      </section>}

      <section aria-labelledby="ai-credit-title" className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{L('AI usage', 'استخدام الذكاء الاصطناعي')}</p><h2 id="ai-credit-title" className="mt-1 text-xl font-bold">{L('AI credit balance, usage, and top-ups', 'رصيد الذكاء الاصطناعي والاستخدام والشحن')}</h2><p className="mt-1 max-w-4xl text-sm leading-6 text-text-muted">{L('AI credits pay for model work such as writing replies, understanding requests, and processing supported media. The amount used depends on the model and the size of each request.', 'يُستخدم رصيد الذكاء الاصطناعي لتشغيل النماذج، مثل كتابة الردود وفهم الطلبات ومعالجة الوسائط المدعومة. ويتغير الاستهلاك حسب النموذج وحجم كل طلب.')}</p></div>
        <Card>
          <CardHeader className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl"><CardTitle>{L('Your AI credits', 'رصيد الذكاء الاصطناعي')}</CardTitle><p className="mt-2 text-sm leading-6 text-text-muted">{L('Monthly subscription credits renew with your plan. Purchased credits are tracked separately and added after payment is verified.', 'يتجدد رصيد الاشتراك الشهري مع باقتك. ويُتابع الرصيد المشترى بشكل منفصل ويضاف بعد التحقق من الدفع.')}</p></div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-muted/30 p-3"><div className="flex items-center gap-2"><Sparkles size={17} className="text-brand"/><span className="text-sm font-semibold">{L('AI response mode', 'وضع ردود الذكاء الاصطناعي')}</span><CircleHelp size={15} className="text-text-muted" aria-label={L('Choose how the AI selects models for your requests.', 'اختر طريقة تحديد النموذج المناسب لطلبات الذكاء الاصطناعي.')} /></div><Select ariaLabel={L('AI operating mode', 'وضع تشغيل الذكاء الاصطناعي')} dir={isRTL ? 'rtl' : 'ltr'} value={aiSettings.operating_mode} options={[
              { value: 'auto', label: L('Automatic', 'تلقائي'), disabled: !aiSettings.available_modes?.includes('auto') },
              { value: 'economy', label: L('Economy', 'اقتصادي'), disabled: !aiSettings.available_modes?.includes('economy') },
              { value: 'premium', label: L('Premium', 'متقدم'), disabled: !aiSettings.available_modes?.includes('premium') },
            ]} disabled={savingAiMode || !aiCredits} onValueChange={(value) => void saveAiMode(value as AiCreditSettings['operating_mode'])} /></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiCreditsError ? <div role="alert" className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">{aiCreditsError}</div> : !aiCredits ? <p role="status" className="py-4 text-sm text-text-muted">{L('Loading AI credit details…', 'جارٍ تحميل تفاصيل الرصيد…')}</p> : <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric icon={<Sparkles size={17}/>} label={L('Available to use now', 'المتاح للاستخدام الآن')} value={formatNumber(availableCredits)} note={L('Credits available for new AI requests right now.', 'الرصيد المتاح حاليًا لطلبات الذكاء الاصطناعي الجديدة.')} />
                <Metric icon={<Calendar size={17}/>} label={L('Monthly plan allowance', 'رصيد الباقة الشهري')} value={formatNumber(monthlyAllowance)} note={L('Credits included with your plan for this billing cycle.', 'الرصيد المشمول في باقتك خلال دورة الفوترة الحالية.')} />
                <Metric icon={<CheckCircle2 size={17}/>} label={L('Used this cycle', 'المستخدم في هذه الدورة')} value={formatNumber(consumedCredits)} note={L('Credits charged for completed AI work this billing cycle.', 'الرصيد المحتسب مقابل عمليات الذكاء الاصطناعي المكتملة خلال دورة الفوترة.')} />
                <Metric icon={<Clock3 size={17}/>} label={L('Temporarily reserved', 'محجوز مؤقتًا')} value={formatNumber(reservedCredits)} note={L('Held while AI requests are processing; unused amounts are released afterward.', 'يُحجز أثناء معالجة الطلبات، ثم يُعاد الجزء غير المستخدم بعد انتهائها.')} />
                <Metric icon={<CreditCard size={17}/>} label={L('Purchased credits left', 'الرصيد المشترى المتبقي')} value={formatNumber(aiCredits.wallet.purchased_balance)} note={L('Top-up credits kept separate from your monthly plan allowance.', 'رصيد الشحن الإضافي المحفوظ بشكل منفصل عن رصيد الباقة الشهري.')} />
              </div>
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{L('Monthly plan credit usage', 'استهلاك رصيد الباقة الشهري')}</p><p className="mt-1 text-sm text-text-muted">{L('Shows credits already charged, not credits currently reserved.', 'يعرض الرصيد المحتسب فعلًا، ولا يشمل الرصيد المحجوز مؤقتًا.')}</p></div><strong className="text-lg tabular-nums">{formatNumber(consumedCredits)} / {formatNumber(monthlyAllowance)} · {creditUsagePercent}%</strong></div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${creditUsagePercent}%` }} /></div>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{L('Balance formula: monthly credits remaining + purchased credits − temporary reservations = available now. A small temporary reservation can make “available” lower than the monthly allowance even when no request has finished yet.', 'طريقة الحساب: الرصيد الشهري المتبقي + الرصيد المشترى − الحجوزات المؤقتة = الرصيد المتاح الآن. قد يقل الرصيد المتاح عن رصيد الباقة بسبب حجز مؤقت حتى قبل اكتمال الطلب.')}</p>
                <p className="mt-2 text-xs text-text-muted">{aiCredits.subscription.renewal_at ? L('Next credit renewal: ', 'موعد تجديد الرصيد: ') + new Date(aiCredits.subscription.renewal_at).toLocaleDateString(isRTL ? 'ar' : undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : L('Unused monthly credits expire when the billing cycle ends.', 'تنتهي صلاحية الرصيد الشهري غير المستخدم عند انتهاء دورة الفوترة.')}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted/20 p-4"><h3 className="font-semibold">{L('What does the AI mode do?', 'ماذا يعني وضع الذكاء الاصطناعي؟')}</h3><div className="mt-3 grid gap-3 md:grid-cols-3"><p className="text-sm leading-6 text-text-muted"><strong className="text-text-primary">{L('Automatic — ', 'تلقائي — ')}</strong>{L('selects a suitable configured model for each task.', 'يختار نموذجًا مناسبًا ومتاحًا لكل مهمة.')}</p><p className="text-sm leading-6 text-text-muted"><strong className="text-text-primary">{L('Economy — ', 'اقتصادي — ')}</strong>{L('prefers lower-cost configured models where available.', 'يفضل النماذج الأقل تكلفة عند توفرها.')}</p><p className="text-sm leading-6 text-text-muted"><strong className="text-text-primary">{L('Premium — ', 'متقدم — ')}</strong>{L('prefers more capable configured models; it may use credits faster.', 'يفضل النماذج الأعلى قدرة وقد يستهلك الرصيد بسرعة أكبر.')}</p></div></div>

              {!!aiCredits.by_task?.length && <div><h3 className="mb-3 font-semibold">{L('Where credits were used', 'أين استُخدم الرصيد؟')}</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{aiCredits.by_task.map((item) => <div key={item.task_type} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"><span className="capitalize text-sm font-medium">{item.task_type.replaceAll('_', ' ')}</span><span className="text-end text-sm tabular-nums"><strong>{formatNumber(Number(item.credits))}</strong><span className="block text-xs text-text-muted">{formatNumber(item.requests)} {L('requests', 'طلب')}</span></span></div>)}</div></div>}
              {!!aiCredits.daily?.length && <div><h3 className="mb-3 font-semibold">{L('Daily AI activity', 'نشاط الذكاء الاصطناعي اليومي')}</h3><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[480px] text-sm"><thead><tr className="border-b border-border bg-surface-muted/30 text-text-muted"><th className="p-3 text-start">{L('Date', 'التاريخ')}</th><th className="p-3 text-end">{L('Requests completed', 'الطلبات المكتملة')}</th><th className="p-3 text-end">{L('Credits charged', 'الرصيد المحتسب')}</th></tr></thead><tbody>{aiCredits.daily.map((day) => <tr key={day.date} className="border-b border-border/60 last:border-0"><td className="p-3">{new Date(`${day.date}T00:00:00`).toLocaleDateString(isRTL ? 'ar' : undefined)}</td><td className="p-3 text-end tabular-nums">{formatNumber(Number(day.requests))}</td><td className="p-3 text-end tabular-nums">{formatNumber(Number(day.credits))}</td></tr>)}</tbody></table></div></div>}

              <div className="border-t border-border pt-6"><div className="mb-4"><h3 className="text-lg font-semibold">{L('Need more AI credits?', 'هل تحتاج إلى رصيد إضافي؟')}</h3><p className="mt-1 text-sm leading-6 text-text-muted">{L('Choose a one-time top-up. We send you to the payment page; credits are added only after the payment is confirmed.', 'اختر شحنة إضافية لمرة واحدة. سننقلك إلى صفحة الدفع، ويضاف الرصيد بعد تأكيد الدفع فقط.')}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{aiPackages.map((item) => <div key={item.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface-muted/20 p-4"><div><p className="text-xl font-bold tabular-nums">{formatNumber(Number(item.credits))}</p><p className="text-sm text-text-muted">{L('additional credits', 'رصيد إضافي')}</p><p className="mt-3 text-lg font-semibold">{Number(item.price_sar).toLocaleString(isRTL ? 'ar' : undefined)} <span className="text-sm font-medium text-text-muted">SAR</span></p><p className="text-xs text-text-muted">{L('one-time payment', 'دفعة لمرة واحدة')}</p></div><Button className="w-full" size="sm" variant="outline" loading={buyingPackage === item.id} disabled={buyingPackage !== null} onClick={() => void buyCredits(item.id)}>{L('Continue to payment', 'المتابعة إلى الدفع')}</Button></div>)}</div><p className="mt-3 text-xs leading-5 text-text-muted">{L('Purchased credits are separate from monthly credits and do not expire while your account remains active.', 'يظل الرصيد المشترى منفصلًا عن الرصيد الشهري ولا تنتهي صلاحيته ما دام حسابك نشطًا.')}</p></div>

              <div className="border-t border-border pt-5"><Button variant="outline" loading={historyLoading} onClick={() => void toggleAiHistory()}>{historyOpen ? L('Hide detailed history', 'إخفاء السجل التفصيلي') : L('Open detailed usage & credit history', 'عرض سجل الاستخدام وحركات الرصيد')}</Button>{historyOpen && <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <section><h3 className="mb-2 font-semibold">{L('Recent AI requests', 'طلبات الذكاء الاصطناعي الأخيرة')}</h3><p className="mb-3 text-xs text-text-muted">{L('Each row is an AI operation and the credits charged for it.', 'كل صف يمثل عملية ذكاء اصطناعي والرصيد المحتسب عليها.')}</p>{usageHistory.length ? <div className="divide-y divide-border rounded-xl border border-border">{usageHistory.map((row) => <div key={row.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span><span className="font-medium">{row.task_type.replaceAll('_', ' ')}</span><span className="ms-2 text-text-muted">{row.provider || L('Provider pending', 'بانتظار المزوّد')}</span><span className="ms-2 block text-xs text-text-muted">{new Date(row.created_at).toLocaleString(isRTL ? 'ar' : undefined)}</span></span><span className="text-end tabular-nums">{formatNumber(Number(row.credits_consumed))} {L('credits', 'رصيد')}<span className="block text-xs text-text-muted">{row.status}</span></span></div>)}</div> : <p className="rounded-xl border border-border p-4 text-sm text-text-muted">{L('No AI requests recorded yet.', 'لا توجد طلبات ذكاء اصطناعي مسجلة بعد.')}</p>}</section>
                <section><h3 className="mb-2 font-semibold">{L('Credit balance changes', 'تغييرات رصيدك')}</h3><p className="mb-3 text-xs text-text-muted">{L('Credits added, used, reserved, released, or expired.', 'الرصيد المضاف أو المستخدم أو المحجوز أو المعاد أو المنتهي.')}</p>{creditHistory.length ? <div className="divide-y divide-border rounded-xl border border-border">{creditHistory.map((row) => <div key={row.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span><span className="font-medium">{row.description || row.type}</span><span className="ms-2 block text-xs text-text-muted">{new Date(row.created_at).toLocaleString(isRTL ? 'ar' : undefined)}</span></span><span className="whitespace-nowrap font-semibold tabular-nums">{row.type === 'debit' || row.type === 'expiration' ? '−' : '+'}{formatNumber(Number(row.amount))} {L('credits', 'رصيد')}</span></div>)}</div> : <p className="rounded-xl border border-border p-4 text-sm text-text-muted">{L('No credit transactions recorded yet.', 'لا توجد حركات رصيد مسجلة بعد.')}</p>}</section>
              </div>}</div>
            </>}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="plan-details-title" className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{L('Plan information', 'معلومات الباقة')}</p><h2 id="plan-details-title" className="mt-1 text-xl font-bold">{L('What is included in your plan?', 'ما الذي تتضمنه باقتك؟')}</h2><p className="mt-1 text-sm text-text-muted">{L('These are the limits and features currently attached to your workspace.', 'هذه هي الحدود والمزايا المرتبطة حاليًا بمساحة العمل.')}</p></div>
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{plan.name}</CardTitle><p className="mt-1 text-sm text-text-muted">{L('Plan limits and included features', 'حدود الباقة ومزاياها')}</p></div><Badge variant={subscription?.status === 'active' ? 'success' : 'outline'} dot>{subscription?.status || (data?.is_free ? L('Free', 'مجاني') : L('No active subscription', 'لا يوجد اشتراك نشط'))}</Badge></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Metric icon={<Sparkles size={17}/>} label={L('AI credits each month', 'رصيد الذكاء الاصطناعي شهريًا')} value={formatNumber(plan.ai_credits_monthly ?? plan.ai_replies_limit ?? 0)} note={L('Credits are consumed when AI work is completed.', 'يُستهلك الرصيد عند إتمام عمليات الذكاء الاصطناعي.')} />
              <Metric icon={<Store size={17}/>} label={L('Connected channels', 'القنوات المتصلة')} value={plan.channels_limit == null || plan.channels_limit < 0 ? L('Unlimited', 'غير محدود') : formatNumber(plan.channels_limit)} note={L('Maximum connected communication accounts allowed by this plan.', 'الحد الأقصى لحسابات التواصل التي تسمح بها الباقة.')} />
              <Metric icon={<MessageSquare size={17}/>} label={L('Outbound messages', 'الرسائل الصادرة')} value={plan.outbound_messages_limit == null || plan.outbound_messages_limit < 0 ? L('Unlimited', 'غير محدود') : formatNumber(plan.outbound_messages_limit)} note={L('Messages sent by your workspace during each billing period.', 'الرسائل التي ترسلها مساحة العمل خلال كل فترة فوترة.')} />
            </div>
            {plan.features?.length ? <div><h3 className="mb-3 font-semibold">{L('Included features', 'المزايا المشمولة')}</h3><ul className="grid gap-2 sm:grid-cols-2">{plan.features.map((feature, index) => <li key={`${feature}-${index}`} className="flex items-start gap-2 rounded-lg border border-border/70 px-3 py-2.5 text-sm"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success"/><span>{feature}</span></li>)}</ul></div> : <p className="text-sm text-text-muted">{L('No feature list is available for this plan.', 'لا تتوفر قائمة بمزايا هذه الباقة.')}</p>}
            <div className="rounded-xl border border-border bg-surface-muted/20 p-4"><h3 className="font-semibold">{L('Renewal and cancellation', 'التجديد والإلغاء')}</h3><p className="mt-1 text-sm leading-6 text-text-muted">{subscription?.auto_renew_enabled ? L('Automatic renewal is enabled. If you turn it off, the current plan remains active until the end date above.', 'التجديد التلقائي مفعّل. عند إيقافه، تبقى الباقة الحالية فعالة حتى تاريخ الانتهاء أعلاه.') : L('Automatic renewal is off. Your plan will not renew by itself; choose a plan from the Plans page before the access end date to continue.', 'التجديد التلقائي متوقف. لن تتجدد الباقة تلقائيًا؛ اختر باقة من صفحة الباقات قبل تاريخ انتهاء الوصول للاستمرار.')}</p><div className="mt-4 flex flex-wrap gap-3">{subscription && subscription.status === 'active' && !subscription.cancelled_at && <Button variant="outline" loading={cancelling} onClick={() => void handleCancel()}>{L('Cancel subscription', 'إلغاء الاشتراك')}</Button>}{subscription?.auto_renew_enabled && <Button variant="outline" loading={disablingRenewal} onClick={() => void handleDisableAutoRenew()}>{L('Turn off auto-renew', 'إيقاف التجديد التلقائي')}</Button>}<Link href="/pricing"><Button variant="primary" icon={<ArrowUpRight size={14}/>}>{L('View available plans', 'عرض الباقات المتاحة')}</Button></Link></div></div>
          </CardContent>
        </Card>
      </section>
    </> : !error && <Card className="p-6"><p className="text-sm text-text-muted">{L('No subscription or plan details were returned for this account.', 'لم يتم إرجاع تفاصيل اشتراك أو باقة لهذا الحساب.')}</p><Link className="mt-4 inline-flex" href="/pricing"><Button variant="primary">{L('View plans', 'عرض الباقات')}</Button></Link></Card>}
  </main>
}
