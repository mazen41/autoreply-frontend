'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '../../lib/LangContext'
import { useAuth } from '../../lib/AuthContext'
import {
  ShieldCheck,
  Mail,
  ArrowUpRight,
  Heart,
  Globe,
} from 'lucide-react'

export default function Footer() {
  const { isRTL } = useLang()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { labelEn: 'Features', labelAr: 'المزايا الرئيسية', href: '/#features' },
    { labelEn: 'Integrations', labelAr: 'التكاملات والقنوات', href: '/#integrations' },
    { labelEn: 'How It Works', labelAr: 'كيف يعمل', href: '/#how-it-works' },
    { labelEn: 'Product Tour', labelAr: 'عرض تفاعلي', href: '/#demo' },
    { labelEn: 'Pricing Plans', labelAr: 'باقات الأسعار', href: '/#pricing' },
    { labelEn: 'FAQ', labelAr: 'الأسئلة الشائعة', href: '/#faq' },
  ]

  const integrations = [
    { label: 'WhatsApp Cloud API', href: '/#integrations' },
    { label: 'Instagram Direct', href: '/#integrations' },
    { label: 'Salla (سلة)', href: '/#integrations' },
    { label: 'Shopify Store', href: '/#integrations' },
    { label: 'WooCommerce', href: '/#integrations' },
    { label: 'Telegram Bot', href: '/#integrations' },
  ]

  const legalLinks = [
    { labelEn: 'Privacy Policy', labelAr: 'سياسة الخصوصية', href: '/privacy' },
    { labelEn: 'Terms of Service', labelAr: 'شروط الخدمة', href: '/terms' },
    { labelEn: 'Data Protection & Security', labelAr: 'حماية وأمان البيانات', href: '/privacy' },
  ]

  return (
    <footer className="relative border-t border-border bg-surface-elevated/40 pt-16 pb-12 text-start">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand Info */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="Naz AutoReply">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/30 bg-surface-elevated shadow-sm">
                <Image
                  src="/icons/logo_icon.png"
                  alt="Naz AutoReply"
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-text-primary">Naz</span>
                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-brand">
                  AutoReply
                </span>
              </div>
            </Link>

            <p className="max-w-xs text-xs sm:text-sm leading-relaxed text-text-secondary">
              {isRTL
                ? 'المنصة الرائدة لأتمتة محادثات الأعمال والمتاجر الإلكترونية بالذكاء الاصطناعي عبر جميع قنوات التواصل.'
                : 'Enterprise autonomous conversational AI platform connecting messaging apps and commerce stores into one intelligent workspace.'}
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <ShieldCheck size={16} className="text-success" />
              <span>{isRTL ? 'حماية بيانات مشفرة بالكامل' : 'Enterprise Bank-Grade Encryption'}</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {isRTL ? 'المنتج' : 'PRODUCT'}
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {productLinks.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-text-secondary transition-colors hover:text-brand"
                  >
                    {isRTL ? item.labelAr : item.labelEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {isRTL ? 'التكاملات' : 'INTEGRATIONS'}
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {integrations.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-text-secondary transition-colors hover:text-brand"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {isRTL ? 'قانوني ودعم' : 'LEGAL & SUPPORT'}
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {legalLinks.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-text-secondary transition-colors hover:text-brand"
                  >
                    {isRTL ? item.labelAr : item.labelEn}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:support@nazbiz.io"
                  className="flex items-center gap-1.5 text-text-secondary transition-colors hover:text-brand"
                >
                  <Mail size={13} />
                  <span>support@nazbiz.io</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-text-tertiary sm:flex-row">
          <p>© {currentYear} Naz AutoReply. {isRTL ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-text-primary">
              {isRTL ? 'الخصوصية' : 'Privacy'}
            </Link>
            <span>•</span>
            <Link href="/terms" className="transition-colors hover:text-text-primary">
              {isRTL ? 'الشروط' : 'Terms'}
            </Link>
            {user && (
              <>
                <span>•</span>
                <Link href="/dashboard" className="font-bold text-brand hover:underline">
                  {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
