'use client'

import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface EmailCampaign {
  id: number
  business_id: number
  name: string
  subject: string
  content: string
  audience_criteria: { mode?: 'manual' | 'gmail'; recipients?: string[] } | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  failed_count: number | null
  error_message?: string | null
  created_at: string
}

interface CampaignStats {
  campaign: EmailCampaign
  recipients: Record<string, number>
}

type FormState = {
  name: string
  subject: string
  content: string
  audienceMode: 'manual' | 'gmail'
  recipientsText: string
  scheduled_at: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const emptyForm: FormState = {
  name: '',
  subject: '',
  content: '',
  audienceMode: 'manual',
  recipientsText: '',
  scheduled_at: '',
}

function token() {
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const firstError = data.errors ? Object.values(data.errors).flat()[0] : null
    throw new Error(String(firstError || data.error || data.message || 'Request failed'))
  }
  return data
}

// Converts a UTC timestamp from the API into the value a
// <input type="datetime-local"> needs, as if displayed in the business's
// own timezone (not the browser's local timezone — those can differ).
function toZonedInputValue(value: string | null, timeZone: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find(p => p.type === type)?.value || '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

// Formats a UTC timestamp for display in the business's own timezone, with
// the zone name shown so it's unambiguous.
function formatInZone(value: string | null, timeZone: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  return `${formatted} (${timeZone})`
}

function splitRecipients(value: string) {
  return value
    .split(/[\n,;]/)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export default function EmailCampaignsContent() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmailCampaign | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [businessTimezone, setBusinessTimezone] = useState('UTC')

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token()}`,
    Accept: 'application/json',
  }), [])

  const fetchCampaigns = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`${API}/api/email-campaigns?${params.toString()}`, {
        headers: authHeaders,
      })
      const data = await parseJson(res)
      setCampaigns(data.data || [])
      if (data.business_timezone) setBusinessTimezone(data.business_timezone)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load campaigns'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (campaign: EmailCampaign) => {
    setEditing(campaign)
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      audienceMode: campaign.audience_criteria?.mode || 'manual',
      recipientsText: (campaign.audience_criteria?.recipients || []).join('\n'),
      scheduled_at: toZonedInputValue(campaign.scheduled_at, businessTimezone),
    })
    setModalOpen(true)
  }

  const payload = () => {
    const recipients = splitRecipients(form.recipientsText)

    if (!form.name.trim() || !form.subject.trim() || !form.content.trim()) {
      throw new Error('Name, subject, and content are required.')
    }

    if (form.audienceMode === 'manual' && recipients.length === 0) {
      throw new Error('Add at least one recipient email address.')
    }

    return {
      name: form.name.trim(),
      subject: form.subject.trim(),
      content: form.content,
      audience_criteria: {
        mode: form.audienceMode,
        recipients: form.audienceMode === 'manual' ? recipients : [],
      },
    }
  }

  const scheduleCampaign = async (campaignId: number, scheduledAt: string, showToast = true) => {
    setActionId(campaignId)
    try {
      const res = await fetch(`${API}/api/email-campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      })
      await parseJson(res)
      if (showToast) toast.success('Campaign scheduled')
      await fetchCampaigns()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule campaign'
      toast.error(msg)
      throw err
    } finally {
      setActionId(null)
    }
  }

  const saveCampaign = async (scheduleAfterSave = false) => {
    setSaving(true)

    try {
      if (scheduleAfterSave && !form.scheduled_at) {
        throw new Error('Choose a schedule date and time.')
      }

      const body = payload()
      const url = editing ? `${API}/api/email-campaigns/${editing.id}` : `${API}/api/email-campaigns`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await parseJson(res)
      const campaign = data.campaign as EmailCampaign

      if (scheduleAfterSave) {
        await scheduleCampaign(campaign.id, form.scheduled_at, false)
        toast.success('Campaign scheduled')
      } else {
        toast.success('Draft saved')
      }

      setModalOpen(false)
      await fetchCampaigns()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save campaign'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const sendCampaign = async (campaignId: number) => {
    if (!confirm('Send this email campaign now?')) return
    setActionId(campaignId)

    try {
      const res = await fetch(`${API}/api/email-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: authHeaders,
      })
      await parseJson(res)
      toast.success('Campaign queued for delivery')
      await fetchCampaigns()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send campaign'
      toast.error(msg)
    } finally {
      setActionId(null)
    }
  }

  const cancelSchedule = async (campaignId: number) => {
    setActionId(campaignId)

    try {
      const res = await fetch(`${API}/api/email-campaigns/${campaignId}/cancel-schedule`, {
        method: 'POST',
        headers: authHeaders,
      })
      await parseJson(res)
      toast.success('Schedule cancelled')
      await fetchCampaigns()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel schedule'
      toast.error(msg)
    } finally {
      setActionId(null)
    }
  }

  const deleteCampaign = async (campaignId: number) => {
    if (!confirm('Delete this campaign?')) return
    setActionId(campaignId)

    try {
      const res = await fetch(`${API}/api/email-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      await parseJson(res)
      toast.success('Campaign deleted')
      await fetchCampaigns()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete campaign'
      toast.error(msg)
    } finally {
      setActionId(null)
    }
  }

  const loadStats = async (campaign: EmailCampaign) => {
    setActionId(campaign.id)

    try {
      const res = await fetch(`${API}/api/email-campaigns/${campaign.id}/stats`, {
        headers: authHeaders,
      })
      const data = await parseJson(res)
      setStats(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load stats'
      toast.error(msg)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)' }}>
          Email Campaigns
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Create, schedule, send, and track email campaigns.
        </p>
      </div>

      {stats && (
        <section className="premium-card p-6" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{stats.campaign.name}</h2>
            <button onClick={() => setStats(null)} className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Back</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              ['Recipients', stats.campaign.total_recipients || 0],
              ['Delivered', stats.campaign.delivered_count || 0],
              ['Opened', stats.campaign.opened_count || 0],
              ['Clicked', stats.campaign.clicked_count || 0],
              ['Failed', stats.campaign.failed_count || 0],
            ].map(([label, value]) => (
              <div key={label} className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Recipient states: {Object.entries(stats.recipients || {}).map(([key, value]) => `${key}: ${value}`).join(', ') || 'none'}
          </p>
        </section>
      )}

      {!stats && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={fetchCampaigns} className="px-4 py-3 rounded-xl font-semibold text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Refresh</button>
            <button onClick={openCreate} className="px-4 py-3 rounded-xl font-semibold text-sm" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>Create Campaign</button>
          </div>

          <section className="premium-card p-6" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            {loading ? (
              <div className="py-16 text-center" style={{ color: 'var(--text-secondary)' }}>Loading campaigns...</div>
            ) : error ? (
              <div className="py-16 text-center">
                <p className="mb-4" style={{ color: 'var(--error)' }}>{error}</p>
                <button onClick={fetchCampaigns} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Try again</button>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 text-center">
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>No email campaigns yet.</p>
                <button onClick={openCreate} className="px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>Create your first campaign</button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <article key={campaign.id} className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{campaign.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{campaign.status}</span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Subject: {campaign.subject}</p>
                        <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <span>Recipients: {campaign.total_recipients || 0}</span>
                          <span>Delivered: {campaign.delivered_count || 0}</span>
                          <span>Opened: {campaign.opened_count || 0}</span>
                          <span>Clicked: {campaign.clicked_count || 0}</span>
                          <span>Failed: {campaign.failed_count || 0}</span>
                        </div>
                        {campaign.scheduled_at && <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Scheduled: {formatInZone(campaign.scheduled_at, businessTimezone)}</p>}
                        {campaign.error_message && <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>{campaign.error_message}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && <button disabled={actionId === campaign.id} onClick={() => openEdit(campaign)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>Edit</button>}
                        {campaign.status === 'draft' && <button disabled={actionId === campaign.id} onClick={() => sendCampaign(campaign.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{actionId === campaign.id ? 'Working...' : 'Send Now'}</button>}
                        {campaign.status === 'scheduled' && <button disabled={actionId === campaign.id} onClick={() => cancelSchedule(campaign.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>Cancel Schedule</button>}
                        <button disabled={actionId === campaign.id} onClick={() => loadStats(campaign)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>Stats</button>
                        {(campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'failed') && <button disabled={actionId === campaign.id} onClick={() => deleteCampaign(campaign.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}>Delete</button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>{editing ? 'Edit Email Campaign' : 'Create Email Campaign'}</h3>
            <div className="space-y-4">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Email HTML/content" rows={8} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Audience
                  <select value={form.audienceMode} onChange={e => setForm({ ...form, audienceMode: e.target.value as 'manual' | 'gmail' })} className="mt-2 w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <option value="manual">Manual recipients</option>
                    <option value="gmail">Gmail conversation senders</option>
                  </select>
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Schedule time ({businessTimezone})
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} className="mt-2 w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </label>
              </div>
              {form.audienceMode === 'manual' && (
                <textarea value={form.recipientsText} onChange={e => setForm({ ...form, recipientsText: e.target.value })} placeholder="recipient@example.com, second@example.com" rows={4} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3 mt-6">
              <button disabled={saving} onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Cancel</button>
              <button disabled={saving} onClick={() => saveCampaign(false)} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{saving ? 'Saving...' : 'Save Draft'}</button>
              <button disabled={saving} onClick={() => saveCampaign(true)} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}>{saving ? 'Saving...' : 'Save and Schedule'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
