'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface EmailCampaign {
  id: number
  business_id: number
  name: string
  subject: string
  content: string
  audience_criteria: any
  status: string
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  failed_count: number | null
  created_at: string
}

export default function EmailCampaignsContent() {
  const { isRTL, t } = useLang()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [showStats, setShowStats] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    subject: '',
    content: '',
    audience_criteria: {},
    scheduled_at: '',
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/email-campaigns?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setCampaigns(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name || !form.subject || !form.content) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/email-campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Campaign created successfully')
        setShowModal(false)
        setForm({
          name: '',
          subject: '',
          content: '',
          audience_criteria: {},
          scheduled_at: '',
        })
        fetchCampaigns()
      } else {
        toast.error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      toast.error('Failed to create campaign')
    }
  }

  const handleSend = async (campaignId: number) => {
    if (!confirm('Are you sure you want to send this campaign now?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/email-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Campaign sent successfully')
        fetchCampaigns()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to send campaign')
      }
    } catch (error) {
      toast.error('Failed to send campaign')
    }
  }

  const handleSchedule = async (campaignId: number) => {
    const scheduledAt = prompt('Enter scheduled date and time (YYYY-MM-DD HH:MM:SS):')
    if (!scheduledAt) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/email-campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      })

      if (res.ok) {
        toast.success('Campaign scheduled successfully')
        fetchCampaigns()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to schedule campaign')
      }
    } catch (error) {
      toast.error('Failed to schedule campaign')
    }
  }

  const handleDelete = async (campaignId: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/email-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Campaign deleted')
        fetchCampaigns()
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch (error) {
      toast.error('Failed to delete campaign')
    }
  }

  const viewStats = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign)
    setShowStats(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          Email Campaigns
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Create and manage email marketing campaigns
        </p>
      </motion.div>

      {/* Stats View */}
      {showStats && selectedCampaign && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Campaign Stats: {selectedCampaign.name}
            </h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              ← Back to Campaigns
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Recipients</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCampaign.total_recipients || 0}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Delivered</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{selectedCampaign.delivered_count || 0}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Opened</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{selectedCampaign.opened_count || 0}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Clicked</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{selectedCampaign.clicked_count || 0}</p>
            </div>
          </div>
          {(selectedCampaign.failed_count || 0) > 0 && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--error-subtle)', border: '1px solid var(--error)' }}>
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                Failed: {selectedCampaign.failed_count}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Filters and Actions */}
      {!showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="sending">Sending</option>
          </select>
          <button
            onClick={() => fetchCampaigns()}
            className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            Apply Filter
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
          >
            + Create Campaign
          </button>
        </motion.div>
      )}

      {/* Campaigns List */}
      {!showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="premium-card p-6"
          style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        >
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No campaigns created yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{campaign.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          campaign.status === 'sent' ? 'bg-green-500/20 text-green-500' :
                          campaign.status === 'scheduled' ? 'bg-blue-500/20 text-blue-500' :
                          campaign.status === 'sending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Subject: {campaign.subject}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        {campaign.scheduled_at && <span>Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}</span>}
                        {campaign.sent_at && <span>Sent: {new Date(campaign.sent_at).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSend(campaign.id)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                          >
                            Send Now
                          </button>
                          <button
                            onClick={() => handleSchedule(campaign.id)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                          >
                            Schedule
                          </button>
                        </>
                      )}
                      {campaign.status === 'sent' && (
                        <button
                          onClick={() => viewStats(campaign)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                        >
                          View Stats
                        </button>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Create Email Campaign
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Monthly Newsletter"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Subject *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Email subject line"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Email content (HTML supported)"
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}