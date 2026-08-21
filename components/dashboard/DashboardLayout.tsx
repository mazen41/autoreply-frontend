'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationCenter from '../NotificationCenter'
import DarkModeToggle from '../DarkModeToggle'
import {
  HomeIcon, InboxIcon, ChannelsIcon, WhatsAppIcon, ContentIcon, ReputationIcon,
  ReportsIcon, AIKnowledgeIcon, SettingsIcon, BillingIcon, HelpIcon,
  SearchIcon, MenuIcon, XIcon, UserIcon, LogOutIcon, NazLogoIcon,
  SendIcon, LayersIcon, LinkIcon, BarChartIcon, LightningIcon, StarIcon,
  NotificationIcon, TrendUpIcon, TrendDownIcon, ShieldIcon, MailIcon,
  WorkflowIcon, TagIcon, FileTextIcon, PlugIcon, CalendarIcon,
  CommentIcon
} from '../ui/DashboardIcons'

// ─── NAV GROUPS ──────────────────────────────────────────────────────────────
// Each group has a label (shown as a section divider) and a list of nav items.
// Every item has a unique icon and a label in both AR and EN.

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
      { icon: MailIcon,        href: '/dashboard/email-campaigns',   labelEn: 'Email Campaigns', labelAr: 'حملات البريد' },
      { icon: LayersIcon,      href: '/dashboard/sequences',         labelEn: 'Sequences',       labelAr: 'التسلسلات' },
      { icon: StarIcon,        href: '/dashboard/social-posts',      labelEn: 'Social Posts',    labelAr: 'المنشورات' },
      { icon: FileTextIcon,    href: '/dashboard/content',           labelEn: 'Content',         labelAr: 'المحتوى' },
      { icon: CommentIcon,     href: '/dashboard/comment-automation',labelEn: 'Comment Automation',labelAr: 'أتمتة التعليقات' },
    ]
  },
  {
    groupKey: 'commerce',
    labelEn: 'Commerce',
    labelAr: 'التجارة',
    items: [
      { icon: LinkIcon,        href: '/dashboard/products',            labelEn: 'Products',          labelAr: 'المنتجات' },
      { icon: CalendarIcon,    href: '/dashboard/bookings',            labelEn: 'Bookings',          labelAr: 'الحجوزات' },
      { icon: NotificationIcon, href: '/dashboard/order-notifications', labelEn: 'Order Alerts',      labelAr: 'إشعارات الطلبات' },
      { icon: TrendDownIcon,   href: '/dashboard/cart-recovery',       labelEn: 'Cart Recovery',     labelAr: 'استرداد السلة' },
    ]
  },
  {
    groupKey: 'operations',
    labelEn: 'Operations',
    labelAr: 'العمليات',
    items: [
      { icon: UserIcon,        href: '/dashboard/team',            labelEn: 'Team',             labelAr: 'الفريق' },
      { icon: ShieldIcon,      href: '/dashboard/routing',         labelEn: 'Routing',          labelAr: 'التوجيه' },
      { icon: WorkflowIcon,    href: '/dashboard/workflows',       labelEn: 'Workflows',        labelAr: 'سير العمل' },
      { icon: StarIcon,        href: '/dashboard/reputation',      labelEn: 'Reputation',       labelAr: 'السمعة' },
      { icon: ReportsIcon,     href: '/dashboard/reports',         labelEn: 'Reports',          labelAr: 'التقارير' },
      { icon: TagIcon,         href: '/dashboard/classification',  labelEn: 'Classification',   labelAr: 'التصنيف' },
      { icon: LayersIcon,      href: '/dashboard/multimodal',      labelEn: 'Multimodal',       labelAr: 'متعدد الوسائط' },
    ]
  },
  {
    groupKey: 'developer',
    labelEn: 'Developer',
    labelAr: 'المطورين',
    items: [
      { icon: PlugIcon,        href: '/dashboard/integrations', labelEn: 'Integrations', labelAr: 'التكاملات' },
      { icon: SearchIcon,      href: '/dashboard/api-keys',     labelEn: 'API Keys',     labelAr: 'مفاتيح API' },
    ]
  },
]

