'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import {
  MessageCircle,
  Share2,
  ShoppingBag,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react'

type Category = 'all' | 'messaging' | 'social' | 'ecommerce' | 'email'

interface IntegrationItem {
  id: string
  name: string
  category: Category
  iconSrc?: string
  iconFallback?: string
  brandColor: string
  statusEn: string
  statusAr: string
  descEn: string
  descAr: string
  badgeEn: string
  badgeAr: string
  live: boolean
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    iconSrc: '/icons/whatsapp.svg',
    brandColor: '#25D366',
    statusEn: 'Official Cloud API & Web Session',
    statusAr: 'ربط سحابي رسمي وربط سريع عبر الويب',
    descEn: 'Send automated answers, share product catalogs, and handle order inquiries directly in customer chats.',
    descAr: 'رد آلي على استفسارات العملاء، إرسال روابط المنتجات، ومتابعة الطلبات مباشرة على مدار الساعة.',
    badgeEn: 'Full Direct Support',
    badgeAr: 'دعم كامل ومباشر',
    live: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    iconSrc: '/icons/instagram.svg',
    brandColor: '#E4405F',
    statusEn: 'Direct Meta Graph API',
    statusAr: 'ربط مباشر عبر واجهة ميتا الرسمية',
    descEn: 'Automate Direct Messages (DMs) and instantly reply to story mentions and post comments.',
    descAr: 'أتمتة الرسائل الخاصة (DM) والرد اللحظي على تعليقات المنشورات ومنشن القصص.',
    badgeEn: 'Direct Messages & Comments',
    badgeAr: 'رسائل خاصة وتعليقات',
    live: true,
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    category: 'messaging',
    iconSrc: '/icons/facebook.svg',
    brandColor: '#1877F2',
    statusEn: 'Meta Page Webhooks',
    statusAr: 'ربط مباشر لصفحات الأعمال',
    descEn: 'Convert page visitors into paying customers with 24/7 intelligent answers and lead qualification.',
    descAr: 'تحويل زوار الصفحة إلى عملاء مع ردود ذكية 24/7 وتأهيل مباشر للفرص البيعية.',
    badgeEn: 'Page Messenger',
    badgeAr: 'ماسنجر الصفحات',
    live: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    iconFallback: '🎵',
    brandColor: '#00F2FE',
    statusEn: 'TikTok Business OAuth',
    statusAr: 'ربط رسمي لحسابات أعمال تيك توك',
    descEn: 'Engage video audiences, reply to inquiries from viral content, and guide buyers to your store.',
    descAr: 'التفاعل الفوري مع المتابعين، الرد على استفسارات الفيديوهات، وتوجيه المشترين لمتجرك.',
    badgeEn: 'Business Account',
    badgeAr: 'حسابات الأعمال',
    live: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'messaging',
    iconSrc: '/icons/telegram.svg',
    brandColor: '#2AABEE',
    statusEn: 'Bot API & Webhook',
    statusAr: 'ربط فوري عبر بوت تلغرام والويب هوك',
    descEn: 'High-speed messaging automation for communities, VIP support channels, and group alerts.',
    descAr: 'أتمتة عالية السرعة للمجموعات، قنوات الدعم الخاصة لكبار العملاء، والتنبيهات المباشرة.',
    badgeEn: 'Instant Bot Sync',
    badgeAr: 'مزامنة فورية للبوت',
    live: true,
  },
  {
    id: 'salla',
    name: 'Salla (سلة)',
    category: 'ecommerce',
    iconSrc: '/icons/sllla.svg',
    brandColor: '#00B4D8',
    statusEn: 'Official Merchant App Store Sync',
    statusAr: 'ربط متجر سلة مع مزامنة فورية',
    descEn: 'Real-time order lookup, shipment tracking status, and product stock verification during chat.',
    descAr: 'استعلام فوري عن حالة الطلب، تتبع الشحنات، والتأكد من توفر المخزون أثناء المحادثة.',
    badgeEn: 'E-Commerce Sync',
    badgeAr: 'تكامل متجر إلكتروني',
    live: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    iconSrc: '/icons/shopify.svg',
    brandColor: '#95BF47',
    statusEn: 'Shopify Store Admin API',
    statusAr: 'ربط مباشر عبر واجهة شوبيفاي',
    descEn: 'Check customer order status, lookup product variants, and generate pre-filled checkout links.',
    descAr: 'التحقق من حالة طلبات العملاء، البحث في المنتجات والخيارات، وإنشاء روابط سداد جاهزة.',
    badgeEn: 'Store Admin API',
    badgeAr: 'واجهة إدارة المتجر',
    live: true,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    iconSrc: '/icons/woocommerce-icon.svg',
    brandColor: '#96588A',
    statusEn: 'WordPress REST API Sync',
    statusAr: 'ربط مباشر بمفاتيح REST API',
    descEn: 'Synchronize WordPress & WooCommerce store products, order details, and customer shipping.',
    descAr: 'مزامنة منتجات ووكومرس، تفاصيل الطلبات، وعناوين شحن العملاء بسلاسة تامة.',
    badgeEn: 'WordPress REST API',
    badgeAr: 'ربط ووردبريس',
    live: true,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    iconFallback: '✉️',
    brandColor: '#EA4335',
    statusEn: 'Google Workspace OAuth 2.0',
    statusAr: 'ربط سحابي عبر Google OAuth',
    descEn: 'Draft intelligent AI responses to incoming customer emails and sync email tickets with chat history.',
    descAr: 'صياغة ردود ذكية على استفسارات البريد الوارد ومزامنة التذاكر مع سجل المحادثات.',
    badgeEn: 'Google Workspace',
    badgeAr: 'جوجل وورك سبيس',
    live: true,
  },
]

