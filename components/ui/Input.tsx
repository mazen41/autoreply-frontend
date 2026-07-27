import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  icon?: React.ReactNode
  helperText?: string
}

export default function Input({ label, error, success, icon, helperText, className = '', id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      
      <div className={icon ? 'input-with-icon' : ''}>
        <input
          id={inputId}
          className={`input-os ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {icon && <div className="input-icon">{icon}</div>}
      </div>

      {error && (
        <p id={errorId} className="text-xs" style={{ color: 'var(--error)' }} role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {helperText}
        </p>
      )}
    </div>
  )
}