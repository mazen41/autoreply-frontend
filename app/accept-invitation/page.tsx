'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'

export default function AcceptInvitationPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const action = searchParams.get('action') // 'reject' if user clicked decline
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (token) {
      checkInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [token])

  const checkInvitation = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/team-invitations/check/${token}`, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Invalid invitation')
      }

      const data = await response.json()
      setInvitation(data)
      
      // If action is reject, handle rejection
      if (action === 'reject') {
        await handleReject()
      }
    } catch (error: any) {
      setError(error.message || 'Failed to check invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/team-invitations/${token}/reject`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to reject invitation')
      }

      router.push('/login?message=invitation_rejected')
    } catch (error: any) {
      setError(error.message || 'Failed to reject invitation')
    } finally {
      setProcessing(false)
    }
  }

  const handleAccept = () => {
    // Redirect to setup account page with the token
    router.push(`/setup-account?token=${token}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{isRTL ? 'جاري التحقق من الدعوة...' : 'Checking invitation...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">
            {isRTL ? 'دعوة غير صالحة' : 'Invalid Invitation'}
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">
            {isRTL ? 'دعوة للانضمام إلى فريق' : 'Team Invitation'}
          </h1>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">
            {isRTL ? 'دعوتك للانضمام إلى:' : 'You are invited to join:'}
          </p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {invitation?.business?.business_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {isRTL ? 'بدعوة من:' : 'Invited by:'} {invitation?.inviter?.name}
          </p>
          <p className="text-sm text-gray-600">
            {isRTL ? 'الدور:' : 'Role:'} {invitation?.role}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            {isRTL ? 'قبول الدعوة' : 'Accept Invitation'}
          </button>
          
          <button
            onClick={handleReject}
            disabled={processing}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold"
          >
            {isRTL ? 'رفض الدعوة' : 'Decline Invitation'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {isRTL ? 'تنتهي هذه الدعوة في:' : 'This invitation expires in:'}{' '}
          {new Date(invitation?.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}