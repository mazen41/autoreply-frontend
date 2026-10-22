'use client'

import React, { useState } from 'react'
import ChannelIcon from '../ui/ChannelIcon'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sliders,
  ShieldCheck,
} from 'lucide-react'

export interface ChannelInstance {
  id: number
  type?: string
  page_name?: string
  page_id?: string
  ai_enabled: boolean
  effective_ai_enabled?: boolean
  ai_pause_reason?: string | null
  status?: 'active' | 'connected' | 'warning' | 'error' | 'syncing'
  status_message?: string
  comment_webhook_status?: string | null
  comment_webhook_error_code?: string | null
  last_activity?: string
  integration?: {
    store_url?: string
    sync_status?: string
    sync_counts?: { products?: number; orders?: number; customers?: number }
    last_synced_at?: string | null
    sync_error?: string | null
  }
}

export interface ChannelDef {
  id: string
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | 'email'
  brandColor: string
  disabled?: boolean
}

export interface ChannelCardProps {
  channel: ChannelDef
  instances: ChannelInstance[]
  isRTL?: boolean
  onConnect: () => void
  onToggleAI: (instanceId: number, currentStatus: boolean) => void
  onDisconnect: (instanceId: number) => void
  onSync?: (instance: ChannelInstance) => void
  onManageSettings?: (instance: ChannelInstance) => void
}

