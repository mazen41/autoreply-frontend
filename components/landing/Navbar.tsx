'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'

const NAV_LINKS = [
  { labelKey: 'commandCenter', href: '#command-center' },
  { labelKey: 'aiNetwork',     href: '#ai-brain' },
  { labelKey: 'pricing',       href: '#pricing' },
]

export default function Navbar() {
  const { toggleLang, lang, isRTL, t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const linkLabels: Record<string, string> = {
    commandCenter: isRTL ? 'مركز التحكم' : 'Command Center',
    aiNetwork:     isRTL ? 'شبكة الذكاء' : 'AI Network',
    pricing:       isRTL ? 'الأسعار'      : 'Pricing',
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(5,5,5,0.85)' : 'rgba(5,5,5,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(198,255,0,0.08)' : 'rgba(255,255,255,0.04)'}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(198,255,0,0.15), rgba(198,255,0,0.05))',
                  border: '1px solid rgba(198,255,0,0.3)',
                  color: '#C6FF00',
                  boxShadow: '0 0 20px rgba(198,255,0,0.15)',
                }}
              >
                ✦
              </div>
            </div>
            <span className="text-[1.4rem] font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>
              Naz
            </span>
            <span
              className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.2)' }}
            >
              AI OS
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium relative group"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              >
                {linkLabels[labelKey]}
                <span
                  className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ background: 'var(--accent-primary)' }}
                />
              </a>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(198,255,0,0.06)', border: '1px solid rgba(198,255,0,0.12)' }}>
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#C6FF00' }} />
              <span className="text-xs font-medium" style={{ color: '#C6FF00' }}>{isRTL ? 'مباشر' : 'Live'}</span>
            </div>

            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C6FF00'; e.currentTarget.style.borderColor = 'rgba(198,255,0,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            <Link
              href="/login"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              {t.nav.login}
            </Link>

            <Link
              href="/register"
              className="btn-lime text-sm font-bold px-5 py-2 rounded-xl"
              style={{ letterSpacing: '-0.01em' }}
            >
              {t.nav.startFree}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden py-4 space-y-2 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(5,5,5,0.98)' }}
          >
            {NAV_LINKS.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                className="block py-2.5 px-3 text-sm font-medium rounded-lg"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onClick={() => setMobileOpen(false)}
              >
                {linkLabels[labelKey]}
              </a>
            ))}
            <div className="flex gap-2 px-3 pt-3">
              <button onClick={toggleLang} className="text-xs px-3 py-2 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                {t.nav.login}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold btn-lime">
                {t.nav.startFree}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
