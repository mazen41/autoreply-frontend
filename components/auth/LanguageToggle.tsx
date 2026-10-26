'use client'

import { useLang } from '../../lib/LangContext'
import type { CSSProperties } from 'react'

interface LanguageToggleProps {
  className?: string
  style?: CSSProperties
}

export default function LanguageToggle({ className = '', style }: LanguageToggleProps) {
  const { lang, toggleLang } = useLang()
  const label = lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-surface-elevated/90 px-3 text-xs font-bold text-text-secondary shadow-sm backdrop-blur transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${className}`}
      style={style}
    >
      {lang === 'ar' ? 'EN' : 'عربي'}
    </button>
  )
}
