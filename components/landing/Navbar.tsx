'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import { useAuth } from '../../lib/AuthContext'
import { Sun, Moon } from 'lucide-react'

const NAV_LINKS = [
  { labelKey: 'commandCenter', href: '#command-center' },
  { labelKey: 'aiNetwork',     href: '#ai-brain' },
  { labelKey: 'pricing',       href: '#pricing' },
]

export default function Navbar() {
  const { toggleLang, lang, isRTL, t } = useLang()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-xl ${
        scrolled
          ? 'border-b border-border bg-background/80 shadow-md shadow-black/20'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icons/logo_icon.png"
              alt="NazBiz"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
            <span className="text-sm font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, var(--accent, #0E7AFE), #8B3FFB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>NazBiz</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium relative group text-text-secondary hover:text-accent-secondary after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:bg-accent-secondary after:group-hover:w-full after:transition-all after:duration-300"
              >
                {linkLabels[labelKey]}
              </a>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full surface-elevated border">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-xs font-medium text-text-secondary">{isRTL ? 'مباشر' : 'Live'}</span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-accent-secondary hover:text-accent-secondary transition-colors duration-200 text-text-secondary"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-transparent hover:border-accent-secondary hover:text-accent-secondary transition-colors duration-200 text-text-secondary"
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            {user ? (
              <Link href="/dashboard" className="btn-primary">
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-text-secondary hover:text-accent-secondary transition-colors duration-200">
                  {t.nav.login}
                </Link>
                <Link href="/register" className="btn-primary">
                  {t.nav.startFree}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-accent-secondary hover:text-accent-secondary transition-colors duration-200 text-text-secondary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border bg-surface">
            {NAV_LINKS.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                className="block py-2.5 px-3 text-sm font-medium rounded-lg text-text-secondary hover:text-accent-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {linkLabels[labelKey]}
              </a>
            ))}
            <div className="flex gap-2 px-3 pt-3">
              <button onClick={toggleTheme} className="text-xs px-3 py-2 rounded-lg border border-transparent hover:border-accent-secondary hover:text-accent-secondary">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={toggleLang} className="text-xs px-3 py-2 rounded-lg border border-transparent hover:border-accent-secondary hover:text-accent-secondary">
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
              {user ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold btn-primary">
                  {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-accent-secondary">
                    {t.nav.login}
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold btn-lime">
                    {t.nav.startFree}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}