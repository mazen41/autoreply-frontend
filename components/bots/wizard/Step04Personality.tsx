'use client'

import React, { useState } from 'react'
import { Sparkles, MessageSquare, Sliders, ShieldAlert, Undo2, Check, UserCheck, Flame } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { PERSONA_TEMPLATES, PersonaTemplate } from './types'

interface Step04PersonalityProps {
  instructions: string
  setInstructions: (val: string) => void
  replyStyle: string
  setReplyStyle: (val: string) => void
  confidenceThreshold: number
  setConfidenceThreshold: (val: number) => void
  escalationKeywords: string[]
  setEscalationKeywords: React.Dispatch<React.SetStateAction<string[]>>
  escalationIntents: string[]
  setEscalationIntents: React.Dispatch<React.SetStateAction<string[]>>
  onPersonalityChange?: () => void
  errors?: Record<string, string>
}

export default function Step04Personality({
  instructions,
  setInstructions,
  replyStyle,
  setReplyStyle,
  confidenceThreshold,
  setConfidenceThreshold,
  escalationKeywords,
  setEscalationKeywords,
  escalationIntents,
  setEscalationIntents,
  onPersonalityChange,
  errors = {},
}: Step04PersonalityProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  const [keywordInput, setKeywordInput] = useState('')
  const [intentInput, setIntentInput] = useState('')
  const [undoSnapshot, setUndoSnapshot] = useState<{ instructions: string; style: string } | null>(null)

  const applyPreset = (preset: PersonaTemplate) => {
    setUndoSnapshot({ instructions, style: replyStyle })
    setInstructions(isRTL ? preset.instructionsAr : preset.instructionsEn)
    setReplyStyle(isRTL ? preset.toneAr : preset.toneEn)
    if (onPersonalityChange) onPersonalityChange()
  }

  const revertPreset = () => {
    if (!undoSnapshot) return
    setInstructions(undoSnapshot.instructions)
    setReplyStyle(undoSnapshot.style)
    setUndoSnapshot(null)
  }

  const addKeyword = () => {
    const trimmed = keywordInput.trim().replace(/,+$/, '')
    if (trimmed && !escalationKeywords.includes(trimmed)) {
      setEscalationKeywords((cur) => [...cur, trimmed])
      setKeywordInput('')
      if (onPersonalityChange) onPersonalityChange()
    }
  }

  const removeKeyword = (item: string) => {
    setEscalationKeywords((cur) => cur.filter((k) => k !== item))
  }

  const addIntent = () => {
    const trimmed = intentInput.trim().replace(/,+$/, '')
    if (trimmed && !escalationIntents.includes(trimmed)) {
      setEscalationIntents((cur) => [...cur, trimmed])
      setIntentInput('')
      if (onPersonalityChange) onPersonalityChange()
    }
  }

  const removeIntent = (item: string) => {
    setEscalationIntents((cur) => cur.filter((i) => i !== item))
  }

  const toneOptions = [
    { id: 'Friendly & Professional', labelEn: 'Friendly & Professional', labelAr: 'ودود ومهني' },
    { id: 'Formal & Authoritative', labelEn: 'Formal & Authoritative', labelAr: 'رسمي وموثوق' },
    { id: 'Enthusiastic & Engaging', labelEn: 'Enthusiastic & Engaging', labelAr: 'حماسي وجذاب' },
    { id: 'Direct & Concise', labelEn: 'Direct & Concise', labelAr: 'مباشر وموجز' },
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 04 · شخصية الوكيل' : 'Step 04 · Bot Personality'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {copy.step4Title || (isRTL ? 'امنح مساعدك شخصيته الفريدة' : 'Give your assistant its own personality')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step4Subtitle ||
            (isRTL
              ? 'اختر قالباً جاهزاً أو صمّم تعليمات الذكاء الاصطناعي ونبرة الرد وحدود صلاحيات الوكيل.'
              : 'Pick a proven preset or craft custom instructions, tone of voice, and escalation rules.')}
        </p>
      </div>

      {/* ── Presets Section ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {copy.presetsTitle || (isRTL ? 'نماذج شخصية جاهزة' : 'Personality Presets')}
          </label>
          {undoSnapshot && (
            <button
              type="button"
              onClick={revertPreset}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              <Undo2 size={13} />
              <span>{isRTL ? 'تراجع عن القالب' : 'Undo Template'}</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PERSONA_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-surface-elevated/40 p-4 text-start transition-all hover:border-purple-500/50 hover:bg-surface-elevated/80 focus:outline-none"
            >
              <div>
                <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  {isRTL ? preset.titleAr : preset.titleEn}
                </span>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {isRTL ? preset.descAr : preset.descEn}
                </p>
              </div>
              <span className="mt-3 inline-block text-[11px] font-semibold text-purple-400">
                {isRTL ? preset.toneAr : preset.toneEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Instructions Editor ───────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="bot-instructions" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {copy.customInstructions || (isRTL ? 'تعليمات الوكيل المفصلة (System Prompt)' : 'Detailed Bot Instructions')}
            <span className="text-rose-400 ms-1">*</span>
          </label>
          <span className="text-[11px] text-text-tertiary">
            {copy.instructionsCount
              ? copy.instructionsCount.replace('{count}', String(instructions.length))
              : `${instructions.length} ${isRTL ? 'حرف' : 'chars'}`}
          </span>
        </div>
        <textarea
          id="bot-instructions"
          rows={5}
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value)
            if (onPersonalityChange) onPersonalityChange()
          }}
          placeholder={isRTL ? 'اكتب بالتفصيل أسلوب رد الوكيل، التحية، الكلمات المفضلة، وكيفية مساعدة العملاء...' : 'Describe how your bot should greet customers, answer questions, and represent your brand...'}
          className={`w-full rounded-2xl border bg-surface-elevated/70 p-4 text-sm leading-relaxed text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-all resize-y ${
            errors.instructions
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'
          }`}
        />
        {errors.instructions && (
          <p className="text-xs text-rose-400 font-medium">{errors.instructions}</p>
        )}
      </div>

      {/* ── Tone of Voice Selector ───────────────────────────── */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
          {copy.toneTitle || (isRTL ? 'نبرة الردود' : 'Response Tone')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {toneOptions.map((tone) => {
            const isSelected = replyStyle === tone.id || replyStyle === (isRTL ? tone.labelAr : tone.labelEn)
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => {
                  setReplyStyle(isRTL ? tone.labelAr : tone.labelEn)
                  if (onPersonalityChange) onPersonalityChange()
                }}
                className={`rounded-xl border p-3 text-center transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/15 text-white font-bold ring-1 ring-purple-500/40'
                    : 'border-white/[0.08] bg-surface-elevated/40 text-text-secondary hover:text-white hover:bg-surface-elevated/80'
                }`}
              >
                <span className="text-xs block truncate">{isRTL ? tone.labelAr : tone.labelEn}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Confidence Threshold & Human Escalation ──────────── */}
      <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-surface-elevated/30 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-purple-400" />
          <h2 className="text-sm font-bold text-white">
            {copy.confidenceThreshold || (isRTL ? 'حد الثقة والتحويل البشري' : 'Confidence Threshold & Human Escalation')}
          </h2>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">
              {isRTL ? 'الحد الأدنى لثقة الإجابة:' : 'Minimum reply confidence:'}
            </span>
            <span className="font-extrabold text-purple-400 text-sm tabular-nums">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={Math.round(confidenceThreshold * 100)}
            onChange={(e) => {
              setConfidenceThreshold(Number(e.target.value) / 100)
              if (onPersonalityChange) onPersonalityChange()
            }}
            className="w-full accent-purple-500 h-2 bg-surface-elevated rounded-lg cursor-pointer"
          />
          <p className="text-[11px] text-text-tertiary">
            {copy.confidenceDesc
              ? copy.confidenceDesc.replace('{value}', String(Math.round(confidenceThreshold * 100)))
              : `${isRTL ? 'الردود الأقل ثقة من' : 'Replies below'} ${Math.round(confidenceThreshold * 100)}% ${isRTL ? 'يتم تحويلها تلقائياً لفريق الدعم البشري.' : 'are escalated to human support.'}`}
          </p>
        </div>

        {/* Escalation Keywords Chips */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <label className="text-xs font-semibold text-text-secondary block">
            {copy.escalationKeywords || (isRTL ? 'كلمات التحويل الفوري للبشر' : 'Instant Escalation Keywords')}
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-surface-elevated/60 p-2.5">
            {escalationKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 text-xs font-medium text-purple-200"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(kw)}
                  className="text-purple-300 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addKeyword()
                }
              }}
              onBlur={addKeyword}
              placeholder={copy.addKeywordPrompt || (isRTL ? 'اكتب كلمة واضغط Enter' : 'Type keyword & press Enter')}
              className="flex-1 min-w-[140px] bg-transparent text-xs text-white placeholder:text-text-tertiary focus:outline-none px-1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
