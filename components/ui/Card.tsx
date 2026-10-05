'use client'

import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered'
  children: React.ReactNode
}

export function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      'bg-surface-card border-border/80 shadow-sm',
    elevated:
      'bg-surface-elevated border-border shadow-md',
    interactive:
      'bg-surface-card border-border/80 hover:border-brand-primary/40 hover:bg-surface-elevated/80 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.995]',
    bordered:
      'bg-transparent border-border',
  }

  return (
    <div
      className={`rounded-xl border relative overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-5 flex flex-col gap-1.5 border-b border-border/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-semibold text-text-primary tracking-tight leading-none ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-text-secondary leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-3.5 bg-surface-elevated/40 border-t border-border/50 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
