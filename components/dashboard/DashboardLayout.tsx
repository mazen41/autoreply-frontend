'use client'

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springs } from '../../lib/motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import NotificationCenter from '../NotificationCenter'
import DarkModeToggle from '../DarkModeToggle'
import CommandPalette from '../ui/CommandPalette'
import Avatar from '../ui/Avatar'
import Tooltip from '../ui/Tooltip'
import {
  LayoutDashboard,
  Inbox,
  Radio,
  MessageCircle,
  Bot,
  Brain,
  GraduationCap,
  BarChart3,
  Send,
  GitBranch,
  Users,
  Workflow,
  FileSpreadsheet,
  Layers,
  KeyRound,
  Settings,
  CreditCard,
  ShieldCheck,
  ListTodo,
  MessageSquarePlus,
  BookOpen,
  Rocket,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Sparkles,
  Command,
  LogOut,
  ExternalLink,
  Check,
  PauseCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

// ─── NAV GROUPS ──────────────────────────────────────────────────────────────
interface NavItemDef {
  icon: React.ComponentType<{ className?: string; size?: number }>
  href: string
  labelEn: string
  labelAr: string
}

interface NavGroupDef {
  groupKey: string
  labelEn: string
  labelAr: string
  items: NavItemDef[]
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    groupKey: 'core',
    labelEn: 'Core',
    labelAr: 'الأساسية',
    items: [
      { icon: LayoutDashboard, href: '/dashboard', labelEn: 'Dashboard', labelAr: 'الرئيسية' },
      { icon: Inbox, href: '/inbox', labelEn: 'Inbox', labelAr: 'الرسائل' },
      { icon: Users, href: '/dashboard/contacts', labelEn: 'Contacts', labelAr: 'جهات الاتصال' },
      { icon: MessageCircle, href: '/dashboard/comments', labelEn: 'Comments', labelAr: 'التعليقات' },
      { icon: Radio, href: '/dashboard/channels', labelEn: 'Channels', labelAr: 'القنوات' },
      { icon: MessageCircle, href: '/dashboard/whatsapp', labelEn: 'WhatsApp', labelAr: 'واتساب' },
    ],
  },
  {
    groupKey: 'ai',
    labelEn: 'AI & Knowledge',
    labelAr: 'الذكاء والمعرفة',
    items: [
      { icon: Bot, href: '/dashboard/bots', labelEn: 'Bots', labelAr: 'البوتات' },
      { icon: Brain, href: '/dashboard/ai-knowledge', labelEn: 'AI Knowledge', labelAr: 'قاعدة المعرفة' },
      { icon: GraduationCap, href: '/dashboard/training', labelEn: 'Training', labelAr: 'التدريب' },
      { icon: BarChart3, href: '/dashboard/analytics', labelEn: 'Analytics', labelAr: 'التحليلات' },
    ],
  },
  {
    groupKey: 'marketing',
    labelEn: 'Marketing',
    labelAr: 'التسويق',
    items: [
      { icon: Send, href: '/dashboard/campaigns', labelEn: 'Campaigns', labelAr: 'الحملات' },
      { icon: GitBranch, href: '/dashboard/sequences', labelEn: 'Sequences', labelAr: 'التسلسلات' },
      { icon: PauseCircle, href: '/dashboard/automation-controls', labelEn: 'Run controls', labelAr: 'التحكم في التشغيل' },
      { icon: Rocket, href: '/dashboard/growth', labelEn: 'Growth tools', labelAr: 'أدوات النمو' },
    ],
  },
  {
    groupKey: 'operations',
    labelEn: 'Operations',
    labelAr: 'العمليات',
    items: [
      { icon: Users, href: '/dashboard/team', labelEn: 'Team', labelAr: 'الفريق' },
      { icon: ListTodo, href: '/dashboard/handoffs', labelEn: 'Handoffs', labelAr: 'التصعيدات' },
      { icon: MessageSquarePlus, href: '/dashboard/cases', labelEn: 'Cases', labelAr: 'الحالات' },
      { icon: BookOpen, href: '/dashboard/help-center', labelEn: 'Help Center', labelAr: 'مركز المساعدة' },
      { icon: Workflow, href: '/dashboard/workflows', labelEn: 'Workflows', labelAr: 'سير العمل' },
      { icon: FileSpreadsheet, href: '/dashboard/reports', labelEn: 'Reports', labelAr: 'التقارير' },
      { icon: Layers, href: '/dashboard/multimodal', labelEn: 'Multimodal', labelAr: 'متعدد الوسائط' },
    ],
  },
  {
    groupKey: 'developer',
    labelEn: 'Developer',
    labelAr: 'المطورين',
    items: [
      { icon: KeyRound, href: '/dashboard/api-keys', labelEn: 'API Keys', labelAr: 'مفاتيح API' },
    ],
  },
]

