import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer'

  const variants = {
    primary: 'bg-accent text-bg-dark hover:shadow-lg hover:shadow-accent/30 hover:scale-105 active:scale-100',
    secondary: 'bg-surface border border-border-dark text-text-primary hover:border-accent/50 hover:bg-accent/10',
    outline: 'border-2 border-accent text-accent hover:bg-accent hover:text-bg-dark',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
