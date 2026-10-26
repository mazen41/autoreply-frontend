'use client'

import React, { useRef, useState } from 'react'
import { CHANNELS, ChannelType, SAMPLE_VALUES, VARIABLES } from './types'
import { useLang } from '../../lib/LangContext'

interface Props {
  value: string
  onChange: (value: string) => void
  channels: ChannelType[]
  error?: string
}

export default function MessageEditor({ value, onChange, channels, error }: Props) {
  const { isRTL } = useLang()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [previewChannel, setPreviewChannel] = useState<ChannelType>(channels[0] || 'whatsapp')
  const activeChannel = channels.includes(previewChannel) ? previewChannel : channels[0] || 'whatsapp'

  const insertVariable = (tag: string) => {
    const el = ref.current
    if (!el) {
      onChange((value || '') + tag)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    onChange(value.slice(0, start) + tag + value.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + tag.length
      el.setSelectionRange(pos, pos)
    })
  }

  const previewText = (value || '').replace(/\{\{(\w+)\}\}/g, (m, k) => SAMPLE_VALUES[k] ?? m)

  return (
    <div className="space-y-3">
      <div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={isRTL ? 'اكتب الرسالة التي ستصل إلى العميل…' : 'Write the message your customer will receive…'}
          aria-invalid={!!error}
          className={`w-full rounded-lg border bg-surface-elevated p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 resize-y ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-border focus:border-brand focus:ring-brand/30'
          }`}
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-text-tertiary">
          <span className={error ? 'text-error font-medium' : ''}>{error || ' '}</span>
          <span>{value.length} {isRTL ? 'حرفًا' : 'characters'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-[11px] font-semibold text-text-tertiary">{isRTL ? 'إدراج:' : 'Insert:'}</span>
        {VARIABLES.map((v) => (
          <button
            key={v.tag}
            type="button"
            onClick={() => insertVariable(v.tag)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary hover:border-brand/40 hover:text-brand transition-colors"
          >
            {isRTL ? ({ Name: 'الاسم', Business: 'النشاط', Product: 'المنتج', 'Order #': 'رقم الطلب', Total: 'الإجمالي', Tracking: 'التتبع' }[v.label] || v.label) : v.label}
          </button>
        ))}
      </div>

      {value.trim() && (
        <div className="rounded-xl bg-surface border border-border/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{isRTL ? 'معاينة' : 'Preview'}</span>
            {channels.length > 1 && (
              <div className="flex gap-1">
                {channels.map((c) => {
                  const meta = CHANNELS.find((x) => x.id === c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPreviewChannel(c)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        c === activeChannel ? 'bg-brand/10 text-brand' : 'text-text-tertiary hover:text-text-primary'
                      }`}
                    >
                      {meta?.label || c}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-brand/10 border border-brand/20 px-3 py-2 text-sm text-text-primary">
              {previewText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
