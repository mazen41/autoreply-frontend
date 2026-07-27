import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  glass?: boolean
  hover?: boolean
}

export default function Card({ children, className = '', glow = false, glass = false, hover = false }: CardProps) {
  return (
    <div className={`
      rounded-2xl border border-border
      ${glass ? 'glass' : 'bg-surface'}
      ${glow ? 'border-accent/30 shadow-lg shadow-accent/10' : ''}
      ${hover ? 'premium-card' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
