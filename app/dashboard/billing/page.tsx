'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Download,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
  Bot,
  MessageSquare,
  HelpCircle
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Package {
  id: number
  name: string
  name_ar: string
  description: string
  description_ar: string
  price_monthly: number
  price_yearly: number
  ai_replies_limit: number
  channels_limit: number
  tools_limit: number
  blog_posts_limit: number
  features: string[]
  is_popular: boolean
  is_active: boolean
}

interface Subscription {
  id: number
  user_id: number
  package_id: number
  status: string
  billing_cycle: string
  amount_paid: number
  starts_at: string
  ends_at: string
  cancelled_at: string | null
  created_at: string
  package: Package
}

const DEMO_PACKAGE: Package = {
  id: 2,
  name: 'Growth Pro',
  name_ar: 'النمو الاحترافي',
  description: 'Designed for scaling e-commerce & high-traffic support teams needing unlimited channels & deep AI training.',
  description_ar: 'للمتاجر المتنامية وفرق الدعم ذات الحجم العالي',
  price_monthly: 89,
  price_yearly: 890,
  ai_replies_limit: 10000,
  channels_limit: 15,
  tools_limit: 20,
  blog_posts_limit: 50,
  features: [
    'Up to 10,000 AI Auto-Replies/mo',
    'Connect up to 15 Social & Messaging Channels',
    'Custom RAG Knowledge Base (PDF, DOCX, Spreadsheets)',
    'Full Vision AI & Voice Note Transcriptions',
    'Multi-Agent Routing & Team Permissions',
    'Dedicated WhatsApp Business Cloud API',
  ],
  is_popular: true,
  is_active: true,
}

