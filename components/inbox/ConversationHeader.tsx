'use client'

import React, { useState, useCallback } from 'react'
import { ApiConversation, ApiBot } from '../../hooks/useInbox'
import {
  Bot, User, AlertTriangle, ChevronDown, CheckCircle, Archive,
  Clock, UserPlus, ArrowRight, PanelLeft, PanelRight, Phone,
  MoreHorizontal, Zap, X, Loader2
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
}

export default function ConversationHeader({
  conv, isRTL, onToggleAI, onStatusChange,
  onToggleLeftPanel, onToggleRightPanel, leftCollapsed, rightCollapsed,
  availableBots = [], onBotChange, isUpdatingBot = false,
  availableAgents = [], onAgentChange, isUpdatingAgent = false
}: ConversationHeaderProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [botDropdownOpen, setBotDropdownOpen] = useState(false)
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)
  const L = (en: string, ar: string) => isRTL ? ar : en

  const ch = CHANNEL_LABELS[conv.channel?.type?.toLowerCase() || ''] ?? { label: conv.channel?.type ?? 'Chat', color: 'var(--accent)' }
  const requires_human = (conv as any).requires_human

  const aiState = requires_human ? 'escalated' : conv.ai_enabled ? 'active' : 'paused'
  const aiStateConfig = {
    active:    { label: L('AI Active', 'AI نشط'),      bg: 'bg-accent-subtle',  text: 'text-accent',   dot: 'bg-accent' },
    paused:    { label: L('AI Paused', 'AI متوقف'),     bg: 'bg-surface-elevated', text: 'text-text-secondary', dot: 'bg-text-tertiary' },
    escalated: { label: L('Escalated', 'مصعّد'),       bg: 'bg-error dark:bg-error/20', text: 'text-error',           dot: 'bg-error' },
  }[aiState]

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open:    { label: L('Open',    'مفتوح'),   color: 'var(--accent)',   icon: <Zap size={12} /> },
    pending: { label: L('Pending', 'معلق'),    color: 'var(--warning)',  icon: <Clock size={12} /> },
    closed:  { label: L('Resolved','محلول'),   color: 'var(--success)', icon: <CheckCircle size={12} /> },
  }
  const currentStatus = statusConfig[conv.status] ?? statusConfig.open

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface flex-shrink-0">
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
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-end flex items-center justify-center text-white text-xs font-black flex-shrink-0">
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
            {conv.bot?.name && (
              <div className="relative flex items-center">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                  <Bot size={10} />
                  {conv.bot.name}
                </span>
                {availableBots.length > 0 && onBotChange && (
                  <div className="relative">
                    <button
                      onClick={() => setBotDropdownOpen(v => !v)}
                      disabled={isUpdatingBot}
                      className="ml-1 p-0.5 rounded hover:bg-surface-elevated text-text-tertiary hover:text-accent transition-colors disabled:opacity-50"
                      title={isRTL ? 'تغيير البوت' : 'Switch Bot'}
                    >
                      {isUpdatingBot ? <Loader2 size={10} className="animate-spin" /> : <ChevronDown size={10} />}
                    </button>
                    {botDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-44 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => { onBotChange(null); setBotDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            !conv.bot_id ? 'text-accent bg-accent-subtle' : 'text-text-secondary hover:bg-surface'
                          }`}
                        >
                          {isRTL ? 'بدون بوت' : 'No Bot'}
                        </button>
                        {availableBots.map(bot => (
                          <button
                            key={bot.id}
                            onClick={() => { onBotChange(bot.id); setBotDropdownOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              conv.bot_id === bot.id ? 'text-accent bg-accent-subtle' : 'text-text-secondary hover:bg-surface'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Bot size={11} />
                              {bot.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setStatusOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-border hover:bg-surface-elevated transition-colors"
          style={{ color: currentStatus.color }}
        >
          {currentStatus.icon}
          {currentStatus.label}
          <ChevronDown size={11} />
        </button>
        {statusOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { onStatusChange(key as any); setStatusOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface transition-colors"
                style={{ color: cfg.color }}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agent Assignment */}
      {availableAgents.length > 0 && onAgentChange && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setAgentDropdownOpen(v => !v)}
            disabled={isUpdatingAgent}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border border-border hover:bg-surface-elevated transition-colors disabled:opacity-50"
            style={{ color: conv.assigned_agent_id ? 'var(--accent)' : 'var(--text-tertiary)' }}
          >
            {isUpdatingAgent ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <User size={10} />
            )}
            {conv.assigned_agent_id
              ? (availableAgents.find(a => a.id === conv.assigned_agent_id)?.name ?? L('Assigned', 'معين'))
              : L('Unassigned', 'غير معين')
            }
            <ChevronDown size={9} />
          </button>
          {agentDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => { onAgentChange(null); setAgentDropdownOpen(false) }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  !conv.assigned_agent_id ? 'text-accent bg-accent-subtle' : 'text-text-secondary hover:bg-surface'
                }`}
              >
                {L('Unassigned', 'غير معين')}
              </button>
              {availableAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => { onAgentChange(agent.id); setAgentDropdownOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-1.5 ${
                    conv.assigned_agent_id === agent.id ? 'text-accent bg-accent-subtle' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  <User size={11} />
                  {agent.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* More actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setActionsOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary transition-colors"
        >
          <MoreHorizontal size={15} />
        </button>
        {actionsOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            {[
              { icon: UserPlus,    label: L('Assign',   'تعيين') },
              { icon: ArrowRight,  label: L('Transfer', 'نقل') },
              { icon: Clock,       label: L('Snooze',   'تأجيل') },
              { icon: Archive,     label: L('Archive',  'أرشفة') },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setActionsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <item.icon size={13} /> {item.label}
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
