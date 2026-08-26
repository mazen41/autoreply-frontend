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
  const { isRTL } = useLang()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const pkgId = searchParams.get('package')
    const billing = searchParams.get('billing') as 'monthly' | 'yearly'
    if (!pkgId) { router.push('/pricing'); return }
    if (billing) setBillingCycle(billing)
    fetchPackage(parseInt(pkgId))
  }, [searchParams, router])

  const fetchPackage = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/${id}`)
      const data = await res.json()
      setPkg(data)
    } catch {
      setError('Failed to load package details')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError('')
    if (!pkg) return

    const token = getToken()
    if (!token) {
      router.push(`/login?redirect=/checkout?package=${pkg.id}&billing=${billingCycle}`)
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/myfatoorah/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ package_id: pkg.id, billing_cycle: billingCycle }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Payment initiation failed')

      // Redirect to MyFatoorah hosted payment page
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        throw new Error('No payment URL returned from server')
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) =>
    price === 0
      ? (isRTL ? 'مجاني' : 'Free')
      : `${price.toLocaleString()} SAR`

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mb-4" />
        <p style={{ color: 'var(--text-primary)' }}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    </div>
  )

  if (!pkg) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <p style={{ color: 'var(--text-primary)' }}>{isRTL ? 'الباقة غير موجودة' : 'Package not found'}</p>
        <Link href="/pricing" className="mt-4 inline-block" style={{ color: 'var(--accent)' }}>
          {isRTL ? 'العودة للأسعار' : 'Back to Pricing'}
        </Link>
      </div>
    </div>
  )

  const name        = isRTL ? pkg.name_ar       : pkg.name
  const description = isRTL ? pkg.description_ar : pkg.description
  const features    = isRTL ? pkg.features_ar    : pkg.features
  const price       = billingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto">

        <Link href="/pricing" className="inline-flex items-center gap-2 mb-8" style={{ color: 'var(--accent)' }}>
          <span>{isRTL ? '→' : '←'}</span>
          <span>{isRTL ? 'رجوع' : 'Back'}</span>
        </Link>

        <h1 className="text-3xl font-black mb-8" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'إتمام الدفع' : 'Complete Payment'}
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Order Summary ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{name}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{description}</p>

              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {billingCycle === 'yearly' ? (isRTL ? 'سنوي' : 'Annual') : (isRTL ? 'شهري' : 'Monthly')}
                </span>
                <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{formatPrice(price)}</span>
              </div>

              <div className="flex gap-2">
                {(['monthly', 'yearly'] as const).map(cycle => (
                  <button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: billingCycle === cycle ? 'var(--accent-subtle)' : 'var(--border)',
                      color:      billingCycle === cycle ? 'var(--accent)' : 'var(--text-secondary)',
                      outline:    billingCycle === cycle ? '2px solid var(--accent)' : 'none',
                    }}
                  >
                    {cycle === 'monthly' ? (isRTL ? 'شهري' : 'Monthly') : (isRTL ? 'سنوي' : 'Annual')}
                  </button>
                ))}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {features?.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {isRTL ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{formatPrice(price)}</span>
            </div>
          </motion.div>

          {/* ── Payment Panel ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'طريقة الدفع' : 'Payment'}
            </h2>

            {/* MyFatoorah badge */}
            <div className="flex items-center gap-3 rounded-xl p-4 mb-6" style={{ background: 'var(--border)' }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                MF
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>MyFatoorah</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL
                    ? 'بوابة دفع آمنة — Visa, Mastercard, مدى, Apple Pay'
                    : 'Secure checkout — Visa, Mastercard, Mada, Apple Pay'}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-6 flex-1">
              {[
                { icon: '🔐', en: "You'll be redirected to MyFatoorah's secure payment page", ar: 'ستنتقل إلى صفحة الدفع الآمنة من MyFatoorah' },
                { icon: '💳', en: 'Choose your preferred payment method and complete the payment', ar: 'اختر طريقة الدفع المفضلة وأكمل العملية' },
                { icon: '✅', en: "After payment you'll return to your dashboard automatically", ar: 'بعد الدفع ستعود تلقائياً إلى لوحة التحكم' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-lg mt-0.5">{step.icon}</span>
                  <span>{isRTL ? step.ar : step.en}</span>
                </div>
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl text-sm"
                style={{ background: 'var(--accent-subtle)', color: 'var(--error)' }}
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3"
              style={{
                background: processing ? 'var(--accent-focus)' : 'var(--accent)',
                color: '#fff',
                opacity: processing ? 0.75 : 1,
                cursor: processing ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? (
                <>
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>{isRTL ? 'جاري التحويل...' : 'Redirecting to MyFatoorah...'}</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span>{isRTL ? `ادفع ${formatPrice(price)} عبر MyFatoorah` : `Pay ${formatPrice(price)} via MyFatoorah`}</span>
                </>
              )}
            </button>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>🔒</span>
                <span>{isRTL ? 'الدفع مشفر ومأمون بواسطة MyFatoorah' : 'Encrypted & secure payment powered by MyFatoorah'}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {['Visa', 'Mastercard', 'Mada', 'Apple Pay'].map((m, i) => (
                  <React.Fragment key={m}>
                    {i > 0 && <span>·</span>}
                    <span>{m}</span>
                  </React.Fragment>
                ))}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
