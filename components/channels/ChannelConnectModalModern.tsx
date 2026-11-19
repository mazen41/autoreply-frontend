'use client'

import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ChannelIcon from '../ui/ChannelIcon'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Zap,
  Loader2,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { ChannelOption, ALL_CHANNELS } from './ChannelConnectWizard'

export interface ChannelConnectModalModernProps {
  isOpen: boolean
  onClose: () => void
  initialChannel?: ChannelOption | null
  onContinueConnection: (channel: ChannelOption) => Promise<void>
  isRTL?: boolean
}

export default function ChannelConnectModalModern({
  isOpen,
  onClose,
  initialChannel,
  onContinueConnection,
  isRTL = false,
}: ChannelConnectModalModernProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [connectingChannelId, setConnectingChannelId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 'all', labelEn: 'All Integrations', labelAr: 'كل التكاملات' },
    { id: 'messaging', labelEn: 'Messaging', labelAr: 'المراسلة' },
    { id: 'social', labelEn: 'Social', labelAr: 'التواصل الاجتماعي' },
    { id: 'ecommerce', labelEn: 'E-Commerce', labelAr: 'المتاجر الإلكترونية' },
    { id: 'email', labelEn: 'Email', labelAr: 'البريد' },
  ]

  const localizedChannels: Record<string, { name: string; desc: string; badge: string }> = {
    instagram: {
      name: isRTL ? 'إنستغرام' : 'Instagram Professional',
      desc: isRTL
        ? 'ربط حساب الأعمال عبر Meta لاستقبال الـ DMs والرد التلقائي على التعليقات.'
        : 'Connect Instagram Business via Meta for direct messaging and automated comment replies.',
      badge: 'Meta OAuth',
    },
    facebook: {
      name: isRTL ? 'فيسبوك ماسنجر' : 'Facebook Messenger',
      desc: isRTL
        ? 'ربط صفحات فيسبوك للرد على محادثات ماسنجر وإدارة التعليقات على المنشورات.'
        : 'Connect your Facebook Pages to auto-reply to Messenger inquiries and post comments.',
      badge: 'Meta OAuth',
    },
    whatsapp: {
      name: isRTL ? 'واتساب للأعمال' : 'WhatsApp Business',
      desc: isRTL
        ? 'ربط سحابي رسمي عبر WhatsApp Cloud API لخدمة العملاء المؤتمتة على مدار الساعة.'
        : 'Official Meta Cloud API integration for 24/7 automated customer conversations.',
      badge: 'Cloud API',
    },
    telegram: {
      name: isRTL ? 'تيليجرام' : 'Telegram',
      desc: isRTL
        ? 'ربط بوت تيليجرام من خلال رمز التوثيق BotFather لخدمة العملاء الفورية.'
        : 'Connect any Telegram bot using its official BotFather token for automated support.',
      badge: 'Bot Token',
    },
    gmail: {
      name: isRTL ? 'Gmail وGoogle Workspace' : 'Gmail & Google Workspace',
      desc: isRTL
        ? 'مزامنة صناديق البريد والردود الذكية وتتبع رسائل الدعم عبر بروتوكول Google المعتمد.'
        : 'Sync company mailboxes, draft smart replies, and manage customer tickets via Google OAuth.',
      badge: 'Google OAuth',
    },
    salla: {
      name: isRTL ? 'متجر سلة' : 'Salla Store',
      desc: isRTL
        ? 'تكامل مباشر مع منصة سلة لمزامنة كتالوج المنتجات وتتبع حالة الطلبات والمدن.'
        : 'Direct OAuth integration with Salla to sync products, inventory, and instant orders.',
      badge: 'Salla OAuth',
    },
    shopify: {
      name: isRTL ? 'شوبيفاي' : 'Shopify Store',
      desc: isRTL
        ? 'مزامنة الكتالوج وقاعدة بيانات العملاء وسجلات الطلبات لتفعيل البيع الآلي.'
        : 'Connect your Shopify store to enable product catalog lookups and automated order updates.',
      badge: 'Shopify Store',
    },
    woocommerce: {
      name: isRTL ? 'WooCommerce' : 'WooCommerce Store',
      desc: isRTL
        ? 'ربط مشفر لمتاجر ووردبريس ومزامنة تفاصيل المنتجات والطلبات عبر REST API.'
        : 'Encrypted bridge to your WordPress WooCommerce store via REST API for catalog sync.',
      badge: 'REST API',
    },
  }

  const filtered = ALL_CHANNELS.filter((ch) => {
    const q = searchQuery.toLowerCase().trim()
    const meta = localizedChannels[ch.id] || { name: ch.name, desc: ch.description, badge: ch.category }
    const matchesSearch =
      !q ||
      meta.name.toLowerCase().includes(q) ||
      meta.desc.toLowerCase().includes(q)
    const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDirectConnect = async (channel: ChannelOption) => {
    setConnectingChannelId(channel.id)
    setError(null)
    try {
      await onContinueConnection(channel)
      // Note: for OAuth channels, window.location.href redirects immediately.
      // For credential modals, onClose will hide this modal and show the specific credential modal.
      onClose()
    } catch (err: any) {
      setError(err?.message || (isRTL ? 'تعذر إتمام عملية الربط.' : 'Could not proceed with connection.'))
      setConnectingChannelId(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2.5" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand border border-brand/20">
            <Zap size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {isRTL ? 'ربط قناة تواصل أو متجر جديد' : 'Connect Channel or Store'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {isRTL
                ? 'انقر على أي منصة لبدء الربط المباشر الفوري دون خطوات إضافية.'
                : 'Click any platform to start instant authorization without extra steps.'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <span className="text-[11px] text-text-tertiary flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{isRTL ? 'ربط آمن ومشفر عبر البروتوكولات الرسمية' : 'End-to-end encrypted official OAuth'}</span>
          </span>

          <Button variant="secondary" size="sm" onClick={onClose} disabled={Boolean(connectingChannelId)}>
            {isRTL ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Toolbar: Search + Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border overflow-x-auto text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {isRTL ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث بالاسم...' : 'Search platforms…'}
              className="w-full rounded-xl border border-border bg-surface ps-9 pe-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
            />
          </div>
        </div>

        {/* Channels Grid Selection with Instant 1-Click Connect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto p-1" data-lenis-prevent>
          {filtered.map((ch) => {
            const isConnectingThis = connectingChannelId === ch.id
            const meta = localizedChannels[ch.id] || {
              name: ch.name,
              desc: ch.description,
              badge: ch.category,
            }

            return (
              <div
                key={ch.id}
                className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-surface/80 p-4 transition-all hover:border-brand/50 hover:bg-surface-elevated hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface shadow-xs transition-transform group-hover:scale-105">
                        <ChannelIcon type={ch.id as any} size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">{meta.name}</h4>
                        <span className="inline-block mt-0.5 rounded bg-surface-elevated border border-border/60 px-1.5 py-0.2 text-[9px] font-bold text-text-tertiary">
                          {meta.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {meta.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                    <Sparkles size={11} className="text-brand" />
                    <span>{isRTL ? 'ربط فوري مباشر' : 'Direct connect'}</span>
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={Boolean(connectingChannelId)}
                    onClick={() => handleDirectConnect(ch)}
                    icon={
                      isConnectingThis ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <ArrowUpRight size={13} className={isRTL ? 'rotate-[-90deg]' : ''} />
                      )
                    }
                  >
                    {isConnectingThis
                      ? isRTL
                        ? 'جارٍ التحويل...'
                        : 'Connecting…'
                      : isRTL
                      ? 'ربط الآن'
                      : 'Connect'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
