'use client'

import React from 'react'
import { MessageSquare, Camera, Mail, MessageCircle, Share2, ShoppingBag, Send, Music, ShoppingCart, Package, Globe, Star, MessageCircleMore } from 'lucide-react'

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

const iconComponents: Record<ChannelType, React.ComponentType<{ size?: number; className?: string }>> = {
  facebook: MessageSquare,
  instagram: Camera,
  gmail: Mail,
  whatsapp: MessageCircle,
  twitter: Share2,
  salla: ShoppingBag,
  telegram: Send,
  tiktok: Music,
  shopify: ShoppingCart,
  woocommerce: Package,
  reviews: Star,
  webchat: MessageCircleMore,
}

export default function ChannelIcon({ type, size = 24, className = '' }: ChannelIconProps) {
  const IconComponent = iconComponents[type]
  const color = channelColors[type]

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, color }}
    >
      <IconComponent size={size} />
    </div>
  )
}
