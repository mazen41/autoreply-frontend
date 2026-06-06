import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  glass?: boolean
}

export default function Card({ children, className = '', glow = false, glass = false }: CardProps) {
  return (
    <div className={`
      rounded-2xl border border-border-dark
      ${glass ? 'bg-surface/70 backdrop-blur-lg' : 'bg-surface'}
      ${glow ? 'border-accent/30 shadow-lg shadow-accent/10' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
