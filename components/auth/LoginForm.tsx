'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'

export default function LoginForm() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

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
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || t.auth.loginError)
      document.cookie = `naz_token=${data.token}; path=/; max-age=604800; SameSite=Lax`
      toast.success(t.auth.loginSuccess)
      if (data.user?.onboarding_completed === false) {
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
    }
  }

  const fields = [
    { key: 'email',    label: t.auth.email,    type: 'email',    ph: 'you@example.com' },
    { key: 'password', label: t.auth.password, type: showPass ? 'text' : 'password', ph: '••••••••' },
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
          <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--primary)' }} />
          <span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: 'var(--primary)' }}>
            {t.auth.login.toUpperCase()}
          </span>
        </div>
        <h1 className="font-black mb-1.5" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          {isRTL ? 'مرحباً بعودتك.' : 'Welcome back.'}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'سجّل دخولك للوصول إلى نظامك.' : 'Sign in to access your AI system.'}
        </p>
      </motion.div>

      {/* Social Login Buttons */}
      <SocialLoginButtons />

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
            transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}>
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
              {key === 'password' && (
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute top-1/2 -translate-y-1/2 text-xs transition-colors"
                  style={{ [isRTL ? 'left' : 'right']: 14, color: 'rgba(255,255,255,0.3)' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Forgot password */}
        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <Link href="/forgot-password" className="text-xs font-medium hover:underline"
            style={{ color: 'var(--primary)' }}>
            {t.auth.forgotPassword}
          </Link>
        </div>

        {/* Submit */}
        <motion.button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: loading ? 'rgba(108,99,255,0.5)' : 'var(--primary)',
            color: theme === 'dark' ? '#0A0A0F' : '#F4F4FF',
          }}
          whileHover={!loading ? { scale: 1.015 } : {}}
          whileTap={!loading ? { scale: 0.985 } : {}}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}>
          {loading && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          )}
          {loading ? (isRTL ? 'جاري الدخول...' : 'Signing in...') : t.auth.signIn}
        </motion.button>
      </form>

      <p className="text-center text-sm mt-7" style={{ color: 'var(--text-secondary)' }}>
        {t.auth.noAccount}{' '}
        <Link href="/register" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
          {t.auth.signUp}
        </Link>
      </p>

      <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text-secondary)' }}>
        {isRTL ? 'بالمتابعة توافق على ' : 'By continuing you agree to our '}
        <span className="underline cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'الشروط والسياسة' : 'Terms & Privacy'}
        </span>
      </p>
    </div>
  )
}
