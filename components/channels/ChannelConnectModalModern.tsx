'use client'

import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ChannelIcon from '../ui/ChannelIcon'
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  ExternalLink,
  Layers,
  Store,
  MessageSquare,
  Mail,
  Zap,
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
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption | null>(initialChannel || null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 'all', labelEn: 'All Channels', labelAr: 'كل القنوات' },
    { id: 'messaging', labelEn: 'Messaging', labelAr: 'المراسلة' },
    { id: 'social', labelEn: 'Social & Reviews', labelAr: 'التواصل الاجتماعي' },
    { id: 'ecommerce', labelEn: 'E-Commerce', labelAr: 'المتاجر الإلكترونية' },
    { id: 'email', labelEn: 'Email', labelAr: 'البريد' },
  ]

  const localizedChannels: Record<string, { name: string; desc: string; requirements: string[] }> = {
    instagram: {
      name: isRTL ? 'إنستغرام' : 'Instagram Professional',
      desc: isRTL
        ? 'ربط حساب Instagram Business عبر Meta لاستقبال الـ DMs والرد التلقائي على التعليقات.'
        : 'Connect your Instagram professional account via Meta for direct messaging and automated comment replies.',
      requirements: [
        isRTL ? 'حساب أعمال إنستغرام أو منشئ محتوى' : 'Instagram Professional / Creator account',
        isRTL ? 'صفحة فيسبوك مرتبطة بالحساب' : 'Linked Facebook Page with Admin access',
        isRTL ? 'صلاحيات قراءة الرسائل وتوجيه الردود' : 'Direct Messages & Comments permissions',
      ],
    },
    facebook: {
      name: isRTL ? 'فيسبوك ماسنجر' : 'Facebook Messenger',
      desc: isRTL
        ? 'ربط صفحات فيسبوك للرد على محادثات ماسنجر وإدارة التعليقات على المنشورات.'
        : 'Connect your Facebook Pages to auto-reply to Messenger inquiries and feed comments.',
      requirements: [
        isRTL ? 'دور مسؤول (Admin) على الصفحة' : 'Admin role on the target Facebook Page',
        isRTL ? 'ربط رسمي آمن عبر Meta OAuth' : 'Official Meta OAuth secure authorization',
      ],
    },
    whatsapp: {
      name: isRTL ? 'واتساب للأعمال' : 'WhatsApp Business',
      desc: isRTL
        ? 'ربط سحابي رسمي عبر WhatsApp Cloud API أو اتصالات QR لخدمة العملاء على مدار الساعة.'
        : 'Connect via official Meta Cloud API or QR instance for high-volume customer communications.',
      requirements: [
        isRTL ? 'رقم هاتف مفعل للأعمال' : 'Dedicated phone number for WhatsApp Business',
        isRTL ? 'حساب Meta Business Manager موثق' : 'Verified Meta Business Manager profile',
      ],
    },
    telegram: {
      name: isRTL ? 'تيليجرام' : 'Telegram',
      desc: isRTL
        ? 'ربط بوت تيليجرام من خلال رمز التوثيق BotFather لخدمة العملاء الفورية.'
        : 'Connect any Telegram bot using its official BotFather token for automated customer care.',
      requirements: [
        isRTL ? 'بوت تم إنشاؤه عبر @BotFather' : 'Bot created via @BotFather',
        isRTL ? 'رمز الوصول البرمجي (Bot Token)' : 'Valid Telegram HTTP API bot token',
      ],
    },
    gmail: {
      name: isRTL ? 'Gmail وGoogle Workspace' : 'Gmail & Google Workspace',
      desc: isRTL
        ? 'مزامنة صناديق البريد والردود الذكية وتتبع رسائل الدعم عبر بروتوكول Google المعتمد.'
        : 'Sync company mailboxes, draft smart replies, and manage customer tickets via secure Google OAuth.',
      requirements: [
        isRTL ? 'حساب Gmail أو Google Workspace نشط' : 'Active Gmail or Google Workspace account',
        isRTL ? 'صلاحيات قراءة وإرسال رسائل البريد' : 'Read & send mailbox authorization',
      ],
    },
    salla: {
      name: isRTL ? 'متجر سلة' : 'Salla Store',
      desc: isRTL
        ? 'تكامل مباشر مع منصة سلة لمزامنة كتالوج المنتجات وتتبع حالة الطلبات والمبيعات في المحادثات.'
        : 'Direct OAuth integration with Salla to sync products, inventory, and real-time order lookups.',
      requirements: [
        isRTL ? 'حساب تاجر نشط في منصة سلة' : 'Active merchant account on Salla Partners',
        isRTL ? 'تطبيق معتمد ومربوط بمتجرك' : 'Store app authorization permissions',
      ],
    },
    shopify: {
      name: isRTL ? 'شوبيفاي' : 'Shopify Store',
      desc: isRTL
        ? 'مزامنة الكتالوج وقاعدة بيانات العملاء وسجلات الطلبات لتفعيل البيع الآلي عبر المحادثات.'
        : 'Connect your Shopify store to enable product catalog lookups and automated order updates.',
      requirements: [
        isRTL ? 'اسم نطاق متجر شوبيفاي (myshopify.com)' : 'Your store domain (e.g. store.myshopify.com)',
        isRTL ? 'صلاحيات تطبيق شوبيفاي المخصص' : 'Shopify app installation & webhook scopes',
      ],
    },
    woocommerce: {
      name: isRTL ? 'WooCommerce' : 'WooCommerce Store',
      desc: isRTL
        ? 'ربط مشفر لمتاجر ووردبريس ومزامنة تفاصيل المنتجات والطلبات عبر WooCommerce REST API.'
        : 'Encrypted bridge to your WordPress WooCommerce store via REST API for catalog synchronization.',
      requirements: [
        isRTL ? 'موقع ووردبريس ببروتوكول HTTPS' : 'WordPress site with valid SSL/HTTPS',
        isRTL ? 'مفتاح المستهلك ومفتاح السر للـ API' : 'Consumer Key & Secret credentials',
      ],
    },
  }

  const filtered = ALL_CHANNELS.filter((ch) => {
    const q = searchQuery.toLowerCase().trim()
    const meta = localizedChannels[ch.id] || { name: ch.name, desc: ch.description }
    const matchesSearch =
      !q ||
      meta.name.toLowerCase().includes(q) ||
      meta.desc.toLowerCase().includes(q)
    const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleContinue = async () => {
    if (!selectedChannel) return
    setConnecting(true)
    setError(null)
    try {
      await onContinueConnection(selectedChannel)
      onClose()
    } catch (err: any) {
      setError(err?.message || (isRTL ? 'تعذر إتمام عملية الربط.' : 'Could not proceed with connection.'))
    } finally {
      setConnecting(false)
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
                ? 'اختر المنصة التي ترغب في ربطها لبدء استقبال المحادثات والمزامنة.'
                : 'Select a platform to authorize and start routing customer conversations.'}
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

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={connecting}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleContinue}
              disabled={!selectedChannel || connecting}
              icon={<ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />}
            >
              {connecting
                ? isRTL ? 'جارٍ الربط...' : 'Connecting…'
                : isRTL ? 'متابعة الربط' : 'Authorize & Connect'}
            </Button>
          </div>
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

        {/* Channels Grid Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1" data-lenis-prevent>
          {filtered.map((ch) => {
            const isSelected = selectedChannel?.id === ch.id
            const meta = localizedChannels[ch.id] || {
              name: ch.name,
              desc: ch.description,
              requirements: [],
            }

            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch)}
                className={`group flex items-start gap-3.5 rounded-2xl border p-4 text-start transition-all relative ${
                  isSelected
                    ? 'border-brand bg-brand/[0.06] shadow-sm ring-1 ring-brand/40'
                    : 'border-border/70 bg-surface/70 hover:border-brand/40 hover:bg-surface-elevated'
                }`}
              >
                {/* Platform Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface shadow-xs transition-transform group-hover:scale-105 mt-0.5">
                  <ChannelIcon type={ch.id as any} size={24} />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-text-primary">{meta.name}</h4>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                        <CheckCircle2 size={13} />
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {meta.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Channel Requirements Footer Preview */}
        {selectedChannel && localizedChannels[selectedChannel.id]?.requirements?.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-surface p-3 text-xs space-y-1.5">
            <span className="font-bold text-text-tertiary uppercase text-[10px] block">
              {isRTL ? 'متطلبات الربط السريع:' : 'Quick Connection Checklist:'}
            </span>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {localizedChannels[selectedChannel.id].requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
