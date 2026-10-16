'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Play,
  Calendar,
  Clock,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Pause,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import Drawer from '../ui/Drawer'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import { UnifiedCampaign, CampaignLogItem, getStatusConfig } from './types'
import { getBusinessHeaders } from '../../lib/businessContext'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  campaign: UnifiedCampaign | null
  businessId: number | null
  token: string
  isRTL: boolean
  onCampaignUpdated: () => void
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CampaignDetailDrawer({
  isOpen,
  onClose,
  campaign,
  businessId,
  token,
  isRTL,
  onCampaignUpdated,
}: Props) {
  const [logs, setLogs] = useState<CampaignLogItem[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  // Confirmation modal states
  const [confirmLaunchOpen, setConfirmLaunchOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!campaign || !businessId || !token) return
    if (campaign.type === 'email') return // Email campaigns use /api/email-campaigns/{id}/stats
    setLoadingLogs(true)
    setLogsError(null)
    try {
      const res = await fetch(
        `${API}/api/businesses/${businessId}/campaigns/${campaign.id}/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
        }
      )
      if (!res.ok) throw new Error('Could not load campaign delivery logs.')
      const data = await res.json()
      const logRows = Array.isArray(data) ? data : data.data || []
      setLogs(logRows)
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Error loading logs')
    } finally {
      setLoadingLogs(false)
    }
  }, [campaign, businessId, token])

  useEffect(() => {
    if (isOpen && campaign) {
      void fetchLogs()
    } else {
      setLogs([])
    }
  }, [isOpen, campaign, fetchLogs])

  if (!campaign) return null

  const statusCfg = getStatusConfig(campaign.status)

  // Handlers
  const handleLaunch = async () => {
    if (!businessId || !token) return
    setActionBusy(true)
    try {
      const endpoint =
        campaign.type === 'email'
          ? `${API}/api/email-campaigns/${campaign.id}/send`
          : `${API}/api/businesses/${businessId}/campaigns/${campaign.id}/launch`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to launch campaign.')

      toast.success(isRTL ? 'تم بدء إرسال الحملة بنجاح' : 'Campaign launched successfully')
      setConfirmLaunchOpen(false)
      onCampaignUpdated()
      void fetchLogs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to launch')
    } finally {
      setActionBusy(false)
    }
  }

  const handleCancelSchedule = async () => {
    if (!businessId || !token) return
    setActionBusy(true)
    try {
      const endpoint =
        campaign.type === 'email'
          ? `${API}/api/email-campaigns/${campaign.id}/cancel-schedule`
          : `${API}/api/businesses/${businessId}/campaigns/${campaign.id}/cancel-schedule`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to cancel schedule.')

      toast.success(isRTL ? 'تم إلغاء الجدولة وإعادة الحملة كمسودة' : 'Schedule cancelled. Campaign reverted to draft.')
      setConfirmCancelOpen(false)
      onCampaignUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel schedule')
    } finally {
      setActionBusy(false)
    }
  }

  const handlePauseResume = async (isPause: boolean) => {
    if (!businessId || !token) return
    setActionBusy(true)
    try {
      const actionName = isPause ? 'pause' : 'resume'
      const endpoint =
        campaign.type === 'email'
          ? `${API}/api/email-campaigns/${campaign.id}/${actionName}`
          : `${API}/api/businesses/${businessId}/campaigns/${campaign.id}/${actionName}`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || `Failed to ${actionName} campaign.`)

      toast.success(
        isPause
          ? isRTL ? 'تم إيقاف الإرسال مؤقتاً' : 'Campaign paused'
          : isRTL ? 'تم استئناف إرسال الحملة' : 'Campaign resumed'
      )
      onCampaignUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!businessId || !token) return
    setActionBusy(true)
    try {
      const endpoint =
        campaign.type === 'email'
          ? `${API}/api/email-campaigns/${campaign.id}`
          : `${API}/api/businesses/${businessId}/campaigns/${campaign.id}`

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
      })
      if (!res.ok) throw new Error('Failed to delete campaign.')

      toast.success(isRTL ? 'تم حذف الحملة بنجاح' : 'Campaign deleted')
      setConfirmDeleteOpen(false)
      onClose()
      onCampaignUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="xl"
        title={
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span>{isRTL ? 'المراسلة' : 'Messaging'}</span>
              <ChevronRight size={12} className={isRTL ? 'rotate-180' : ''} />
              <span>{isRTL ? 'الحملات' : 'Campaigns'}</span>
              <ChevronRight size={12} className={isRTL ? 'rotate-180' : ''} />
              <span className="font-semibold text-text-secondary truncate max-w-[180px]">
                {campaign.name}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <h2 className="text-base font-bold text-text-primary tracking-tight truncate max-w-[320px]">
                {campaign.name}
              </h2>
              <Badge variant={statusCfg.variant} dot size="sm">
                {isRTL ? statusCfg.labelAr : statusCfg.label}
              </Badge>
            </div>
          </div>
        }
        description={isRTL ? statusCfg.descriptionAr : statusCfg.description}
        footer={
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={campaign.status === 'sending' || actionBusy}
              className="text-error hover:bg-error/10 hover:text-error"
              icon={<Trash2 size={13} />}
            >
              {isRTL ? 'حذف الحملة' : 'Delete'}
            </Button>

            <div className="flex items-center gap-2">
              {/* Scheduled Campaign Actions */}
              {campaign.status === 'scheduled' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={actionBusy}
                  >
                    {isRTL ? 'إلغاء الجدولة' : 'Cancel Schedule'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setConfirmLaunchOpen(true)}
                    disabled={actionBusy}
                    icon={<Play size={13} />}
                  >
                    {isRTL ? 'إرسال الآن فوراً' : 'Send Now'}
                  </Button>
                </>
              )}

              {/* Draft Campaign Action */}
              {campaign.status === 'draft' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmLaunchOpen(true)}
                  disabled={actionBusy}
                  icon={<Play size={13} />}
                >
                  {isRTL ? 'إطلاق الحملة الآن' : 'Launch Campaign'}
                </Button>
              )}

              {/* Sending / Paused Actions */}
              {campaign.status === 'sending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handlePauseResume(true)}
                  disabled={actionBusy}
                  icon={<Pause size={13} />}
                >
                  {isRTL ? 'إيقاف مؤقت' : 'Pause'}
                </Button>
              )}
              {campaign.status === 'paused' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handlePauseResume(false)}
                  disabled={actionBusy}
                  icon={<Play size={13} />}
                >
                  {isRTL ? 'استئناف الإرسال' : 'Resume'}
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={onClose}>
                {isRTL ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 p-4 text-xs">
          {/* Status Alert Banner if Error */}
          {campaign.error_message && (
            <div className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/5 p-3 text-error">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isRTL ? 'تنبيه خطأ في الحملة' : 'Campaign Execution Error'}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-error/90">{campaign.error_message}</p>
              </div>
            </div>
          )}

          {/* KPI Mini-cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-3">
              <span className="text-[11px] text-text-tertiary block">
                {isRTL ? 'إجمالي المستهدفين' : 'Audience Target'}
              </span>
              <span className="mt-1 text-lg font-bold tabular-nums text-text-primary block">
                {(campaign.total_recipients || 0).toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3">
              <span className="text-[11px] text-text-tertiary block">
                {isRTL ? 'تم الإرسال' : 'Sent'}
              </span>
              <span className="mt-1 text-lg font-bold tabular-nums text-text-primary block">
                {(campaign.sent_count || 0).toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3">
              <span className="text-[11px] text-text-tertiary block">
                {isRTL ? 'تم التسليم' : 'Delivered'}
              </span>
              <span className="mt-1 text-lg font-bold tabular-nums text-success block">
                {(campaign.delivered_count || 0).toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3">
              <span className="text-[11px] text-text-tertiary block">
                {isRTL ? 'فشل' : 'Failed'}
              </span>
              <span className="mt-1 text-lg font-bold tabular-nums text-error block">
                {(campaign.failed_count || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Campaign Configuration Metadata */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="font-semibold text-text-primary text-xs">
              {isRTL ? 'تفاصيل الإعداد والإرسال' : 'Channel & Execution Details'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-text-tertiary block text-[11px]">{isRTL ? 'قناة المراسلة' : 'Channel'}</span>
                <span className="font-medium text-text-primary capitalize">
                  {campaign.channel?.type || campaign.type}
                </span>
              </div>

              <div>
                <span className="text-text-tertiary block text-[11px]">{isRTL ? 'الحساب المتصل' : 'Sending Account'}</span>
                <span className="font-medium text-text-primary">
                  {campaign.channel?.page_name || '—'}
                </span>
              </div>

              <div>
                <span className="text-text-tertiary block text-[11px]">{isRTL ? 'تاريخ الإنشاء' : 'Created At'}</span>
                <span className="text-text-secondary">
                  {new Date(campaign.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-text-tertiary block text-[11px]">
                  {campaign.status === 'scheduled'
                    ? isRTL ? 'موعد الإطلاق المجدول' : 'Scheduled Launch'
                    : isRTL ? 'تاريخ الإرسال الفعلي' : 'Dispatched At'}
                </span>
                <span className="text-text-secondary font-medium">
                  {campaign.scheduled_at
                    ? new Date(campaign.scheduled_at).toLocaleString()
                    : campaign.sent_at
                    ? new Date(campaign.sent_at).toLocaleString()
                    : isRTL ? 'لم يُرسل بعد' : 'Not sent yet'}
                </span>
              </div>
            </div>

            {/* Audience filters summary */}
            {campaign.filters && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-text-tertiary block text-[11px] mb-1">
                  {isRTL ? 'معايير تصفية الجمهور' : 'Targeting Criteria'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {campaign.filters.tags && campaign.filters.tags.length > 0 && (
                    <span className="rounded-md bg-surface-elevated border border-border px-2 py-0.5 text-[10px] text-text-secondary">
                      {isRTL ? 'الوسوم: ' : 'Tags: '} {campaign.filters.tags.join(', ')}
                    </span>
                  )}
                  {campaign.filters.last_activity_days && (
                    <span className="rounded-md bg-surface-elevated border border-border px-2 py-0.5 text-[10px] text-text-secondary">
                      {isRTL ? 'نشط خلال آخر ' : 'Active in last '}
                      {campaign.filters.last_activity_days}
                      {isRTL ? ' يوم' : ' days'}
                    </span>
                  )}
                  {!campaign.filters.tags?.length && !campaign.filters.last_activity_days && (
                    <span className="text-[11px] text-text-tertiary italic">
                      {isRTL ? 'جميع العملاء المتطابقين مع الحساب' : 'All eligible contacts for this channel'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Broadcast Content Preview */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary text-xs">
                {isRTL ? 'نص الرسالة المرسلة' : 'Broadcast Message Content'}
              </h3>
              <span className="text-[10px] text-text-tertiary">
                {isRTL ? 'معاينة النص كما يظهر للمستلم' : 'Preview as seen by recipient'}
              </span>
            </div>

            {campaign.subject && (
              <div className="rounded-lg bg-surface-elevated px-3 py-2 border border-border text-xs">
                <span className="font-semibold text-text-primary">{isRTL ? 'عنوان الرسالة: ' : 'Subject: '}</span>
                <span className="text-text-secondary">{campaign.subject}</span>
              </div>
            )}

            <div className="rounded-xl bg-background border border-border/80 p-3.5 text-xs text-text-secondary whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {campaign.message || campaign.content || (
                <span className="text-text-tertiary italic">{isRTL ? 'لا يوجد نص محدد' : 'No message body'}</span>
              )}
            </div>

            <p className="text-[10px] text-text-tertiary">
              {isRTL
                ? 'ملاحظة: المتغيرات مثل {{name}} أو {{customer_name}} تستبدل تلقائياً باسم كل مستلم عند الإرسال.'
                : 'Note: Variables like {{name}} or {{customer_name}} are automatically personalized for each recipient at send time.'}
            </p>
          </div>

          {/* Recipient Logs Section */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary text-xs">
                  {isRTL ? 'سجلات الإرسال لكل مستلم' : 'Recipient Delivery Logs'}
                </h3>
                <p className="text-[11px] text-text-tertiary">
                  {isRTL ? 'تتبع حالة وصول الرسالة لكل عميل وأسباب الفشل إن وجدت' : 'Track individual recipient statuses and provider failure codes'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => void fetchLogs()}
                disabled={loadingLogs}
                icon={<RefreshCw size={11} className={loadingLogs ? 'animate-spin' : ''} />}
              >
                {isRTL ? 'تحديث السجلات' : 'Refresh'}
              </Button>
            </div>

            {loadingLogs ? (
              <div className="flex items-center justify-center py-8 text-text-tertiary">
                <RefreshCw size={16} className="animate-spin mr-2" />
                <span>{isRTL ? 'جاري تحميل السجلات...' : 'Loading delivery logs...'}</span>
              </div>
            ) : logsError ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                {logsError}
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-text-tertiary text-xs">
                {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                  <p>
                    {isRTL
                      ? 'لا توجد سجلات بعد. سيتم تسجيل كل مستلم فور إطلاق الحملة وبدء الإرسال.'
                      : 'No logs yet. Recipient records will appear here once the campaign begins sending.'}
                  </p>
                ) : (
                  <p>{isRTL ? 'لا توجد سجلات مستلمين مسجلة لهذه الحملة.' : 'No recipient records found for this campaign.'}</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-start text-xs">
                  <thead className="bg-surface-elevated border-b border-border text-[11px] text-text-secondary">
                    <tr>
                      <th className="px-3 py-2 text-start">{isRTL ? 'المستلم' : 'Recipient'}</th>
                      <th className="px-3 py-2 text-start">{isRTL ? 'الحالة' : 'Status'}</th>
                      <th className="px-3 py-2 text-start">{isRTL ? 'التاريخ والوقت' : 'Timestamp'}</th>
                      <th className="px-3 py-2 text-start">{isRTL ? 'النتيجة / سبب الفشل' : 'Result / Failure Reason'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {logs.map((log) => {
                      const isSuccess = log.status === 'sent'
                      const isFailed = log.status === 'failed'
                      return (
                        <tr key={log.id} className="hover:bg-surface-elevated/40 transition">
                          <td className="px-3 py-2 font-medium text-text-primary">
                            {log.conversation?.sender_name || (
                              <span className="font-mono text-text-tertiary text-[10px]">
                                Conv #{log.conversation_id}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isSuccess
                                  ? 'bg-success/10 text-success'
                                  : isFailed
                                  ? 'bg-error/10 text-error'
                                  : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {isSuccess && <CheckCircle2 size={10} />}
                              {isFailed && <AlertCircle size={10} />}
                              {log.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-text-tertiary text-[11px]">
                            {log.sent_at
                              ? new Date(log.sent_at).toLocaleTimeString()
                              : new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-3 py-2 text-text-secondary text-[11px] max-w-[200px] truncate">
                            {log.error_message ? (
                              <span className="text-error font-medium" title={log.error_message}>
                                {log.error_message}
                              </span>
                            ) : log.provider_message_id ? (
                              <span className="font-mono text-[10px] text-text-tertiary">
                                {log.provider_message_id}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Confirmation Modal: Launch Campaign */}
      <Modal
        isOpen={confirmLaunchOpen}
        onClose={() => setConfirmLaunchOpen(false)}
        title={isRTL ? 'تأكيد إطلاق الحملة الآن' : 'Launch Campaign Confirmation'}
        size="md"
      >
        <div className="space-y-4 p-5 text-xs">
          <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-3.5 text-text-primary">
            <Send size={18} className="text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {isRTL
                  ? `هل أنت متأكد من إرسال حملة "${campaign.name}" الآن؟`
                  : `Are you sure you want to send "${campaign.name}" now?`}
              </p>
              <p className="mt-1 text-text-secondary leading-relaxed">
                {isRTL
                  ? 'سيبدأ النظام بمعالجة وإرسال الرسائل إلى الجمهور المستهدف عبر الحساب المتصل. الرسائل التي تُرسل لا يمكن التراجع عنها.'
                  : 'The system will immediately begin queuing and dispatching messages to eligible recipients. Messages already sent cannot be recalled.'}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-surface-elevated p-3 text-text-secondary space-y-1">
            <p>
              <strong>{isRTL ? 'الحساب المرسل: ' : 'Sending Account: '}</strong>
              {campaign.channel?.page_name || 'Connected channel'}
            </p>
            <p>
              <strong>{isRTL ? 'المستهدفون: ' : 'Target audience: '}</strong>
              {(campaign.total_recipients || 0).toLocaleString()} {isRTL ? 'مستلم' : 'recipients'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setConfirmLaunchOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionBusy}
              onClick={() => void handleLaunch()}
              icon={<Play size={13} />}
            >
              {isRTL ? 'تأكيد الإرسال الفوري' : 'Confirm & Launch Now'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Cancel Schedule */}
      <Modal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title={isRTL ? 'إلغاء جدولة الحملة' : 'Cancel Campaign Schedule'}
        size="md"
      >
        <div className="space-y-4 p-5 text-xs">
          <p className="text-text-secondary leading-relaxed">
            {isRTL
              ? 'هل ترغب بإلغاء موعد الجدولة الحالي؟ سيتم إعادة الحملة إلى حالة "مسودة" ولن تُرسل في الموعد المجدول حتى تقوم بجدولتها أو إطلاقها مجدداً.'
              : 'Cancel scheduled launch time? The campaign will revert to "Draft" and will not send until you schedule or launch it again.'}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancelOpen(false)}>
              {isRTL ? 'تراجع' : 'Keep Scheduled'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={actionBusy}
              onClick={() => void handleCancelSchedule()}
            >
              {isRTL ? 'تأكيد إلغاء الجدولة' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Delete */}
      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={isRTL ? 'تأكيد حذف الحملة' : 'Delete Campaign'}
        size="sm"
      >
        <div className="space-y-4 p-5 text-xs">
          <div className="flex items-start gap-2.5 text-error">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isRTL
                ? 'سيتم حذف الحملة وجميع سجلات الإرسال المرتبطة بها نهائياً. لا يمكن التراجع عن هذا الإجراء.'
                : 'This will permanently delete this campaign and all associated recipient delivery logs. This action cannot be undone.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionBusy}
              className="bg-error text-white hover:bg-error/90"
              onClick={() => void handleDelete()}
            >
              {isRTL ? 'نعم، حذف نهائياً' : 'Yes, Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
