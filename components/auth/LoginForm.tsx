'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

export default function LoginForm() {
  const { isRTL } = useLang()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

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
      if (!res.ok) throw new Error(data.message || 'Login failed')
      document.cookie = `naz_token=${data.token}; path=/; max-age=604800; SameSite=Lax`
      if (data.user?.onboarding_completed === false) {
        window.location.href = '/onboarding'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'email',    label: isRTL ? 'البريد الإلكتروني' : 'Email',    type: 'email',    ph: 'you@example.com' },
    { key: 'password', label: isRTL ? 'كلمة المرور'        : 'Password', type: showPass ? 'text' : 'password', ph: '••••••••' },
  ]

  return (
    <div className="w-full">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 justify-center mb-8 lg:hidden">
        <span style={{ color: '#C6FF00', fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(198,255,0,0.7))' }}>✦</span>
        <span className="text-2xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(198,255,0,0.08)', border: '1px solid rgba(198,255,0,0.18)' }}>
          <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
          <span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: '#C6FF00' }}>
            {isRTL ? 'تسجيل الدخول' : 'SIGN IN'}
          </span>
        </div>
        <h1 className="font-black mb-1.5" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'مرحباً بعودتك.' : 'Welcome back.'}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isRTL ? 'سجّل دخولك للوصول إلى نظامك.' : 'Sign in to access your AI system.'}
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-5 p-3.5 rounded-xl text-sm text-center"
          style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.22)', color: '#FF7070' }}>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, ph }, i) => (
          <motion.div key={key}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                  background: 'rgba(17,17,17,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F5F5F5',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(198,255,0,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(198,255,0,0.08)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
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
            style={{ color: 'rgba(198,255,0,0.7)' }}>
            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
          </Link>
        </div>

        {/* Submit */}
        <motion.button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: loading ? 'rgba(198,255,0,0.5)' : 'linear-gradient(135deg, #C6FF00, #a8e000)',
            color: '#050505',
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
          {loading ? (isRTL ? 'جاري الدخول...' : 'Signing in...') : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
        </motion.button>
      </form>

      <p className="text-center text-sm mt-7" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
        <Link href="/register" className="font-bold hover:underline" style={{ color: '#C6FF00' }}>
          {isRTL ? 'سجل مجاناً' : 'Sign up free'}
        </Link>
      </p>

      <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
        {isRTL ? 'بالمتابعة توافق على ' : 'By continuing you agree to our '}
        <span className="underline cursor-pointer" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isRTL ? 'الشروط والسياسة' : 'Terms & Privacy'}
        </span>
      </p>
    </div>
  )
}
