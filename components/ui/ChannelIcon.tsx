'use client'

import React from 'react'
import Image from 'next/image'
import { Mail, Share2, Music, Star, MessageCircleMore } from 'lucide-react'

type ChannelType = 'facebook' | 'instagram' | 'gmail' | 'whatsapp' | 'twitter' | 'salla' | 'telegram' | 'tiktok' | 'shopify' | 'woocommerce' | 'reviews' | 'webchat'

interface ChannelIconProps {
  type: ChannelType
  size?: number
  className?: string
}

const channelColors: Record<ChannelType, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  gmail: '#EA4335',
  whatsapp: '#25D366',
  twitter: '#1DA1F2',
  salla: '#000000',
  telegram: '#0088cc',
  tiktok: '#000000',
  shopify: '#96BF48',
  woocommerce: '#96588a',
  reviews: '#4285F4',
  webchat: '#8B3FFB',
}

/** Channels that have custom SVG icons in /public/icons/ */
const svgIcons: Partial<Record<ChannelType, string>> = {
  facebook: '/icons/facebook.svg',
  instagram: '/icons/instagram.svg',
  whatsapp: '/icons/whatsapp.svg',
  telegram: '/icons/telegram.svg',
  shopify: '/icons/shopify.svg',
  woocommerce: '/icons/woocommerce-icon.svg',
  salla: '/icons/sllla.svg',
}

/** Fallback lucide icons for channels without custom SVGs */
const fallbackIcons: Partial<Record<ChannelType, React.ComponentType<{ size?: number; className?: string }>>> = {
  gmail: Mail,
  twitter: Share2,
  tiktok: Music,
  reviews: Star,
  webchat: MessageCircleMore,
}

export default function ChannelIcon({ type, size = 24, className = '' }: ChannelIconProps) {
  const svgSrc = svgIcons[type]
  const color = channelColors[type]

  if (svgSrc) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={svgSrc}
          alt={`${type} icon`}
          width={size}
          height={size}
          className="object-contain"
          unoptimized
        />
      </div>
    )
  }

  const FallbackIcon = fallbackIcons[type]
  if (FallbackIcon) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, color }}
      >
        <FallbackIcon size={size} />
      </div>
    )
  }

  // Ultimate fallback
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
    />
  )
}
