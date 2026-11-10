'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'
import Checkbox from '../ui/Checkbox'
import BrandWordmark from '../brand/BrandWordmark'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

type LoginField = 'email' | 'password'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const shakeTransition = { duration: 0.35, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }

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
  const [rememberMe, setRememberMe] = useState(true)

  const requiredMessage = isRTL ? 'هذا الحقل مطلوب' : 'This field is required'
  const invalidEmailMessage = isRTL ? 'أدخل بريداً إلكترونياً صالحاً' : 'Enter a valid email address'

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...form, remember_me: rememberMe }),
        }
      )
      const data = await res.json()

      if (res.status === 403 && data.requires_verification) {
        window.location.href = `/verify-email?email=${encodeURIComponent(data.email || form.email)}`
        return
      }
      if (!res.ok) throw new Error(data.message || t.auth.loginError)
      if (!data.token) throw new Error(t.auth.loginError)

      const maxAge = 60 * 60 * 24 * (rememberMe ? 30 : 2)
      const secure = window.location.protocol === 'https:' ? '; secure' : ''
      document.cookie = `naz_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax${secure}`

      toast.success(t.auth.loginSuccess)
      setSuccessPulse(true)
      await new Promise((resolve) => setTimeout(resolve, 350))

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full overflow-hidden rounded-3xl border border-border bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl sm:p-9"
    >
      {/* Mobile brand header */}
      <div className="mb-6 flex justify-center lg:hidden">
        <Link href="/" aria-label="Nazeer Business">
          <BrandWordmark width="70px" priority />
        </Link>
      </div>

      {/* Header with status badge */}
      <div className="mb-6 text-start">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
          <Sparkles size={13} />
          <span className="uppercase tracking-wider">{t.auth.login}</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
          {t.auth.welcomeBack}
        </h2>
        <p className="mt-1.5 text-xs text-text-secondary sm:text-sm">
          {t.auth.loginToAccess || (isRTL ? 'أدخل بيانات حسابك للمتابعة إلى لوحة التحكم' : 'Sign in to access your business command center')}
        </p>
      </div>

      {/* Social Login Buttons */}
      <SocialLoginButtons redirectTo={redirectTo || undefined} rememberMe={rememberMe} />

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-border" />
        <span className="absolute bg-surface-elevated px-3 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
          {t.auth.orDivider || (isRTL ? 'أو عبر البريد' : 'or with email')}
        </span>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="login-error"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, x: [0, -6, 6, -4, 4, 0] }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={shakeTransition}
            className="mb-5 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-medium text-error"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-bold text-text-secondary">
            {t.auth.email}
          </label>
          <div className="relative">
            <span
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                isRTL ? 'right-3.5' : 'left-3.5'
              }`}
            >
              <Mail size={16} />
            </span>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched({ ...touched, email: true })}
              placeholder="name@business.com"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              className={`w-full rounded-xl py-3 text-sm font-medium outline-none transition-all ${
                isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
              } ${
                fieldErrors.email
                  ? 'border border-error bg-error/5 focus:border-error focus:ring-2 focus:ring-error/20'
                  : 'border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20'
              }`}
            />
          </div>
          <AnimatePresence>
            {fieldErrors.email && (
              <motion.p
                id="login-email-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs font-semibold text-error"
              >
                {fieldErrors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-bold text-text-secondary">
              {t.auth.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand transition-colors hover:text-brand-hover hover:underline"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <span
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                isRTL ? 'right-3.5' : 'left-3.5'
              }`}
            >
              <Lock size={16} />
            </span>
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => setTouched({ ...touched, password: true })}
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              className={`w-full rounded-xl py-3 text-sm font-medium outline-none transition-all ${
                isRTL ? 'pr-10 pl-11' : 'pl-10 pr-11'
              } ${
                fieldErrors.password
                  ? 'border border-error bg-error/5 focus:border-error focus:ring-2 focus:ring-error/20'
                  : 'border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-tertiary transition-colors hover:text-text-primary ${
                isRTL ? 'left-2.5' : 'right-2.5'
              }`}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <AnimatePresence>
            {fieldErrors.password && (
              <motion.p
                id="login-password-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs font-semibold text-error"
              >
                {fieldErrors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Remember me checkbox */}
        <div className="pt-1">
          <Checkbox
            id="login-remember"
            checked={rememberMe}
            onChange={setRememberMe}
            label={isRTL ? 'تذكر تسجيل دخولي على هذا الجهاز' : 'Remember me on this device'}
            className="text-xs font-medium text-text-secondary"
          />
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={loading || successPulse}
          whileHover={!loading && !successPulse ? { scale: 1.015, y: -1 } : {}}
          whileTap={!loading && !successPulse ? { scale: 0.985 } : {}}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: '0 8px 24px -4px rgba(23, 105, 255, 0.4)',
          }}
        >
          {/* Shimmer sweep effect */}
          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-30 bg-gradient-to-r from-transparent via-white to-transparent" />

          {successPulse ? (
            <>
              <Check size={18} className="animate-bounce" />
              <span>{isRTL ? 'تم تسجيل الدخول!' : 'Authenticated!'}</span>
            </>
          ) : loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isRTL ? 'جارٍ التحقق من الحساب...' : 'Signing in...'}</span>
            </>
          ) : (
            <>
              <span>{t.auth.signIn}</span>
              <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
            </>
          )}
        </motion.button>
      </form>

      {/* Trust & Security note */}
      <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/80 pt-4 text-[11px] text-text-tertiary">
        <ShieldCheck size={14} className="text-brand" />
        <span>{isRTL ? 'جلسة مشفرة ومحمية ببروتوكول الأمان المتقدم' : 'End-to-end encrypted session'}</span>
      </div>

      {/* Footer Link to Register */}
      <p className="mt-6 text-center text-xs text-text-secondary">
        {t.auth.noAccount}{' '}
        <Link
          href="/register"
          className="font-bold text-brand transition-colors hover:text-brand-hover hover:underline"
        >
          {t.auth.signUp}
        </Link>
      </p>
    </motion.div>
  )
}
