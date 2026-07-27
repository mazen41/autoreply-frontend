import React from 'react'

interface LoadingStateProps {
  type?: 'skeleton' | 'spinner' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export default function LoadingState({ type = 'spinner', size = 'md', text, className = '' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  if (type === 'skeleton') {
    return (
      <div className={`skeleton ${className}`} style={{ height: size === 'sm' ? '2rem' : size === 'md' ? '4rem' : '6rem' }} />
    )
  }

  if (type === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full bg-current"
            style={{
              width: size === 'sm' ? '0.25rem' : size === 'md' ? '0.5rem' : '0.75rem',
              height: size === 'sm' ? '0.25rem' : size === 'md' ? '0.5rem' : '0.75rem',
              animation: `typingDot 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`} />
      {text && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>}
    </div>
  )
}