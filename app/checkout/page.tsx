'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import Link from 'next/link'
import { motion } from 'framer-motion'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

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

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [packageId, setPackageId] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const pkgId = searchParams.get('package')
    const billing = searchParams.get('billing') as 'monthly' | 'yearly'

    if (pkgId) {
      setPackageId(parseInt(pkgId))
      if (billing) setBillingCycle(billing)
      fetchPackage(parseInt(pkgId))
    } else {
      router.push('/pricing')
    }
  }, [searchParams, router])

  const fetchPackage = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/${id}`)
      const data = await response.json()
      setPkg(data)
    } catch (err) {
      console.error('Failed to fetch package:', err)
      setError('Failed to load package details')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    setError('')

    if (!pkg) return

    const token = getToken()
    if (!token) {
      router.push(`/login?redirect=/checkout?package=${packageId}&billing=${billingCycle}`)
      return
    }

    setProcessing(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          package_id: pkg.id,
          billing_cycle: billingCycle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed')
      }

      // Redirect user to Paymob's hosted unified checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL returned from server')
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return price === 0 ? (isRTL ? 'مجاني' : 'Free') : `${price.toLocaleString()} EGP`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mb-4"></div>
          <p style={{ color: 'var(--text-primary)' }}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-primary)' }}>{isRTL ? 'الباقة غير موجودة' : 'Package not found'}</p>
          <Link href="/pricing" className="mt-4 inline-block" style={{ color: 'var(--accent)' }}>
            {isRTL ? 'العودة للأسعار' : 'Back to Pricing'}
          </Link>
        </div>
      </div>
    )
  }

  const name        = isRTL ? pkg.name_ar        : pkg.name
  const description = isRTL ? pkg.description_ar  : pkg.description
  const features    = isRTL ? pkg.features_ar     : pkg.features
  const price       = billingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link href="/pricing" className="inline-flex items-center gap-2 mb-8" style={{ color: 'var(--accent)' }}>
          <span>{isRTL ? '→' : '←'}</span>
          <span>{t.common?.back || (isRTL ? 'رجوع' : 'Back')}</span>
        </Link>

        <h1 className="text-3xl font-black mb-8" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'إتمام الدفع' : 'Complete Payment'}
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Order Summary ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            {/* Plan name & description */}
            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{name}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{description}</p>

              {/* Billing cycle toggle */}
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {billingCycle === 'yearly'
                    ? (isRTL ? 'سنوي' : 'Annual')
                    : (isRTL ? 'شهري' : 'Monthly')}
                </span>
                <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                  {formatPrice(price)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: billingCycle === 'monthly' ? 'var(--accent-subtle)' : 'var(--border)',
                    color:      billingCycle === 'monthly' ? 'var(--accent)' : 'var(--text-secondary)',
                    outline:    billingCycle === 'monthly' ? '2px solid var(--accent)' : 'none',
                  }}
                >
                  {isRTL ? 'شهري' : 'Monthly'}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: billingCycle === 'yearly' ? 'var(--accent-subtle)' : 'var(--border)',
                    color:      billingCycle === 'yearly' ? 'var(--accent)' : 'var(--text-secondary)',
                    outline:    billingCycle === 'yearly' ? '2px solid var(--accent)' : 'none',
                  }}
                >
                  {isRTL ? 'سنوي' : 'Annual'}
                </button>
              </div>
            </div>

            {/* Feature list */}
            <ul className="space-y-3 mb-6">
              {features?.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Total */}
            <div className="flex justify-between items-center pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {isRTL ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
                {formatPrice(price)}
              </span>
            </div>
          </motion.div>

          {/* ── Payment Panel ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'طريقة الدفع' : 'Payment'}
            </h2>

            {/* Paymob logo / badge */}
            <div
              className="flex items-center gap-3 rounded-xl p-4 mb-6"
              style={{ background: 'var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                P
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Paymob</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL
                    ? 'بوابة دفع آمنة — Visa, Mastercard, Meeza'
                    : 'Secure checkout — Visa, Mastercard, Meeza'}
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="space-y-3 mb-6 flex-1">
              {[
                {
                  icon: '🔐',
                  en: 'You\'ll be redirected to Paymob\'s secure payment page',
                  ar: 'ستنتقل إلى صفحة الدفع الآمنة من Paymob',
                },
                {
                  icon: '💳',
                  en: 'Enter your card details on Paymob\'s encrypted form',
                  ar: 'أدخل بيانات بطاقتك في نموذج Paymob المشفر',
                },
                {
                  icon: '✅',
                  en: 'After payment, you\'ll return to your dashboard automatically',
                  ar: 'بعد الدفع ستعود تلقائياً إلى لوحة التحكم',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-lg mt-0.5">{step.icon}</span>
                  <span>{isRTL ? step.ar : step.en}</span>
                </div>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl text-sm"
                style={{ background: 'var(--accent-subtle)', color: 'var(--error)' }}
              >
                {error}
              </motion.div>
            )}

            {/* Pay button */}
            <button
              id="paymob-pay-btn"
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3"
              style={{
                background: processing ? 'var(--accent-focus)' : 'var(--accent)',
                color:      '#fff',
                opacity:    processing ? 0.75 : 1,
                cursor:     processing ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? (
                <>
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>{isRTL ? 'جاري التحويل...' : 'Redirecting to Paymob...'}</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span>
                    {isRTL
                      ? `ادفع ${formatPrice(price)} عبر Paymob`
                      : `Pay ${formatPrice(price)} via Paymob`}
                  </span>
                </>
              )}
            </button>

            {/* Trust signals */}
            <div className="mt-5 space-y-2">
              <div
                className="flex items-center justify-center gap-2 text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <span>🔒</span>
                <span>
                  {isRTL
                    ? 'الدفع مشفر ومأمون بواسطة Paymob'
                    : 'Encrypted & secure payment powered by Paymob'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>Visa</span>
                <span>·</span>
                <span>Mastercard</span>
                <span>·</span>
                <span>Meeza</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mb-4"></div>
            <p style={{ color: 'var(--text-primary)' }}>Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
