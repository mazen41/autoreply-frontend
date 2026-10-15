'use client'

import React, { useEffect, useId, useRef, useState } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
  ariaLabel?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  ariaLabel,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCloseRef = useRef(onClose)
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    // A modal reopened after its exit timer has unmounted it must remount for the entry animation.
    if (isOpen) setShouldRender(true) // eslint-disable-line react-hooks/set-state-in-effect -- exit animation lifecycle state
    else if (shouldRender) closeTimerRef.current = setTimeout(() => setShouldRender(false), 180)
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }
  }, [isOpen, shouldRender])

  useEffect(() => {
    if (!isOpen) return
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusInitial = window.setTimeout(() => {
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ;(focusables[0] || dialog).focus()
    }, 0)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      if (!focusables.length) { e.preventDefault(); dialog.focus(); return }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusInitial)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      window.setTimeout(() => returnFocusRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  if (!shouldRender) return null

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-[96vw]',
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto transition-opacity duration-150 motion-reduce:transition-none ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!isOpen}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 motion-reduce:transition-none ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel || 'Dialog' : undefined}
        tabIndex={-1}
        ref={dialogRef}
        className={`relative w-full ${sizeStyles[size]} bg-surface-overlay border border-border rounded-2xl shadow-lg overflow-hidden z-10 transition-all duration-150 motion-reduce:transition-none ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'} ${className}`}
      >
        {(title || description) && (
          <div className="px-6 pt-5 pb-4 border-b border-border/60 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h3 id={titleId} className="text-base font-semibold text-text-primary tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-elevated transition-colors"
              aria-label="Close dialog"
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
        )}

        <div className="p-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 bg-surface-elevated/40 border-t border-border/60 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
