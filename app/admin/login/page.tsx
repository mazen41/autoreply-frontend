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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
      <div className="w-full max-w-md p-8">
        {/* Admin Access Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'rgba(0,255,178,0.1)', border: '2px solid rgba(0,255,178,0.3)' }}>
            <ShieldIcon size={40} style={{ color: '#00FFB2' }} />
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: '#00FFB2', letterSpacing: '-0.02em' }}>
            {isRTL ? 'الوصول الإداري' : 'Admin Access'}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,240,255,0.5)' }}>
            {isRTL ? 'ناز — لوحة التحكم' : 'Naz — Admin Console'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(240,240,255,0.7)' }}>
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
            <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(240,240,255,0.7)' }}>
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
            <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#FF6B6B' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ 
              background: loading ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #00D494)',
              color: '#050508',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#050508]"></div>
                {isRTL ? 'جاري التحقق...' : 'Verifying...'}
              </>
            ) : (
              <>
                <ShieldIcon size={16} style={{ color: '#050508' }} />
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 p-4 rounded-xl" style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.1)' }}>
          <div className="flex items-start gap-3">
            <ShieldIcon size={16} style={{ color: '#00FFB2', marginTop: 2 }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#00FFB2' }}>
                {isRTL ? 'منطقة آمنة' : 'Secure Area'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(240,240,255,0.5)' }}>
                {isRTL ? 'يتطلب هذا القسم صلاحيات إدارية. يتم تسجيل جميع الأنشطة.' : 'This section requires administrative privileges. All activities are logged.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
