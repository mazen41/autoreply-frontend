'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Sparkles, ShieldCheck } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'

interface WizardTopNavProps {
  currentStep: number
  totalSteps: number
  onExit: () => void
  dirty?: boolean
  mode?: 'create' | 'edit'
}

const STEP_TITLES_EN = [
  'Meet Your Bot',
  'Channels & Stores',
  'Knowledge Base',
  'Bot Personality',
  'Capabilities',
  'Test Your Bot',
  'Review & Create',
]

const STEP_TITLES_AR = [
  'لقاء الوكيل',
  'القنوات والمتاجر',
  'قاعدة المعرفة',
  'شخصية الوكيل',
  'القدرات الذكية',
  'تجربة الوكيل',
  'المراجعة والتدشين',
]

export default function WizardTopNav({
  currentStep,
  totalSteps,
  onExit,
  dirty = false,
  mode = 'create',
}: WizardTopNavProps) {
  const { isRTL, t } = useLang()
  const progressPercent = Math.min(100, Math.round((currentStep / totalSteps) * 100))
  const stepTitles = isRTL ? STEP_TITLES_AR : STEP_TITLES_EN

  return (
    <header className="relative z-30 shrink-0 border-b border-white/[0.08] bg-[#070b14]/85 px-4 sm:px-8 py-3.5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        {/* Brand Logo & Studio Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bots"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-gradient-to-br from-brand/20 to-brand-violet/20 shadow-lg shadow-brand/10">
              <Image
                src="/icons/logo_icon.png"
                alt="Naz AutoReply"
                width={22}
                height={22}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white">
                Naz <span className="text-brand">AutoReply</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                {mode === 'edit'
                  ? isRTL
                    ? 'تعديل الوكيل الذكي'
                    : 'Edit Bot Studio'
                  : isRTL
                  ? 'استوديو بناء الذكاء الاصطناعي'
                  : 'AI Bot Studio'}
              </span>
            </div>
          </Link>
        </div>

        {/* Step Indicator & Progress Pills (Desktop) */}
        <div className="hidden md:flex flex-col items-center gap-1.5 flex-1 max-w-md mx-6">
          <div className="flex items-center justify-between w-full text-xs font-semibold">
            <span className="text-brand flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand animate-pulse" />
              {isRTL ? `الخطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </span>
            <span className="text-text-secondary truncate max-w-[200px]">
              {stepTitles[currentStep - 1]}
            </span>
          </div>

          {/* Stepped Progress Track */}
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-brand via-brand-violet to-cyan-400 transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Glowing leading dot */}
              <div className="absolute top-0 end-0 h-full w-2 bg-white rounded-full blur-[1px] opacity-80" />
            </div>
          </div>
        </div>

        {/* Exit Action */}
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
          title={isRTL ? 'خروج من المعالج' : 'Exit Wizard'}
        >
          <span className="hidden sm:inline">{isRTL ? 'خروج' : 'Exit'}</span>
          <X size={15} />
        </button>
      </div>

      {/* Mobile Progress Bar (Underneath) */}
      <div className="md:hidden mt-2.5 w-full h-1 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand to-cyan-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  )
}
