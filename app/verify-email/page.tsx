'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useLang } from '../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function VerifyEmailContent() {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.errors?.otp?.[0] || (isRTL ? 'رمز التحقق غير صحيح.' : 'Invalid verification code.'))
      toast.success(isRTL ? 'تم تأكيد البريد الإلكتروني. سجّل الدخول.' : 'Email verified. Please log in.')
      window.location.href = `/login?email=${encodeURIComponent(email)}`
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'تعذر التحقق من البريد الإلكتروني.' : 'Verification failed.')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    setResending(true)

    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || (isRTL ? 'تعذر إعادة إرسال الرمز.' : 'Could not resend code.'))
      toast.success(data.message || (isRTL ? 'تم إرسال رمز التحقق.' : 'Verification code sent.'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'تعذر إعادة إرسال الرمز.' : 'Could not resend code.')
      setError(msg)
      toast.error(msg)
    } finally {
      setResending(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-8" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }}>
        <Link href="/" className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Naz</Link>
        <h1 className="mt-8 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{isRTL ? 'تأكيد بريدك الإلكتروني' : 'Verify your email'}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني.' : 'Enter the 6-digit code we sent to your email.'}</p>

        {error && <div className="mt-5 rounded-xl p-3 text-sm" style={{ color: 'var(--accent-pink)', border: '1px solid var(--accent-pink)', background: 'var(--accent-pink-subtle)' }}>{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
            <input className="w-full rounded-xl px-4 py-3 text-sm outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'رمز التحقق' : 'Code'}</label>
            <input className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} inputMode="numeric" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </div>
          <button disabled={loading} className="w-full rounded-xl py-3.5 text-sm font-bold btn-primary disabled:opacity-70" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>{loading ? (isRTL ? 'جارٍ التحقق...' : 'Verifying...') : (isRTL ? 'تأكيد البريد الإلكتروني' : 'Verify email')}</button>
        </form>

        <button type="button" onClick={resend} disabled={resending || !email} className="mt-4 w-full text-sm font-semibold disabled:opacity-60" style={{ color: 'var(--accent)' }}>{resending ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : (isRTL ? 'إعادة إرسال الرمز' : 'Resend code')}</button>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