export default function ChannelCard({
  channel,
  instances,
  isRTL = false,
  onConnect,
  onToggleAI,
  onDisconnect,
  onSync,
  onManageSettings,
}: ChannelCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isConnected = instances.length > 0

  // Check if any instance requires attention
  const hasWarning = instances.some(
    (i) => i.status === 'warning' || i.status === 'error' || i.comment_webhook_status === 'error' || Boolean(i.integration?.sync_error) || i.integration?.sync_status === 'failed'
  )
  const warningCount = instances.filter(
    (i) => i.status === 'warning' || i.status === 'error' || i.comment_webhook_status === 'error' || Boolean(i.integration?.sync_error) || i.integration?.sync_status === 'failed'
  ).length

  const displayedInstances = expanded ? instances : instances.slice(0, 2)
  const remainingCount = instances.length - 2

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`rounded-2xl border bg-surface-card transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md relative group ${
        hasWarning
          ? 'border-warning/40 hover:border-warning/70'
          : isConnected
          ? 'border-border hover:border-brand/40'
          : 'border-border/80 hover:border-border-hover'
      }`}
    >
      {/* Subtle top indicator bar */}
      {isConnected && (
        <div
          className="h-1 w-full shrink-0"
          style={{
            backgroundColor: hasWarning ? '#F59E0B' : channel.brandColor || '#3B82F6',
          }}
        />
      )}

      {/* ─── Card Header ─────────────────────────────────────────────────── */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center p-2.5 border shrink-0 bg-surface-elevated/70"
              style={{
                borderColor: isConnected
                  ? `color-mix(in srgb, ${channel.brandColor} 30%, var(--border))`
                  : 'var(--border)',
              }}
            >
              <ChannelIcon type={channel.id as Parameters<typeof ChannelIcon>[0]['type']} size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  {channel.name}
                </h3>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                {channel.description}
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          {hasWarning ? (
            <Badge variant="warning" dot dotPulse size="sm">
              {isRTL ? 'تحتاج إلى متابعة' : 'Needs Attention'}
            </Badge>
          ) : isConnected ? (
            <Badge variant="success" dot size="sm">
              {isRTL ? 'متصلة' : 'Connected'}
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              {isRTL ? 'متاحة' : 'Available'}
            </Badge>
          )}
        </div>

        {/* ─── Status & Overview Strip ────────────────────────────────────── */}
        {isConnected && (
          <div className="flex items-center justify-between text-[11px] text-text-secondary px-3 py-1.5 rounded-lg bg-surface-elevated/50 border border-border/50 mb-3">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>
                {instances.length} {isRTL ? 'حساب' : instances.length === 1 ? 'account' : 'accounts'}
              </span>
            </div>
            <span className="text-text-tertiary">
              {hasWarning
                ? (isRTL ? `${warningCount} تنبيهات` : `${warningCount} ${warningCount === 1 ? 'alert' : 'alerts'} active`)
                : (isRTL ? 'كل الأنظمة سليمة' : 'All systems healthy')}
            </span>
          </div>
        )}

        {/* ─── Connected Accounts List ───────────────────────────────────── */}
        {isConnected && (
          <div className="space-y-2 mt-2">
            {displayedInstances.map((inst) => {
              const accountWarning =
                inst.status === 'warning' || inst.status === 'error' || inst.comment_webhook_status === 'error' || Boolean(inst.integration?.sync_error) || inst.integration?.sync_status === 'failed'
              const accountWarningMessage = inst.status_message
                || inst.integration?.sync_error
                || (inst.comment_webhook_status === 'error'
                  ? `Comment webhook needs attention${inst.comment_webhook_error_code ? ` (${inst.comment_webhook_error_code})` : ''}`
                  : null)

              return (
                <div
                  key={inst.id}
                  className={`p-3 rounded-xl border transition-all ${
                    accountWarning
                      ? 'bg-warning/5 border-warning/30'
                      : 'bg-surface-elevated/70 border-border/70 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-text-primary truncate flex items-center gap-1.5">
                        <span>{inst.page_name || `Account #${inst.id}`}</span>
                        {accountWarning && (
                          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-text-tertiary truncate">
                        <span dir="ltr">ID: {inst.page_id || inst.id}</span>
                        {accountWarningMessage && ` • ${accountWarningMessage}`}
                      </div>
                      {inst.integration && (
                        <div className="text-[10px] text-text-tertiary mt-1">
                          {inst.integration.sync_counts?.products ?? 0} products · {inst.integration.sync_counts?.orders ?? 0} orders · {inst.integration.sync_counts?.customers ?? 0} customers
                          {inst.integration.last_synced_at && ` · Synced ${new Date(inst.integration.last_synced_at).toLocaleString()}`}
                        </div>
                      )}
                    </div>

                    {/* AI Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onToggleAI(inst.id, inst.ai_enabled)}
                      disabled={channel.disabled}
                      title={
                        inst.ai_enabled && inst.effective_ai_enabled === false
                          ? 'AI is enabled for this channel, but replies are paused until an active agent is available.'
                          : inst.ai_enabled
                          ? 'AI Auto-Reply is active. Click to pause.'
                          : 'AI Auto-Reply is off. Click to activate.'
                      }
                      aria-label={isRTL
                        ? (inst.ai_enabled ? 'إيقاف الرد الآلي لهذا الحساب' : 'تفعيل الرد الآلي لهذا الحساب')
                        : (inst.ai_enabled ? 'Pause AI replies for this account' : 'Enable AI replies for this account')}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold tracking-wider uppercase inline-flex items-center gap-1.5 border transition-all ${
                        inst.ai_enabled
                          ? 'bg-brand/10 border-brand/30 text-brand hover:bg-brand/15'
                          : 'bg-surface border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{channel.disabled
                        ? (isRTL ? 'الردود متوقفة' : 'Replies off')
                        : inst.ai_enabled && inst.effective_ai_enabled === false
                          ? (isRTL ? 'مفعّل مؤقتاً' : 'Paused')
                          : inst.ai_enabled
                            ? (isRTL ? 'الذكاء مفعّل' : 'AI On')
                            : (isRTL ? 'الذكاء متوقف' : 'AI Off')}</span>
                    </button>
                  </div>

                  {inst.ai_pause_reason === 'no_active_agent' && (
                    <p className="mb-2 text-[10px] font-medium text-warning">
                      {isRTL ? 'لا يوجد وكيل نشط — الردود متوقفة' : 'No active agent — replies paused'}
                    </p>
                  )}
                  {inst.ai_pause_reason === 'multiple_active_agents_without_primary' && (
                    <p className="mb-2 text-[10px] font-medium text-warning">
                      {isRTL ? 'يلزم اختيار وكيل أساسي — الردود متوقفة' : 'Multiple agents need a primary selection — replies paused'}
                    </p>
                  )}

                  {/* Actions Bar inside instance */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <span className="text-[10px] text-text-tertiary">
                      {accountWarning ? (
                        <span className="text-warning font-medium" title={accountWarningMessage || undefined}>
                          {accountWarningMessage || 'Connection needs attention'}
                        </span>
                      ) : inst.integration?.sync_status === 'syncing' || inst.integration?.sync_status === 'queued' ? (
                        (isRTL ? 'مزامنة المتجر جارية' : 'Store sync in progress')
                      ) : (
                        (isRTL ? 'متصل' : 'Connected')
                      )}
                    </span>

                    <div className="flex items-center gap-1">
                      {onSync && inst.integration && (
                        <button
                          type="button"
                          onClick={() => onSync(inst)}
                          className="px-2 py-1 rounded text-[10px] font-semibold text-brand hover:bg-brand/10 transition-colors"
                          title="Sync store data now"
                        >
                          {isRTL ? 'مزامنة الآن' : 'Sync now'}
                        </button>
                      )}
                      {onManageSettings && (
                        <button
                          type="button"
                          onClick={() => onManageSettings(inst)}
                          className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors"
                        title={isRTL ? 'إعدادات الحساب' : 'Account Settings'}
                        aria-label={isRTL ? 'إعدادات الحساب' : 'Account settings'}
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDisconnect(inst.id)}
                        className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                        title={isRTL ? 'فصل الحساب' : 'Disconnect account'}
                        aria-label={isRTL ? 'فصل الحساب' : 'Disconnect account'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Expand / Collapse for multiple accounts */}
            {remainingCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full py-1.5 text-center text-xs font-semibold text-brand hover:underline flex items-center justify-center gap-1"
              >
                <span>
                  {expanded
                    ? (isRTL ? 'عرض حسابات أقل' : 'Show fewer accounts')
                    : isRTL ? `+ ${remainingCount} حسابات إضافية` : `+ ${remainingCount} more ${
                        remainingCount === 1 ? 'account' : 'accounts'
                      }`}
                </span>
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        {/* ─── Disconnected State Preview ─────────────────────────────────── */}
        {!isConnected && (
          <div className="py-3 space-y-2">
            <div className="text-xs text-text-secondary leading-relaxed">
              {channel.category === 'ecommerce'
                ? (isRTL ? 'اربط هذا المتجر لمزامنة المنتجات والطلبات واستخدام بياناتها في المحادثات.' : 'Connect this store to sync product and order data for commerce-aware conversations.')
                : isRTL ? `اربط ${channel.name} لاستقبال رسائل العملاء المدعومة وإرسال الردود.` : `Connect ${channel.name} to receive supported customer messages and send supported replies.`}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success/80" />
              <span>{isRTL ? 'تعتمد طريقة الربط والميزات على مزود الخدمة.' : 'Connection method and features depend on the provider.'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Card Footer ─────────────────────────────────────────────────── */}
      <div className="p-4 bg-surface-elevated/40 border-t border-border/60 flex items-center gap-2">
        {channel.disabled ? (
          <Button variant="outline" size="sm" className="w-full text-xs" disabled>
            {isRTL ? 'المراسلة غير متاحة' : 'Messaging unavailable'}
          </Button>
        ) : isConnected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onConnect}
            >
              {isRTL ? 'إضافة حساب' : 'Add Account'}
            </Button>
            {hasWarning && (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={onConnect}
              >
                {isRTL ? 'إصلاح الاتصال' : 'Fix Connection'}
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full text-xs"
            onClick={onConnect}
          >
            {isRTL ? `ربط ${channel.name}` : `Connect ${channel.name}`}
          </Button>
        )}
      </div>
    </div>
  )
}
