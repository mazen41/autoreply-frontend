'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  InboxIcon,
  ChannelsIcon,
  WhatsAppIcon,
  ContentIcon,
  ReputationIcon,
  ReportsIcon,
  AIKnowledgeIcon,
  SettingsIcon,
  BillingIcon,
  HelpIcon,
  SearchIcon,
  BellIcon,
  MenuIcon,
  XIcon,
  UserIcon,
  LogOutIcon,
  PlusIcon,
  NazLogoIcon
} from '../ui/DashboardIcons'

const NAV = [
  { icon: HomeIcon, key: 'dashboard', href: '/dashboard' },
  { icon: InboxIcon, key: 'inbox', href: '/dashboard/inbox' },
  { icon: ChannelsIcon, key: 'channels', href: '/dashboard/channels' },
  { icon: WhatsAppIcon, key: 'whatsapp', href: '/dashboard/whatsapp' },
  { icon: ContentIcon, key: 'content', href: '/dashboard/content' },
  { icon: ReputationIcon, key: 'reputation', href: '/dashboard/reputation' },
  { icon: ReportsIcon, key: 'reports', href: '/dashboard/reports' },
  { icon: AIKnowledgeIcon, key: 'aiKnowledge', href: '/dashboard/ai-knowledge' },
]

const NAV_BOTTOM = [
  { icon: SettingsIcon, key: 'settings', href: '/dashboard/settings' },
  { icon: BillingIcon, key: 'billing', href: '/dashboard/billing' },
]

const NOTIFICATIONS = [
  { type: 'alert', ar: 'رسالة تحتاج تدخلك — Instagram', en: 'Message needs attention — Instagram', time: '5 دقائق', href: '/dashboard/inbox' },
  { type: 'review', ar: 'تقييم جديد على Google', en: 'New Google review', time: 'ساعة', href: '/dashboard/reputation' },
  { type: 'draft', ar: 'مسودة رد بانتظار موافقتك — Gmail', en: 'Draft reply awaiting approval — Gmail', time: '3 ساعات', href: '/dashboard/inbox' },
]

function useUser() {
  const [user, setUser] = useState<{ name: string; email: string; onboarding_completed: boolean } | null>(null)
  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).then(r => r.json()).then(setUser).catch(() => {})
  }, [])
  return user
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isRTL, t, setLang } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const user = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const allNav = [...NAV, ...NAV_BOTTOM]
  const current = allNav.find(n => n.href === pathname)
  const pageTitle = current ? (t.nav as any)[current.key] : t.nav.dashboard

  const logout = () => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (token) fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    document.cookie = 'naz_token=; max-age=0; path=/'
    router.push('/login')
  }

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 64 }
  }

  const NavItem = ({ item, isBottom = false }: { item: any; isBottom?: boolean }) => {
    const active = pathname === item.href
    const Icon = item.icon
    const label = (t.nav as any)[item.key]

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileSidebar(false)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group"
        style={{
          background: active ? 'var(--accent-subtle)' : 'transparent',
          borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
          borderRight: isRTL ? (active ? '2px solid var(--accent)' : '2px solid transparent') : '2px solid transparent',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'var(--accent-subtle)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }
        }}
      >
        <Icon size={20} />
        {(!collapsed || mobileSidebar) && (
          <span className="text-sm font-semibold flex-1">{label}</span>
        )}
        {collapsed && !mobileSidebar && (
          <div
            className={`absolute ${isRTL ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 rounded-lg text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Background effects */}
      <div className="os-bg">
        <div className="orb-lime" />
        <div className="orb-cyan" />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebar(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={collapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full z-50 glass`}
        style={{ background: 'color-mix(in srgb, var(--surface-elevated) 88%, transparent)', borderRight: isRTL ? 'none' : '1px solid var(--border)', borderLeft: isRTL ? '1px solid var(--border)' : 'none' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-5 mb-2">
            <NazLogoIcon size={24} />
            {(!collapsed || mobileSidebar) && (
              <span className="text-xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em', fontFamily: 'Space Grotesk, sans-serif' }}>
                Naz
              </span>
            )}
          </div>

          {/* Main nav */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {NAV.map(item => <NavItem key={item.href} item={item} />)}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-3" style={{ height: 1, background: 'var(--border)' }} />

          {/* Bottom nav */}
          <nav className="px-3 space-y-1 pb-4">
            {NAV_BOTTOM.map(item => <NavItem key={item.href} item={item} isBottom />)}

            {/* Help */}
            {(!collapsed || mobileSidebar) && (
              <button
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <HelpIcon size={20} />
                <span className="text-sm font-semibold">{isRTL ? 'مساعدة' : 'Help'}</span>
              </button>
            )}
          </nav>

          {/* User card */}
          {(!collapsed || mobileSidebar) && user && (
            <div className="p-4 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${isRTL ? 'mr-0 md:mr-64' : 'ml-0 md:ml-64'} ${collapsed ? (isRTL ? 'md:mr-16' : 'md:ml-16') : ''}`}
      >
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 glass"
          style={{ height: 64, background: 'color-mix(in srgb, var(--surface-elevated) 82%, transparent)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileSidebar(!mobileSidebar)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {mobileSidebar ? <XIcon size={20} /> : <MenuIcon size={20} />}
              </button>

              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:block p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <MenuIcon size={20} />
              </button>

              <div className="hidden md:block">
                <h1 className="text-lg font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {pageTitle}
                </h1>
              </div>
            </div>

            {/* Center - Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm input-os"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                  ⌘K
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Language toggle */}
              <button
                onClick={() => setLang(isRTL ? 'en' : 'ar')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'var(--divider)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--divider)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {isRTL ? 'AR' : 'EN'}
              </button>

              {/* Trial countdown */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
                <div className="w-2 h-2 rounded-full status-live" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  {isRTL ? '٧ أيام متبقية' : '7 days left'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-lg transition-colors relative"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <BellIcon size={20} />
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-80 glass rounded-xl overflow-hidden z-50"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {isRTL ? 'الإشعارات' : 'Notifications'}
                        </h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {NOTIFICATIONS.map((notif, i) => (
                          <Link
                            key={i}
                            href={notif.href}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors"
                            style={{ borderBottom: i < NOTIFICATIONS.length - 1 ? '1px solid var(--divider)' : 'none' }}
                          >
                            <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: notif.type === 'alert' ? 'var(--accent)' : notif.type === 'review' ? 'var(--accent)' : 'var(--accent)' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {isRTL ? notif.ar : notif.en}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {notif.time}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent-text)' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-56 glass rounded-xl overflow-hidden z-50"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--border)'
                            e.currentTarget.style.color = 'var(--text-primary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                          }}
                        >
                          <UserIcon size={16} />
                          {isRTL ? 'الإعدادات' : 'Settings'}
                        </Link>
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-subtle)'
                            e.currentTarget.style.color = 'var(--accent)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                          }}
                        >
                          <LogOutIcon size={16} />
                          {isRTL ? 'تسجيل خروج' : 'Logout'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
