'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

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
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-text-muted mb-3">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <ChevronRight size={11} className="text-text-disabled" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-text-secondary transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text-secondary font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: title + description */}
        <div className="flex items-start gap-3">
          {/* Brand accent line */}
          <div className="w-1 h-full min-h-[36px] rounded-full bg-brand/60 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary leading-tight">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2 shrink-0 self-start">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
