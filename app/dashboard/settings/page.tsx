'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function InputField({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-text-tertiary focus:outline-none transition-all"
      />
    </div>
  )
}

const TABS = [
  { id: 'profile',   label: 'Profile',          icon: '👤' },
  { id: 'business',  label: 'Business',         icon: '🏢' },
  { id: 'security',  label: 'Security',         icon: '🔐' },
]

export default function SettingsPage() {
  const { t, isRTL } = useLang()
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<any>(null)
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Profile
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Business
  const [bizData, setBizData] = useState({
    business_name: '', business_type: '', description: '', website: '',
    phone: '', address: '', city: '', country: '', services: '', reply_style: '',
  })
  const [bizLoading, setBizLoading] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/auth/user`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      const data = await res.json()
      setUser(data)
      setName(data.name || '')
      setEmail(data.email || '')
      if (data.business_id) {
        setBusinessId(data.business_id)
        fetchBusiness(token)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBusiness(token: string) {
    try {
      const res = await fetch(`${API}/api/business`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      if (!res.ok) return
      const data = await res.json()
      setBizData({
        business_name: data.business_name || '',
        business_type: data.business_type || '',
        description: data.description || '',
        website: data.website || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        services: data.services || '',
        reply_style: data.reply_style || '',
      })
    } catch (e) { console.error(e) }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed')
      showToast(isRTL ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully')
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showToast(isRTL ? 'كلمة المرور غير متطابقة' : 'Passwords do not match', false); return }
    if (newPassword.length < 8) { showToast(isRTL ? 'يجب أن تكون 8 أحرف على الأقل' : 'Min 8 characters required', false); return }
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/auth/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, new_password_confirmation: confirmPassword }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed')
      showToast(isRTL ? 'تم تغيير كلمة المرور' : 'Password changed successfully')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setSaving(false)
    }
  }

  async function handleBusinessSave(e: React.FormEvent) {
    e.preventDefault()
    setBizLoading(true)
    try {
      const res = await fetch(`${API}/api/business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
        body: JSON.stringify(bizData),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed')
      showToast(isRTL ? 'تم تحديث معلومات العمل' : 'Business profile updated')
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setBizLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white tracking-tight">
          {isRTL ? 'الإعدادات' : 'Settings'}
        </h2>
        <p className="text-sm text-text-secondary">
          {isRTL ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar tabs */}
        <div className="md:w-48 flex-shrink-0 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${
                activeTab === tab.id
                  ? 'bg-accent/10 border-accent/20 text-accent'
                  : 'bg-transparent border-transparent text-text-secondary hover:bg-white/[0.02] hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="ml-auto w-1 h-4 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04] space-y-5"
              >
                <div className="flex items-center gap-4 pb-4 border-b border-white/[0.04]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-[#8B3FFB] flex items-center justify-center text-white text-xl font-black select-none">
                    {name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{name}</div>
                    <div className="text-xs text-text-secondary">{email}</div>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <InputField label={isRTL ? 'الاسم الكامل' : 'Full Name'} value={name} onChange={setName} required />
                  <InputField label={isRTL ? 'البريد الإلكتروني' : 'Email Address'} type="email" value={email} onChange={setEmail} required />
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-accent text-white hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {saving ? '...' : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Business Tab ── */}
            {activeTab === 'business' && (
              <motion.div
                key="business"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04]"
              >
                <div className="space-y-1 mb-5 pb-4 border-b border-white/[0.04]">
                  <div className="text-sm font-bold text-white">{isRTL ? 'ملف العمل' : 'Business Profile'}</div>
                  <p className="text-[11px] text-text-secondary">{isRTL ? 'معلومات عملك التي يستخدمها الذكاء الاصطناعي' : 'Business data used to train AI replies'}</p>
                </div>
                <form onSubmit={handleBusinessSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label={isRTL ? 'اسم العمل' : 'Business Name'} value={bizData.business_name} onChange={v => setBizData({...bizData, business_name: v})} />
                    <InputField label={isRTL ? 'نوع العمل' : 'Business Type'} value={bizData.business_type} onChange={v => setBizData({...bizData, business_type: v})} />
                    <InputField label={isRTL ? 'الموقع الإلكتروني' : 'Website'} type="url" value={bizData.website} onChange={v => setBizData({...bizData, website: v})} placeholder="https://" />
                    <InputField label={isRTL ? 'رقم الهاتف' : 'Phone'} type="tel" value={bizData.phone} onChange={v => setBizData({...bizData, phone: v})} />
                    <InputField label={isRTL ? 'المدينة' : 'City'} value={bizData.city} onChange={v => setBizData({...bizData, city: v})} />
                    <InputField label={isRTL ? 'البلد' : 'Country'} value={bizData.country} onChange={v => setBizData({...bizData, country: v})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">{isRTL ? 'الوصف' : 'Description'}</label>
                    <textarea value={bizData.description} onChange={e => setBizData({...bizData, description: e.target.value})} rows={3} className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-text-tertiary focus:outline-none resize-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">{isRTL ? 'الخدمات/المنتجات' : 'Services & Products'}</label>
                    <textarea value={bizData.services} onChange={e => setBizData({...bizData, services: e.target.value})} rows={2} className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-text-tertiary focus:outline-none resize-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">{isRTL ? 'نمط الرد' : 'Reply Style'}</label>
                    <select value={bizData.reply_style} onChange={e => setBizData({...bizData, reply_style: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all appearance-none">
                      <option value="" className="bg-[#14151D]">{isRTL ? 'اختر نمط الرد' : 'Select reply style'}</option>
                      <option value="friendly" className="bg-[#14151D]">{isRTL ? 'ودودي ومحترم' : 'Friendly & Professional'}</option>
                      <option value="formal" className="bg-[#14151D]">{isRTL ? 'رسمي' : 'Formal'}</option>
                      <option value="casual" className="bg-[#14151D]">{isRTL ? 'عفوي' : 'Casual'}</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={bizLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-accent text-white hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {bizLoading ? '...' : (isRTL ? 'حفظ معلومات العمل' : 'Save Business Info')}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-6 bg-[#14151D] border border-white/[0.04] space-y-5"
              >
                <div className="space-y-1 pb-4 border-b border-white/[0.04]">
                  <div className="text-sm font-bold text-white">{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</div>
                  <p className="text-[11px] text-text-secondary">{isRTL ? 'يوصى بتغييرها دورياً' : 'We recommend changing it periodically'}</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <InputField label={isRTL ? 'كلمة المرور الحالية' : 'Current Password'} type="password" value={currentPassword} onChange={setCurrentPassword} required />
                  <InputField label={isRTL ? 'كلمة المرور الجديدة' : 'New Password'} type="password" value={newPassword} onChange={setNewPassword} required />
                  <InputField label={isRTL ? 'تأكيد كلمة المرور' : 'Confirm New Password'} type="password" value={confirmPassword} onChange={setConfirmPassword} required />
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-accent text-white hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {saving ? '...' : (isRTL ? 'تغيير كلمة المرور' : 'Change Password')}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border flex items-center gap-2 ${
              toast.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${toast.ok ? 'bg-emerald-400' : 'bg-red-400'} animate-ping`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
