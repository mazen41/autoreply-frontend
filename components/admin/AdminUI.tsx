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
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">{eyebrow}</div>}
        <h1 className="text-3xl font-black text-text-primary md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ children, className = '', motionKey }: { children: React.ReactNode; className?: string; motionKey?: string }) {
  return (
    <motion.section key={motionKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} className={clsx('rounded-2xl border border-border bg-surface-card p-5 shadow-md', className)}>
      {children}
    </motion.section>
  )
}

export function StatCard({ label, value, detail, trend, icon, tone = 'slate' }: { label: string; value: string | number; detail?: string; trend?: string; icon?: React.ReactNode; tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate' }) {
  const styles = {
    emerald: { bar: 'bg-success', icon: 'bg-success-subtle text-success', trend: 'text-success' },
    cyan: { bar: 'bg-brand-cyan', icon: 'bg-info-subtle text-info', trend: 'text-info' },
    violet: { bar: 'bg-ai-accent', icon: 'bg-ai-subtle text-ai-accent', trend: 'text-ai-accent' },
    amber: { bar: 'bg-warning', icon: 'bg-warning-subtle text-warning', trend: 'text-warning' },
    rose: { bar: 'bg-error', icon: 'bg-error-subtle text-error', trend: 'text-error' },
    slate: { bar: 'bg-border-strong', icon: 'bg-surface-secondary text-text-secondary', trend: 'text-text-secondary' },
  }[tone]
  return (
    <Panel className="relative overflow-hidden p-5">
      <div className={clsx('absolute inset-x-0 top-0 h-1 opacity-90', styles.bar)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <div className="mt-3 text-3xl font-black text-text-primary">{value}</div>
        </div>
        {icon && <div className={clsx('rounded-2xl p-3 shadow-sm', styles.icon)}>{icon}</div>}
      </div>
      {(detail || trend) && <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="text-text-secondary">{detail}</span>{trend && <span className={clsx('font-bold', styles.trend)}>{trend}</span>}</div>}
    </Panel>
  )
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate' }) {
  const classes = { emerald: 'bg-success-subtle text-success ring-success/25', cyan: 'bg-info-subtle text-info ring-info/25', violet: 'bg-ai-subtle text-ai-accent ring-ai-accent/25', amber: 'bg-warning-subtle text-warning ring-warning/25', rose: 'bg-error-subtle text-error ring-error/25', slate: 'bg-surface-secondary text-text-secondary ring-border' }[tone]
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1', classes)}>{children}</span>
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const variants = { primary: 'bg-brand text-white hover:bg-brand-hover', ghost: 'bg-surface-elevated text-text-primary ring-1 ring-border hover:bg-surface-hover', danger: 'bg-error-subtle text-error ring-1 ring-error/25 hover:bg-error/20' }[variant]
  return <button {...props} className={clsx('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50', variants, className)}>{children}</button>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-text-secondary">{label}</span>{children}{hint && <span className="mt-2 block text-xs leading-5 text-text-muted">{hint}</span>}</label>
}

export const inputClass = 'w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand focus:ring-4 focus:ring-accent/15'

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="skeleton" style={{ height: '3.5rem' }} />)}</div>
}
