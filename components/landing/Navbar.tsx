'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import { useAuth } from '../../lib/AuthContext'
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Layers,
  Cpu,
  Workflow,
  HelpCircle,
  CreditCard,
  LogIn,
} from 'lucide-react'

export default function Navbar() {
  const { toggleLang, lang, isRTL, t } = useLang()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')

  // Handle scroll detection for glassmorphic styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25)

      // Section active detection for anchor links
      if (pathname === '/') {
        const sections = ['features', 'integrations', 'how-it-works', 'demo', 'pricing', 'faq']
        const current = sections.find((sec) => {
          const el = document.getElementById(sec)
          if (!el) return false
          const rect = el.getBoundingClientRect()
          return rect.top <= 140 && rect.bottom >= 140
        })
        if (current) setActiveSection(current)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  // Close mobile drawer on route change
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname
      setMobileOpen(false)
    }
  }, [pathname])

  const resolveHref = (anchorHref: string) => {
    if (pathname === '/') return anchorHref
    return `/${anchorHref}`
  }

  const navLinks = [
    { id: 'command-center', label: t.nav.commandCenter || (isRTL ? 'مركز التحكم' : 'Command Center'), href: '#demo', icon: Workflow },
    { id: 'features', label: t.nav.features || (isRTL ? 'المميزات' : 'Features'), href: '#features', icon: Sparkles },
    { id: 'integrations', label: isRTL ? 'التكاملات' : 'Integrations', href: '#integrations', icon: Layers },
    { id: 'how-it-works', label: t.nav.howItWorks || (isRTL ? 'كيف يعمل' : 'How It Works'), href: '#how-it-works', icon: Cpu },
    { id: 'pricing', label: t.pricing.title || (isRTL ? 'الأسعار' : 'Pricing'), href: '#pricing', icon: CreditCard },
    { id: 'faq', label: isRTL ? 'الأسئلة الشائعة' : 'FAQ', href: '#faq', icon: HelpCircle },
  ]

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-border bg-background/85 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent py-4'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <Link href="/" className="group flex items-center gap-3" aria-label="Naz AutoReply">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-brand/30 bg-surface-elevated shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/icons/logo_icon.png"
                alt="Naz AutoReply"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
            </div>
            <div className="flex flex-col text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-text-primary">Naz</span>
                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand">
                  AutoReply
                </span>
              </div>
              <span className="text-[10px] font-medium text-text-tertiary">
                {isRTL ? 'منصة الأتمتة الذكية' : 'Autonomous AI'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-surface-elevated/75 p-1 shadow-sm backdrop-blur-md lg:flex">
            {navLinks.map((item) => {
              const isActive = activeSection === item.id
              return (
                <a
                  key={item.id}
                  href={resolveHref(item.href)}
                  className={`relative rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'text-brand'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-brand/20 bg-brand/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              )
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden items-center gap-2.5 md:flex">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-secondary transition-all hover:border-brand/40 hover:text-text-primary hover:shadow-sm"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              aria-label={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
              className="flex h-9 items-center justify-center rounded-xl border border-border bg-surface-elevated px-3 text-xs font-bold text-text-secondary transition-all hover:border-brand/40 hover:text-text-primary hover:shadow-sm"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>

            {/* Auth CTAs */}
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-bold text-brand-text shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <span>{isRTL ? 'لوحة التحكم' : 'Dashboard'}</span>
                <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3.5 text-xs font-bold text-text-primary transition-all hover:border-brand/40 hover:bg-surface-hover"
                >
                  <LogIn size={14} className="text-text-secondary" />
                  <span>{isRTL ? 'تسجيل الدخول' : 'Sign in'}</span>
                </Link>

                <Link
                  href="/register"
                  className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-xl px-4 text-xs font-black text-white shadow-md transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                    boxShadow: '0 4px 14px -2px rgba(23, 105, 255, 0.4)',
                  }}
                >
                  <span>{isRTL ? 'ابدأ الآن' : 'Get Started'}</span>
                  <ArrowRight size={14} className={`transition-transform group-hover:translate-x-0.5 ${isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-secondary"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={toggleLang}
              aria-label="Toggle Language"
              className="flex h-9 items-center justify-center rounded-xl border border-border bg-surface-elevated px-2.5 text-xs font-bold text-text-secondary"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={isRTL ? 'فتح القائمة' : 'Open menu'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-primary"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              role="region"
              aria-label={isRTL ? 'قائمة التنقل' : 'Navigation Menu'}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute left-4 right-4 top-20 max-h-[82vh] overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  {isRTL ? 'قائمة التنقل' : 'Navigation Menu'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="rounded-lg border border-border bg-surface-secondary px-2.5 py-1 text-xs font-bold text-brand"
                  >
                    {lang === 'ar' ? 'EN' : 'عربي'}
                  </button>
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold text-brand">
                    Naz AutoReply
                  </span>
                </div>
              </div>

              {/* Links List */}
              <div className="space-y-1.5">
                {navLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.id}
                      href={resolveHref(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-xl p-3 text-sm font-bold text-text-primary transition-colors hover:bg-surface-secondary hover:text-brand"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface">
                          <Icon size={16} className="text-brand" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight size={14} className={`text-text-tertiary ${isRTL ? 'rotate-180' : ''}`} />
                    </a>
                  )
                })}
              </div>

              {/* Mobile Auth CTAs */}
              <div className="mt-6 border-t border-border pt-5 space-y-2.5">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-brand-text shadow-sm"
                  >
                    <span>{isRTL ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}</span>
                    <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                      }}
                    >
                      <span>{isRTL ? 'ابدأ تجربة مجانية الآن' : 'Start Free Trial'}</span>
                      <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
                    </Link>

                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary py-3 text-sm font-bold text-text-primary"
                    >
                      <LogIn size={16} />
                      <span>{isRTL ? 'تسجيل الدخول' : 'Sign in to account'}</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
