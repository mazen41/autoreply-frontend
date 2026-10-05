'use client'

import React, { useEffect } from 'react'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  position?: 'right' | 'left'
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  width = 'md',
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  const isRight = position === 'right'

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 w-full ${widthStyles[width]} bg-surface-overlay border-border shadow-2xl flex flex-col h-full ml-auto animate-in duration-250 ease-out ${
          isRight
            ? 'slide-in-from-right border-l'
            : 'slide-in-from-left border-r mr-auto ml-0'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3 shrink-0">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-text-secondary mt-0.5">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            aria-label="Close drawer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-surface-elevated/40 border-t border-border/60 shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
