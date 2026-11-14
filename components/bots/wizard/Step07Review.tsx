'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { Sparkles, Check, Edit3, CheckCircle2, ArrowRight, Bot, Store, MessageCircle, Brain, Sliders, Shield } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { BotAvatarOption, ChannelRecord, KnowledgeAssignment, BotCapabilitiesState } from './types'
import ChannelIcon from '../../ui/ChannelIcon'

interface Step07ReviewProps {
  avatar: BotAvatarOption
  botName: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  channels: ChannelRecord[]
  selectedChannelIds: number[]
  ecommerceConnectionIds: number[]
  assignments: KnowledgeAssignment[]
  instructions: string
  replyStyle: string
  confidenceThreshold: number
  escalationKeywords: string[]
  capabilities: BotCapabilitiesState
  onEditStep: (stepNumber: number) => void
  isSuccess?: boolean
  createdBotId?: number | null
  mode?: 'create' | 'edit'
}

export default function Step07Review({
  avatar,
  botName,
  description,
  status,
  channels,
  selectedChannelIds,
  ecommerceConnectionIds,
  assignments,
  instructions,
  replyStyle,
  confidenceThreshold,
  escalationKeywords,
  capabilities,
  onEditStep,
  isSuccess = false,
  createdBotId = null,
  mode = 'create',
}: Step07ReviewProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}
  const celebrationRef = useRef<HTMLDivElement>(null)

  const selectedChannelsList = channels.filter((c) => selectedChannelIds.includes(c.id))
  const selectedStoresList = channels.filter((c) => ecommerceConnectionIds.includes(c.id))
  const uniqueKnowledgeCount = new Set(assignments.map((a) => a.file_id)).size

  // GSAP celebration when isSuccess triggers
  useEffect(() => {
    if (!isSuccess || !celebrationRef.current) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    gsap.fromTo(
      celebrationRef.current,
      { scale: 0.9, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)' }
    )
  }, [isSuccess])

  // If successfully created in backend, render Grand Celebration View
  if (isSuccess) {
    return (
      <div
        ref={celebrationRef}
        className="flex flex-col items-center justify-center text-center py-8 px-4 space-y-6 max-w-xl mx-auto animate-fadeIn"
      >
        {/* Animated Success Badge */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/40 bg-emerald-500/10 shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 size={44} className="text-emerald-400 animate-pulse" />
          <span className="absolute -inset-2 rounded-3xl border border-emerald-400/20 animate-ping" />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-300">
            {mode === 'edit'
              ? isRTL ? 'تم التحديث بنجاح' : 'Updated & Synced'
              : isRTL ? 'تم التدشين بنجاح' : 'Ready & Deployed'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {mode === 'edit'
              ? copy.editSuccessHeading || (isRTL ? 'تم تحديث الوكيل بنجاح' : 'Bot Updated Successfully')
              : copy.successHeading || (isRTL ? 'تهانينا! أصبح وكيلك الذكي جاهزاً للعمل' : 'Congratulations! Your Bot is Alive')}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            {mode === 'edit'
              ? copy.editSuccessMessage || (isRTL ? `تم حفظ كافة التعديلات على الوكيل "${botName}" وتحديث إعدادات القنوات بنجاح.` : `All changes to "${botName}" have been saved and synced across all channels.`)
              : copy.successMessage || (isRTL ? `تم إنشاء الوكيل "${botName}" بنجاح وتجهيز كافة القنوات المعينة لبدء تقديم الردود فوراً.` : `Your bot "${botName}" was created successfully and is ready to deliver fast, delightful customer experiences.`)}
          </p>
        </div>

        {/* Selected Bot Avatar Card */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface-elevated/60 px-6 py-4 shadow-xl">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden p-1 border border-white/10 bg-surface">
            <Image
              src={avatar.image}
              alt={botName}
              width={52}
              height={52}
              className="object-contain"
            />
          </div>
          <div className="text-start">
            <h3 className="text-base font-bold text-white">{botName}</h3>
            <p className="text-xs text-brand font-semibold">
              {isRTL ? avatar.titleAr : avatar.titleEn}
            </p>
          </div>
        </div>

        {/* Action to Return to Bots Page */}
        <Link
          href="/dashboard/bots"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand via-brand-violet to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand/25 transition-all hover:brightness-110 active:scale-[0.99]"
        >
          <span>{copy.viewInDashboard || (isRTL ? 'الانتقال إلى قائمة الوكلاء' : 'Go to Bots Dashboard')}</span>
          <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
        </Link>
      </div>
    )
  }

  // Pre-creation Review Breakdown
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 07 · المراجعة والتدشين' : 'Step 07 · Review & Create'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {copy.step7Title || (isRTL ? 'مساعدك جاهز للانطلاق' : 'Your assistant is ready')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step7Subtitle ||
            (isRTL
              ? 'راجع ملخص إعدادات الوكيل وقنواته وقدراته، ثم اضغط على زر الإنشاء لتدشينه رسمياً.'
              : 'Review your assistant configuration and deploy your AI assistant live.')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Section 1: Identity */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface-elevated/40 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              <Bot size={15} className="text-brand" />
              <span>{copy.reviewIdentity || (isRTL ? 'هوية الوكيل' : 'Bot Identity')}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              <Edit3 size={13} />
              <span>{copy.editStep || (isRTL ? 'تعديل' : 'Edit')}</span>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3.5">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden p-1 border border-white/10 bg-surface shrink-0">
              <Image src={avatar.image} alt={botName} width={44} height={44} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{botName}</span>
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 capitalize">
                  {status}
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                {isRTL ? avatar.nameAr : avatar.nameEn} · {isRTL ? avatar.titleAr : avatar.titleEn}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Channels & Stores */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface-elevated/40 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              <MessageCircle size={15} className="text-cyan-400" />
              <span>{copy.reviewChannels || (isRTL ? 'القنوات والمتاجر' : 'Channels & Stores')}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
            >
              <Edit3 size={13} />
              <span>{copy.editStep || (isRTL ? 'تعديل' : 'Edit')}</span>
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedChannelsList.length > 0 ? (
                selectedChannelsList.map((ch) => (
                  <span
                    key={ch.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white"
                  >
                    <ChannelIcon type={ch.type as any} size={14} />
                    <span>{ch.page_name || ch.type}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-tertiary">
                  {isRTL ? 'لم يتم تعيين أي قناة اتصال' : 'No communication channels selected'}
                </span>
              )}
            </div>
            {selectedStoresList.length > 0 && (
              <div className="pt-2 text-xs text-text-secondary flex items-center gap-1.5">
                <Store size={14} className="text-cyan-400 shrink-0" />
                <span>
                  {isRTL ? 'المتجر المرتبط:' : 'Linked Store:'}{' '}
                  {selectedStoresList.map((s) => s.page_name || s.type).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Knowledge Base */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface-elevated/40 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              <Brain size={15} className="text-teal-400" />
              <span>{copy.reviewKnowledge || (isRTL ? 'قاعدة المعرفة' : 'Knowledge Base')}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:underline"
            >
              <Edit3 size={13} />
              <span>{copy.editStep || (isRTL ? 'تعديل' : 'Edit')}</span>
            </button>
          </div>
          <div className="mt-3">
            <p className="text-xs text-white font-medium">
              {uniqueKnowledgeCount}{' '}
              {isRTL ? 'ملف معرفة مخصص لهذا الوكيل' : 'knowledge documents attached'}
            </p>
          </div>
        </div>

        {/* Section 4: Persona & Voice */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface-elevated/40 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              <Sliders size={15} className="text-purple-400" />
              <span>{copy.reviewPersonality || (isRTL ? 'الشخصية والنبرة' : 'Persona & Voice')}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:underline"
            >
              <Edit3 size={13} />
              <span>{copy.editStep || (isRTL ? 'تعديل' : 'Edit')}</span>
            </button>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">{isRTL ? 'النبرة:' : 'Tone:'}</span>
              <span className="font-semibold text-white">{replyStyle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">{isRTL ? 'حد الثقة:' : 'Confidence:'}</span>
              <span className="font-semibold text-purple-400">{Math.round(confidenceThreshold * 100)}%</span>
            </div>
            {escalationKeywords.length > 0 && (
              <div className="flex items-center gap-2 text-text-tertiary">
                <span>{isRTL ? 'كلمات التحويل:' : 'Escalation:'}</span>
                <span className="text-white truncate">{escalationKeywords.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Capabilities */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface-elevated/40 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              <Shield size={15} className="text-pink-400" />
              <span>{copy.reviewCapabilities || (isRTL ? 'القدرات المفعلة' : 'Enabled Capabilities')}</span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(5)}
              className="inline-flex items-center gap-1 text-xs font-bold text-pink-400 hover:underline"
            >
              <Edit3 size={13} />
              <span>{copy.editStep || (isRTL ? 'تعديل' : 'Edit')}</span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(capabilities)
              .filter(([_, val]) => val)
              .map(([key]) => (
                <span
                  key={key}
                  className="rounded-lg bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 text-xs font-semibold text-pink-300"
                >
                  {key}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
