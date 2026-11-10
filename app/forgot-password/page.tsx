'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLang } from '../../lib/LangContext'
import BrandWordmark from '../../components/brand/BrandWordmark'
import LanguageToggle from '../../components/auth/LanguageToggle'
import DarkModeToggle from '../../components/DarkModeToggle'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'

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
      toast.success(data.message)
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
            <KeyRound size={13} />
            <span>{isRTL ? 'استعادة الحساب' : 'Account Recovery'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {isRTL
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق من 6 أرقام لإعادة تعيين كلمة المرور فوراً.'
              : 'Enter your registered email and we will send a 6-digit verification code to reset your password.'}
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

          {sent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-medium text-success"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{isRTL ? 'تم إرسال الرمز بنجاح! جاري تحويلك...' : 'Code sent successfully! Redirecting...'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} className="space-y-4">
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

          <motion.button
            type="submit"
            disabled={loading || sent}
            whileHover={!loading && !sent ? { scale: 1.015, y: -1 } : {}}
            whileTap={!loading && !sent ? { scale: 0.985 } : {}}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:opacity-70"
            style={{
              background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
              boxShadow: '0 8px 24px -4px rgba(23, 105, 255, 0.4)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isRTL ? 'جارٍ الإرسال...' : 'Sending code...'}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? 'إرسال رمز التحقق' : 'Send Reset Code'}</span>
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
