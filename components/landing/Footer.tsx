'use client'

import React from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'

export default function Footer() {
  const { t, isRTL } = useLang()

  return (
    <footer
      className="relative pt-16 pb-8"
      style={{ borderTop: '1px solid rgba(198,255,0,0.06)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: 'rgba(198,255,0,0.1)', border: '1px solid rgba(198,255,0,0.2)', color: '#C6FF00' }}
              >
                ✦
              </div>
              <span className="text-xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(198,255,0,0.08)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.15)' }}>AI OS</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isRTL ? t.footer.tagline : 'Your AI employee that never sleeps.'}
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {['𝕏', 'in', 'f'].map((s, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(198,255,0,0.3)'; e.currentTarget.style.color = '#C6FF00' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isRTL ? t.footer.product : 'PRODUCT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.productLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.45)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#C6FF00'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  >{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isRTL ? t.footer.company : 'COMPANY'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.companyLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.45)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#C6FF00'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  >{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isRTL ? t.footer.support : 'SUPPORT'}
            </div>
            <ul className="space-y-2.5">
              {(t.footer.supportLinks || []).map((link: string, i: number) => (
                <li key={i}>
                  <a href="#" className="text-sm transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.45)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#C6FF00'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  >{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {isRTL ? t.footer.copyright : '© 2025 Naz. All rights reserved.'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isRTL ? 'جميع الأنظمة تعمل' : 'All systems operational'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
