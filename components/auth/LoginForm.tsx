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
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
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
      const msg = t.auth?.authFailed || (isRTL ? 'فشلت عملية المصادقة.' : 'Authentication failed')
      setError(msg)
      toast.error(msg)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [t.auth?.authFailed, isRTL])

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
      if (!res.ok) {
        throw new Error(data.message || t.auth?.loginError || 'Login failed')
      }
      if (!data.token) {
        throw new Error(t.auth?.loginError || 'Login failed')
      }

      const maxAge = 60 * 60 * 24 * (rememberMe ? 30 : 2)
      const secure = window.location.protocol === 'https:' ? '; secure' : ''
      document.cookie = `naz_token=${data.token}; path=/; max-age=${maxAge}; samesite=lax${secure}`

      toast.success(t.auth?.loginSuccess || 'Login successful')
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
      const msg = err instanceof Error ? err.message : (t.auth?.loginError || 'Login failed')
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
      transition={{ duration: 0.45 }}
      className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-9"
    >
      {/* Subtle top gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-cyan to-brand-violet" />

      {/* Mobile brand header */}
      <div className="mb-6 flex justify-center lg:hidden">
        <Link href="/" aria-label="Naz AutoReply">
          <BrandWordmark width="76px" priority />
        </Link>
      </div>

      {/* Header with pill status badge */}
      <div className="mb-6 text-start">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
          <Sparkles size={12} />
          <span className="uppercase tracking-wider">{t.auth?.login || 'Login'}</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
          {t.auth?.welcomeBack || (isRTL ? 'مرحباً بعودتك' : 'Welcome back')}
        </h1>
        <p className="mt-1.5 text-xs text-text-secondary sm:text-sm">
          {t.auth?.loginToAccess ||
            (isRTL
              ? 'أدخل بيانات حسابك للمتابعة إلى مركز إدارة المحادثات'
              : 'Sign in to access your business command center')}
        </p>
      </div>

      {/* Social Login Buttons (Clean Google & Facebook) */}
      <SocialLoginButtons redirectTo={redirectTo || undefined} rememberMe={rememberMe} showDivider={true} />

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
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Credentials Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-start">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-text-primary">
            {t.auth?.email || 'Email'}
          </label>
          <div
            className={`group relative flex items-center rounded-xl border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
              fieldErrors.email ? 'border-error/80 bg-error/5' : 'border-border hover:border-border-hover'
            }`}
          >
            <Mail size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setTouched((prev) => ({ ...prev, email: true }))}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              placeholder="name@business.com"
              aria-label={t.auth?.email || 'Email'}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-[11px] font-medium text-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-text-primary">
            {t.auth?.password || 'Password'}
          </label>
          <div
            className={`group relative flex items-center rounded-xl border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
              fieldErrors.password ? 'border-error/80 bg-error/5' : 'border-border hover:border-border-hover'
            }`}
          >
            <Lock size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
            <input
              id="password"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onFocus={() => setTouched((prev) => ({ ...prev, password: true }))}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              placeholder="••••••••"
              aria-label={t.auth?.password || 'Password'}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              className="text-text-tertiary transition-colors hover:text-text-primary focus:outline-none"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1 text-[11px] font-medium text-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <Checkbox
              checked={rememberMe}
              onChange={(checked) => setRememberMe(checked)}
              aria-label="Remember me on this device"
            />
            <span className="text-xs text-text-secondary">
              {isRTL ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand transition-colors hover:text-brand-hover hover:underline"
          >
            {t.auth?.forgotPassword || (isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?')}
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || successPulse}
          className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand via-brand to-brand-violet py-3 px-5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:brightness-110 hover:shadow-brand/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{isRTL ? 'جارٍ التحقق...' : 'Signing in...'}</span>
            </>
          ) : (
            <>
              <span>{t.auth?.signIn || (isRTL ? 'تسجيل الدخول' : 'Sign In')}</span>
              {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center text-xs text-text-secondary">
        <span>{t.auth?.noAccount || (isRTL ? 'ليس لديك حساب؟' : "Don't have an account?")} </span>
        <Link
          href={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-bold text-brand transition-colors hover:text-brand-hover hover:underline"
        >
          {t.auth?.signUp || (isRTL ? 'ابدأ تجربتك المجانية لمدة 14 يوماً' : 'Start 14-day free trial')}
        </Link>
      </div>
    </motion.div>
  )
}
