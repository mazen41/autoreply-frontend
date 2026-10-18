'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  agent: 'Agent',
  viewer: 'Viewer',
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

interface InvitationInfo {
  email: string
  role: string
  business_name: string | null
  expires_at: string
  requires_existing_account_password: boolean
}

function readToken(searchToken: string | null): string | null {
  if (searchToken) return searchToken
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.hash.slice(1)).get('token')
}

export default function AcceptInvitationPage() {
  const { isRTL } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get('action') // 'reject' if user clicked decline
  const token = readToken(searchParams.get('token'))

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [processing, setProcessing] = useState(false)

  // Load once per token. State updates happen after the network call resolves.
  useEffect(() => {
    let cancelled = false

    const rejectInvitation = async (tokenValue: string) => {
      setProcessing(true)
      try {
        const response = await fetch(`${API_BASE}/team-invitations/${tokenValue}/reject`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Failed to reject invitation')
        router.push('/login?message=invitation_rejected')
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Failed to reject invitation')
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }

    const checkInvitation = async (tokenValue: string) => {
      try {
        const response = await fetch(`${API_BASE}/team-invitations/check/${tokenValue}`, {
          headers: { Accept: 'application/json' },
        })
        const data = (await response.json().catch(() => ({}))) as { message?: string } & Partial<InvitationInfo>
        if (!response.ok) throw new Error(data.message || 'Invalid invitation')
        if (cancelled) return
        setInvitation(data as InvitationInfo)
        if (action === 'reject') await rejectInvitation(tokenValue)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Failed to check invitation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (token) void checkInvitation(token)

    return () => {
      cancelled = true
    }
  }, [token, action, router])

  const handleDecline = async () => {
    if (!token) return
    setProcessing(true)
    try {
      const response = await fetch(`${API_BASE}/team-invitations/${token}/reject`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to reject invitation')
      router.push('/login?message=invitation_rejected')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to reject invitation')
    } finally {
      setProcessing(false)
    }
  }

  const handleAccept = () => {
    // Account setup page completes acceptance with the token.
    router.push(`/setup-account#token=${encodeURIComponent(token || '')}`)
  }

  // A missing token is shown as an invalid link, without waiting on a request.
  const isLoading = token !== null && loading
  const errorMessage = token ? error : 'Invalid invitation link'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{isRTL ? 'جاري التحقق من الدعوة...' : 'Checking invitation...'}</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">
            {isRTL ? 'دعوة غير صالحة' : 'Invalid Invitation'}
          </h1>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-info text-white rounded-lg hover:bg-info"
          >
            {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </button>
        </div>
      </div>
    )
  }

  if (action === 'reject') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{isRTL ? 'جاري رفض الدعوة...' : 'Rejecting invitation...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="text-success text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">
            {isRTL ? 'دعوة للانضمام إلى فريق' : 'Team Invitation'}
          </h1>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">
            {isRTL ? 'دعوتك للانضمام إلى:' : 'You are invited to join:'}
          </p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {invitation?.business_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {isRTL ? 'البريد:' : 'Email:'} {invitation?.email}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            {isRTL ? 'الدور:' : 'Role:'} {ROLE_LABELS[invitation?.role ?? ''] ?? invitation?.role}
          </p>
          {invitation?.requires_existing_account_password && (
            <p className="text-sm text-gray-600">
              {isRTL ? 'لديك حساب بهذا البريد. ستحتاج إلى كلمة مرورك لقبول الدعوة.' : 'You already have an account with this email. You will need its password to accept.'}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full px-6 py-3 bg-success text-white rounded-lg hover:bg-success disabled:opacity-50 font-semibold"
          >
            {isRTL ? 'قبول الدعوة' : 'Accept Invitation'}
          </button>

          <button
            onClick={handleDecline}
            disabled={processing}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold"
          >
            {isRTL ? 'رفض الدعوة' : 'Decline Invitation'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {isRTL ? 'تنتهي هذه الدعوة في:' : 'This invitation expires in:'}{' '}
          {invitation ? new Date(invitation.expires_at).toLocaleDateString() : ''}
        </p>
      </div>
    </div>
  )
}
