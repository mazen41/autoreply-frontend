'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { icon: '🏠', ar: 'الرئيسية',     en: 'Overview',    href: '/dashboard' },
  { icon: '📥', ar: 'صندوق الوارد', en: 'Inbox',       href: '/dashboard/inbox',      badge: 5 },
  { icon: '📢', ar: 'القنوات',      en: 'Channels',    href: '/dashboard/channels' },
  { icon: '✍️', ar: 'المحتوى',      en: 'Content',     href: '/dashboard/content' },
  { icon: '⭐', ar: 'السمعة',       en: 'Reputation',  href: '/dashboard/reputation' },
  { icon: '📊', ar: 'التقارير',     en: 'Reports',     href: '/dashboard/reports' },
]

const NAV_BOTTOM = [
  { icon: '⚙️', ar: 'الإعدادات',   en: 'Settings',    href: '/dashboard/settings' },
  { icon: '💳', ar: 'الاشتراك',    en: 'Billing',     href: '/dashboard/billing' },
]

const NOTIFICATIONS = [
  { type: 'alert', icon: '🔴', ar: 'رسالة تحتاج تدخلك — Instagram', en: 'Message needs attention — Instagram', time: '5 دقائق', href: '/dashboard/inbox' },
  { type: 'review', icon: '⭐', ar: 'تقييم جديد على Google', en: 'New Google review', time: 'ساعة', href: '/dashboard/reputation' },
  { type: 'draft', icon: '🟡', ar: 'مسودة رد بانتظار موافقتك — Gmail', en: 'Draft reply awaiting approval — Gmail', time: '3 ساعات', href: '/dashboard/inbox' },
]

