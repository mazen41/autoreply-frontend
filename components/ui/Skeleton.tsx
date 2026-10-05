'use client'

import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.06] dark:bg-white/[0.06] ${className}`}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl border border-border bg-surface-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-full h-8 rounded-lg" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="flex-1 h-9 rounded-lg" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-48 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-5 rounded-md" />
        <Skeleton className="w-14 h-4" />
      </div>
    </div>
  )
}

export function SkeletonMetric() {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-3.5" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="w-36 h-7" />
      <Skeleton className="w-20 h-3" />
    </div>
  )
}

export default Skeleton
