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
      rounded-2xl border border-border transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
      ${glass ? 'bg-surface-elevated/70 backdrop-blur-md' : 'bg-surface-elevated'}
      ${glow ? 'border-accent/20 shadow-lg shadow-accent/5' : ''}
      ${interactive ? 'hover:border-accent/30 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-[2px] cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
