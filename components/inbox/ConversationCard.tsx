'use client'

import React, { memo } from 'react'
import { ApiConversation } from '../../hooks/useInbox'
import { Bot, User, AlertTriangle, Clock, Zap } from 'lucide-react'

const CHANNEL_STYLES: Record<string, { bg: string; label: string }> = {
  whatsapp:   { bg: '#25D366', label: 'WA' },
  instagram:  { bg: 'linear-gradient(135deg,#FD1D1D,#833AB4)', label: 'IG' },
  messenger:  { bg: '#0084FF', label: 'FB' },
  telegram:   { bg: '#2AABEE', label: 'TG' },
  tiktok:     { bg: '#010101', label: 'TK' },
  gmail:      { bg: '#EA4335', label: 'GM' },
  sms:        { bg: '#6C757D', label: 'SM' },
  webchat:    { bg: 'var(--accent)', label: 'WC' },
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: '#FF4757',
  high:   '#FF9F43',
  normal: 'transparent',
  low:    'transparent',
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function senderInitials(conv: ApiConversation): string {
  const name = conv.sender_name?.trim()
  if (!name) return conv.sender_id?.slice(-2).toUpperCase() || '?'
  const parts = name.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function AIStatusIcon({ conv }: { conv: ApiConversation }) {
  const requires_human = (conv as any).requires_human
  if (requires_human) return <AlertTriangle size={10} className="text-red-400" />
  if (conv.ai_enabled)  return <Bot size={10} className="text-[var(--accent)]" />
  return <User size={10} className="text-[var(--text-tertiary)]" />
}

interface ConversationCardProps {
  conv: ApiConversation
  selected: boolean
  onClick: () => void
  isRTL: boolean
}

const ConversationCard = memo(function ConversationCard({ conv, selected, onClick, isRTL }: ConversationCardProps) {
  const ch = CHANNEL_STYLES[conv.channel?.type?.toLowerCase() || ''] ?? { bg: 'var(--accent)', label: '?' }
  const initials = senderInitials(conv)
  const preview = conv.latest_message?.content?.replace(/\n/g, ' ') ?? ''
  const priorityColor = PRIORITY_DOT[conv.priority ?? 'normal'] ?? 'transparent'
  const unread = (conv as any).unread_count ?? 0
  const ts = relativeTime(conv.last_message_at)
  const requires_human = (conv as any).requires_human

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-[var(--divider)] transition-all duration-150 hover:bg-[var(--surface-elevated)] group relative ${
        selected
          ? 'bg-[var(--accent-subtle)] border-l-2 border-l-[var(--accent)]'
          : 'bg-transparent border-l-2 border-l-transparent'
      }`}
    >
      {/* Priority indicator */}
      {priorityColor !== 'transparent' && (
        <span
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
          style={{ background: priorityColor }}
        />
      )}

      <div className="flex items-start gap-2.5">
        {/* Avatar with channel ring */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-end))' }}
          >
            {initials}
          </div>
          {/* Channel badge */}
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md flex items-center justify-center text-white text-[7px] font-black shadow"
            style={{ background: ch.bg }}
          >
            {ch.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-[13px] font-semibold truncate ${selected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'} ${unread > 0 ? 'font-bold' : ''}`}>
              {conv.sender_name || `#${conv.sender_id?.slice(-6)}`}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">{ts}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs truncate ${unread > 0 ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
              {conv.latest_message?.is_ai && <span className="text-[var(--accent)] mr-1">AI:</span>}
              {preview || <span className="italic">No messages yet</span>}
            </p>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* AI / Human status icon */}
              <span className={`flex items-center justify-center w-4 h-4 rounded-full ${
                requires_human ? 'bg-red-100 dark:bg-red-900/30' :
                conv.ai_enabled ? 'bg-[var(--accent-subtle)]' :
                'bg-[var(--surface-elevated)]'
              }`}>
                <AIStatusIcon conv={conv} />
              </span>

              {/* Unread badge */}
              {unread > 0 && (
                <span className="bg-[var(--accent)] text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </div>
          </div>

          {/* Tags + intent */}
          {(conv.intent || conv.category) && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {conv.intent && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)]">
                  {conv.intent}
                </span>
              )}
              {conv.category && conv.category !== conv.intent && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[var(--surface-elevated)] text-[var(--text-tertiary)]">
                  {conv.category}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
})

export default ConversationCard
