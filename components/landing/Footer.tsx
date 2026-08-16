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
    <footer
      className="relative pt-16 pb-8"
      style={{ borderTop: '1px solid var(--divider)' }}
    >
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border)' }}>AI OS</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? t.footer.tagline : 'Your AI employee that never sleeps.'}
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {['𝕏', 'in', 'f'].map((s, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200"
                  style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-secondary)'; e.currentTarget.style.color = 'var(--accent-secondary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? t.footer.product : 'PRODUCT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.productLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? t.footer.company : 'COMPANY'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.companyLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {isRTL ? t.footer.support : 'SUPPORT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.supportLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid var(--divider)' }}
        >
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {isRTL ? t.footer.copyright : '© 2025. All rights reserved.'}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isRTL ? 'جميع الأنظمة تعمل' : 'All systems operational'}
              </span>
            </div>
            {user && (
              <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
