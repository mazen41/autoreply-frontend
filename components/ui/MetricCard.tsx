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
  variant?: 'default' | 'ai' | 'warning'
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

  return (
    <Card
      variant={isInteractive ? 'interactive' : 'default'}
      onClick={onClick}
      className={`p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        {icon && (
          <div
            className={`p-2 rounded-lg shrink-0 border ${
              variant === 'ai'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : variant === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-surface-elevated text-text-secondary border-border'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {value}
        </div>

        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                trend.isPositive !== false
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
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
            <span className="text-xs text-text-tertiary">{subValue}</span>
          )}
          {trend?.label && (
            <span className="text-xs text-text-tertiary">{trend.label}</span>
          )}
        </div>
      </div>
    </Card>
  )
}
