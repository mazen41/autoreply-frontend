'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus, Search, Filter, MoreHorizontal, Play, Pause, Copy,
  Trash2, Edit2, Zap, Clock, Users, CheckCircle, TrendingUp,
  MessageSquare, ChevronDown, Activity, ArrowUpRight, Mail,
  Phone, Send, Globe, AlertCircle
} from 'lucide-react'
import { useSequences, Sequence } from '../../../hooks/useSequences'

// ─── Types ────────────────────────────────────────────────────────────────────
type SeqStatus = 'active' | 'paused' | 'draft'
type Channel   = 'whatsapp' | 'telegram' | 'email'

interface SequenceWithStats {
  id: number
  name: string
  description?: string | null
  channel?: 'whatsapp' | 'telegram' | 'email' | null
  status: 'draft' | 'active' | 'paused' | 'archived'
  trigger_type: 'new_user' | 'tag_added' | 'no_reply' | 'manual' | 'order_created'
  trigger?: string
  enrolled: number
  completed: number
  conversionRate: number
  messagesSent: number
  updatedAt?: string
  createdAt?: string
  steps?: any[]
}

// ─── Channel config ───────────────────────────────────────────────────────────
const CH: Record<Channel, { label: string; color: string; bg: string }> = {
  whatsapp:  { label: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.1)' },
  telegram:  { label: 'Telegram',  color: '#2AABEE', bg: 'rgba(42,171,238,0.1)' },
  email:     { label: 'Email',     color: '#EA4335', bg: 'rgba(234,67,53,0.1)' },
}

