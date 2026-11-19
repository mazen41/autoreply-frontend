'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { springs, variants } from '../../../lib/motion'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonCard, MetricCardSkeleton } from '../../../components/ui/Skeleton'
import ChannelCardModern from '../../../components/channels/ChannelCardModern'
import ChannelAccountDrawer from '../../../components/channels/ChannelAccountDrawer'
import SetupReadinessCard, { AiSetupChecklist } from '../../../components/channels/SetupReadinessCard'
import ChannelConnectModalModern from '../../../components/channels/ChannelConnectModalModern'
import TelegramConnect from '../../../components/channels/TelegramConnect'
import WooCommerceConnect from '../../../components/channels/WooCommerceConnect'
import ShopifyConnect from '../../../components/channels/ShopifyConnect'
import WhatsAppConnect from '../../../components/channels/WhatsAppConnect'
import { ChannelDef, ChannelInstance } from '../../../components/channels/ChannelCard'
import { ChannelOption, ALL_CHANNELS } from '../../../components/channels/ChannelConnectWizard'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'
import {
  Radio,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle2,
  Store,
  MessageSquare,
  Share2,
  Mail,
  Zap,
  X,
  ShieldCheck,
  Activity,
} from 'lucide-react'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type GoLiveSettings = { consent_policy_acknowledged: boolean; handoff_notification_email: string | null }
type ApiChannel = ChannelInstance & {
  type: string
  auto_order_confirmation_enabled?: boolean | null
  effective_auto_order_confirmation_enabled?: boolean
  metadata?: Record<string, unknown>
  business_id?: number
  integration?: ChannelInstance['integration'] & {
    sync_warnings?: string[]
    webhook_status?: string | null
    webhooks_registered?: number | null
  }
}

function needsChannelAttention(channel: ApiChannel) {
  return (
    channel.status === 'warning' ||
    channel.status === 'error' ||
    channel.comment_webhook_status === 'error' ||
    Boolean(channel.integration?.sync_error) ||
    channel.integration?.sync_status === 'failed'
  )
}

const CHANNELS_CATALOG: ChannelDef[] = [
  {
    id: 'salla',
    name: 'Salla Store',
    description: 'Connect a Salla store to sync live catalog, inventory, delivery cities, and automated order placements.',
    category: 'ecommerce',
    brandColor: '#00B4D8',
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect a Facebook Page for Messenger conversations, automated post comments, and AI customer replies.',
    category: 'social',
    brandColor: '#1877F2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect a professional account for direct messaging (DMs) and automated reel & post comment replies.',
    category: 'social',
    brandColor: '#E4405F',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Official WhatsApp Cloud API connection for 24/7 automated client care and conversational commerce.',
    category: 'messaging',
    brandColor: '#25D366',
  },
  {
    id: 'shopify',
    name: 'Shopify Store',
    description: 'Connect a Shopify store to sync catalog products, customer profiles, order lookups, and inventory updates.',
    category: 'ecommerce',
    brandColor: '#96BF48',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connect a WordPress WooCommerce store to sync catalog items, customer records, and order history.',
    category: 'ecommerce',
    brandColor: '#96588A',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Connect a Telegram bot token via BotFather to handle instant AI customer conversations.',
    category: 'messaging',
    brandColor: '#0088CC',
  },
  {
    id: 'gmail',
    name: 'Gmail & Google Workspace',
    description: 'Connect a company mailbox to sync email threads, draft smart AI replies, and handle support tickets.',
    category: 'email',
    brandColor: '#EA4335',
  },
]

