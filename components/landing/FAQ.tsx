'use client'

import React, { useState, useRef, useEffect } from 'react'
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
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className={`text-3xl sm:text-4xl font-black text-center mb-12 ${isRTL ? 'font-arabic' : ''}`}
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
        >
          {t.faq.title}
        </h2>

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
