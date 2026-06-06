'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

export default function RegisterForm() {
  const { isRTL } = useLang()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.confirm,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      document.cookie = `naz_token=${data.token}; path=/; max-age=604800; SameSite=Lax`
      window.location.href = '/onboarding'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name',     label: isRTL ? 'الاسم الكامل'       : 'Full Name',        type: 'text',     ph: isRTL ? 'محمد أحمد' : 'John Smith' },
    { key: 'email',    label: isRTL ? 'البريد الإلكتروني'  : 'Email',            type: 'email',    ph: 'you@example.com' },
    { key: 'password', label: isRTL ? 'كلمة المرور'         : 'Password',         type: showPass ? 'text' : 'password', ph: '••••••••' },
    { key: 'confirm',  label: isRTL ? 'تأكيد كلمة المرور'  : 'Confirm Password', type: showPass ? 'text' : 'password', ph: '••••••••' },
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
          <span style={{ color: '#C6FF00', fontSize: 11 }}>✦</span>
          <span className="text-[11px] font-bold tracking-[0.1em]" style={{ color: '#C6FF00' }}>
            {isRTL ? 'إنشاء حساب — 14 يوم مجاناً' : 'CREATE ACCOUNT — 14 DAYS FREE'}
          </span>
        </div>
        <h1 className="font-black mb-1.5" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {isRTL ? 'ابدأ رحلتك.' : 'Start your journey.'}
        </h1>
        <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isRTL ? 'أنشئ حسابك وفعّل موظفك الذكي في دقائق.' : 'Create your account and activate your AI in minutes.'}
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
            transition={{ delay: 0.08 + i * 0.07, duration: 0.4 }}>
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
                    ? (lvl <= 2 ? 'rgba(255,200,0,0.6)' : '#C6FF00')
                    : 'rgba(255,255,255,0.08)',
                }} />
            ))}
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
            background: loading ? 'rgba(198,255,0,0.5)' : 'linear-gradient(135deg, #C6FF00, #a8e000)',
            color: '#050505',
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
            : (isRTL ? 'إنشاء الحساب — ابدأ مجاناً' : 'Create Account — Start Free')}
        </motion.button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {[
            { icon: '🔒', t: isRTL ? 'آمن' : 'Secure' },
            { icon: '✅', t: isRTL ? '14 يوم مجاني' : '14 days free' },
            { icon: '⚡', t: isRTL ? 'جاهز فوراً' : 'Instant setup' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span style={{ fontSize: 10 }}>{b.icon}</span>{b.t}
            </div>
          ))}
        </div>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
        <Link href="/login" className="font-bold hover:underline" style={{ color: '#C6FF00' }}>
          {isRTL ? 'سجل دخولك' : 'Sign in'}
        </Link>
      </p>
    </div>
  )
}
