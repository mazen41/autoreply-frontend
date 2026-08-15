'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'

type RegisterField = 'name' | 'email' | 'password' | 'confirm'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const shakeTransition = { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }

function Icon({ type }: { type: 'user' | 'mail' | 'lock' }) {
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'user') return <svg {...common}><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
  if (type === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
  return <svg {...common}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
}

function CheckIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
}

export default function RegisterForm() {
  const { isRTL, t } = useLang()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const packageId = searchParams.get('package')
  const billingCycle = searchParams.get('billing')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState<Record<RegisterField | 'terms', boolean>>({ name: false, email: false, password: false, confirm: false, terms: false })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const requiredMessage = isRTL ? 'هذا الحقل مطلوب' : 'This field is required'
  const invalidEmailMessage = isRTL ? 'أدخل بريدًا إلكترونيًا صالحًا' : 'Enter a valid email address'
  const termsMessage = isRTL ? 'يجب الموافقة على الشروط وسياسة الخصوصية' : 'You must agree to the Terms and Privacy Policy'

  const strengthChecks = [form.password.length >= 8, /[A-Z]/.test(form.password), /[a-z]/.test(form.password), /\d/.test(form.password), /[^A-Za-z0-9]/.test(form.password)]
  const strengthScore = strengthChecks.filter(Boolean).length
  const strengthLevel = Math.min(4, Math.ceil((strengthScore / 5) * 4))
  const strengthColor = strengthLevel <= 1 ? 'var(--error)' : strengthLevel <= 3 ? 'var(--warning)' : 'var(--success)'
  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm
  const confirmMismatch = form.confirm.length > 0 && form.password !== form.confirm

  const validateField = (field: RegisterField, value = form[field]) => {
    if (!value.trim()) return requiredMessage
    if (field === 'email' && !emailPattern.test(value)) return invalidEmailMessage
    if (field === 'password' && form.password.length < 8) return t.auth.invalidPassword
    if (field === 'confirm' && form.password !== form.confirm) return t.auth.passwordsMismatch
    return ''
  }

  const fieldErrors = {
    name: touched.name ? validateField('name') : '',
    email: touched.email ? validateField('email') : '',
    password: touched.password ? validateField('password') : '',
    confirm: touched.confirm ? validateField('confirm') : '',
  }
  const termsError = touched.terms && !termsAccepted ? termsMessage : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true })
    const nextErrors = [validateField('name'), validateField('email'), validateField('password'), validateField('confirm'), termsAccepted ? '' : termsMessage].filter(Boolean)
    if (nextErrors.length) {
      setError(nextErrors[0])
      return
    }
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
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, password_confirmation: form.confirm }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || t.auth.registerError)
      toast.success(t.auth.registerSuccess)
      setSuccessPulse(true)
      await new Promise(resolve => setTimeout(resolve, 400))

      const params = new URLSearchParams()
      params.set('email', form.email)
      if (redirectTo) params.set('redirect', redirectTo)
      if (packageId) params.set('package', packageId)
      if (billingCycle) params.set('billing', billingCycle)
      window.location.href = `/verify-email?${params.toString()}`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.auth.registerError
      setError(msg.includes('abort') || msg.includes('fetch') ? (isRTL ? 'تعذر الاتصال بالخادم. تأكد أن الـ backend يعمل.' : 'Cannot connect to server. Make sure the backend is running.') : msg)
      toast.error(msg)
    } finally {
      setLoading(false)
      setSuccessPulse(false)
    }
  }

  const fields = [
    { key: 'name' as const, label: t.auth.name, type: 'text', ph: isRTL ? 'محمد أحمد' : 'John Smith', autoComplete: 'name', icon: 'user' as const },
    { key: 'email' as const, label: t.auth.email, type: 'email', ph: 'you@example.com', autoComplete: 'email', icon: 'mail' as const },
    { key: 'password' as const, label: t.auth.password, type: showPass ? 'text' : 'password', ph: '••••••••', autoComplete: 'new-password', icon: 'lock' as const },
    { key: 'confirm' as const, label: t.auth.confirmPassword, type: showConfirm ? 'text' : 'password', ph: '••••••••', autoComplete: 'new-password', icon: 'lock' as const },
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
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: 'var(--accent)' }}>{t.auth.register.toUpperCase()}</span></div>
          <h1 className="font-black mb-1.5" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{t.auth.startJourney}.</h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>{isRTL ? t.auth.createAccountActivate : t.auth.createAccountActivateEn}</p>
        </motion.div>

        <SocialLoginButtons redirectTo={redirectTo || undefined} packageId={packageId || undefined} billingCycle={billingCycle || undefined} />

        <AnimatePresence>{error && <motion.div key="register-error" initial={{ opacity: 0, scale: 0.96, x: 0 }} animate={{ opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }} exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={shakeTransition} className="mb-5 p-3.5 rounded-xl text-sm text-center" style={{ background: 'var(--accent-pink-subtle)', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)' }}>{error}</motion.div>}</AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, ph, autoComplete, icon }, i) => {
            const message = fieldErrors[key]
            const hasToggle = key === 'password' || key === 'confirm'
            return <motion.div key={key} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1, x: message ? [0, -7, 7, -5, 5, 0] : 0 }} transition={{ delay: 0.1 + i * 0.12, duration: message ? 0.3 : 0.45 }}>
              <label htmlFor={`register-${key}`} className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <div className="relative">
                <span className="absolute top-1/2 -translate-y-1/2 pointer-events-none" style={{ [isRTL ? 'right' : 'left']: 14, color: 'var(--text-tertiary)' }}><Icon type={icon} /></span>
                <input id={`register-${key}`} type={type} required autoComplete={autoComplete} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} onBlur={e => { setTouched({ ...touched, [key]: true }) }} placeholder={ph} aria-invalid={!!message} aria-describedby={message ? `register-${key}-error` : undefined} className="w-full py-3 rounded-xl text-sm outline-none transition-all duration-200 input-modern" style={{ background: 'var(--surface-elevated)', paddingInlineStart: 42, paddingInlineEnd: hasToggle ? 44 : 16, border: message ? '1px solid var(--accent-pink)' : '1px solid var(--border)' }} />
                {key === 'password' && <button type="button" onClick={() => setShowPass(s => !s)} className="absolute top-1/2 -translate-y-1/2 text-xs rounded-md focus-visible:outline-none focus-visible:ring-2" style={{ [isRTL ? 'left' : 'right']: 14, color: 'var(--text-tertiary)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties} aria-label={showPass ? 'Hide password' : 'Show password'}><EyeIcon hidden={showPass} /></button>}
                {key === 'confirm' && <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute top-1/2 -translate-y-1/2 text-xs rounded-md focus-visible:outline-none focus-visible:ring-2" style={{ [isRTL ? 'left' : 'right']: 14, color: 'var(--text-tertiary)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties} aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}><EyeIcon hidden={showConfirm} /></button>}
              </div>
              <AnimatePresence>{message && <motion.p id={`register-${key}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1.5 text-xs" style={{ color: 'var(--accent-pink)' }}>{message}</motion.p>}</AnimatePresence>
            </motion.div>
          })}

          {form.password.length > 0 && <div className="flex items-center gap-2" aria-live="polite">{[1, 2, 3, 4].map(lvl => <div key={lvl} className="flex-1 h-1.5 rounded-full transition-all duration-300" style={{ background: lvl <= strengthLevel ? strengthColor : 'var(--border)' }} />)}<span className="text-[10px]" style={{ color: strengthColor }}>{strengthLevel <= 1 ? t.auth.passwordWeak : strengthLevel < 4 ? t.auth.passwordFair : t.auth.passwordStrong}</span></div>}

          {form.confirm.length > 0 && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium" style={{ color: passwordsMatch ? 'var(--accent)' : 'var(--accent-pink)' }}>{passwordsMatch ? (isRTL ? '✓ كلمات المرور متطابقة' : '✓ Passwords match') : confirmMismatch ? (isRTL ? '✗ كلمات المرور غير متطابقة' : "✗ Passwords don't match") : ''}</motion.p>}

          <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1, x: termsError ? [0, -7, 7, -5, 5, 0] : 0 }} transition={{ delay: 0.58, duration: termsError ? 0.3 : 0.45 }}>
            <label htmlFor="register-terms" className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input id="register-terms" type="checkbox" required checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} onBlur={() => setTouched({ ...touched, terms: true })} aria-invalid={!!termsError} aria-describedby={termsError ? 'register-terms-error' : undefined} className="mt-0.5 h-4 w-4 rounded focus-visible:outline-none focus-visible:ring-2" style={{ accentColor: 'var(--accent)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties} />
              <span>{isRTL ? 'أوافق على ' : 'I agree to the '}<Link href="/terms" className="font-bold hover:underline rounded focus-visible:outline-none focus-visible:ring-2" style={{ color: 'var(--accent-secondary)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties}>{isRTL ? 'شروط الخدمة' : 'Terms of Service'}</Link>{isRTL ? ' و' : ' and '}<Link href="/privacy" className="font-bold hover:underline rounded focus-visible:outline-none focus-visible:ring-2" style={{ color: 'var(--accent-secondary)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties}>{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></span>
            </label>
            <AnimatePresence>{termsError && <motion.p id="register-terms-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1.5 text-xs" style={{ color: 'var(--accent-pink)' }}>{termsError}</motion.p>}</AnimatePresence>
          </motion.div>

          <motion.button type="submit" disabled={loading || successPulse} className="group relative overflow-hidden w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 btn-primary mt-2 disabled:opacity-70 disabled:cursor-not-allowed" style={{ background: loading || successPulse ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--on-accent-text)' }} whileHover={!loading && !successPulse ? { scale: 1.015 } : {}} whileTap={!loading && !successPulse ? { scale: 0.985 } : {}} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.7, duration: 0.45 }}>
            <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-40" style={{ background: 'linear-gradient(90deg, transparent, var(--on-accent-text), transparent)' }} />
            {successPulse ? <CheckIcon /> : loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>}
            {successPulse ? (isRTL ? 'تم' : 'Success') : loading ? (isRTL ? t.auth.creatingAccount : t.auth.creatingAccountEn) : t.auth.signUp}
          </motion.button>

          <div className="flex items-center justify-center gap-4 pt-1">{[{ icon: '🔒', t: isRTL ? t.auth.secure : t.auth.secureEn }, { icon: '✅', t: isRTL ? t.auth.daysFree : t.auth.daysFreeEn }, { icon: '⚡', t: isRTL ? t.auth.instantSetup : t.auth.instantSetupEn }].map((b, i) => <div key={i} className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}><span style={{ fontSize: 10 }}>{b.icon}</span>{b.t}</div>)}</div>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>{t.auth.hasAccount}{' '}<Link href="/login" className="font-bold hover:underline rounded focus-visible:outline-none focus-visible:ring-2" style={{ color: 'var(--accent)', '--tw-ring-color': 'var(--accent-focus)' } as React.CSSProperties}>{t.auth.signIn}</Link></p>
      </div>
    </motion.div>
  )
}
