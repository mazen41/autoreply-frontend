'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export default function SettingsPage() {
  const { t, isRTL } = useLang()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) {
        setError('Please login to view settings')
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      setUser(data)
      setName(data.name)
      setEmail(data.email)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update profile')
      }

      const data = await response.json()
      setUser(data.user)
      setSuccess(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully')
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError(isRTL ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      return
    }

    setSaving(true)

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to change password')
      }

      setSuccess(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setError(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#F0F0FF' }}>
        {isRTL ? 'الإعدادات' : 'Settings'}
      </h1>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(0,255,178,0.1)', color: '#00FFB2' }}>
          {success}
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </h2>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
              {isRTL ? 'الاسم' : 'Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              background: saving ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #BF00FF)',
              color: '#050508',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
              {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
              {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-transparent"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(240,240,255,0.6)' }}>
              {isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-transparent"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0FF',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              background: saving ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #BF00FF)',
              color: '#050508',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (isRTL ? 'جاري التغيير...' : 'Changing...') : (isRTL ? 'تغيير كلمة المرور' : 'Change Password')}
          </button>
        </form>
      </div>
    </div>
  )
}
