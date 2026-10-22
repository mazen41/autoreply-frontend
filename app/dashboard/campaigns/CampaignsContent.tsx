'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Megaphone,
  Plus,
  RefreshCw,
  Layers,
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders, getSelectedBusinessId } from '../../../lib/businessContext'
import toast from 'react-hot-toast'

import { UnifiedCampaign, Channel, CampaignType } from '../../../components/campaigns/types'
import MessagingSystemsOrientation from '../../../components/campaigns/MessagingSystemsOrientation'
import CampaignLifecycleBanner from '../../../components/campaigns/CampaignLifecycleBanner'
import CampaignsList from '../../../components/campaigns/CampaignsList'
import CampaignDetailDrawer from '../../../components/campaigns/CampaignDetailDrawer'
import CreateCampaignWizard from '../../../components/campaigns/CreateCampaignWizard'
import SegmentsAndTemplates from '../../../components/campaigns/SegmentsAndTemplates'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find((c) => c.trim().startsWith('naz_token='))?.split('=')[1] || ''
}

export default function CampaignsContent() {
  const { isRTL } = useLang()
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments-templates'>('campaigns')
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Drawer & Wizard state
  const [selectedCampaign, setSelectedCampaign] = useState<UnifiedCampaign | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  // Fetch all campaigns and channels
  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const authToken = getToken()
      if (!authToken) throw new Error(isRTL ? 'انتهت جلستك. يرجى تسجيل الدخول مجدداً.' : 'Your session expired. Please sign in again.')

      const activeBusinessId = getSelectedBusinessId()
      if (!activeBusinessId) throw new Error(isRTL ? 'يرجى اختيار نشاط تجاري أولاً.' : 'Select a business before loading campaigns.')
      setBusinessId(activeBusinessId)

      const [bulkResponse, emailResponse, channelResponse] = await Promise.all([
        fetch(`${API}/api/businesses/${activeBusinessId}/campaigns`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
        }),
        fetch(`${API}/api/email-campaigns`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
        }),
        fetch(`${API}/api/channels`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
        }),
      ])

      if (!bulkResponse.ok && !emailResponse.ok) {
        throw new Error(isRTL ? 'تعذر تحميل بيانات الحملات من الخادم.' : 'Could not load campaign data from server.')
      }

      const bulkRes = bulkResponse.ok ? await bulkResponse.json() : []
      const emailRes = emailResponse.ok ? await emailResponse.json() : []
      const chRes = channelResponse.ok ? await channelResponse.json() : []

      const bulkRows = Array.isArray(bulkRes) ? bulkRes : bulkRes.data || []
      const bulk: UnifiedCampaign[] = bulkRows.map((c: any) => ({
        ...c,
        type: 'bulk' as CampaignType,
      }))

      const emailRows = Array.isArray(emailRes) ? emailRes : emailRes.data || []
      const email: UnifiedCampaign[] = emailRows.map((c: any) => ({
        ...c,
        type: 'email' as CampaignType,
      }))

      setCampaigns([...bulk, ...email])

      const chList = Array.isArray(chRes) ? chRes : chRes.data || []
      setChannels(chList.filter((c: any) => c.status === 'connected'))
    } catch (error) {
      console.error('Campaign loading failed:', error)
      setCampaigns([])
      setChannels([])
      setLoadError(error instanceof Error ? error.message : 'Could not load campaigns.')
    } finally {
      setLoading(false)
    }
  }, [isRTL])

  useEffect(() => {
    void fetchCampaigns()
  }, [fetchCampaigns])

  // Open campaign drawer
  const handleSelectCampaign = (c: UnifiedCampaign) => {
    setSelectedCampaign(c)
    setIsDrawerOpen(true)
  }

  // Update selected campaign reference if refreshed
  const handleCampaignUpdated = () => {
    void fetchCampaigns()
    if (selectedCampaign) {
      // Find updated version in latest fetch
      const updated = campaigns.find((c) => c.id === selectedCampaign.id && c.type === selectedCampaign.type)
      if (updated) setSelectedCampaign(updated)
    }
  }

  const tabs = [
    {
      id: 'campaigns',
      label: isRTL ? 'الحملات والإرسال' : 'Broadcast Campaigns',
      icon: <Megaphone size={14} />,
      badge: campaigns.length,
    },
    {
      id: 'segments-templates',
      label: isRTL ? 'الجمهور والقوالب' : 'Segments & Templates',
      icon: <Layers size={14} />,
    },
  ]

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      {/* 1. Page Header */}
      <PageHeader
        title={isRTL ? 'حملات البث والمراسلة' : 'Marketing & Broadcast Campaigns'}
        description={
          isRTL
            ? 'إرسال الإعلانات، العروض الترويجية، والتحديثات لجمهور محدد عبر قنوات المراسلة المدعومة.'
            : 'Send announcements, offers, and updates to a selected audience through a supported messaging channel.'
        }
        badge={
          <Badge variant="ai" dot>
            {isRTL ? 'محرك البث المباشر' : 'Broadcast Engine'}
          </Badge>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void fetchCampaigns()}
              disabled={loading}
              icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
            >
              {isRTL ? 'تحديث' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsWizardOpen(true)}
              icon={<Plus size={14} />}
            >
              {isRTL ? 'إنشاء حملة جديدة' : 'Create campaign'}
            </Button>
          </div>
        }
      />

      {/* 2. Workspace Tabs Navigation */}
      <div>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'campaigns' | 'segments-templates')}
          variant="segmented"
          size="md"
        />
      </div>

      {/* 3. Tab: Broadcast Campaigns Workspace */}
      {activeTab === 'campaigns' && (
        <div className="space-y-5">
          {/* Messaging Systems Educational Orientation Guide */}
          <MessagingSystemsOrientation isRTL={isRTL} />

          {/* Visual Lifecycle Stepper */}
          <CampaignLifecycleBanner isRTL={isRTL} />

          {/* Campaigns Filterable List & Real KPIs */}
          <CampaignsList
            campaigns={campaigns}
            onSelectCampaign={handleSelectCampaign}
            onNewCampaign={() => setIsWizardOpen(true)}
            loading={loading}
            loadError={loadError}
            onRetry={() => void fetchCampaigns()}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* 4. Tab: Audience Segments & Templates */}
      {activeTab === 'segments-templates' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 text-xs text-text-secondary">
            <p className="font-semibold text-text-primary text-sm mb-1">
              {isRTL ? 'الجمهور المستهدف وقوالب الرسائل الجاهزة' : 'Audience Segments & Reusable Templates'}
            </p>
            <p>
              {isRTL
                ? 'قم بإنشاء شرائح عملاء مخصصة وقوالب نصوص لإعادة استخدامها بسرعة أثناء إطلاق الحملات المستقبلية.'
                : 'Define targeted audience rules and reusable message templates to streamline your campaign workflow.'}
            </p>
          </div>
          <SegmentsAndTemplates />
        </div>
      )}

      {/* 5. Campaign Deep Inspection & Delivery Logs Drawer */}
      <CampaignDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        campaign={selectedCampaign}
        businessId={businessId}
        token={getToken()}
        isRTL={isRTL}
        onCampaignUpdated={handleCampaignUpdated}
      />

      {/* 6. Guided Step-by-Step Creation Wizard */}
      <CreateCampaignWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        channels={channels}
        businessId={businessId}
        token={getToken()}
        isRTL={isRTL}
        onCampaignCreated={() => void fetchCampaigns()}
      />
    </main>
  )
}
