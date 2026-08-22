'use client'

import React from 'react'
import { Facebook, Instagram, Mail, MessageCircle, Twitter, ShoppingBag, Send, Music, ShoppingCart, Package } from 'lucide-react'

type ChannelType = 'facebook' | 'instagram' | 'gmail' | 'whatsapp' | 'twitter' | 'salla' | 'telegram' | 'tiktok' | 'shopify' | 'woocommerce'

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
}

const iconComponents: Record<ChannelType, React.ComponentType<{ size?: number; className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  gmail: Mail,
  whatsapp: MessageCircle,
  twitter: Twitter,
  salla: ShoppingBag,
  telegram: Send,
  tiktok: Music,
  shopify: ShoppingCart,
  woocommerce: Package,
}

export default function ChannelIcon({ type, size = 24, className = '' }: ChannelIconProps) {
  const IconComponent = iconComponents[type]
  const color = channelColors[type]

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <IconComponent
        size={size}
        className="text-[var(--text-primary)]"
        style={{ color }}
      />
    </div>
  )
}
