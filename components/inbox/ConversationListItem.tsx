'use client'

import React, { memo } from 'react'
import ChannelIcon from '../ui/ChannelIcon'

interface ConversationListItemProps {
  conv: {
    id: number
    sender_id: string
    sender_name: string | null
    sender_email: string | null
    subject: string | null
    status: string
    ai_enabled: boolean
    last_message_at: string | null
    channel: { type: string; page_name: string | null }
    latest_message?: { content: string; is_ai: boolean } | null
    category?: string | null
    priority?: string | null
    created_at?: string | null
  }
  active: boolean
  onClick: () => void
  onToggleAi: (id: number) => void
  tags?: Array<{ id: number; tag: string }>
  isEscalated?: boolean
  isAssigned?: boolean
}

function senderLabel(conv: ConversationListItemProps['conv']) {
  if (conv.sender_name && conv.sender_name.trim()) return conv.sender_name.trim()
  if (conv.sender_email) return conv.sender_email
  return `···${conv.sender_id.slice(-4)}`
}

function formatTimestamp(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 7) return `${diffD}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function channelMeta(type: string) {
  if (type === 'facebook') return { label: 'FB', color: '#0E7AFE' }
  if (type === 'instagram') return { label: 'IG', color: '#D62976' }
  if (type === 'gmail') return { label: 'GM', color: '#EA4335' }
  if (type === 'whatsapp') return { label: 'WA', color: '#25D366' }
  return { label: '??', color: 'var(--text-secondary)' }
}

const ConversationListItem = memo(function ConversationListItem({
  conv,
  active,
  onClick,
  onToggleAi,
  tags,
  isEscalated,
  isAssigned
}: ConversationListItemProps) {
  const preview = conv.latest_message?.content ?? conv.subject ?? '—'
  const isAI = conv.latest_message?.is_ai
  const isHighPriority = conv.priority === 'high'
  const isClassified = !!conv.category
  const meta = channelMeta(conv.channel.type)

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-selected={active}
      aria-label={`Conversation with ${senderLabel(conv)}${conv.latest_message?.content ? `: ${conv.latest_message.content.slice(0, 50)}` : ''}`}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[var(--divider)] text-left transition-all duration-150 relative group cursor-pointer ${
        active
          ? 'bg-[var(--accent-subtle)]'
          : isEscalated
            ? 'bg-amber-500/5'
            : 'bg-transparent hover:bg-[var(--surface-elevated)]'
      }`}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-accent to-[#8B3FFB]" />
      )}

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <ChannelIcon type={conv.channel.type as any} size={38} className="rounded-xl border border-[var(--border)]" />
          
          {/* Status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--background)] flex items-center justify-center">
            <div className={`w-1.5 h-1.5 rounded-full ${isEscalated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
              {senderLabel(conv)}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">
              {formatTimestamp(conv.last_message_at)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            {isEscalated && <span className="text-[9px] text-amber-400 font-bold uppercase">🔥 Escalated</span>}
            {isAI && <span className="text-[9px] text-accent font-bold uppercase">⚡ AI</span>}
            {conv.category && <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent">{conv.category}</span>}
          </div>

          <p className="text-xs text-[var(--text-secondary)] truncate">
            {preview}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {tags.slice(0, 2).map(tag => (
                <span key={tag.id} className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {tag.tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleAi(conv.id) }}
        className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all duration-150 flex-shrink-0 ${
          conv.ai_enabled
            ? 'bg-accent/15 border-accent/30 text-accent hover:bg-accent/25'
            : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border)] hover:text-[var(--text-secondary)]'
        }`}
      >
        AI
      </button>
    </div>
  )
})

export default ConversationListItem