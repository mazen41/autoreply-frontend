'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import { springs } from '../../lib/motion'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'
import { Mail, Lock, Eye, EyeOff, Check, Loader2, Play } from 'lucide-react'

type LoginField = 'email' | 'password'

type FieldMeta = {
  key: LoginField
  label: string
  type: string
  ph: string
  autoComplete: string
  icon: React.ElementType
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const shakeTransition = { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }

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
      if (res.status === 403 && data.requires_verification) {
        window.location.href = `/verify-email?email=${encodeURIComponent(data.email || form.email)}`
        return
      }
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
    { key: 'email', label: t.auth.email, type: 'email', ph: 'you@example.com', autoComplete: 'email', icon: Mail },
    { key: 'password', label: t.auth.password, type: showPass ? 'text' : 'password', ph: '••••••••', autoComplete: 'current-password', icon: Lock },
  ]

  return (
    <motion.div 
      className="relative w-full overflow-hidden rounded-2xl p-5 sm:p-7 bg-surface-elevated border border-border shadow-lg"
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={springs.standard}
    >
      <div className="relative z-10">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8 lg:hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
          <Play size={20} className="text-brand fill-brand" />
          <span className="text-2xl font-black text-text-primary tracking-tight">NazBiz</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-sm" />
            <span className="text-[11px] font-bold tracking-[0.1em] text-brand">{t.auth.login.toUpperCase()}</span>
          </div>
          <h1 className="font-black mb-1.5 text-[clamp(1.6rem,2.5vw,2rem)] text-text-primary tracking-tight">{t.auth.welcomeBack}.</h1>
          <p className="text-sm mb-8 text-text-secondary">{t.auth.loginToAccess}</p>
        </motion.div>

        <SocialLoginButtons redirectTo={redirectTo || undefined} />

        <AnimatePresence>
          {error && (
            <motion.div 
              key="login-error" 
              initial={{ opacity: 0, scale: 0.96, x: 0 }} 
              animate={{ opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }} 
              exit={{ opacity: 0, scale: 0.96, y: -8 }} 
              transition={shakeTransition} 
              className="mb-5 p-3.5 rounded-xl text-sm text-center bg-error/10 border border-error/20 text-error"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, ph, autoComplete, icon: Icon }, i) => {
            const message = fieldErrors[key]
            const describedBy = message ? `${key}-error` : undefined
            const hasTrailingButton = key === 'password'
            
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1, x: message ? [0, -7, 7, -5, 5, 0] : 0 }} transition={{ delay: 0.12 + i * 0.12, duration: message ? 0.3 : 0.45 }}>
                <label htmlFor={`login-${key}`} className="block text-sm font-semibold mb-1.5 text-text-secondary">{label}</label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Icon size={16} />
                  </span>
                  
                  <input 
                    id={`login-${key}`} 
                    type={type} 
                    required 
                    autoComplete={autoComplete} 
                    value={form[key]} 
                    onChange={e => setForm({ ...form, [key]: e.target.value })} 
                    onBlur={() => setTouched({ ...touched, [key]: true })} 
                    placeholder={ph} 
                    aria-invalid={!!message} 
                    aria-describedby={describedBy} 
                    className={`w-full py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-surface-elevated ${message ? 'border-error focus:border-error focus:ring-1 focus:ring-error/30' : 'border-border focus:border-brand focus:ring-1 focus:ring-brand/30'} ${isRTL ? 'pr-10' : 'pl-10'} ${hasTrailingButton ? (isRTL ? 'pl-12' : 'pr-12') : (isRTL ? 'pl-4' : 'pr-4')}`} 
                  />
                  
                  {key === 'password' && (
                    <button 
                      type="button" 
                      onClick={() => setShowPass(s => !s)} 
                      className={`absolute top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${isRTL ? 'left-2.5' : 'right-2.5'}`}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {message && <motion.p id={`${key}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1.5 text-xs text-error">{message}</motion.p>}
                </AnimatePresence>
              </motion.div>
            )
          })}

          <div className="flex items-center justify-between gap-3 pt-1">
            <label htmlFor="login-remember" className="flex items-center gap-2 text-xs font-medium cursor-pointer text-text-secondary hover:text-text-primary transition-colors">
              <input 
                id="login-remember" 
                type="checkbox" 
                checked={rememberMe} 
                onChange={e => setRememberMe(e.target.checked)} 
                className="w-4 h-4 rounded border-border bg-surface text-brand focus:ring-brand/40 focus:ring-offset-surface cursor-pointer" 
              />
              <span>{isRTL ? 'تذكرني' : 'Remember me'}</span>
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand hover:text-brand-hover hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors">
              {t.auth.forgotPassword}
            </Link>
          </div>

          <motion.button 
            type="submit" 
            disabled={loading || successPulse} 
            className="group relative overflow-hidden w-full mt-2 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-brand text-brand-text hover:bg-brand-hover disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface" 
            whileHover={!loading && !successPulse ? { scale: 1.02, y: -1 } : {}} 
            whileTap={!loading && !successPulse ? { scale: 0.97 } : {}} 
            initial={{ opacity: 0, y: 18, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.42, duration: 0.45 }}
          >
            <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent" />
            
            {successPulse ? <Check size={16} /> : loading && <Loader2 size={16} className="animate-spin" />}
            
            <span>{successPulse ? (isRTL ? 'تم' : 'Success') : loading ? (isRTL ? t.auth.signingIn : t.auth.signingInEn) : t.auth.signIn}</span>
          </motion.button>
        </form>

        <p className="text-center text-sm mt-7 text-text-secondary">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="font-bold text-brand hover:text-brand-hover hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors">
            {t.auth.signUp}
          </Link>
        </p>
        <p className="text-center text-[11px] mt-4 text-text-tertiary">
          {`${t.auth.byContinuing} `}
          <span className="underline cursor-pointer hover:text-text-primary transition-colors">{t.auth.termsPrivacy}</span>
        </p>
      </div>
    </motion.div>
  )
}
