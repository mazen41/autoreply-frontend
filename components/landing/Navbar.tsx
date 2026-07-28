'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import Image from 'next/image'

const NAV_LINKS = [
  { labelKey: 'commandCenter', href: '#command-center' },
  { labelKey: 'aiNetwork',     href: '#ai-brain' },
  { labelKey: 'pricing',       href: '#pricing' },
]

export default function Navbar() {
  const { toggleLang, lang, isRTL, t } = useLang()
  const { theme, toggleTheme } = useTheme()
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
        background: scrolled ? 'var(--surface)' : 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Image 
                src="/icons/Logo (2).png" 
                alt="Naz Logo" 
                width={120} 
                height={40}
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium relative group"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {linkLabels[labelKey]}
                <span
                  className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ background: 'var(--accent-secondary)' }}
                />
              </a>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'مباشر' : 'Live'}</span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-secondary)'; e.currentTarget.style.borderColor = 'var(--accent-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>

            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-secondary)'; e.currentTarget.style.borderColor = 'var(--accent-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            <Link
              href="/login"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {t.nav.login}
            </Link>

            <Link
              href="/register"
              className="text-sm font-bold px-5 py-2 rounded-xl btn-primary"
              style={{ letterSpacing: '-0.01em' }}
            >
              {t.nav.startFree}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden py-4 space-y-2 border-t"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            {NAV_LINKS.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                className="block py-2.5 px-3 text-sm font-medium rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setMobileOpen(false)}
              >
                {linkLabels[labelKey]}
              </a>
            ))}
            <div className="flex gap-2 px-3 pt-3">
              <button onClick={toggleTheme} className="text-xs px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={toggleLang} className="text-xs px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
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
