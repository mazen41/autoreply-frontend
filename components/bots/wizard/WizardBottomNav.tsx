'use client'

import React from 'react'
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Sparkles } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'

interface WizardBottomNavProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  isSubmitting?: boolean
  canProceed?: boolean
  dirty?: boolean
}

export default function WizardBottomNav({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting = false,
  canProceed = true,
  dirty = false,
}: WizardBottomNavProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  const isFinalStep = currentStep === totalSteps

  return (
    <footer className="relative z-30 shrink-0 border-t border-white/[0.08] bg-[#070b14]/90 px-4 sm:px-8 py-3.5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        {/* Previous Button */}
        <div>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-text-secondary transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              <span>{copy.back || (isRTL ? 'السابق' : 'Previous')}</span>
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>

        {/* Auto-save status indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>{copy.progressSaved || (isRTL ? 'التقدم محفوظ تلقائياً' : 'Progress saved')}</span>
        </div>

        {/* Next / Create Button */}
        <div>
          {isFinalStep ? (
            <button
              type="button"
              onClick={onNext}
              disabled={isSubmitting || !canProceed}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-brand via-brand-violet to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>{copy.creating || (isRTL ? 'جارٍ تدشين الوكيل...' : 'Creating Bot...')}</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>{copy.createBot || (isRTL ? 'إنشاء الوكيل الآن' : 'Create My Bot')}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={isSubmitting || !canProceed}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-violet px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <span>{copy.continue || (isRTL ? 'متابعة' : 'Continue')}</span>
              {isRTL ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
