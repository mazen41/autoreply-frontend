'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'
import Link from 'next/link'

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
  features_ar: string[]
  is_popular: boolean
  is_active: boolean
  sort_order: number
}

interface Subscription {
  id: number
  user_id: number
  package_id: number
  status: string
  billing_cycle: string
  amount_paid: number
  moyasar_payment_id: string
  moyasar_invoice_id: string
  starts_at: string
  ends_at: string
  cancelled_at: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
  package: Package
}

export default function BillingPage() {
  const { t, isRTL } = useLang()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [packageDetails, setPackageDetails] = useState<Package | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to view billing')
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      setSubscription(data.subscription)
      setPackageDetails(data.package)
      setIsFree(data.is_free)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
      setError('Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm(isRTL ? 'هل أنت متأكد من إلغاء الاشتراك؟' : 'Are you sure you want to cancel your subscription?')) {
      return
    }

    setCancelling(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      fetchSubscription()
    } catch (error: any) {
      setError(error.message || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `${price} SAR`
  }

  const getLimitDisplay = (limit: number) => {
    return limit === -1 ? (isRTL ? 'غير محدود' : 'Unlimited') : limit.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  const pkg = packageDetails
  const name = pkg ? (isRTL ? pkg.name_ar : pkg.name) : ''
  const description = pkg ? (isRTL ? pkg.description_ar : pkg.description) : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#F0F0FF' }}>
          {t.nav.billing}
        </h1>
        {!isFree && subscription && (
          <button
            onClick={handleCancel}
            disabled={cancelling || subscription.status !== 'active'}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: cancelling || subscription.status !== 'active' 
                ? 'rgba(255,0,0,0.1)' 
                : 'rgba(255,0,0,0.2)',
              color: '#FF6B6B',
              opacity: cancelling || subscription.status !== 'active' ? 0.5 : 1,
            }}
          >
            {cancelling 
              ? (isRTL ? 'جاري الإلغاء...' : 'Cancelling...') 
              : (isRTL ? 'إلغاء الاشتراك' : 'Cancel Subscription')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {/* Current Plan */}
      <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'الباقة الحالية' : 'Current Plan'}
        </h2>

        {pkg && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: '#00FFB2' }}>{name}</h3>
                <p className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>{description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black" style={{ color: '#F0F0FF' }}>
                  {formatPrice(pkg.price_monthly)}
                </div>
                <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  /{t.pricing.monthly}
                </div>
              </div>
            </div>

            {subscription && subscription.status === 'active' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'تاريخ البدء' : 'Start Date'}
                  </div>
                  <div className="font-bold" style={{ color: '#F0F0FF' }}>
                    {formatDate(subscription.starts_at)}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'تاريخ الانتهاء' : 'End Date'}
                  </div>
                  <div className="font-bold" style={{ color: '#F0F0FF' }}>
                    {formatDate(subscription.ends_at)}
                  </div>
                </div>
              </div>
            )}

            {subscription && subscription.status === 'cancelled' && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)' }}>
                <div className="font-bold mb-1" style={{ color: '#FF6B6B' }}>
                  {isRTL ? 'الاشتراك ملغي' : 'Subscription Cancelled'}
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,107,107,0.8)' }}>
                  {isRTL ? 'سيستمر الوصول حتى' : 'Access continues until'} {formatDate(subscription.ends_at)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage */}
      {pkg && (
        <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'الاستخدام' : 'Usage'}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'ردود الذكاء الاصطناعي' : 'AI Replies'}
              </span>
              <span className="font-bold" style={{ color: '#F0F0FF' }}>
                {getLimitDisplay(pkg.ai_replies_limit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'القنوات' : 'Channels'}
              </span>
              <span className="font-bold" style={{ color: '#F0F0FF' }}>
                {getLimitDisplay(pkg.channels_limit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الأدوات' : 'Tools'}
              </span>
              <span className="font-bold" style={{ color: '#F0F0FF' }}>
                {getLimitDisplay(pkg.tools_limit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'مقالات المدونة' : 'Blog Posts'}
              </span>
              <span className="font-bold" style={{ color: '#F0F0FF' }}>
                {getLimitDisplay(pkg.blog_posts_limit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {isFree && (
        <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(0,255,178,0.1), rgba(191,0,255,0.1))' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'ترقية الباقة' : 'Upgrade Your Plan'}
          </h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL 
              ? 'احصل على المزيد من المميزات والردود غير المحدودة' 
              : 'Get more features and unlimited replies'}
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
              color: '#050508',
            }}
          >
            {isRTL ? 'عرض الباقات' : 'View Plans'}
          </Link>
        </div>
      )}

      {/* Payment History */}
      {subscription && (
        <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'سجل الدفعات' : 'Payment History'}
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div>
                <div className="font-bold" style={{ color: '#F0F0FF' }}>
                  {isRTL ? 'اشتراك' : 'Subscription'} - {name}
                </div>
                <div className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {formatDate(subscription.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: '#00FFB2' }}>
                  {formatPrice(subscription.amount_paid)}
                </div>
                <div className="text-sm" style={{ color: subscription.status === 'active' ? '#00FFB2' : '#FF6B6B' }}>
                  {subscription.status === 'active' 
                    ? (isRTL ? 'مدفوع' : 'Paid') 
                    : (isRTL ? 'ملغي' : 'Cancelled')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
