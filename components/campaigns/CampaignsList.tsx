'use client'

import React, { useState, useMemo } from 'react'
import {
  Megaphone,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Calendar,
  Users,
  Play,
  XCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react'
import { Card } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Select from '../ui/Select'
import EmptyState from '../ui/EmptyState'
import { MetricCardSkeleton } from '../ui/Skeleton'
import { UnifiedCampaign, CampaignStatus, getStatusConfig } from './types'

interface Props {
  campaigns: UnifiedCampaign[]
  onSelectCampaign: (c: UnifiedCampaign) => void
  onNewCampaign: () => void
  loading: boolean
  loadError: string | null
  onRetry: () => void
  isRTL: boolean
}

export default function CampaignsList({
  campaigns,
  onSelectCampaign,
  onNewCampaign,
  loading,
  loadError,
  onRetry,
  isRTL,
}: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Real KPIs calculated directly from live data
  const stats = useMemo(() => {
    const total = campaigns.length
    const scheduled = campaigns.filter((c) => c.status === 'scheduled').length
    const sending = campaigns.filter((c) => c.status === 'sending').length
    const completed = campaigns.filter((c) => c.status === 'sent' || c.status === 'partially_sent').length
    const totalSentMessages = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)
    return { total, scheduled, sending, completed, totalSentMessages }
  }, [campaigns])

  // Filtered campaigns
  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      // Search
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.message && c.message.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.channel?.page_name && c.channel.page_name.toLowerCase().includes(q))

      // Status
      let matchesStatus = true
      if (statusFilter === 'draft') matchesStatus = c.status === 'draft'
      else if (statusFilter === 'scheduled') matchesStatus = c.status === 'scheduled'
      else if (statusFilter === 'sending') matchesStatus = c.status === 'sending'
      else if (statusFilter === 'completed') matchesStatus = c.status === 'sent' || c.status === 'partially_sent'
      else if (statusFilter === 'failed') matchesStatus = c.status === 'failed' || c.status === 'partially_failed'

      // Channel
      let matchesChannel = true
      if (channelFilter !== 'all') {
        matchesChannel = c.channel?.type === channelFilter || (c.type === 'email' && channelFilter === 'email')
      }

      return matchesSearch && matchesStatus && matchesChannel
    })
  }, [campaigns, search, statusFilter, channelFilter])

  // Status tab definitions
  const statusTabs = [
    { id: 'all', label: isRTL ? 'جميع الحملات' : 'All Campaigns', count: campaigns.length },
    { id: 'draft', label: isRTL ? 'المسودات' : 'Drafts', count: campaigns.filter((c) => c.status === 'draft').length },
    { id: 'scheduled', label: isRTL ? 'المجدولة' : 'Scheduled', count: campaigns.filter((c) => c.status === 'scheduled').length },
    { id: 'sending', label: isRTL ? 'قيد الإرسال' : 'Sending', count: campaigns.filter((c) => c.status === 'sending').length },
    { id: 'completed', label: isRTL ? 'المكتملة' : 'Completed', count: campaigns.filter((c) => c.status === 'sent' || c.status === 'partially_sent').length },
    { id: 'failed', label: isRTL ? 'تعثر الإرسال' : 'Failed', count: campaigns.filter((c) => c.status === 'failed' || c.status === 'partially_failed').length },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-xs">
      {/* Error Banner with Retry */}
      {loadError && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-error/30 bg-error/5 p-4 text-error">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-medium">{loadError}</span>
          </div>
          <Button variant="outline" size="xs" onClick={onRetry}>
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Real KPI Metrics Strip (NO hardcoded fake percentages) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">{isRTL ? 'إجمالي الحملات' : 'Total Campaigns'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-elevated text-text-secondary">
              <Megaphone size={14} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-text-primary">{stats.total}</p>
          <span className="text-[10px] text-text-tertiary block mt-0.5">
            {stats.completed} {isRTL ? 'حملة تم إرسالها' : 'dispatched'}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">{isRTL ? 'حملات مجدولة' : 'Scheduled Waves'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Clock size={14} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-text-primary">{stats.scheduled}</p>
          <span className="text-[10px] text-text-tertiary block mt-0.5">
            {isRTL ? 'بانتظار وقت الإطلاق' : 'Waiting for launch time'}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">{isRTL ? 'قيد المعالجة الآن' : 'In-Flight Sending'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Send size={14} className={stats.sending > 0 ? 'animate-pulse' : ''} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-brand">{stats.sending}</p>
          <span className="text-[10px] text-text-tertiary block mt-0.5">
            {isRTL ? 'معالجة الرسائل جارية' : 'Active background dispatch'}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">{isRTL ? 'إجمالي الرسائل المرسلة' : 'Messages Sent'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-text-primary">
            {stats.totalSentMessages.toLocaleString()}
          </p>
          <span className="text-[10px] text-text-tertiary block mt-0.5">
            {isRTL ? 'رسالة عبر جميع الحملات' : 'Recorded across campaigns'}
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-brand bg-brand text-white shadow-xs'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-tertiary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Channel Filter */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:shrink-0">
          <div className="relative w-full sm:w-60">
            <Search
              size={13}
              className={`absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                isRTL ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              aria-label={isRTL ? 'البحث في الحملات' : 'Search campaigns'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم أو المحتوى...' : 'Search campaigns...'}
              className={`h-9 w-full rounded-xl border border-border bg-surface text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none transition ${
                isRTL ? 'pr-8 pl-8' : 'pl-8 pr-8'
              }`}
            />
            {search && <button type="button" onClick={() => setSearch('')} aria-label={isRTL ? 'مسح البحث' : 'Clear search'} className={`absolute top-1/2 -translate-y-1/2 rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary ${isRTL ? 'left-2' : 'right-2'}`}><X size={13} /></button>}
          </div>

          <Select
            dir={isRTL ? 'rtl' : 'ltr'}
            ariaLabel={isRTL ? 'تصفية حسب القناة' : 'Filter by channel'}
            value={channelFilter}
            onValueChange={setChannelFilter}
            className="w-full sm:w-48"
            options={[
              { value: 'all', label: isRTL ? 'جميع القنوات' : 'All channels' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'facebook', label: 'Facebook Messenger' },
              { value: 'telegram', label: 'Telegram' },
              { value: 'email', label: 'Email' },
            ]}
          />
        </div>
      </div>

      {/* Campaign Cards / Table View */}
      {filtered.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={Megaphone}
            title={
              search || statusFilter !== 'all' || channelFilter !== 'all'
                ? isRTL ? 'لا توجد نتائج مطابقة' : 'No matching campaigns found'
                : isRTL ? 'لا توجد حملات منشأة بعد' : 'No broadcast campaigns yet'
            }
            description={
              search || statusFilter !== 'all' || channelFilter !== 'all'
                ? isRTL ? 'جرب تغيير شروط البحث أو إعادة تعيين الفلاتر.' : 'Try adjusting your search query or status filter.'
                : isRTL
                ? 'أنشئ حملتك الإعلانية الأولى وأرسل رسائل موجهة لعملائك عبر واتساب وقنوات التواصل.'
                : 'Create your first broadcast campaign to send targeted announcements and promotions.'
            }
            primaryAction={
              search || statusFilter !== 'all' || channelFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setChannelFilter('all')
                  }}
                >
                  {isRTL ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={onNewCampaign}
                >
                  {isRTL ? 'إنشاء أول حملة' : 'Create First Campaign'}
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((camp) => {
            const statusCfg = getStatusConfig(camp.status)
            const isSending = camp.status === 'sending'

            return (
              <Card
                key={`${camp.type}-${camp.id}`}
                variant="interactive"
                onClick={() => onSelectCampaign(camp)}
                className="p-4 cursor-pointer hover:border-brand/50 transition-all duration-200"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Column: Title, Badges, Message snippet */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-text-primary tracking-tight truncate max-w-sm">
                        {camp.name}
                      </span>

                      <Badge variant={statusCfg.variant} dot size="sm">
                        {isRTL ? statusCfg.labelAr : statusCfg.label}
                      </Badge>

                      <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                        {camp.channel?.type || camp.type}
                      </Badge>

                      {camp.channel?.page_name && (
                        <span className="text-[11px] text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded-md border border-border">
                          {camp.channel.page_name}
                        </span>
                      )}
                    </div>

                    {/* Message Preview Snippet */}
                    <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
                      {camp.message || camp.subject || camp.content || '—'}
                    </p>

                    {/* Sending Progress Indicator */}
                    {isSending && (
                      <div className="flex items-center gap-2 text-[11px] text-brand font-medium pt-0.5">
                        <RefreshCw size={11} className="animate-spin" />
                        <span>{isRTL ? 'جاري الإرسال والمعالجة في الخلفية...' : 'Dispatch in progress...'}</span>
                      </div>
                    )}

                    {/* Meta Counters */}
                    <div className="flex items-center gap-4 text-xs text-text-tertiary pt-0.5 flex-wrap">
                      <span>
                        {isRTL ? 'الجمهور: ' : 'Audience: '}
                        <strong className="text-text-primary">
                          {(camp.total_recipients || 0).toLocaleString()}
                        </strong>
                      </span>

                      {camp.sent_count !== null && (
                        <span>
                          {isRTL ? 'أُرسل: ' : 'Sent: '}
                          <strong className="text-text-primary">
                            {(camp.sent_count || 0).toLocaleString()}
                          </strong>
                        </span>
                      )}

                      {camp.delivered_count !== null && camp.delivered_count > 0 && (
                        <span>
                          {isRTL ? 'تم التسليم: ' : 'Delivered: '}
                          <strong className="text-success">
                            {camp.delivered_count.toLocaleString()}
                          </strong>
                        </span>
                      )}

                      {camp.failed_count !== null && camp.failed_count > 0 && (
                        <span>
                          {isRTL ? 'فشل: ' : 'Failed: '}
                          <strong className="text-error">
                            {camp.failed_count.toLocaleString()}
                          </strong>
                        </span>
                      )}

                      <span className="text-text-tertiary">
                        {camp.scheduled_at ? (
                          <>
                            {isRTL ? 'مجدول لـ: ' : 'Scheduled for: '}
                            {new Date(camp.scheduled_at).toLocaleDateString()}
                          </>
                        ) : (
                          <>
                            {isRTL ? 'أنشئت: ' : 'Created: '}
                            {new Date(camp.created_at).toLocaleDateString()}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Click indicator */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:underline">
                      <span>{isRTL ? 'عرض التفاصيل والسجلات' : 'Inspect Details & Logs'}</span>
                      <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
