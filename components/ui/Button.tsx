'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

  const variants = {
    primary: 'bg-accent text-[var(--on-accent-text,#FFFFFF)] hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/15 hover:-translate-y-[1px] active:translate-y-0',
    secondary: 'bg-surface-elevated border border-border text-text-primary hover:bg-surface hover:border-accent/35 hover:-translate-y-[1px] active:translate-y-0',
    outline: 'border border-accent text-accent hover:bg-accent-subtle hover:-translate-y-[1px] active:translate-y-0',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-7 py-3.5 text-base gap-2 rounded-xl',
  }

  const isDisabled = disabled || loading

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
