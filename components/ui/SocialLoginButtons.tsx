'use client'

import React, { useState } from 'react'
import { useLang } from '../../lib/LangContext'

interface SocialLoginButtonsProps {
  redirectTo?: string
  packageId?: string
  billingCycle?: string
  rememberMe?: boolean
  signupChoice?: 'trial' | 'paid'
  disabled?: boolean
  showDivider?: boolean
}

export default function SocialLoginButtons({
  redirectTo,
  packageId,
  billingCycle,
  rememberMe,
  signupChoice,
  disabled = false,
  showDivider = true,
}: SocialLoginButtonsProps) {
  const { isRTL, t } = useLang()
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)
  const [error, setError] = useState('')

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(provider)
    setError('')
    try {
      const params = new URLSearchParams()
      if (redirectTo) params.set('redirect', redirectTo)
      if (packageId) params.set('package', packageId)
      if (billingCycle) params.set('billing', billingCycle)
      if (signupChoice) params.set('signup_choice', signupChoice)
      params.set('remember_me', String(rememberMe ?? false))
      const qs = params.toString() ? `?${params.toString()}` : ''

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/${provider}/redirect${qs}`, {
        headers: { Accept: 'application/json' },
      })

      const text = await res.text()
      let data: { url?: string; message?: string; error?: string }
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(
          isRTL
            ? 'تعذر بدء تسجيل الدخول بواسطة الشبكة الاجتماعية.'
            : 'Social authentication service unavailable.'
        )
      }

      if (!res.ok || data.error || !data.url) {
        throw new Error(data.message || data.error || (isRTL ? 'تعذر إتمام المصادقة.' : 'Failed to initialize authentication.'))
      }

      window.location.href = data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isRTL ? 'حدث خطأ أثناء المصادقة.' : 'Authentication error')
      setError(msg)
      setLoading(null)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* 2-column or stacked social buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading !== null || disabled}
          aria-label={t.auth?.continueWithGoogle || 'Continue with Google'}
          className="group relative flex items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-elevated/80 px-4 py-2.5 text-xs font-semibold text-text-primary shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-brand/40 hover:bg-surface-elevated hover:shadow-md hover:shadow-brand/5 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading === 'google' ? (
            <svg className="h-4 w-4 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>

        {/* Facebook Button */}
        <button
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={loading !== null || disabled}
          aria-label={t.auth?.continueWithFacebook || 'Continue with Facebook'}
          className="group relative flex items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-elevated/80 px-4 py-2.5 text-xs font-semibold text-text-primary shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#1877F2]/40 hover:bg-surface-elevated hover:shadow-md hover:shadow-[#1877F2]/5 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading === 'facebook' ? (
            <svg className="h-4 w-4 animate-spin text-[#1877F2]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          <span>Facebook</span>
        </button>
      </div>

      {error && (
        <p className="text-center text-xs text-error">{error}</p>
      )}

      {/* Single clean divider */}
      {showDivider && (
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-[var(--background)] px-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            {t.auth?.orDivider || (isRTL ? 'أو عبر البريد' : 'or continue with email')}
          </span>
        </div>
      )}
    </div>
  )
}
