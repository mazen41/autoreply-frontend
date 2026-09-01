'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import NotificationCenter from '../NotificationCenter'
import DarkModeToggle from '../DarkModeToggle'
import {
  HomeIcon, InboxIcon, ChannelsIcon, WhatsAppIcon, 
  ReportsIcon, AIKnowledgeIcon, SettingsIcon, BillingIcon, HelpIcon,
  SearchIcon, MenuIcon, XIcon, UserIcon, LogOutIcon, NazLogoIcon,
  SendIcon, LayersIcon, BarChartIcon, LightningIcon, StarIcon,
  NotificationIcon, TrendUpIcon, WorkflowIcon, TagIcon, 
  FileTextIcon, CalendarIcon
} from '../ui/DashboardIcons'

// ─── NAV GROUPS ──────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    groupKey: 'core',
    labelEn: 'Core',
    labelAr: 'الأساسية',
    items: [
      { icon: HomeIcon,        href: '/dashboard',             labelEn: 'Dashboard',      labelAr: 'الرئيسية' },
      { icon: InboxIcon,       href: '/dashboard/inbox',       labelEn: 'Inbox',          labelAr: 'الرسائل' },
      { icon: ChannelsIcon,    href: '/dashboard/channels',    labelEn: 'Channels',       labelAr: 'القنوات' },
      { icon: WhatsAppIcon,    href: '/dashboard/whatsapp',    labelEn: 'WhatsApp',       labelAr: 'واتساب' },
    ]
  },
  {
    groupKey: 'ai',
    labelEn: 'AI & Knowledge',
    labelAr: 'الذكاء الاصطناعي',
    items: [
      { icon: AIKnowledgeIcon, href: '/dashboard/ai-knowledge', labelEn: 'AI Knowledge',  labelAr: 'قاعدة المعرفة' },
      { icon: LightningIcon,   href: '/dashboard/training',     labelEn: 'Training',      labelAr: 'التدريب' },
      { icon: BarChartIcon,    href: '/dashboard/analytics',    labelEn: 'Analytics',     labelAr: 'التحليلات' },
    ]
  },
  {
    groupKey: 'marketing',
    labelEn: 'Marketing',
    labelAr: 'التسويق',
    items: [
      { icon: SendIcon,        href: '/dashboard/campaigns',         labelEn: 'Campaigns',       labelAr: 'الحملات' },
      { icon: FileTextIcon,    href: '/dashboard/sequences',         labelEn: 'Sequences',       labelAr: 'التسلسلات' },
    ]
  },
  {
    groupKey: 'operations',
    labelEn: 'Operations',
    labelAr: 'العمليات',
    items: [
      { icon: UserIcon,        href: '/dashboard/team',            labelEn: 'Team',           labelAr: 'الفريق' },
      { icon: WorkflowIcon,    href: '/dashboard/workflows',       labelEn: 'Workflows',      labelAr: 'سير العمل' },
      { icon: ReportsIcon,     href: '/dashboard/reports',         labelEn: 'Reports',        labelAr: 'التقارير' },
      { icon: TagIcon,         href: '/dashboard/classification',  labelEn: 'Classification', labelAr: 'التصنيف' },
      { icon: LayersIcon,      href: '/dashboard/multimodal',      labelEn: 'Multimodal',     labelAr: 'متعدد الوسائط' },
    ]
  },
  {
    groupKey: 'developer',
    labelEn: 'Developer',
    labelAr: 'المطورين',
    items: [
      { icon: SearchIcon,      href: '/dashboard/api-keys',     labelEn: 'API Keys',     labelAr: 'مفاتيح API' },
    ]
  },
]

const NAV_BOTTOM = [
  { icon: SettingsIcon, href: '/dashboard/settings', labelEn: 'Settings', labelAr: 'الإعدادات' },
  { icon: BillingIcon,  href: '/dashboard/billing',  labelEn: 'Billing',  labelAr: 'الفوترة' },
]

const ALL_ITEMS = [...NAV_GROUPS.flatMap(g => g.items), ...NAV_BOTTOM]

// ─── Auth hook ─────────────────────────────────────────────────────────────────
function useUser() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; onboarding_completed: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (!token) { router.replace('/login'); setLoading(false); return }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).then(async r => {
      const data = await r.json().catch(() => null)
      if (!r.ok || data?.requires_verification || data?.email_verified === false) {
        document.cookie = 'naz_token=; max-age=0; path=/'
        router.replace(data?.requires_verification ? `/verify-email?email=${encodeURIComponent(data?.email || '')}` : '/login')
        return
      }
      setUser(data)
    }).catch(() => {
      document.cookie = 'naz_token=; max-age=0; path=/'
      router.replace('/login')
    }).finally(() => setLoading(false))
  }, [router])

  return { user, loading }
}

