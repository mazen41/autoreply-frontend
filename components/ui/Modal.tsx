'use client'

import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  maxWidth?: number | string
}

export default function Modal({ isOpen, onClose, children, title, maxWidth = 560 }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth,
          maxHeight: '90vh', overflowY: 'auto',
          borderRadius: 16,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1,
                padding: '4px 6px', borderRadius: 6,
              }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
