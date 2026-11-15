'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  SlidersHorizontal,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Bot,
  Store,
} from 'lucide-react'
import ChannelIcon from '../ui/ChannelIcon'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { ChannelInstance, ChannelDef } from './ChannelCard'

export interface ChannelCardModernProps {
  channel: ChannelDef
  instances: ChannelInstance[]
  isRTL?: boolean
  onConnect: () => void
  onDisconnect: (instanceId: number) => void
  onSync?: (instance: ChannelInstance) => void
  onManageAccount?: (instance: ChannelInstance) => void
  syncingInstanceId?: number | null
}

function formatRelativeTime(dateString?: string | null, isRTL: boolean = false): string {
  if (!dateString) return isRTL ? 'لم تتم المزامنة بعد' : 'Never synced'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return isRTL ? 'الآن' : 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return isRTL ? `منذ ${diffMin} د` : `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateString
  }
}

export default function ChannelCardModern({
  channel,
  instances,
  isRTL = false,
  onConnect,
  onDisconnect,
  onSync,
  onManageAccount,
  syncingInstanceId = null,
}: ChannelCardModernProps) {
  const [expanded, setExpanded] = useState(false)
  const isConnected = instances.length > 0
  const isEcommerce = channel.category === 'ecommerce'

  const localizedChannel = isRTL
    ? {
        instagram: ['إنستغرام', 'محادثات DMs والرد التلقائي على التعليقات لحسابات الأعمال.'],
        whatsapp: ['واتساب للأعمال', 'ربط رسمي عبر Cloud API أو اتصالات مخصصة لخدمة العملاء والمبيعات.'],
        facebook: ['فيسبوك ماسنجر', 'محادثات ماسنجر والردود التلقائية لصفحات النشاط التجاري.'],
        gmail: ['Gmail وGoogle Workspace', 'مزامنة صناديق البريد والردود الذكية وتتبع رسائل الدعم.'],
        salla: ['متجر سلة', 'مزامنة الكتالوج، المخزون، وتفاصيل الطلبات في محادثات الذكاء الاصطناعي.'],
        telegram: ['تيليجرام', 'محادثات الدعم الفوري والمبيعات عبر بوت تيليجرام موثق.'],
        shopify: ['شوبيفاي', 'مزامنة فورية للكتالوج والعملاء وسجلات الطلبات.'],
        woocommerce: ['WooCommerce', 'ربط سحابي مشفر لمزامنة المنتجات وتفاصيل الطلبات.'],
      }[channel.id]
    : null

  const channelName = localizedChannel?.[0] || channel.name
  const channelDescription = localizedChannel?.[1] || channel.description

  // Check health and status across all instances
  const instancesWithWarnings = instances.filter(
    (i) =>
      i.status === 'warning' ||
      i.status === 'error' ||
      i.comment_webhook_status === 'error' ||
      Boolean(i.integration?.sync_error) ||
      i.integration?.sync_status === 'failed'
  )
  const hasIssues = instancesWithWarnings.length > 0

  // Category badge
  const categoryLabels: Record<string, { en: string; ar: string }> = {
    messaging: { en: 'Messaging', ar: 'مراسلة فورية' },
    social: { en: 'Social', ar: 'تواصل اجتماعي' },
    ecommerce: { en: 'E-Commerce', ar: 'تجارة إلكترونية' },
    email: { en: 'Email', ar: 'بريد إلكتروني' },
  }

  const categoryMeta = categoryLabels[channel.category] || { en: channel.category, ar: channel.category }

  const displayedInstances = expanded ? instances : instances.slice(0, 3)
  const remainingCount = instances.length - 3

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        hasIssues
          ? 'border-amber-500/40 bg-surface-card hover:border-amber-500/70'
          : isConnected
          ? 'border-border-strong/70 bg-surface-card hover:border-brand/40'
          : 'border-border/60 bg-surface/60 hover:border-border hover:bg-surface-card/80'
      }`}
    >
      {/* Top Card Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: Platform Icon + Titles + Connection Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-surface shadow-xs transition-transform group-hover:scale-105">
              <ChannelIcon type={channel.id as any} size={28} />
              {/* Micro Status Dot */}
              <span
                className={`absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-card ${
                  hasIssues
                    ? 'bg-amber-400'
                    : isConnected
                    ? 'bg-emerald-500'
                    : 'bg-text-disabled'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  {channelName}
                </h3>
              </div>
              <span className="text-[11px] font-medium text-text-tertiary">
                {isRTL ? categoryMeta.ar : categoryMeta.en}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {hasIssues ? (
            <Badge variant="warning" size="sm" dot>
              {isRTL ? 'تنبيه' : 'Attention'}
            </Badge>
          ) : isConnected ? (
            <Badge variant="success" size="sm" dot>
              {isRTL
                ? `${instances.length} ${instances.length === 1 ? 'حساب متصل' : 'حسابات'}`
                : `${instances.length} ${instances.length === 1 ? 'account' : 'accounts'}`}
            </Badge>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border/70 bg-surface/70 px-2.5 py-0.5 text-[11px] font-semibold text-text-tertiary">
              {isRTL ? 'غير متصل' : 'Not connected'}
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {channelDescription}
        </p>

        {/* ── Connected Accounts Compact List ──────────────────────── */}
        {isConnected && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-tertiary">
              <span>{isRTL ? 'الحسابات النشطة' : 'Connected Accounts'}</span>
              <span className="tabular-nums font-mono">
                {instances.length} {isRTL ? 'إجمالي' : 'total'}
              </span>
            </div>

            <div className="space-y-2">
              {displayedInstances.map((inst) => {
                const isSyncing =
                  syncingInstanceId === inst.id ||
                  inst.integration?.sync_status === 'syncing' ||
                  inst.integration?.sync_status === 'queued'
                const instHasIssue =
                  inst.status === 'warning' ||
                  inst.status === 'error' ||
                  inst.comment_webhook_status === 'error' ||
                  Boolean(inst.integration?.sync_error) ||
                  inst.integration?.sync_status === 'failed'

                const isAiActive = inst.effective_ai_enabled ?? inst.ai_enabled

                return (
                  <div
                    key={inst.id}
                    className={`group/item flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                      instHasIssue
                        ? 'border-amber-500/30 bg-amber-500/[0.04]'
                        : 'border-border/60 bg-surface/80 hover:border-brand/30 hover:bg-surface-elevated'
                    }`}
                  >
                    {/* Account Identifiers */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {inst.page_name || inst.integration?.store_url || inst.page_id || `ID #${inst.id}`}
                        </span>
                        {isAiActive && !isEcommerce && (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-brand/10 border border-brand/20 px-1.5 py-0.2 text-[9px] font-bold text-brand shrink-0"
                            title={isRTL ? 'الوكيل الذكي نشط' : 'AI Automation Active'}
                          >
                            <Sparkles size={9} />
                            <span>AI</span>
                          </span>
                        )}
                      </div>

                      {/* Sub-label: ID or sync info */}
                      <div className="flex items-center gap-2 text-[10px] text-text-tertiary mt-0.5">
                        {inst.page_id && (
                          <span className="font-mono truncate max-w-[120px]">
                            {inst.page_id}
                          </span>
                        )}
                        {isEcommerce && inst.integration?.last_synced_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatRelativeTime(inst.integration.last_synced_at, isRTL)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Compact Actions per Account */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isEcommerce && onSync && (
                        <button
                          type="button"
                          onClick={() => onSync(inst)}
                          disabled={isSyncing}
                          className="flex h-7 items-center gap-1 rounded-lg border border-border/80 bg-surface px-2 text-[11px] font-semibold text-text-secondary hover:border-brand/40 hover:text-brand transition-colors disabled:opacity-50"
                          title={isRTL ? 'مزامنة بيانات المتجر' : 'Sync store data'}
                        >
                          <RotateCw size={11} className={isSyncing ? 'animate-spin text-brand' : ''} />
                          <span className="hidden sm:inline">
                            {isSyncing ? (isRTL ? 'جارٍ...' : 'Syncing…') : isRTL ? 'مزامنة' : 'Sync'}
                          </span>
                        </button>
                      )}

                      {onManageAccount && (
                        <button
                          type="button"
                          onClick={() => onManageAccount(inst)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-surface text-text-tertiary hover:border-border hover:text-text-primary hover:bg-surface-elevated transition-colors"
                          title={isRTL ? 'إعدادات الحساب' : 'Account settings'}
                          aria-label={isRTL ? 'إعدادات الحساب' : 'Account settings'}
                        >
                          <SlidersHorizontal size={12} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDisconnect(inst.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-rose-500/10 hover:text-rose-400 transition-colors opacity-70 hover:opacity-100"
                        title={isRTL ? 'فصل الحساب' : 'Disconnect'}
                        aria-label={isRTL ? 'فصل الحساب' : 'Disconnect account'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Show remaining count toggle if > 3 */}
              {!expanded && remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="w-full py-1.5 text-center text-[11px] font-semibold text-brand hover:underline flex items-center justify-center gap-1"
                >
                  <span>
                    {isRTL
                      ? `+${remainingCount} حسابات إضافية أخرى`
                      : `+${remainingCount} more accounts`}
                  </span>
                  <ChevronDown size={13} />
                </button>
              )}

              {expanded && remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="w-full py-1.5 text-center text-[11px] font-semibold text-text-tertiary hover:text-text-secondary flex items-center justify-center gap-1"
                >
                  <span>{isRTL ? 'إخفاء الحسابات' : 'Collapse list'}</span>
                  <ChevronUp size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex items-center justify-between border-t border-border/60 bg-surface/40 px-5 py-3">
        {isConnected ? (
          <>
            <button
              type="button"
              onClick={onConnect}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
            >
              <Plus size={14} />
              <span>{isRTL ? 'إضافة حساب آخر' : 'Add another account'}</span>
            </button>

            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{isRTL ? 'متصل وجاهز' : 'Operational'}</span>
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] text-text-tertiary">
              {isRTL ? 'إعداد بنقرة واحدة' : '1-click connect'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onConnect}
              icon={<ArrowUpRight size={13} className={isRTL ? 'rotate-[-90deg]' : ''} />}
            >
              {isRTL ? 'ربط القناة' : 'Connect'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
