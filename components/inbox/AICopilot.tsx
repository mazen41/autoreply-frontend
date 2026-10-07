'use client'

import { ApiConversation } from '../../hooks/useInbox'
import { Sparkles, X } from 'lucide-react'

interface AICopilotProps {
  conv: ApiConversation
  isRTL: boolean
  onInsertReply: (text: string) => void
  onClose: () => void
}

export default function AICopilot({ conv, isRTL, onInsertReply, onClose }: AICopilotProps) {
  void onInsertReply
  if (!conv.ai_enabled) return null
  const text = isRTL
    ? 'اقتراحات المساعد غير متاحة حاليًا لهذه المحادثة.'
    : 'AI Copilot suggestions are not available for this conversation yet.'
  return <div role="status" className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-xs text-text-secondary">
    <span className="flex items-center gap-2"><Sparkles size={14} className="text-brand" />{text}</span>
    <button type="button" aria-label={isRTL ? 'إغلاق' : 'Close'} onClick={onClose} className="rounded p-1 text-text-muted hover:text-text-primary"><X size={14} /></button>
  </div>
}
