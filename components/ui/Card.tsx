import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  glass?: boolean
  interactive?: boolean
}

export default function Card({ children, className = '', glow = false, glass = false, interactive = false }: CardProps) {
  return (
    <div className={`
      rounded-2xl border border-[var(--border)] transition-opacity duration-200
      bg-[var(--surface-elevated)]
      ${glow ? 'border-accent/20 shadow-md shadow-accent/5' : ''}
      ${interactive ? 'hover:border-accent/30 hover:shadow-lg cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
