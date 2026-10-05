import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const VARIANT_CONFIG = {
  success: {
    container: 'bg-success/8 border-success/20 text-success',
    icon: CheckCircle2,
    iconClass: 'text-success',
  },
  warning: {
    container: 'bg-warning/8 border-warning/20 text-warning',
    icon: AlertTriangle,
    iconClass: 'text-warning',
  },
  error: {
    container: 'bg-error/8 border-error/20 text-error',
    icon: XCircle,
    iconClass: 'text-error',
  },
  info: {
    container: 'bg-info/8 border-info/20 text-info',
    icon: Info,
    iconClass: 'text-info',
  },
}

export default function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const cfg = VARIANT_CONFIG[variant]
  const Icon = cfg.icon

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${cfg.container} ${className}`}
    >
      <Icon size={18} className={`${cfg.iconClass} shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold leading-none mb-1.5">{title}</p>
        )}
        <div className="text-text-secondary leading-relaxed">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}