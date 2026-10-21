'use client'

import React, { useState } from 'react'
import { ApiConversation, ApiBot } from '../../hooks/useInbox'
import Select from '../ui/Select'
import {
  Bot, User, AlertTriangle, CheckCircle, Archive,
  Clock, PanelLeft, PanelRight,
  MoreHorizontal, Zap, X, Loader2, Star, Ban, Trash2
} from 'lucide-react'

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  whatsapp:  { label: 'WhatsApp',  color: '#25D366' },
  instagram: { label: 'Instagram', color: '#C13584' },
  messenger: { label: 'Messenger', color: '#0084FF' },
  telegram:  { label: 'Telegram',  color: '#2AABEE' },
  gmail:     { label: 'Gmail',     color: '#EA4335' },
  tiktok:    { label: 'TikTok',   color: '#010101' },
  webchat:   { label: 'Live Chat', color: 'var(--accent)' },
  sms:       { label: 'SMS',       color: '#6C757D' },
}

interface ConversationHeaderProps {
  conv: ApiConversation
  isRTL: boolean
  onToggleAI: () => void
  onStatusChange: (s: 'open' | 'closed' | 'pending') => void
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
  leftCollapsed: boolean
  rightCollapsed: boolean
  availableBots?: ApiBot[]
  onBotChange?: (botId: number | null) => void
  isUpdatingBot?: boolean
  availableAgents?: Array<{ id: number; name: string }>
  onAgentChange?: (agentId: number | null) => void
  isUpdatingAgent?: boolean
  onRequestFeedback?: () => void
  isCreatingFeedbackLink?: boolean
  onBlockChange?: (blocked: boolean) => void
  onDeleteConversation?: () => void
  isDeletingConversation?: boolean
}

