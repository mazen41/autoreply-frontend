'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { springs } from '../../lib/motion'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered' | 'ghost'
  children: React.ReactNode
  animate?: boolean
}

export function Card({
  variant = 'default',
  className = '',
  children,
  animate = false,
  onClick,
  ...props
}: CardProps) {
  const shouldReduceMotion = useReducedMotion()
  const isInteractive = variant === 'interactive' || !!onClick

  const variantStyles: Record<string, string> = {
    default:     'bg-surface border-border/80 shadow-sm',
    elevated:    'bg-surface-elevated border-border shadow-md',
    interactive: 'bg-surface border-border hover:border-brand/30 hover:bg-surface-elevated cursor-pointer',
    bordered:    'bg-transparent border-border',
    ghost:       'bg-transparent border-transparent',
  }

  const Comp = (isInteractive && !shouldReduceMotion) ? motion.div : 'div'
  const motionProps = (isInteractive && !shouldReduceMotion) ? {
    whileHover: { y: -1, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' },
    whileTap: { scale: 0.995 },
    transition: springs.standard,
  } : {}

  return (
    <Comp
      className={`rounded-xl border relative overflow-hidden transition-colors duration-150 ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      {...motionProps as any}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function CardHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 flex flex-col gap-1 border-b border-border/50 ${className}`}
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
      className={`text-[15px] font-semibold text-text-primary tracking-tight leading-snug ${className}`}
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
      className={`px-5 py-3 bg-surface-secondary/50 border-t border-border/50 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