const DEMO_SUBSCRIPTION: Subscription = {
  id: 101,
  user_id: 1,
  package_id: 2,
  status: 'active',
  billing_cycle: 'monthly',
  amount_paid: 89,
  starts_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
  cancelled_at: null,
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  package: DEMO_PACKAGE,
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [packageDetails, setPackageDetails] = useState<Package | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  // Demo usage meters
  const usedReplies = 4280
  const usedChannels = 4

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, '$1')
      if (!token) {
        setSubscription(DEMO_SUBSCRIPTION)
        setPackageDetails(DEMO_PACKAGE)
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (response.ok && data?.subscription) {
        setSubscription(data.subscription)
        setPackageDetails(data.package || data.subscription.package)
        setIsFree(data.is_free || false)
      } else {
        setSubscription(DEMO_SUBSCRIPTION)
        setPackageDetails(DEMO_PACKAGE)
      }
    } catch {
      setSubscription(DEMO_SUBSCRIPTION)
      setPackageDetails(DEMO_PACKAGE)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you wish to cancel your subscription? Access will remain active until the end of the current billing cycle.')) {
      return
    }

    setCancelling(true)
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, '$1')
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/subscriptions`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      toast.success('Subscription scheduled for cancellation at billing term end')
      if (subscription) {
        setSubscription({ ...subscription, status: 'cancelled' })
      }
    } catch {
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const getDaysRemaining = (endsAt: string) => {
    const endDate = new Date(endsAt)
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-xs text-text-tertiary">Loading billing overview...</span>
      </div>
    )
  }

  const pkg = packageDetails || DEMO_PACKAGE
  const daysLeft = subscription?.ends_at ? getDaysRemaining(subscription.ends_at) : 18

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans & Billing"
        description="Monitor current plan allocations, AI message limits, connected channel quotas, and historical invoices."
        badge={
          <Badge variant={subscription?.status === 'active' ? 'success' : 'outline'} dot>
            {subscription?.status === 'active' ? 'Active Subscription' : 'Cancelled / Expiring'}
          </Badge>
        }
        primaryAction={
          <Link href="/pricing">
            <Button variant="primary" icon={<ArrowUpRight size={14} />}>
              Upgrade Workspace
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Current Tier"
          value={pkg.name}
          subValue={`$${pkg.price_monthly} / month`}
          icon={<Zap size={18} />}
          variant="ai"
        />
        <MetricCard
          label="Days Remaining in Term"
          value={`${daysLeft} Days`}
          subValue={subscription ? `Renews on ${new Date(subscription.ends_at).toLocaleDateString()}` : 'Monthly rolling'}
          icon={<Calendar size={18} />}
        />
        <MetricCard
          label="AI Replies Quota"
          value={`${((usedReplies / pkg.ai_replies_limit) * 100).toFixed(0)}%`}
          subValue={`${usedReplies.toLocaleString()} of ${pkg.ai_replies_limit.toLocaleString()}`}
          icon={<Bot size={18} />}
        />
        <MetricCard
          label="Channel Slots"
          value={`${usedChannels} / ${pkg.channels_limit}`}
          subValue={`${pkg.channels_limit - usedChannels} slots available`}
          icon={<Layers size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Plan & Quota Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-4 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <Badge variant="ai" size="sm">Workspace Plan</Badge>
                </div>
                <CardDescription>{pkg.description}</CardDescription>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-text-primary tracking-tight">
                  ${pkg.price_monthly}
                  <span className="text-xs font-normal text-text-secondary">/mo</span>
                </div>
                <span className="text-[11px] text-text-tertiary">Billed monthly</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Usage Progress Meters */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Monthly Resource Usage
                </h4>

                {/* AI Replies meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-primary flex items-center gap-1.5">
                      <Bot size={13} className="text-brand" /> AI Replies Automated
                    </span>
                    <span className="font-semibold text-text-primary">
                      {usedReplies.toLocaleString()}{' '}
                      <span className="text-text-tertiary font-normal">/ {pkg.ai_replies_limit.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border/60">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min(100, (usedReplies / pkg.ai_replies_limit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Channels slots meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-primary flex items-center gap-1.5">
                      <Layers size={13} className="text-brand" /> Connected Channel Accounts
                    </span>
                    <span className="font-semibold text-text-primary">
                      {usedChannels} <span className="text-text-tertiary font-normal">/ {pkg.channels_limit} slots</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border/60">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min(100, (usedChannels / pkg.channels_limit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Included Plan Entitlements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <CheckCircle2 size={14} className="text-success shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/60">
              <span className="text-xs text-text-tertiary">
                {subscription?.status === 'active' ? 'Auto-renews at next billing cycle' : 'Plan will discontinue after current term'}
              </span>
              {subscription && subscription.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  loading={cancelling}
                  className="text-text-tertiary hover:text-error hover:bg-error/10 text-xs"
                >
                  Cancel Subscription
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Payment History Table */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle>Invoices & Payment History</CardTitle>
              <CardDescription>Download tax invoices and receipts for workspace expenses</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60 text-xs">
                {[
                  { id: 'INV-2025-003', date: 'Feb 1, 2025', amount: '$89.00', status: 'Paid', method: 'Visa •••• 4242' },
                  { id: 'INV-2025-002', date: 'Jan 1, 2025', amount: '$89.00', status: 'Paid', method: 'Visa •••• 4242' },
                  { id: 'INV-2024-001', date: 'Dec 1, 2024', amount: '$89.00', status: 'Paid', method: 'Visa •••• 4242' },
                ].map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-secondary border border-border">
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{inv.id}</div>
                        <div className="text-[11px] text-text-tertiary">{inv.date} • {inv.method}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-text-primary tabular-nums">{inv.amount}</span>
                      <Badge variant="success" size="sm">{inv.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Download Invoice">
                        <Download size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Rail: Payment Method & Support */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Payment Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm">Payment Method</CardTitle>
              <CardDescription>Primary card charged for renewals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-900 via-brand to-slate-900 border border-brand/20 text-white space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brand font-bold uppercase tracking-wider">Corporate Visa</span>
                  <CreditCard size={20} className="text-brand" />
                </div>
                <div className="font-mono text-base tracking-widest">
                  •••• •••• •••• 4242
                </div>
                <div className="flex items-center justify-between text-[11px] text-brand/80">
                  <span>Mohammed Al-Rashid</span>
                  <span>Exp 09/28</span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                Update Payment Details
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Support Callout */}
          <Card className="bg-gradient-to-br from-brand/10 via-surface to-brand/5 border-brand/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-brand">
                <Sparkles size={16} />
                <CardTitle className="text-sm">Need Custom SLA or Volume?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                For organizations managing over 50,000 monthly auto-replies, dedicated fine-tuned LLM models, and custom ERP integration, our Enterprise team is available 24/7.
              </p>
              <Button variant="secondary" size="sm" className="w-full" iconRight={<ArrowUpRight size={13} />}>
                Contact Enterprise Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
