'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'
import Link from 'next/link'
import { motion } from 'framer-motion'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

type Status = 'verifying' | 'processing' | 'success' | 'failed' | 'error'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isRTL } = useLang()
  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // MyFatoorah returns ?paymentId=... or ?Id=... in the query string
    const centralPaymentId = searchParams.get('central_payment_id')
    const paymentId = searchParams.get('paymentId') ?? searchParams.get('Id')

    if (centralPaymentId) {
      verifyCentralPayment(centralPaymentId)
      return
    }

    if (!paymentId) {
      setStatus('error')
      setMessage(isRTL ? 'معرّف الدفع مفقود' : 'Missing payment identifier')
      return
    }

    verifyPayment(paymentId)
  }, [searchParams])

  const verifyPayment = async (paymentId: string) => {
    try {
      const token = getToken()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/callback?paymentId=${paymentId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      const data = await res.json()

      if (res.ok && data.message?.toLowerCase().includes('activated')) {
        setStatus('success')
        setMessage(data.message)
        // Redirect to dashboard after 3 s
        setTimeout(() => router.push('/dashboard'), 3000)
      } else {
        setStatus('failed')
        setMessage(data.message || (isRTL ? 'لم يكتمل الدفع' : 'Payment not completed'))
      }
    } catch {
      setStatus('error')
      setMessage(isRTL ? 'خطأ في التحقق من الدفع' : 'Error verifying payment')
    }
  }

  const verifyCentralPayment = async (centralPaymentId: string) => {
    const token = getToken()
    if (!token) {
      setStatus('error')
      setMessage(isRTL ? 'سجّل الدخول للتحقق من حالة الدفع.' : 'Sign in to verify your payment status.')
      return
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payment/central-status/${encodeURIComponent(centralPaymentId)}`,
          { headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() }, cache: 'no-store' }
        )
        const data = await response.json()
        if (response.status === 404) {
          setStatus('error')
          setMessage(data.message || (isRTL ? 'لم يتم العثور على عملية الدفع.' : 'Payment was not found.'))
          return
        }
        if (data.status === 'completed') {
          setStatus('success')
          setMessage(isRTL ? 'تم التحقق من الدفع وتفعيل الاشتراك.' : 'Payment verified and subscription activated.')
          setTimeout(() => router.push('/dashboard'), 3000)
          return
        }
        if (data.status === 'failed') {
          setStatus('failed')
          setMessage(isRTL ? 'لم يكتمل الدفع. يمكنك المحاولة مرة أخرى.' : 'Payment was not completed. You can try again.')
          return
        }
      } catch {
        // Keep polling. A temporary response failure must not turn a paid
        // checkout into a false failure screen.
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setStatus('processing')
    setMessage(isRTL
      ? 'استلمنا نتيجة الدفع ونعمل على تفعيل اشتراكك. أعد تحميل الصفحة بعد قليل.'
      : 'We received the payment result and are activating your subscription. Refresh this page shortly.')
  }

  const config = {
    verifying: {
      icon: (
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent)] border-t-transparent mb-6" />
      ),
      title: isRTL ? 'جاري التحقق من الدفع...' : 'Verifying payment...',
      subtitle: isRTL ? 'يرجى الانتظار، لا تغلق هذه الصفحة' : 'Please wait, do not close this page',
      color: 'var(--accent)',
    },
    processing: {
      icon: <div className="text-7xl mb-6">⏳</div>,
      title: isRTL ? 'جارٍ تأكيد الاشتراك' : 'Subscription confirmation pending',
      subtitle: message,
      color: 'var(--accent)',
    },
    success: {
      icon: <div className="text-7xl mb-6">✅</div>,
      title: isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!',
      subtitle: isRTL ? 'تم تفعيل اشتراكك. سيتم تحويلك إلى لوحة التحكم...' : 'Your subscription is active. Redirecting to dashboard...',
      color: '#22c55e',
    },
    failed: {
      icon: <div className="text-7xl mb-6">❌</div>,
      title: isRTL ? 'لم يكتمل الدفع' : 'Payment Not Completed',
      subtitle: message,
      color: 'var(--error, #ef4444)',
    },
    error: {
      icon: <div className="text-7xl mb-6">⚠️</div>,
      title: isRTL ? 'حدث خطأ' : 'Something went wrong',
      subtitle: message,
      color: 'var(--error, #ef4444)',
    },
  }

  const cfg = config[status]

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full rounded-2xl p-10 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {cfg.icon}

        <h1 className="text-2xl font-black mb-3" style={{ color: cfg.color }}>
          {cfg.title}
        </h1>

        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {cfg.subtitle}
        </p>

        {status === 'success' && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: '#22c55e' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </div>
        )}

        {(status === 'failed' || status === 'error') && (
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="w-full py-3 rounded-xl font-bold text-sm text-center"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {isRTL ? 'حاول مرة أخرى' : 'Try Again'}
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-3 rounded-xl font-bold text-sm text-center"
              style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {isRTL ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