const NAV_BOTTOM: NavItemDef[] = [
  { icon: ShieldCheck, href: '/dashboard/privacy-data', labelEn: 'Privacy & Data', labelAr: 'الخصوصية والبيانات' },
  { icon: Settings, href: '/dashboard/settings', labelEn: 'Settings', labelAr: 'الإعدادات' },
  { icon: CreditCard, href: '/dashboard/billing', labelEn: 'Billing', labelAr: 'الفوترة' },
]

const ALL_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), ...NAV_BOTTOM]

type BusinessOption = { id: number; name: string; role: string; is_primary: boolean }

// ─── AUTH AND ACTIVE BUSINESS ───────────────────────────────────────────────
function useUser() {
  const [user, setUser] = useState<{ id?: number; name: string; email: string; onboarding_completed: boolean; business_id?: number | null } | null>(null)
  const [businesses, setBusinesses] = useState<BusinessOption[]>([])
  const [selectedBusinessId, setSelectedBusinessIdState] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [authIssue, setAuthIssue] = useState<'unauthenticated' | 'verification_required' | 'unavailable' | null>(null)

  const selectBusiness = useCallback((businessId: number) => {
    setSelectedBusinessIdState(businessId)
    window.localStorage.setItem('naz_selected_business_id', String(businessId))
    window.dispatchEvent(new CustomEvent('naz:business-changed', { detail: { businessId } }))
  }, [])

  const loadUser = useCallback(async () => {
    setLoading(true)
    setAuthIssue(null)
    const token = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('naz_token='))
      ?.split('=')[1]

    if (!token) {
      setUser(null)
      setAuthIssue('unauthenticated')
      setLoading(false)
      return
    }

    try {
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/user`, { headers })
      const data = await r.json().catch(() => null)
      if (r.status === 401 || r.status === 403) {
        setUser(null)
        setAuthIssue(data?.requires_verification || data?.email_verified === false ? 'verification_required' : 'unauthenticated')
        return
      }
      if (!r.ok || !data || typeof data.email !== 'string') throw new Error('Unable to load the authenticated user')
      if (data.requires_verification || data.email_verified === false) {
        setUser(null)
        setAuthIssue('verification_required')
        return
      }
      setUser(data)

      const businessResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/businesses`, { headers })
      if (businessResponse.status === 401 || businessResponse.status === 403) {
        setUser(null)
        setAuthIssue('unauthenticated')
        return
      }
      if (!businessResponse.ok) throw new Error('Unable to load workspaces')

      const result = await businessResponse.json()
      const options: BusinessOption[] = Array.isArray(result.businesses) ? result.businesses : []
      setBusinesses(options)
      const stored = Number(window.localStorage.getItem('naz_selected_business_id'))
      const active = options.find((business) => business.id === stored)
        || options.find((business) => business.is_primary)
        || options[0]
      if (active) selectBusiness(active.id)
      else window.localStorage.removeItem('naz_selected_business_id')
    } catch {
      setUser(null)
      setAuthIssue('unavailable')
    } finally {
      setLoading(false)
    }
  }, [selectBusiness])

  useEffect(() => {
    const task = window.setTimeout(() => { void loadUser() }, 0)
    return () => window.clearTimeout(task)
  }, [loadUser])

  return { user, businesses, selectedBusinessId, selectBusiness, loading, authIssue, retry: loadUser }
}

// ─── NAV ITEM ────────────────────────────────────────────────────────────────
interface NavItemProps {
  item: NavItemDef
  isActive: boolean
  collapsed: boolean
  isRTL: boolean
  onClick: () => void
}

