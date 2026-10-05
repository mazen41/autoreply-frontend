'use client'

import React from 'react'
import Card from './Card'

export interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: {
    value: number
    isPositive?: boolean
    label?: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'ai' | 'warning' | 'hero'
  onClick?: () => void
  className?: string
}

export default function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  variant = 'default',
  onClick,
  className = '',
}: MetricCardProps) {
  const isInteractive = !!onClick
  const isHero = variant === 'hero'
  const isAI = variant === 'ai'
  const isWarning = variant === 'warning'

  // Hero: left-accent bar instead of full-green card — stays within 1-3% brand rule
  const heroAccent = isHero ? 'border-l-2 border-l-brand' : ''

  const iconVariantClass = isHero
    ? 'bg-brand/10 text-brand border-brand/20'
    : isAI
    ? 'bg-brand/10 text-brand border-brand/20'
    : isWarning
    ? 'bg-warning/10 text-warning border-warning/20'
    : 'bg-surface-elevated text-text-secondary border-border'

  return (
    <Card
      variant={isInteractive ? 'interactive' : 'default'}
      onClick={onClick}
      className={`p-5 flex flex-col justify-between ${heroAccent} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`text-xs font-semibold ${
            isHero ? 'text-brand uppercase tracking-wider text-[11px]' : 'text-text-secondary'
          }`}
        >
          {label}
        </span>
        {icon && (
          <div
            className={`p-2 rounded-lg shrink-0 border ${iconVariantClass}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isHero ? 'text-text-primary' : 'text-text-primary'
          }`}
        >
          {value}
        </div>

        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                trend.isPositive !== false
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}
            >
              <svg
                className={`w-3 h-3 ${trend.isPositive !== false ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              {Math.abs(trend.value)}%
            </span>
          )}

          {subValue && (
            <span className="text-xs text-text-muted">{subValue}</span>
          )}
          {trend?.label && (
            <span className="text-xs text-text-muted">{trend.label}</span>
          )}
        </div>
      </div>
    </Card>
  )
}
