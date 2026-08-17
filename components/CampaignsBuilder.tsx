'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Send, Plus, Trash2, Play, Edit2, X, Clock, CheckCircle,
  AlertCircle, RefreshCw, Users, MessageSquare, Filter,
  Calendar, BarChart2, Zap, ChevronDown, Search, TrendingUp,
  CalendarOff, Eye, ArrowLeft, Megaphone, Target, Activity,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
  id: number
  type: string
  page_name: string
  status: string
}

interface CampaignFilters {
  tags?: string[]
  last_activity_days?: number | null
  last_active_days?: number | null
}

interface Campaign {
  id: number
  name: string
  message: string
  channel_id: number
  channel?: Channel
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number | null
  sent_count: number | null
  failed_count: number | null
  error_message: string | null
  filters: CampaignFilters | null
  created_at: string
}

interface FormState {
  name: string
  message: string
  channel_id: string
  scheduled_at: string
  last_activity_days: number | ''
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
  if (!res.ok) throw new Error(String(data.error || data.message || 'Request failed'))
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
  draft:     { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: <Edit2 size={11} />,   label: 'Draft' },
  scheduled: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Clock size={11} />,   label: 'Scheduled' },
  sending:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <RefreshCw size={11} className="animate-spin" />, label: 'Sending' },
  sent:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <CheckCircle size={11} />, label: 'Sent' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <AlertCircle size={11} />, label: 'Failed' },
}

const ACTIVITY_OPTIONS = [
  { value: 7,   label: 'Active last 7 days' },
  { value: 14,  label: 'Active last 14 days' },
  { value: 30,  label: 'Active last 30 days' },
  { value: 60,  label: 'Active last 60 days' },
  { value: 90,  label: 'Active last 90 days' },
  { value: 180, label: 'Active last 6 months' },
  { value: 365, label: 'Active last year' },
]

const emptyForm: FormState = {
  name: '', message: '', channel_id: '', scheduled_at: '', last_activity_days: 30,
}

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

