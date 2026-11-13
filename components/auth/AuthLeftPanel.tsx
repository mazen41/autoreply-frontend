'use client'

import React from 'react'
import BrandWordmark from '../brand/BrandWordmark'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import {
  Zap,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Layers,
} from 'lucide-react'

interface AuthLeftPanelProps {
  mode: 'login' | 'register'
}

export default function AuthLeftPanel({ mode }: AuthLeftPanelProps) {
  const { isRTL } = useLang()
  const isLogin = mode === 'login'

  const channelIcons = [
    { name: 'WhatsApp', src: '/icons/whatsapp.svg' },
    { name: 'Instagram', src: '/icons/instagram.svg' },
    { name: 'Salla', src: '/icons/sllla.svg' },
    { name: 'Shopify', src: '/icons/shopify.svg' },
    { name: 'Telegram', src: '/icons/telegram.svg' },
    { name: 'Messenger', src: '/icons/facebook.svg' },
  ]

  return (
    <aside
      className="relative flex h-full flex-col justify-between overflow-hidden border-e border-border/80 p-8 lg:p-12 xl:p-14"
      style={{
        background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-secondary) 100%)',
      }}
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(23, 105, 255, 0.16) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(113, 60, 255, 0.16) 0%, transparent 45%),
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Top Header & Brand */}
      <div className="relative z-10">
        <div className="mb-10 flex items-center justify-between">
          <BrandWordmark width="84px" priority />
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-500 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>{isRTL ? 'محرك الذكاء الاصطناعي متصل' : 'AI Engine Operational'}</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <Sparkles size={12} />
            <span>
              {isLogin
                ? (isRTL ? 'إدارة محادثات الأعمال الذكية' : 'Autonomous Conversational AI')
                : (isRTL ? 'تجربة كاملة مجاناً لمدة 14 يوماً' : '14-Day Full Business Trial')}
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl xl:text-4xl">
            {isLogin
              ? (isRTL ? 'أهلاً بك مجدداً في نزار أوتوريبلاي' : 'Welcome back to Naz AutoReply')
              : (isRTL ? 'أتمتة خدمة عملائك ومبيعاتك بلا توقف' : 'Scale sales & 24/7 customer support with AI')}
          </h2>

          <p className="text-xs leading-relaxed text-text-secondary sm:text-sm">
            {isLogin
              ? (isRTL
                  ? 'قم بإدارة صندوق الوارد الموحد ومتابعة أداء وكلائك الأذكياء عبر واتساب وإنستغرام وتيليجرام ومتاجرك.'
                  : 'Access your unified inbox, monitor autonomous agent performance, and inspect live multi-channel conversions.')
              : (isRTL
                  ? 'اربط قنوات واتساب وإنستغرام ومتاجرك في سلة وشوبيفاي في أقل من 3 دقائق، ودع الذكاء الاصطناعي يتولى الرد والمبيعات.'
                  : 'Connect WhatsApp, Instagram, Telegram, and your online store in under 3 minutes. Automate 90% of conversations instantly.')}
          </p>
        </div>

        {/* Live Conversational Simulation Card */}
        <div className="mt-8 relative overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated/90 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 shrink-0">
                <Image src="/icons/whatsapp.svg" alt="WhatsApp" fill className="object-contain" />
              </div>
              <div className="text-start">
                <div className="text-xs font-bold text-text-primary">
                  {isRTL ? 'محادثة عميل فورية' : 'Live WhatsApp Influx'}
                </div>
                <div className="text-[10px] text-text-tertiary">
                  {isRTL ? 'ربط رسمي سحابي Cloud API' : 'Official Cloud API • Verified'}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
              <Zap size={10} />
              <span>{isRTL ? 'رد فوري 0.8 ث' : '0.8s reply'}</span>
            </span>
          </div>

          <div className="mt-4 space-y-3 text-start">
            {/* Customer Bubble */}
            <div className="rounded-xl rounded-tr-none bg-surface-secondary/80 p-3 text-xs text-text-secondary border border-border/40">
              <p>
                {isRTL
                  ? 'مرحباً، هل متوفر عندكم شاحن لاسلكي سريع وكم يستغرق التوصيل للرياض؟'
                  : 'Hi! Is the fast wireless charger in stock and can it be delivered to Riyadh today?'}
              </p>
              <div className="mt-1 text-end text-[10px] text-text-tertiary">10:42 AM</div>
            </div>

            {/* AI Assistant Bubble with Reasoning */}
            <div className="rounded-xl rounded-tl-none border border-brand/25 bg-gradient-to-br from-brand/15 to-brand-violet/10 p-3.5 text-xs shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand">
                  <Bot size={13} />
                  <span>{isRTL ? 'مساعد نزار الذكي' : 'Naz AI Assistant'}</span>
                  <span className="rounded bg-brand/20 px-1 py-0.2 text-[9px]">Verified</span>
                </div>
                <span className="text-[10px] text-text-tertiary">10:42 AM ✓✓</span>
              </div>
              <p className="text-text-primary leading-relaxed">
                {isRTL
                  ? 'أهلاً بك! نعم متوفر الشاحن الذكي بخصم 15% اليوم (129 ر.س)، ومتاح التوصيل السريع خلال 3 ساعات للرياض 🚀 هل تود رابط الدفع الفوري؟'
                  : 'Hello! Yes, it is in stock with 15% off today (SAR 129), and express 3-hour delivery is ready for Riyadh 🚀 Would you like the instant checkout link?'}
              </p>
              <div className="mt-2.5 flex items-center gap-2 border-t border-brand/20 pt-2 text-[10px] text-brand-cyan">
                <CheckCircle2 size={11} />
                <span>
                  {isRTL ? 'تمت مزامنة المخزون والأسعار مباشرة مع سلة وشوبيفاي' : 'Live stock & pricing verified via Salla & Shopify API'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle & Bottom Features / Metric Pills */}
      <div className="relative z-10 mt-8 space-y-5">
        {/* Metric Bar */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-surface-elevated/60 p-3 text-center backdrop-blur-md">
          <div>
            <div className="text-base font-black text-brand sm:text-lg">&lt; 1.2s</div>
            <div className="text-[10px] font-medium text-text-tertiary">
              {isRTL ? 'سرعة الاستجابة' : 'Avg Response'}
            </div>
          </div>
          <div className="border-x border-border/60">
            <div className="text-base font-black text-emerald-500 sm:text-lg">99.4%</div>
            <div className="text-[10px] font-medium text-text-tertiary">
              {isRTL ? 'دقة الإجابات' : 'Resolution'}
            </div>
          </div>
          <div>
            <div className="text-base font-black text-brand-violet sm:text-lg">24/7</div>
            <div className="text-[10px] font-medium text-text-tertiary">
              {isRTL ? 'جاهزية مستمرة' : 'Always Online'}
            </div>
          </div>
        </div>

        {/* Connected Channel Logos */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <span className="text-[11px] font-medium text-text-tertiary">
            {isRTL ? 'القنوات المدعومة:' : 'Supported Channels:'}
          </span>
          <div className="flex items-center gap-2">
            {channelIcons.map((ch) => (
              <div
                key={ch.name}
                className="relative h-6 w-6 rounded-lg border border-border/80 bg-surface-elevated p-1 shadow-sm transition-transform hover:scale-110"
                title={ch.name}
              >
                <Image src={ch.src} alt={ch.name} fill className="object-contain p-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Trust Endorsement */}
        <div className="rounded-xl border border-border/40 bg-surface-secondary/50 p-3 text-[11px] text-text-secondary">
          <p className="italic">
            {isRTL
              ? '«نزار أوتوريبلاي رفع مبيعات متجرنا وأجاب على أكثر من 30,000 استفسار ليلي بدقة تامة وبدون أي تدخل بشري.»'
              : '"Naz AutoReply transformed our store operations, handling 30,000+ monthly conversations and recovering abandoned carts effortlessly."'}
          </p>
          <div className="mt-1 font-semibold text-text-primary text-[10px]">
            {isRTL ? '— متجر معتمد في سلة وشوبيفاي' : '— Verified Enterprise E-Commerce Merchant'}
          </div>
        </div>
      </div>
    </aside>
  )
}
