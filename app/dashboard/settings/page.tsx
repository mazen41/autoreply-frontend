'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'
import IntegrationHub from '../../../components/integrations/IntegrationHub'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export default function SettingsPage() {
  const { t, isRTL } = useLang()
  const [user, setUser] = useState<User | null>(null)
  const [businessId, setBusinessId] = useState<number | null>(null)
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

  // Business profile form
  const [businessData, setBusinessData] = useState({
    business_name: '',
    business_type: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    working_days: [],
    working_from: '',
    working_to: '',
    services: '',
    reply_style: '',
  })
  const [businessLoading, setBusinessLoading] = useState(false)

  useEffect(() => {
    fetchUser()
    if (businessId) {
      fetchBusinessProfile()
    }
  }, [businessId])

  const fetchBusinessProfile = async () => {
    if (!businessId) return
    
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/business`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      
      if (response.ok) {
        const data = await response.json()
        setBusinessData({
          business_name: data.business_name || '',
          business_type: data.business_type || '',
          description: data.description || '',
          website: data.website || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          working_days: data.working_days || [],
          working_from: data.working_from || '',
          working_to: data.working_to || '',
          services: data.services || '',
          reply_style: data.reply_style || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch business profile:', error)
    }
  }

  const fetchUser = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      const data = await response.json()
      setUser(data)
      setName(data.name)
      setEmail(data.email)
      if (data.business_id) {
        setBusinessId(data.business_id)
      }
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
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
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
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
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

  const handleBusinessUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusinessLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(businessData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update business profile')
      }

      setSuccess(isRTL ? 'تم تحديث معلومات العمل بنجاح' : 'Business profile updated successfully')
    } catch (error: any) {
      setError(error.message || 'Failed to update business profile')
    } finally {
      setBusinessLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
        {isRTL ? 'الإعدادات' : 'Settings'}
      </h1>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          {success}
        </div>
      )}

      {/* Profile Section */}
      <div className="premium-card p-6" style={{ background: 'var(--surface-elevated)' }}>
        <h2 className="text-xl font-black tracking-[-0.03em] mb-4" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </h2>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'الاسم' : 'Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold transition-all btn-lime"
            style={{
              background: saving ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent))',
              color: 'var(--on-accent-text)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="premium-card p-6" style={{ background: 'var(--surface-elevated)' }}>
        <h2 className="text-xl font-black tracking-[-0.03em] mb-4" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold transition-all btn-lime"
            style={{
              background: saving ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent))',
              color: 'var(--on-accent-text)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (isRTL ? 'جاري التغيير...' : 'Changing...') : (isRTL ? 'تغيير كلمة المرور' : 'Change Password')}
          </button>
        </form>
      </div>

      {/* Business Profile Section */}
      <div className="premium-card p-6" style={{ background: 'var(--surface-elevated)' }}>
        <h2 className="text-xl font-black tracking-[-0.03em] mb-4" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'ملف العمل' : 'Business Profile'}
        </h2>

        <form onSubmit={handleBusinessUpdate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'اسم العمل' : 'Business Name'}
            </label>
            <input
              type="text"
              value={businessData.business_name}
              onChange={(e) => setBusinessData({...businessData, business_name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'نوع العمل' : 'Business Type'}
            </label>
            <input
              type="text"
              value={businessData.business_type}
              onChange={(e) => setBusinessData({...businessData, business_type: e.target.value})}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'الوصف' : 'Description'}
            </label>
            <textarea
              value={businessData.description}
              onChange={(e) => setBusinessData({...businessData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'الموقع الإلكتروني' : 'Website'}
              </label>
              <input
                type="url"
                value={businessData.website}
                onChange={(e) => setBusinessData({...businessData, website: e.target.value})}
                className="w-full px-4 py-3 rounded-xl input-os"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'رقم الهاتف' : 'Phone'}
              </label>
              <input
                type="tel"
                value={businessData.phone}
                onChange={(e) => setBusinessData({...businessData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl input-os"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'العنوان' : 'Address'}
            </label>
            <input
              type="text"
              value={businessData.address}
              onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'المدينة' : 'City'}
              </label>
              <input
                type="text"
                value={businessData.city}
                onChange={(e) => setBusinessData({...businessData, city: e.target.value})}
                className="w-full px-4 py-3 rounded-xl input-os"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'البلد' : 'Country'}
              </label>
              <input
                type="text"
                value={businessData.country}
                onChange={(e) => setBusinessData({...businessData, country: e.target.value})}
                className="w-full px-4 py-3 rounded-xl input-os"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'الخدمات/المنتجات' : 'Services/Products'}
            </label>
            <textarea
              value={businessData.services}
              onChange={(e) => setBusinessData({...businessData, services: e.target.value})}
              rows={2}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'نمط الرد' : 'Reply Style'}
            </label>
            <select
              value={businessData.reply_style}
              onChange={(e) => setBusinessData({...businessData, reply_style: e.target.value})}
              className="w-full px-4 py-3 rounded-xl input-os"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">{isRTL ? 'اختر نمط الرد' : 'Select reply style'}</option>
              <option value="friendly">{isRTL ? 'ودودي ومحترم' : 'Friendly & Professional'}</option>
              <option value="formal">{isRTL ? 'رسمي' : 'Formal'}</option>
              <option value="casual">{isRTL ? 'عفوي' : 'Casual'}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={businessLoading}
            className="px-6 py-3 rounded-xl font-bold transition-all btn-lime"
            style={{
              background: businessLoading ? 'var(--accent-focus)' : 'linear-gradient(135deg, var(--accent), var(--accent))',
              color: 'var(--on-accent-text)',
              opacity: businessLoading ? 0.7 : 1,
            }}
          >
            {businessLoading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ معلومات العمل' : 'Save Business Info')}
          </button>
        </form>
      </div>

      {/* Integrations Section */}
      <div className="premium-card p-6" style={{ background: 'var(--surface-elevated)' }}>
        <h2 className="text-xl font-black tracking-[-0.03em] mb-4" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'التكاملات' : 'Integrations'}
        </h2>
        {businessId ? <IntegrationHub businessId={businessId} /> : (
          <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'لم يتم العثور على معرف العمل' : 'No business ID found'}
          </div>
        )}
      </div>
    </div>
  )
}
