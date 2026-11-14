'use client'

import React, { memo } from 'react'
import { ApiConversation } from '../../hooks/useInbox'
import { parseConversationMeta, type InboxCategory } from './inboxParser'

const CHANNEL_BADGES: Record<string, { bg: string; label: string }> = {
  whatsapp:   { bg: '#25D366', label: 'WA' },
  instagram:  { bg: '#E4405F', label: 'IG' },
  messenger:  { bg: '#0084FF', label: 'FB' },
  telegram:   { bg: '#2AABEE', label: 'TG' },
  tiktok:     { bg: '#010101', label: 'TK' },
  gmail:      { bg: '#EA4335', label: 'GM' },
  sms:        { bg: '#6C757D', label: 'SM' },
  webchat:    { bg: 'var(--brand)', label: 'WC' },
  salla:      { bg: '#00D9FF', label: 'SL' },
  shopify:    { bg: '#95BF47', label: 'SH' },
}

function formatRelativeTime(iso: string | null, isRTL: boolean): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return isRTL ? 'الآن' : 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })
}

interface ConversationCardProps {
  conv: ApiConversation
  selected: boolean
  onClick: () => void
  isRTL: boolean
}

const ConversationCard = memo(function ConversationCard({
  conv,
  selected,
  onClick,
  isRTL,
}: ConversationCardProps) {
  const meta = parseConversationMeta(conv, isRTL)
  const channelType = conv.channel?.type?.toLowerCase() || 'webchat'
  const ch = CHANNEL_BADGES[channelType] ?? { bg: 'var(--brand)', label: 'WC' }
  const unread = (conv as any).unread_count ?? 0
  const ts = formatRelativeTime(conv.last_message_at, isRTL)

  const isPurple = meta.isAi || meta.cleanName.toLowerCase().includes('naz biz')

  const renderCategoryBadge = (cat: InboxCategory) => {
    switch (cat) {
      case 'ai_replied':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/50 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>{isRTL ? 'ردّ الوكيل' : 'AI replied'}</span>
          </span>
        )
      case 'needs_agent':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/50 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span>{isRTL ? 'تحتاج متابعة' : 'Needs agent'}</span>
          </span>
        )
      case 'notification':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 text-[10px] font-semibold text-slate-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{isRTL ? 'إشعار' : 'Notification'}</span>
          </span>
        )
      case 'promotion':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/50 border border-purple-500/25 px-2 py-0.5 text-[10px] font-semibold text-purple-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <span>{isRTL ? 'عرض ترويجي' : 'Promotion'}</span>
          </span>
        )
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`w-full text-start px-3.5 py-3 border-b border-border/50 transition-all duration-150 group relative select-none ${
        selected
          ? 'bg-surface-elevated/90 dark:bg-[#1A2440] border-s-2 border-s-brand shadow-xs ring-1 ring-border/60'
          : 'bg-transparent border-s-2 border-s-transparent hover:bg-surface-hover/70 dark:hover:bg-[#151E36]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-xs transition-transform group-hover:scale-105 ${
              isPurple
                ? 'bg-[#2b223c] text-[#c084fc] border border-purple-500/30'
                : 'bg-[#181f2c] text-slate-300 border border-slate-700/40'
            }`}
          >
            {meta.avatarText}
          </div>
          {/* Channel micro-indicator */}
          <div
            className="absolute -bottom-1 -end-1 w-4 h-4 rounded-md flex items-center justify-center text-white text-[7px] font-extrabold shadow-sm ring-1 ring-background"
            style={{ background: ch.bg }}
            title={ch.label}
          >
            {ch.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span
              className={`text-[13px] font-semibold truncate ${
                selected ? 'text-brand' : 'text-text-primary'
              } ${unread > 0 ? 'font-bold' : ''}`}
            >
              {meta.cleanName}
            </span>
            <span className="text-[10px] text-text-disabled shrink-0 tabular-nums">
              {ts}
            </span>
          </div>

          {/* Subtitle / Preview & Badges */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-tertiary truncate leading-tight">
              {meta.cleanPreview ? (
                meta.cleanPreview
              ) : meta.isUnparseable ? (
                <span className="italic text-text-disabled">
                  {isRTL ? 'تعذر تحويل الرسالة إلى معاينة' : 'Message could not be parsed into a preview'}
                </span>
              ) : (
                <span className="italic text-text-disabled">
                  {isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'}
                </span>
              )}
            </p>

            {/* Unread badge */}
            {unread > 0 && (
              <span className="bg-brand text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-4 px-1.5 flex items-center justify-center leading-none shrink-0 shadow-sm shadow-brand/40">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>

          {/* Status pill strip */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {renderCategoryBadge(meta.category)}

            {/* Intent / Tag if present */}
            {conv.intent && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                {conv.intent}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
})

export default ConversationCard
