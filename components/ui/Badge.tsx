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
      'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    ai:
      'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-sm shadow-purple-500/5',
    success:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error:
      'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info:
      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    neutral:
      'bg-white/[0.04] text-text-tertiary border-white/[0.08]',
    outline:
      'bg-transparent text-text-secondary border-border hover:border-border-hover',
  }

  const dotColors = {
    default: 'bg-text-tertiary',
    brand: 'bg-brand-primary',
    ai: 'bg-purple-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-cyan-400',
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
