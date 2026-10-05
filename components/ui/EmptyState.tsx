'use client'

import React from 'react'
import Button, { ButtonProps } from './Button'

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: ButtonProps['variant']
  }
  primaryAction?: React.ReactNode
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const renderedIcon = React.isValidElement(icon)
    ? icon
    : typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in (icon as any))
    ? React.createElement(icon as React.ComponentType<any>, { size: 24, className: 'w-6 h-6' })
    : icon

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-border/80 bg-surface-elevated/20 max-w-lg mx-auto ${className}`}
    >
      {renderedIcon ? (
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-text-secondary mb-4 shadow-sm relative group">
          <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur-md -z-10 group-hover:bg-brand-primary/10 transition-colors" />
          {renderedIcon}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-text-tertiary mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}

      <h3 className="text-sm font-semibold text-text-primary tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {(action || primaryAction || secondaryAction) && (
        <div className="mt-5 flex items-center gap-3">
          {primaryAction}
          {action && (
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}