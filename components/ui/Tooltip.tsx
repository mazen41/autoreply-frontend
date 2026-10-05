'use client'

import React, { useState } from 'react'

export interface TooltipProps {
  content: React.ReactNode
  shortcut?: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export default function Tooltip({
  content,
  shortcut,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2 py-1 bg-surface-overlay text-text-primary text-[11px] font-medium rounded-md border border-border shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100 ${positionStyles[position]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1 py-0.2 text-[9px] bg-white/[0.08] rounded text-text-tertiary font-mono">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
