'use client'

import React from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  badge?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  primaryAction,
  secondaryActions,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-tertiary">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-text-primary transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-text-secondary font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {/* Optional sub-header filter bar or stats slot */}
      {children && <div className="pt-2">{children}</div>}
    </div>
  )
}
