'use client'

import React, { useState } from 'react'
import { ApiConversation } from '../../hooks/useInbox'
import { Zap, Activity, Globe2, BrainCircuit, AlertTriangle, ChevronDown } from 'lucide-react'

interface AIStatusBarProps {
  conv: ApiConversation
  isRTL: boolean
}

export default function AIStatusBar({ conv, isRTL }: AIStatusBarProps) {
  const [expanded, setExpanded] = useState(false)
  if (!conv.ai_enabled && !(conv as any).requires_human) return null

  const L = (en: string, ar: string) => isRTL ? ar : en
  const intent = conv.intent
  const confidence = conv.confidence || 0
  const dialect = (conv.latest_message as any)?.detected_dialect
  const requiresHuman = (conv as any).requires_human

  // Derive sentiment from intent and confidence — greetings/inquiries default to neutral.
  // NOTE: this is a frontend heuristic, not a value returned by AI processing.
  // Flagged in the implementation report — if the backend starts returning a
  // real sentiment field, prefer that over this derivation.
  const greetingIntents = ['greeting', 'hello', 'hi', 'welcome', 'question', 'general']
  const isGreeting = !conv.intent || greetingIntents.includes(conv.intent.toLowerCase())
  const sentiment = isGreeting
    ? 'neutral'
    : confidence > 0.8 ? 'positive' : confidence < 0.4 ? 'negative' : 'neutral'
  const sentimentConfig = {
    positive: { color: 'text-success', bg: 'bg-success-subtle' },
    neutral: { color: 'text-info', bg: 'bg-info-subtle' },
    negative: { color: 'text-warning', bg: 'bg-warning-subtle' },
  }[sentiment]

  const items: Array<{ key: string; node: React.ReactNode }> = []

  items.push({
    key: 'intent',
    node: intent ? (
      <div className="flex items-center gap-1.5 text-text-secondary">
        <Zap size={11} className="text-warning" />
        <span className="font-medium">{L('Intent', 'النية')}</span>
        <span className="font-semibold text-text-primary">{intent}</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 text-text-tertiary">
        <Zap size={11} />
        <span>{L('Analyzing intent…', 'جارٍ تحليل النية…')}</span>
      </div>
    ),
  })

  items.push({
    key: 'sentiment',
    node: (
      <div className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 ${sentimentConfig.bg} ${sentimentConfig.color}`}>
        <Activity size={11} />
        <span className="font-semibold capitalize">{isRTL ? ({ positive: 'إيجابي', neutral: 'محايد', negative: 'سلبي' } as const)[sentiment] : sentiment}</span>
      </div>
    ),
  })

  if (dialect) {
    items.push({
      key: 'dialect',
      node: (
        <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-text-secondary">
          <Globe2 size={11} className="text-brand" />
          <span className="font-medium">{dialect}</span>
        </div>
      ),
    })
  }

  return (
    <div className="border-b border-border bg-surface-elevated text-[11px]">
      <div className="flex items-center gap-3 overflow-x-auto px-3 py-1.5 scrollbar-none">
        <div className="flex shrink-0 items-center gap-1.5 text-brand">
          <BrainCircuit size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">{L('AI Insights', 'رؤى الذكاء الاصطناعي')}</span>
        </div>
        <div className="h-3 w-px shrink-0 bg-border" />

        {items.map(it => <div key={it.key} className="shrink-0">{it.node}</div>)}

        {requiresHuman && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-error/20 bg-error-subtle px-2 py-0.5 text-error">
            <AlertTriangle size={11} />
            <span className="text-[10px] font-bold uppercase">{L('Human Intervention Required', 'يتطلب تدخلًا بشريًا')}</span>
          </div>
        )}

        {confidence > 0 && (
          <div className="ms-auto flex shrink-0 items-center gap-2" title={`${L('Confidence', 'الثقة')}: ${(confidence * 100).toFixed(0)}%`}>
            <span className="font-medium text-text-tertiary">{L('Confidence', 'الثقة')}</span>
            <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${confidence > 0.8 ? 'bg-success' : confidence > 0.5 ? 'bg-warning' : 'bg-error'}`}
                style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="ms-1 shrink-0 rounded-md p-1 text-text-tertiary hover:bg-surface-hover"
          aria-expanded={expanded}
          aria-label={L('Toggle AI insight details', 'إظهار/إخفاء تفاصيل رؤى الذكاء الاصطناعي')}
        >
          <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2 text-text-secondary">
          {L('No additional AI insight details are available for this conversation yet.', 'لا تتوفر تفاصيل إضافية لرؤى الذكاء الاصطناعي لهذه المحادثة حتى الآن.')}
        </div>
      )}
    </div>
  )
}
