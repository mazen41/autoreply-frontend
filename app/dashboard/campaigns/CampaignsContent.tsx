'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Send, Mail, MessageSquare, Calendar, BarChart2, Trash2, Edit2,
  X, ChevronDown, Users, RefreshCw, Clock, CheckCircle,
  AlertCircle, Filter, Eye, Zap, Search, TrendingUp, Plus,
  Megaphone, Target, Activity, Globe, CalendarOff, Play,
  FileText, ShoppingBag, ShoppingCart, MessageCircle, Bot,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignType = 'bulk' | 'email' | 'social' | 'comment' | 'cart' | 'other'
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'partially_failed'

interface Channel {
  id: number
  type: string
  page_name: string
  status: string
}

interface UnifiedCampaign {
  id: number
  type: CampaignType
  name: string
  subject?: string
  message?: string
  content?: string
  channel_id?: number
  channel?: Channel
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number | null
  sent_count: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  failed_count: number | null
  error_message?: string | null
  created_at: string
  metrics?: {
    conversions?: number
    revenue?: number
  }
}

interface BulkCampaignForm {
  name: string
  message: string
  channel_id: string
  scheduled_at: string
  last_activity_days: number | ''
}

interface EmailCampaignForm {
  name: string
  subject: string
  content: string
  audienceMode: 'manual' | 'gmail' | 'contacts'
  recipientsText: string
  channelIds: number[]
  channelTypes: string[]
  lastActiveDays: number | ''
  scheduled_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function token() {
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers as Record<string, string> || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const firstError = data.errors ? Object.values(data.errors).flat()[0] : null
    throw new Error(String(firstError || data.error || data.message || 'Request failed'))
  }
  return data
}

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

function formatDate(value: string | null, tz: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d)
}

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👍',
  telegram: '✈️', gmail: '📧', tiktok: '🎵',
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  draft:            { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: <Edit2 size={11} />, label: 'Draft' },
  scheduled:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Clock size={11} />, label: 'Scheduled' },
  sending:          { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <RefreshCw size={11} className="animate-spin" />, label: 'Sending' },
  sent:             { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <CheckCircle size={11} />, label: 'Sent' },
  failed:           { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <AlertCircle size={11} />, label: 'Failed' },
  partially_failed: { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: <AlertCircle size={11} />, label: 'Partial' },
}

const CAMPAIGN_TYPES: { type: CampaignType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'bulk', label: 'Bulk Messages', icon: <Send size={16} />, description: 'Send bulk messages to connected channels' },
  { type: 'email', label: 'Email Campaigns', icon: <Mail size={16} />, description: 'Create and send email campaigns' },
  { type: 'social', label: 'Social Posts', icon: <MessageSquare size={16} />, description: 'Schedule AI-generated social media posts' },
  { type: 'comment', label: 'Comment Automation', icon: <Bot size={16} />, description: 'AI-powered automatic comment replies' },
  { type: 'cart', label: 'Cart Recovery', icon: <ShoppingCart size={16} />, description: 'Recover abandoned shopping carts' },
  { type: 'other', label: 'Other Automation', icon: <Zap size={16} />, description: 'Other marketing automation workflows' },
]

const ACTIVITY_OPTIONS = [
  { value: 7,   label: 'Active last 7 days' },
  { value: 14,  label: 'Active last 14 days' },
  { value: 30,  label: 'Active last 30 days' },
  { value: 60,  label: 'Active last 60 days' },
  { value: 90,  label: 'Active last 90 days' },
  { value: 180, label: 'Active last 6 months' },
  { value: 365, label: 'Active last year' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number | null; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value ?? 0}</span>
      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}

function ChannelBadge({ channel }: { channel?: Channel }) {
  if (!channel) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
      padding: '2px 8px', borderRadius: 20, background: 'var(--surface)',
      border: '1px solid var(--border)', color: 'var(--text-secondary)',
    }}>
      {CHANNEL_ICONS[channel.type] || '📱'} {channel.page_name || channel.type}
    </span>
  )
}

function CampaignTypeBadge({ type }: { type: CampaignType }) {
  const config = CAMPAIGN_TYPES.find(t => t.type === type)
  if (!config) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
      padding: '2px 8px', borderRadius: 20, background: 'var(--accent-subtle)',
      border: '1px solid var(--accent-focus)', color: 'var(--accent)',
    }}>
      {config.icon} {config.label}
    </span>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
}