function NavItem({ item, isActive, collapsed, isRTL, onClick }: NavItemProps) {
  const Icon = item.icon
  const label = isRTL ? item.labelAr : item.labelEn

  const linkEl = (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      className={[
        'group relative flex items-center rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]',
        collapsed ? 'h-9 w-9 justify-center mx-auto' : `gap-2.5 px-2.5 py-[7px]`,
        isActive
          ? 'text-[var(--brand)] font-semibold'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]',
      ].join(' ')}
    >
      {/* Active background pill */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-lg bg-[var(--brand)]/[0.08]"
          transition={springs.standard}
        />
      )}

      {/* Active left/right accent bar */}
      {isActive && !collapsed && (
        <motion.span
          layoutId="sidebar-active-bar"
          className={[
            'absolute top-1 bottom-1 w-0.5 rounded-full bg-[var(--brand)]',
            isRTL ? 'right-0' : 'left-0',
          ].join(' ')}
          transition={springs.standard}
        />
      )}

      {/* Icon */}
      <span className="relative z-10 flex shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-110 group-hover:-translate-y-px motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:translate-y-0">
        <Icon
          size={16}
          className={isActive ? 'text-[var(--brand)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors'}
        />
      </span>

      {/* Label */}
      {!collapsed && (
        <span className="relative z-10 truncate leading-tight">{label}</span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={label} position={isRTL ? 'left' : 'right'}>
        {linkEl}
      </Tooltip>
    )
  }

  return linkEl
}

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isRTL, toggleLang } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const { user, businesses, selectedBusinessId, selectBusiness, loading: authLoading, authIssue, retry: retryAuth } = useUser()
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)
  const mainContentId = useId()

  useEffect(() => {
    if (authIssue === 'unauthenticated') router.replace('/login')
    if (authIssue === 'verification_required') router.replace('/verify-email')
  }, [authIssue, router])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setUserMenuOpen(false)
        setWorkspaceMenuOpen(false)
        setHelpModalOpen(false)
      }
      const target = e.target as HTMLElement | null
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (e.key === '?' && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setHelpModalOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const logout = useCallback(() => {
    const token = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('naz_token='))
      ?.split('=')[1]
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    document.cookie = 'naz_token=; max-age=0; path=/'
    router.push('/login')
  }, [router])

  const currentItem = ALL_ITEMS.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))
  const pageTitle = currentItem ? (isRTL ? currentItem.labelAr : currentItem.labelEn) : isRTL ? 'الرئيسية' : 'Dashboard'

  const isInboxPage = pathname === '/dashboard/inbox'

  // Loading / auth redirect states
  if (authLoading || authIssue === 'unauthenticated' || authIssue === 'verification_required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-tertiary)] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
            {isRTL ? 'جارٍ تحميل ناز بزنس…' : 'Loading NazBiz…'}
          </div>
        </div>
      </div>
    )
  }

  if (authIssue === 'unavailable' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div role="alert" className="max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-md">
          <h1 className="text-sm font-bold text-[var(--text-primary)]">{isRTL ? 'تعذر تحميل حسابك' : 'Could not load your account'}</h1>
          <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">{isRTL ? 'تحقق من اتصالك ثم حاول مرة أخرى.' : 'Check your connection and try again.'}</p>
          <button type="button" onClick={() => void retryAuth()} className="mt-4 rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-[var(--brand-text)]">
            {isRTL ? 'أعد المحاولة' : 'Try again'}
          </button>
        </div>
      </div>
    )
  }

  const sidebarW = collapsed ? 68 : 248

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Skip-to-content link for keyboard users */}
      <a
        href={`#${mainContentId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-[var(--brand-text)]"
      >
        {isRTL ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>

      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-[var(--text-primary)] flex">

        {/* ── Mobile backdrop ─────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside
          role="navigation"
          aria-label={isRTL ? 'قائمة التنقل الرئيسية' : 'Main navigation'}
          style={{ width: sidebarW }}
          className={[
            'fixed top-0 bottom-0 z-40 flex flex-col bg-[var(--surface)] border-[var(--border)] transition-[width,transform] duration-200 ease-out select-none will-change-transform',
            isRTL
              ? 'right-0 border-l translate-x-full lg:translate-x-0'
              : 'left-0 border-r -translate-x-full lg:translate-x-0',
            mobileOpen ? '!translate-x-0' : '',
          ].join(' ')}
        >
          {/* ── Brand / Workspace header ──────────────────────────────── */}
          <div
            className="relative h-[60px] border-b border-[var(--border)] flex items-center px-3 shrink-0"
            ref={workspaceMenuRef}
          >
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen((v) => !v)}
                aria-expanded={workspaceMenuOpen}
                aria-haspopup="listbox"
                aria-label={isRTL ? 'اختيار مساحة العمل' : 'Select workspace'}
                className="flex items-center gap-2.5 w-full rounded-xl px-1.5 py-1.5 hover:bg-[var(--surface-elevated)] transition-colors text-left group"
              >
                {/* Brand mark */}
                <div className="w-8 h-8 rounded-lg bg-[var(--brand)] text-[var(--brand-text)] flex items-center justify-center font-black text-sm shadow-sm shrink-0" aria-hidden="true">
                  N
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight">
                    {selectedBusiness?.name || (isRTL ? 'اختر عمل' : 'Select business')}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] truncate leading-tight mt-px">
                    {user?.email || ''}
                  </div>
                </div>
                <ChevronDown
                  size={13}
                  className={[
                    'shrink-0 text-[var(--text-tertiary)] transition-transform duration-150',
                    workspaceMenuOpen ? 'rotate-180' : '',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <Tooltip content={selectedBusiness?.name || 'NazBiz'} position={isRTL ? 'left' : 'right'}>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label={isRTL ? 'توسيع القائمة الجانبية' : 'Expand sidebar'}
                  className="w-9 h-9 mx-auto rounded-lg bg-[var(--brand)] text-[var(--brand-text)] flex items-center justify-center font-bold text-xs shadow-sm hover:brightness-110 transition-[filter]"
                >
                  N
                </button>
              </Tooltip>
            )}

            {/* Workspace dropdown */}
            <AnimatePresence>
              {workspaceMenuOpen && !collapsed && (
                <motion.div
                  role="listbox"
                  aria-label={isRTL ? 'قائمة الأعمال' : 'Businesses'}
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute top-[62px] inset-x-2 bg-[var(--surface-overlay)] border border-[var(--border)] rounded-xl shadow-xl p-1.5 z-50"
                >
                  <div className="px-2.5 py-1 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.1em]">
                    {isRTL ? 'الأعمال' : 'Businesses'}
                  </div>
                  {businesses.length ? businesses.map((biz) => (
                    <button
                      key={biz.id}
                      role="option"
                      aria-selected={biz.id === selectedBusinessId}
                      type="button"
                      onClick={() => { selectBusiness(biz.id); setWorkspaceMenuOpen(false); window.location.reload() }}
                      className={[
                        'w-full flex items-center justify-between gap-2 p-2 rounded-lg text-xs font-medium transition-colors',
                        biz.id === selectedBusinessId
                          ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]',
                      ].join(' ')}
                    >
                      <span className="truncate">{biz.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] opacity-60">{biz.role}</span>
                        {biz.id === selectedBusinessId && <Check size={12} />}
                      </div>
                    </button>
                  )) : (
                    <div className="px-2.5 py-2 text-xs text-[var(--text-tertiary)]">
                      {isRTL ? 'لا توجد أعمال' : 'No businesses'}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Navigation items ──────────────────────────────────────── */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 scrollbar-none">
            <div className="px-2.5 space-y-4">
              {NAV_GROUPS.map((group, groupIdx) => (
                <div key={group.groupKey}>
                  {/* Section divider in collapsed mode */}
                  {collapsed ? (
                    groupIdx > 0 ? <div className="h-px bg-[var(--border)] mx-1.5 mb-2" /> : null
                  ) : (
                    <div
                      className="px-1 pb-1 pt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)] select-none"
                      aria-hidden="true"
                    >
                      {isRTL ? group.labelAr : group.labelEn}
                    </div>
                  )}

                  <div className={collapsed ? 'flex flex-col items-center gap-0.5' : 'space-y-0.5'} role="list" aria-label={isRTL ? group.labelAr : group.labelEn}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      return (
                        <div key={item.href} role="listitem">
                          <NavItem
                            item={item}
                            isActive={isActive}
                            collapsed={collapsed}
                            isRTL={isRTL}
                            onClick={() => setMobileOpen(false)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* ── Bottom: fixed items + user ────────────────────────────── */}
          <div className="border-t border-[var(--border)] px-2.5 pt-2 pb-2.5 space-y-0.5 shrink-0">
            {/* Bottom nav items */}
            <div role="list" aria-label={isRTL ? 'روابط الحساب' : 'Account links'} className={collapsed ? 'flex flex-col items-center gap-0.5' : 'space-y-0.5'}>
              {NAV_BOTTOM.map((item) => {
                const isActive = pathname === item.href
                return (
                  <div key={item.href} role="listitem">
                    <NavItem
                      item={item}
                      isActive={isActive}
                      collapsed={collapsed}
                      isRTL={isRTL}
                      onClick={() => setMobileOpen(false)}
                    />
                  </div>
                )
              })}
            </div>

            {/* Help */}
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="w-full flex items-center justify-between px-2.5 py-[7px] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle size={16} className="text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                  <span>{isRTL ? 'المساعدة والدعم' : 'Help & Support'}</span>
                </div>
                <kbd className="text-[9px] text-[var(--text-tertiary)] bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded-md border border-[var(--border)] font-mono" aria-label="question mark key">?</kbd>
              </button>
            ) : (
              <Tooltip content={isRTL ? 'المساعدة' : 'Help & Support'} position={isRTL ? 'left' : 'right'}>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  aria-label={isRTL ? 'المساعدة والدعم' : 'Help & Support'}
                  className="h-9 w-9 mx-auto flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]"
                >
                  <HelpCircle size={16} />
                </button>
              </Tooltip>
            )}

            {/* Divider before user */}
            <div className="h-px bg-[var(--border)] my-1" />

            {/* User profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={isRTL ? `قائمة المستخدم لـ ${user.name}` : `User menu for ${user.name}`}
                className={[
                  'w-full flex items-center rounded-xl border border-transparent hover:bg-[var(--surface-elevated)] hover:border-[var(--border)] transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]',
                  collapsed ? 'justify-center p-1' : 'gap-2.5 px-1.5 py-1.5',
                ].join(' ')}
              >
                <Avatar name={user.name} size={collapsed ? 'sm' : 'md'} />
                {!collapsed && (
                  <div className="min-w-0 flex-1 text-start">
                    <div className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)] truncate leading-tight mt-px">
                      {user.email}
                    </div>
                  </div>
                )}
              </button>

              {/* User dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    role="menu"
                    aria-label={isRTL ? 'قائمة المستخدم' : 'User menu'}
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 4 }}
                    transition={{ duration: 0.14 }}
                    className={[
                      'absolute bottom-full mb-2 bg-[var(--surface-overlay)] border border-[var(--border)] rounded-xl shadow-xl p-1.5 z-50',
                      collapsed ? (isRTL ? 'right-1 w-52' : 'left-1 w-52') : 'inset-x-0',
                    ].join(' ')}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)]/60 mb-1">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] truncate">{user.email}</div>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                    >
                      <Settings size={13} aria-hidden="true" />
                      <span>{isRTL ? 'إعدادات الحساب' : 'Account Settings'}</span>
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                    >
                      <CreditCard size={13} aria-hidden="true" />
                      <span>{isRTL ? 'إدارة الاشتراك' : 'Manage Subscription'}</span>
                    </Link>
                    <div className="my-1 border-t border-[var(--border)]/60" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors text-start focus-visible:outline-2 focus-visible:outline-[var(--error)]"
                    >
                      <LogOut size={13} aria-hidden="true" />
                      <span>{isRTL ? 'تسجيل الخروج' : 'Log out'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* ── Main content shell ───────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col min-w-0 transition-[margin] duration-200"
          style={{ [isRTL ? 'marginRight' : 'marginLeft']: `${sidebarW}px` }}
        >
          {/* ── Topbar ──────────────────────────────────────────────────── */}
          <header
            role="banner"
            className="sticky top-0 z-30 h-[56px] bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] flex items-center gap-3 px-4 sm:px-5"
          >
            {/* Left cluster */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile: open sidebar */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={isRTL ? 'فتح القائمة' : 'Open navigation'}
                aria-expanded={mobileOpen}
                aria-controls="sidebar"
                className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
              >
                <Menu size={17} />
              </button>

              {/* Desktop: collapse/expand toggle */}
              <Tooltip
                content={collapsed ? (isRTL ? 'توسيع القائمة' : 'Expand sidebar') : (isRTL ? 'طي القائمة' : 'Collapse sidebar')}
                position="bottom"
              >
                <button
                  type="button"
                  onClick={() => setCollapsed((v) => !v)}
                  aria-label={collapsed ? (isRTL ? 'توسيع القائمة الجانبية' : 'Expand sidebar') : (isRTL ? 'طي القائمة الجانبية' : 'Collapse sidebar')}
                  aria-pressed={collapsed}
                  className="hidden lg:flex p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                >
                  {collapsed
                    ? (isRTL ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />)
                    : (isRTL ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />)
                  }
                </button>
              </Tooltip>

              {/* Breadcrumb */}
              <nav aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'} className="flex items-center gap-1.5 text-xs">
                <span className="hidden sm:inline text-[var(--text-tertiary)] font-medium">NazBiz</span>
                <span className="hidden sm:inline text-[var(--text-tertiary)]" aria-hidden="true">/</span>
                <span className="font-semibold text-[var(--text-primary)]" aria-current="page">
                  {pageTitle}
                </span>
              </nav>
            </div>

            {/* Center: global search (grows) */}
            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label={isRTL ? 'البحث (Ctrl+K)' : 'Search (Ctrl+K)'}
                aria-keyshortcuts="Control+k Meta+k"
                className="hidden sm:flex items-center justify-between gap-2 px-3 py-1.5 w-full max-w-[360px] rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-xs transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <Search size={13} aria-hidden="true" />
                  <span>{isRTL ? 'بحث أو انتقل إلى...' : 'Search or jump to...'}</span>
                </div>
                <kbd
                  className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-tertiary)]"
                  aria-hidden="true"
                >
                  <Command size={9} />K
                </kbd>
              </button>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* AI Copilot badge */}
              <div
                aria-label={isRTL ? 'مساعد الذكاء الاصطناعي' : 'AI Copilot'}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--brand)]/[0.08] text-[var(--brand)] text-[10px] font-bold select-none border border-[var(--brand)]/[0.15]"
              >
                <Sparkles size={11} aria-hidden="true" />
                <span>AI Copilot</span>
              </div>

              {/* Search trigger — mobile only */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label={isRTL ? 'بحث' : 'Search'}
                className="sm:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
              >
                <Search size={17} />
              </button>

              {/* Language toggle */}
              <button
                type="button"
                onClick={toggleLang}
                aria-label={isRTL ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
                className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
              >
                {isRTL ? 'EN' : 'عربي'}
              </button>

              {/* Dark mode */}
              <DarkModeToggle />

              {/* Notifications */}
              <NotificationCenter />
            </div>
          </header>

          {/* ── Page content ──────────────────────────────────────────── */}
          <main
            id={mainContentId}
            tabIndex={-1}
            className={[
              'flex-1 w-full mx-auto flex flex-col outline-none',
              isInboxPage
                ? 'p-0 max-w-none h-[calc(100vh-56px)]'
                : 'p-4 sm:p-6 lg:p-8 max-w-7xl',
            ].join(' ')}
          >
            {children}
          </main>
        </div>

        {/* ── Global Command Palette (⌘K) ──────────────────────────────── */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {/* ── Help modal ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {helpModalOpen && (
            <>
              <motion.div
                key="help-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
                onClick={() => setHelpModalOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                key="help-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-modal-title"
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="pointer-events-auto w-full max-w-md bg-[var(--surface-overlay)] border border-[var(--border)] rounded-2xl shadow-2xl p-6">
                  <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]/70 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]" aria-hidden="true">
                        <HelpCircle size={19} />
                      </div>
                      <div>
                        <h3 id="help-modal-title" className="text-sm font-bold text-[var(--text-primary)]">
                          {isRTL ? 'مساعدة NazBiz والتوثيق' : 'NazBiz Help & Documentation'}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {isRTL ? 'احصل على إجابات فورية أو تواصل مع الدعم' : 'Get instant answers or connect with support'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(false)}
                      aria-label={isRTL ? 'إغلاق' : 'Close'}
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <a
                      href="https://docs.nazbiz.io"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border)] transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
                          {isRTL ? 'التوثيق الرسمي' : 'Official Documentation'}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {isRTL ? 'مراجع API والمساعدة' : 'API references, Webhooks, and guides'}
                        </div>
                      </div>
                      <ExternalLink size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--brand)] shrink-0" aria-hidden="true" />
                    </a>

                    <Link
                      href="/dashboard/channels"
                      onClick={() => setHelpModalOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-card)] border border-[var(--border)] transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
                          {isRTL ? 'إعداد القنوات' : 'Channel Setup Walkthrough'}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {isRTL ? 'دليل خطوة بخطوة' : 'Step-by-step guides for Instagram, WhatsApp & Salla'}
                        </div>
                      </div>
                      <ExternalLink size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--brand)] shrink-0" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]/70 mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <a href="mailto:support@nazbiz.io" className="rounded text-[var(--text-secondary)] hover:text-[var(--brand)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--brand)]">support@nazbiz.io</a>
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-[var(--brand-text)] font-semibold text-xs hover:brightness-110 transition-[filter] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                    >
                      {isRTL ? 'إغلاق' : 'Close'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
