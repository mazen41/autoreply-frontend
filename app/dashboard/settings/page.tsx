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
  Sliders,
  Camera
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input, { Textarea } from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import toast from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile Form
  const [profile, setProfile] = useState({
    name: 'Mohammed Al-Rashid',
    email: 'mohammed@nazbiz.com',
    role: 'Owner & Admin',
  })

  // Business Form
  const [bizData, setBizData] = useState({
    business_name: 'NazBiz Omnichannel Commerce',
    business_type: 'E-commerce & Retail',
    description: 'Premier regional retailer specializing in smart tech, lifestyle accessories, and 24/7 customer care.',
    website: 'https://nazbiz.com',
    phone: '+966 50 123 4567',
    address: 'King Fahd Road, Al Olaya District',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    services: 'Express Delivery, 14-day Hassle-free Returns, Warranty Replacement, Technical Support',
    reply_style: 'friendly',
  })

  // Password / Security Form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    initSettings()
  }, [])

  async function initSettings() {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
        }))
        if (data.business_id) {
          fetchBusiness(token)
        }
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  async function fetchBusiness(token: string) {
    try {
      const res = await fetch(`${API}/api/business`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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
      }
    } catch {
      // silent
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = getToken()
      if (token) {
        await fetch(`${API}/api/auth/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
          body: JSON.stringify({ name: profile.name, email: profile.email }),
        })
      }
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
        await fetch(`${API}/api/business`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
          body: JSON.stringify(bizData),
        })
      }
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
      }
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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <span className="text-xs text-text-tertiary">Loading account preferences...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Settings & Workspace Preferences"
        description="Configure your personal credentials, company profile, AI persona reply tone, and security authentication."
      >
        <Tabs
          variant="segmented"
          tabs={[
            { id: 'profile', label: 'User Profile', icon: <User size={14} /> },
            { id: 'business', label: 'Business & AI Persona', icon: <Building2 size={14} /> },
            { id: 'security', label: 'Security & Access', icon: <ShieldCheck size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </PageHeader>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                <User size={20} />
              </div>
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal account credentials and email alerts.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleProfileSave}>
            <CardContent className="space-y-6">
              {/* Avatar section */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-surface-elevated/40 border border-border">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-md">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-surface-overlay border border-border rounded-lg text-text-secondary hover:text-text-primary shadow-xs transition-colors"
                    title="Change picture"
                  >
                    <Camera size={12} />
                  </button>
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
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Mohammed Al-Rashid"
                  icon={<User size={14} />}
                  required
                />
                <Input
                  label="Email Address"
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
                Save Profile Changes
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
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <CardTitle>Business Profile & AI Persona</CardTitle>
                  <CardDescription>
                    Information used as fundamental prompt context across all omnichannel bots.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="ai" size="sm">
                <Sparkles size={11} className="mr-1" /> System Prompt Context
              </Badge>
            </div>
          </CardHeader>

          <form onSubmit={handleBusinessSave}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Business Name"
                  value={bizData.business_name}
                  onChange={(e) => setBizData({ ...bizData, business_name: e.target.value })}
                  placeholder="Company LLC"
                  icon={<Building2 size={14} />}
                />
                <Input
                  label="Industry / Category"
                  value={bizData.business_type}
                  onChange={(e) => setBizData({ ...bizData, business_type: e.target.value })}
                  placeholder="e.g. Retail, Healthcare, Logistics"
                />
                <Input
                  label="Official Website"
                  type="url"
                  value={bizData.website}
                  onChange={(e) => setBizData({ ...bizData, website: e.target.value })}
                  placeholder="https://company.com"
                  icon={<Globe size={14} />}
                />
                <Input
                  label="Customer Support Hotline"
                  value={bizData.phone}
                  onChange={(e) => setBizData({ ...bizData, phone: e.target.value })}
                  placeholder="+966 ..."
                  icon={<Phone size={14} />}
                />
                <Input
                  label="City & Headquarters"
                  value={bizData.city}
                  onChange={(e) => setBizData({ ...bizData, city: e.target.value })}
                  placeholder="Riyadh, Dubai, Cairo..."
                  icon={<MapPin size={14} />}
                />
                <Input
                  label="Country"
                  value={bizData.country}
                  onChange={(e) => setBizData({ ...bizData, country: e.target.value })}
                  placeholder="Saudi Arabia"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Business Overview (AI Context)</label>
                <Textarea
                  value={bizData.description}
                  onChange={(e) => setBizData({ ...bizData, description: e.target.value })}
                  rows={3}
                  placeholder="Explain what your company does and core differentiators..."
                />
                <span className="text-[11px] text-text-tertiary">
                  Bots will reference this when introducing your business to first-time customers.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Key Products, Services & Policies</label>
                <Textarea
                  value={bizData.services}
                  onChange={(e) => setBizData({ ...bizData, services: e.target.value })}
                  rows={3}
                  placeholder="Highlight key services, return windows, warranties, and shipping details..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">AI Tone & Reply Style</label>
                <Select
                  value={bizData.reply_style}
                  onChange={(e) => setBizData({ ...bizData, reply_style: e.target.value })}
                  options={[
                    { value: 'friendly', label: 'Friendly & Professional (Recommended for most retail & support)' },
                    { value: 'formal', label: 'Strictly Formal & Corporate (Suited for B2B, Legal & Finance)' },
                    { value: 'casual', label: 'Casual & Youthful (Suited for lifestyle, apparel & influencer brands)' },
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
                Save Business Profile
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
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <Lock size={20} />
              </div>
              <div>
                <CardTitle>Security & Password Management</CardTitle>
                <CardDescription>
                  Ensure your account is protected with strong credentials.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handlePasswordChange}>
            <CardContent className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="••••••••••••"
                icon={<Lock size={14} />}
                required
              />

              <Input
                label="New Password"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="At least 8 characters"
                icon={<Lock size={14} />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
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
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
