'use client'

import React, { forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  icon?: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helperText, options, icon, className = '', id, children, disabled, ...props },
  ref
) {
  const generatedId = React.useId()
  const selectId = id || generatedId

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-text-secondary select-none"
        >
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-text-tertiary">
            {icon}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`h-9 w-full bg-surface-elevated text-text-primary text-sm rounded-lg border border-border appearance-none pr-9 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? 'pl-9' : 'pl-3'
          } ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'hover:border-border-hover'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-surface-elevated text-text-primary"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute right-3 pointer-events-none flex items-center text-text-tertiary">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-error font-medium" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-text-tertiary">{helperText}</p>
      ) : null}
    </div>
  )
})

export default Select
