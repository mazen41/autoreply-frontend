'use client'

import React from 'react'
import { CHANNELS, ChannelType, TriggerType } from './types'

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  helper,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
  helper?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {helper && <p className="mt-0.5 text-xs text-text-tertiary">{helper}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          checked ? 'bg-brand' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

interface Props {
  channels: ChannelType[]
  onChannelsChange: (c: ChannelType[]) => void
  description: string
  onDescriptionChange: (v: string) => void
  stopOnReply: boolean
  onStopOnReplyChange: (v: boolean) => void
  allowReentry: boolean
  onAllowReentryChange: (v: boolean) => void
  triggerType: TriggerType
}

export default function SettingsPanel({
  channels,
  onChannelsChange,
  description,
  onDescriptionChange,
  stopOnReply,
  onStopOnReplyChange,
  allowReentry,
  onAllowReentryChange,
  triggerType,
}: Props) {
  const toggleChannel = (id: ChannelType) => {
    if (channels.includes(id)) {
      if (channels.length === 1) return
      onChannelsChange(channels.filter((c) => c !== id))
    } else {
      onChannelsChange([...channels, id])
    }
  }

  const noReply = triggerType === 'no_reply'

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-surface-elevated p-5">
      <h3 className="text-sm font-bold text-text-primary">Settings</h3>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary">Send on</p>
        <div className="flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => {
            const on = channels.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleChannel(c.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  on
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-border bg-surface text-text-secondary hover:border-border-hover'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-text-tertiary">Contacts on other channels won&apos;t receive this sequence.</p>
        {channels.length === 0 && (
          <p role="status" className="text-xs font-medium text-amber-700">
            Choose at least one channel before saving. No channel is selected by default.
          </p>
        )}
      </div>

      <div className="space-y-4 border-t border-border/60 pt-4">
        <Toggle
          label="Stop when customer replies"
          helper={noReply ? 'Always on for no-reply sequences.' : 'Ends the sequence as soon as they answer.'}
          checked={stopOnReply || noReply}
          disabled={noReply}
          onChange={onStopOnReplyChange}
        />
        <Toggle
          label="Allow re-entry"
          helper="Let the same contact go through this sequence more than once."
          checked={allowReentry}
          onChange={onAllowReentryChange}
        />
      </div>

      <div className="space-y-1.5 border-t border-border/60 pt-4">
        <label htmlFor="seq-description" className="text-xs font-semibold text-text-secondary">
          Description <span className="font-normal text-text-tertiary">(optional)</span>
        </label>
        <textarea
          id="seq-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
          placeholder="What is this sequence for?"
          className="w-full resize-y rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>
    </div>
  )
}
