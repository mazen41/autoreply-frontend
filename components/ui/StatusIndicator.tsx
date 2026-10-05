'use client'
import React from 'react'

export type StatusType = 'online' | 'offline' | 'processing' | 'error' | 'warning' | 'idle'

export interface StatusIndicatorProps {
  status: StatusType
  label?: string
  size?: 'xs' | 'sm' | 'md'
  pulse?: boolean
  className?: string
}

const STATUS_CONFIG: Record<StatusType, { dot: string; text: string; label: string }> = {
  online:     { dot: 'bg-success',    text: 'text-success',    label: 'Online' },
  offline:    { dot: 'bg-text-muted', text: 'text-text-muted', label: 'Offline' },
  processing: { dot: 'bg-brand',      text: 'text-brand',      label: 'Processing' },
  error:      { dot: 'bg-error',      text: 'text-error',      label: 'Error' },
  warning:    { dot: 'bg-warning',    text: 'text-warning',    label: 'Warning' },
  idle:       { dot: 'bg-info',       text: 'text-info',       label: 'Idle' },
}

const SIZE_CONFIG = {
  xs: { dot: 'w-1.5 h-1.5', text: 'text-[10px]', gap: 'gap-1' },
  sm: { dot: 'w-2 h-2',     text: 'text-xs',      gap: 'gap-1.5' },
  md: { dot: 'w-2.5 h-2.5', text: 'text-sm',      gap: 'gap-2' },
}

export default function StatusIndicator({ status, label, size = 'sm', pulse, className = '' }: StatusIndicatorProps) {
  const cfg = STATUS_CONFIG[status]
  const sz = SIZE_CONFIG[size]
  const displayLabel = label ?? cfg.label
  const shouldPulse = pulse ?? (status === 'online' || status === 'processing')

  return (
    <span className={`inline-flex items-center ${sz.gap} ${className}`}>
      <span className={`relative flex shrink-0 ${sz.dot}`}>
        {shouldPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full ${sz.dot} ${cfg.dot}`} />
      </span>
      {displayLabel && (
        <span className={`font-medium ${sz.text} ${cfg.text}`}>{displayLabel}</span>
      )}
    </span>
  )
}
