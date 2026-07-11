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
      window.location.href = redirectTo || '/onboarding'
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
        <span style={{ color: 'var(--primary)', fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(108,99,255,0.7))' }}>✦</span>
        <span className="text-2xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.18)' }}>
          <span style={{ color: 'var(--primary)', fontSize: 11 }}>✦</span>
          <span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: 'var(--primary)' }}>
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
      <SocialLoginButtons redirectTo={redirectTo || undefined} />

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-5 p-3.5 rounded-xl text-sm text-center"
          style={{ background: 'rgba(255,77,109,0.07)', border: '1px solid rgba(255,77,109,0.22)', color: 'var(--danger)' }}>
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
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.08)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              {(key === 'password' || key === 'confirm') && (
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute top-1/2 -translate-y-1/2 text-xs"
                  style={{ [isRTL ? 'left' : 'right']: 14, color: 'rgba(255,255,255,0.3)' }}>
                  {showPass ? '🙈' : '👁'}
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
                    ? (lvl <= 2 ? 'rgba(255,184,0,0.6)' : 'var(--success)')
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
            background: loading ? 'rgba(108,99,255,0.5)' : 'var(--primary)',
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
