'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLang } from '../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ForgotPasswordPage() {
  const { isRTL } = useLang()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || (isRTL ? 'تعذر إرسال رمز إعادة التعيين.' : 'Could not send reset code.'))
      toast.success(data.message)
      window.location.href = `/reset-password?email=${encodeURIComponent(email)}`
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'تعذر إرسال رمز إعادة التعيين.' : 'Could not send reset code.')
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
        <h1 className="mt-8 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password'}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'أدخل بريدك الإلكتروني وسنرسل رمز إعادة التعيين إذا كان الحساب موجوداً.' : 'Enter your email and we will send a reset code if the account exists.'}</p>

        {error && <div className="mt-5 rounded-xl p-3 text-sm" style={{ color: 'var(--accent-pink)', border: '1px solid var(--accent-pink)', background: 'var(--accent-pink-subtle)' }}>{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
            <input className="w-full rounded-xl px-4 py-3 text-sm outline-none input-modern" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }} type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full rounded-xl py-3.5 text-sm font-bold btn-primary disabled:opacity-70" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>{loading ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : (isRTL ? 'إرسال رمز إعادة التعيين' : 'Send reset code')}</button>
        </form>

        <Link href="/login" className="mt-5 block text-center text-sm font-semibold" style={{ color: 'var(--accent)' }}>{isRTL ? 'العودة إلى تسجيل الدخول' : 'Back to login'}</Link>
      </div>
    </div>
  )
}
