'use client'

import React from 'react'

export interface ChartContainerProps {
  title?: string
  description?: string
  legend?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  height?: number | string
  className?: string
  /** Show a loading skeleton instead of children */
  loading?: boolean
  /** Show an empty state message */
  empty?: string
}

export default function ChartContainer({
  title,
  description,
  legend,
  actions,
  children,
  height = 240,
  className = '',
  loading = false,
  empty,
}: ChartContainerProps) {
  return (
    <div
      className={`bg-surface-card border border-border rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      {(title || description || legend || actions) && (
        <div className="px-5 pt-4 pb-3 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-text-primary tracking-tight leading-none">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
          </div>
          {legend && (
            <div className="flex items-center gap-4 flex-wrap pt-1">{legend}</div>
          )}
        </div>
      )}

      {/* Chart area */}
      <div
        className="px-5 pb-5"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {loading ? (
          <div className="h-full flex items-end gap-3 pt-4">
            {[65, 40, 80, 55, 70, 45, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-surface-elevated animate-pulse rounded-t-md"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : empty ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
              <svg
                className="w-5 h-5 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <p className="text-xs text-text-muted">{empty}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

/** Compact chart legend item */
export function ChartLegendItem({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value?: string | number
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ background: color }}
      />
      <span className="text-text-secondary">{label}</span>
      {value !== undefined && (
        <span className="text-text-primary font-medium">{value}</span>
      )}
    </div>
  )
}