const STATUS: Record<SeqStatus | 'archived', { label: string; color: string; bg: string; dot: string }> = {
  active: { label: 'Active', color: '#16A085', bg: 'rgba(22,160,133,0.1)', dot: '#16A085' },
  paused: { label: 'Paused', color: '#F39C12', bg: 'rgba(243,156,18,0.1)', dot: '#F39C12' },
  draft:  { label: 'Draft',  color: '#6A6A78', bg: 'rgba(106,106,120,0.1)', dot: '#A9AAB8' },
  archived: { label: 'Archived', color: '#95A5A6', bg: 'rgba(149,165,166,0.1)', dot: '#95A5A6' },
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent: string
}) {
  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">{label}</p>
        <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
        {sub && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Sequence Card ────────────────────────────────────────────────────────────
function SeqCard({ seq, onAction }: { seq: SequenceWithStats; onAction: (action: string, id: number) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ch = CH[seq.channel || 'whatsapp']
  const st = STATUS[seq.status as SeqStatus]
  const pct = seq.enrolled > 0 ? Math.round((seq.completed / seq.enrolled) * 100) : 0

  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)] hover:shadow-md transition-all group relative">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link href={`/dashboard/sequences/${seq.id}`}
              className="text-[15px] font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate">
              {seq.name}
            </Link>
            {/* Status badge */}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
              style={{ background: st.bg, color: st.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{seq.description || seq.trigger}</p>
        </div>

        {/* Channel badge */}
        {seq.channel && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0"
            style={{ background: ch.bg, color: ch.color }}>
            {seq.channel === 'whatsapp' && '●'} {ch.label}
          </span>
        )}
      </div>

      {/* Trigger */}
      <div className="flex items-center gap-1.5 mb-4">
        <Zap size={12} className="text-amber-500" />
        <span className="text-[11px] text-[var(--text-secondary)]">Trigger:</span>
        <span className="text-[11px] font-semibold text-[var(--text-primary)]">{seq.trigger}</span>
        <span className="ml-2 text-[11px] text-[var(--text-tertiary)]">·</span>
        <span className="text-[11px] text-[var(--text-tertiary)]">{seq.steps} steps</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Enrolled', value: seq.enrolled.toLocaleString(), icon: Users },
          { label: 'Completed', value: seq.completed.toLocaleString(), icon: CheckCircle },
          { label: 'Sent', value: seq.messagesSent.toLocaleString(), icon: MessageSquare },
          { label: 'Conversion', value: `${seq.conversionRate}%`, icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-[13px] font-black text-[var(--text-primary)]">{s.value}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar (enrolled → completed) */}
      {seq.enrolled > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
            <span>Completion progress</span>
            <span className="font-bold">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-end)] transition-all"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--divider)] pt-3">
        <span className="text-[10px] text-[var(--text-tertiary)]">Updated {seq.updatedAt}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/sequences/${seq.id}/edit`}
            className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" title="Edit">
            <Edit2 size={13} />
          </Link>
          <button onClick={() => onAction('duplicate', seq.id)}
            className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" title="Duplicate">
            <Copy size={13} />
          </button>
          <button onClick={() => onAction(seq.status === 'active' ? 'pause' : 'activate', seq.id)}
            className={`p-1.5 rounded-lg transition-colors ${seq.status === 'active'
              ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-600'}`}
            title={seq.status === 'active' ? 'Pause' : 'Activate'}>
            {seq.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors">
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-8 w-36 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-lg z-20 overflow-hidden">
                <button onClick={() => { onAction('delete', seq.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SequencesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SeqStatus>('all')
  const [channelFilter, setChannelFilter] = useState<'all' | Channel>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'performance'>('updated')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  
  const {
    sequences,
    loading,
    error,
    fetchSequences,
    activateSequence,
    pauseSequence,
    duplicateSequence,
    deleteSequence,
  } = useSequences()

  const transformedSequences = useMemo(() => {
    return sequences.map(seq => ({
      ...seq,
      enrolled: seq.total_enrollments || 0,
      completed: seq.total_enrollments ? Math.round((seq.total_enrollments * (seq.active_enrollments || 0) / 100)) : 0,
      conversionRate: seq.total_enrollments ? Math.round((seq.active_enrollments || 0) / seq.total_enrollments * 100) : 0,
      messagesSent: seq.total_enrollments || 0,
      trigger: seq.trigger_type,
      steps: seq.steps || [],
      updatedAt: new Date(seq.updated_at).toLocaleString(),
    } as SequenceWithStats))
  }, [sequences])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleAction = async (action: string, id: number) => {
    if (action === 'delete') {
      if (!confirm('Delete this sequence? This cannot be undone.')) return
      const success = await deleteSequence(id)
      if (success) {
        showToast('Sequence deleted')
      } else {
        showToast('Failed to delete sequence')
      }
    } else if (action === 'pause') {
      const result = await pauseSequence(id)
      if (result) {
        showToast('Sequence paused')
      } else {
        showToast('Failed to pause sequence')
      }
    } else if (action === 'activate') {
      const result = await activateSequence(id)
      if (result) {
        showToast('Sequence activated')
      } else {
        showToast('Failed to activate sequence')
      }
    } else if (action === 'duplicate') {
      const result = await duplicateSequence(id)
      if (result) {
        showToast('Sequence duplicated')
      } else {
        showToast('Failed to duplicate sequence')
      }
    }
  }

  const filtered = useMemo(() => {
    let list = transformedSequences
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.description && s.description.toLowerCase().includes(search.toLowerCase())))
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter)
    if (channelFilter !== 'all') list = list.filter(s => s.channel === channelFilter)
    if (sortBy === 'performance') list = [...list].sort((a, b) => b.conversionRate - a.conversionRate)
    return list
  }, [transformedSequences, search, statusFilter, channelFilter, sortBy])

  const stats = useMemo(() => ({
    total: transformedSequences.length,
    active: transformedSequences.filter(s => s.status === 'active').length,
    drafts: transformedSequences.filter(s => s.status === 'draft').length,
    sent: transformedSequences.reduce((acc, s) => acc + s.messagesSent, 0),
    conversion: transformedSequences.filter(s => s.enrolled > 0).length
      ? Math.round(transformedSequences.reduce((acc, s) => acc + s.conversionRate, 0) / transformedSequences.filter(s => s.enrolled > 0).length)
      : 0,
  }), [transformedSequences])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Sequences</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Send automated messages to customers over time</p>
        </div>
        <Link href="/dashboard/sequences/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold shadow-md hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 transition-all flex-shrink-0">
          <Plus size={16} /> Create Sequence
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total" value={String(stats.total)} icon={Activity} accent="var(--accent)" />
        <StatCard label="Active" value={String(stats.active)} sub="Running now" icon={Play} accent="#16A085" />
        <StatCard label="Drafts" value={String(stats.drafts)} icon={Edit2} accent="#F39C12" />
        <StatCard label="Messages Sent" value={stats.sent.toLocaleString()} icon={MessageSquare} accent="#8B3FFB" />
        <StatCard label="Avg Conversion" value={`${stats.conversion}%`} icon={TrendingUp} accent="#0E7AFE" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sequences..."
            className="w-full h-10 pl-9 pr-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-1">
          {(['all', 'active', 'paused', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value as any)}
          className="h-10 px-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
        >
          <option value="all">All Channels</option>
          {Object.entries(CH).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Sort */}
        <div className="relative">
          <button onClick={() => setShowSortMenu(v => !v)}
            className="flex items-center gap-2 h-10 px-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Filter size={14} />
            {sortBy === 'updated' ? 'Recently Updated' : sortBy === 'created' ? 'Recently Created' : 'Performance'}
            <ChevronDown size={13} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-12 w-44 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
              {[
                { k: 'updated',     l: 'Recently Updated' },
                { k: 'created',     l: 'Recently Created' },
                { k: 'performance', l: 'Performance' },
              ].map(o => (
                <button key={o.k} onClick={() => { setSortBy(o.k as any); setShowSortMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sortBy === o.k ? 'text-[var(--accent)] bg-[var(--accent-subtle)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                  }`}>
                  {o.l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-[var(--text-secondary)]">Loading sequences...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5 border border-red-200 dark:border-red-800">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Error loading sequences</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">{error}</p>
          <button onClick={() => fetchSequences()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold shadow-md hover:bg-[var(--accent-hover)] transition-all">
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={!!search || statusFilter !== 'all'} />
      ) : (
        <>
          <p className="text-xs text-[var(--text-tertiary)]">{filtered.length} sequence{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(seq => <SeqCard key={seq.id} seq={seq} onAction={handleAction} />)}
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-[var(--text-primary)] text-[var(--background)] rounded-xl shadow-lg text-sm font-medium">
          <CheckCircle size={15} /> {toast}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-subtle)] to-[var(--surface-elevated)] flex items-center justify-center mb-5 border border-[var(--border)]">
        <Activity size={32} className="text-[var(--accent)]" />
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
        {hasSearch ? 'No sequences match your filters' : 'No sequences yet'}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
        {hasSearch
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Create your first automated sequence to start engaging customers on autopilot.'}
      </p>
      {!hasSearch && (
        <Link href="/dashboard/sequences/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold shadow-md hover:bg-[var(--accent-hover)] transition-all">
          <Plus size={16} /> Create Your First Sequence
        </Link>
      )}
    </div>
  )
}