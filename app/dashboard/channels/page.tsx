'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { springs, variants } from '../../../lib/motion'
import PageHeader from '../../../components/ui/PageHeader'
import FilterBar from '../../../components/ui/FilterBar'
import MetricCard from '../../../components/ui/MetricCard'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { MetricCardSkeleton } from '../../../components/ui/Skeleton'
import ChannelCard, { ChannelDef, ChannelInstance } from '../../../components/channels/ChannelCard'
import ChannelConnectWizard, { ALL_CHANNELS, ChannelOption } from '../../../components/channels/ChannelConnectWizard'
import TelegramConnect from '../../../components/channels/TelegramConnect'
import WooCommerceConnect from '../../../components/channels/WooCommerceConnect'
import ShopifyConnect from '../../../components/channels/ShopifyConnect'
import WhatsAppConnect from '../../../components/channels/WhatsAppConnect'
import Checkbox from '../../../components/ui/Checkbox'
import Modal from '../../../components/ui/Modal'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'
import {
  Radio,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type AiSetupChecklist = {
  ready: boolean
  checks: Record<string, { passed: boolean; label: string }>
  missing: string[]
}
type GoLiveSettings = { consent_policy_acknowledged: boolean; handoff_notification_email: string | null }
type ApiChannel = ChannelInstance & {
  type: string
  metadata?: Record<string, unknown>
  business_id?: number
  integration?: ChannelInstance['integration'] & {
    sync_warnings?: string[]
    webhook_status?: string | null
    webhooks_registered?: number | null
  }
}

function needsChannelAttention(channel: ApiChannel) {
  return channel.status === 'warning'
    || channel.status === 'error'
    || channel.comment_webhook_status === 'error'
    || Boolean(channel.integration?.sync_error)
    || channel.integration?.sync_status === 'failed'
}

const CHANNELS_CATALOG: ChannelDef[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect a professional account for supported direct messages and comment replies.',
    category: 'social',
    brandColor: '#E4405F',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect WhatsApp Cloud or a compatible WhatsApp instance; features depend on the provider.',
    category: 'messaging',
    brandColor: '#25D366',
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect a Facebook Page for supported Messenger conversations and comment replies.',
    category: 'social',
    brandColor: '#1877F2',
  },
  {
    id: 'gmail',
    name: 'Gmail & Google Workspace',
    description: 'Connect a mailbox to sync email conversations and send supported replies.',
    category: 'email',
    brandColor: '#EA4335',
  },
  {
    id: 'salla',
    name: 'Salla Store',
    description: 'Connect a Salla store to sync its catalog and order data for commerce-aware conversations.',
    category: 'ecommerce',
    brandColor: '#00B4D8',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Connect a Telegram bot for customer conversations.',
    category: 'messaging',
    brandColor: '#0088CC',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect a Shopify store to sync its catalog, customers and orders.',
    category: 'ecommerce',
    brandColor: '#96BF48',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connect a WooCommerce store to sync its catalog, customers and orders.',
    category: 'ecommerce',
    brandColor: '#96588A',
  },
]

