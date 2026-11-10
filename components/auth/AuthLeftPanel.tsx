'use client'

import React from 'react'
import BrandWordmark from '../brand/BrandWordmark'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { springs, variants } from '../../lib/motion'
import {
  Zap,
  Bot,
  BarChart3,
  CheckCircle2,
  Lock,
  Sparkles,
  MessageCircle,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react'

interface AuthLeftPanelProps {
  mode: 'login' | 'register'
}

export default function AuthLeftPanel({ mode }: AuthLeftPanelProps) {
  const { isRTL, t } = useLang()
  const isLogin = mode === 'login'

  const integrations = [
    { name: 'WhatsApp', src: '/icons/whatsapp.svg', tag: isRTL ? 'مباشر' : 'Live' },
    { name: 'Instagram', src: '/icons/instagram.svg', tag: isRTL ? 'تفاعلي' : 'DM & Comments' },
    { name: 'Salla', src: '/icons/sllla.svg', tag: isRTL ? 'سلة' : 'E-com' },
    { name: 'Shopify', src: '/icons/shopify.svg', tag: 'Store' },
    { name: 'Facebook', src: '/icons/facebook.svg', tag: 'Messenger' },
    { name: 'WooCommerce', src: '/icons/woocommerce-icon.svg', tag: 'API' },
  ]

  const stats = [
    {
      value: '500+',
      label: isRTL ? 'متجر وشركة نشطة' : 'Active Businesses',
      accent: 'var(--brand)',
    },
    {
      value: '3.2M',
      label: isRTL ? 'رد آلي ذكي مُنجز' : 'Automated Replies',
      accent: 'var(--text-primary)',
    },
    {
      value: '8s',
      label: isRTL ? 'متوسط سرعة الرد' : 'Avg Reply Speed',
      accent: 'var(--brand-cyan)',
    },
    {
      value: '99.4%',
      label: isRTL ? 'دقة الإجابة والمعرفة' : 'Intent Accuracy',
      accent: 'var(--success)',
    },
  ]

  const featurePills = isLogin
    ? [
        {
          icon: <Zap size={16} className="text-brand" />,
          title: isRTL ? 'رد فوري خلال 8 ثوانٍ' : 'Instant 8s Response Time',
          desc: isRTL ? 'الرد على مدار الساعة بدون انقطاع' : 'Continuous 24/7 autonomous engagement',
        },
        {
          icon: <Bot size={16} className="text-brand-violet" />,
          title: isRTL ? 'ذكاء اصطناعي فاهم لنشاطك' : 'Domain-Trained AI Assistant',
          desc: isRTL ? 'مدرب على منتجاتك، أسعارك، وكتالوجك' : 'Trained on your store catalog & business rules',
        },
        {
          icon: <BarChart3 size={16} className="text-brand-cyan" />,
          title: isRTL ? 'ربط مباشر مع منصات المتاجر' : 'Real-Time Commerce Sync',
          desc: isRTL ? 'مزامنة فورية للطلبات مع سلة وشوبيفاي' : 'Live order lookup with Salla & Shopify',
        },
      ]
    : [
        {
          icon: <CheckCircle2 size={16} className="text-success" />,
          title: isRTL ? 'تجربة مجانية لمدة 14 يوماً' : '14-Day Full Business Trial',
          desc: isRTL ? 'وصول لجميع المزايا بدون قيود' : 'Unrestricted access to all core capabilities',
        },
        {
          icon: <Lock size={16} className="text-brand" />,
          title: isRTL ? 'بدون بطاقة ائتمان للبدء' : 'No Credit Card Required',
          desc: isRTL ? 'ابدأ الإعداد فوراً وجرّب بنفسك' : 'Get started in under 3 minutes with zero risk',
        },
        {
          icon: <Sparkles size={16} className="text-brand-violet" />,
          title: isRTL ? 'جاهز للعمل خلال 3 دقائق' : 'Ready in 3 Minutes',
          desc: isRTL ? 'ربط سريع بالقنوات بدون أي كود برمجي' : 'No-code integration across your channels',
        },
      ]

  return (
    <aside
      className="relative flex h-full flex-col justify-between overflow-hidden border-e border-border p-8 lg:p-12 xl:p-14"
      style={{
        background: 'var(--surface)',
      }}
    >
      {/* Ambient background decoration */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(23, 105, 255, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(113, 60, 255, 0.12) 0%, transparent 40%),
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
        }}
      />

      {/* Top Header & Brand */}
      <div className="relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <BrandWordmark width="min(44%, 90px)" priority />
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated/70 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              {isRTL ? 'نظام الذكاء الاصطناعي متصل' : 'AI Engine Operational'}
            </span>
          </div>
        </div>

        {/* Hero Copy */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            <Sparkles size={13} />
            <span>
              {isLogin
                ? (isRTL ? 'منصة الأتمتة الرائدة للأعمال' : 'AI Autonomous Commerce Platform')
                : (isRTL ? 'انضم لأكثر من 500 متجر ناجح' : 'Powering 500+ Modern Businesses')}
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-text-primary sm:text-4xl">
            {isLogin ? (
              <>
                {isRTL ? 'مرحباً بعودتك إلى ' : 'Welcome back to '}
                <span className="bg-gradient-to-r from-brand via-brand-violet to-brand-magenta bg-clip-text text-transparent">
                  {isRTL ? 'نذير بزنس' : 'Naz Autoreply'}
                </span>
              </>
            ) : (
              <>
                {isRTL ? 'أتمت مبيعاتك وخدمة عملائك ' : 'Automate Sales & Customer Support '}
                <span className="bg-gradient-to-r from-brand via-brand-violet to-brand-magenta bg-clip-text text-transparent">
                  {isRTL ? 'بالذكاء الاصطناعي' : 'with Real AI'}
                </span>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {isLogin
              ? (isRTL
                  ? 'سجّل الدخول لمتابعة المحادثات، أداء وكلاء الذكاء الاصطناعي، وتقارير المبيعات الفورية عبر جميع قنواتك.'
                  : 'Access your unified inbox, monitor autonomous agent performance, and inspect live multi-channel conversions.')
              : (isRTL
                  ? 'اربط قنوات المراسلة ومتجرك الإلكتروني، ودرّب موظفك الذكي للرد على استفسارات العملاء وإتمام الطلبات على مدار الساعة.'
                  : 'Connect your channels, link your online store, and deploy a self-learning assistant that replies and converts 24/7.')}
          </p>
        </motion.div>

        {/* Interactive Live Simulation Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-surface-elevated/90 p-4 shadow-xl backdrop-blur-md"
        >
          {/* Card top bar */}
          <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={16} height={16} className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-text-primary">
                  {isRTL ? 'محادثة عميل حية' : 'Live Customer Chat'}
                </span>
                <span className="block text-[10px] text-text-tertiary">WhatsApp Direct API</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
              <Clock size={11} />
              <span>{isRTL ? 'رد خلال 7 ثوانٍ' : 'Replied in 7s'}</span>
            </div>
          </div>

          {/* Chat message thread */}
          <div className="space-y-2.5 text-xs">
            {/* Customer bubble */}
            <div className="flex justify-start">
              <div
                className="max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-text-primary"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              >
                <p className="font-medium">
                  {isRTL
                    ? 'السلام عليكم، هل الشاحن السريع متوفر في متجركم والتوصيل متاح اليوم لجدة؟'
                    : 'Hi! Is the fast wireless charger in stock and available for express delivery to Riyadh today?'}
                </p>
                <span className="mt-1 block text-end text-[9px] text-text-tertiary">10:42 AM</span>
              </div>
            </div>

            {/* AI Response bubble */}
            <div className="flex justify-end">
              <div
                className="relative max-w-[90%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-violet) 100%)' }}
              >
                <div className="mb-1 flex items-center gap-1.5 font-bold text-white/90">
                  <Bot size={13} />
                  <span className="text-[10px] uppercase tracking-wider">
                    {isRTL ? 'مساعد نذير الذكي' : 'Naz AI Assistant'}
                  </span>
                  <span className="rounded bg-white/20 px-1 py-0.2 text-[9px]">Verified</span>
                </div>
                <p className="leading-relaxed">
                  {isRTL
                    ? 'وعليكم السلام! نعم متوفر بخصم 15% اليوم (129 ر.س)، والتوصيل متاح خلال 3 ساعات لجدة 🚀 هل تحب أجهّز لك رابط الطلب المباشر؟'
                    : 'Hello! Yes, it is in stock with 15% off today (SAR 129), and express 3-hour delivery is ready for Riyadh 🚀 Would you like the instant checkout link?'}
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-1.5 text-[10px] text-white/80">
                  <span className="flex items-center gap-1">
                    <ShoppingBag size={11} />
                    {isRTL ? 'مربوط بمتجر سلة' : 'Synced with Salla Store'}
                  </span>
                  <span>10:42 AM ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="space-y-2.5">
          {featurePills.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: isRTL ? 14 : -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
              className="group flex items-center gap-3.5 rounded-xl border border-border bg-surface-elevated/40 p-3 transition-all hover:border-brand/40 hover:bg-surface-elevated"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary shadow-sm transition-transform group-hover:scale-105">
                {feature.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-text-primary">{feature.title}</div>
                <div className="text-[11px] text-text-secondary">{feature.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Middle/Bottom: Supported Integrations Row */}
      <div className="relative z-10 my-6 border-y border-border py-4">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
          {isRTL ? 'قنوات المراسلة والمتاجر المتكاملة' : 'UNIFIED CHANNELS & E-COMMERCE'}
        </p>
        <div className="flex flex-wrap gap-2">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary shadow-2xs transition-colors hover:border-brand/40 hover:text-text-primary"
            >
              <Image src={item.src} alt={item.name} width={15} height={15} className="h-3.5 w-3.5 object-contain" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom KPI Counters */}
      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface-elevated/50 p-2.5 text-center transition-colors hover:bg-surface-elevated"
          >
            <div className="text-lg font-black tracking-tight" style={{ color: s.accent }}>
              {s.value}
            </div>
            <div className="mt-0.5 text-[10px] font-medium leading-tight text-text-tertiary">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
