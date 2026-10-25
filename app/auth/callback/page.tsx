'use client'

import React, { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../../lib/LangContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLang()
  const [error, setError] = useState('')
  const callbackStarted = useRef(false)

  const errorParam = searchParams.get('error')
  const redirectTo = searchParams.get('redirect')
  const packageId = searchParams.get('package')
  const billingCycle = searchParams.get('billing')
  const rememberMe = searchParams.get('remember_me') === '1'
  const code = searchParams.get('code')

  useEffect(() => {
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.')
      setTimeout(() => router.push('/login?error=auth_failed'), 2000)
      return
    }

    if (!code) {
      // Removing the one-time code updates Next.js search params. Once callback
      // processing has started, that URL cleanup must not be mistaken for a
      // callback that arrived without a code.
      if (callbackStarted.current) return
      setError('Missing or expired sign-in code.')
      setTimeout(() => router.push('/login?error=auth_failed'), 2000)
      return
    }

    if (callbackStarted.current) return
    callbackStarted.current = true

    // Remove the one-time exchange code from browser history before redeeming it.
    window.history.replaceState({}, '', '/auth/callback')

    const completeSignIn = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ code, remember_me: rememberMe }),
        })
        const session = await response.json().catch(() => ({}))
        if (!response.ok || !session.token) throw new Error('Sign-in code rejected')

        const token = session.token as string
        const maxAge = 60 * 60 * 24 * (rememberMe ? 7 : 3)
        const secure = window.location.protocol === 'https:' ? '; secure' : ''
        document.cookie = `naz_token=${token}; path=/; max-age=${maxAge}; samesite=lax${secure}`

        let redirectUrl = redirectTo
        if (!redirectUrl) {
          if (session.is_new_user) {
            const params = new URLSearchParams()
            if (packageId) params.set('package', packageId)
            if (billingCycle) params.set('billing', billingCycle)
            const queryString = params.toString()
            redirectUrl = `/onboarding${queryString ? `?${queryString}` : ''}`
          } else if (packageId) {
            redirectUrl = `/checkout?package=${encodeURIComponent(packageId)}${billingCycle ? `&billing=${encodeURIComponent(billingCycle)}` : ''}`
          } else {
            redirectUrl = '/dashboard'
          }
        }

        await fetch(`${API_URL}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }).catch(() => null)

        router.push(redirectUrl)
      } catch {
        setError('Authentication failed. Please try again.')
        setTimeout(() => router.push('/login?error=auth_failed'), 2000)
      }
    }

    void completeSignIn()
  }, [errorParam, redirectTo, packageId, billingCycle, rememberMe, code, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-4" style={{ color: 'var(--accent)' }}>{error}</p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <svg className="animate-spin w-12 h-12 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--accent-focus)" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t.auth.signingIn}</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <svg className="animate-spin w-12 h-12" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--accent-focus)" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
