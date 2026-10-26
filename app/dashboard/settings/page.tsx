'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  Building2,
  ShieldCheck,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  Lock,
  Sparkles,
  CheckCircle2,
  Bell,
  Sliders
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input, { Textarea } from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { springs, variants } from '../../../lib/motion'
import Skeleton from '../../../components/ui/Skeleton'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function SettingsPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  // Profile Form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
  })

  // Business Form
  const [bizData, setBizData] = useState({
    business_name: '',
    business_type: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    services: '',
    reply_style: 'friendly',
  })

  // Password / Security Form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    void initSettings()
    const refreshForBusiness = () => { void initSettings() }
    window.addEventListener('naz:business-changed', refreshForBusiness)
    window.addEventListener('storage', refreshForBusiness)
    return () => {
      window.removeEventListener('naz:business-changed', refreshForBusiness)
      window.removeEventListener('storage', refreshForBusiness)
    }
  }, [])

  async function initSettings() {
    setLoading(true)
    setLoadError('')
    const token = getToken()
    if (!token) {
      setLoadError('Your session expired. Sign in again to load settings.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!res.ok) throw new Error('Could not load your account settings.')
      const data = await res.json()
      setProfile(prev => ({ ...prev, name: data.name || prev.name, email: data.email || prev.email }))
      await fetchBusiness(token)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load settings.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBusiness(token: string) {
    try {
      const res = await fetch(`${API}/api/business`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (res.ok) {
        const data = await res.json()
        setBizData(prev => ({
          ...prev,
          business_name: data.business_name || prev.business_name,
          business_type: data.business_type || prev.business_type,
          description: data.description || prev.description,
          website: data.website || prev.website,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          city: data.city || prev.city,
          country: data.country || prev.country,
          services: data.services || prev.services,
          reply_style: data.reply_style || prev.reply_style,
        }))
      } else throw new Error('Could not load the selected business profile')
    } catch (error) { throw error }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = getToken()
      if (token) {
        const response = await fetch(`${API}/api/auth/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
          body: JSON.stringify({ name: profile.name, email: profile.email }),
        })
        if (!response.ok) throw new Error('Profile update failed')
      } else throw new Error('Your session expired. Sign in again.')
      toast.success('Personal profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleBusinessSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = getToken()
      if (token) {
        const response = await fetch(`${API}/api/business`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
          body: JSON.stringify(bizData),
        })
        if (!response.ok) throw new Error('Business profile update failed')
      } else throw new Error('Your session expired. Sign in again.')
      toast.success('Business context and AI profile saved')
    } catch {
      toast.error('Failed to update business profile')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    if (passwords.newPassword.length < 8) {
      toast.error('New password must contain at least 8 characters')
      return
    }

    setSaving(true)
    try {
      const token = getToken()
      if (token) {
        const res = await fetch(`${API}/api/auth/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
          body: JSON.stringify({
            current_password: passwords.currentPassword,
            new_password: passwords.newPassword,
            new_password_confirmation: passwords.confirmPassword,
          }),
        })
        if (!res.ok) throw new Error('Password mismatch')
      } else throw new Error('Your session expired. Sign in again.')
      toast.success('Security password successfully changed')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      toast.error('Unable to change password. Verify your current password.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-10 w-full mb-6" rounded="lg" />
        <div className="p-6 rounded-xl border border-border bg-surface space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <motion.main
      dir={isRTL ? 'rtl' : 'ltr'}
      className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8"
      variants={variants.page}
      initial="hidden"
      animate="visible"
      transition={springs.smooth}
    >
      <PageHeader
        title={L('Settings & Workspace Preferences', 'الإعدادات وتفضيلات مساحة العمل')}
        description={L('Configure your personal credentials, company profile, AI persona reply tone, and security authentication.', 'أدر بياناتك الشخصية وملف النشاط التجاري ونبرة ردود الذكاء الاصطناعي وإعدادات الأمان.')}
      >
        <Tabs
          variant="segmented"
          tabs={[
            { id: 'profile', label: L('User Profile', 'الملف الشخصي'), icon: <User size={14} /> },
            { id: 'business', label: L('Business & AI Persona', 'النشاط التجاري وشخصية الذكاء الاصطناعي'), icon: <Building2 size={14} /> },
            { id: 'security', label: L('Security & Access', 'الأمان والوصول'), icon: <ShieldCheck size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </PageHeader>

      {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => void initSettings()} disabled={loading}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                <User size={20} />
              </div>
              <div>
                <CardTitle>{L('Personal Information', 'المعلومات الشخصية')}</CardTitle>
                <CardDescription>{L('Update your personal account credentials and email alerts.', 'حدّث بيانات حسابك الشخصية وإشعارات البريد الإلكتروني.')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleProfileSave}>
            <CardContent className="space-y-6">
              {/* Avatar section */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-surface-elevated/40 border border-border">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-brand flex items-center justify-center text-white text-xl font-black shadow-md">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary text-sm">{profile.name}</span>
                    <Badge variant="ai" size="sm">{profile.role}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={L('Full Name', 'الاسم الكامل')}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder={isRTL ? 'محمد الراشد' : 'Mohammed Al-Rashid'}
                  icon={<User size={14} />}
                  required
                />
                <Input
                  label={L('Email Address', 'البريد الإلكتروني')}
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="mohammed@company.com"
                  icon={<Mail size={14} />}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="justify-end border-t border-border/60">
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={<Save size={14} />}
              >
                {L('Save Profile Changes', 'حفظ تغييرات الملف الشخصي')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ── BUSINESS & AI PERSONA TAB ── */}
      {activeTab === 'business' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                  <Building2 size={20} />
                </div>
                <div>
                  <CardTitle>{L('Business Profile & AI Persona', 'ملف النشاط التجاري وشخصية الذكاء الاصطناعي')}</CardTitle>
                  <CardDescription>
                    {L('Information used as fundamental prompt context across all omnichannel bots.', 'تُستخدم هذه المعلومات كسياق أساسي لجميع البوتات على مختلف القنوات.')}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="ai" size="sm">
                <Sparkles size={11} className="mr-1" /> {L('System Prompt Context', 'سياق تعليمات النظام')}
              </Badge>
            </div>
          </CardHeader>

          <form onSubmit={handleBusinessSave}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={L('Registered Business Name', 'اسم النشاط التجاري المسجل')}
                  value={bizData.business_name}
                  onChange={(e) => setBizData({ ...bizData, business_name: e.target.value })}
                  placeholder={isRTL ? 'اسم الشركة' : 'Company LLC'}
                  icon={<Building2 size={14} />}
                />
                <Input
                  label={L('Industry / Category', 'المجال / التصنيف')}
                  value={bizData.business_type}
                  onChange={(e) => setBizData({ ...bizData, business_type: e.target.value })}
                  placeholder={L('e.g. Retail, Healthcare, Logistics', 'مثال: تجارة التجزئة، الرعاية الصحية، الخدمات اللوجستية')}
                />
                <Input
                  label={L('Official Website', 'الموقع الرسمي')}
                  type="url"
                  value={bizData.website}
                  onChange={(e) => setBizData({ ...bizData, website: e.target.value })}
                  placeholder="https://company.com"
                  icon={<Globe size={14} />}
                />
                <Input
                  label={L('Customer Support Hotline', 'هاتف خدمة العملاء')}
                  value={bizData.phone}
                  onChange={(e) => setBizData({ ...bizData, phone: e.target.value })}
                  placeholder="+966 ..."
                  icon={<Phone size={14} />}
                />
                <Input
                  label={L('City & Headquarters', 'المدينة والمقر الرئيسي')}
                  value={bizData.city}
                  onChange={(e) => setBizData({ ...bizData, city: e.target.value })}
                  placeholder={L('Riyadh, Dubai, Cairo...', 'الرياض، دبي، القاهرة...')}
                  icon={<MapPin size={14} />}
                />
                <Input
                  label={L('Country', 'الدولة')}
                  value={bizData.country}
                  onChange={(e) => setBizData({ ...bizData, country: e.target.value })}
                  placeholder={L('Saudi Arabia', 'المملكة العربية السعودية')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">{L('Business Overview (AI Context)', 'نبذة عن النشاط (سياق الذكاء الاصطناعي)')}</label>
                <Textarea
                  value={bizData.description}
                  onChange={(e) => setBizData({ ...bizData, description: e.target.value })}
                  rows={3}
                  placeholder={L('Explain what your company does and core differentiators...', 'اشرح طبيعة نشاطك وما يميزه عن غيره...')}
                />
                <span className="text-[11px] text-text-tertiary">
                  {L('Bots will reference this when introducing your business to first-time customers.', 'ستستخدم البوتات هذه المعلومات عند تعريف العملاء الجدد بنشاطك.')}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">{L('Key Products, Services & Policies', 'أهم المنتجات والخدمات والسياسات')}</label>
                <Textarea
                  value={bizData.services}
                  onChange={(e) => setBizData({ ...bizData, services: e.target.value })}
                  rows={3}
                  placeholder={L('Highlight key services, return windows, warranties, and shipping details...', 'اذكر الخدمات الأساسية وسياسة الإرجاع والضمان وتفاصيل الشحن...')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">{L('AI Tone & Reply Style', 'نبرة الذكاء الاصطناعي وأسلوب الرد')}</label>
                <Select
                  dir={isRTL ? 'rtl' : 'ltr'}
                  value={bizData.reply_style}
                  onChange={(e) => setBizData({ ...bizData, reply_style: e.target.value })}
                  options={[
                    { value: 'friendly', label: L('Friendly & Professional (Recommended for most retail & support)', 'ودود واحترافي (مناسب لمعظم أنشطة البيع والدعم)') },
                    { value: 'formal', label: L('Strictly Formal & Corporate (Suited for B2B, Legal & Finance)', 'رسمي ومؤسسي (مناسب للأعمال بين الشركات والقانون والتمويل)') },
                    { value: 'casual', label: L('Casual & Youthful (Suited for lifestyle, apparel & influencer brands)', 'عفوي وشبابي (مناسب لأسلوب الحياة والأزياء والعلامات الشخصية)') },
                  ]}
                />
              </div>
            </CardContent>

            <CardFooter className="justify-end border-t border-border/60">
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={<Save size={14} />}
              >
                {L('Save Business Profile', 'حفظ ملف النشاط التجاري')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-error/10 text-error">
                <Lock size={20} />
              </div>
              <div>
                <CardTitle>{L('Security & Password Management', 'الأمان وإدارة كلمة المرور')}</CardTitle>
                <CardDescription>
                  {L('Ensure your account is protected with strong credentials.', 'احمِ حسابك باستخدام بيانات اعتماد قوية.')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handlePasswordChange}>
            <CardContent className="space-y-4 max-w-md">
              <Input
                label={L('Current Password', 'كلمة المرور الحالية')}
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="••••••••••••"
                icon={<Lock size={14} />}
                required
              />

              <Input
                label={L('New Password', 'كلمة المرور الجديدة')}
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder={L('At least 8 characters', '٨ أحرف على الأقل')}
                icon={<Lock size={14} />}
                required
              />

              <Input
                label={L('Confirm New Password', 'تأكيد كلمة المرور الجديدة')}
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder={L('Re-enter new password', 'أعد إدخال كلمة المرور الجديدة')}
                icon={<Lock size={14} />}
                required
              />
            </CardContent>

            <CardFooter className="justify-start border-t border-border/60">
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={<Save size={14} />}
              >
                {L('Update Password', 'تحديث كلمة المرور')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </motion.main>
  )
}
