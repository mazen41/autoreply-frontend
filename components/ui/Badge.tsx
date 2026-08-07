import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'accent' | 'success' | 'warning' | 'error' | 'neutral'
}

export default function Badge({ children, className = '', variant = 'accent' }: BadgeProps) {
  const variantClasses = {
    accent: 'border-accent/20 text-accent bg-accent-subtle/40 hover:border-accent/40',
    success: 'border-emerald-500/20 text-emerald-600 bg-emerald-500/10 hover:border-emerald-500/40',
    warning: 'border-amber-500/20 text-amber-600 bg-amber-500/10 hover:border-amber-500/40',
    error: 'border-rose-500/20 text-rose-600 bg-rose-500/10 hover:border-rose-500/40',
    neutral: 'border-slate-500/20 text-slate-600 bg-slate-500/10 hover:border-slate-500/40',
  }

  return (
    <span className={`badge-os ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
