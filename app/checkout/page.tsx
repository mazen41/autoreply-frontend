'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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

// Card brand detection
function detectCardBrand(number: string): 'visa' | 'mastercard' | 'mada' | 'unknown' {
  const cleaned = number.replace(/\D/g, '')
  
  if (/^4/.test(cleaned)) return 'visa'
  if (/^5[1-5]/.test(cleaned)) return 'mastercard'
  if (/^4[0-9]{12}/.test(cleaned) || /^6[0-9]{13}/.test(cleaned)) return 'mada'
  
  return 'unknown'
}

function getCardBrandIcon(brand: string) {
  const icons = {
    visa: '💳',
    mastercard: '💳',
    mada: '💳',
    unknown: '💳'
  }
  return icons[brand as keyof typeof icons] || '💳'
}

// Animated Card Component
function AnimatedCard({ number, name, expiry, cvc, isFlipped, brand }: {
  number: string
  name: string
  expiry: string
  cvc: string
  isFlipped: boolean
  brand: string
}) {
  const displayNumber = number.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim() || '•••• •••• •••• ••••'
  const displayName = name || 'YOUR NAME'
  const displayExpiry = expiry || '••/••'
  
  return (
    <motion.div
      className="relative w-full h-48 rounded-2xl cursor-pointer"
      style={{ perspective: 1000 }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 rounded-2xl" style={{ 
        transformStyle: 'preserve-3d',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Front of card */}
        <div className="absolute inset-0 rounded-2xl p-6" style={{
          transform: 'rotateY(0deg)',
          backfaceVisibility: 'hidden',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}>
          <div className="flex justify-between items-start mb-8">
            <div className="text-2xl">📱</div>
            <div className="text-xl font-bold" style={{ color: '#3B82F6' }}>
              {getCardBrandIcon(brand)}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              CARD NUMBER
            </div>
            <div className="text-xl font-mono tracking-wider" style={{ color: '#fff' }}>
              {displayNumber}
            </div>
          </div>
          
          <div className="flex justify-between">
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                CARDHOLDER
              </div>
              <div className="text-sm font-bold" style={{ color: '#fff' }}>
                {displayName.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                EXPIRES
              </div>
              <div className="text-sm font-bold" style={{ color: '#fff' }}>
                {displayExpiry}
              </div>
            </div>
          </div>
        </div>
        
        {/* Back of card */}
        <div className="absolute inset-0 rounded-2xl p-6" style={{
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}>
          <div className="w-full h-12 mb-6" style={{ background: 'rgba(0,0,0,0.3)' }} />
          <div className="mb-4">
            <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              CVC
            </div>
            <div className="text-xl font-mono" style={{ color: '#fff' }}>
              {cvc || '•••'}
            </div>
          </div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            This card is property of Naz Autoreply
          </div>
        </div>
      </div>
    </motion.div>
  )
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
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'mada' | 'unknown'>('unknown')
  const [isCardFlipped, setIsCardFlipped] = useState(false)

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

  // Card number formatting and brand detection
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16)
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim()
    setCardNumber(formatted)
    setCardBrand(detectCardBrand(cleaned))
    setFieldErrors(prev => ({ ...prev, cardNumber: '' }))
  }

  // Expiry formatting (MM/YY)
  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    let formatted = cleaned
    
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2)
    }
    
    setExpiry(formatted)
    setFieldErrors(prev => ({ ...prev, expiry: '' }))
  }

  // Field validation
  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {}
    
    if (field === 'cardNumber' || field === 'all') {
      const cleaned = cardNumber.replace(/\D/g, '')
      if (cleaned.length !== 16) {
        errors.cardNumber = isRTL ? 'رقم البطاقة يجب أن يكون 16 رقم' : 'Card number must be 16 digits'
      }
    }
    
    if (field === 'expiry' || field === 'all') {
      const cleaned = expiry.replace(/\D/g, '')
      if (cleaned.length !== 4) {
        errors.expiry = isRTL ? 'تاريخ الانتهاء غير صالح' : 'Invalid expiry date'
      } else {
        const month = parseInt(cleaned.slice(0, 2))
        const year = parseInt('20' + cleaned.slice(2))
        const now = new Date()
        const expiryDate = new Date(year, month - 1)
        
        if (month < 1 || month > 12) {
          errors.expiry = isRTL ? 'شهر غير صالح' : 'Invalid month'
        } else if (expiryDate < now) {
          errors.expiry = isRTL ? 'البطاقة منتهية' : 'Card has expired'
        }
      }
    }
    
    if (field === 'cvc' || field === 'all') {
      if (cvc.length !== 3) {
        errors.cvc = isRTL ? 'CVC يجب أن يكون 3 أرقام' : 'CVC must be 3 digits'
      }
    }
    
    if (field === 'cardholderName' || field === 'all') {
      if (cardholderName.trim().length < 2) {
        errors.cardholderName = isRTL ? 'الاسم مطلوب' : 'Name is required'
      }
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

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
    setError('')
    
    // Validate all fields
    if (!validateField('all', '')) {
      setError(isRTL ? 'يرجى تصحيح الأخطاء' : 'Please fix the errors')
      return
    }

    setProcessing(true)

    if (!pkg) return

    try {
      const token = getToken()
      if (!token) {
        router.push(`/login?redirect=/checkout?package=${packageId}&billing=${billingCycle}`)
        return
      }

      const [expiryMonth, expiryYear] = expiry.split('/').map(s => s.replace(/\D/g, ''))
      const fullYear = '20' + expiryYear

      const source = paymentMethod === 'card' 
        ? {
            type: 'creditcard',
            name: cardholderName,
            number: cardNumber.replace(/\D/g, ''),
            month: parseInt(expiryMonth),
            year: parseInt(fullYear),
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

      const redirectUrl = data?.source?.transaction_url
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else if (data?.id) {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/callback?id=${data.id}`
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mb-4"></div>
          <p style={{ color: '#F0F0FF' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p style={{ color: '#F0F0FF' }}>Package not found</p>
          <Link href="/pricing" className="mt-4 inline-block" style={{ color: '#3B82F6' }}>
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
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">
        <Link href="/pricing" className="inline-flex items-center gap-2 mb-8" style={{ color: '#3B82F6' }}>
          <span>{isRTL ? '→' : '←'}</span>
          <span>{t.common.back}</span>
        </Link>

        <h1 className="text-3xl font-black mb-8" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'إتمام الدفع' : 'Complete Payment'}
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6"
            style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: '#F0F0FF' }}>
              {isRTL ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            <div className="mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#F0F0FF' }}>{name}</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(240,240,255,0.6)' }}>{description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {billingCycle === 'yearly' ? t.pricing.annual : t.pricing.monthly}
                </span>
                <span className="font-bold" style={{ color: '#3B82F6' }}>
                  {formatPrice(price)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    billingCycle === 'monthly' ? 'ring-2 ring-[#3B82F6]' : ''
                  }`}
                  style={{
                    background: billingCycle === 'monthly' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                    color: billingCycle === 'monthly' ? '#3B82F6' : 'rgba(240,240,255,0.6)',
                  }}
                >
                  {t.pricing.monthly}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    billingCycle === 'yearly' ? 'ring-2 ring-[#3B82F6]' : ''
                  }`}
                  style={{
                    background: billingCycle === 'yearly' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                    color: billingCycle === 'yearly' ? '#3B82F6' : 'rgba(240,240,255,0.6)',
                  }}
                >
                  {t.pricing.annual}
                </button>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  <span style={{ color: '#3B82F6' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold" style={{ color: '#F0F0FF' }}>
                {isRTL ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-2xl font-black" style={{ color: '#3B82F6' }}>
                {formatPrice(price)}
              </span>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6"
            style={{ background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: '#F0F0FF' }}>
              {isRTL ? 'طريقة الدفع' : 'Payment Method'}
            </h2>

            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  paymentMethod === 'card' ? 'ring-2 ring-[#3B82F6]' : ''
                }`}
                style={{
                  background: paymentMethod === 'card' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                  color: paymentMethod === 'card' ? '#3B82F6' : '#F0F0FF',
                }}
              >
                {isRTL ? 'بطاقة ائتمان' : 'Credit Card'}
              </button>
              <button
                onClick={() => setPaymentMethod('applepay')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  paymentMethod === 'applepay' ? 'ring-2 ring-[#3B82F6]' : ''
                }`}
                style={{
                  background: paymentMethod === 'applepay' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                  color: paymentMethod === 'applepay' ? '#3B82F6' : '#F0F0FF',
                }}
              >
                Apple Pay
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <>
                {/* Animated Card */}
                <div className="mb-8">
                  <AnimatedCard
                    number={cardNumber}
                    name={cardholderName}
                    expiry={expiry}
                    cvc={cvc}
                    isFlipped={isCardFlipped}
                    brand={cardBrand}
                  />
                </div>

                <form onSubmit={handlePayment}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                        {isRTL ? 'رقم البطاقة' : 'Card Number'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          onBlur={() => validateField('cardNumber', cardNumber)}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-transparent"
                          style={{
                            border: fieldErrors.cardNumber ? '1px solid #FF6B6B' : '1px solid rgba(255,255,255,0.1)',
                            color: '#F0F0FF',
                          }}
                          placeholder="4242 4242 4242 4242"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                          {getCardBrandIcon(cardBrand)}
                        </div>
                      </div>
                      {fieldErrors.cardNumber && (
                        <div className="text-xs mt-1" style={{ color: '#FF6B6B' }}>
                          {fieldErrors.cardNumber}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                        {isRTL ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => {
                          setCardholderName(e.target.value)
                          setFieldErrors(prev => ({ ...prev, cardholderName: '' }))
                        }}
                        onBlur={() => validateField('cardholderName', cardholderName)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-transparent"
                        style={{
                          border: fieldErrors.cardholderName ? '1px solid #FF6B6B' : '1px solid rgba(255,255,255,0.1)',
                          color: '#F0F0FF',
                        }}
                        placeholder="John Doe"
                      />
                      {fieldErrors.cardholderName && (
                        <div className="text-xs mt-1" style={{ color: '#FF6B6B' }}>
                          {fieldErrors.cardholderName}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                          {isRTL ? 'تاريخ الانتهاء' : 'Expiry (MM/YY)'}
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          onBlur={() => validateField('expiry', expiry)}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-transparent"
                          style={{
                            border: fieldErrors.expiry ? '1px solid #FF6B6B' : '1px solid rgba(255,255,255,0.1)',
                            color: '#F0F0FF',
                          }}
                          placeholder="MM/YY"
                        />
                        {fieldErrors.expiry && (
                          <div className="text-xs mt-1" style={{ color: '#FF6B6B' }}>
                            {fieldErrors.expiry}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                          CVC
                        </label>
                        <input
                          type="text"
                          value={cvc}
                          onChange={(e) => {
                            setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))
                            setFieldErrors(prev => ({ ...prev, cvc: '' }))
                          }}
                          onFocus={() => setIsCardFlipped(true)}
                          onBlur={() => {
                            setIsCardFlipped(false)
                            validateField('cvc', cvc)
                          }}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-transparent"
                          style={{
                            border: fieldErrors.cvc ? '1px solid #FF6B6B' : '1px solid rgba(255,255,255,0.1)',
                            color: '#F0F0FF',
                          }}
                          placeholder="123"
                        />
                        {fieldErrors.cvc && (
                          <div className="text-xs mt-1" style={{ color: '#FF6B6B' }}>
                            {fieldErrors.cvc}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 rounded-xl text-sm"
                      style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full mt-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: processing ? 'rgba(59,130,246,0.3)' : 'var(--accent)',
                      color: '#FFFFFF',
                      opacity: processing ? 0.7 : 1,
                    }}
                  >
                    {processing ? (
                      <>
                        <span>⏳</span>
                        <span>{isRTL ? 'جاري المعالجة...' : 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>{isRTL ? 'ادفع الآن' : 'Pay Now'}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Trust Signals */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'rgba(240,240,255,0.4)' }}>
                    <span>🔒</span>
                    <span>{isRTL ? 'الدفع مشفر ومأمون' : 'Encrypted & Secure Payment'}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-6 rounded" style={{ background: '#1a1a71' }}>💳</div>
                    <div className="w-10 h-6 rounded" style={{ background: '#eb001b' }}>💳</div>
                    <div className="w-10 h-6 rounded" style={{ background: '#0079be' }}>💳</div>
                  </div>
                  <div className="text-xs text-center" style={{ color: 'rgba(240,240,255,0.4)' }}>
                    {isRTL ? 'مدعوم بواسطة Moyasar' : 'Powered by Moyasar'}
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  background: processing ? 'rgba(0,0,0,0.3)' : '#000',
                  color: '#FFF',
                  opacity: processing ? 0.7 : 1,
                }}
              >
                <span></span>
                <span>{isRTL ? 'ادفع بـ Apple Pay' : 'Pay with Apple Pay'}</span>
              </button>
            )}
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mb-4"></div>
          <p style={{ color: '#F0F0FF' }}>Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
