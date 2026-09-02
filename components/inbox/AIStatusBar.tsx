'use client'

import React from 'react'
import { ApiConversation } from '../../hooks/useInbox'
import { Zap, Activity, Globe2, BrainCircuit, AlertTriangle } from 'lucide-react'

interface AIStatusBarProps {
  conv: ApiConversation
  isRTL: boolean
}

export default function AIStatusBar({ conv, isRTL }: AIStatusBarProps) {
  if (!conv.ai_enabled && !(conv as any).requires_human) return null

  const L = (en: string, ar: string) => isRTL ? ar : en
  const intent = conv.intent
  const confidence = conv.confidence || 0
  const dialect = (conv.latest_message as any)?.detected_dialect

  // Mock sentiment based on confidence for visual purposes (since backend might not send it explicitly yet)
  const sentiment = confidence > 0.8 ? 'positive' : confidence < 0.4 ? 'negative' : 'neutral'
  const sentimentConfig = {
    positive: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    neutral:  { color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    negative: { color: 'text-rose-500',    bg: 'bg-rose-500/10' },
  }[sentiment]

  return (
    <div className="flex items-center gap-4 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 overflow-x-auto scrollbar-none text-xs">
      {/* State Badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <BrainCircuit size={12} className="text-indigo-500" />
        <span className="font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[9px]">
          {L('AI Insights', 'رؤى الذكاء الاصطناعي')}
        </span>
      </div>

      <div className="w-px h-3 bg-indigo-200 dark:bg-indigo-800 flex-shrink-0" />

      {/* Intent */}
      {intent ? (
        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-700 dark:text-gray-300">
          <Zap size={11} className="text-amber-500" />
          <span className="font-medium">Intent:</span>
          <span className="font-bold">{intent}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-400">
          <Zap size={11} />
          <span>Analyzing intent...</span>
        </div>
      )}

      {/* Sentiment */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md flex-shrink-0 ${sentimentConfig.bg} ${sentimentConfig.color}`}>
        <Activity size={11} />
        <span className="font-bold capitalize text-[10px]">{sentiment}</span>
      </div>

      {/* Language / Dialect */}
      {dialect && (
        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5">
          <Globe2 size={11} className="text-indigo-400" />
          <span className="font-medium text-[10px]">{dialect}</span>
        </div>
      )}

      {/* Confidence Bar */}
      {confidence > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto" title={`Confidence: ${(confidence * 100).toFixed(0)}%`}>
          <span className="text-[10px] text-gray-500 font-medium">Confidence</span>
          <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${confidence > 0.8 ? 'bg-emerald-500' : confidence > 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Escalation Warning */}
      {(conv as any).requires_human && (
        <div className="flex items-center gap-1.5 flex-shrink-0 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/50">
          <AlertTriangle size={11} />
          <span className="font-bold text-[10px] uppercase">Human Intervention Required</span>
        </div>
      )}
    </div>
  )
}