export default function ChannelsPage() {
  const { isRTL } = useLang()
  const [apiChannels, setApiChannels] = useState<ApiChannel[]>([])
  const [settingsInstance, setSettingsInstance] = useState<ApiChannel | null>(null)
  const [aiSetup, setAiSetup] = useState<AiSetupChecklist | null>(null)
  const [testReplyLoading, setTestReplyLoading] = useState(false)
  const [testReply, setTestReply] = useState<string | null>(null)
  const [goLiveSettings, setGoLiveSettings] = useState<GoLiveSettings>({ consent_policy_acknowledged: false, handoff_notification_email: '' })
  const [savingGoLiveSettings, setSavingGoLiveSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOption, setSortOption] = useState('accounts')

  // Connect wizard modal
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedWizardChannel, setSelectedWizardChannel] = useState<ChannelOption | null>(null)

  // Special direct connect modals
  const [activeModalChannel, setActiveModalChannel] = useState<ChannelDef | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchChannels = useCallback(async () => {
    setLoading(true)
    setErrorState(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to load channels.')

      const res = await fetch(`${API}/api/channels`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (res.ok) {
        const data = await res.json()
        setApiChannels(Array.isArray(data) ? data : data.data || [])
      } else {
        throw new Error(`Failed to load channels: ${res.status}`)
      }
    } catch (e: unknown) {
      setApiChannels([])
      setErrorState(e instanceof Error ? e.message : 'Could not load channels.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAiSetup = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/ai/setup-verification`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (response.ok) setAiSetup(await response.json())
    } catch {
      // Channel loading remains usable if readiness status is temporarily unavailable.
    }
  }, [])

  const fetchGoLiveSettings = useCallback(async () => {
    const token = getToken()
    const businessId = window.localStorage.getItem('naz_selected_business_id')
    if (!token || !businessId) return
    try {
      const response = await fetch(`${API}/api/businesses/${businessId}/go-live-settings`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (response.ok) setGoLiveSettings(await response.json())
    } catch { /* Readiness remains visible if settings are temporarily unavailable. */ }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchChannels()
      void fetchAiSetup()
      void fetchGoLiveSettings()
    })
  }, [fetchChannels, fetchAiSetup, fetchGoLiveSettings])

  const saveGoLiveSettings = async () => {
    const businessId = window.localStorage.getItem('naz_selected_business_id')
    if (!businessId) return showToast('Select a business first.', 'error')
    setSavingGoLiveSettings(true)
    try {
      const response = await fetch(`${API}/api/businesses/${businessId}/go-live-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify(goLiveSettings),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not save go-live settings.')
      setGoLiveSettings(result)
      await fetchAiSetup()
      showToast('Go-live settings saved.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save go-live settings.', 'error')
    } finally { setSavingGoLiveSettings(false) }
  }

  const runAiSetupTest = async () => {
    setTestReplyLoading(true)
    setTestReply(null)
    try {
      const response = await fetch(`${API}/api/knowledge/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify({ test_question: 'Write a short greeting for a customer.' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'The AI test reply could not be generated.')
      setTestReply(data.test_response || 'The AI test reply was generated successfully.')
      await fetchAiSetup()
      showToast('Test reply generated and setup checklist refreshed.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The AI test reply failed.', 'error')
    } finally {
      setTestReplyLoading(false)
    }
  }

  const commerceSyncIsActive = apiChannels.some((channel) =>
    ['queued', 'syncing'].includes(channel.integration?.sync_status || '')
  )

  useEffect(() => {
    if (!commerceSyncIsActive) return
    const timer = setInterval(async () => {
      const token = getToken()
      if (!token) return
      try {
        const res = await fetch(`${API}/api/channels`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
        if (!res.ok) return
        const data = await res.json()
        setApiChannels(Array.isArray(data) ? data : data.data || [])
      } catch (error) {
        console.warn('Could not refresh commerce sync status:', error)
      }
    }, 2500)
    return () => clearInterval(timer)
  }, [commerceSyncIsActive])

  // Handle OAuth redirects in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const wooState = params.get('connection_state')
    if (params.get('connection') === 'woocommerce' && wooState) {
      const approved = params.get('success') !== '0'
      window.history.replaceState({}, '', window.location.pathname)
      if (!approved) {
        void Promise.resolve().then(() => showToast('WooCommerce authorization was cancelled.', 'error'))
        return
      }

      void (async () => {
        for (let attempt = 0; attempt < 30; attempt++) {
          try {
            const res = await fetch(`${API}/api/channels/woocommerce/connection-status?state=${encodeURIComponent(wooState)}`, {
              headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
            })
            const result = await res.json()
            if (result.status === 'connected') {
              showToast('WooCommerce connected. Store sync has started.', 'success')
              await fetchChannels()
              return
            }
            if (result.status === 'failed' || result.status === 'expired' || !res.ok) {
              throw new Error(result.error || 'Could not verify the WooCommerce connection.')
            }
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not verify the WooCommerce connection.', 'error')
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        showToast('WooCommerce authorization returned, but the server has not confirmed the connection yet. Refresh the channel list shortly.', 'error')
      })()
    } else if (params.get('success')) {
      const success = params.get('success')
      void Promise.resolve().then(() => {
        showToast(success === 'shopify_connected'
          ? 'Shopify connected. Initial store sync has started.'
          : 'Channel connected successfully!', 'success')
        return fetchChannels()
      })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('error')) {
      const errors: Record<string, string> = {
        shopify_cancelled: 'Shopify authorization was cancelled.',
        shopify_invalid_callback: 'Shopify returned an invalid authorization response.',
        shopify_expired_callback: 'Shopify authorization expired. Please connect again.',
        shopify_invalid_state: 'The Shopify connection request expired. Please connect again.',
        shopify_authorization_failed: 'Shopify did not authorize the requested access.',
        shopify_verification_failed: 'The store identity could not be verified.',
        shopify_connection_failed: 'Could not finish connecting Shopify. Please try again.',
        shopify_invalid_configuration: 'Shopify integration settings are incomplete.',
      }
      const errorMessage = errors[params.get('error') || ''] || 'Channel connection failed. Please try again.'
      void Promise.resolve().then(() => showToast(errorMessage, 'error'))
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('connect') === 'true') {
      void Promise.resolve().then(() => setWizardOpen(true))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [fetchChannels])

  // Toggle AI Auto-Reply
  const handleToggleAI = async (instanceId: number, currentStatus: boolean) => {
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/channels/${instanceId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({ ai_enabled: !currentStatus }),
        })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (result.checks) setAiSetup({ ready: Boolean(result.ready), checks: result.checks, missing: result.missing || [] })
        throw new Error(result.message || result.error || 'AI setting update failed.')
      }
      setApiChannels((prev) => prev.map((item) => item.id === instanceId ? { ...item, ai_enabled: !currentStatus } : item))
      showToast(
        !currentStatus
          ? 'AI Auto-Reply enabled for this account'
          : 'AI Auto-Reply paused'
      )
    } catch (e) {
      console.error(e)
      showToast(e instanceof Error ? e.message : 'Failed to update AI setting', 'error')
    }
  }

  // Disconnect Account
  const handleDisconnect = async (instanceId: number) => {
    if (!confirm('Are you sure you want to disconnect this channel account?')) {
      return
    }

    try {
      const token = getToken()
      if (!token) throw new Error('Please sign in again before disconnecting this channel.')
      const response = await fetch(`${API}/api/channels/${instanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || result.error || 'The channel could not be disconnected.')
      }
      setApiChannels((prev) => prev.filter((i) => i.id !== instanceId))
      showToast('Channel account disconnected', 'success')
      await fetchChannels()
    } catch (e) {
      console.error(e)
      showToast(e instanceof Error ? e.message : 'Disconnect failed', 'error')
    }
  }

  // Start the matching supported connection flow.
  const handleChannelConnection = async (ch: ChannelOption) => {
    if (['whatsapp', 'telegram', 'woocommerce', 'shopify'].includes(ch.id)) {
      const channel = CHANNELS_CATALOG.find((item) => item.id === ch.id)
      if (!channel) throw new Error(`The ${ch.name} connection flow is unavailable.`)
      setActiveModalChannel(channel)
      return
    }

    const token = getToken()
    if (!token) throw new Error('Your session expired. Sign in again before connecting a channel.')

    if (ch.id === 'facebook' || ch.id === 'instagram') {
      const response = await fetch(`${API}/api/channels/connect/facebook`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) {
        throw new Error(data.message || data.error || 'Could not get Facebook authorization URL')
      }
      window.location.href = data.url
      return
    }

    if (ch.id === 'gmail') {
      const res = await fetch(`${API}/api/channels/connect/gmail`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Could not get Gmail auth URL')
      }
      return
    }

    if (ch.id === 'salla') {
      const response = await fetch(`${API}/api/channels/connect/salla`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) {
        throw new Error(data.message || data.error || 'Could not get Salla authorization URL')
      }
      window.location.href = data.url
      return
    }



    throw new Error(`The ${ch.id} connection flow is not implemented yet.`)
  }

  // Open direct connect for specialized channels (WhatsApp, Telegram, WooCommerce)
  const handleOpenConnect = (ch: ChannelDef) => {
    if (ch.id === 'whatsapp' || ch.id === 'telegram' || ch.id === 'woocommerce' || ch.id === 'shopify') {
      setActiveModalChannel(ch)
    } else {
      const foundOption = ALL_CHANNELS.find((c) => c.id === ch.id) || null
      setSelectedWizardChannel(foundOption)
      setWizardOpen(true)
    }
  }

  // Combined Channel List with Real instances
  const channelCards = useMemo(() => {
    return CHANNELS_CATALOG.map((def) => {
      const instances: ChannelInstance[] = apiChannels.filter(
        (c) => c.type === def.id
      )
      return {
        ...def,
        instances,
        connected: instances.length > 0,
      }
    })
  }, [apiChannels])

  // Overview Statistics
  const totalConnected = useMemo(() => {
    return apiChannels.length
  }, [apiChannels])

  const totalActiveAI = useMemo(() => {
    return apiChannels.filter((c) => c.effective_ai_enabled ?? c.ai_enabled).length
  }, [apiChannels])

  const totalNeedsAttention = useMemo(() => {
    return apiChannels.filter(needsChannelAttention).length
  }, [apiChannels])

  const totalAvailable = CHANNELS_CATALOG.length

  // Filtered & Sorted Channels
  const filteredChannels = useMemo(() => {
    return channelCards
      .filter((ch) => {
        // Search filter
        const q = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !q ||
          ch.name.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q) ||
          ch.instances.some((inst) =>
            [inst.page_name, inst.page_id, inst.integration?.store_url]
              .some((value) => (value || '').toLowerCase().includes(q))
          )

        // Category filter
        let matchesCategory = true
        if (selectedCategory === 'connected') {
          matchesCategory = ch.connected
        } else if (selectedCategory === 'attention') {
          matchesCategory = ch.instances.some((instance) => needsChannelAttention(instance as ApiChannel))
        } else if (selectedCategory !== 'all') {
          matchesCategory = ch.category === selectedCategory
        }

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => {
        if (sortOption === 'connected') {
          return Number(b.connected) - Number(a.connected)
        }
        if (sortOption === 'alphabetical') {
          return a.name.localeCompare(b.name)
        }
        // Default to the integrations with the most connected accounts.
        return b.instances.length - a.instances.length
      })
  }, [channelCards, searchQuery, selectedCategory, sortOption])

  return (
    <motion.div
      className="space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      variants={variants.page}
      initial="hidden"
      animate="visible"
      transition={springs.smooth}
    >
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title={isRTL ? 'القنوات' : 'Channels'}
        description={isRTL
          ? 'اربط قنوات التواصل مع عملائك وأدر المحادثات المدعومة بالذكاء الاصطناعي من مكان واحد.'
          : 'Connect your customer communication channels and manage AI-powered conversations from one place.'}
        breadcrumbs={[
          { label: 'NazBiz', href: '/dashboard' },
          { label: isRTL ? 'القنوات' : 'Channels' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => {
              setSelectedWizardChannel(null)
              setWizardOpen(true)
            }}
          >
            {isRTL ? 'ربط قناة' : 'Connect channel'}
          </Button>
        }
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchChannels()}
          >
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        }
      />

      {errorState && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{errorState}</span><Button variant="outline" size="sm" onClick={() => void fetchChannels()}>Retry</Button></div>}

      {aiSetup && (
        <section className="rounded-2xl border border-border bg-surface-card p-5" aria-labelledby="ai-setup-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="ai-setup-title" className="text-sm font-semibold text-text-primary">AI go-live checklist</h2>
              <p className="mt-1 text-xs text-text-secondary">Replies stay off until setup is complete and a test reply succeeds.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void runAiSetupTest()} disabled={testReplyLoading}>
              {testReplyLoading ? 'Generating test reply…' : 'Generate test reply'}
            </Button>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {Object.entries(aiSetup.checks).map(([key, check]) => (
              <li key={key} className="flex items-center gap-2 text-xs text-text-secondary">
                {check.passed
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  : <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-2">
            <Checkbox checked={goLiveSettings.consent_policy_acknowledged} onChange={(checked) => setGoLiveSettings({ ...goLiveSettings, consent_policy_acknowledged: checked })} label={<>I acknowledge that marketing messages require prior opt-in and STOP or unsubscribe requests are honored. <a className="text-brand underline" href="/privacy">Privacy policy</a></>} className="text-xs" />
            <label className="space-y-1 text-xs text-text-secondary">Human handoff notification email
              <input type="email" className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm" value={goLiveSettings.handoff_notification_email || ''} onChange={(event) => setGoLiveSettings({ ...goLiveSettings, handoff_notification_email: event.target.value })} placeholder="support@example.com" />
            </label>
            <div className="md:col-span-2"><Button variant="outline" size="sm" onClick={() => void saveGoLiveSettings()} disabled={savingGoLiveSettings}>{savingGoLiveSettings ? 'Saving…' : 'Save go-live requirements'}</Button></div>
          </div>
          {testReply && <p className="mt-3 rounded-lg bg-surface-elevated p-3 text-xs text-text-secondary">Test reply: {testReply}</p>}
          {aiSetup.ready && <p className="mt-3 text-xs font-medium text-success">Setup verified. You can enable AI replies on a connected channel.</p>}
        </section>
      )}

      {/* ─── Overview KPI Metrics Row ────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={variants.fadeUp} transition={springs.standard}>
              <MetricCardSkeleton />
            </motion.div>
          ))
        ) : (
          <>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label={isRTL ? 'الحسابات المتصلة' : 'Connected Accounts'}
                value={totalConnected}
                subValue={isRTL ? 'عبر جميع المنصات' : 'Across all platforms'}
                icon={<Radio size={18} />}
              />
            </motion.div>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label={isRTL ? 'أتمتة الذكاء الاصطناعي النشطة' : 'Active AI Automations'}
                value={totalActiveAI}
                subValue={isRTL ? 'تتعامل مع رسائل العملاء' : 'Handling customer DMs'}
                icon={<Sparkles size={18} />}
                variant="ai"
              />
            </motion.div>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label={isRTL ? 'تحتاج إلى متابعة' : 'Needs Attention'}
                value={totalNeedsAttention}
                subValue={
                  totalNeedsAttention > 0
                    ? (isRTL ? 'إعادة ربط أو تنبيه' : 'Re-authentication or alert')
                    : (isRTL ? 'كل الحسابات سليمة' : 'All accounts healthy')
                }
                icon={<AlertTriangle size={18} />}
                variant={totalNeedsAttention > 0 ? 'warning' : 'default'}
              />
            </motion.div>
            <motion.div variants={variants.fadeUp} transition={springs.standard}>
              <MetricCard
                label={isRTL ? 'المنصات المتاحة' : 'Available Platforms'}
                value={totalAvailable}
                subValue={isRTL ? 'تكاملات جاهزة' : 'Ready integrations'}
                icon={<Layers size={18} />}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ─── Filter Bar ──────────────────────────────────────────────────── */}
      <FilterBar
        dir={isRTL ? 'rtl' : 'ltr'}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isRTL ? 'ابحث عن قناة أو حساب...' : 'Search channels or accounts...'}
        tabs={[
          { id: 'all', label: isRTL ? 'كل القنوات' : 'All Channels', count: channelCards.length },
          {
            id: 'connected',
            label: isRTL ? 'متصلة' : 'Connected',
            count: channelCards.filter((c) => c.connected).length,
          },
          {
            id: 'messaging',
            label: isRTL ? 'المراسلة والدردشة' : 'Messaging & Chat',
            count: channelCards.filter((c) => c.category === 'messaging').length,
          },
          {
            id: 'social',
            label: isRTL ? 'التواصل الاجتماعي والتقييمات' : 'Social & Reviews',
            count: channelCards.filter((c) => c.category === 'social').length,
          },
          {
            id: 'ecommerce',
            label: isRTL ? 'التجارة الإلكترونية' : 'E-Commerce',
            count: channelCards.filter((c) => c.category === 'ecommerce').length,
          },
          {
            id: 'email',
            label: isRTL ? 'البريد الإلكتروني' : 'Email',
            count: channelCards.filter((c) => c.category === 'email').length,
          },
          {
            id: 'attention',
            label: isRTL ? 'تحتاج إلى متابعة' : 'Needs Attention',
            count: totalNeedsAttention,
          },
        ]}
        activeTab={selectedCategory}
        onTabChange={setSelectedCategory}
        sortOptions={[
          { value: 'accounts', label: isRTL ? 'الأكثر اتصالاً' : 'Most Connected Accounts' },
          { value: 'connected', label: isRTL ? 'المتصلة أولاً' : 'Connected First' },
          { value: 'alphabetical', label: isRTL ? 'أبجدياً' : 'Alphabetical' },
        ]}
        sortValue={sortOption}
        onSortChange={setSortOption}
      />

      {/* ─── Channels Directory Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <EmptyState
          icon={<Radio size={24} />}
          title={isRTL ? 'لا توجد قنوات مطابقة' : 'No channels match your filter'}
          description={isRTL
            ? 'جرّب تعديل كلمات البحث أو تغيير الفئة المحددة لعرض القنوات المتاحة.'
            : 'Try modifying your search keywords or change the selected category to view available channels.'}
          action={{
            label: isRTL ? 'مسح عوامل التصفية' : 'Clear Filters',
            onClick: () => {
              setSearchQuery('')
              setSelectedCategory('all')
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              instances={channel.instances}
              isRTL={isRTL}
              onConnect={() => handleOpenConnect(channel)}
              onToggleAI={handleToggleAI}
              onDisconnect={handleDisconnect}
              onSync={async (instance) => {
                const token = getToken()
                const endpoint = instance.type === 'shopify'
                  ? `/api/channels/shopify/${instance.id}/sync`
                  : `/api/channels/woocommerce/${instance.id}/sync`
                const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error || 'Could not queue store sync')
                showToast('Store sync started', 'success')
                fetchChannels()
              }}
              onManageSettings={(inst) => {
                const selected = apiChannels.find((channel) => channel.id === inst.id)
                if (selected) setSettingsInstance(selected)
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Channel Connect Multi-Step Wizard Modal ──────────────────────── */}
      <ChannelConnectWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialChannel={selectedWizardChannel}
        onContinueConnection={handleChannelConnection}
      />

      <Modal
        isOpen={settingsInstance !== null}
        onClose={() => setSettingsInstance(null)}
        title={settingsInstance?.page_name || 'Account settings'}
        description="Connection status and account controls for this channel."
        size="md"
        footer={settingsInstance ? <Button variant="outline" onClick={() => setSettingsInstance(null)}>Close</Button> : undefined}
      >
        {settingsInstance && <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-3">
            <dt className="text-text-muted">Channel</dt><dd className="font-medium capitalize">{settingsInstance.type}</dd>
            <dt className="text-text-muted">Account ID</dt><dd className="break-all font-mono text-xs">{settingsInstance.page_id || settingsInstance.id}</dd>
            <dt className="text-text-muted">Connection</dt><dd className="capitalize">{settingsInstance.status || 'Connected'}</dd>
            <dt className="text-text-muted">AI replies</dt><dd>{settingsInstance.effective_ai_enabled ?? settingsInstance.ai_enabled ? 'Enabled' : 'Paused'}</dd>
            {settingsInstance.ai_pause_reason && <><dt className="text-text-muted">Pause reason</dt><dd>{settingsInstance.ai_pause_reason}</dd></>}
            {settingsInstance.comment_webhook_status && <><dt className="text-text-muted">Comment webhook</dt><dd className="capitalize">{settingsInstance.comment_webhook_status}{settingsInstance.comment_webhook_error_code ? ` (${settingsInstance.comment_webhook_error_code})` : ''}</dd></>}
            {settingsInstance.integration?.store_url && <><dt className="text-text-muted">Store URL</dt><dd className="break-all">{settingsInstance.integration.store_url}</dd></>}
            {settingsInstance.integration?.sync_status && <><dt className="text-text-muted">Store sync</dt><dd className="capitalize">{settingsInstance.integration.sync_status}</dd></>}
            {settingsInstance.integration?.sync_error && <><dt className="text-text-muted">Sync issue</dt><dd className="text-error">{settingsInstance.integration.sync_error}</dd></>}
          </dl>
          {settingsInstance.status_message && <p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-warning">{settingsInstance.status_message}</p>}
          <div className="flex justify-end border-t border-border pt-4">
            <Button variant={settingsInstance.ai_enabled ? 'outline' : 'primary'} onClick={() => {
              void handleToggleAI(settingsInstance.id, settingsInstance.ai_enabled)
              setSettingsInstance(null)
            }}>{settingsInstance.ai_enabled ? 'Pause AI replies' : 'Enable AI replies'}</Button>
          </div>
        </div>}
      </Modal>

      {/* ─── Direct WhatsApp Connect Modal ───────────────────────────────── */}
      {activeModalChannel?.id === 'whatsapp' && (
        <WhatsAppConnect
          isConnected={false}
          channel={activeModalChannel}
          onConnected={() => {
            fetchChannels()
            setActiveModalChannel(null)
            showToast('WhatsApp connected successfully!', 'success')
          }}
          onDisconnect={async () => {
            const token = getToken()
            await fetch(`${API}/api/whatsapp/disconnect`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() },
            })
            fetchChannels()
            setActiveModalChannel(null)
          }}
          onClose={() => setActiveModalChannel(null)}
        />
      )}

      {/* ─── Direct Telegram Connect Modal ───────────────────────────────── */}
      {activeModalChannel?.id === 'telegram' && (
        <TelegramConnect
          isConnected={false}
          onConnect={async (data) => {
            const res = await fetch(`${API}/api/channels/telegram/connect`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error || 'Failed to connect')
            fetchChannels()
            setActiveModalChannel(null)
            showToast('Telegram bot connected!', 'success')
          }}
          onDisconnect={async () => setActiveModalChannel(null)}
        />
      )}

      {/* ─── Direct WooCommerce Connect Modal ────────────────────────────── */}
      {activeModalChannel?.id === 'woocommerce' && (
        <WooCommerceConnect
          isConnected={apiChannels.some((channel) => channel.type === 'woocommerce')}
          channels={apiChannels.filter((channel) => channel.type === 'woocommerce')}
          onConnect={async (data) => {
            const res = await fetch(`${API}/api/channels/woocommerce/connect`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
                ...getBusinessHeaders(),
                Accept: 'application/json',
              },
              body: JSON.stringify(data),
            })
            const result = await res.json()
            if (!res.ok || !result.authorization_url) throw new Error(result.error || 'Failed to start WooCommerce authorization')
            window.location.assign(result.authorization_url)
          }}
          onSync={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'woocommerce')
            if (!channel) return
            const res = await fetch(`${API}/api/channels/woocommerce/${channel.id}/sync`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() } })
            if (!res.ok) throw new Error('Could not queue store sync')
            showToast('Store sync started', 'success')
            fetchChannels()
          }}
          onDisconnect={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'woocommerce')
            if (channel) await handleDisconnect(channel.id)
            setActiveModalChannel(null)
          }}
        />
      )}

      {activeModalChannel?.id === 'shopify' && (
        <ShopifyConnect
          onClose={() => setActiveModalChannel(null)}
          isConnected={apiChannels.some((channel) => channel.type === 'shopify')}
          channels={apiChannels.filter((channel) => channel.type === 'shopify')}
          onConnect={async (data) => {
            const res = await fetch(`${API}/api/channels/shopify/connect`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() },
              body: JSON.stringify(data),
            })
            const result = await res.json()
            if (!res.ok || !result.authorization_url) throw new Error(result.error || 'Failed to start Shopify authorization')
            window.location.assign(result.authorization_url)
          }}
          onSync={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'shopify')
            if (!channel) return
            const res = await fetch(`${API}/api/channels/shopify/${channel.id}/sync`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() } })
            if (!res.ok) throw new Error('Could not queue store sync')
            showToast('Store sync started', 'success')
            fetchChannels()
          }}
          onDisconnect={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'shopify')
            if (channel) await handleDisconnect(channel.id)
            setActiveModalChannel(null)
          }}
        />
      )}

      {/* ─── Toast Feedback Notification ─────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl text-xs font-semibold shadow-xl border flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-error/15 border-error/30 text-error'
                : 'bg-success/15 border-success/30 text-success'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                toast.type === 'error' ? 'bg-error' : 'bg-success'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
