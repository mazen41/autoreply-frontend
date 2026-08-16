'use client'

import React from 'react'

type ChannelType = 'facebook' | 'instagram' | 'gmail' | 'whatsapp' | 'twitter' | 'salla' | 'telegram' | 'tiktok' | 'shopify' | 'woocommerce'

interface ChannelIconProps {
  type: ChannelType
  size?: number
  className?: string
}

const channelColors: Record<ChannelType, string> = {
  facebook: 'var(--accent)',
  instagram: 'var(--accent)',
  gmail: 'var(--accent)',
  whatsapp: 'var(--accent)',
  twitter: 'var(--surface)',
  salla: 'var(--accent)',
  telegram: 'var(--accent)',
  tiktok: 'var(--accent)',
  shopify: 'var(--accent)',
  woocommerce: '#96588a',
}

const iconImages: Record<ChannelType, string> = {
  facebook: '/icons/vecteezy_facebook-logo-png-facebook-icon-transparent-png_18930698.png',
  instagram: '/icons/vecteezy_instagram-logo-png-instagram-icon-transparent_18930415.png',
  whatsapp: '/icons/vecteezy_whatsapp-logo-png-icon_16716480.png',
  telegram: '/icons/vecteezy_telegram-png-icon_16716472.png',
  tiktok: '/icons/vecteezy_tiktok-png-icon_16716450.png',
  salla: '/icons/sllla.png',
  shopify: '/icons/35c56f2f7d80e6440f8e8f5fea0852ab.png',
  woocommerce: '/icons/woocommerce-icon.png',
  gmail: '/icons/vecteezy_facebook-logo-png-facebook-icon-transparent-png_18930698.png',
  twitter: '/icons/vecteezy_facebook-logo-png-facebook-icon-transparent-png_18930698.png',
}

export default function ChannelIcon({ type, size = 24, className = '' }: ChannelIconProps) {
  const iconSrc = iconImages[type]

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={iconSrc}
        alt={type}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    </div>
  )
}
