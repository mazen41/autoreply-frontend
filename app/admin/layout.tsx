'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Bell, Box, CreditCard, FileText, Home, LogOut, Menu, Moon, Search, Settings, Shield, Sun, Users, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useLang } from '../../lib/LangContext'

const navItems = [
  { path: '/admin', ar: '????????', en: 'Overview', icon: Home },
  { path: '/admin/users', ar: '??????????', en: 'Users', icon: Users },
  { path: '/admin/packages', ar: '???????', en: 'Packages', icon: Box },
  { path: '/admin/payments', ar: '?????????', en: 'Payments', icon: CreditCard },
  { path: '/admin/blog', ar: '???????', en: 'Blog', icon: FileText },
  { path: '/admin/settings', ar: '?????????', en: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => typeof window === 'undefined' ? true : (window.localStorage.getItem('naz-admin-theme') || 'dark') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const checkAdmin = useCallback(async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, '$1')
      if (!token) {
        router.push('/admin/login')
        return
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json()
      if (!data.is_admin) {
        router.push('/admin/login')
        return
      }
      setIsAdmin(true)
    } catch (error) {
      console.error('Failed to check admin status:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (pathname !== '/admin/login') checkAdmin()
  }, [checkAdmin, pathname])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    window.localStorage.setItem('naz-admin-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  const handleLogout = () => {
    document.cookie = 'naz_token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const pageTitle = useMemo(() => navItems.find((item) => item.path === pathname)?.[isRTL ? 'ar' : 'en'] || (isRTL ? '???? ???????' : 'Admin'), [pathname, isRTL])

  if (pathname === '/admin/login') return <>{children}</>

  if (loading) {
    return <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white"><div className="mx-auto flex min-h-screen max-w-sm items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-400" /></div></div>
  }

  if (!isAdmin) return null

  const Sidebar = (
    <aside className="flex h-full w-72 flex-col border-slate-200/80 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 lg:border-r lg:shadow-none rtl:lg:border-l rtl:lg:border-r-0">
      <div className="flex items-center justify-between p-2">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 text-slate-950 shadow-lg shadow-emerald-500/20"><Shield size={22} /></div>
          <div>
            <div className="text-lg font-black text-slate-950 dark:text-white">Naz Admin</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRTL ? '???? ??????' : 'Command Center'}</div>
          </div>
        </Link>
        <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.path
          return (
            <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)} className={clsx('group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition', active ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15 dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white')}>
              <Icon size={19} />
              <span>{isRTL ? item.ar : item.en}</span>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><BarChart3 size={19} />{isRTL ? '?????? ???????' : 'Back to App'}</Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10"><LogOut size={19} />{t.common.logout}</button>
      </div>
    </aside>
  )

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_32%),linear-gradient(180deg,#f8fafc,#eef2f7)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] dark:text-white">
      <div className="fixed inset-y-0 z-40 hidden lg:block">{Sidebar}</div>
      <AnimatePresence>{sidebarOpen && <motion.div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)}><motion.div className="h-full" initial={{ x: isRTL ? 320 : -320 }} animate={{ x: 0 }} exit={{ x: isRTL ? 320 : -320 }} onClick={(event) => event.stopPropagation()}>{Sidebar}</motion.div></motion.div>}</AnimatePresence>

      <div className="lg:pl-72 rtl:lg:pl-0 rtl:lg:pr-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-950 dark:text-white">{pageTitle}</div>
                <div className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{isRTL ? '????? ??????? ??????? ?????? ?????????? ??????????' : 'Manage performance, security, AI, and revenue'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-slate-400 md:flex"><Search size={16} />{isRTL ? '??? ???' : 'Global search'}<kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-white/10">/</kbd></div>
              <button className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Notifications"><Bell size={20} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400" /></button>
              <button onClick={toggleTheme} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Toggle theme">{dark ? <Sun size={20} /> : <Moon size={20} />}</button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}




