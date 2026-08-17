'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Mail, Plus, Send, Calendar, BarChart2, Trash2, Edit2,
  X, ChevronDown, Users, RefreshCw, Clock, CheckCircle,
  AlertCircle, Filter, Eye, Zap, Globe, MessageSquare,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AudienceMode = 'manual' | 'gmail' | 'contacts'

interface AudienceCriteria {
  mode: AudienceMode
  recipients?: string[]
  channel_ids?: number[]
  channel_types?: string[]
  last_active_days?: number | null
}

interface ChannelOption { id: number; type: string; name: string }

interface EmailCampaign {
  id: number
  name: string
  subject: string
  content: string
  audience_criteria: AudienceCriteria | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'partially_failed'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  failed_count: number | null
  error_message?: string | null
  recipients_count?: number
  created_at: string
}

interface FormState {
  name: string
  subject: string
  content: string
  audienceMode: AudienceMode
  recipientsText: string
  channelIds: number[]
  channelTypes: string[]
  lastActiveDays: number | ''
  scheduled_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function token() {
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
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

function toZonedInputValue(value: string | null, tz: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d)
  const g = (t: string) => parts.find(p => p.type === t)?.value || '00'
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`
}

function formatInZone(value: string | null, tz: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d) + ` (${tz})`
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  draft:            { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: <Edit2 size={11} />, label: 'Draft' },
  scheduled:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Clock size={11} />, label: 'Scheduled' },
  sending:          { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <RefreshCw size={11} className="animate-spin" />, label: 'Sending' },
  sent:             { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <CheckCircle size={11} />, label: 'Sent' },
  failed:           { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <AlertCircle size={11} />, label: 'Failed' },
  partially_failed: { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: <AlertCircle size={11} />, label: 'Partial' },
}

const CHANNEL_TYPE_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👍', telegram: '✈️', gmail: '📧', tiktok: '🎵',
}

const ACTIVE_DAYS_OPTIONS = [
  { value: 7,   label: 'Last 7 days' },
  { value: 14,  label: 'Last 14 days' },
  { value: 30,  label: 'Last 30 days' },
  { value: 60,  label: 'Last 60 days' },
  { value: 90,  label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last year' },
]

const emptyForm: FormState = {
  name: '', subject: '', content: '',
  audienceMode: 'manual', recipientsText: '',
  channelIds: [], channelTypes: [], lastActiveDays: 30,
  scheduled_at: '',
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number | null; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value ?? 0}</span>
      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}

// ─── Audience badge ───────────────────────────────────────────────────────────

function AudienceBadge({ criteria }: { criteria: AudienceCriteria | null }) {
  const mode = criteria?.mode || 'manual'
  const map: Record<AudienceMode, { icon: React.ReactNode; label: string }> = {
    manual:   { icon: <Edit2 size={10} />,         label: `${criteria?.recipients?.length || 0} emails` },
    gmail:    { icon: <Mail size={10} />,           label: 'Gmail contacts' },
    contacts: { icon: <MessageSquare size={10} />,  label: 'Conversation contacts' },
  }
  const { icon, label } = map[mode as AudienceMode] || map.manual
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
      {icon}{label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailCampaignsContent() {
  const [campaigns, setCampaigns]           = useState<EmailCampaign[]>([])
  const [loading, setLoading]               = useState(true)
  const [filterStatus, setFilterStatus]     = useState('')
  const [modalOpen, setModalOpen]           = useState(false)
  const [editing, setEditing]               = useState<EmailCampaign | null>(null)
  const [form, setForm]                     = useState<FormState>(emptyForm)
  const [saving, setSaving]                 = useState(false)
  const [actionId, setActionId]             = useState<number | null>(null)
  const [statsId, setStatsId]               = useState<number | null>(null)
  const [channels, setChannels]             = useState<ChannelOption[]>([])
  const [previewCount, setPreviewCount]     = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [tz, setTz]                         = useState('UTC')
  const previewTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setTz(detectTimezone()) }, [])

  // Load channels for the audience contacts picker
  useEffect(() => {
    apiFetch('/api/email-campaigns/audience/channels')
      .then(d => setChannels(d.channels || []))
      .catch(() => {})
  }, [])

  const authH = useMemo(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json' }), [])

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const d = await apiFetch(`/api/email-campaigns${params}`)
      setCampaigns(d.data || [])
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  // Live audience preview — debounced 600ms after form changes
  useEffect(() => {
    if (!modalOpen) return
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const criteria = buildAudienceCriteria(form)
        const d = await apiFetch('/api/email-campaigns/audience/preview', {
          method: 'POST',
          body: JSON.stringify({ audience_criteria: criteria }),
        })
        setPreviewCount(d.count ?? null)
      } catch { setPreviewCount(null) }
      finally { setPreviewLoading(false) }
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.audienceMode, form.recipientsText, form.channelIds, form.channelTypes, form.lastActiveDays, modalOpen])

  function buildAudienceCriteria(f: FormState): AudienceCriteria {
    if (f.audienceMode === 'gmail') return { mode: 'gmail' }
    if (f.audienceMode === 'contacts') return {
      mode: 'contacts',
      channel_ids: f.channelIds,
      channel_types: f.channelTypes,
      last_active_days: f.lastActiveDays !== '' ? Number(f.lastActiveDays) : null,
    }
    return {
      mode: 'manual',
      recipients: f.recipientsText.split(/[\n,;]/).map(e => e.trim().toLowerCase()).filter(Boolean),
    }
  }

  const openCreate = () => {
    setEditing(null); setForm(emptyForm); setPreviewCount(null); setModalOpen(true)
  }

  const openEdit = (c: EmailCampaign) => {
    const crit = c.audience_criteria
    setEditing(c)
    setForm({
      name: c.name, subject: c.subject, content: c.content,
      audienceMode: (crit?.mode || 'manual') as AudienceMode,
      recipientsText: (crit?.recipients || []).join('\n'),
      channelIds: crit?.channel_ids || [],
      channelTypes: crit?.channel_types || [],
      lastActiveDays: crit?.last_active_days ?? 30,
      scheduled_at: toZonedInputValue(c.scheduled_at, tz),
    })
    setPreviewCount(null); setModalOpen(true)
  }

  const saveCampaign = async (scheduleAfterSave: boolean) => {
    setSaving(true)
    try {
      if (scheduleAfterSave && !form.scheduled_at) throw new Error('Choose a schedule date/time first.')
      const body = {
        name: form.name.trim(), subject: form.subject.trim(), content: form.content,
        audience_criteria: buildAudienceCriteria(form),
        ...(form.scheduled_at ? { scheduled_at: form.scheduled_at, timezone: tz } : {}),
      }
      const url = editing ? `/api/email-campaigns/${editing.id}` : '/api/email-campaigns'
      const d = await apiFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) })
      const camp = d.campaign as EmailCampaign
      if (scheduleAfterSave) {
        await apiFetch(`/api/email-campaigns/${camp.id}/schedule`, {
          method: 'POST', body: JSON.stringify({ scheduled_at: form.scheduled_at, timezone: tz }),
        })
        toast.success('Campaign scheduled ✓')
      } else { toast.success('Draft saved ✓') }
      setModalOpen(false); fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const sendNow = async (id: number) => {
    if (!confirm('Send this campaign now?')) return
    setActionId(id)
    try { await apiFetch(`/api/email-campaigns/${id}/send`, { method: 'POST' }); toast.success('Campaign sent ✓'); fetchCampaigns() }
    catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const cancelSchedule = async (id: number) => {
    setActionId(id)
    try { await apiFetch(`/api/email-campaigns/${id}/cancel-schedule`, { method: 'POST' }); toast.success('Schedule cancelled'); fetchCampaigns() }
    catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const retryCampaign = async (c: EmailCampaign) => {
    setActionId(c.id)
    try {
      await apiFetch(`/api/email-campaigns/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'draft' }),
      })
      await apiFetch(`/api/email-campaigns/${c.id}/send`, { method: 'POST' })
      toast.success('Campaign retried ✓'); fetchCampaigns()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign permanently?')) return
    setActionId(id)
    try { await apiFetch(`/api/email-campaigns/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchCampaigns() }
    catch (e: any) { toast.error(e.message) }
    finally { setActionId(null) }
  }

  const toggleChannelId = (id: number) =>
    setForm(f => ({ ...f, channelIds: f.channelIds.includes(id) ? f.channelIds.filter(x => x !== id) : [...f.channelIds, id] }))

  const statsMap = useMemo(() => {
    const m: Record<number, EmailCampaign> = {}
    campaigns.forEach(c => { m[c.id] = c })
    return m
  }, [campaigns])

  const viewingStats = statsId ? statsMap[statsId] : null

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 0', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),var(--accent-hover,#6366f1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Email Campaigns</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Create, schedule and track email campaigns to your contacts</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* ── Stats panel for a specific campaign ── */}
      {viewingStats && (
        <div style={{ marginBottom: 24, padding: 24, borderRadius: 16, background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingStats.name}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Subject: {viewingStats.subject}</p>
            </div>
            <button onClick={() => setStatsId(null)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>← Back</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {[
              { label: 'Recipients', value: viewingStats.total_recipients },
              { label: 'Delivered',  value: viewingStats.delivered_count,  color: '#10b981' },
              { label: 'Opened',     value: viewingStats.opened_count,     color: '#3b82f6' },
              { label: 'Clicked',    value: viewingStats.clicked_count,    color: '#f59e0b' },
              { label: 'Failed',     value: viewingStats.failed_count,     color: '#ef4444' },
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
          {(viewingStats.status === 'failed' || viewingStats.status === 'partially_failed') && (
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <button disabled={actionId === viewingStats.id} onClick={() => retryCampaign(viewingStats)} style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                🔄 Retry Failed Recipients
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      {!viewingStats && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['', 'draft', 'scheduled', 'sending', 'sent', 'failed'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', background: filterStatus === s ? 'var(--accent)' : 'var(--surface)', color: filterStatus === s ? '#fff' : 'var(--text-secondary)', transition: 'all .15s' }}>
                  {s || 'All'}
                </button>
              ))}
            </div>
            <button onClick={fetchCampaigns} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* ── Campaign list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 88, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
              ))
            ) : campaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', borderRadius: 16, background: 'var(--surface)', border: '1px dashed var(--border)' }}>
                <Mail size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>No campaigns yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 18px' }}>Create your first email campaign to reach your contacts</p>
                <button onClick={openCreate} style={{ padding: '10px 20px', borderRadius: 12, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Create Campaign</button>
              </div>
            ) : campaigns.map(c => {
              const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft
              const busy = actionId === c.id
              return (
                <div key={c.id} style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--surface-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                          {sc.icon} {sc.label}
                        </span>
                        <AudienceBadge criteria={c.audience_criteria} />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Subject: {c.subject}</p>
                      {c.scheduled_at && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>📅 {formatInZone(c.scheduled_at, tz)}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <StatPill label="Sent"    value={c.delivered_count} color="#10b981" />
                      <StatPill label="Opened"  value={c.opened_count}    color="#3b82f6" />
                      <StatPill label="Clicked" value={c.clicked_count}   color="#f59e0b" />
                      {(c.failed_count || 0) > 0 && <StatPill label="Failed" value={c.failed_count} color="#ef4444" />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setStatsId(c.id)} disabled={busy} style={{ ...btnStyle('ghost') }}><BarChart2 size={12} /> Stats</button>
                    {['draft','scheduled'].includes(c.status) && <button onClick={() => openEdit(c)} disabled={busy} style={{ ...btnStyle('ghost') }}><Edit2 size={12} /> Edit</button>}
                    {c.status === 'draft' && <button onClick={() => sendNow(c.id)} disabled={busy} style={{ ...btnStyle('primary') }}><Send size={12} /> {busy ? 'Working…' : 'Send Now'}</button>}
                    {c.status === 'scheduled' && <button onClick={() => cancelSchedule(c.id)} disabled={busy} style={{ ...btnStyle('ghost') }}>Cancel Schedule</button>}
                    {['failed','partially_failed'].includes(c.status) && <button onClick={() => retryCampaign(c)} disabled={busy} style={{ ...btnStyle('warn') }}><RefreshCw size={12} /> Retry</button>}
                    {['draft','scheduled','failed','partially_failed'].includes(c.status) && <button onClick={() => deleteCampaign(c.id)} disabled={busy} style={{ ...btnStyle('danger') }}><Trash2 size={12} /></button>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', background: 'var(--surface-elevated)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface-elevated)', zIndex: 1, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{editing ? 'Edit Campaign' : 'New Email Campaign'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><X size={15} /></button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Name & Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Campaign Name" required>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Black Friday Sale" style={inputStyle} />
                </Field>
                <Field label="Email Subject" required>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="🎉 Special offer inside" style={inputStyle} />
                </Field>
              </div>

              {/* Content */}
              <Field label="Email Content (HTML or plain text)" required>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your email content here..." rows={7} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
              </Field>

              {/* Audience mode tabs */}
              <Field label="Audience">
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {([
                    { mode: 'manual',   icon: <Edit2 size={13} />,        label: 'Manual Emails' },
                    { mode: 'gmail',    icon: <Mail size={13} />,          label: 'Gmail Contacts' },
                    { mode: 'contacts', icon: <MessageSquare size={13} />, label: 'Conversation Contacts' },
                  ] as const).map(opt => (
                    <button key={opt.mode} onClick={() => setForm(f => ({ ...f, audienceMode: opt.mode }))} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${form.audienceMode === opt.mode ? 'var(--accent)' : 'var(--border)'}`, background: form.audienceMode === opt.mode ? 'rgba(var(--accent-rgb,99,102,241),0.1)' : 'var(--surface)', color: form.audienceMode === opt.mode ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all .15s' }}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>

                {/* Manual */}
                {form.audienceMode === 'manual' && (
                  <div>
                    <textarea value={form.recipientsText} onChange={e => setForm(f => ({ ...f, recipientsText: e.target.value }))} placeholder={"email1@example.com\nemail2@example.com\nor comma/semicolon separated"} rows={4} style={{ ...inputStyle, resize: 'vertical', fontSize: 12 }} />
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>Separate with new lines, commas, or semicolons.</p>
                  </div>
                )}

                {/* Gmail */}
                {form.audienceMode === 'gmail' && (
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>📧 Sends to all email addresses extracted from your connected Gmail conversations.</p>
                  </div>
                )}

                {/* Contacts */}
                {form.audienceMode === 'contacts' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                      💬 Sends to contacts from your WhatsApp, Instagram, Facebook, and Telegram conversations who have a known email address.
                    </div>

                    {/* Channel filter */}
                    {channels.length > 0 && (
                      <Field label="Filter by channel (leave empty = all)">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {channels.map(ch => (
                            <button key={ch.id} onClick={() => toggleChannelId(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${form.channelIds.includes(ch.id) ? 'var(--accent)' : 'var(--border)'}`, background: form.channelIds.includes(ch.id) ? 'rgba(var(--accent-rgb,99,102,241),0.1)' : 'var(--surface)', color: form.channelIds.includes(ch.id) ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s' }}>
                              {CHANNEL_TYPE_ICONS[ch.type] || '📱'} {ch.name}
                            </button>
                          ))}
                        </div>
                      </Field>
                    )}

                    {/* Activity window */}
                    <Field label="Contact activity window">
                      <select value={form.lastActiveDays} onChange={e => setForm(f => ({ ...f, lastActiveDays: e.target.value === '' ? '' : Number(e.target.value) }))} style={{ ...inputStyle }}>
                        <option value="">All time</option>
                        {ACTIVE_DAYS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                  </div>
                )}

                {/* Audience preview pill */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }}>
                    <Users size={12} style={{ color: 'var(--accent)' }} />
                    {previewLoading ? <span style={{ color: 'var(--text-tertiary)' }}>Estimating…</span>
                      : previewCount === null ? <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      : <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{previewCount} estimated {previewCount === 1 ? 'recipient' : 'recipients'}</span>}
                  </div>
                </div>
              </Field>

              {/* Schedule */}
              <Field label={`Schedule time (${tz})`}>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} style={inputStyle} />
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>Leave empty to save as draft and send manually.</p>
              </Field>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: 'var(--surface-elevated)' }}>
              <button disabled={saving} onClick={() => setModalOpen(false)} style={{ ...btnStyle('ghost'), padding: '10px 18px' }}>Cancel</button>
              <button disabled={saving} onClick={() => saveCampaign(false)} style={{ ...btnStyle('ghost'), padding: '10px 18px' }}>{saving ? 'Saving…' : 'Save Draft'}</button>
              <button disabled={saving} onClick={() => saveCampaign(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: 'var(--accent)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                <Calendar size={14} /> {saving ? 'Saving…' : 'Save & Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
}

function btnStyle(variant: 'primary' | 'ghost' | 'danger' | 'warn'): React.CSSProperties {
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid transparent', transition: 'opacity .15s' }
  if (variant === 'primary') return { ...base, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
  if (variant === 'danger')  return { ...base, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }
  if (variant === 'warn')    return { ...base, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.25)' }
  return { ...base, background: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
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
