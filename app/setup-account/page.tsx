'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'

export default function SetupAccountPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

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
      // Pre-fill email if available
      if (data.email) {
        setFormData(prev => ({ ...prev, email: data.email }))
      }
    } catch (error: any) {
      setError(error.message || 'Failed to check invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setProcessing(true)

    // Validation
    if (!formData.name.trim()) {
      setError(isRTL ? 'الاسم مطلوب' : 'Name is required')
      setProcessing(false)
      return
    }

    if (!formData.username.trim()) {
      setError(isRTL ? 'اسم المستخدم مطلوب' : 'Username is required')
      setProcessing(false)
      return
    }

    if (formData.password.length < 8) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      setProcessing(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match')
      setProcessing(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/team-invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to accept invitation')
      }

      const data = await response.json()
      
      // Store token if returned
      if (data.token) {
        document.cookie = `naz_token=${data.token}; path=/; max-age=604800`
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Failed to accept invitation')
    } finally {
      setProcessing(false)
    }
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

  if (error && !invitation) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="text-green-500 text-6xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold mb-2">
            {isRTL ? 'إعداد حسابك' : 'Setup Your Account'}
          </h1>
          <p className="text-gray-600">
            {isRTL ? 'أنت على وشك الانضمام إلى' : 'You are about to join'}{' '}
            <span className="font-semibold">{invitation?.business?.business_name}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'اسم المستخدم' : 'Username'}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isRTL ? 'اختر اسم مستخدم' : 'Choose a username'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isRTL ? 'اختر كلمة مرور قوية' : 'Choose a strong password'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            {processing 
              ? (isRTL ? 'جاري إنشاء الحساب...' : 'Creating account...') 
              : (isRTL ? 'إنشاء الحساب والانضمام' : 'Create Account & Join')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRTL ? 'البريد الإلكتروني:' : 'Email:'} {invitation?.email}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {isRTL ? 'الدور:' : 'Role:'} {invitation?.role}
          </p>
        </div>
      </div>
    </div>
  )
}