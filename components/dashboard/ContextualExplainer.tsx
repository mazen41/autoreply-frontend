'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, HelpCircle, Check, ArrowRight, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { useLang } from '../../lib/LangContext'
import Link from 'next/link'

interface ContextualExplainerProps {
  id: string
  title: string
  whatItDoes: string
  whyItMatters: string
  whatYouCanDo: string
  whatHappensNext?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export default function ContextualExplainer({
  id,
  title,
  whatItDoes,
  whyItMatters,
  whatYouCanDo,
  whatHappensNext,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: ContextualExplainerProps) {
  const { isRTL } = useLang()
  const [dismissed, setDismissed] = useState(true) // Start true to prevent flash
  const [expanded, setExpanded] = useState(true)

  const storageKey = `naz_explainer_v2_${id}`

  useEffect(() => {
    try {
      const isDismissed = window.localStorage.getItem(storageKey) === 'true'
      setDismissed(isDismissed)
    } catch {
      setDismissed(false)
    }
  }, [storageKey])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(storageKey, 'true')
    } catch {
      // Ignore localStorage restrictions
    }
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 overflow-hidden rounded-2xl border border-brand/25 bg-surface-elevated/95 p-5 shadow-sm backdrop-blur-md"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 80% at 95% 10%, rgba(23, 105, 255, 0.05), transparent 70%)`,
        }}
      >
        {/* Accent top stripe */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-violet to-brand-cyan" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              {icon || <Lightbulb size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  {isRTL ? 'إرشاد وسياق القسم' : 'Section Guide'}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              </div>
              <h3 className="text-sm font-black text-text-primary">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
              title={isRTL ? 'إخفاء هذا الإرشاد' : 'Dismiss guide'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 pt-1">
            {/* 4 contextual pillars */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  {isRTL ? 'ماذا يفعل هذا القسم؟' : 'What it does'}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{whatItDoes}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-violet">
                  {isRTL ? 'لماذا هو مهم لنشاطك؟' : 'Why it matters'}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{whyItMatters}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-secondary/40 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan">
                  {isRTL ? 'ماذا يمكنك أن تفعل هنا؟' : 'What you can do'}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{whatYouCanDo}</p>
              </div>

              {whatHappensNext && (
                <div className="rounded-xl border border-border bg-surface-secondary/40 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-success">
                    {isRTL ? 'ماذا يحدث بعد الإجراء؟' : 'What happens next'}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{whatHappensNext}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
              <div className="flex items-center gap-2">
                {actionHref ? (
                  <Link
                    href={actionHref}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-hover"
                  >
                    <span>{actionLabel || (isRTL ? 'ابدأ الآن' : 'Get Started')}</span>
                    <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
                  </Link>
                ) : onAction && actionLabel ? (
                  <button
                    type="button"
                    onClick={onAction}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-hover"
                  >
                    <span>{actionLabel}</span>
                    <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-semibold text-text-tertiary transition-colors hover:text-text-primary hover:underline"
              >
                {isRTL ? 'فهمت، عدم إظهار هذا الشرح مرة أخرى' : 'Got it, do not show again'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
