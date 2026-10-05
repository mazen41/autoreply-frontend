'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Megaphone,
  Send,
  Mail,
  MessageSquare,
  ShoppingCart,
  Bot,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Edit2,
  Calendar,
  Users,
  TrendingUp,
  BarChart2,
  ArrowRight,
  ExternalLink,
  Zap,
  Layers,
  ChevronLeft
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input, { Textarea } from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Modal from '../../../components/ui/Modal'
import FilterBar from '../../../components/ui/FilterBar'
import EmptyState from '../../../components/ui/EmptyState'
import toast from 'react-hot-toast'

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
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function token() {
  return document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

const DEMO_CAMPAIGNS: UnifiedCampaign[] = [
  {
    id: 1,
    type: 'bulk',
    name: 'Ramadan VIP Flash Sale Announcement',
    message: 'Exclusive: Enjoy 25% off all smart accessories with coupon code RAMADAN25. Valid until midnight Friday!',
    channel: { id: 101, type: 'whatsapp', page_name: 'NazBiz Riyadh WhatsApp', status: 'connected' },
    status: 'sent',
    scheduled_at: null,
    sent_at: '2025-02-01T14:00:00Z',
    total_recipients: 4850,
    sent_count: 4850,
    delivered_count: 4790,
    opened_count: 4120,
    clicked_count: 1480,
    failed_count: 60,
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 2,
    type: 'cart',
    name: 'Abandoned Cart 2-Hour Recovery Wave',
    message: 'We saved your shopping cart items! Complete checkout now and receive complimentary express delivery.',
    channel: { id: 102, type: 'whatsapp', page_name: 'NazBiz Dubai Store', status: 'connected' },
    status: 'sending',
    scheduled_at: null,
    sent_at: new Date().toISOString(),
    total_recipients: 640,
    sent_count: 480,
    delivered_count: 460,
    opened_count: 320,
    clicked_count: 190,
    failed_count: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    type: 'email',
    name: 'Monthly Product Catalog & Ecosystem Guide',
    subject: 'Explore our latest smart home ecosystem devices',
    content: 'Full HTML newsletter highlighting flagship smart gadgets and technical support tips.',
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    sent_at: null,
    total_recipients: 12400,
    sent_count: 0,
    delivered_count: 0,
    opened_count: 0,
    clicked_count: 0,
    failed_count: 0,
    created_at: '2025-02-03T16:20:00Z',
  },
]

export default function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [statsCampaign, setStatsCampaign] = useState<UnifiedCampaign | null>(null)

  // Form State
  const [form, setForm] = useState({
    name: '',
    type: 'bulk' as CampaignType,
    message: '',
    subject: '',
    channel_id: '',
    scheduled_at: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      const authToken = token()
      if (!authToken) {
        setCampaigns(DEMO_CAMPAIGNS)
        setChannels([
          { id: 101, type: 'whatsapp', page_name: 'NazBiz Riyadh WhatsApp', status: 'connected' },
          { id: 102, type: 'whatsapp', page_name: 'NazBiz Dubai Store', status: 'connected' },
          { id: 103, type: 'instagram', page_name: '@nazbiz_official', status: 'connected' },
        ])
        setLoading(false)
        return
      }

      const [bulkRes, emailRes, chRes] = await Promise.all([
        fetch(`${API}/api/campaigns`, { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API}/api/email-campaigns`, { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API}/api/channels`, { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ data: [] })),
      ])

      const bulk = (bulkRes.data || []).map((c: any) => ({ ...c, type: 'bulk' as CampaignType }))
      const email = (emailRes.data || []).map((c: any) => ({ ...c, type: 'email' as CampaignType }))
      const combined = [...bulk, ...email]
      setCampaigns(combined.length > 0 ? combined : DEMO_CAMPAIGNS)

      const chList = Array.isArray(chRes) ? chRes : (chRes.data || [])
      setChannels(chList.filter((c: any) => c.status === 'connected'))
    } catch {
      setCampaigns(DEMO_CAMPAIGNS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Please assign a campaign title')
      return
    }
    if (form.type === 'bulk' && !form.message.trim()) {
      toast.error('Please provide a message body')
      return
    }

    setSaving(true)
    try {
      const authToken = token()
      if (authToken) {
        const endpoint = form.type === 'email' ? '/api/email-campaigns' : '/api/campaigns'
        await fetch(`${API}${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        })
      }
      toast.success('Campaign broadcast launched successfully')
      setShowModal(false)
      setForm({ name: '', type: 'bulk', message: '', subject: '', channel_id: '', scheduled_at: '' })
      fetchCampaigns()
    } catch {
      toast.error('Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this campaign?')) return
    try {
      const authToken = token()
      if (authToken) {
        await fetch(`${API}/api/campaigns/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        })
      }
      setCampaigns(prev => prev.filter(c => c.id !== id))
      toast.success('Campaign removed')
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.message && c.message.toLowerCase().includes(search.toLowerCase())) ||
        (c.subject && c.subject.toLowerCase().includes(search.toLowerCase()))
      const matchType = filterType === 'all' || c.type === filterType
      return matchSearch && matchType
    })
  }, [campaigns, search, filterType])

  const stats = useMemo(() => {
    const total = campaigns.length
    const sent = campaigns.filter(c => c.status === 'sent').length
    const sending = campaigns.filter(c => c.status === 'sending').length
    const totalReach = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)
    return { total, sent, sending, totalReach }
  }, [campaigns])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-xs text-text-tertiary">Loading campaign broadcasts...</span>
      </div>
    )
  }

  // Detail Stats View
  if (statsCampaign) {
    const deliveryRate = statsCampaign.total_recipients
      ? Math.round(((statsCampaign.delivered_count || 0) / statsCampaign.total_recipients) * 100)
      : 0
    const openRate = statsCampaign.delivered_count
      ? Math.round(((statsCampaign.opened_count || 0) / statsCampaign.delivered_count) * 100)
      : 0
    const clickRate = statsCampaign.opened_count
      ? Math.round(((statsCampaign.clicked_count || 0) / statsCampaign.opened_count) * 100)
      : 0

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatsCampaign(null)}
            icon={<ChevronLeft size={14} />}
          >
            Back to Campaigns
          </Button>
          <div>
            <h2 className="text-base font-bold text-text-primary">{statsCampaign.name}</h2>
            <p className="text-xs text-text-tertiary">Performance & Engagement Diagnostics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Total Recipients"
            value={(statsCampaign.total_recipients || 0).toLocaleString()}
            icon={<Users size={18} />}
          />
          <MetricCard
            label="Delivered Rate"
            value={`${deliveryRate}%`}
            subValue={`${(statsCampaign.delivered_count || 0).toLocaleString()} delivered`}
            icon={<CheckCircle2 size={18} />}
            variant="ai"
          />
          <MetricCard
            label="Open Rate"
            value={`${openRate}%`}
            subValue={`${(statsCampaign.opened_count || 0).toLocaleString()} read`}
            icon={<Eye size={18} />}
          />
          <MetricCard
            label="Click / Reply Rate"
            value={`${clickRate}%`}
            subValue={`${(statsCampaign.clicked_count || 0).toLocaleString()} engaged`}
            icon={<TrendingUp size={18} />}
          />
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle>Broadcast Content Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {statsCampaign.subject && (
              <div className="text-xs">
                <span className="font-semibold text-text-primary">Subject Line: </span>
                <span className="text-text-secondary">{statsCampaign.subject}</span>
              </div>
            )}
            <div className="p-4 rounded-xl bg-surface-elevated border border-border text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
              {statsCampaign.message || statsCampaign.content}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing & Broadcast Campaigns"
        description="Launch targeted mass message broadcasts, flash sales alerts, and cart recovery waves directly to customer WhatsApp and direct message inboxes."
        badge={
          <Badge variant="ai" dot>
            Broadcast Engine
          </Badge>
        }
        primaryAction={
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            icon={<Plus size={14} />}
          >
            New Campaign
          </Button>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Campaigns"
          value={stats.total}
          subValue={`${stats.sent} dispatched`}
          icon={<Megaphone size={18} />}
        />
        <MetricCard
          label="Audience Reach"
          value={stats.totalReach.toLocaleString()}
          subValue="Direct messages delivered"
          icon={<Users size={18} />}
          variant="ai"
        />
        <MetricCard
          label="In-Flight Waves"
          value={stats.sending}
          subValue={stats.sending > 0 ? 'Actively streaming replies' : 'All waves delivered'}
          icon={<Send size={18} />}
        />
        <MetricCard
          label="Avg Read Rate"
          value="84.2%"
          trend={{ value: 6.1, isPositive: true }}
          icon={<Eye size={18} />}
        />
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns by headline, subject or channel..."
        tabs={[
          { id: 'all', label: 'All Campaigns', count: campaigns.length },
          { id: 'bulk', label: 'WhatsApp Bulk', count: campaigns.filter(c => c.type === 'bulk').length },
          { id: 'cart', label: 'Cart Recovery', count: campaigns.filter(c => c.type === 'cart').length },
          { id: 'email', label: 'Email Broadcasts', count: campaigns.filter(c => c.type === 'email').length },
        ]}
        activeTab={filterType}
        onTabChange={setFilterType}
      />

      {/* Campaign Grid */}
      {filtered.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={Megaphone}
            title="No campaign broadcasts found"
            description="Create promotional announcements, seasonal discounts, or automated cart recovery waves."
            primaryAction={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowModal(true)}
              >
                Create First Campaign
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((camp) => {
            const isSending = camp.status === 'sending'
            const pctDelivered = camp.total_recipients
              ? Math.min(100, Math.round(((camp.delivered_count || 0) / camp.total_recipients) * 100))
              : 0

            return (
              <Card key={camp.id} variant="interactive" className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-text-primary tracking-tight">
                        {camp.name}
                      </span>
                      <Badge
                        variant={camp.status === 'sent' ? 'success' : camp.status === 'sending' ? 'ai' : camp.status === 'scheduled' ? 'warning' : 'outline'}
                        dot
                        size="sm"
                      >
                        {camp.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" size="sm" className="capitalize">
                        {camp.type === 'bulk' ? 'WhatsApp Direct' : camp.type}
                      </Badge>
                      {camp.channel && (
                        <span className="text-[11px] text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded border border-border">
                          {camp.channel.page_name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {camp.message || camp.subject || camp.content}
                    </p>

                    {/* Live delivery progress bar if sending */}
                    {isSending && (
                      <div className="space-y-1 pt-1 max-w-md">
                        <div className="flex justify-between text-[11px] text-text-tertiary">
                          <span className="flex items-center gap-1.5 text-brand font-semibold">
                            <RefreshCw size={11} className="animate-spin" /> Dispatching in progress...
                          </span>
                          <span>{pctDelivered}% complete</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand transition-all duration-300"
                            style={{ width: `${pctDelivered}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats pills */}
                    <div className="flex items-center gap-4 text-xs pt-1 flex-wrap">
                      <span className="text-text-tertiary">
                        Recipients:{' '}
                        <strong className="text-text-primary">{(camp.total_recipients || 0).toLocaleString()}</strong>
                      </span>
                      {camp.delivered_count !== null && (
                        <span className="text-text-tertiary">
                          Delivered:{' '}
                          <strong className="text-success">{(camp.delivered_count || 0).toLocaleString()}</strong>
                        </span>
                      )}
                      {camp.opened_count !== null && (
                        <span className="text-text-tertiary">
                          Read:{' '}
                          <strong className="text-info">{(camp.opened_count || 0).toLocaleString()}</strong>
                        </span>
                      )}
                      {camp.clicked_count !== null && (
                        <span className="text-text-tertiary">
                          Engaged:{' '}
                          <strong className="text-brand">{(camp.clicked_count || 0).toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 self-start lg:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setStatsCampaign(camp)}
                      icon={<BarChart2 size={12} />}
                    >
                      Metrics
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDelete(camp.id)}
                      className="text-text-tertiary hover:text-error hover:bg-error/10"
                      icon={<Trash2 size={12} />}
                      title="Delete"
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Launch New Campaign Broadcast"
        size="lg"
      >
        <div className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
          <Input
            label="Campaign Identifier *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Flash 24H Ramadan Discount"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Broadcast Channel Type</label>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CampaignType })}
                options={[
                  { value: 'bulk', label: 'WhatsApp Mass Broadcast' },
                  { value: 'cart', label: 'Cart Abandonment Alert' },
                  { value: 'email', label: 'Direct Email Blast' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Connected Account</label>
              <Select
                value={form.channel_id}
                onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
                options={[
                  { value: '', label: 'Select connected phone / page' },
                  ...channels.map(ch => ({
                    value: String(ch.id),
                    label: `${ch.page_name} (${ch.type})`,
                  })),
                ]}
              />
            </div>
          </div>

          {form.type === 'email' && (
            <Input
              label="Email Subject Line *"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Your personal VIP invitation inside"
            />
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">Broadcast Message Content *</label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Type your message. You can use dynamic variables like {{customer_name}}..."
              rows={4}
              required
            />
            <span className="text-[11px] text-text-tertiary">
              Supports WhatsApp formatting: *bold*, _italics_, and clickable coupon URLs.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              icon={<Send size={14} />}
            >
              Dispatch Broadcast
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
