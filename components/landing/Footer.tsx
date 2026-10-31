'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '../../lib/LangContext'
import { useAuth } from '../../lib/AuthContext'

const FOOTER_LINKS = {
  productLinks: ['/#features', '/pricing', '/#how-it-works'],
  companyLinks: ['/blog', '/privacy', '/terms'],
  supportLinks: ['/help-center', 'mailto:support@nazbiz.io'],
} as const

export default function Footer() {
  const { t, isRTL } = useLang()
  const { user } = useAuth()

  return (
    <footer className="relative pt-16 pb-8 border-t border-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/icons/logo_icon.png" alt="NazBiz" width={40} height={40} className="h-10 w-10 object-contain" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full accent-subtle-bg text-primary-color border border-border">NazBiz</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs text-tertiary-color">
              {t.footer.tagline}
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4 text-tertiary-color">
              {isRTL ? t.footer.product : 'PRODUCT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.productLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <Link href={FOOTER_LINKS.productLinks[i] || '/'} className="text-sm text-secondary-color hover:text-accent-secondary transition-colors duration-200">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4 text-tertiary-color">
              {isRTL ? t.footer.company : 'COMPANY'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.companyLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <Link href={FOOTER_LINKS.companyLinks[i] || '/'} className="text-sm text-secondary-color hover:text-accent-secondary transition-colors duration-200">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4 text-tertiary-color">
              {isRTL ? t.footer.support : 'SUPPORT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.supportLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  {FOOTER_LINKS.supportLinks[i]?.startsWith('mailto:')
                    ? <a href={FOOTER_LINKS.supportLinks[i]} className="text-sm text-secondary-color transition-colors hover:text-accent-secondary">{link}</a>
                    : <Link href={FOOTER_LINKS.supportLinks[i] || '/'} className="text-sm text-secondary-color transition-colors hover:text-accent-secondary">{link}</Link>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-divider">
          <div className="text-xs text-tertiary-color">
            {t.footer.copyright}
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard" className="btn-primary text-xs">
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
