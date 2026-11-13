'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import BrandWordmark from '../../components/brand/BrandWordmark'
import LanguageToggle from '../../components/auth/LanguageToggle'
import DarkModeToggle from '../../components/DarkModeToggle'
import {
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'

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
  const [success, setSuccess] = useState(false)

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
      if (!res.ok) {
        throw new Error(
          data.message ||
            data.errors?.otp?.[0] ||
            (isRTL ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired verification code.')
        )
      }
      setSuccess(true)
      toast.success(isRTL ? 'تم تأكيد البريد الإلكتروني بنجاح!' : 'Email verified successfully!')

      const redirectParams = new URLSearchParams()
      const signupChoice = searchParams.get('signup_choice')
      if (signupChoice) redirectParams.set('signup_choice', signupChoice)
      const selectedPackage = searchParams.get('package')
      const selectedBilling = searchParams.get('billing')
      if (selectedPackage) redirectParams.set('package', selectedPackage)
      if (selectedBilling) redirectParams.set('billing', selectedBilling)
      const redirect = signupChoice ? `/onboarding?${redirectParams.toString()}` : ''

      setTimeout(() => {
        window.location.href = `/login?email=${encodeURIComponent(email)}${
          redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
        }`
      }, 1000)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isRTL
          ? 'تعذر التحقق من البريد الإلكتروني.'
          : 'Verification failed.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!email) return
    setError('')
    setResending(true)

    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || (isRTL ? 'تعذر إعادة إرسال الرمز.' : 'Could not resend code.'))
      }
      toast.success(data.message || (isRTL ? 'تم إرسال رمز التحقق مجدداً.' : 'Verification code sent.'))
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isRTL
          ? 'تعذر إعادة إرسال الرمز.'
          : 'Could not resend code.'
      setError(msg)
      toast.error(msg)
    } finally {
      setResending(false)
    }
  }

  return (
    <main
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-16"
      style={{ background: 'var(--background)' }}
    >
      {/* Background radial mesh */}
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
      <header
        className="fixed top-4 z-40 flex items-center gap-2 px-4 sm:px-6"
        style={{ [isRTL ? 'left' : 'right']: '1rem' }}
      >
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/80 p-1 shadow-sm backdrop-blur-md">
          <LanguageToggle />
          <div className="h-4 w-[1px] bg-border" />
          <DarkModeToggle />
        </div>
      </header>

      {/* Verification Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl sm:p-9"
      >
        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="Naz AutoReply">
            <BrandWordmark width="75px" priority />
          </Link>
        </div>

        <div className="mb-6 text-start">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            <ShieldCheck size={13} />
            <span>{isRTL ? 'تأكيد الحساب' : 'Account Verification'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            {isRTL ? 'تأكيد بريدك الإلكتروني' : 'Verify your email'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {isRTL
              ? 'أدخل رمز التحقق المكوّن من 6 أرقام المرسل إلى بريدك لتأكيد حسابك وتفعيل مساحة العمل.'
              : 'Enter the 6-digit verification code sent to your email to activate your business workspace.'}
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
              <span>
                {isRTL ? 'تم التحقق بنجاح! جاري تحويلك...' : 'Verified successfully! Redirecting...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary">
              {isRTL ? 'البريد الإلكتروني' : 'Email address'}
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

          {/* OTP Code input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary">
              {isRTL ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
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
                placeholder="••••••"
                className={`w-full rounded-xl py-3 text-center text-lg font-bold tracking-[0.35em] outline-none transition-all ${
                  isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                } border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20`}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || success || otp.length < 6}
            whileHover={!loading && !success && otp.length === 6 ? { scale: 1.015, y: -1 } : {}}
            whileTap={!loading && !success && otp.length === 6 ? { scale: 0.985 } : {}}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
              boxShadow: '0 8px 24px -4px rgba(23, 105, 255, 0.4)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isRTL ? 'جارٍ التحقق...' : 'Verifying code...'}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? 'تأكيد البريد الإلكتروني' : 'Verify Email'}</span>
                <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={resend}
            disabled={resending || !email}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand transition-colors hover:text-brand-hover hover:underline disabled:opacity-50"
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            <span>{resending ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...') : (isRTL ? 'إعادة إرسال الرمز' : 'Resend code')}</span>
          </button>

          <Link
            href="/login"
            className="text-xs font-semibold text-text-tertiary transition-colors hover:text-text-primary hover:underline"
          >
            {isRTL ? 'تسجيل الدخول' : 'Back to login'}
          </Link>
        </div>
      </motion.div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
