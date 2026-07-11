'use client'

import React, { useState } from 'react'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'

export default function SocialLoginButtons({ redirectTo, packageId, billingCycle }: { 
  redirectTo?: string
  packageId?: string
  billingCycle?: string
} = {}) {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)
  const [error, setError] = useState('')

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(provider)
    try {
      // Build query string with redirect, package, and billing params
      const params = new URLSearchParams()
      if (redirectTo) params.set('redirect', redirectTo)
      if (packageId) params.set('package', packageId)
      if (billingCycle) params.set('billing', billingCycle)
      const qs = params.toString() ? `?${params.toString()}` : ''
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}/redirect${qs}`, {
        headers: { Accept: 'application/json' },
      })

      // Guard against HTML error pages (e.g. 404/500 returning <!DOCTYPE)
      const text = await res.text()
      let data: { url?: string; message?: string; error?: string }
      try {
        data = JSON.parse(text)
      } catch {
        console.error('Social login: server returned non-JSON response:', text.slice(0, 200))
        throw new Error('Server error — check that the backend is running and Google/Facebook credentials are configured in .env')
      }

      if (!res.ok || data.error || !data.url) {
        throw new Error(data.message || data.error || 'Failed to get authentication URL')
      }

      window.location.href = data.url
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Authentication error'
      console.error('Social login error:', error)
      setError(msg)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Button */}
      <button
        onClick={() => handleSocialLogin('google')}
        disabled={loading !== null}
        className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: theme === 'dark' ? 'var(--surface)' : '#ffffff',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        {loading === 'google' ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span>{t.auth.continueWithGoogle}</span>
      </button>

      {/* Facebook Button */}
      <button
        onClick={() => handleSocialLogin('facebook')}
        disabled={loading !== null}
        className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: '#1877F2',
          color: '#ffffff',
        }}
      >
        {loading === 'facebook' ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        <span>{t.auth.continueWithFacebook}</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t.auth.orDivider}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {error && (
        <p className="text-xs text-center -mt-2 mb-2" style={{ color: 'var(--danger, #ff4d6d)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
