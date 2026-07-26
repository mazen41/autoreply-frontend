'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '../../../lib/LangContext'
import { ShieldIcon } from '../../../components/ui/DashboardIcons'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isRTL, t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || (isRTL ? 'فشل تسجيل الدخول' : 'Login failed'))
        return
      }

      // Check if user has admin access
      if (!data.user.is_admin) {
        setError(isRTL ? 'هذا الحساب ليس لديه صلاحيات إدارية' : 'This account does not have admin access')
        return
      }

      // Save token to cookie
      document.cookie = `naz_token=${data.token}; path=/; max-age=604800; SameSite=Lax`

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError(isRTL ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="w-full max-w-md p-8">
        {/* Admin Access Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'var(--accent-subtle)', border: '2px solid var(--accent-focus)' }}>
            <ShieldIcon size={40} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            {isRTL ? 'الوصول الإداري' : 'Admin Access'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'ناز — لوحة التحكم' : 'Naz — Admin Console'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm input-os"
              placeholder={isRTL ? 'admin@example.com' : 'admin@example.com'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm input-os"
              placeholder={isRTL ? '••••••••' : '••••••••'}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{
              background: loading ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--success))',
              color: 'var(--surface)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--surface)' }}></div>
                {isRTL ? 'جاري التحقق...' : 'Verifying...'}
              </>
            ) : (
              <>
                <ShieldIcon size={16} style={{ color: 'var(--surface)' }} />
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-subtle)' }}>
          <div className="flex items-start gap-3">
            <ShieldIcon size={16} style={{ color: 'var(--accent)', marginTop: 2 }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                {isRTL ? 'منطقة آمنة' : 'Secure Area'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'يتطلب هذا القسم صلاحيات إدارية. يتم تسجيل جميع الأنشطة.' : 'This section requires administrative privileges. All activities are logged.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
