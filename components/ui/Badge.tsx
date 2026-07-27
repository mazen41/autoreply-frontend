import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'accent' | 'success' | 'warning' | 'error' | 'neutral'
}

export default function Badge({ children, className = '', variant = 'accent' }: BadgeProps) {
  const variantClasses = {
    accent: 'badge-accent',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    neutral: 'badge-neutral',
  }

  return (
    <span className={`badge-os ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
