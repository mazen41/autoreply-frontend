'use client'

import React from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'
import { useAuth } from '../../lib/AuthContext'
import Image from 'next/image'

export default function Footer() {
  const { t, isRTL } = useLang()
  const { user } = useAuth()

  return (
    <footer className="relative pt-16 pb-8 border-t border-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/icons/logo.png"
                alt="NazBiz Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full accent-subtle-bg accent-text border border-border">AI OS</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs text-tertiary-color">
              {isRTL ? t.footer.tagline : 'Your AI employee that never sleeps.'}
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {['𝕏', 'in', 'f'].map((s, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 surface-elevated border border-border text-tertiary-color hover:border-accent-secondary hover:text-accent-secondary"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4 text-tertiary-color">
              {isRTL ? t.footer.product : 'PRODUCT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.productLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm text-secondary-color hover:text-accent-secondary transition-colors duration-200">{link}</a>
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
                  <a href="#" className="text-sm text-secondary-color hover:text-accent-secondary transition-colors duration-200">{link}</a>
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
                  <a href="#" className="text-sm text-secondary-color hover:text-accent-secondary transition-colors duration-200">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-divider">
          <div className="text-xs text-tertiary-color">
            {isRTL ? t.footer.copyright : '© 2025. All rights reserved.'}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full status-live accent-bg accent-shadow-lg" aria-hidden="true" />
              <span className="text-xs text-tertiary-color">
                {isRTL ? 'جميع الأنظمة تعمل' : 'All systems operational'}
              </span>
            </div>
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