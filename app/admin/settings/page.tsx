'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface Settings {
  app_name: string
  app_url: string
  moyasar_publishable_key: string
  moyasar_secret_key: string | null
}

export default function AdminSettingsPage() {
  const { t, isRTL } = useLang()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    app_name: '',
    moyasar_publishable_key: '',
    moyasar_secret_key: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data)
      setFormData({
        app_name: data.app_name || '',
        moyasar_publishable_key: data.moyasar_publishable_key || '',
        moyasar_secret_key: '',
      })
    } catch (error: any) {
      console.error('Failed to fetch settings:', error)
      setError(error.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      setSuccess(isRTL ? 'تم تحديث الإعدادات بنجاح' : 'Settings updated successfully')
      fetchSettings()
    } catch (error: any) {
      console.error('Failed to update settings:', error)
      setError(error.message || 'Failed to update settings')
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
      <div>
        <h1 className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
          {isRTL ? 'الإعدادات' : 'Settings'}
        </h1>
        <p style={{ color: 'rgba(240,240,255,0.6)' }}>
          {isRTL ? 'إدارة إعدادات المنصة' : 'Manage platform settings'}
        </p>
      </div>

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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'الإعدادات العامة' : 'General Settings'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'اسم التطبيق' : 'App Name'}
              </label>
              <input
                type="text"
                value={formData.app_name}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-transparent"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'رابط التطبيق' : 'App URL'}
              </label>
              <input
                type="text"
                value={settings?.app_url || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-transparent"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'rgba(240,240,255,0.4)',
                  opacity: 0.5,
                }}
              />
            </div>
          </form>
        </div>

        {/* Payment Settings */}
        <div className="rounded-2xl p-6" style={{ background: '#0F0F1A' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'إعدادات الدفع' : 'Payment Settings'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                Moyasar {isRTL ? 'مفتاح النشر' : 'Publishable Key'}
              </label>
              <input
                type="text"
                value={formData.moyasar_publishable_key}
                onChange={(e) => setFormData({ ...formData, moyasar_publishable_key: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-transparent"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                placeholder="pk_live_..."
              />
              <p className="text-xs mt-1" style={{ color: 'rgba(240,240,255,0.4)' }}>
                {isRTL ? 'مفتاح عام للعميل' : 'Public key for client-side'}
              </p>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                Moyasar {isRTL ? 'مفتاح السري' : 'Secret Key'}
              </label>
              <input
                type="password"
                value={formData.moyasar_secret_key}
                onChange={(e) => setFormData({ ...formData, moyasar_secret_key: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-transparent"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                placeholder="sk_live_..."
              />
              <p className="text-xs mt-1" style={{ color: 'rgba(240,240,255,0.4)' }}>
                {isRTL ? 'مفتاح سري للخادم' : 'Secret key for server-side'}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold transition-all"
              style={{
                background: saving ? 'rgba(0,255,178,0.3)' : 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                color: '#050508',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving 
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                : (isRTL ? 'حفظ الإعدادات' : 'Save Settings')}
            </button>
          </form>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.2)' }}>
          <h3 className="font-bold mb-2" style={{ color: '#00FFB2' }}>
            {isRTL ? 'معلومات Moyasar' : 'About Moyasar'}
          </h3>
          <p className="text-sm mb-3" style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL 
              ? 'Moyasar هي بوابة دفع سعودية تدعم البطاقات و Apple Pay.' 
              : 'Moyasar is a Saudi payment gateway supporting cards and Apple Pay.'}
          </p>
          <a 
            href="https://moyasar.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm" 
            style={{ color: '#00FFB2' }}
          >
            {isRTL ? 'زيارة moyasar.com' : 'Visit moyasar.com'} →
          </a>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(191,0,255,0.05)', border: '1px solid rgba(191,0,255,0.2)' }}>
          <h3 className="font-bold mb-2" style={{ color: '#BF00FF' }}>
            {isRTL ? 'إعدادات الويب هوك' : 'Webhook Settings'}
          </h3>
          <p className="text-sm mb-3" style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL 
              ? 'قم بإعداد الويب هوك في لوحة تحكم Moyasar:' 
              : 'Configure webhook in Moyasar dashboard:'}
          </p>
          <code className="text-sm px-3 py-2 rounded-lg block" style={{ background: 'rgba(0,0,0,0.3)', color: '#F0F0FF' }}>
            {settings?.app_url}/api/payments/webhook
          </code>
        </div>
      </div>
    </div>
  )
}