function btnStyle(variant: 'primary' | 'ghost' | 'danger' | 'success'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '1.5px solid transparent', transition: 'opacity .15s',
  }
  if (variant === 'primary') return { ...base, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
  if (variant === 'danger')  return { ...base, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }
  if (variant === 'success') return { ...base, background: 'rgba(16,185,129,0.1)', color: '#10b981', borderColor: 'rgba(16,185,129,0.25)' }
  return { ...base, background: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CampaignsContent() {
  const [campaigns, setCampaigns]     = useState<UnifiedCampaign[]>([])
  const [channels, setChannels]       = useState<Channel[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterType, setFilterType]   = useState<CampaignType | ''>('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [modalType, setModalType]     = useState<CampaignType>('bulk')
  const [editing, setEditing]         = useState<UnifiedCampaign | null>(null)
  const [bulkForm, setBulkForm]       = useState<BulkCampaignForm>({ name: '', message: '', channel_id: '', scheduled_at: '', last_activity_days: 30 })
  const [emailForm, setEmailForm]     = useState<EmailCampaignForm>({ name: '', subject: '', content: '', audienceMode: 'manual', recipientsText: '', channelIds: [], channelTypes: [], lastActiveDays: 30, scheduled_at: '' })
  const [saving, setSaving]           = useState(false)
  const [actionId, setActionId]       = useState<number | null>(null)
  const [statsId, setStatsId]         = useState<number | null>(null)
  const [tz, setTz]                   = useState('UTC')
  const [search, setSearch]           = useState('')

  useEffect(() => { setTz(detectTimezone()) }, [])

  // Load channels once
  useEffect(() => {
    apiFetch('/api/channels')
      .then(d => {
        const list = Array.isArray(d) ? d : (d.data || d.channels || [])
        setChannels(list.filter((c: Channel) => c.status === 'connected'))
      })
      .catch(() => {})
  }, [])

  const fetchCampaigns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // Fetch both bulk and email campaigns
      const [bulkRes, emailRes] = await Promise.all([
        apiFetch('/api/campaigns').catch(() => ({ data: [] })),
        apiFetch('/api/email-campaigns').catch(() => ({ data: [] }))
      ])

      const bulkCampaigns = (bulkRes.data || []).map((c: any) => ({ ...c, type: 'bulk' as CampaignType }))
      const emailCampaigns = (emailRes.data || []).map((c: any) => ({ ...c, type: 'email' as CampaignType }))

      setCampaigns([...bulkCampaigns, ...emailCampaigns])
    } catch (e: any) { if (!silent) toast.error(e.message) }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  // Real-time progress for sending campaigns
  const hasSendingCampaign = campaigns.some(c => c.status === 'sending')
  useEffect(() => {
    if (!hasSendingCampaign) return
    const interval = setInterval(() => { fetchCampaigns(true) }, 3000)
    return () => clearInterval(interval)
  }, [hasSendingCampaign, fetchCampaigns])

  const openCreate = (type: CampaignType) => {
    setEditing(null)
    setModalType(type)
    setBulkForm({ name: '', message: '', channel_id: '', scheduled_at: '', last_activity_days: 30 })
    setEmailForm({ name: '', subject: '', content: '', audienceMode: 'manual', recipientsText: '', channelIds: [], channelTypes: [], lastActiveDays: 30, scheduled_at: '' })
    setModalOpen(true)
  }

  const openEdit = (c: UnifiedCampaign) => {
    setEditing(c)
    setModalType(c.type)
    if (c.type === 'bulk') {
      setBulkForm({
        name: c.name,
        message: c.message || '',
        channel_id: String(c.channel_id || ''),
        scheduled_at: '',
        last_activity_days: 30,
      })
    } else if (c.type === 'email') {
      setEmailForm({
        name: c.name,
        subject: c.subject || '',
        content: c.content || '',
        audienceMode: 'manual',
        recipientsText: '',
        channelIds: [],
        channelTypes: [],
        lastActiveDays: 30,
        scheduled_at: '',
      })
    }
    setModalOpen(true)
  }

  const saveCampaign = async () => {
    setSaving(true)
    try {
      if (modalType === 'bulk') {
        if (!bulkForm.channel_id) { toast.error('Please select a channel'); setSaving(false); return }
        const body = {
          name: bulkForm.name.trim(),
          message: bulkForm.message.trim(),
          channel_id: Number(bulkForm.channel_id),
          ...(bulkForm.scheduled_at ? { scheduled_at: bulkForm.scheduled_at, timezone: tz } : {}),
        }
        await apiFetch('/api/campaigns', { method: 'POST', body: JSON.stringify(body) })
        toast.success('Campaign created ✓')
      } else if (modalType === 'email') {
        const body = {
          name: emailForm.name.trim(),
          subject: emailForm.subject.trim(),
          content: emailForm.content,
          audience_criteria: {
            mode: emailForm.audienceMode,
            recipients: emailForm.audienceMode === 'manual' ? emailForm.recipientsText.split(/[\n,;]/).map(e => e.trim().toLowerCase()).filter(Boolean) : undefined,
            channel_ids: emailForm.channelIds,
            channel_types: emailForm.channelTypes,
            last_active_days: emailForm.lastActiveDays !== '' ? Number(emailForm.lastActiveDays) : null,
          },
          ...(emailForm.scheduled_at ? { scheduled_at: emailForm.scheduled_at, timezone: tz } : {}),
        }
        await apiFetch('/api/email-campaigns', { method: 'POST', body: JSON.stringify(body) })
        toast.success('Email campaign created ✓')
      } else {
        toast.error('Campaign type not implemented yet')
        setSaving(false)
        return
      }
      setModalOpen(false)
      fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign permanently?')) return
    setActionId(id)
    try {
      const campaign = campaigns.find(c => c.id === id)
      if (campaign?.type === 'bulk') {
        await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      } else if (campaign?.type === 'email') {
        await apiFetch(`/api/email-campaigns/${id}`, { method: 'DELETE' })
      }
      toast.success('Deleted')
      fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const statsMap = useMemo(() => {
    const m: Record<number, UnifiedCampaign> = {}
    campaigns.forEach(c => { m[c.id] = c })
    return m
  }, [campaigns])

  const viewingStats = statsId ? statsMap[statsId] : null

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    let result = campaigns
    if (filterType) result = result.filter(c => c.type === filterType)
    if (filterStatus) result = result.filter(c => c.status === filterStatus)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.message?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.channel?.page_name?.toLowerCase().includes(q)
      )
    }
    return result
  }, [campaigns, filterType, filterStatus, search])

  // Summary stats
  const summary = useMemo(() => ({
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    sending: campaigns.filter(c => c.status === 'sending').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    byType: CAMPAIGN_TYPES.reduce((acc, t) => {
      acc[t.type] = campaigns.filter(c => c.type === t.type).length
      return acc
    }, {} as Record<CampaignType, number>),
  }), [campaigns])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 0', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'linear-gradient(135deg,var(--accent),var(--accent-end))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent)',
            }}>
              <Megaphone size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Campaigns</h1>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>Manage all your marketing campaigns in one place</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
            borderRadius: 14, background: 'linear-gradient(135deg,var(--accent),var(--accent-end))', color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent)',
            transition: 'transform .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <Plus size={16} /> New Campaign
        </button>
      </motion.div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: summary.total, color: 'var(--text-primary)', icon: <Megaphone size={15} /> },
          { label: 'Drafts', value: summary.draft, color: '#64748b', icon: <Edit2 size={15} /> },
          { label: 'Sending', value: summary.sending, color: '#3b82f6', icon: <RefreshCw size={15} /> },
          { label: 'Sent', value: summary.sent, color: '#10b981', icon: <CheckCircle size={15} /> },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }}
            style={{
              padding: '18px 20px', borderRadius: 16,
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -18, right: -18, width: 64, height: 64, borderRadius: '50%', background: s.color, opacity: 0.08 }} />
            <div style={{
              width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `color-mix(in srgb, ${s.color} 14%, transparent)`, color: s.color,
            }}>{s.icon}</div>
            <div>
              <span style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</span>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Campaign type quick stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CAMPAIGN_TYPES.map(t => (
          <button
            key={t.type}
            onClick={() => setFilterType(filterType === t.type ? '' : t.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 10, border: '1.5px solid var(--border)',
              background: filterType === t.type ? 'var(--accent-subtle)' : 'var(--surface)',
              color: filterType === t.type ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s',
            }}
          >
            {t.icon} {t.label} <span style={{ fontSize: 10, opacity: 0.7 }}>({summary.byType[t.type] || 0})</span>
          </button>
        ))}
      </div>

      {/* Stats panel */}
      {viewingStats && (
        <div style={{ marginBottom: 24, padding: 24, borderRadius: 16, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingStats.name}</h2>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <CampaignTypeBadge type={viewingStats.type} />
                <ChannelBadge channel={viewingStats.channel} />
                {viewingStats.sent_at && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sent {formatDate(viewingStats.sent_at, tz)}</span>}
              </div>
            </div>
            <button onClick={() => setStatsId(null)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>← Back</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 12 }}>
            {[
              { label: 'Recipients', value: viewingStats.total_recipients },
              { label: 'Sent', value: viewingStats.sent_count || viewingStats.delivered_count, color: '#10b981' },
              { label: 'Opened', value: viewingStats.opened_count, color: '#3b82f6' },
              { label: 'Clicked', value: viewingStats.clicked_count, color: '#f59e0b' },
              { label: 'Failed', value: viewingStats.failed_count, color: '#ef4444' },
            ].filter(s => s.value !== null && s.value !== undefined).map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <StatPill label={s.label} value={s.value} color={s.color} />
              </div>
            ))}
          </div>
          {viewingStats.error_message && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#ef4444' }}>
              ⚠ {viewingStats.error_message}
            </div>
          )}
        </div>
      )}

      {!viewingStats && (
        <>
          {/* Toolbar: search + filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search campaigns…"
                style={{ ...inputStyle, paddingLeft: 36, height: 38, boxSizing: 'border-box' }}
              />
            </div>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[{ v: '', l: 'All' }, { v: 'draft', l: 'Draft' }, { v: 'scheduled', l: 'Scheduled' }, { v: 'sending', l: 'Sending' }, { v: 'sent', l: 'Sent' }, { v: 'failed', l: 'Failed' }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setFilterStatus(v)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: '1px solid var(--border)', cursor: 'pointer',
                    background: filterStatus === v ? 'var(--accent)' : 'var(--surface)',
                    color: filterStatus === v ? '#fff' : 'var(--text-secondary)',
                    transition: 'all .15s',
                  }}
                >{l}</button>
              ))}
            </div>

            <button
              onClick={() => fetchCampaigns()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0,
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Campaign list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 112, borderRadius: 16, background: 'var(--surface-elevated)', border: '1px solid var(--border)', opacity: 0.6 }} />
              ))
            ) : filteredCampaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 24px', borderRadius: 20, background: 'var(--surface-elevated)', border: '1.5px dashed var(--border)' }}>
                {search.trim() || filterType || filterStatus ? (
                  <>
                    <Search size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 14 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 6px' }}>No matching campaigns</p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 20px' }}>Try different filters or clear search</p>
                    <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus('') }} style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Clear Filters</button>
                  </>
                ) : (
                  <>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(14,122,254,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Megaphone size={32} style={{ color: 'var(--accent)' }} />
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>No campaigns yet</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 28px' }}>Create your first campaign to reach your audience</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                        borderRadius: 12, background: 'var(--accent)', color: '#fff',
                        border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                      }}
                    >
                      <Plus size={15} /> Create First Campaign
                    </button>
                  </>
                )}
              </div>
            ) : filteredCampaigns.map(c => {
              const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft
              const busy = actionId === c.id
              const sentPct = (c.total_recipients ?? 0) > 0 ? Math.round(((c.sent_count || c.delivered_count || 0) / c.total_recipients!) * 100) : 0
              return (
                <div
                  key={c.id}
                  style={{ borderRadius: 16, background: 'var(--surface-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}
                >
                  {/* Card body */}
                  <div style={{ padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Status icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: sc.bg, border: `1.5px solid ${sc.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color,
                    }}>
                      {React.cloneElement(sc.icon as React.ReactElement<any>, { size: 18 })}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{c.name}</span>
                        <CampaignTypeBadge type={c.type} />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                          {sc.icon} {sc.label}
                        </span>
                        <ChannelBadge channel={c.channel} />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>
                        {c.subject || c.message || '—'}
                      </p>
                      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                        {c.scheduled_at && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                            <Clock size={11} /> Scheduled: {formatDate(c.scheduled_at, tz)}
                          </span>
                        )}
                        {c.sent_at && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                            <Send size={11} /> Sent: {formatDate(c.sent_at, tz)}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                          <Calendar size={11} /> Created: {formatDate(c.created_at, tz)}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
                      {[
                        { label: 'Recipients', value: c.total_recipients, color: 'var(--text-primary)' },
                        { label: 'Sent', value: c.sent_count || c.delivered_count, color: '#10b981' },
                        ...(c.opened_count !== null ? [{ label: 'Opened', value: c.opened_count, color: '#3b82f6' }] : []),
                        ...(c.clicked_count !== null ? [{ label: 'Clicked', value: c.clicked_count, color: '#f59e0b' }] : []),
                        ...((c.failed_count ?? 0) > 0 ? [{ label: 'Failed', value: c.failed_count, color: '#ef4444' }] : []),
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value ?? 0}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sending progress bar */}
                  {c.status === 'sending' && (c.total_recipients ?? 0) > 0 && (
                    <div style={{ height: 3, background: 'var(--surface)' }}>
                      <div style={{ height: '100%', background: 'var(--accent)', width: `${sentPct}%`, transition: 'width .4s ease' }} />
                    </div>
                  )}

                  {/* Action bar */}
                  <div style={{ padding: '10px 24px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setStatsId(c.id)} disabled={busy} style={{ ...btnStyle('ghost'), fontSize: 12 }}>
                      <BarChart2 size={12} /> Statistics
                    </button>

                    {['draft', 'scheduled'].includes(c.status) && (
                      <button onClick={() => openEdit(c)} disabled={busy} style={{ ...btnStyle('ghost'), fontSize: 12 }}>
                        <Edit2 size={12} /> Edit
                      </button>
                    )}

                    {c.status === 'sending' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                        <RefreshCw size={12} className="animate-spin" /> Sending {sentPct}%…
                      </span>
                    )}

                    {['draft', 'scheduled', 'failed'].includes(c.status) && (
                      <button onClick={() => deleteCampaign(c.id)} disabled={busy} style={{ ...btnStyle('danger'), fontSize: 12, marginLeft: 'auto' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Create Campaign Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{
            width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto',
            background: 'var(--surface-elevated)', borderRadius: 20,
            border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', position: 'sticky', top: 0,
              background: 'var(--surface-elevated)', zIndex: 1, borderBottom: '1px solid var(--border)',
            }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editing ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><X size={15} /></button>
            </div>

            {/* Campaign type selector */}
            {!editing && (
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <Field label="Campaign Type" required>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
                    {CAMPAIGN_TYPES.map(t => (
                      <button
                        key={t.type}
                        onClick={() => setModalType(t.type)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          padding: '16px 12px', borderRadius: 12, cursor: 'pointer',
                          border: `2px solid ${modalType === t.type ? 'var(--accent)' : 'var(--border)'}`,
                          background: modalType === t.type ? 'rgba(14,122,254,0.08)' : 'var(--surface)',
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ color: modalType === t.type ? 'var(--accent)' : 'var(--text-secondary)' }}>{t.icon}</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: modalType === t.type ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* Type-specific form */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {modalType === 'bulk' && (
                <>
                  <Field label="Campaign Name" required>
                    <input value={bulkForm.name} onChange={e => setBulkForm(f => ({ ...f, name: e.target.value }))} placeholder="Summer Promotion" style={inputStyle} />
                  </Field>

                  <Field label="Channel" required>
                    {channels.length === 0 ? (
                      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-tertiary)' }}>
                        No connected channels found. Connect a channel first.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {channels.map(ch => (
                          <button key={ch.id} onClick={() => setBulkForm(f => ({ ...f, channel_id: String(ch.id) }))} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                            borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            border: `1.5px solid ${bulkForm.channel_id === String(ch.id) ? 'var(--accent)' : 'var(--border)'}`,
                            background: bulkForm.channel_id === String(ch.id) ? 'rgba(14,122,254,0.1)' : 'var(--surface)',
                            color: bulkForm.channel_id === String(ch.id) ? 'var(--accent)' : 'var(--text-secondary)',
                            transition: 'all .15s',
                          }}>
                            {CHANNEL_ICONS[ch.type] || '📱'} {ch.page_name || ch.type}
                          </button>
                        ))}
                      </div>
                    )}
                  </Field>

                  <Field label="Message" required>
                    <textarea
                      value={bulkForm.message}
                      onChange={e => setBulkForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Hey {name}! We have a special offer just for you..."
                      rows={5}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Tip: Use {'{'}<span>name</span>{'}'} to personalise with the contact's name.</span>
                  </Field>

                  <Field label="Audience Filter">
                    <select
                      value={bulkForm.last_activity_days}
                      onChange={e => setBulkForm(f => ({ ...f, last_activity_days: e.target.value === '' ? '' : Number(e.target.value) }))}
                      style={inputStyle}
                    >
                      <option value="">All contacts on this channel</option>
                      {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <Filter size={10} style={{ display: 'inline', marginRight: 3 }} />
                      Only contacts who messaged within the selected window.
                    </span>
                  </Field>

                  <Field label={`Schedule (${tz})`}>
                    <input
                      type="datetime-local"
                      value={bulkForm.scheduled_at}
                      onChange={e => setBulkForm(f => ({ ...f, scheduled_at: e.target.value }))}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Leave empty to save as draft and launch manually.</span>
                  </Field>
                </>
              )}

              {modalType === 'email' && (
                <>
                  <Field label="Campaign Name" required>
                    <input value={emailForm.name} onChange={e => setEmailForm(f => ({ ...f, name: e.target.value }))} placeholder="Black Friday Sale" style={inputStyle} />
                  </Field>

                  <Field label="Email Subject" required>
                    <input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="🎉 Special offer inside" style={inputStyle} />
                  </Field>

                  <Field label="Email Content (HTML or plain text)" required>
                    <textarea value={emailForm.content} onChange={e => setEmailForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your email content here..." rows={7} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                  </Field>

                  <Field label="Audience Mode">
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      {[
                        { mode: 'manual', icon: <Edit2 size={13} />, label: 'Manual Emails' },
                        { mode: 'gmail', icon: <Mail size={13} />, label: 'Gmail Contacts' },
                        { mode: 'contacts', icon: <MessageSquare size={13} />, label: 'Conversation Contacts' },
                      ].map(opt => (
                        <button key={opt.mode} onClick={() => setEmailForm(f => ({ ...f, audienceMode: opt.mode as any }))} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${emailForm.audienceMode === opt.mode ? 'var(--accent)' : 'var(--border)'}`, background: emailForm.audienceMode === opt.mode ? 'rgba(14,122,254,0.1)' : 'var(--surface)', color: emailForm.audienceMode === opt.mode ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all .15s' }}>
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>

                    {emailForm.audienceMode === 'manual' && (
                      <textarea value={emailForm.recipientsText} onChange={e => setEmailForm(f => ({ ...f, recipientsText: e.target.value }))} placeholder={"email1@example.com\nemail2@example.com\nor comma/semicolon separated"} rows={4} style={{ ...inputStyle, resize: 'vertical', fontSize: 12 }} />
                    )}

                    {emailForm.audienceMode === 'gmail' && (
                      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>📧 Sends to all email addresses extracted from your connected Gmail conversations.</p>
                      </div>
                    )}

                    {emailForm.audienceMode === 'contacts' && (
                      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        💬 Sends to contacts from your conversations who have a known email address.
                      </div>
                    )}
                  </Field>

                  <Field label={`Schedule (${tz})`}>
                    <input type="datetime-local" value={emailForm.scheduled_at} onChange={e => setEmailForm(f => ({ ...f, scheduled_at: e.target.value }))} style={inputStyle} />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Leave empty to save as draft and send manually.</span>
                  </Field>
                </>
              )}

              {modalType !== 'bulk' && modalType !== 'email' && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Bot size={32} style={{ color: 'var(--accent)', marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Coming Soon</p>
                  <p style={{ fontSize: 12 }}>This campaign type will be available in a future update.</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            {modalType === 'bulk' || modalType === 'email' ? (
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                position: 'sticky', bottom: 0, background: 'var(--surface-elevated)',
              }}>
                <button disabled={saving} onClick={() => setModalOpen(false)} style={{ ...btnStyle('ghost'), padding: '10px 18px' }}>Cancel</button>
                <button disabled={saving} onClick={saveCampaign} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px',
                  borderRadius: 12, background: 'var(--accent)', color: '#fff',
                  border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1,
                }}>
                  <Zap size={14} /> {saving ? 'Saving…' : editing ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