export default function ChannelsPage() {
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => (isRTL ? ar : en)

  const [apiChannels, setApiChannels] = useState<ApiChannel[]>([])
  const [selectedDrawerInstance, setSelectedDrawerInstance] = useState<ApiChannel | null>(null)
  const [aiSetup, setAiSetup] = useState<AiSetupChecklist | null>(null)
  const [testReplyLoading, setTestReplyLoading] = useState(false)
  const [testReply, setTestReply] = useState<string | null>(null)
  const [goLiveSettings, setGoLiveSettings] = useState<GoLiveSettings>({
    consent_policy_acknowledged: false,
    handoff_notification_email: '',
  })
  const [savingGoLiveSettings, setSavingGoLiveSettings] = useState(false)
  const [isSavingOrderSubmission, setIsSavingOrderSubmission] = useState(false)
  const [syncingInstanceId, setSyncingInstanceId] = useState<number | null>(null)

  // Direct connecting state tracker (shows inline spinner on that channel card)
  const [connectingChannelId, setConnectingChannelId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortOption, setSortOption] = useState<'recent' | 'alphabetical' | 'accounts' | 'status'>('accounts')

  // Header Connect Palette Modal (with instant 1-click launch)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [selectedChannelOption, setSelectedChannelOption] = useState<ChannelOption | null>(null)

  // Direct Credentials Modals (WhatsApp, Telegram, WooCommerce, Shopify)
  const [activeSpecialModal, setActiveSpecialModal] = useState<ChannelDef | null>(null)

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      const arabicMessages: Record<string, string> = {
        'Select a business first.': 'اختر نشاطاً تجارياً أولاً.',
        'Go-live settings saved.': 'تم حفظ متطلبات التفعيل.',
        'Could not save go-live settings.': 'تعذر حفظ متطلبات التفعيل.',
        'Test reply generated and setup checklist refreshed.': 'تم إنشاء الرد التجريبي وتحديث قائمة التحقق.',
        'The AI test reply failed.': 'تعذر إنشاء الرد التجريبي للذكاء الاصطناعي.',
        'WooCommerce authorization was cancelled.': 'تم إلغاء تفويض WooCommerce.',
        'WooCommerce connected. Store sync has started.': 'تم ربط WooCommerce وبدأت مزامنة المتجر.',
        'Could not verify the WooCommerce connection.': 'تعذر التحقق من اتصال WooCommerce.',
        'Channel connected successfully!': 'تم ربط القناة بنجاح!',
        'Shopify connected. Initial store sync has started.': 'تم ربط Shopify وبدأت المزامنة الأولية للمتجر.',
        'Channel account disconnected': 'تم فصل حساب القناة.',
        'Automatic order submission updated.': 'تم تحديث الإرسال التلقائي للطلبات.',
        'Could not update automatic order submission.': 'تعذر تحديث الإرسال التلقائي للطلبات.',
        'Disconnect failed': 'تعذر فصل الاتصال.',
        'Store sync started': 'بدأت مزامنة المتجر.',
        'WhatsApp connected successfully!': 'تم ربط واتساب بنجاح!',
        'Telegram bot connected!': 'تم ربط بوت تيليجرام بنجاح!',
      }
      setToast({ message: isRTL ? arabicMessages[message] || message : message, type })
      setTimeout(() => setToast(null), 4500)
    },
    [isRTL]
  )

  const fetchChannels = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setErrorState(null)
    try {
      const token = getToken()
      if (!token) throw new Error(isRTL ? 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.' : 'Your session expired. Sign in again to load channels.')

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
      if (showLoading) {
        setApiChannels([])
        setErrorState(e instanceof Error ? e.message : (isRTL ? 'تعذر تحميل القنوات.' : 'Could not load channels.'))
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [isRTL])

  const fetchAiSetup = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/ai/setup-verification`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      if (response.ok) setAiSetup(await response.json())
    } catch {
      // Graceful fallback
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
    } catch {
      // Graceful fallback
    }
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: JSON.stringify(goLiveSettings),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not save go-live settings.')
      setGoLiveSettings(result)
      await fetchAiSetup()
      showToast('Go-live settings saved.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save go-live settings.', 'error')
    } finally {
      setSavingGoLiveSettings(false)
    }
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

  // Handle OAuth redirects in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const claimFromUrl = params.get('salla_claim')
    const claimToken = claimFromUrl || window.sessionStorage.getItem('naz_pending_salla_claim')
    if (claimFromUrl) {
      window.sessionStorage.setItem('naz_pending_salla_claim', claimFromUrl)
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (claimToken) {
      const inProgressAt = Number(window.sessionStorage.getItem('naz_salla_claim_started_at') || 0)
      if (inProgressAt && Date.now() - inProgressAt < 60_000) return

      const token = getToken()
      const businessId = window.localStorage.getItem('naz_selected_business_id')
      if (!token || !businessId) {
        showToast(
          !token ? 'Sign in to finish connecting your Salla store.' : 'Select a workspace to finish connecting your Salla store.',
          'error'
        )
        return
      }

      window.sessionStorage.setItem('naz_salla_claim_started_at', String(Date.now()))
      void (async () => {
        try {
          const response = await fetch(`${API}/api/channels/salla/claim`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              ...getBusinessHeaders(),
            },
            body: JSON.stringify({ token: claimToken }),
          })
          const result = await response.json().catch(() => ({}))
          if (!response.ok) {
            if (response.status === 422 || response.status === 404) {
              window.sessionStorage.removeItem('naz_pending_salla_claim')
            }
            throw new Error(result.message || result.error || 'Could not finish connecting the Salla store.')
          }

          window.sessionStorage.removeItem('naz_pending_salla_claim')
          await fetchChannels()
          const citiesStatus = result.cities_status
          if (citiesStatus === 'matched' || citiesStatus === 'exists') {
            showToast(
              isRTL
                ? 'تم ربط متجر سلة بنجاح! تم التحقق من مدن التوصيل ومطابقتها (20,335 مدينة جاهزة).'
                : 'Salla store connected! Delivery cities are verified and matched (20,335 cities ready).',
              'success'
            )
          } else if (citiesStatus === 'processing') {
            showToast(
              isRTL
                ? 'تم ربط متجر سلة بنجاح! جاري معالجة وتحديث مدن التوصيل في الخلفية.'
                : 'Salla store connected! City catalog is currently being processed in the background.',
              'success'
            )
          } else {
            showToast(
              isRTL
                ? 'تم ربط متجر سلة بنجاح! مدن التوصيل مفعلة ومطابقة.'
                : 'Salla store connected successfully! Delivery cities are active.',
              'success'
            )
          }
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Could not finish connecting the Salla store.', 'error')
        } finally {
          window.sessionStorage.removeItem('naz_salla_claim_started_at')
        }
      })()
      return
    }

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
            const res = await fetch(
              `${API}/api/channels/woocommerce/connection-status?state=${encodeURIComponent(wooState)}`,
              {
                headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
              }
            )
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
        showToast('WooCommerce authorization returned. Refresh the channel list shortly.', 'error')
      })()
    } else if (params.get('success')) {
      const success = params.get('success')
      const cities = params.get('cities')
      void Promise.resolve().then(() => {
        if (success === 'salla_connected') {
          if (cities === 'matched' || cities === 'exists') {
            showToast(
              isRTL
                ? 'تم ربط متجر سلة بنجاح! تم التحقق من مدن التوصيل ومطابقتها (20,335 مدينة جاهزة).'
                : 'Salla store connected! Delivery cities are verified and matched (20,335 cities ready).',
              'success'
            )
          } else if (cities === 'processing') {
            showToast(
              isRTL
                ? 'تم ربط متجر سلة بنجاح! جاري معالجة وتحديث مدن التوصيل في الخلفية.'
                : 'Salla store connected! City catalog is currently being processed in the background.',
              'success'
            )
          } else {
            showToast(
              isRTL
                ? 'تم ربط متجر سلة بنجاح! مدن التوصيل مفعلة ومطابقة.'
                : 'Salla store connected successfully! Delivery cities are active.',
              'success'
            )
          }
        } else if (success === 'shopify_connected') {
          showToast('Shopify connected. Initial store sync has started.', 'success')
        } else {
          showToast('Channel connected successfully!', 'success')
        }
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
    }
  }, [fetchChannels, showToast, isRTL])

  const handleToggleOrderSubmission = async (instanceId: number, enabled: boolean) => {
    setIsSavingOrderSubmission(true)
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
        body: JSON.stringify({ auto_order_confirmation_enabled: enabled }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || result.error || 'Could not update automatic order submission.')

      setSelectedDrawerInstance((current) =>
        current?.id === instanceId
          ? { ...current, auto_order_confirmation_enabled: enabled, effective_auto_order_confirmation_enabled: enabled }
          : current
      )
      await fetchChannels(false)
      showToast('Automatic order submission updated.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update automatic order submission.', 'error')
    } finally {
      setIsSavingOrderSubmission(false)
    }
  }

  const handleDisconnect = async (instanceId: number) => {
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

  const handleSync = async (instance: ChannelInstance) => {
    setSyncingInstanceId(instance.id)
    try {
      const token = getToken()
      const endpoint =
        instance.type === 'shopify'
          ? `/api/channels/shopify/${instance.id}/sync`
          : `/api/channels/woocommerce/${instance.id}/sync`
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not queue store sync')
      showToast('Store sync started', 'success')
      await fetchChannels(false)
    } catch (err: any) {
      showToast(err?.message || 'Sync failed', 'error')
    } finally {
      setSyncingInstanceId(null)
    }
  }

  /**
   * DIRECT 1-CLICK CONNECTION HANDLER (ZERO INTERMEDIATE POPUPS!)
   * For OAuth channels (Salla, Facebook, Instagram, Gmail):
   * Sets card connecting state and immediately redirects window.location.href.
   * For credentials channels (WhatsApp, Telegram, WooCommerce, Shopify):
   * Opens their dedicated credential setup modal directly.
   */
  const handleDirectConnectChannel = async (channelId: string) => {
    if (['whatsapp', 'telegram', 'woocommerce', 'shopify'].includes(channelId)) {
      const channel = CHANNELS_CATALOG.find((item) => item.id === channelId)
      if (channel) setActiveSpecialModal(channel)
      return
    }

    setConnectingChannelId(channelId)
    try {
      const token = getToken()
      if (!token) throw new Error(isRTL ? 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.' : 'Your session expired. Please sign in again.')

      if (channelId === 'facebook' || channelId === 'instagram') {
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
          throw new Error(data.message || data.error || (isRTL ? 'تعذر جلب رابط تفويض Meta' : 'Could not get Meta authorization URL'))
        }
        window.location.href = data.url
        return
      }

      if (channelId === 'gmail') {
        const res = await fetch(`${API}/api/channels/connect/gmail`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.url) {
          throw new Error(data.message || data.error || (isRTL ? 'تعذر جلب رابط تفويض Gmail' : 'Could not get Gmail authorization URL'))
        }
        window.location.href = data.url
        return
      }

      if (channelId === 'salla') {
        const response = await fetch(`${API}/api/channels/connect/salla`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.url) {
          throw new Error(data.message || data.error || (isRTL ? 'تعذر جلب رابط تفويض متجر سلة' : 'Could not get Salla authorization URL'))
        }
        window.location.href = data.url
        return
      }

      throw new Error(`The ${channelId} connection flow is not implemented yet.`)
    } catch (err: any) {
      setConnectingChannelId(null)
      showToast(err?.message || (isRTL ? 'تعذر بدء عملية الربط.' : 'Connection initialization failed.'), 'error')
    }
  }

  // Combined Catalog with live instances
  const channelCards = useMemo(() => {
    return CHANNELS_CATALOG.map((def) => {
      const instances: ChannelInstance[] = apiChannels.filter((c) => c.type === def.id)
      return {
        ...def,
        instances,
        connected: instances.length > 0,
      }
    })
  }, [apiChannels])

  // Overview Metrics
  const totalConnected = useMemo(() => apiChannels.length, [apiChannels])
  const totalActiveAI = useMemo(() => apiChannels.filter((c) => c.effective_ai_enabled ?? c.ai_enabled).length, [apiChannels])
  const totalNeedsAttention = useMemo(() => apiChannels.filter(needsChannelAttention).length, [apiChannels])
  const totalAvailable = CHANNELS_CATALOG.length

  // Filtered & Sorted Channels
  const filteredChannels = useMemo(() => {
    return channelCards
      .filter((ch) => {
        const q = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !q ||
          ch.name.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q) ||
          ch.instances.some((inst) =>
            [inst.page_name, inst.page_id, inst.integration?.store_url]
              .some((val) => (val || '').toLowerCase().includes(q))
          )

        let matchesFilter = true
        if (selectedFilter === 'connected') {
          matchesFilter = ch.connected
        } else if (selectedFilter === 'disconnected') {
          matchesFilter = !ch.connected
        } else if (selectedFilter === 'attention') {
          matchesFilter = ch.instances.some((inst) => needsChannelAttention(inst as ApiChannel))
        } else if (selectedFilter !== 'all') {
          matchesFilter = ch.category === selectedFilter
        }

        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        if (sortOption === 'recent') {
          const aLatest = Math.max(...a.instances.map((i) => (i as any).connected_at ? new Date((i as any).connected_at).getTime() : 0), 0)
          const bLatest = Math.max(...b.instances.map((i) => (i as any).connected_at ? new Date((i as any).connected_at).getTime() : 0), 0)
          return bLatest - aLatest
        }
        if (sortOption === 'status') {
          return Number(b.connected) - Number(a.connected)
        }
        if (sortOption === 'alphabetical') {
          return a.name.localeCompare(b.name)
        }
        return b.instances.length - a.instances.length
      })
  }, [channelCards, searchQuery, selectedFilter, sortOption])

  // Group into clear visual categories
  const categoriesMap = useMemo(() => {
    return {
      ecommerce: {
        titleEn: 'E-Commerce & Store Sync',
        titleAr: 'المتاجر والتجارة الإلكترونية',
        descEn: 'Real-time catalog sync, order verification, and 20,000+ delivery cities matching.',
        descAr: 'مزامنة الكتالوج الفورية، تثبيت الطلبات التلقائي، ومطابقة أكثر من 20,000 مدينة توصيل.',
        icon: <Store size={18} className="text-cyan-400" />,
        channels: filteredChannels.filter((c) => c.category === 'ecommerce'),
      },
      messaging: {
        titleEn: 'Messaging & Live Conversations',
        titleAr: 'المراسلة والتواصل الفوري',
        descEn: 'Official conversational bridges for high-volume customer care and instant answers.',
        descAr: 'قنوات المراسلة الرسمية لخدمة العملاء والرد الفوري الآلي على مدار الساعة.',
        icon: <MessageSquare size={18} className="text-emerald-400" />,
        channels: filteredChannels.filter((c) => c.category === 'messaging'),
      },
      social: {
        titleEn: 'Social & Feed Interactions',
        titleAr: 'التواصل الاجتماعي والتعليقات',
        descEn: 'Automate direct messaging (DMs) and convert post comments into sales leads.',
        descAr: 'أتمتة الرسائل الخاصة (DMs) والرد الفوري على تعليقات المنشورات وتحويل العملاء.',
        icon: <Share2 size={18} className="text-pink-400" />,
        channels: filteredChannels.filter((c) => c.category === 'social'),
      },
      email: {
        titleEn: 'Email & Workspace Productivity',
        titleAr: 'البريد الإلكتروني والإنتاجية',
        descEn: 'Sync business mailboxes and let AI draft context-aware answers to inquiries.',
        descAr: 'مزامنة صناديق البريد المؤسسية وصياغة ردود ذكية للاستفسارات والدعم.',
        icon: <Mail size={18} className="text-amber-400" />,
        channels: filteredChannels.filter((c) => c.category === 'email'),
      },
    }
  }, [filteredChannels])

  return (
    <motion.div
      className="mx-auto w-full max-w-[1760px] space-y-7"
      dir={isRTL ? 'rtl' : 'ltr'}
      variants={variants.page}
      initial="hidden"
      animate="visible"
      transition={springs.smooth}
    >
      {/* ─── A. Page Header & Operational Status ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {isRTL ? 'القنوات والتكاملات' : 'Channels & Integrations'}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isRTL ? 'المزامنة نشطة' : 'Sync Active'}</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary max-w-2xl leading-relaxed">
            {isRTL
              ? 'إدارة الحسابات المربوطة، مراسلات المتاجر، والتكاملات المدعومة بالذكاء الاصطناعي بربط مباشر بنقرة واحدة.'
              : 'Manage connected platforms, e-commerce stores, and AI messaging automations with instant 1-click connect.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchChannels()}
          >
            {isRTL ? 'تحديث القنوات' : 'Refresh'}
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => {
              setSelectedChannelOption(null)
              setConnectModalOpen(true)
            }}
          >
            {isRTL ? 'ربط قناة جديدة' : 'Connect Channel'}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorState && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-400 shrink-0" />
            <span>{errorState}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchChannels()}>
            {L('Retry', 'إعادة المحاولة')}
          </Button>
        </div>
      )}

      {/* ─── B. Integration Overview KPI Metrics ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              label={isRTL ? 'الحسابات المتصلة' : 'Connected Accounts'}
              value={totalConnected}
              subValue={isRTL ? 'حسابات ومتاجر نشطة' : 'Active across platforms'}
              icon={<Radio size={18} className="text-emerald-400" />}
            />
            <MetricCard
              label={isRTL ? 'أتمتة الذكاء الاصطناعي' : 'Active AI Automations'}
              value={totalActiveAI}
              subValue={isRTL ? 'تتعامل مع المحادثات فورياً' : 'Routing live customer DMs'}
              icon={<Sparkles size={18} className="text-brand" />}
              variant="ai"
            />
            <MetricCard
              label={isRTL ? 'تحتاج إلى متابعة' : 'Needs Attention'}
              value={totalNeedsAttention}
              subValue={
                totalNeedsAttention > 0
                  ? isRTL ? 'تتطلب إعادة توثيق' : 'Requires re-authorization'
                  : isRTL ? 'جميع الحسابات مستقرة' : 'All accounts healthy'
              }
              icon={<AlertTriangle size={18} className={totalNeedsAttention > 0 ? 'text-amber-400' : 'text-emerald-400'} />}
              variant={totalNeedsAttention > 0 ? 'warning' : 'default'}
            />
            <MetricCard
              label={isRTL ? 'المنصات المتاحة' : 'Available Platforms'}
              value={totalAvailable}
              subValue={isRTL ? 'تكاملات رسمية معتمدة' : 'Official supported platforms'}
              icon={<Layers size={18} className="text-cyan-400" />}
            />
          </>
        )}
      </div>

      {/* ─── C. Setup Readiness Card (Collapsible by default) ──────────── */}
      <SetupReadinessCard
        aiSetup={aiSetup}
        isRTL={isRTL}
        goLiveSettings={goLiveSettings}
        setGoLiveSettings={setGoLiveSettings}
        onSaveGoLiveSettings={saveGoLiveSettings}
        savingGoLiveSettings={savingGoLiveSettings}
        onRunTestReply={runAiSetupTest}
        testReplyLoading={testReplyLoading}
        testReply={testReply}
      />

      {/* ─── D. Modern Search & Filter Toolbar ─────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-surface-card p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث عن منصة أو حساب أو متجر...' : 'Search platforms, accounts, or store URLs…'}
              className="w-full rounded-xl border border-border bg-surface ps-10 pe-10 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                title={isRTL ? 'مسح البحث' : 'Clear search'}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-text-tertiary hidden sm:inline">
              {isRTL ? 'الترتيب:' : 'Sort by:'}
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 cursor-pointer"
            >
              <option value="accounts">{isRTL ? 'الأكثر حسابات' : 'Most connected'}</option>
              <option value="status">{isRTL ? 'المتصلة أولاً' : 'Connected first'}</option>
              <option value="alphabetical">{isRTL ? 'أبجدياً' : 'Alphabetical'}</option>
              <option value="recent">{isRTL ? 'الأحدث ربطاً' : 'Recently connected'}</option>
            </select>
          </div>
        </div>

        {/* Filter Segmented Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs" data-lenis-prevent>
          {[
            { id: 'all', labelEn: 'All Integrations', labelAr: 'كل التكاملات', count: channelCards.length },
            { id: 'connected', labelEn: 'Connected', labelAr: 'المتصلة', count: channelCards.filter((c) => c.connected).length },
            { id: 'disconnected', labelEn: 'Available', labelAr: 'المتاحة', count: channelCards.filter((c) => !c.connected).length },
            { id: 'ecommerce', labelEn: 'E-Commerce', labelAr: 'المتاجر الإلكترونية', count: channelCards.filter((c) => c.category === 'ecommerce').length },
            { id: 'messaging', labelEn: 'Messaging', labelAr: 'المراسلة الفورية', count: channelCards.filter((c) => c.category === 'messaging').length },
            { id: 'social', labelEn: 'Social & Feed', labelAr: 'التواصل الاجتماعي', count: channelCards.filter((c) => c.category === 'social').length },
            { id: 'email', labelEn: 'Email', labelAr: 'البريد المؤسسي', count: channelCards.filter((c) => c.category === 'email').length },
            { id: 'attention', labelEn: 'Needs Attention', labelAr: 'تحتاج متابعة', count: totalNeedsAttention },
          ].map((tab) => {
            const isTabActive = selectedFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                  isTabActive
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-text-tertiary hover:text-text-primary border border-border/60 hover:bg-surface-elevated'
                }`}
              >
                <span>{isRTL ? tab.labelAr : tab.labelEn}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isTabActive ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── E. Integration Categories & Cards ─────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <EmptyState
          icon={<Radio size={24} />}
          title={isRTL ? 'لا توجد قنوات مطابقة' : 'No integrations match your filters'}
          description={
            isRTL
              ? 'جرّب تعديل كلمات البحث أو مسح عوامل التصفية لعرض جميع التكاملات المدعومة.'
              : 'Try adjusting your search query or clear the active filter to view all supported platforms.'
          }
          action={{
            label: isRTL ? 'مسح التصفية' : 'Clear Filters',
            onClick: () => {
              setSearchQuery('')
              setSelectedFilter('all')
            },
          }}
        />
      ) : selectedFilter !== 'all' ? (
        /* Flat Grid View when filtering by a specific subset */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChannels.map((channel) => (
            <ChannelCardModern
              key={channel.id}
              channel={channel}
              instances={channel.instances}
              isRTL={isRTL}
              onConnect={() => handleDirectConnectChannel(channel.id)}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              onManageAccount={(inst) => setSelectedDrawerInstance(inst as ApiChannel)}
              syncingInstanceId={syncingInstanceId}
              isConnecting={connectingChannelId === channel.id}
            />
          ))}
        </div>
      ) : (
        /* Categorized Sectioned Layout when viewing All Integrations */
        <div className="space-y-10">
          {Object.entries(categoriesMap).map(([key, cat]) => {
            if (cat.channels.length === 0) return null
            return (
              <section key={key} className="space-y-4">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border">
                      {cat.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-text-primary tracking-tight">
                          {isRTL ? cat.titleAr : cat.titleEn}
                        </h2>
                        <span className="rounded-full bg-surface-elevated border border-border px-2 py-0.2 text-[10px] font-bold text-text-tertiary">
                          {cat.channels.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {isRTL ? cat.descAr : cat.descEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cat.channels.map((channel) => (
                    <ChannelCardModern
                      key={channel.id}
                      channel={channel}
                      instances={channel.instances}
                      isRTL={isRTL}
                      onConnect={() => handleDirectConnectChannel(channel.id)}
                      onDisconnect={handleDisconnect}
                      onSync={handleSync}
                      onManageAccount={(inst) => setSelectedDrawerInstance(inst as ApiChannel)}
                      syncingInstanceId={syncingInstanceId}
                      isConnecting={connectingChannelId === channel.id}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* ─── F. Account Details Slide-over Drawer ──────────────────────── */}
      <ChannelAccountDrawer
        isOpen={selectedDrawerInstance !== null}
        onClose={() => setSelectedDrawerInstance(null)}
        instance={selectedDrawerInstance}
        isRTL={isRTL}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
        onToggleOrderSubmission={handleToggleOrderSubmission}
        isSavingOrderSubmission={isSavingOrderSubmission}
      />

      {/* ─── G. Header Quick Connect Modal (1-Click Direct Launch) ─────── */}
      <ChannelConnectModalModern
        isOpen={connectModalOpen}
        onClose={() => {
          setConnectModalOpen(false)
          setSelectedChannelOption(null)
        }}
        initialChannel={selectedChannelOption}
        onContinueConnection={async (ch) => {
          await handleDirectConnectChannel(ch.id)
        }}
        isRTL={isRTL}
      />

      {/* ─── H. Specialized Modals (WhatsApp, Telegram, WooCommerce, Shopify) ─ */}
      {activeSpecialModal?.id === 'whatsapp' && (
        <WhatsAppConnect
          isConnected={false}
          channel={activeSpecialModal}
          onConnected={() => {
            fetchChannels()
            setActiveSpecialModal(null)
            showToast('WhatsApp connected successfully!', 'success')
          }}
          onDisconnect={async () => {
            const token = getToken()
            await fetch(`${API}/api/whatsapp/disconnect`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, ...getBusinessHeaders() },
            })
            fetchChannels()
            setActiveSpecialModal(null)
          }}
          onClose={() => setActiveSpecialModal(null)}
        />
      )}

      {activeSpecialModal?.id === 'telegram' && (
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
            setActiveSpecialModal(null)
            showToast('Telegram bot connected!', 'success')
          }}
          onDisconnect={async () => setActiveSpecialModal(null)}
        />
      )}

      {activeSpecialModal?.id === 'woocommerce' && (
        <WooCommerceConnect
          isConnected={apiChannels.some((channel) => channel.type === 'woocommerce')}
          channels={apiChannels.filter((channel) => channel.type === 'woocommerce')}
          onConnect={async (data) => {
            const res = await fetch(`${API}/api/channels/woocommerce/connect`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...getBusinessHeaders(),
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
            await handleSync(channel)
          }}
          onDisconnect={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'woocommerce')
            if (channel) await handleDisconnect(channel.id)
            setActiveSpecialModal(null)
          }}
        />
      )}

      {activeSpecialModal?.id === 'shopify' && (
        <ShopifyConnect
          onClose={() => setActiveSpecialModal(null)}
          isConnected={apiChannels.some((channel) => channel.type === 'shopify')}
          channels={apiChannels.filter((channel) => channel.type === 'shopify')}
          onConnect={async (data) => {
            const res = await fetch(`${API}/api/channels/shopify/connect`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...getBusinessHeaders(),
              },
              body: JSON.stringify(data),
            })
            const result = await res.json()
            if (!res.ok || !result.authorization_url) throw new Error(result.error || 'Failed to start Shopify authorization')
            window.location.assign(result.authorization_url)
          }}
          onSync={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'shopify')
            if (!channel) return
            await handleSync(channel)
          }}
          onDisconnect={async (channelId) => {
            const channel = apiChannels.find((item) => item.id === channelId && item.type === 'shopify')
            if (channel) await handleDisconnect(channel.id)
            setActiveSpecialModal(null)
          }}
        />
      )}

      {/* ─── Toast Feedback ────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 end-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl text-xs font-semibold shadow-xl border flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
