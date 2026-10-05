'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  siblings?: number
  className?: string
}

function getPageRange(current: number, total: number, siblings: number): (number | '...')[] {
  const range: (number | '...')[] = []
  const delta = siblings + 2

  if (total <= delta * 2 + 1) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const left = Math.max(2, current - siblings)
  const right = Math.min(total - 1, current + siblings)

  range.push(1)
  if (left > 2) range.push('...')

  for (let i = left; i <= right; i++) range.push(i)

  if (right < total - 1) range.push('...')
  range.push(total)

  return range
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = false,
  siblings = 1,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageRange(currentPage, totalPages, siblings)
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  const btnBase =
    'inline-flex items-center justify-center h-8 min-w-[2rem] rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40 disabled:pointer-events-none cursor-pointer'
  const btnNav = `${btnBase} px-2 border border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-border-strong`
  const btnPage = (active: boolean) =>
    `${btnBase} px-2.5 border ${
      active
        ? 'bg-brand text-brand-text border-brand font-semibold'
        : 'bg-surface-elevated text-text-secondary border-border hover:text-text-primary hover:border-border-strong'
    }`

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center gap-1 ${className}`}
    >
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          className={btnNav}
          aria-label="First page"
        >
          <ChevronLeft size={14} />
          <ChevronLeft size={14} className="-ml-2" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className={btnNav}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center h-8 w-8 text-text-muted"
            aria-hidden="true"
          >
            <MoreHorizontal size={14} />
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page as number)}
            className={btnPage(page === currentPage)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canNext}
        className={btnNav}
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>

      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!canNext}
          className={btnNav}
          aria-label="Last page"
        >
          <ChevronRight size={14} />
          <ChevronRight size={14} className="-ml-2" />
        </button>
      )}
    </nav>
  )
}
