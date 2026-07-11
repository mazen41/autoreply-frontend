'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
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

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [packageId, setPackageId] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardholderName, setCardholderName] = useState('')
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
    } catch (error) {
      console.error('Failed to fetch package:', error)
      setError('Failed to load package details')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError('')

    if (!pkg) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push(`/login?redirect=/checkout?package=${packageId}&billing=${billingCycle}`)
        return
      }

      const source = paymentMethod === 'card' 
        ? {
            type: 'creditcard',
            name: cardholderName,
            number: cardNumber,
            month: parseInt(expiryMonth),
            year: parseInt(expiryYear),
            cvc: cvc,
          }
        : {
            type: 'applepay',
          }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          package_id: pkg.id,
          billing_cycle: billingCycle,
          source,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed')
      }

      // Redirect to Moyasar payment page
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Payment initiation failed')
      }
    } catch (error: any) {
      setError(error.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `${price} SAR`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFB2] mb-4"></div>
          <p style={{ color: '#F0F0FF' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <p style={{ color: '#F0F0FF' }}>Package not found</p>
          <Link href="/pricing" className="mt-4 inline-block" style={{ color: '#00FFB2' }}>
            Back to Pricing
          </Link>
        </div>
      </div>
    )
  }

  const name = isRTL ? pkg.name_ar : pkg.name
  const description = isRTL ? pkg.description_ar : pkg.description
  const features = isRTL ? pkg.features_ar : pkg.features
  const price = billingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: '#050508' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/pricing" className="inline-flex items-center gap-2 mb-8" style={{ color: '#00FFB2' }}>
          <span>{isRTL ? '→' : '←'}</span>
          <span>{t.common.back}</span>
        </Link>

        <h1 className="text-3xl font-black mb-8" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'إتمام الدفع' : 'Complete Payment'}
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
              {isRTL ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#F0F0FF' }}>{name}</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(240,240,255,0.6)' }}>{description}</p>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {billingCycle === 'yearly' ? t.pricing.annual : t.pricing.monthly}
                </span>
                <span className="font-bold" style={{ color: '#00FFB2' }}>
                  {formatPrice(price)}
                </span>
              </div>
            </div>

            <ul className="space-y-2 mb-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  <span style={{ color: '#00FFB2' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold" style={{ color: '#F0F0FF' }}>
                {isRTL ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-2xl font-black" style={{ color: '#00FFB2' }}>
                {formatPrice(price)}
              </span>
            </div>
          </div>

          {/* Payment Form */}
          <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
              {isRTL ? 'طريقة الدفع' : 'Payment Method'}
            </h2>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  paymentMethod === 'card' ? 'ring-2 ring-[#00FFB2]' : ''
                }`}
                style={{
                  background: paymentMethod === 'card' ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.05)',
                  color: paymentMethod === 'card' ? '#00FFB2' : '#F0F0FF',
                }}
              >
                {isRTL ? 'بطاقة ائتمان' : 'Credit Card'}
              </button>
              <button
                onClick={() => setPaymentMethod('applepay')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  paymentMethod === 'applepay' ? 'ring-2 ring-[#00FFB2]' : ''
                }`}
                style={{
                  background: paymentMethod === 'applepay' ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.05)',
                  color: paymentMethod === 'applepay' ? '#00FFB2' : '#F0F0FF',
                }}
              >
                Apple Pay
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <form onSubmit={handlePayment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                      {isRTL ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-transparent"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F0F0FF',
                      }}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                      {isRTL ? 'رقم البطاقة' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-transparent"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F0F0FF',
                      }}
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                        {isRTL ? 'شهر الانتهاء' : 'Expiry Month'}
                      </label>
                      <input
                        type="text"
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-transparent"
                        style={{
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#F0F0FF',
                        }}
                        placeholder="MM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                        {isRTL ? 'سنة الانتهاء' : 'Expiry Year'}
                      </label>
                      <input
                        type="text"
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-transparent"
                        style={{
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#F0F0FF',
                        }}
                        placeholder="YYYY"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-transparent"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F0F0FF',
                      }}
                      placeholder="123"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full mt-6 py-4 rounded-xl font-bold transition-all"
                  style={{
                    background: processing ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                    color: '#050508',
                    opacity: processing ? 0.7 : 1,
                  }}
                >
                  {processing ? (isRTL ? 'جاري المعالجة...' : 'Processing...') : (isRTL ? 'ادفع الآن' : 'Pay Now')}
                </button>
              </form>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  background: processing ? 'rgba(0,255,178,0.3)' : '#000',
                  color: '#FFF',
                  opacity: processing ? 0.7 : 1,
                }}
              >
                <span></span>
                <span>{isRTL ? 'ادفع بـ Apple Pay' : 'Pay with Apple Pay'}</span>
              </button>
            )}

            <p className="text-xs text-center mt-4" style={{ color: 'rgba(240,240,255,0.4)' }}>
              {isRTL ? 'الدفع آمن ومشفر بواسطة Moyasar' : 'Secure payment powered by Moyasar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFB2] mb-4"></div>
          <p style={{ color: '#F0F0FF' }}>Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
