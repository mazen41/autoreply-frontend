'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export function AdminShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mx-auto w-full max-w-[1560px] space-y-6', className)}>{children}</div>
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 dark:text-emerald-300">{eyebrow}</div>}
        <h1 className="text-3xl font-black text-slate-950 dark:text-white md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ children, className = '', motionKey }: { children: React.ReactNode; className?: string; motionKey?: string }) {
  return (
    <motion.section key={motionKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} className={clsx('rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]', className)}>
      {children}
    </motion.section>
  )
}

export function StatCard({ label, value, detail, trend, icon, tone = 'emerald' }: { label: string; value: string | number; detail?: string; trend?: string; icon?: React.ReactNode; tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate' }) {
  const gradient = { emerald: 'from-emerald-500 to-teal-500', cyan: 'from-cyan-500 to-blue-500', violet: 'from-violet-500 to-fuchsia-500', amber: 'from-amber-400 to-orange-500', rose: 'from-rose-500 to-red-500', slate: 'from-slate-500 to-slate-700' }[tone]
  const trendClass = { emerald: 'text-emerald-600 dark:text-emerald-300', cyan: 'text-cyan-600 dark:text-cyan-300', violet: 'text-violet-600 dark:text-violet-300', amber: 'text-amber-600 dark:text-amber-300', rose: 'text-rose-600 dark:text-rose-300', slate: 'text-slate-600 dark:text-slate-300' }[tone]
  return (
    <Panel className="relative overflow-hidden p-5">
      <div className={clsx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90', gradient)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <div className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{value}</div>
        </div>
        {icon && <div className={clsx('rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg', gradient)}>{icon}</div>}
      </div>
      {(detail || trend) && <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500 dark:text-slate-400">{detail}</span>{trend && <span className={clsx('font-bold', trendClass)}>{trend}</span>}</div>}
    </Panel>
  )
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate' }) {
  const classes = { emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20', cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-400/20', violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-200 dark:ring-violet-400/20', amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20', rose: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20', slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10' }[tone]
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1', classes)}>{children}</span>
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const variants = { primary: 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200', ghost: 'bg-white/70 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/12', danger: 'bg-rose-600 text-white hover:bg-rose-500' }[variant]
  return <button {...props} className={clsx('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', variants, className)}>{children}</button>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>{children}{hint && <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span>}</label>
}

export const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15 dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500'

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/8" />)}</div>
}
