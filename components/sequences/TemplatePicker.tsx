'use client'

import React from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { SequenceTemplate, TEMPLATES, TRIGGERS } from './types'

interface Props {
  onPick: (template: SequenceTemplate | null) => void
}

export default function TemplatePicker({ onPick }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">How do you want to start?</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Pick a ready-made sequence and just edit the text — you can change everything afterwards.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const trigger = TRIGGERS.find((x) => x.id === t.trigger)
          const steps = t.build()
          const messages = steps.filter((s) => s.step_type === 'message').length
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-left transition-colors hover:border-brand/50"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{t.emoji}</span>
                <ArrowRight size={16} className="text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{t.name}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{t.description}</p>
              </div>
              <p className="text-[11px] text-text-tertiary">
                {trigger?.icon} {trigger?.label} · {messages} message{messages === 1 ? '' : 's'}
              </p>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPick(null)}
          className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-border p-4 text-left transition-colors hover:border-brand/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary">
            <Plus size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">Start from scratch</p>
            <p className="mt-0.5 text-xs text-text-secondary">One empty message — build it your way.</p>
          </div>
        </button>
      </div>
    </div>
  )
}