export default function ConversationHeader({
  conv, isRTL, onToggleAI, onStatusChange,
  onToggleLeftPanel, onToggleRightPanel, leftCollapsed, rightCollapsed,
  availableBots = [], onBotChange, isUpdatingBot = false,
  availableAgents = [], onAgentChange, isUpdatingAgent = false,
  onRequestFeedback, isCreatingFeedbackLink = false,
  onBlockChange, onDeleteConversation, isDeletingConversation = false
}: ConversationHeaderProps) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const L = (en: string, ar: string) => isRTL ? ar : en

  const ch = CHANNEL_LABELS[conv.channel?.type?.toLowerCase() || ''] ?? { label: conv.channel?.type ?? 'Chat', color: 'var(--accent)' }
  const requires_human = (conv as any).requires_human

  const aiState = requires_human ? 'escalated' : conv.ai_enabled ? 'active' : 'paused'
  const aiStateConfig = {
    active:    { label: L('AI Active', 'AI نشط'),      bg: 'bg-brand/10',  text: 'text-brand',   dot: 'bg-brand' },
    paused:    { label: L('AI Paused', 'AI متوقف'),     bg: 'bg-surface-elevated', text: 'text-text-secondary', dot: 'bg-text-tertiary' },
    escalated: { label: L('Escalated', 'مصعّد'),       bg: 'bg-error dark:bg-error/20', text: 'text-error',           dot: 'bg-error' },
  }[aiState]

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open:    { label: L('Open',    'مفتوح'),   color: 'var(--accent)',   icon: <Zap size={12} /> },
    pending: { label: L('Pending', 'معلق'),    color: 'var(--warning)',  icon: <Clock size={12} /> },
    closed:  { label: L('Resolved','محلول'),   color: 'var(--success)', icon: <CheckCircle size={12} /> },
  }
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface flex-shrink-0">
      {/* Panel toggles */}
      <button
        onClick={onToggleLeftPanel}
        className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary transition-colors flex-shrink-0"
        title={L('Toggle sidebar', 'إخفاء/إظهار القائمة')}
      >
        <PanelLeft size={15} />
      </button>

      {/* Customer info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl border border-white/10 bg-gradient-to-br from-accent to-accent-end flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm">
          {(conv.sender_name?.charAt(0) || '?').toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary truncate">
              {conv.sender_name || `#${conv.sender_id?.slice(-6)}`}
            </span>
            <span
              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md text-white flex-shrink-0"
              style={{ background: ch.color }}
            >
              {conv.channel?.page_name || conv.channel?.page_id || ch.label}
            </span>
            {onBotChange && (availableBots.length > 0 || conv.bot_id) && (
              <div className="w-36 shrink-0 sm:w-40">
                <Select
                  id={`conversation-${conv.id}-bot`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  ariaLabel={L('Assign a bot to this conversation', 'تعيين بوت لهذه المحادثة')}
                  value={conv.bot_id ? String(conv.bot_id) : ''}
                  onValueChange={value => onBotChange(value ? Number(value) : null)}
                  options={[
                    { value: '', label: L('Assign bot', 'تعيين بوت'), icon: <Bot size={13} /> },
                    ...availableBots.map(bot => ({
                      value: String(bot.id),
                      label: bot.name,
                      icon: <Bot size={13} />,
                    })),
                  ]}
                  disabled={isUpdatingBot}
                  loading={isUpdatingBot}
                  size="sm"
                  className="w-full"
                  triggerClassName="h-8 rounded-lg bg-surface px-2 text-[11px]"
                />
              </div>
            )}
          </div>
          {conv.sender_email && (
            <p className="text-[10px] text-text-tertiary truncate">{conv.sender_email}</p>
          )}
        </div>
      </div>

      {/* AI State Toggle & Manual Takeover */}
      <button
        onClick={onToggleAI}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${aiStateConfig.bg} ${aiStateConfig.text} border border-current/10`}
        title={L('Toggle AI / Manual Takeover', 'تبديل AI / الاستحواذ اليدوي')}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${aiStateConfig.dot} ${aiState === 'active' ? 'animate-pulse' : ''}`} />
        {aiStateConfig.label}
        {aiState === 'active' ? <Bot size={12} /> : aiState === 'escalated' ? <AlertTriangle size={12} /> : <User size={12} />}
      </button>

      {/* Status dropdown */}
      <div className="w-32 shrink-0">
        <Select
          id={`conversation-${conv.id}-status`}
          dir={isRTL ? 'rtl' : 'ltr'}
          ariaLabel={L('Conversation status', 'حالة المحادثة')}
          value={conv.status}
          onValueChange={value => onStatusChange(value as 'open' | 'closed' | 'pending')}
          options={Object.entries(statusConfig).map(([value, config]) => ({
            value,
            label: config.label,
            icon: config.icon,
          }))}
          size="sm"
          className="w-full"
          triggerClassName="h-8 rounded-lg bg-surface px-2 text-[11px]"
        />
      </div>

      {conv.status === 'closed' && onRequestFeedback && <button type="button" onClick={onRequestFeedback} disabled={isCreatingFeedbackLink} className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-surface-elevated disabled:opacity-50" title={isRTL ? 'إنشاء رابط تقييم للعميل' : 'Add a customer feedback link to the reply'}>
        {isCreatingFeedbackLink ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}{isRTL ? 'التقييم' : 'Ask for feedback'}
      </button>}

      {/* Agent Assignment */}
      {availableAgents.length > 0 && onAgentChange && (
        <div className="w-36 shrink-0">
          <Select
            id={`conversation-${conv.id}-agent`}
            dir={isRTL ? 'rtl' : 'ltr'}
            ariaLabel={L('Assign conversation to an agent', 'تعيين المحادثة لموظف')}
            value={conv.assigned_agent_id ? String(conv.assigned_agent_id) : ''}
            onValueChange={value => onAgentChange(value ? Number(value) : null)}
            options={[
              { value: '', label: L('Unassigned', 'غير معين'), icon: <User size={13} /> },
              ...availableAgents.map(agent => ({ value: String(agent.id), label: agent.name, icon: <User size={13} /> })),
            ]}
            disabled={isUpdatingAgent}
            loading={isUpdatingAgent}
            size="sm"
            className="w-full"
            triggerClassName="h-8 rounded-lg bg-surface px-2 text-[11px]"
          />
        </div>
      )}

      {/* More actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setActionsOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
          aria-label={L('Conversation actions', 'إجراءات المحادثة')}
          title={L('Conversation actions', 'إجراءات المحادثة')}
        >
          <MoreHorizontal size={15} />
        </button>
        {actionsOpen && (
          <div className="absolute end-0 top-full mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl z-50">
            {[
              { icon: Clock, label: L('Snooze', 'تأجيل'), action: () => onStatusChange('pending') },
              { icon: Archive, label: L(conv.status === 'closed' ? 'Reopen conversation' : 'Archive conversation', conv.status === 'closed' ? 'إعادة فتح المحادثة' : 'أرشفة المحادثة'), action: () => onStatusChange(conv.status === 'closed' ? 'open' : 'closed') },
              ...(conv.can_block_contact && onBlockChange ? [{
                icon: Ban,
                label: L(conv.is_blocked ? 'Unblock contact' : 'Block contact', conv.is_blocked ? 'إلغاء حظر جهة الاتصال' : 'حظر جهة الاتصال'),
                action: () => onBlockChange(!conv.is_blocked),
              }] : []),
              ...(onDeleteConversation ? [{ icon: Trash2, label: L('Delete conversation', 'حذف المحادثة'), action: onDeleteConversation, destructive: true }] : []),
            ].map(item => (
              <button
                key={item.label}
                type="button"
                disabled={isDeletingConversation}
                onClick={() => { item.action(); setActionsOpen(false) }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-xs transition-colors hover:bg-surface disabled:opacity-50 ${'destructive' in item && item.destructive ? 'text-error hover:text-error' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {'destructive' in item && item.destructive && isDeletingConversation
                  ? <Loader2 size={13} className="animate-spin" />
                  : <item.icon size={13} />}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right panel toggle */}
      <button
        onClick={onToggleRightPanel}
        className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-tertiary transition-colors flex-shrink-0"
        title={L('Toggle customer panel', 'إخفاء/إظهار لوحة العميل')}
      >
        <PanelRight size={15} />
      </button>
    </div>
  )
}
