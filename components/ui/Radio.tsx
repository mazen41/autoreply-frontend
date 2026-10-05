'use client'
import React from 'react'

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name?: string
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

export function Radio({ option, selected, onChange, name }: { option: RadioOption; selected: boolean; onChange: () => void; name?: string }) {
  const id = React.useId()
  return (
    <div className={`flex items-start gap-2.5 ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative flex items-center shrink-0 mt-0.5">
        <input
          type="radio"
          id={id}
          name={name}
          checked={selected}
          disabled={option.disabled}
          onChange={onChange}
          className="sr-only"
        />
        <div
          onClick={() => !option.disabled && onChange()}
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150 cursor-pointer ${
            selected
              ? 'border-brand bg-brand'
              : 'border-border bg-surface-elevated hover:border-border-strong'
          }`}
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
      <label htmlFor={id} className={`flex flex-col gap-0.5 ${option.disabled ? '' : 'cursor-pointer'}`}>
        <span className="text-sm font-medium text-text-primary leading-none">{option.label}</span>
        {option.description && <span className="text-xs text-text-secondary leading-relaxed">{option.description}</span>}
      </label>
    </div>
  )
}

export default function RadioGroup({ options, value, onChange, name, className = '', orientation = 'vertical' }: RadioGroupProps) {
  const groupName = name || React.useId()
  return (
    <div className={`flex ${orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-3'} ${className}`} role="radiogroup">
      {options.map(opt => (
        <Radio
          key={opt.value}
          option={opt}
          selected={value === opt.value}
          onChange={() => onChange(opt.value)}
          name={groupName}
        />
      ))}
    </div>
  )
}
