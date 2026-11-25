'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Drawer from '../ui/Drawer'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Switch from '../ui/Switch'
import ChannelIcon from '../ui/ChannelIcon'
import {
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Trash2,
  Sparkles,
  Bot,
  Store,
  Layers,
  Clock,
  Radio,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { ChannelInstance } from './ChannelCard'
import { confirmInPage } from '../../lib/dialogService'

export interface ChannelAccountDrawerProps {
  isOpen: boolean
  onClose: () => void
  instance: ChannelInstance | null
  isRTL?: boolean
  onDisconnect: (id: number) => Promise<void>
  onSync?: (instance: ChannelInstance) => Promise<void>
  onToggleOrderSubmission?: (id: number, enabled: boolean) => Promise<void>
  isSavingOrderSubmission?: boolean
}

export default function ChannelAccountDrawer({
  isOpen,
  onClose,
  instance,
  isRTL = false,
  onDisconnect,
  onSync,
  onToggleOrderSubmission,
  isSavingOrderSubmission = false,
}: ChannelAccountDrawerProps) {
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  if (!instance) return null

  const isEcommerce = ['salla', 'shopify', 'woocommerce'].includes(instance.type || '')
  const isAiActive = instance.effective_ai_enabled ?? instance.ai_enabled

  const handleDisconnect = async () => {
    if (!await confirmInPage({ title: isRTL ? 'فصل القناة' : 'Disconnect channel', message: isRTL ? 'ستتوقف الردود الآلية والمزامنة لهذا الحساب.' : 'Automated replies and sync will stop for this account.', confirmLabel: isRTL ? 'فصل' : 'Disconnect', cancelLabel: isRTL ? 'إلغاء' : 'Cancel', destructive: true })) {
      return
    }
    setDisconnecting(true)
    try {
      await onDisconnect(instance.id)
      onClose()
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSync = async () => {
    if (!onSync) return
    setSyncing(true)
    try {
      await onSync(instance)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position={isRTL ? 'left' : 'right'}
      width="md"
      title={
        <div className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface shadow-xs">
            <ChannelIcon type={instance.type as any} size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-text-primary truncate">
              {instance.page_name || instance.integration?.store_url || instance.page_id || `Channel #${instance.id}`}
            </h3>
            <span className="text-xs font-medium text-text-tertiary capitalize">
              {instance.type} • ID: {instance.id}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50"
            icon={<Trash2 size={13} />}
          >
            {disconnecting
              ? isRTL ? 'جارٍ الفصل...' : 'Disconnecting…'
              : isRTL ? 'فصل هذا الحساب' : 'Disconnect Account'}
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            {isRTL ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-start p-1" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Status Callout if error / warning */}
        {instance.status_message && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4 text-xs text-amber-300 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">{isRTL ? 'تنبيه الاتصال' : 'Connection Warning'}</span>
              <span>{instance.status_message}</span>
            </div>
          </div>
        )}

        {/* ── Status Grid ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {isRTL ? 'تفاصيل الاتصال' : 'Connection Overview'}
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-surface-elevated/70 p-3 border border-border/60">
              <span className="text-text-tertiary block text-[10px] uppercase font-bold">
                {isRTL ? 'حالة القناة' : 'Platform Status'}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-text-primary capitalize">
                  {instance.status || (isRTL ? 'متصل' : 'Connected')}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-elevated/70 p-3 border border-border/60">
              <span className="text-text-tertiary block text-[10px] uppercase font-bold">
                {isRTL ? 'الرد الذكي' : 'AI Automation'}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isAiActive ? 'bg-brand' : 'bg-text-disabled'}`} />
                <span className="font-bold text-text-primary">
                  {isEcommerce
                    ? isRTL ? 'بيانات متجر' : 'Store Sync'
                    : isAiActive
                    ? isRTL ? 'مفعّل ونشط' : 'Active'
                    : isRTL ? 'يلزم تعيين وكيل' : 'No bot assigned'}
                </span>
              </div>
            </div>
          </div>

          <dl className="divide-y divide-border/50 text-xs pt-1">
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-text-secondary">{isRTL ? 'معرّف الحساب / الصفحة' : 'Account / Page ID'}</dt>
              <dd className="font-mono text-text-primary text-[11px] truncate max-w-[200px]">
                {instance.page_id || instance.id}
              </dd>
            </div>

            {instance.comment_webhook_status && (
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-text-secondary">{isRTL ? 'خطاف التعليقات' : 'Comments Webhook'}</dt>
                <dd className="font-medium text-text-primary capitalize flex items-center gap-1">
                  <span>{instance.comment_webhook_status}</span>
                  {instance.comment_webhook_error_code && (
                    <span className="text-amber-400 font-mono">({instance.comment_webhook_error_code})</span>
                  )}
                </dd>
              </div>
            )}

            {instance.integration?.store_url && (
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-text-secondary">{isRTL ? 'رابط المتجر' : 'Store URL'}</dt>
                <dd className="font-medium text-brand truncate max-w-[200px]">
                  {instance.integration.store_url}
                </dd>
              </div>
            )}

            {instance.integration?.last_synced_at && (
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-text-secondary">{isRTL ? 'آخر مزامنة ناجحة' : 'Last Synced'}</dt>
                <dd className="text-text-tertiary">
                  {new Date(instance.integration.last_synced_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* ── E-Commerce Synchronization Card ────────────────────── */}
        {isEcommerce && instance.integration && (
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-brand" />
                <h4 className="text-xs font-bold text-text-primary">
                  {isRTL ? 'مزامنة بيانات المتجر' : 'Store Data Sync'}
                </h4>
              </div>
              {onSync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing || instance.integration.sync_status === 'syncing'}
                  icon={<RotateCw size={12} className={syncing ? 'animate-spin text-brand' : ''} />}
                >
                  {syncing ? (isRTL ? 'جارٍ البدء...' : 'Queueing…') : isRTL ? 'مزامنة الآن' : 'Sync Now'}
                </Button>
              )}
            </div>

            {/* Sync record counts if available */}
            {instance.integration.sync_counts && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border/60 bg-surface-elevated/70 p-2.5">
                  <span className="text-[10px] text-text-tertiary block font-semibold">{isRTL ? 'المنتجات' : 'Products'}</span>
                  <span className="text-sm font-extrabold text-text-primary tabular-nums">
                    {instance.integration.sync_counts.products ?? 0}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-elevated/70 p-2.5">
                  <span className="text-[10px] text-text-tertiary block font-semibold">{isRTL ? 'الطلبات' : 'Orders'}</span>
                  <span className="text-sm font-extrabold text-text-primary tabular-nums">
                    {instance.integration.sync_counts.orders ?? 0}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-elevated/70 p-2.5">
                  <span className="text-[10px] text-text-tertiary block font-semibold">{isRTL ? 'العملاء' : 'Customers'}</span>
                  <span className="text-sm font-extrabold text-text-primary tabular-nums">
                    {instance.integration.sync_counts.customers ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bot & Automation Management ────────────────────────── */}
        {!isEcommerce && (
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-brand" />
              <h4 className="text-xs font-bold text-text-primary">
                {isRTL ? 'الوكيل الآلي المعيّن' : 'Assigned Bot & AI Behavior'}
              </h4>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {instance.effective_ai_enabled
                ? isRTL
                  ? 'تم تعيين وكيل ذكي نشط لهذه القناة. يتم الرد تلقائياً على استفسارات العملاء بناءً على التعليمات وقاعدة المعرفة.'
                  : 'An active AI agent is assigned to this channel. Inbound customer queries are answered automatically.'
                : isRTL
                ? 'لا يوجد وكيل ذكي نشط مرتبط بهذه القناة حالياً. لتفعيل الردود التلقائية، قم بتعيين وكيل من صفحة الوكلاء.'
                : 'No active bot is currently assigned. To enable automatic replies, link an agent from the Bots studio.'}
            </p>

            <Link
              href="/dashboard/bots"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline pt-1"
            >
              <span>{isRTL ? 'فتح صفحة إدارة الوكلاء' : 'Manage Bots & Assignments'}</span>
              <ExternalLink size={12} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </div>
        )}

        {/* ── Automatic Order Confirmation Toggle ──────────────────── */}
        {!isEcommerce && onToggleOrderSubmission && (
          <div className="rounded-2xl border border-warning/25 bg-warning/[0.04] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-text-primary">
                  {isRTL ? 'إرسال الطلبات تلقائياً للمتجر' : 'Automatic Order Submission'}
                </h4>
                <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                  {isRTL
                    ? 'عندما يؤكد العميل رغبته في إتمام الشراء، يقوم الوكيل الذكي بإنشاء وإرسال الطلب تلقائياً لمتجرك المربوط.'
                    : 'When a customer explicitly confirms an order, the AI automatically creates and submits it to your connected store.'}
                </p>
              </div>
              <Switch
                checked={Boolean((instance as any).effective_auto_order_confirmation_enabled)}
                onChange={(enabled) => onToggleOrderSubmission(instance.id, enabled)}
                disabled={isSavingOrderSubmission}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
