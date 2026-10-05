'use client'
import React from 'react'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  indeterminate?: boolean
  id?: string
  className?: string
}

export default function Checkbox({ checked, onChange, label, description, disabled = false, indeterminate = false, id, className = '' }: CheckboxProps) {
  const generatedId = React.useId()
  const checkId = id || generatedId
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <div className={`flex items-start gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          ref={ref}
          type="checkbox"
          id={checkId}
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          onClick={() => !disabled && onChange(!checked)}
          className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 cursor-pointer focus-within:ring-2 focus-within:ring-brand/40 ${
            checked || indeterminate
              ? 'bg-brand border-brand'
              : 'bg-surface-elevated border-border hover:border-border-strong'
          }`}
        >
          {indeterminate ? (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          ) : checked ? (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </div>
      </div>
      {(label || description) && (
        <label htmlFor={checkId} className={`flex flex-col gap-0.5 ${disabled ? '' : 'cursor-pointer'}`}>
          {label && <span className="text-sm font-medium text-text-primary leading-none">{label}</span>}
          {description && <span className="text-xs text-text-secondary leading-relaxed">{description}</span>}
        </label>
      )}
    </div>
  )
}
