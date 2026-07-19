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
  { icon: HomeIcon, ar: 'الرئيسية', en: 'Overview', href: '/dashboard' },
  { icon: InboxIcon, ar: 'صندوق الوارد', en: 'Inbox', href: '/dashboard/inbox' },
  { icon: ChannelsIcon, ar: 'القنوات', en: 'Channels', href: '/dashboard/channels' },
  { icon: WhatsAppIcon, ar: 'واتساب', en: 'WhatsApp', href: '/dashboard/whatsapp' },
  { icon: ContentIcon, ar: 'المحتوى', en: 'Content', href: '/dashboard/content' },
  { icon: ReputationIcon, ar: 'السمعة', en: 'Reputation', href: '/dashboard/reputation' },
  { icon: ReportsIcon, ar: 'التقارير', en: 'Reports', href: '/dashboard/reports' },
]

const NAV_BOTTOM = [
  { icon: SettingsIcon, ar: 'الإعدادات', en: 'Settings', href: '/dashboard/settings' },
  { icon: BillingIcon, ar: 'الاشتراك', en: 'Billing', href: '/dashboard/billing' },
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
  const pageTitle = current ? (isRTL ? current.ar : current.en) : t.nav.dashboard

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

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileSidebar(false)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group"
        style={{
          background: active ? 'rgba(198,255,0,0.08)' : 'transparent',
          borderLeft: active ? '2px solid #3B82F6' : '2px solid transparent',
          borderRight: isRTL ? (active ? '2px solid #3B82F6' : '2px solid transparent') : '2px solid transparent',
          color: active ? '#3B82F6' : 'rgba(136,136,170,0.8)',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'rgba(198,255,0,0.04)'
            e.currentTarget.style.color = 'rgba(240,240,255,0.9)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(136,136,170,0.8)'
          }
        }}
      >
        <Icon size={20} />
        {(!collapsed || mobileSidebar) && (
          <span className="text-sm font-semibold flex-1">{isRTL ? item.ar : item.en}</span>
        )}
        {collapsed && !mobileSidebar && (
          <div
            className={`absolute ${isRTL ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 rounded-lg text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}
            style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.06)', color: '#F0F0FF' }}
          >
            {isRTL ? item.ar : item.en}
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
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
        style={{ background: '#0D0D13', borderRight: isRTL ? 'none' : '1px solid rgba(255,255,255,0.06)', borderLeft: isRTL ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-5 mb-2">
            <NazLogoIcon size={24} />
            {(!collapsed || mobileSidebar) && (
              <span className="text-xl font-black" style={{ color: '#F0F0FF', letterSpacing: '-0.04em', fontFamily: 'Space Grotesk, sans-serif' }}>
                Naz
              </span>
            )}
          </div>

          {/* Main nav */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {NAV.map(item => <NavItem key={item.href} item={item} />)}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Bottom nav */}
          <nav className="px-3 space-y-1 pb-4">
            {NAV_BOTTOM.map(item => <NavItem key={item.href} item={item} isBottom />)}

            {/* Help */}
            {(!collapsed || mobileSidebar) && (
              <button
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full"
                style={{ color: 'rgba(136,136,170,0.8)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#F0F0FF'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(136,136,170,0.8)'}
              >
                <HelpIcon size={20} />
                <span className="text-sm font-semibold">{isRTL ? 'مساعدة' : 'Help'}</span>
              </button>
            )}
          </nav>

          {/* User card */}
          {(!collapsed || mobileSidebar) && user && (
            <div className="p-4 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'var(--accent)', color: '#FFFFFF' }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#F0F0FF' }}>
                    {user.name}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(136,136,170,0.8)' }}>
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
          style={{ height: 64, background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileSidebar(!mobileSidebar)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'rgba(136,136,170,0.8)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#F0F0FF'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(136,136,170,0.8)'}
              >
                {mobileSidebar ? <XIcon size={20} /> : <MenuIcon size={20} />}
              </button>

              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:block p-2 rounded-lg transition-colors"
                style={{ color: 'rgba(136,136,170,0.8)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#F0F0FF'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(136,136,170,0.8)'}
              >
                <MenuIcon size={20} />
              </button>

              <div className="hidden md:block">
                <h1 className="text-lg font-bold" style={{ color: '#F0F0FF', letterSpacing: '-0.02em' }}>
                  {pageTitle}
                </h1>
              </div>
            </div>

            {/* Center - Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(136,136,170,0.6)' }} />
                <input
                  type="text"
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm input-os"
                  style={{ background: 'rgba(17,17,17,0.8)', border: '1px solid rgba(255,255,255,0.06)', color: '#F0F0FF' }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(136,136,170,0.6)' }}>
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
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(136,136,170,0.8)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = '#F0F0FF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'rgba(136,136,170,0.8)'
                }}
              >
                {isRTL ? 'AR' : 'EN'}
              </button>

              {/* Trial countdown */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)' }}>
                <div className="w-2 h-2 rounded-full status-live" style={{ background: '#FFB800' }} />
                <span className="text-xs font-semibold" style={{ color: '#FFB800' }}>
                  {isRTL ? '٧ أيام متبقية' : '7 days left'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-lg transition-colors relative"
                  style={{ color: 'rgba(136,136,170,0.8)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#F0F0FF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(136,136,170,0.8)'}
                >
                  <BellIcon size={20} />
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#FF4D6D' }} />
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-80 glass rounded-xl overflow-hidden z-50"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 className="text-sm font-bold" style={{ color: '#F0F0FF' }}>
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
                            style={{ borderBottom: i < NOTIFICATIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                          >
                            <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: notif.type === 'alert' ? '#FF4D6D' : notif.type === 'review' ? '#FFB800' : '#00D68F' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm" style={{ color: '#F0F0FF' }}>
                                {isRTL ? notif.ar : notif.en}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'rgba(136,136,170,0.6)' }}>
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
                  style={{ background: 'var(--accent)', color: '#FFFFFF' }}
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
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-sm font-semibold" style={{ color: '#F0F0FF' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(136,136,170,0.6)' }}>
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                          style={{ color: 'rgba(136,136,170,0.8)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                            e.currentTarget.style.color = '#F0F0FF'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'rgba(136,136,170,0.8)'
                          }}
                        >
                          <UserIcon size={16} />
                          {isRTL ? 'الإعدادات' : 'Settings'}
                        </Link>
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
                          style={{ color: 'rgba(136,136,170,0.8)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,77,109,0.1)'
                            e.currentTarget.style.color = '#FF4D6D'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'rgba(136,136,170,0.8)'
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
