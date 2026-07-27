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
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/50 dark:text-white/30">{eyebrow}</div>}
        <h1 className="text-3xl font-black text-white/70 dark:text-white md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70 dark:text-white/70">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ children, className = '', motionKey }: { children: React.ReactNode; className?: string; motionKey?: string }) {
  return (
    <motion.section key={motionKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} className={clsx('rounded-2xl border border-white/10 bg-white/85 p-5 shadow-[0_24px_80px_var(--accent-subtle)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_80px_var(--shadow-premium)]', className)}>
      {children}
    </motion.section>
  )
}

export function StatCard({ label, value, detail, trend, icon, tone = 'slate' }: { label: string; value: string | number; detail?: string; trend?: string; icon?: React.ReactNode; tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate' }) {
  const gradient = { emerald: 'from-[var(--accent)]/50 to-white/50', cyan: 'from-[var(--accent)]/50 to-white/50', violet: 'from-[var(--accent)]/50 to-white', amber: 'from-[var(--accent)]/40 to-white/50', rose: 'from-[var(--accent)]/50 to-white/50', slate: 'from-[var(--accent)] to-white' }[tone]
  const trendClass = { emerald: 'text-white/60 dark:text-white/30', cyan: 'text-white/60 dark:text-white/30', violet: 'text-white/60 dark:text-white/30', amber: 'text-white/60 dark:text-white/30', rose: 'text-white/60 dark:text-white/30', slate: 'text-white/70 dark:text-white/70' }[tone]
  return (
    <Panel className="relative overflow-hidden p-5">
      <div className={clsx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90', gradient)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/70 dark:text-white/70">{label}</p>
          <div className="mt-3 text-3xl font-black text-white/70 dark:text-white">{value}</div>
        </div>
        {icon && <div className={clsx('rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg', gradient)}>{icon}</div>}
      </div>
      {(detail || trend) && <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="text-white/70 dark:text-white/70">{detail}</span>{trend && <span className={clsx('font-bold', trendClass)}>{trend}</span>}</div>}
    </Panel>
  )
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate' }) {
  const classes = { emerald: 'bg-white/50 text-white/70 ring-white/10 dark:bg-white/40 dark:text-white/20 dark:ring-[var(--accent)]/20', cyan: 'bg-white/50 text-white/70 ring-white/10 dark:bg-white/40 dark:text-white/20 dark:ring-[var(--accent)]/20', violet: 'bg-white/50 text-white/70 ring-white/10 dark:bg-white/40 dark:text-white/20 dark:ring-[var(--accent)]/20', amber: 'bg-white/50 text-white/70 ring-white/10 dark:bg-white/40 dark:text-white/20 dark:ring-[var(--accent)]/20', rose: 'bg-white/50 text-white/70 ring-white/10 dark:bg-white/40 dark:text-white/20 dark:ring-[var(--accent)]/20', slate: 'bg-white/5 text-white/70 ring-slate-200 dark:bg-white/8 dark:text-white/70 dark:ring-white/10' }[tone]
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1', classes)}>{children}</span>
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const variants = { primary: 'bg-white/5 text-white hover:bg-white/5 dark:bg-white dark:text-white/70 dark:hover:bg-white/5', ghost: 'bg-white/70 text-white/70 ring-1 ring-slate-200 hover:bg-white/5 dark:bg-white/8 dark:text-white/70 dark:ring-white/10 dark:hover:bg-white/12', danger: 'bg-white/60 text-white hover:bg-white/50' }[variant]
  return <button {...props} className={clsx('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', variants, className)}>{children}</button>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-white/70 dark:text-white/70">{label}</span>{children}{hint && <span className="mt-2 block text-xs leading-5 text-white/70 dark:text-white/70">{hint}</span>}</label>
}

export const inputClass = 'w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-white/70 outline-none transition placeholder:text-white/70 focus:border-white/40 focus:ring-4 focus:ring-[var(--accent)]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70'

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="skeleton" style={{ height: '3.5rem' }} />)}</div>
}
