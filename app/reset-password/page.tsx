'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useLang } from '../../lib/LangContext'
import BrandWordmark from '../../components/brand/BrandWordmark'
import LanguageToggle from '../../components/auth/LanguageToggle'
import DarkModeToggle from '../../components/DarkModeToggle'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function ResetPasswordContent() {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      setError(isRTL ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError(isRTL ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' : 'Password must be at least 8 characters.')
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
      if (!res.ok) {
        throw new Error(data.message || data.errors?.otp?.[0] || (isRTL ? 'تعذر إعادة تعيين كلمة المرور.' : 'Could not reset password.'))
      }
      setSuccess(true)
      toast.success(data.message)
      setTimeout(() => {
        window.location.href = '/login'
      }, 1200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'تعذر إعادة تعيين كلمة المرور.' : 'Could not reset password.')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-16"
      style={{ background: 'var(--background)' }}
    >
      {/* Background radial glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 85% 15%, rgba(0, 217, 255, 0.06), transparent 70%),
            radial-gradient(ellipse 50% 60% at 15% 85%, rgba(113, 60, 255, 0.07), transparent 70%)
          `,
        }}
      />

      {/* Top Bar with Language and Dark Mode */}
      <header className="fixed top-4 z-40 flex items-center gap-2 px-4 sm:px-6" style={{ [isRTL ? 'left' : 'right']: '1rem' }}>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/80 p-1 shadow-sm backdrop-blur-md">
          <LanguageToggle />
          <div className="h-4 w-[1px] bg-border" />
          <DarkModeToggle />
        </div>
      </header>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl sm:p-9"
      >
        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="Nazeer Business">
            <BrandWordmark width="75px" priority />
          </Link>
        </div>

        <div className="mb-6 text-start">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            <Lock size={13} />
            <span>{isRTL ? 'كلمة مرور جديدة' : 'New Password'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset your password'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {isRTL
              ? 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني، ثم اختر كلمة مرورك الجديدة.'
              : 'Enter the 6-digit verification code sent to your email, and create your new secure password.'}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-medium text-error"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-medium text-success"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{isRTL ? 'تم تغيير كلمة المرور بنجاح! جاري تحويلك لتسجيل الدخول...' : 'Password reset successfully! Redirecting...'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary">
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
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
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className={`w-full rounded-xl py-3 text-sm font-medium outline-none transition-all ${
                  isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                } border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20`}
              />
            </div>
          </div>

          {/* Verification Code OTP */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary">
              {isRTL ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 Digits)'}
            </label>
            <div className="relative">
              <span
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                  isRTL ? 'right-3.5' : 'left-3.5'
                }`}
              >
                <KeyRound size={16} />
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={`w-full rounded-xl py-3 text-center text-lg font-black tracking-[0.3em] outline-none transition-all border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20`}
              />
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary">
              {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <div className="relative">
              <span
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                  isRTL ? 'right-3.5' : 'left-3.5'
                }`}
              >
                <Lock size={16} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl py-3 text-sm font-medium outline-none transition-all ${
                  isRTL ? 'pr-10 pl-11' : 'pl-10 pr-11'
                } border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-tertiary hover:text-text-primary ${
                  isRTL ? 'left-2.5' : 'right-2.5'
                }`}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary">
              {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            <div className="relative">
              <span
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                  isRTL ? 'right-3.5' : 'left-3.5'
                }`}
              >
                <Lock size={16} />
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl py-3 text-sm font-medium outline-none transition-all ${
                  isRTL ? 'pr-10 pl-11' : 'pl-10 pr-11'
                } border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-tertiary hover:text-text-primary ${
                  isRTL ? 'left-2.5' : 'right-2.5'
                }`}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || success}
            whileHover={!loading && !success ? { scale: 1.015, y: -1 } : {}}
            whileTap={!loading && !success ? { scale: 0.985 } : {}}
            className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:opacity-70"
            style={{
              background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
              boxShadow: '0 8px 24px -4px rgba(23, 105, 255, 0.4)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isRTL ? 'جارٍ إعادة التعيين...' : 'Resetting...'}</span>
              </>
            ) : success ? (
              <>
                <Check size={18} />
                <span>{isRTL ? 'تم التعيين بنجاح!' : 'Success!'}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}</span>
                <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand transition-colors hover:text-brand-hover hover:underline"
          >
            <span>{isRTL ? 'العودة إلى تسجيل الدخول' : 'Back to login'}</span>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
