import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border border-accent/30 text-accent bg-accent/10 ${className}`}>
      {children}
    </span>
  )
}
