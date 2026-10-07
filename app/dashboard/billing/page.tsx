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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\\s*)naz_token=([^;]*)/)?.[1] || '')
}

type Plan = { id?: number; name: string; price_monthly?: number; price_yearly?: number; ai_replies_limit?: number; channels_limit?: number; features?: string[] }
type Subscription = { id: number; status: string; billing_cycle?: string; amount_paid?: number; starts_at?: string; ends_at?: string | null; cancelled_at?: string | null; package?: Plan }
type SubscriptionResponse = { subscription?: Subscription | null; package?: Plan | null; is_free?: boolean }

export default function BillingPage() {
  const [data, setData] = useState<SubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to view billing.')
      const response = await fetch(`${API}/api/subscriptions/current`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || `Could not load subscription (HTTP ${response.status}).`)
      setData(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load billing information.')
      setData(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetchSubscription() }, [fetchSubscription])

  const handleCancel = async () => {
    if (!confirm('Cancel this subscription?')) return
    setCancelling(true)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/subscriptions`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Subscription cancellation failed.')
      toast.success(result.message || 'Subscription cancellation requested.')
      await fetchSubscription()
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Could not cancel subscription.') }
    finally { setCancelling(false) }
  }

  const plan = data?.subscription?.package || data?.package || null
  const subscription = data?.subscription || null
  const endDate = subscription?.ends_at ? new Date(subscription.ends_at) : null

  return <div className="space-y-6">
    <PageHeader title="Plans & Billing" description="View your current subscription and plan limits." primaryAction={<Link href="/pricing"><Button variant="primary" icon={<ArrowUpRight size={14} />}>View plans</Button></Link>} />
    {error && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchSubscription()}>Retry</Button></div>}
    {loading ? <div className="py-16 text-center text-sm text-text-muted" role="status">Loading subscription…</div> : plan ? <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Current plan" value={plan.name} subValue={subscription?.billing_cycle || (data?.is_free ? 'Free plan' : 'Plan')} icon={<Zap size={18} />} />
        <MetricCard label="Plan price" value={data?.is_free ? 'Free' : `${subscription?.amount_paid ?? plan.price_monthly ?? '—'}`} subValue={subscription?.billing_cycle === 'yearly' ? 'Billed yearly' : 'Billing amount from subscription'} icon={<CreditCard size={18} />} />
        <MetricCard label="Current term ends" value={endDate ? endDate.toLocaleDateString() : '—'} subValue={subscription?.status || 'No active subscription'} icon={<Calendar size={18} />} />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Plan details</CardTitle><Badge variant={subscription?.status === 'active' ? 'success' : 'outline'} dot>{subscription?.status || (data?.is_free ? 'Free' : 'No subscription')}</Badge></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-text-muted">AI replies included</span><div className="font-medium">{plan.ai_replies_limit ?? 'Not provided by plan data'}</div></div>
            <div><span className="text-text-muted">Channel limit</span><div className="font-medium">{plan.channels_limit ?? 'Not provided by plan data'}</div></div>
          </div>
          {plan.features?.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">{plan.features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul> : <p className="text-sm text-text-muted">No feature list is available for this plan.</p>}
          {subscription && subscription.status === 'active' && !subscription.cancelled_at && <div className="border-t border-border pt-4"><Button variant="outline" loading={cancelling} onClick={() => void handleCancel()}>Cancel subscription</Button></div>}
        </CardContent>
      </Card>
    </> : !error && <Card className="p-6"><p className="text-sm text-text-muted">No subscription or plan details were returned for this account.</p></Card>}
  </div>
}
