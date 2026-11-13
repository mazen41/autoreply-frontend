'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLang } from '../../lib/LangContext'
import BrandWordmark from '../../components/brand/BrandWordmark'
import LanguageToggle from '../../components/auth/LanguageToggle'
import DarkModeToggle from '../../components/DarkModeToggle'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ForgotPasswordPage() {
  const { isRTL } = useLang()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email.trim()) {
      setError(isRTL ? 'الرجاء إدخال البريد الإلكتروني.' : 'Please enter your email.')
      return
    }
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || (isRTL ? 'تعذر إرسال رمز إعادة التعيين.' : 'Could not send reset code.'))
      }
      setSent(true)
      toast.success(data.message || (isRTL ? 'تم إرسال رمز التحقق' : 'Verification code sent'))
      setTimeout(() => {
        window.location.href = `/reset-password?email=${encodeURIComponent(email)}`
      }, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'تعذر إرسال رمز إعادة التعيين.' : 'Could not send reset code.')
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
        className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-20"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(23, 105, 255, 0.15), transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(113, 60, 255, 0.15), transparent 50%)
          `,
        }}
      />

      {/* Top Bar with Language and Dark Mode */}
      <header className="fixed top-4 z-40 flex items-center gap-2 px-4 sm:px-6" style={{ [isRTL ? 'left' : 'right']: '1.5rem' }}>
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
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-9"
      >
        {/* Top gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-cyan to-brand-violet" />

        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="Naz AutoReply">
            <BrandWordmark width="76px" priority />
          </Link>
        </div>

        <div className="mb-6 text-start">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            <KeyRound size={12} />
            <span>{isRTL ? 'استعادة الحساب' : 'Account Recovery'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {isRTL
              ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز OTP لتأكيد الهوية وتعيين كلمة مرور جديدة.'
              : 'Enter your registered business email and we will send you a 6-digit verification code.'}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-medium text-error"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {sent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-500"
            >
              <CheckCircle2 size={15} className="shrink-0" />
              <span>
                {isRTL
                  ? 'تم إرسال رمز التحقق! جاري التحويل لصفحة التعيين...'
                  : 'Verification code sent! Redirecting to reset page...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} className="space-y-4 text-start">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold text-text-primary">
              {isRTL ? 'البريد الإلكتروني' : 'Business Email'}
            </label>
            <div className="group relative flex items-center rounded-xl border border-border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 hover:border-border-hover">
              <Mail size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || sent}
            className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand via-brand to-brand-violet py-3 px-5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:brightness-110 hover:shadow-brand/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isRTL ? 'جاري الإرسال...' : 'Sending code...'}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? 'إرسال رمز إعادة التعيين' : 'Send Reset Code'}</span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-bold text-brand transition-colors hover:text-brand-hover hover:underline"
          >
            {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{isRTL ? 'العودة لتسجيل الدخول' : 'Back to login'}</span>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
