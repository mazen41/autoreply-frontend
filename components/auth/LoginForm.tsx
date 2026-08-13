'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'

type LoginField = 'email' | 'password'

type FieldMeta = {
  key: LoginField
  label: string
  type: string
  ph: string
  autoComplete: string
  icon: 'mail' | 'lock'
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const shakeTransition = { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }

function FieldIcon({ type }: { type: 'mail' | 'lock' }) {
  if (type === 'mail') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    )
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function LoginForm() {
  const { isRTL, t } = useLang()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [form, setForm] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState<Record<LoginField, boolean>>({ email: false, password: false })
  const [loading, setLoading] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const requiredMessage = isRTL ? 'هذا الحقل مطلوب' : 'This field is required'
  const invalidEmailMessage = isRTL ? 'أدخل بريدًا إلكترونيًا صالحًا' : 'Enter a valid email address'

  const validateField = (field: LoginField, value = form[field]) => {
    if (!value.trim()) return requiredMessage
    if (field === 'email' && !emailPattern.test(value)) return invalidEmailMessage
    return ''
  }

  const fieldErrors: Record<LoginField, string> = {
    email: touched.email ? validateField('email') : '',
    password: touched.password ? validateField('password') : '',
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_failed') {
      setError(t.auth.authFailed)
      toast.error(t.auth.authFailed)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [t.auth.authFailed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({ email: true, password: true })
    const nextErrors = [validateField('email'), validateField('password')].filter(Boolean)
    if (nextErrors.length) {
      setError(nextErrors[0])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || t.auth.loginError)

      if (!data.token) throw new Error(t.auth.loginError)

      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
      const secure = window.location.protocol === 'https:' ? '; secure' : ''
      document.cookie = `naz_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax${secure}`

      toast.success(t.auth.loginSuccess)
      setSuccessPulse(true)
      await new Promise(resolve => setTimeout(resolve, 400))
      if (redirectTo) {
        window.location.href = redirectTo
      } else if (data.user?.onboarding_completed === false) {
        window.location.href = '/onboarding'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.auth.loginError
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
      setSuccessPulse(false)
    }
  }

  const fields: FieldMeta[] = [
    { key: 'email', label: t.auth.email, type: 'email', ph: 'you@example.com', autoComplete: 'email', icon: 'mail' },
    { key: 'password', label: t.auth.password, type: showPass ? 'text' : 'password', ph: '••••••••', autoComplete: 'current-password', icon: 'lock' },
  ]

  return (
    <motion.div className="relative w-full overflow-hidden rounded-2xl p-5 sm:p-7 premium-card" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }} initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
      <div className="absolute inset-0 pointer-events-none lg:hidden" style={{ backgroundImage: 'radial-gradient(circle at 15% 12%, var(--accent-subtle) 0%, transparent 35%), radial-gradient(circle at 88% 8%, var(--accent-secondary-subtle) 0%, transparent 28%), linear-gradient(var(--accent-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--accent-subtle) 1px, transparent 1px)', backgroundSize: '100% 100%, 100% 100%, 34px 34px, 34px 34px', opacity: 0.55 }} />
      <div className="relative z-10">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8 lg:hidden rounded-xl focus-visible:outline-none focus-visible:ring-2" style={{ '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--accent-focus))' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span className="text-2xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
            <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
            <span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: 'var(--accent)' }}>{t.auth.login.toUpperCase()}</span>
          </div>
          <h1 className="font-black mb-1.5" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{t.auth.welcomeBack}.</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>{t.auth.loginToAccess}</p>
        </motion.div>

        <SocialLoginButtons redirectTo={redirectTo || undefined} />

        <AnimatePresence>
          {error && (
            <motion.div key="login-error" initial={{ opacity: 0, scale: 0.96, x: 0 }} animate={{ opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }} exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={shakeTransition} className="mb-5 p-3.5 rounded-xl text-sm text-center" style={{ background: 'var(--accent-pink-subtle)', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, ph, autoComplete, icon }, i) => {
            const message = fieldErrors[key]
            const describedBy = message ? `${key}-error` : undefined
            const hasTrailingButton = key === 'password'
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1, x: message ? [0, -7, 7, -5, 5, 0] : 0 }} transition={{ delay: 0.12 + i * 0.12, duration: message ? 0.3 : 0.45 }}>
                <label htmlFor={`login-${key}`} className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <div className="relative">
                  <span className="absolute top-1/2 -translate-y-1/2 pointer-events-none" style={{ [isRTL ? 'right' : 'left']: 14, color: 'var(--text-tertiary)' }}><FieldIcon type={icon} /></span>
                  <input id={`login-${key}`} type={type} required autoComplete={autoComplete} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} onBlur={e => { setTouched({ ...touched, [key]: true }) }} placeholder={ph} aria-invalid={!!message} aria-describedby={describedBy} className="w-full py-3 rounded-xl text-sm outline-none transition-all duration-200 input-modern" style={{ paddingInlineStart: 42, paddingInlineEnd: hasTrailingButton ? 44 : 16, background: 'var(--surface-elevated)', border: message ? '1px solid var(--accent-pink)' : '1px solid var(--border)' }} />
                  {key === 'password' && (<button type="button" onClick={() => setShowPass(s => !s)} className="absolute top-1/2 -translate-y-1/2 text-xs transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2" style={{ [isRTL ? 'left' : 'right']: 14, color: 'var(--text-tertiary)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties} aria-label={showPass ? 'Hide password' : 'Show password'}><EyeIcon hidden={showPass} /></button>)}
                </div>
                <AnimatePresence>{message && <motion.p id={`${key}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1.5 text-xs" style={{ color: 'var(--accent-pink)' }}>{message}</motion.p>}</AnimatePresence>
              </motion.div>
            )
          })}

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="login-remember" className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input id="login-remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 rounded focus-visible:outline-none focus-visible:ring-2" style={{ accentColor: 'var(--accent)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties} />
              <span>{isRTL ? 'تذكرني' : 'Remember me'}</span>
            </label>
            <Link href="/forgot-password" className="text-xs font-medium hover:underline rounded focus-visible:outline-none focus-visible:ring-2" style={{ color: 'var(--accent)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties}>{t.auth.forgotPassword}</Link>
          </div>

          <motion.button type="submit" disabled={loading || successPulse} className="group relative overflow-hidden w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 btn-primary disabled:opacity-70 disabled:cursor-not-allowed" style={{ background: loading || successPulse ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--on-accent-text)' }} whileHover={!loading && !successPulse ? { scale: 1.015 } : {}} whileTap={!loading && !successPulse ? { scale: 0.985 } : {}} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.42, duration: 0.45 }}>
            <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-40" style={{ background: 'linear-gradient(90deg, transparent, var(--on-accent-text), transparent)' }} />
            {successPulse ? <CheckIcon /> : loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>}
            {successPulse ? (isRTL ? 'تم' : 'Success') : loading ? (isRTL ? t.auth.signingIn : t.auth.signingInEn) : t.auth.signIn}
          </motion.button>
        </form>

        <p className="text-center text-sm mt-7" style={{ color: 'var(--text-secondary)' }}>{t.auth.noAccount}{' '}<Link href="/register" className="font-bold hover:underline rounded focus-visible:outline-none focus-visible:ring-2" style={{ color: 'var(--accent)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties}>{t.auth.signUp}</Link></p>
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text-secondary)' }}>{`${t.auth.byContinuing} `}<span className="underline cursor-pointer" style={{ color: 'var(--text-secondary)' }}>{t.auth.termsPrivacy}</span></p>
      </div>
    </motion.div>
  )
}