export default function CampaignsContent({ businessId }: { businessId: number }) {
  const [campaigns, setCampaigns]     = useState<Campaign[]>([])
  const [channels, setChannels]       = useState<Channel[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [editing, setEditing]         = useState<Campaign | null>(null)
  const [form, setForm]               = useState<FormState>(emptyForm)
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
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const d = await apiFetch(`/api/businesses/${businessId}/campaigns${params}`)
      setCampaigns(Array.isArray(d) ? d : d.data || [])
    } catch (e: any) { if (!silent) toast.error(e.message) }
    finally { if (!silent) setLoading(false) }
  }, [businessId, filterStatus])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  // ─── Real-time progress: auto-refresh while any campaign is sending ──────
  // Polls silently (no loading skeleton, no error toasts) every 3s so the
  // user sees live sent/failed counts and the progress bar move without
  // having to manually hit refresh. Stops the instant nothing is "sending"
  // anymore, so it never polls forever for a business with no active sends.
  const hasSendingCampaign = campaigns.some(c => c.status === 'sending')
  useEffect(() => {
    if (!hasSendingCampaign) return
    const interval = setInterval(() => { fetchCampaigns(true) }, 3000)
    return () => clearInterval(interval)
  }, [hasSendingCampaign, fetchCampaigns])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (c: Campaign) => {
    setEditing(c)
    setForm({
      name: c.name, message: c.message,
      channel_id: String(c.channel_id),
      scheduled_at: '',
      last_activity_days: c.filters?.last_activity_days ?? c.filters?.last_active_days ?? 30,
    })
    setModalOpen(true)
  }

  const saveCampaign = async () => {
    if (!form.channel_id) { toast.error('Please select a channel'); return }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        message: form.message.trim(),
        channel_id: Number(form.channel_id),
        ...(form.scheduled_at ? { scheduled_at: form.scheduled_at, timezone: tz } : {}),
        filters: { last_activity_days: form.last_activity_days !== '' ? Number(form.last_activity_days) : null },
      }
      if (editing) {
        await apiFetch(`/api/businesses/${businessId}/campaigns/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
        toast.success('Campaign updated ✓')
      } else {
        await apiFetch(`/api/businesses/${businessId}/campaigns`, { method: 'POST', body: JSON.stringify(body) })
        toast.success('Campaign created ✓')
      }
      setModalOpen(false); fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const launchCampaign = async (id: number) => {
    if (!confirm('Launch this campaign now? It will send to all matching contacts.')) return
    setActionId(id)
    try {
      await apiFetch(`/api/businesses/${businessId}/campaigns/${id}/launch`, { method: 'POST' })
      toast.success('Campaign launched ✓'); fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign permanently?')) return
    setActionId(id)
    try {
      await apiFetch(`/api/businesses/${businessId}/campaigns/${id}`, { method: 'DELETE' })
      toast.success('Deleted'); fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const cancelSchedule = async (id: number) => {
    if (!confirm('Unschedule this campaign? It will revert to Draft.')) return
    setActionId(id)
    try {
      await apiFetch(`/api/businesses/${businessId}/campaigns/${id}/cancel-schedule`, { method: 'POST' })
      toast.success('Schedule cancelled — campaign is now a draft')
      fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const statsMap = useMemo(() => {
    const m: Record<number, Campaign> = {}; campaigns.forEach(c => { m[c.id] = c }); return m
  }, [campaigns])

  const viewingStats = statsId ? statsMap[statsId] : null

  // ─── Filtered campaigns ────────────────────────────────────────────────────
  const filteredCampaigns = useMemo(() => {
    if (!search.trim()) return campaigns
    const q = search.toLowerCase()
    return campaigns.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q) ||
      c.channel?.page_name?.toLowerCase().includes(q) ||
      c.channel?.type?.toLowerCase().includes(q)
    )
  }, [campaigns, search])

  // ─── Summary stats ──────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    sending: campaigns.filter(c => c.status === 'sending').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalReached: campaigns.reduce((a, c) => a + (c.sent_count || 0), 0),
  }), [campaigns])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 0', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg,var(--accent),var(--accent-hover,#8B3FFB))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Campaigns</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Send bulk messages to your contacts across all connected channels</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
          borderRadius: 12, background: 'var(--accent)', color: '#fff',
          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total',        value: summary.total,       color: 'var(--text-primary)' },
          { label: 'Drafts',       value: summary.draft,       color: '#64748b' },
          { label: 'Sending',      value: summary.sending,     color: '#3b82f6' },
          { label: 'Sent',         value: summary.sent,        color: '#10b981' },
          { label: 'Total Reached',value: summary.totalReached, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '16px 20px', borderRadius: 14,
            background: 'var(--surface-elevated)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{s.label}</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Stats panel */}
      {viewingStats && (
        <div style={{ marginBottom: 24, padding: 24, borderRadius: 16, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingStats.name}</h2>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ChannelBadge channel={viewingStats.channel} />
                {viewingStats.sent_at && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sent {formatDate(viewingStats.sent_at, tz)}</span>}
              </div>
            </div>
            <button onClick={() => setStatsId(null)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>← Back</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'Recipients', value: viewingStats.total_recipients },
              { label: 'Sent',       value: viewingStats.sent_count,    color: '#10b981' },
              { label: 'Failed',     value: viewingStats.failed_count,  color: '#ef4444' },
            ].map(s => (
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
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</span>
            <div style={{ marginTop: 6, color: 'var(--text-primary)' }}>{viewingStats.message}</div>
          </div>
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
                {search.trim() ? (
                  <>
                    <Search size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 14 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 6px' }}>No matching campaigns</p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 20px' }}>Try a different search term or clear the filter</p>
                    <button onClick={() => setSearch('')} style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Clear Search</button>
                  </>
                ) : (
                  <>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(14,122,254,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Megaphone size={32} style={{ color: 'var(--accent)' }} />
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>No campaigns yet</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 28px' }}>Send your first bulk message to all your contacts across channels</p>
                    <button
                      onClick={openCreate}
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
              const sentPct = (c.total_recipients ?? 0) > 0 ? Math.round(((c.sent_count ?? 0) / c.total_recipients!) * 100) : 0
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                          {sc.icon} {sc.label}
                        </span>
                        <ChannelBadge channel={c.channel} />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>
                        {c.message || '—'}
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
                        { label: 'Sent', value: c.sent_count, color: '#10b981' },
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
                  <div style={{ padding: '10px 24px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.12)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setStatsId(c.id)} disabled={busy} style={{ ...btnStyle('ghost'), fontSize: 12 }}>
                      <BarChart2 size={12} /> Statistics
                    </button>

                    {c.status === 'draft' && (
                      <>
                        <button onClick={() => openEdit(c)} disabled={busy} style={{ ...btnStyle('ghost'), fontSize: 12 }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => launchCampaign(c.id)} disabled={busy} style={{ ...btnStyle('success'), fontSize: 12 }}>
                          <Play size={12} /> {busy ? 'Launching…' : 'Launch Now'}
                        </button>
                      </>
                    )}

                    {c.status === 'scheduled' && (
                      <>
                        <button onClick={() => openEdit(c)} disabled={busy} style={{ ...btnStyle('ghost'), fontSize: 12 }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => cancelSchedule(c.id)} disabled={busy} style={{ ...btnStyle('ghost'), fontSize: 12 }}>
                          <CalendarOff size={12} /> Unschedule
                        </button>
                      </>
                    )}

                    {c.status === 'sending' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                        <RefreshCw size={12} className="animate-spin" /> Sending {sentPct}%…
                      </span>
                    )}

                    {['draft', 'failed', 'scheduled'].includes(c.status) && (
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{
            width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto',
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

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Name */}
              <Field label="Campaign Name" required>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Summer Promotion" style={inputStyle} />
              </Field>

              {/* Channel picker */}
              <Field label="Channel" required>
                {channels.length === 0 ? (
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-tertiary)' }}>
                    No connected channels found. Connect a channel first.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {channels.map(ch => (
                      <button key={ch.id} onClick={() => setForm(f => ({ ...f, channel_id: String(ch.id) }))} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                        borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${form.channel_id === String(ch.id) ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.channel_id === String(ch.id) ? 'rgba(14,122,254,0.1)' : 'var(--surface)',
                        color: form.channel_id === String(ch.id) ? 'var(--accent)' : 'var(--text-secondary)',
                        transition: 'all .15s',
                      }}>
                        {CHANNEL_ICONS[ch.type] || '📱'} {ch.page_name || ch.type}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              {/* Message */}
              <Field label="Message" required>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Hey {name}! We have a special offer just for you..."
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Tip: Use {'{'}<span>name</span>{'}'} to personalise with the contact's name.</span>
              </Field>

              {/* Audience filter */}
              <Field label="Audience Filter">
                <select
                  value={form.last_activity_days}
                  onChange={e => setForm(f => ({ ...f, last_activity_days: e.target.value === '' ? '' : Number(e.target.value) }))}
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

              {/* Schedule */}
              <Field label={`Schedule (${tz})`}>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  style={inputStyle}
                />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Leave empty to save as draft and launch manually.</span>
              </Field>
            </div>

            {/* Modal footer */}
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
          </div>
        </div>
      )}
    </div>
  )
}