function useUser() {
  const [user, setUser] = useState<{ name: string; email: string; onboarding_completed: boolean } | null>(null)
  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (!token) return
    fetch('http://localhost:8000/api/auth/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).then(r => r.json()).then(setUser).catch(() => {})
  }, [])
  return user
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const user = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // page title
  const allNav = [...NAV, ...NAV_BOTTOM]
  const current = allNav.find(n => n.href === pathname)
  const pageTitle = current ? (isRTL ? current.ar : current.en) : (isRTL ? 'لوحة التحكم' : 'Dashboard')

  const logout = () => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (token) fetch('http://localhost:8000/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    document.cookie = 'naz_token=; max-age=0; path=/'
    router.push('/login')
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 mb-2">
        <span style={{ color: '#C6FF00', fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(198,255,0,0.8))' }}>✦</span>
        {(!collapsed || isMobile) && (
          <span className="text-xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              onClick={() => isMobile && setMobileSidebar(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group"
              style={{
                background: active ? 'rgba(198,255,0,0.08)' : 'transparent',
                borderLeft: active ? '3px solid #C6FF00' : '3px solid transparent',
                color: active ? '#C6FF00' : 'rgba(255,255,255,0.55)',
              }}>
              <span style={{ fontSize: 18, minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
              {(!collapsed || isMobile) && (
                <span className="text-sm font-semibold flex-1">{isRTL ? item.ar : item.en}</span>
              )}
              {item.badge && (!collapsed || isMobile) && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: '#FF3B30', color: '#fff' }}>
                  {item.badge}
                </span>
              )}
              {collapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}>
                  {isRTL ? item.ar : item.en}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Bottom nav */}
      <nav className="px-3 space-y-1 pb-4">
        {NAV_BOTTOM.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              onClick={() => isMobile && setMobileSidebar(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group"
              style={{
                background: active ? 'rgba(198,255,0,0.08)' : 'transparent',
                borderLeft: active ? '3px solid #C6FF00' : '3px solid transparent',
                color: active ? '#C6FF00' : 'rgba(255,255,255,0.55)',
              }}>
              <span style={{ fontSize: 18, minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
              {(!collapsed || isMobile) && (
                <span className="text-sm font-semibold">{isRTL ? item.ar : item.en}</span>
              )}
            </Link>
          )
        })}

        {/* Help */}
        {(!collapsed || isMobile) && (
          <div className="px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            <span className="flex items-center gap-3">
              <span style={{ fontSize: 18 }}>❓</span>
              <span className="text-sm font-semibold">{isRTL ? 'المساعدة' : 'Help'}</span>
            </span>
          </div>
        )}
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050505' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? 64 : 260,
          background: 'rgba(9,9,9,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.7)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSidebar(false)} />
            <motion.aside className="fixed top-0 z-50 h-full w-72 md:hidden flex flex-col"
              style={{ [isRTL ? 'right' : 'left']: 0, background: 'rgba(9,9,9,0.99)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ x: isRTL ? 288 : -288 }} animate={{ x: 0 }} exit={{ x: isRTL ? 288 : -288 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Topbar ── */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6"
          style={{ height: 64, background: 'rgba(9,9,9,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg" onClick={() => setMobileSidebar(true)}
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect y="3" width="20" height="2" rx="1"/><rect y="9" width="20" height="2" rx="1"/><rect y="15" width="20" height="2" rx="1"/>
              </svg>
            </button>
            {/* Desktop collapse toggle */}
            <button className="hidden md:flex p-2 rounded-lg transition-colors"
              onClick={() => setCollapsed(c => !c)}
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C6FF00')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect y="2" width="18" height="2" rx="1"/><rect y="8" width="12" height="2" rx="1"/><rect y="14" width="18" height="2" rx="1"/>
              </svg>
            </button>
            <h1 className="text-base font-bold" style={{ color: '#F5F5F5' }}>{pageTitle}</h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Trial pill */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,160,0,0.1)', border: '1px solid rgba(255,160,0,0.3)', color: '#FFA500' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFA500' }} />
              {isRTL ? 'متبقي 8 أيام' : '8 days left'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="relative p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false) }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div className="absolute z-50 w-80 rounded-2xl overflow-hidden"
                    style={{ [isRTL ? 'left' : 'right']: 0, top: '100%', marginTop: 8, background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-sm font-bold" style={{ color: '#F5F5F5' }}>{isRTL ? 'الإشعارات' : 'Notifications'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30' }}>3</span>
                    </div>
                    {NOTIFICATIONS.map((n, i) => (
                      <Link key={i} href={n.href} onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition-colors"
                        style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span style={{ fontSize: 16 }}>{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            {isRTL ? n.ar : n.en}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {isRTL ? `منذ ${n.time}` : `${n.time} ago`}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative">
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false) }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: 'linear-gradient(135deg, #C6FF00, #a8e000)', color: '#050505' }}>
                  {user?.name?.[0]?.toUpperCase() || 'N'}
                </div>
                <span className="hidden sm:block text-sm font-semibold" style={{ color: '#F5F5F5' }}>
                  {user?.name?.split(' ')[0] || 'Naz'}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="hidden sm:block opacity-40">
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div className="absolute z-50 w-48 rounded-2xl overflow-hidden"
                    style={{ [isRTL ? 'left' : 'right']: 0, top: '100%', marginTop: 8, background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}>
                    {[
                      { icon: '👤', ar: 'الملف الشخصي', en: 'Profile', href: '/dashboard/settings' },
                      { icon: '⚙️', ar: 'الإعدادات', en: 'Settings', href: '/dashboard/settings' },
                    ].map((item, i) => (
                      <Link key={i} href={item.href} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span>{item.icon}</span>
                        <span>{isRTL ? item.ar : item.en}</span>
                      </Link>
                    ))}
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                      style={{ color: '#FF6B6B' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,59,48,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span>🚪</span>
                      <span>{isRTL ? 'تسجيل الخروج' : 'Logout'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto" style={{ background: '#080808' }}>
          {/* subtle grid */}
          <div className="fixed inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(198,255,0,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(198,255,0,0.015) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            zIndex: 0,
          }} />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* Click-outside close */}
      {(notifOpen || userMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setUserMenuOpen(false) }} />
      )}
    </div>
  )
}
