'use client'

import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  shortcut?: string
  onClear?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    icon,
    iconRight,
    shortcut,
    onClear,
    className = '',
    id,
    disabled,
    value,
    ...props
  },
  ref
) {
  const generatedId = React.useId()
  const inputId = id || generatedId

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-text-secondary select-none flex items-center justify-between"
        >
          <span>
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </span>
          {shortcut && (
            <kbd className="text-[10px] text-text-tertiary bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
              {shortcut}
            </kbd>
          )}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-text-tertiary">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          value={value}
          className={`h-9 w-full bg-surface-elevated text-text-primary text-sm rounded-lg border border-border placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? 'pl-9' : 'pl-3'
          } ${iconRight || onClear || shortcut ? 'pr-9' : 'pr-3'} ${
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'hover:border-border-hover'
          } ${className}`}
          {...props}
        />

        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
            tabIndex={-1}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {!onClear && iconRight && (
          <div className="absolute right-3 flex items-center text-text-tertiary">
            {iconRight}
          </div>
        )}
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

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, className = '', id, disabled, ...props },
  ref
) {
  const generatedId = React.useId()
  const textareaId = id || generatedId

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-text-secondary select-none"
        >
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        disabled={disabled}
        className={`w-full bg-surface-elevated text-text-primary text-sm rounded-lg border border-border p-3 placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all duration-150 resize-y min-h-[90px] disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'hover:border-border-hover'
        } ${className}`}
        {...props}
      />

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

export default Input