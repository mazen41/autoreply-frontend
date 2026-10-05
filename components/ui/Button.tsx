'use client'

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'ai' | 'subtle'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  children?: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium select-none transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 disabled:opacity-45 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-[0.98]'

  const variantStyles = {
    primary:
      'bg-brand text-brand-text border border-brand/20 hover:bg-brand-hover font-semibold shadow-xs active:bg-brand-dark',
    secondary:
      'bg-surface-elevated text-text-primary border border-border hover:bg-surface-hover hover:border-border-hover shadow-xs',
    outline:
      'bg-transparent text-text-primary border border-border hover:bg-surface-elevated hover:border-border-hover',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent',
    destructive:
      'bg-error/15 text-error border border-error/30 hover:bg-error hover:text-white shadow-xs active:bg-error',
    ai:
      'bg-brand/10 text-brand border border-brand/25 hover:bg-brand/15 hover:border-brand/40 font-medium',
    subtle:
      'bg-brand/10 text-brand border border-brand/20 hover:bg-brand/15 active:bg-brand/20',
  }

  const sizeStyles = {
    xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md font-semibold',
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-10 px-5 text-sm gap-2.5 rounded-xl font-semibold',
    icon: 'h-9 w-9 p-0 rounded-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 shrink-0 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}

      {children && <span className="truncate leading-none">{children}</span>}

      {!loading && iconRight && (
        <span className="shrink-0 flex items-center">{iconRight}</span>
      )}
    </button>
  )
}
