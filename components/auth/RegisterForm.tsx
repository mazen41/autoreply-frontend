'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'

export default function RegisterForm() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const packageId = searchParams.get('package')
  const billingCycle = searchParams.get('billing')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError(t.auth.passwordsMismatch)
      return
    }
    if (form.password.length < 8) {
      setError(t.auth.invalidPassword)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.confirm,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || t.auth.registerError)
      document.cookie = `naz_token=${data.token}; path=/; max-age=604800; SameSite=Lax`
      toast.success(t.auth.registerSuccess)
      
      // Determine redirect after registration - always go to onboarding first
      let redirectUrl = redirectTo
      if (!redirectUrl) {
        // Build onboarding URL with package/billing params if present
        const params = new URLSearchParams()
        if (packageId) params.set('package', packageId)
        if (billingCycle) params.set('billing', billingCycle)
        const queryString = params.toString()
        redirectUrl = `/onboarding${queryString ? `?${queryString}` : ''}`
      }
      window.location.href = redirectUrl
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.auth.registerError
      setError(msg.includes('abort') || msg.includes('fetch') ? (isRTL ? 'تعذر الاتصال بالخادم. تأكد أن الـ backend يعمل.' : 'Cannot connect to server. Make sure the backend is running.') : msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name',     label: t.auth.name,     type: 'text',     ph: isRTL ? 'محمد أحمد' : 'John Smith' },
    { key: 'email',    label: t.auth.email,    type: 'email',    ph: 'you@example.com' },
    { key: 'password', label: t.auth.password, type: showPass ? 'text' : 'password', ph: '••••••••' },
    { key: 'confirm',  label: t.auth.confirmPassword, type: showPass ? 'text' : 'password', ph: '••••••••' },
  ]

  return (
    <div className="w-full">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 justify-center mb-8 lg:hidden">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.7))' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span className="text-2xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: 'var(--accent)' }}>
            {t.auth.register.toUpperCase()}
          </span>
        </div>
        <h1 className="font-black mb-1.5" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          {isRTL ? 'ابدأ رحلتك.' : 'Start your journey.'}
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'أنشئ حسابك وفعّل موظفك الذكي في دقائق.' : 'Create your account and activate your AI in minutes.'}
        </p>
      </motion.div>

      {/* Social Login Buttons */}
      <SocialLoginButtons 
        redirectTo={redirectTo || undefined}
        packageId={packageId || undefined}
        billingCycle={billingCycle || undefined}
      />

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-5 p-3.5 rounded-xl text-sm text-center"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--error)' }}>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, ph }, i) => (
          <motion.div key={key}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.07, duration: 0.4 }}>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {label}
            </label>
            <div className="relative">
              <input
                type={type} required
                value={form[key as keyof typeof form]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              {(key === 'password' || key === 'confirm') && (
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute top-1/2 -translate-y-1/2 text-xs"
                  style={{ [isRTL ? 'left' : 'right']: 14, color: 'rgba(255,255,255,0.3)' }}>
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Password strength hint */}
        {form.password.length > 0 && (
          <div className="flex items-center gap-2">
            {[1,2,3,4].map(lvl => (
              <div key={lvl} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: form.password.length >= lvl * 3
                    ? (lvl <= 2 ? 'rgba(245,158,11,0.6)' : 'var(--success)')
                    : 'rgba(255,255,255,0.08)',
                }} />
            ))}
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {form.password.length < 6 ? (isRTL ? 'ضعيفة' : 'Weak')
                : form.password.length < 10 ? (isRTL ? 'متوسطة' : 'Fair')
                : (isRTL ? 'قوية' : 'Strong')}
            </span>
          </div>
        )}

        {/* Submit */}
        <motion.button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-2"
          style={{
            background: loading ? 'rgba(59,130,246,0.5)' : 'var(--accent)',
            color: theme === 'dark' ? '#0A0A0F' : '#F4F4FF',
          }}
          whileHover={!loading ? { scale: 1.015 } : {}}
          whileTap={!loading ? { scale: 0.985 } : {}}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}>
          {loading && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          )}
          {loading ? (isRTL ? 'جاري إنشاء الحساب...' : 'Creating account...')
            : t.auth.signUp}
        </motion.button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { icon: '🔒', t: isRTL ? 'آمن' : 'Secure' },
            { icon: '✅', t: isRTL ? '14 يوم مجاني' : '14 days free' },
            { icon: '⚡', t: isRTL ? 'جاهز فوراً' : 'Instant setup' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: 10 }}>{b.icon}</span>{b.t}
            </div>
          ))}
        </div>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
        {t.auth.hasAccount}{' '}
        <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  )
}
