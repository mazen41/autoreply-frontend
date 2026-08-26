'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../../lib/LangContext'
import Link from 'next/link'
import { motion } from 'framer-motion'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const { isRTL } = useLang()

  useEffect(() => {
    // Notify backend so the PaymentIntent is marked failed
    const paymentId = searchParams.get('paymentId') ?? searchParams.get('Id')
    if (!paymentId) return
    const token = getToken()
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/payment/error?paymentId=${paymentId}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    ).catch(() => {})
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full rounded-2xl p-10 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-7xl mb-6">💳</div>

        <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--error, #ef4444)' }}>
          {isRTL ? 'لم يكتمل الدفع' : 'Payment Not Completed'}
        </h1>

        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {isRTL
            ? 'تم إلغاء عملية الدفع أو فشلت. يمكنك المحاولة مرة أخرى في أي وقت.'
            : 'Your payment was cancelled or failed. You can try again at any time.'}
        </p>

        <div className="space-y-3 mb-8 text-sm text-start rounded-xl p-4" style={{ background: 'var(--border)' }}>
          {[
            { icon: '🔄', en: 'Your account has not been charged', ar: 'لم يتم خصم أي مبلغ من حسابك' },
            { icon: '🔒', en: 'Your payment details are safe', ar: 'بيانات الدفع الخاصة بك آمنة' },
            { icon: '📞', en: 'Contact support if you need help', ar: 'تواصل مع الدعم إذا كنت بحاجة لمساعدة' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <span>{item.icon}</span>
              <span>{isRTL ? item.ar : item.en}</span>
            </div>
          ))}
        </div>

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
          <Link
            href="mailto:support@nazbiz.io"
            className="text-xs mt-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {isRTL ? 'تواصل مع الدعم: support@nazbiz.io' : 'Contact support: support@nazbiz.io'}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
