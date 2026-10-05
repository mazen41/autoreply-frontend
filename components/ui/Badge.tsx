'use client'

import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'ai' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'outline'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  dotPulse?: boolean
  children: React.ReactNode
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  dot = false,
  dotPulse = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      'bg-surface-elevated text-text-secondary border-border hover:border-border-hover',
    brand:
      'bg-brand/10 text-brand border-brand/25',
    ai:
      'bg-brand/10 text-brand border-brand/25 shadow-xs shadow-brand/5',
    success:
      'bg-success/10 text-success border-success/20',
    warning:
      'bg-warning/10 text-warning border-warning/20',
    error:
      'bg-error/10 text-error border-error/20',
    info:
      'bg-info/10 text-info border-info/20',
    neutral:
      'bg-surface text-text-tertiary border-border',
    outline:
      'bg-transparent text-text-secondary border-border hover:border-border-hover',
  }

  const dotColors = {
    default: 'bg-text-tertiary',
    brand: 'bg-brand',
    ai: 'bg-brand',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-text-tertiary',
    outline: 'bg-text-tertiary',
  }

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1 rounded tracking-wider font-semibold',
    sm: 'px-2 py-0.5 text-xs gap-1.5 rounded-md font-medium',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-medium',
  }

  return (
    <span
      className={`inline-flex items-center border select-none transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {dotPulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`}
          />
        </span>
      )}
      <span className="truncate leading-none">{children}</span>
    </span>
  )
}
