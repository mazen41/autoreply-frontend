import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className = '', width, height, rounded = 'sm' }: SkeletonProps) {
  const rMap = { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full' }
  return (
    <div
      className={`skeleton ${rMap[rounded]} ${className}`}
      style={{ width, height }}
    />
  )
}

export function ConversationItemSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-3 border-b border-border">
      <Skeleton rounded="full" width={36} height={36} className="flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-2 w-1/6" />
        </div>
        <Skeleton className="h-2.5 w-4/5" />
        <Skeleton className="h-2 w-1/3" />
      </div>
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-2.5 w-2/3" />
    </div>
  )
}

export function MessageSkeleton({ align = 'left' }: { align?: 'left' | 'right' }) {
  return (
    <div className={`flex items-end gap-2 px-4 py-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {align === 'left' && <Skeleton rounded="full" width={28} height={28} className="flex-shrink-0 mb-1" />}
      <div className={`space-y-1.5 ${align === 'right' ? 'items-end' : 'items-start'} flex flex-col`}>
        <Skeleton className="h-10"  rounded="lg" />
        <Skeleton className="h-2 w-12" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  const widths = ['60%', '75%', '75%', '75%', '40%']
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3" width={widths[i] ?? '70%'} />
        </td>
      ))}
    </tr>
  )
}

export default Skeleton

// ─── Legacy named exports (used by dashboard sub-pages) ──────────────────────
export function SkeletonCard() {
  return <MetricCardSkeleton />
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return <TableRowSkeleton cols={cols} />
}