// ─── NavItem – no framer-motion, pure CSS transitions ──────────────────────
const NavItem = React.memo(function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: typeof ALL_ITEMS[0]
  active: boolean
  collapsed: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  const { isRTL } = useLang()
  const label = isRTL ? item.labelAr : item.labelEn

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="dl-nav-item group relative block"
      data-active={active ? 'true' : undefined}
      data-collapsed={collapsed ? 'true' : undefined}
      title={collapsed ? label : undefined}
    >
      <span className="dl-nav-inner">
        {/* Active bar */}
        {active && (
          <span className="dl-active-bar" aria-hidden="true" />
        )}

        {/* Icon */}
        <span className="dl-nav-icon">
          <Icon size={18} />
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="dl-nav-label">{label}</span>
        )}
      </span>

      {/* Collapsed tooltip */}
      {collapsed && (
        <span className="dl-tooltip" aria-hidden="true">{label}</span>
      )}
    </Link>
  )
})

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isRTL, lang, toggleLang } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useUser()

  const [collapsed, setCollapsed]         = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [userMenuOpen, setUserMenuOpen]   = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileSidebar ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileSidebar])

  const current   = ALL_ITEMS.find(n => n.href === pathname)
  const pageTitle = current ? (isRTL ? current.labelAr : current.labelEn) : (isRTL ? 'الرئيسية' : 'Dashboard')

  const logout = useCallback(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }
    document.cookie = 'naz_token=; max-age=0; path=/'
    router.push('/login')
  }, [router])

  const isCollapsed = collapsed && !isMobile
  const sidebarW    = isCollapsed ? 72 : 264

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          {/* Brand icon */}
          <img src="/icons/logo_icon.png" alt="Naz" className="w-14 h-14 object-contain" />
          {/* Simple CSS spinner — no framer-motion */}
          <div className="dl-spinner" />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── CSS-only styles scoped to dashboard layout ── */}
      <style>{`
        /* Layout shell */
        .dl-shell {
          min-height: 100vh;
          background: var(--background);
          color: var(--text-primary);
        }

        /* Sidebar */
        .dl-sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          width: ${sidebarW}px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          transition: width 200ms cubic-bezier(0.4,0,0.2,1), transform 200ms cubic-bezier(0.4,0,0.2,1);
          will-change: width;
          contain: layout style;
        }
        html[dir="rtl"] .dl-sidebar {
          border-right: none;
          border-left: 1px solid var(--border);
          left: auto;
          right: 0;
        }
        html[dir="ltr"] .dl-sidebar { left: 0; }

        /* Mobile sidebar hidden/shown */
        @media (max-width: 1023px) {
          .dl-sidebar {
            width: 264px !important;
            transform: ${mobileSidebar
              ? 'translateX(0)'
              : isRTL ? 'translateX(100%)' : 'translateX(-100%)'};
          }
        }

        /* Sidebar overlay */
        .dl-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(0,0,0,0.55);
          opacity: ${mobileSidebar ? 1 : 0};
          transition: opacity 200ms ease;
        }
        @media (max-width: 1023px) {
          .dl-overlay { display: block; pointer-events: ${mobileSidebar ? 'auto' : 'none'}; }
        }

        /* Main content area offset */
        .dl-main {
          transition: padding-left 200ms cubic-bezier(0.4,0,0.2,1),
                      padding-right 200ms cubic-bezier(0.4,0,0.2,1);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          html[dir="ltr"] .dl-main { padding-left: ${sidebarW}px; }
          html[dir="rtl"] .dl-main { padding-right: ${sidebarW}px; }
        }

        /* Topbar */
        .dl-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          contain: layout style;
        }

        /* Logo area */
        .dl-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 60px;
          padding: 0 16px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          overflow: hidden;
        }
        .dl-logo-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: transparent;
          border: none;
        }
        .dl-logo-text {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--accent), var(--accent-end, #8B3FFB));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          opacity: ${isCollapsed ? 0 : 1};
          width: ${isCollapsed ? 0 : 'auto'};
          overflow: hidden;
          transition: opacity 150ms ease, width 200ms ease;
        }

        /* Nav */
        .dl-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px; scrollbar-width: none; }
        .dl-nav::-webkit-scrollbar { display: none; }

        /* Group label */
        .dl-group-label {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          padding: 12px 8px 4px;
          opacity: ${isCollapsed ? 0 : 0.65};
          transition: opacity 150ms ease;
        }
        .dl-group-divider {
          height: 1px;
          background: var(--border);
          margin: 10px 8px 4px;
          display: ${isCollapsed ? 'block' : 'none'};
        }

        /* Nav item */
        .dl-nav-item { display: block; text-decoration: none; position: relative; }
        .dl-nav-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
          color: var(--text-secondary);
          position: relative;
          justify-content: ${isCollapsed ? 'center' : 'flex-start'};
        }
        .dl-nav-item[data-active] .dl-nav-inner {
          background: var(--accent-subtle);
          border-color: color-mix(in srgb, var(--accent) 18%, transparent);
          color: var(--accent);
          font-weight: 700;
        }
        .dl-nav-item:hover:not([data-active]) .dl-nav-inner {
          background: color-mix(in srgb, var(--text-primary) 4%, transparent);
          color: var(--text-primary);
        }
        .dl-nav-icon { display: flex; align-items: center; flex-shrink: 0; }
        .dl-nav-label { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; }

        /* Active bar */
        .dl-active-bar {
          position: absolute;
          top: 6px;
          bottom: 6px;
          width: 3px;
          border-radius: 2px;
          background: var(--accent);
          left: ${isRTL ? 'auto' : 0};
          right: ${isRTL ? 0 : 'auto'};
        }

        /* Tooltip for collapsed */
        .dl-tooltip {
          position: absolute;
          ${isRTL ? 'right: 100%; margin-right: 10px;' : 'left: 100%; margin-left: 10px;'}
          top: 50%;
          transform: translateY(-50%);
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: opacity 120ms ease;
          z-index: 60;
        }
        .dl-nav-item:hover .dl-tooltip { opacity: 1; }

        /* Bottom nav section */
        .dl-nav-bottom {
          padding: 8px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        /* User card */
        .dl-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--text-primary) 4%, transparent);
          border: 1px solid var(--border);
          margin: 8px 8px 0;
          overflow: hidden;
          transition: background 150ms ease;
        }
        .dl-user-card:hover { background: color-mix(in srgb, var(--text-primary) 6%, transparent); }
        .dl-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), var(--accent-end, #8B3FFB));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .dl-user-info {
          min-width: 0;
          opacity: ${isCollapsed ? 0 : 1};
          max-width: ${isCollapsed ? 0 : '160px'};
          overflow: hidden;
          transition: opacity 150ms ease, max-width 200ms ease;
        }
        .dl-user-name { font-size: 12px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-user-email { font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* User dropdown */
        .dl-user-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 210px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          overflow: hidden;
          z-index: 60;
          animation: dl-menu-in 150ms cubic-bezier(0.4,0,0.2,1) both;
        }
        html[dir="rtl"] .dl-user-menu { right: auto; left: 0; }
        @keyframes dl-menu-in {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dl-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 120ms ease, color 120ms ease;
          width: 100%;
          background: none;
          border: none;
          text-align: ${isRTL ? 'right' : 'left'};
          text-decoration: none;
        }
        .dl-menu-item:hover { background: color-mix(in srgb, var(--text-primary) 5%, transparent); color: var(--text-primary); }
        .dl-menu-item.danger { color: var(--error); }
        .dl-menu-item.danger:hover { background: var(--error-subtle); }

        /* Spinner */
        .dl-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: dl-spin 0.7s linear infinite;
        }
        @keyframes dl-spin { to { transform: rotate(360deg); } }

        /* AI badge ping */
        @keyframes dl-ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        .dl-ping { animation: dl-ping 1.8s ease-out infinite; }

        /* Search bar */
        .dl-search {
          width: 100%;
          height: 36px;
          background: color-mix(in srgb, var(--text-primary) 4%, transparent);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 14px 0 36px;
          font-size: 12px;
          color: var(--text-primary);
          transition: border-color 150ms ease, background 150ms ease;
          outline: none;
        }
        .dl-search::placeholder { color: var(--text-tertiary); }
        .dl-search:focus { border-color: var(--accent); background: var(--surface); }
        html[dir="rtl"] .dl-search { padding: 0 36px 0 14px; }

        /* Page content */
        .dl-content { flex: 1; padding: 20px; position: relative; }
      `}</style>

      <div className="dl-shell">

        {/* ── Mobile overlay ── */}
        <div className="dl-overlay" onClick={() => setMobileSidebar(false)} />

        {/* ── Sidebar ── */}
        <aside className="dl-sidebar">

          {/* Logo */}
          <div className="dl-logo">
            <div className="dl-logo-icon">
              <img src="/icons/logo_icon.png" alt="Naz" className="w-9 h-9 object-contain" />
            </div>
            <span className="dl-logo-text">NazBiz</span>
          </div>

          {/* Nav */}
          <nav className="dl-nav" aria-label="Main navigation">
            {NAV_GROUPS.map(group => (
              <div key={group.groupKey} className="mb-1">
                {!isCollapsed
                  ? <div className="dl-group-label">{isRTL ? group.labelAr : group.labelEn}</div>
                  : <div className="dl-group-divider" />
                }
                <div>
                  {group.items.map(item => (
                    <NavItem
                      key={item.href}
                      item={item}
                      active={pathname === item.href}
                      collapsed={isCollapsed}
                      onClick={() => setMobileSidebar(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom nav */}
          <div className="dl-nav-bottom">
            {NAV_BOTTOM.map(item => (
              <NavItem
                key={item.href}
                item={item}
                active={pathname === item.href}
                collapsed={isCollapsed}
                onClick={() => setMobileSidebar(false)}
              />
            ))}
            {!isCollapsed && (
              <button
                className="dl-nav-item"
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="dl-nav-inner">
                  <span className="dl-nav-icon"><HelpIcon size={18} /></span>
                  <span className="dl-nav-label">{isRTL ? 'مساعدة' : 'Help'}</span>
                </span>
              </button>
            )}
          </div>

          {/* User card */}
          {user && (
            <div className="dl-user-card">
              <div className="dl-user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
              <div className="dl-user-info">
                <div className="dl-user-name">{user.name}</div>
                <div className="dl-user-email">{user.email}</div>
              </div>
            </div>
          )}
          <div style={{ height: 8 }} />
        </aside>

        {/* ── Main content ── */}
        <div className="dl-main">

          {/* Topbar */}
          <header className="dl-topbar">

            {/* Left: hamburger + collapse + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileSidebar(v => !v)}
                className="lg:hidden"
                aria-label="Toggle sidebar"
                style={{ padding: 8, borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {mobileSidebar ? <XIcon size={16} /> : <MenuIcon size={16} />}
              </button>

              {/* Desktop collapse */}
              <button
                onClick={() => setCollapsed(v => !v)}
                aria-label="Toggle sidebar width"
                style={{ padding: 8, borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'none', alignItems: 'center' }}
                className="hidden lg:flex"
              >
                <MenuIcon size={16} />
              </button>

              <h1 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {pageTitle}
              </h1>
            </div>

            {/* Center: search */}
            <div style={{ flex: 1, maxWidth: 340, margin: '0 20px', position: 'relative', display: 'none' }} className="md:block">
              <SearchIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                className="dl-search"
                type="search"
                placeholder={isRTL ? 'بحث...' : 'Search...'}
                aria-label="Search"
              />
            </div>

            {/* Right: AI badge, dark mode, notifications, user */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* AI active badge */}
              <div
                className="hidden sm:flex"
                style={{ alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)' }}
              >
                <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6 }}>
                  <span className="dl-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
                  <span style={{ position: 'relative', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                </span>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                  {isRTL ? 'AI نشط' : 'AI ACTIVE'}
                </span>
              </div>

              <DarkModeToggle />

              {/* Language switcher */}
              <button
                onClick={toggleLang}
                aria-label="Switch language"
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {isRTL ? 'EN' : 'ع'}
              </button>

              <NotificationCenter />

              {/* User avatar + dropdown */}
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-end, #8B3FFB))', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </button>

                {userMenuOpen && (
                  <div className="dl-user-menu" role="menu">
                    {/* User info header */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    </div>
                    <div style={{ padding: '4px' }}>
                      <Link href="/dashboard/settings" className="dl-menu-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        <SettingsIcon size={13} />
                        {isRTL ? 'الإعدادات' : 'Account Settings'}
                      </Link>
                      <button className="dl-menu-item danger" role="menuitem" onClick={logout}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                        </svg>
                        {isRTL ? 'تسجيل الخروج' : 'Log out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="dl-content">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