export default function IntegrationEcosystem() {
  const { isRTL } = useLang()
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const reducedMotion = useHydratedReducedMotion()

  const filtered = INTEGRATIONS.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  )

  const categories: { id: Category; labelEn: string; labelAr: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'all', labelEn: 'All Integrations', labelAr: 'جميع التكاملات', icon: Layers },
    { id: 'messaging', labelEn: 'Messaging Apps', labelAr: 'تطبيقات المراسلة', icon: MessageCircle },
    { id: 'social', labelEn: 'Social Media', labelAr: 'منصات التواصل', icon: Share2 },
    { id: 'ecommerce', labelEn: 'E-Commerce Stores', labelAr: 'المتاجر الإلكترونية', icon: ShoppingBag },
    { id: 'email', labelEn: 'Business Email', labelAr: 'البريد المؤسسي', icon: Mail },
  ]

  return (
    <section id="integrations" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      {/* Background radial accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(0, 217, 255, 0.08), rgba(23, 105, 255, 0.05), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3.5 py-1 text-xs font-bold text-brand-cyan">
            <Layers size={13} />
            <span>{isRTL ? 'منظومة القنوات والتكاملات الفعلية' : 'Live Integration Ecosystem'}</span>
          </div>
          <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {isRTL ? 'قنواتك المفضلة متصلة بنظام واحد ذكي' : 'All Your Channels Connected to One AI Engine'}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {isRTL
              ? 'اربط قنوات المراسلة، منصات التواصل، ومتاجرك الإلكترونية بدون أي تعقيد تقني. يستقبل نذير الرسائل ويوحد العمليات فوراً.'
              : 'Connect social messaging, e-commerce stores, and support channels with zero coding. Naz AutoReply unifies incoming customer conversations in real time.'}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'border border-brand bg-brand text-brand-text shadow-sm'
                    : 'border border-border bg-surface-elevated/70 text-text-secondary hover:border-brand/40 hover:text-text-primary'
                }`}
              >
                <Icon size={14} />
                <span>{isRTL ? cat.labelAr : cat.labelEn}</span>
              </button>
            )
          })}
        </div>

        {/* Integration Cards Grid */}
        <motion.div
          layout
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-elevated/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
              >
                {/* Ambient corner glow */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
                  style={{ background: item.brandColor }}
                  aria-hidden="true"
                />

                <div>
                  {/* Top Bar: Icon + Status Badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-xs transition-transform group-hover:scale-105"
                      style={{ borderColor: `color-mix(in srgb, ${item.brandColor} 30%, var(--border))` }}
                    >
                      {item.iconSrc ? (
                        <Image
                          src={item.iconSrc}
                          alt={item.name}
                          width={26}
                          height={26}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <span className="text-xl">{item.iconFallback}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      <span>{isRTL ? item.badgeAr : item.badgeEn}</span>
                    </div>
                  </div>

                  {/* Title & Connection Protocol */}
                  <h3 className="text-lg font-black tracking-tight text-text-primary">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold" style={{ color: item.brandColor }}>
                    {isRTL ? item.statusAr : item.statusEn}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
                    {isRTL ? item.descAr : item.descEn}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-text-tertiary">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <CheckCircle2 size={13} className="text-success" />
                    <span>{isRTL ? 'جاهز للربط الفوري' : 'Zero-Code Setup'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-brand group-hover:underline">
                    <span>{isRTL ? 'استكشف' : 'Explore'}</span>
                    <ArrowUpRight size={13} />
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
