'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../../lib/LangContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLang()
  const [error, setError] = useState('')

  useEffect(() => {
    const token     = searchParams.get('token')
    const isNewUser = searchParams.get('is_new_user')
    const errorParam = searchParams.get('error')
    const redirectTo = searchParams.get('redirect')

    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.')
      setTimeout(() => router.push('/login?error=auth_failed'), 2000)
      return
    }

    if (!token) {
      setError('Missing authentication token.')
      setTimeout(() => router.push('/login?error=auth_failed'), 2000)
      return
    }

    // Persist token
    document.cookie = `naz_token=${token}; path=/; max-age=604800; SameSite=Lax`

    // Fetch user — guard against HTML error pages
    fetch(`${API_URL}/api/auth/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(async (res) => {
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(data))
          }
        } catch {
          // User fetch failed but token is saved — still redirect
          console.warn('Could not parse user response, redirecting anyway')
        }
        router.push(redirectTo || (isNewUser === 'true' ? '/onboarding' : '/dashboard'))
      })
      .catch(() => {
        // Network error — token already saved, redirect anyway
        router.push(redirectTo || (isNewUser === 'true' ? '/onboarding' : '/dashboard'))
      })
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-4" style={{ color: '#ff4d6d' }}>{error}</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
      <div className="text-center">
        <svg className="animate-spin w-12 h-12 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(108,99,255,0.3)" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {t.auth.signingIn}
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <svg className="animate-spin w-12 h-12" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(108,99,255,0.3)" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