const NAV_BOTTOM = [
  { icon: SettingsIcon, href: '/dashboard/settings', labelEn: 'Settings', labelAr: 'الإعدادات' },
  { icon: BillingIcon,  href: '/dashboard/billing',  labelEn: 'Billing',  labelAr: 'الفوترة' },
]

// ─── ALL ITEMS FLAT (for page title lookup) ──────────────────────────────────
const ALL_ITEMS = [
  ...NAV_GROUPS.flatMap(g => g.items),
  ...NAV_BOTTOM,
]

function useUser() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; onboarding_completed: boolean; email_verified?: boolean } | null>(null)
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const current = ALL_ITEMS.find(n => n.href === pathname)
  const pageTitle = current ? (isRTL ? current.labelAr : current.labelEn) : (isRTL ? 'الرئيسية' : 'Dashboard')

  const logout = () => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
    if (token) fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    document.cookie = 'naz_token=; max-age=0; path=/'
    router.push('/login')
  }

  const sidebarVariants = {
    expanded: { width: 264, x: 0 },
    collapsed: { width: 72, x: 0 },
    hidden:    { x: isRTL ? '100%' : '-100%', width: 264 }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: 'var(--accent)' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black tracking-widest text-accent">NAZ</div>
        </div>
      </div>
    )
  }

  // ─── NavItem ────────────────────────────────────────────────────────────────
  const NavItem = ({ item }: { item: typeof ALL_ITEMS[0] }) => {
    const active = pathname === item.href
    const Icon = item.icon
    const label = isRTL ? item.labelAr : item.labelEn
    const isCollapsedDesktop = collapsed && !isMobile

    return (
      <Link href={item.href} onClick={() => setMobileSidebar(false)} className="relative block group">
        <motion.div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer relative ${
            active
              ? 'font-bold'
              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.03]'
          }`}
          style={{
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: active ? 'var(--accent-subtle)' : 'transparent',
            border: active ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent',
            justifyContent: isCollapsedDesktop ? 'center' : undefined,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Active left bar */}
          {active && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute top-2 bottom-2 w-1 rounded-full"
              style={{
                left: isRTL ? 'auto' : 0,
                right: isRTL ? 0 : 'auto',
                background: 'linear-gradient(to bottom, #0E7AFE, #8B3FFB)'
              }}
            />
          )}

          <div className={`flex-shrink-0 transition-colors duration-200`} style={{ color: active ? 'var(--accent)' : 'inherit' }}>
            <Icon size={18} />
          </div>

          {!isCollapsedDesktop && (
            <span className="text-xs font-semibold leading-none tracking-wide truncate">{label}</span>
          )}
        </motion.div>

        {/* Collapsed tooltip */}
        {isCollapsedDesktop && (
          <div
            className={`absolute ${isRTL ? 'right-full mr-2.5' : 'left-full ml-2.5'} top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 shadow-xl whitespace-nowrap`}
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            {label}
          </div>
        )}
      </Link>
    )
  }

  // ─── Group Section Divider ───────────────────────────────────────────────────
  const NavGroup = ({ group }: { group: typeof NAV_GROUPS[0] }) => {
    const isCollapsedDesktop = collapsed && !isMobile
    return (
      <div className="mb-1">
        {!isCollapsedDesktop && (
          <div className="px-3 mb-1 mt-3">
            <span className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}>
              {isRTL ? group.labelAr : group.labelEn}
            </span>
          </div>
        )}
        {isCollapsedDesktop && <div className="h-px mx-3 mt-3 mb-1" style={{ background: 'var(--border)' }} />}
        <div className="space-y-0.5">
          {group.items.map(item => <NavItem key={item.href} item={item} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'var(--font-inter, sans-serif)' }}>
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ background: 'color-mix(in srgb, var(--accent-end) 8%, transparent)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--text-primary) 3%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--text-primary) 3%, transparent) 1px, transparent 1px)', backgroundSize: '4rem 4rem' }} />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileSidebar(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={isMobile ? (mobileSidebar ? 'expanded' : 'hidden') : (collapsed ? 'collapsed' : 'expanded')}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full z-50`}
        style={{
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
          backdropFilter: 'blur(24px)',
          borderRight: isRTL ? 'none' : '1px solid var(--border)',
          borderLeft:  isRTL ? '1px solid var(--border)' : 'none'
        }}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-[70px] flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            {(!collapsed || isMobile) ? (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-[#8B3FFB] flex items-center justify-center flex-shrink-0">
                  <NazLogoIcon size={16} className="text-white" style={{ color: 'white' }} />
                </div>
                <span className="text-base font-black tracking-tight bg-gradient-to-r from-accent to-[#8B3FFB] bg-clip-text text-transparent">NazBiz</span>
              </div>
            ) : (
              <div className="mx-auto w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-[#8B3FFB] flex items-center justify-center">
                <NazLogoIcon size={14} style={{ color: 'white' }} />
              </div>
            )}
          </div>

          {/* Scrollable Nav */}
          <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-none space-y-0">
            {NAV_GROUPS.map(group => <NavGroup key={group.groupKey} group={group} />)}
          </nav>

          {/* Bottom: Settings, Billing, Help */}
          <div className="px-2 pb-2 pt-2 space-y-0.5 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            {NAV_BOTTOM.map(item => <NavItem key={item.href} item={item} />)}

            {(!collapsed || isMobile) && (
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.03]" style={{ color: 'var(--text-secondary)' }}>
                <HelpIcon size={18} />
                <span className="text-xs font-semibold">{isRTL ? 'مساعدة' : 'Help'}</span>
              </button>
            )}
          </div>

          {/* User profile card */}
          {(!collapsed || isMobile) && user && (
            <div className="px-2 pb-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 p-2.5 rounded-xl mt-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-end))', color: 'white' }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ── Main Content ── */}
      <motion.div
        initial={false}
        animate={{
          paddingLeft:  isMobile ? 0 : (isRTL ? 0 : (collapsed ? 72 : 264)),
          paddingRight: isMobile ? 0 : (isRTL ? (collapsed ? 72 : 264) : 0),
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="w-full min-h-screen flex flex-col relative z-10"
      >
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 border-b border-white/[0.04]"
          style={{ height: 70, background: 'color-mix(in srgb, var(--background) 75%, transparent)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between h-full px-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebar(!mobileSidebar)}
                className="lg:hidden p-2 rounded-xl transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {mobileSidebar ? <XIcon size={18} /> : <MenuIcon size={18} />}
              </button>

              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-2 rounded-xl transition-all items-center justify-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <MenuIcon size={17} />
              </button>

              <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{pageTitle}</h1>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <SearchIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder={isRTL ? 'بحث...' : 'Search conversations, agents...'}
                  className="w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Right toolbar */}
            <div className="flex items-center gap-2.5">
              {/* AI Active badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/10 border border-accent/15">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                </span>
                <span className="text-[9px] font-black tracking-widest text-accent uppercase">{isRTL ? 'AI نشط' : 'AI ACTIVE'}</span>
              </div>

              <DarkModeToggle />
              <NotificationCenter />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-end))', color: 'white' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl overflow-hidden z-50"
                      style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="p-3.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" style={{ color: 'var(--text-secondary)' }}>
                          <SettingsIcon size={13} />
                          {isRTL ? 'الإعدادات' : 'Account Settings'}
                        </Link>
                        <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-all">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                          </svg>
                          {isRTL ? 'تسجيل الخروج' : 'Logout'}
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
        <main className="flex-1 p-5 relative z-10">
          {children}
        </main>
      </motion.div>
    </div>
  )
}
