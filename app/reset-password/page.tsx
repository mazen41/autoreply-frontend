'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useLang } from '../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function ResetPasswordContent() {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      setError(isRTL ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, otp, password, password_confirmation: passwordConfirmation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.errors?.otp?.[0] || (isRTL ? 'تعذر إعادة تعيين كلمة المرور.' : 'Could not reset password.'))
      toast.success(data.message)
      window.location.href = '/login'
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'تعذر إعادة تعيين كلمة المرور.' : 'Could not reset password.')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-8" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }}>
        <Link href="/" className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Naz</Link>
        <h1 className="mt-8 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset password'}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'أدخل الرمز المرسل إلى بريدك الإلكتروني واختر كلمة مرور جديدة.' : 'Use the code from your email and choose a new password.'}</p>

        {error && <div className="mt-5 rounded-xl p-3 text-sm" style={{ color: 'var(--accent-pink)', border: '1px solid var(--accent-pink)', background: 'var(--accent-pink-subtle)' }}>{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl px-4 py-3 text-sm outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} type="email" required placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'} value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} inputMode="numeric" maxLength={6} required placeholder={isRTL ? 'رمز التحقق' : 'Code'} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          <input className="w-full rounded-xl px-4 py-3 text-sm outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} type="password" required minLength={8} placeholder={isRTL ? 'كلمة المرور الجديدة' : 'New password'} value={password} onChange={e => setPassword(e.target.value)} />
          <input className="w-full rounded-xl px-4 py-3 text-sm outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} type="password" required minLength={8} placeholder={isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'} value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} />
          <button disabled={loading} className="w-full rounded-xl py-3.5 text-sm font-bold btn-primary disabled:opacity-70" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>{loading ? (isRTL ? 'جارٍ إعادة التعيين...' : 'Resetting...') : (isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset password')}</button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
