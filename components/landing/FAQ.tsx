'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { useLang } from '../../lib/LangContext'

function AccordionItem({
  item, isOpen, onToggle, isRTL,
}: {
  item: { q: string; a: string }
  isOpen: boolean
  onToggle: () => void
  isRTL: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const panelId = useId()

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${isOpen ? 'color-mix(in srgb, var(--accent) 20%, var(--border))' : 'var(--border)'}`,
        background: isOpen ? 'var(--accent-subtle)' : 'var(--surface)',
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
        onClick={onToggle}
      >
        <span
          className={`font-semibold text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'} flex-1`}
          style={{ color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {item.q}
        </span>
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: isOpen ? 'var(--accent-subtle)' : 'var(--surface-elevated)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            color: isOpen ? 'var(--accent)' : 'var(--text-tertiary)',
          }}
        >
          +
        </div>
      </button>

      <div
        id={panelId}
        aria-hidden={!isOpen}
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div ref={contentRef} className="px-5 pb-5">
          <p
            className={`text-sm leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
            style={{ color: 'var(--text-secondary)' }}
          >
            {item.a}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const { t, isRTL } = useLang()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
        <h2
          className={`max-w-md text-balance text-3xl font-black sm:text-4xl ${isRTL ? 'font-arabic' : ''}`}
          style={{ color: 'var(--text-primary)' }}
        >
          {t.faq.title}
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'إجابات مباشرة عن إعداد مساحة العمل والقنوات والتكاملات.' : 'Clear answers about setting up your workspace, channels, and integrations.'}
        </p>
        </div>
        <div className="space-y-3">
          {t.faq.items.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              isRTL={isRTL}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
