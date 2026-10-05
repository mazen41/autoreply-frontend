'use client'
import React from 'react'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  id?: string
}

export default function Switch({ checked, onChange, label, description, disabled = false, size = 'md', id }: SwitchProps) {
  const generatedId = React.useId()
  const switchId = id || generatedId
  const trackSm = 'w-8 h-4'
  const thumbSm = checked ? 'translate-x-4' : 'translate-x-0.5'
  const trackMd = 'w-10 h-[22px]'
  const thumbMd = checked ? 'translate-x-[20px]' : 'translate-x-0.5'
  const track = size === 'sm' ? trackSm : trackMd
  const thumb = size === 'sm' ? thumbSm : thumbMd
  const thumbSize = size === 'sm' ? 'w-3 h-3' : 'w-[18px] h-[18px]'

  return (
    <div className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-full border-2 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer mt-0.5 ${
          track
        } ${
          checked
            ? 'bg-brand border-brand'
            : 'bg-surface-elevated border-border hover:border-border-strong'
        }`}
      >
        <span
          className={`${thumbSize} rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${thumb}`}
        />
      </button>
      {(label || description) && (
        <label htmlFor={switchId} className={`flex flex-col gap-0.5 ${disabled ? '' : 'cursor-pointer'}`}>
          {label && <span className="text-sm font-medium text-text-primary leading-none">{label}</span>}
          {description && <span className="text-xs text-text-secondary leading-relaxed">{description}</span>}
        </label>
      )}
    </div>
  )
}
