'use client'

import React from 'react'

export interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'ai'
  channelIcon?: React.ReactNode
  className?: string
}

export default function Avatar({
  src,
  alt,
  name = 'User',
  size = 'md',
  status,
  channelIcon,
  className = '',
}: AvatarProps) {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-12 h-12 text-base font-bold',
  }

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-slate-400',
    busy: 'bg-warning',
    ai: 'bg-brand',
  }

  const initial = (name || 'U').charAt(0).toUpperCase()

  // Generate deterministic gradient background based on name
  const gradients = [
    'from-info to-brand',
    'from-success to-success',
    'from-brand to-brand',
    'from-warning to-warning',
    'from-brand to-info',
  ]
  const charCode = (name || 'U').charCodeAt(0)
  const gradient = gradients[charCode % gradients.length]

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${sizeStyles[size]} rounded-full object-cover border border-border`}
        />
      ) : (
        <div
          className={`${sizeStyles[size]} rounded-full bg-gradient-to-br ${gradient} text-white font-medium flex items-center justify-center border border-white/10 shadow-sm`}
        >
          {initial}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-surface ${statusColors[status]} ${
            status === 'ai' ? 'animate-pulse' : ''
          }`}
        />
      )}

      {channelIcon && (
        <div className="absolute -bottom-1 -right-1 p-0.5 bg-surface-elevated rounded-full border border-border shadow-xs">
          {channelIcon}
        </div>
      )}
    </div>
  )
}
