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
  Plus,
  Clock,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Check,
  Zap,
  Globe,
  Radio,
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
  isConnecting?: boolean
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
  isConnecting = false,
}: ChannelCardModernProps) {
  const [expanded, setExpanded] = useState(false)
  const isConnected = instances.length > 0
  const isEcommerce = channel.category === 'ecommerce'

  type ChannelMeta = {
    name: string
    desc: string
    badges: string[]
  }

  const localizedChannel: ChannelMeta | undefined = (isRTL
    ? {
        instagram: {
          name: 'إنستغرام',
          desc: 'محادثات DMs والرد التلقائي على التعليقات لحسابات الأعمال عبر Meta.',
          badges: ['رسائل DMs', 'تعليقات المنشورات', 'ردود ذكية', 'Meta OAuth'],
        },
        whatsapp: {
          name: 'واتساب للأعمال',
          desc: 'ربط رسمي عبر WhatsApp Cloud API لخدمة العملاء والدعم على مدار الساعة.',
          badges: ['Cloud API', 'خدمة 24/7', 'رسائل تفاعلية', 'أتمتة المبيعات'],
        },
        facebook: {
          name: 'فيسبوك ماسنجر',
          desc: 'محادثات ماسنجر والردود التلقائية لصفحات النشاط التجاري وإدارة التعليقات.',
          badges: ['ماسنجر', 'تعليقات المنشورات', 'تحويل العملاء', 'Meta OAuth'],
        },
        gmail: {
          name: 'Gmail وGoogle Workspace',
          desc: 'مزامنة صناديق البريد والردود الذكية وتتبع تذاكر الدعم الفني.',
          badges: ['Google OAuth', 'مزامنة البريد', 'ردود مقترحة', 'أمان Google'],
        },
        salla: {
          name: 'متجر سلة',
          desc: 'مزامنة فورية للكتالوج، المخزون، والطلب الآلي السريع داخل المحادثات.',
          badges: ['مزامنة الكتالوج', 'تثبيت الطلبات', '20,335 مدينة', 'OAuth سلة'],
        },
        telegram: {
          name: 'تيليجرام',
          desc: 'محادثات الدعم الفوري والمبيعات عبر بوت تيليجرام رسمي موثق.',
          badges: ['BotFather', 'ردود فورية', 'مجموعات وقنوات', 'REST Bot API'],
        },
        shopify: {
          name: 'شوبيفاي',
          desc: 'مزامنة فورية للكتالوج والعملاء وسجلات الطلبات ومخزون المنتجات.',
          badges: ['Shopify API', 'تتبع الطلبات', 'مزامنة الكتالوج', 'Webhooks'],
        },
        woocommerce: {
          name: 'WooCommerce',
          desc: 'ربط سحابي مشفر لمزامنة المنتجات وتفاصيل الطلبات في ووردبريس.',
          badges: ['REST API', 'كتالوج المنتجات', 'حالات الطلب', 'HTTPS مشفر'],
        },
      }
    : {
        instagram: {
          name: 'Instagram Professional',
          desc: 'Connect Instagram Business for AI direct messaging and automated post comment replies.',
          badges: ['Direct Messages', 'Post Comments', 'AI Replies', 'Meta OAuth'],
        },
        whatsapp: {
          name: 'WhatsApp Business',
          desc: 'Official WhatsApp Cloud API connection for 24/7 customer care and conversational commerce.',
          badges: ['Cloud API', '24/7 Support', 'Interactive DMs', 'Sales Automation'],
        },
        facebook: {
          name: 'Facebook Messenger',
          desc: 'Connect Facebook Pages for automated Messenger conversations and feed comment replies.',
          badges: ['Messenger', 'Feed Comments', 'Lead Capture', 'Meta OAuth'],
        },
        gmail: {
          name: 'Gmail & Google Workspace',
          desc: 'Sync company mailboxes, generate AI drafts, and streamline customer support tickets.',
          badges: ['Google OAuth', 'Mailbox Sync', 'Smart Drafts', 'Enterprise Secure'],
        },
        salla: {
          name: 'Salla Store',
          desc: 'Sync live catalog, product inventory, and conversational order placement in real time.',
          badges: ['Catalog Sync', 'Instant Orders', '20,335 Cities', 'Salla OAuth'],
        },
        telegram: {
          name: 'Telegram',
          desc: 'Connect Telegram BotFather token to automate instant customer inquiries and sales.',
          badges: ['BotFather', 'Instant Chat', 'Bot API', 'Real-time DMs'],
        },
        shopify: {
          name: 'Shopify Store',
          desc: 'Direct store sync for catalog products, inventory levels, customer profiles, and orders.',
          badges: ['Shopify API', 'Live Catalog', 'Order Lookup', 'Webhooks'],
        },
        woocommerce: {
          name: 'WooCommerce',
          desc: 'Encrypted bridge for WordPress WooCommerce store catalog and order synchronization.',
          badges: ['REST API', 'Product Catalog', 'Order History', 'Encrypted Bridge'],
        },
      })[channel.id]

  const channelName = localizedChannel?.name || channel.name
  const channelDescription = localizedChannel?.desc || channel.description
  const featureBadges = localizedChannel?.badges || []

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
  const categoryLabels: Record<string, { en: string; ar: string; color: string }> = {
    messaging: { en: 'Messaging', ar: 'مراسلة فورية', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    social: { en: 'Social', ar: 'تواصل اجتماعي', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    ecommerce: { en: 'E-Commerce', ar: 'تجارة إلكترونية', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    email: { en: 'Email', ar: 'بريد إلكتروني', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  }

  const categoryMeta = categoryLabels[channel.category] || {
    en: channel.category,
    ar: channel.category,
    color: 'text-text-secondary bg-surface-elevated border-border',
  }

  const displayedInstances = expanded ? instances : instances.slice(0, 3)
  const remainingCount = instances.length - 3

  // Brand gradient highlight
  const brandGradient = isConnected
    ? 'from-emerald-500/10 via-emerald-500/[0.02] to-transparent'
    : 'from-brand/10 via-brand/[0.02] to-transparent'

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs hover:shadow-lg ${
        hasIssues
          ? 'border-amber-500/40 bg-surface-card hover:border-amber-500/70'
          : isConnected
          ? 'border-border-strong/80 bg-surface-card hover:border-emerald-500/40'
          : 'border-border/70 bg-surface/70 hover:border-brand/40 hover:bg-surface-card'
      }`}
    >
      {/* Subtle Brand Ambient Glow at Top */}
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${brandGradient} pointer-events-none opacity-80`} />

      {/* Top Card Body */}
      <div className="relative p-5 sm:p-6 space-y-4">
        {/* Header: Platform Icon + Titles + Connection Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-surface shadow-xs transition-transform duration-200 group-hover:scale-105">
              <ChannelIcon type={channel.id as any} size={28} />

              {/* Glowing Pulse Dot */}
              {isConnected ? (
                <span className="absolute -bottom-0.5 -end-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-surface-card"></span>
                </span>
              ) : hasIssues ? (
                <span className="absolute -bottom-0.5 -end-0.5 flex h-3.5 w-3.5">
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-surface-card"></span>
                </span>
              ) : (
                <span
                  className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-surface-card bg-text-disabled"
                />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  {channelName}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${categoryMeta.color}`}>
                  {isRTL ? categoryMeta.ar : categoryMeta.en}
                </span>
              </div>
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
                ? `${instances.length} ${instances.length === 1 ? 'حساب نشط' : 'حسابات'}`
                : `${instances.length} ${instances.length === 1 ? 'account' : 'accounts'}`}
            </Badge>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border/70 bg-surface/80 px-2.5 py-0.5 text-[11px] font-semibold text-text-tertiary">
              {isRTL ? 'جاهز للربط' : 'Ready'}
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {channelDescription}
        </p>

        {/* Feature Capability Tags */}
        {featureBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {featureBadges.map((badge: string, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface/60 px-2 py-0.5 text-[10px] font-medium text-text-tertiary group-hover:border-border group-hover:text-text-secondary transition-colors"
              >
                <span className="h-1 w-1 rounded-full bg-text-tertiary/60" />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Connected Accounts Compact List ──────────────────────── */}
        {isConnected && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <Radio size={12} className="text-emerald-400" />
                <span>{isRTL ? 'الحسابات المتصلة' : 'Connected Accounts'}</span>
              </span>
              <span className="tabular-nums font-mono text-[10px] bg-surface-elevated px-1.5 py-0.2 rounded border border-border/60">
                {instances.length} {isRTL ? 'نشط' : 'active'}
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
                        ? 'border-amber-500/40 bg-amber-500/[0.04]'
                        : 'border-border/70 bg-surface/90 hover:border-brand/40 hover:bg-surface-elevated'
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
                        {isEcommerce && (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-400 shrink-0"
                            title={isRTL ? 'متجر تجارة إلكترونية' : 'E-Commerce Store'}
                          >
                            <Globe size={9} />
                            <span>Store</span>
                          </span>
                        )}
                      </div>

                      {/* Sub-label: ID or sync info */}
                      <div className="flex items-center gap-2 text-[10px] text-text-tertiary mt-0.5">
                        {inst.page_id && (
                          <span className="font-mono truncate max-w-[180px]" title={inst.page_id}>
                            {inst.type === 'salla'
                              ? `${isRTL ? 'معرّف المتجر:' : 'Store ID:'} ${inst.page_id}`
                              : inst.page_id}
                          </span>
                        )}
                        {isEcommerce && inst.integration?.last_synced_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
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
                          title={isRTL ? 'مزامنة بيانات المتجر والكتالوج' : 'Sync catalog & store data'}
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
      <div className="relative flex items-center justify-between border-t border-border/60 bg-surface/50 px-5 py-3.5">
        {isConnected ? (
          <>
            <button
              type="button"
              onClick={onConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline disabled:opacity-50 transition-all cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-brand" />
                  <span>{isRTL ? 'جارٍ التحويل...' : 'Connecting…'}</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>{isRTL ? 'إضافة حساب آخر' : 'Add another account'}</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isRTL ? 'متصل وجاهز' : 'Operational'}</span>
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] text-text-tertiary flex items-center gap-1">
              <Zap size={11} className="text-amber-400" />
              <span>{isRTL ? 'ربط مباشر وفوري' : '1-click connect'}</span>
            </span>

            <Button
              variant="primary"
              size="sm"
              onClick={onConnect}
              disabled={isConnecting}
              icon={
                isConnecting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ArrowUpRight size={13} className={isRTL ? 'rotate-[-90deg]' : ''} />
                )
              }
            >
              {isConnecting
                ? isRTL
                  ? 'جارٍ التحويل...'
                  : 'Connecting…'
                : isRTL
                ? 'ربط القناة'
                : 'Connect'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
