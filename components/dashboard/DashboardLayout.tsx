'use client'

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springs } from '../../lib/motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import NotificationCenter from '../NotificationCenter'
import DarkModeToggle from '../DarkModeToggle'
import CommandPalette from '../ui/CommandPalette'
import GuidedTours from '../GuidedTours'
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
  Plus,
  Zap,
} from 'lucide-react'

// ─── NAV GROUPS ──────────────────────────────────────────────────────────────
interface NavItemDef {
  icon: React.ComponentType<{ className?: string; size?: number }>
  href: string
  labelEn: string
  labelAr: string
  badge?: string
  badgeColor?: 'brand' | 'success' | 'violet'
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
      { icon: Radio, href: '/dashboard/channels', labelEn: 'Channels', labelAr: 'القنوات', badge: 'Live', badgeColor: 'success' },
      { icon: MessageCircle, href: '/dashboard/whatsapp', labelEn: 'WhatsApp', labelAr: 'واتساب' },
    ],
  },
  {
    groupKey: 'ai',
    labelEn: 'AI & Knowledge',
    labelAr: 'الذكاء والمعرفة',
    items: [
      { icon: Bot, href: '/dashboard/bots', labelEn: 'Bots', labelAr: 'البوتات', badge: 'AI', badgeColor: 'brand' },
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
      { icon: Workflow, href: '/dashboard/workflows', labelEn: 'Workflows', labelAr: 'سير العمل', badge: 'Auto', badgeColor: 'violet' },
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

  const badgeClass =
    item.badgeColor === 'success'
      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      : item.badgeColor === 'violet'
      ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
      : 'bg-brand/10 text-brand border border-brand/20'

  const linkEl = (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      className={[
        'group relative flex items-center rounded-xl text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]',
        collapsed ? 'h-10 w-10 justify-center mx-auto' : `gap-3 px-3 py-2`,
        isActive
          ? 'text-brand font-bold bg-gradient-to-r from-brand/12 via-brand/8 to-brand-violet/5 border border-brand/20 shadow-xs'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80',
      ].join(' ')}
    >
      {/* Active accent side indicator bar */}
      {isActive && !collapsed && (
        <motion.span
          layoutId="sidebar-active-bar"
          className={[
            'absolute top-1.5 bottom-1.5 w-1 rounded-full bg-gradient-to-b from-brand to-brand-violet shadow-sm shadow-brand/40',
            isRTL ? 'right-0' : 'left-0',
          ].join(' ')}
          transition={springs.standard}
        />
      )}

      {/* Icon */}
      <span className="relative z-10 flex shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-110 motion-reduce:transition-none">
        <Icon
          size={16}
          className={isActive ? 'text-brand drop-shadow-xs' : 'text-text-tertiary group-hover:text-text-primary transition-colors'}
        />
      </span>

      {/* Label & Optional Badge */}
      {!collapsed && (
        <>
          <span className="relative z-10 truncate leading-tight flex-1">{label}</span>
          {item.badge && (
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase ${badgeClass}`}>
              {item.badge}
            </span>
          )}
        </>
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
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-surface-elevated shadow-lg shadow-brand/10">
            <Image src="/icons/logo_icon.png" alt="Naz AutoReply" width={32} height={32} className="object-contain" priority />
            <span className="absolute -inset-1 animate-ping rounded-[1.15rem] border border-brand/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-text-tertiary tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            {isRTL ? 'جارٍ تحميل لوحة التحكم…' : 'Loading Naz AutoReply…'}
          </div>
        </div>
      </div>
    )
  }

  if (authIssue === 'unavailable' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div role="alert" className="max-w-sm rounded-3xl border border-border bg-surface-elevated p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
            <X size={20} />
          </div>
          <h1 className="text-base font-bold text-text-primary">{isRTL ? 'تعذر تحميل حسابك' : 'Could not load your account'}</h1>
          <p className="mt-2 text-xs text-text-secondary leading-relaxed">{isRTL ? 'تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.' : 'Check your internet connection and try again.'}</p>
          <button
            type="button"
            onClick={() => void retryAuth()}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand to-brand-violet px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 hover:brightness-110 active:scale-[0.99] transition-all"
          >
            {isRTL ? 'أعد المحاولة' : 'Try again'}
          </button>
        </div>
      </div>
    )
  }

  const sidebarW = collapsed ? 72 : 260

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Skip-to-content link for keyboard users */}
      <a
        href={`#${mainContentId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white shadow-lg"
      >
        {isRTL ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>

      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-text-primary flex">

        {/* ── Mobile backdrop ─────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside
          role="navigation"
          data-lenis-prevent
          aria-label={isRTL ? 'قائمة التنقل الرئيسية' : 'Main navigation'}
          style={{ width: sidebarW }}
          className={[
            'fixed top-0 bottom-0 z-40 flex flex-col bg-surface/90 backdrop-blur-xl border-border/80 transition-[width,transform] duration-200 ease-out select-none will-change-transform shadow-xs',
            isRTL
              ? 'right-0 border-l translate-x-full lg:translate-x-0'
              : 'left-0 border-r -translate-x-full lg:translate-x-0',
            mobileOpen ? '!translate-x-0' : '',
          ].join(' ')}
        >
          {/* ── Brand / Workspace header ──────────────────────────────── */}
          <div
            className="relative h-[64px] border-b border-border/70 flex items-center px-3.5 shrink-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent"
            ref={workspaceMenuRef}
          >
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen((v) => !v)}
                aria-expanded={workspaceMenuOpen}
                aria-haspopup="listbox"
                aria-label={isRTL ? 'اختيار مساحة العمل' : 'Select workspace'}
                className="flex items-center gap-3 w-full rounded-xl px-2 py-1.5 hover:bg-surface-elevated/80 border border-transparent hover:border-border/60 transition-all text-start group shadow-2xs"
              >
                {/* Brand mark */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-violet/20 border border-brand/30 shadow-xs">
                  <Image src="/icons/logo_icon.png" alt="Naz AutoReply" width={22} height={22} className="object-contain" priority />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-text-primary truncate leading-tight">
                      {selectedBusiness?.name || (isRTL ? 'اختر مساحة عمل' : 'Select Workspace')}
                    </span>
                    <span className="rounded bg-brand/10 px-1 py-0.2 text-[9px] font-bold text-brand">
                      PRO
                    </span>
                  </div>
                  <div className="text-[10px] text-text-tertiary truncate leading-tight mt-0.5">
                    {user?.email || ''}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={[
                    'shrink-0 text-text-tertiary transition-transform duration-150 group-hover:text-text-primary',
                    workspaceMenuOpen ? 'rotate-180' : '',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <Tooltip content={selectedBusiness?.name || 'Naz AutoReply'} position={isRTL ? 'left' : 'right'}>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label={isRTL ? 'توسيع القائمة الجانبية' : 'Expand sidebar'}
                  className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-violet/20 border border-brand/30 shadow-xs hover:brightness-110 transition-all"
                >
                  <Image src="/icons/logo_icon.png" alt="Naz AutoReply" width={24} height={24} className="object-contain" priority />
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
                  className="absolute top-[66px] inset-x-2 bg-surface-overlay border border-border/80 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    {isRTL ? 'مساحات العمل النشطة' : 'Active Workspaces'}
                  </div>
                  {businesses.length ? (
                    businesses.map((biz) => (
                      <button
                        key={biz.id}
                        role="option"
                        aria-selected={biz.id === selectedBusinessId}
                        type="button"
                        onClick={() => {
                          selectBusiness(biz.id)
                          setWorkspaceMenuOpen(false)
                          window.location.reload()
                        }}
                        className={[
                          'w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs font-medium transition-all my-0.5',
                          biz.id === selectedBusinessId
                            ? 'bg-brand/10 text-brand font-bold border border-brand/20'
                            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{biz.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] opacity-70 font-semibold">{biz.role}</span>
                          {biz.id === selectedBusinessId && <Check size={13} className="text-brand" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-2.5 py-2 text-xs text-text-tertiary">
                      {isRTL ? 'لا توجد مساحات عمل' : 'No workspaces'}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Navigation items ──────────────────────────────────────── */}
          <nav data-lenis-prevent className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
            <div className="px-3 space-y-4">
              {NAV_GROUPS.map((group, groupIdx) => (
                <div key={group.groupKey}>
                  {/* Section divider in collapsed mode */}
                  {collapsed ? (
                    groupIdx > 0 ? <div className="h-px bg-border/60 mx-1.5 mb-2" /> : null
                  ) : (
                    <div
                      className="px-2 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary/90 select-none flex items-center justify-between"
                      aria-hidden="true"
                    >
                      <span>{isRTL ? group.labelAr : group.labelEn}</span>
                    </div>
                  )}

                  <div className={collapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'} role="list" aria-label={isRTL ? group.labelAr : group.labelEn}>
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

          {/* ── Bottom: fixed items + AI status + user ────────────────────────────── */}
          <div className="border-t border-border/70 px-3 pt-2.5 pb-3 space-y-2 shrink-0 bg-surface/50">
            {/* Pro AI Status Widget */}
            {!collapsed && (
              <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/10 via-brand-violet/5 to-transparent p-2.5 text-start shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] font-bold text-text-primary">
                      {isRTL ? 'الذكاء الاصطناعي نشط' : 'AI Engine 2.4'}
                    </span>
                  </div>
                  <span className="rounded bg-brand/20 px-1.5 py-0.2 text-[9px] font-bold text-brand">
                    {isRTL ? '24/7 متصل' : 'ONLINE'}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-text-tertiary truncate leading-relaxed">
                  {isRTL ? 'أتمتة المحادثات نشطة بجميع القنوات' : 'Autonomous multi-channel replies active'}
                </p>
              </div>
            )}

            {/* Bottom nav items */}
            <div role="list" aria-label={isRTL ? 'روابط الحساب' : 'Account links'} className={collapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'}>
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80 transition-all focus-visible:outline-2 focus-visible:outline-brand"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-text-tertiary shrink-0" aria-hidden="true" />
                  <span>{isRTL ? 'المساعدة والدعم' : 'Help & Support'}</span>
                </div>
                <kbd className="text-[10px] text-text-tertiary bg-surface-elevated px-1.5 py-0.5 rounded-md border border-border font-mono shadow-xs" aria-label="question mark key">?</kbd>
              </button>
            ) : (
              <Tooltip content={isRTL ? 'المساعدة' : 'Help & Support'} position={isRTL ? 'left' : 'right'}>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  aria-label={isRTL ? 'المساعدة والدعم' : 'Help & Support'}
                  className="h-10 w-10 mx-auto flex items-center justify-center rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-elevated/80 transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <HelpCircle size={16} />
                </button>
              </Tooltip>
            )}

            {/* Divider before user */}
            <div className="h-px bg-border/60 my-1" />

            {/* User profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={isRTL ? `قائمة المستخدم لـ ${user.name}` : `User menu for ${user.name}`}
                className={[
                  'w-full flex items-center rounded-xl border border-border/70 hover:border-brand/40 bg-surface-elevated/50 hover:bg-surface-elevated transition-all focus-visible:outline-2 focus-visible:outline-brand shadow-xs',
                  collapsed ? 'justify-center p-1.5' : 'gap-3 px-2 py-1.5',
                ].join(' ')}
              >
                <div className="relative">
                  <Avatar name={user.name} size={collapsed ? 'sm' : 'md'} status="online" />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1 text-start">
                    <div className="text-xs font-bold text-text-primary truncate leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-text-tertiary truncate leading-tight mt-0.5">
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
                      'absolute bottom-full mb-2 bg-surface-overlay/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-2 z-50',
                      collapsed ? (isRTL ? 'right-1 w-56' : 'left-1 w-56') : 'inset-x-0',
                    ].join(' ')}
                  >
                    <div className="px-3 py-2 border-b border-border/60 mb-1.5">
                      <div className="text-xs font-bold text-text-primary truncate">{user.name}</div>
                      <div className="text-[10px] text-text-tertiary truncate mt-0.5">{user.email}</div>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors"
                    >
                      <Settings size={14} aria-hidden="true" />
                      <span>{isRTL ? 'إعدادات الحساب' : 'Account Settings'}</span>
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors"
                    >
                      <CreditCard size={14} aria-hidden="true" />
                      <span>{isRTL ? 'إدارة الاشتراك' : 'Manage Subscription'}</span>
                    </Link>
                    <div className="my-1 border-t border-border/60" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-error hover:bg-error/10 rounded-xl transition-colors text-start"
                    >
                      <LogOut size={14} aria-hidden="true" />
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
          {/* ── Topbar (Navbar) ─────────────────────────────────────────── */}
          <header
            role="banner"
            className="sticky top-0 z-30 h-[64px] bg-surface/85 backdrop-blur-xl border-b border-border/80 flex items-center gap-3 px-4 sm:px-6 shadow-xs"
          >
            {/* Left cluster */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Mobile: open sidebar */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={isRTL ? 'فتح القائمة' : 'Open navigation'}
                aria-expanded={mobileOpen}
                aria-controls="sidebar"
                className="lg:hidden p-2 rounded-xl border border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                <Menu size={18} />
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
                  className="hidden lg:flex p-2 rounded-xl border border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80 transition-colors shadow-2xs"
                >
                  {collapsed
                    ? (isRTL ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />)
                    : (isRTL ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />)
                  }
                </button>
              </Tooltip>

              {/* Breadcrumb */}
              <nav aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'} className="flex items-center gap-2 text-xs">
                <span className="hidden sm:inline font-bold text-text-tertiary">Naz AutoReply</span>
                <span className="hidden sm:inline text-text-tertiary/70" aria-hidden="true">/</span>
                <span className="font-extrabold text-sm text-text-primary tracking-tight" aria-current="page">
                  {pageTitle}
                </span>
              </nav>
            </div>

            {/* Center: global search (grows) */}
            <div className="flex-1 flex justify-center px-2">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label={isRTL ? 'البحث (Ctrl+K)' : 'Search (Ctrl+K)'}
                aria-keyshortcuts="Control+k Meta+k"
                className="hidden sm:flex items-center justify-between gap-3 px-3.5 py-2 w-full max-w-[380px] rounded-xl bg-surface-elevated/70 border border-border/80 hover:border-brand/40 text-text-tertiary hover:text-text-secondary text-xs transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <Search size={14} className="text-text-tertiary group-hover:text-brand transition-colors" aria-hidden="true" />
                  <span className="text-text-tertiary group-hover:text-text-secondary">
                    {isRTL ? 'بحث سريع، قنوات، أوامر... (⌘K)' : 'Search actions, bots, channels... (⌘K)'}
                  </span>
                </div>
                <kbd
                  className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-surface border border-border/90 rounded-md text-text-tertiary shadow-2xs"
                  aria-hidden="true"
                >
                  <Command size={10} />K
                </kbd>
              </button>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2 shrink-0">
              {/* AI Engine Status badge */}
              <div
                aria-label={isRTL ? 'حالة الذكاء الاصطناعي' : 'AI Engine Operational'}
                className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-500 select-none backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{isRTL ? 'محرك الذكاء متصل' : 'AI Operational'}</span>
              </div>

              {/* Quick Connect Channel Button */}
              <Link
                href="/dashboard/channels"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-violet px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-brand/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Plus size={13} />
                <span>{isRTL ? 'ربط قناة' : 'Connect Channel'}</span>
              </Link>

              {/* Search trigger — mobile only */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label={isRTL ? 'بحث' : 'Search'}
                className="sm:hidden p-2 rounded-xl border border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                <Search size={17} />
              </button>

              {/* Language toggle */}
              <button
                type="button"
                onClick={toggleLang}
                aria-label={isRTL ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
                className="px-2.5 py-1.5 text-[11px] font-bold text-text-secondary hover:text-text-primary rounded-xl border border-border/80 hover:bg-surface-elevated/80 transition-colors shadow-2xs"
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
                ? 'p-0 max-w-none h-[calc(100vh-64px)]'
                : 'p-4 sm:p-6 lg:p-8 max-w-none',
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

        <GuidedTours businessId={selectedBusinessId} setupCompleted={user?.onboarding_completed ?? true} />

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
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
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
                <div className="pointer-events-auto w-full max-w-md bg-surface-overlay/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl p-6">
                  <div className="flex items-start justify-between pb-4 border-b border-border/70 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-brand/10 text-brand" aria-hidden="true">
                        <HelpCircle size={20} />
                      </div>
                      <div>
                        <h3 id="help-modal-title" className="text-sm font-bold text-text-primary">
                          {isRTL ? 'مساعدة نزار والتوثيق' : 'Naz AutoReply Help & Docs'}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {isRTL ? 'دليل إعداد القنوات وأدلة الذكاء الاصطناعي والدعم' : 'Channel setups, AI guides & merchant support'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(false)}
                      aria-label={isRTL ? 'إغلاق' : 'Close'}
                      className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <a
                      href="https://docs.nazbiz.io"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated/70 hover:bg-surface-card border border-border/70 transition-all group"
                    >
                      <div>
                        <div className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors">
                          {isRTL ? 'التوثيق الرسمي' : 'Official Documentation'}
                        </div>
                        <div className="text-[10px] text-text-tertiary mt-0.5">
                          {isRTL ? 'مراجع API والربط السحابي ومسارات العمل' : 'API references, Webhooks, and setup guides'}
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-text-tertiary group-hover:text-brand shrink-0" aria-hidden="true" />
                    </a>

                    <Link
                      href="/dashboard/channels"
                      onClick={() => setHelpModalOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated/70 hover:bg-surface-card border border-border/70 transition-all group"
                    >
                      <div>
                        <div className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors">
                          {isRTL ? 'إعداد القنوات والمتاجر' : 'Channel & Store Connect'}
                        </div>
                        <div className="text-[10px] text-text-tertiary mt-0.5">
                          {isRTL ? 'دليل ربط واتساب، إنستغرام، سلة وشوبيفاي' : 'Step-by-step connection for WhatsApp, IG, Salla & Shopify'}
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-text-tertiary group-hover:text-brand shrink-0" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="pt-4 border-t border-border/70 mt-4 flex items-center justify-between text-xs text-text-tertiary">
                    <a href="mailto:support@nazbiz.io" className="text-text-secondary hover:text-brand hover:underline font-medium">support@nazbiz.io</a>
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand to-brand-violet text-white font-bold text-xs shadow-md shadow-brand/20 hover:brightness-110 transition-all"
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
