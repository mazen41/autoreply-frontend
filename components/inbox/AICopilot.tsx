'use client'

import React, { useState } from 'react'
import { ApiConversation } from '../../hooks/useInbox'
import { Sparkles, FileText, ChevronDown, ChevronRight, X, ArrowRight, MessageSquareDashed } from 'lucide-react'

interface AICopilotProps {
  conv: ApiConversation
  isRTL: boolean
  onInsertReply: (text: string) => void
  onClose: () => void
}

export default function AICopilot({ conv, isRTL, onInsertReply, onClose }: AICopilotProps) {
  const [expanded, setExpanded] = useState(false)
  const L = (en: string, ar: string) => isRTL ? ar : en

  // Mock data for UI demonstration since we don't have this in API yet
  const suggestions = [
    L("Hello! Yes, the shipping to Riyadh takes 2-3 business days.", "مرحباً! نعم، الشحن إلى الرياض يستغرق 2-3 أيام عمل."),
    L("We accept Visa, MasterCard, and Apple Pay.", "نقبل الدفع عبر فيزا، ماستركارد، وأبل باي."),
    L("Can I have your order number to check the status?", "هل يمكنك تزويدي برقم الطلب للتحقق من الحالة؟")
  ]

  const knowledgeSources = [
    { title: "Shipping Policy 2024", type: "document", accuracy: "98%" },
    { title: "FAQ: Payment Methods", type: "faq", accuracy: "100%" }
  ]

  const summary = L(
    "Customer is asking about shipping times to Riyadh and payment methods. They seem ready to purchase.",
    "العميل يسأل عن أوقات الشحن إلى الرياض وطرق الدفع. يبدو أنه مستعد للشراء."
  )

  if (!conv.ai_enabled) return null

  return (
    <div className="mx-4 mb-3 border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-950/20 dark:to-[var(--surface-elevated)] rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles size={13} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">
            {L('AI Copilot', 'مساعد الذكاء الاصطناعي')}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-2">
            {expanded ? L('Click to collapse', 'انقر للطي') : L('3 suggestions available', '3 اقتراحات متاحة')}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {expanded ? <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
          <div className="w-px h-4 bg-[var(--divider)] mx-1" />
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 border-t border-[var(--divider)] space-y-4">
          
          {/* Summary */}
          <div className="bg-white dark:bg-black/20 rounded-lg p-2.5 border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquareDashed size={12} className="text-indigo-500" />
              <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wide">
                {L('Conversation Summary', 'ملخص المحادثة')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              {summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suggested Replies */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wide px-1">
                {L('Suggested Replies', 'ردود مقترحة')}
              </span>
              <div className="space-y-1.5">
                {suggestions.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => onInsertReply(text)}
                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group flex gap-2"
                  >
                    <div className="flex-1 text-xs text-[var(--text-primary)] line-clamp-2">
                      {text}
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge Sources */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] tracking-wide px-1">
                {L('Knowledge Used', 'المعرفة المستخدمة')}
              </span>
              <div className="space-y-1.5">
                {knowledgeSources.map((src, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-black/20 border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-indigo-400" />
                      <span className="text-xs text-[var(--text-primary)]">{src.title}</span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                      {src.accuracy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}
