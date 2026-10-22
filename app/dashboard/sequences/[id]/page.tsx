'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Pause, Copy, MoreHorizontal, Edit2,
  Users, CheckCircle, MessageSquare, AlertCircle, Clock, Zap,
  ChevronDown, BarChart2, ArrowUpRight, Trash2, RefreshCw, GitBranch
} from 'lucide-react'
import { useSequences } from '../../../../hooks/useSequences'
import { useLang } from '../../../../lib/LangContext'

const STATUS_CONFIG = {
  active: { label: 'Active',  color: '#16A085', bg: 'rgba(22,160,133,0.1)', dot: '#16A085' },
  paused: { label: 'Paused',  color: '#F39C12', bg: 'rgba(243,156,18,0.1)', dot: '#F39C12' },
  draft:  { label: 'Draft',   color: '#6A6A78', bg: 'rgba(106,106,120,0.1)', dot: '#A9AAB8' },
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
// ─── Step row ─────────────────────────────────────────────────────────────────
interface StepData {
  step_type: string
  message?: string
  delay_hours?: number
  delay_unit?: string
  condition_config?: any
  action_config?: any
}

function StepRow({ step, index }: {
  step: StepData; index: number
}) {
  const colors: Record<string, { border: string; bg: string; icon: string }> = {
    message:   { border: 'border-info dark:border-info/30',    bg: 'bg-info/50 dark:bg-info/10',   icon: 'text-info' },
    delay:     { border: 'border-brand dark:border-brand/30', bg: 'bg-brand/50 dark:bg-brand/10', icon: 'text-brand' },
    condition: { border: 'border-success dark:border-success/30', bg: 'bg-success/50 dark:bg-success/10', icon: 'text-success' },
    action:    { border: 'border-warning dark:border-warning/30', bg: 'bg-warning/50 dark:bg-warning/10', icon: 'text-warning' },
  }
  const StepIcon = step.step_type === 'message' ? MessageSquare : step.step_type === 'delay' ? Clock : step.step_type === 'condition' ? GitBranch : Zap
  const c = colors[step.step_type] || colors.message

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${c.border} ${c.bg} relative`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon} bg-white dark:bg-black/20 border border-current/10`}>
        <StepIcon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {step.step_type === 'message' ? step.message?.substring(0, 50) + '...' : 
           step.step_type === 'delay' ? `Wait ${step.delay_hours} ${step.delay_unit}` :
           step.step_type}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] capitalize">{step.step_type}</p>
      </div>
    </div>
  )
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color: accent || 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SequenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isRTL } = useLang()
  const { fetchSequence, activateSequence, pauseSequence, deleteSequence, duplicateSequence, getSequenceAnalytics, getSequenceEnrollments } = useSequences()
  
  const [sequence, setSequence] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('draft')
  const [actionError, setActionError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'status' | 'duplicate' | 'delete' | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'contacts'>('overview')
  const [analytics, setAnalytics] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  
  const sequenceId = params.id ? parseInt(params.id as string) : 0
  
  const loadSequence = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchSequence(sequenceId)
      setSequence(data)
      if (data) {
        setStatus(data.status || 'draft')
        const [analyticsResult, enrollmentResult] = await Promise.allSettled([
          getSequenceAnalytics(sequenceId),
          getSequenceEnrollments(sequenceId),
        ])
        setAnalytics(analyticsResult.status === 'fulfilled' ? analyticsResult.value : null)
        setEnrollments(enrollmentResult.status === 'fulfilled' ? enrollmentResult.value || [] : [])
        if (analyticsResult.status === 'rejected' || enrollmentResult.status === 'rejected') {
          setLoadError('Some sequence activity details could not be loaded. Retry to refresh them.')
        }
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load this sequence. Please try again.')
      setSequence(null)
    } finally {
      setLoading(false)
    }
  }, [fetchSequence, getSequenceAnalytics, getSequenceEnrollments, sequenceId])

  useEffect(() => {
    if (sequenceId > 0) void loadSequence()
    else setLoading(false)
  }, [loadSequence, sequenceId])
  
  const handleStatusToggle = async () => {
    setActionError(null)
    setBusyAction('status')
    try {
      if (status === 'active') {
        const paused = await pauseSequence(sequenceId)
        if (paused) {
          setStatus('paused')
          setSequence(paused)
        } else throw new Error('Could not pause this sequence. Please try again.')
      } else {
        const activated = await activateSequence(sequenceId)
        if (activated) {
          setStatus('active')
          setSequence(activated)
        } else throw new Error('Could not activate this sequence. Please check its setup and try again.')
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update the sequence status.')
    } finally {
      setBusyAction(null)
    }
  }
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      setBusyAction('delete')
      setActionError(null)
      try {
        const deleted = await deleteSequence(sequenceId)
        if (deleted) router.push('/dashboard/sequences')
        else throw new Error('Could not delete this sequence. Please try again.')
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Could not delete this sequence.')
      } finally {
        setBusyAction(null)
      }
    }
  }
  
  const st = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div role="status" className="text-gray-500">Loading sequence...</div>
      </div>
    )
  }
  
  if (!sequence) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
        <AlertCircle className="text-error" size={30} />
        <div>
          <h1 className="font-semibold text-[var(--text-primary)]">{loadError ? 'Could not load sequence' : 'Sequence not found'}</h1>
          <p role={loadError ? 'alert' : undefined} className="mt-1 text-sm text-[var(--text-secondary)]">{loadError || 'This sequence may have been deleted or you may not have access to it.'}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {loadError && <button onClick={() => void loadSequence()} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">Try again</button>}
          <Link href="/dashboard/sequences" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">Back to sequences</Link>
        </div>
      </div>
    )
  }
  
  const steps = sequence.steps || []
  const stats = analytics || {
    total_enrollments: sequence.total_enrollments || 0,
    active_enrollments: sequence.active_enrollments || 0,
    completed_enrollments: null,
    stopped_enrollments: null,
    failed_enrollments: null,
    conversion_rate: null,
    messages_sent: null,
    total_steps: steps?.length || 0,
  }

  const handleDuplicate = async () => {
    setBusyAction('duplicate')
    setActionError(null)
    try {
      const duplicated = await duplicateSequence(sequenceId)
      if (duplicated) router.push(`/dashboard/sequences/${duplicated.id}`)
      else throw new Error('Could not duplicate this sequence. Please try again.')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not duplicate this sequence.')
    } finally {
      setBusyAction(null)
    }
  }

  const exportEnrollments = () => {
    const rows = [['Contact', 'Sending account', 'Status', 'Reason', 'Current step', 'Started at'], ...enrollments.map((item) => [
      item.conversation?.sender_name || item.conversation?.sender_id || '',
      item.conversation?.channel?.page_name || item.conversation?.channel?.page_id || item.conversation?.channel?.type || '',
      item.status || '',
      item.stop_reason || item.failed_reason || '',
      String(item.current_step ?? ''),
      item.started_at || '',
    ])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `sequence-${sequenceId}-enrollments.csv`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/sequences" aria-label="Back to sequences"
            className="mt-1 p-2 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors flex-shrink-0">
            <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black text-[var(--text-primary)]">{sequence.name}</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: st.bg, color: st.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                {st.label}
              </span>
              {(Array.isArray(sequence.settings?.target_channels) && sequence.settings.target_channels.length > 0
                ? sequence.settings.target_channels
                : [sequence.channel || 'email']).map((target: string) => (
                <span key={target} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                  ● {target === 'facebook' || target === 'messenger' ? 'Messenger' : target.charAt(0).toUpperCase() + target.slice(1)}
                </span>
              ))}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{sequence.description}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1"><Zap size={11} className="text-warning" /> {sequence.trigger_type}</span>
              <span>·</span>
              <span>{steps.length} steps</span>
              <span>·</span>
              <span>Updated {new Date(sequence.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void handleStatusToggle()}
            disabled={!!busyAction}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              status === 'active'
                ? 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20'
                : 'border-success/30 bg-success/10 text-success hover:bg-success/20'
            }`}>
            {status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
          </button>
          <Link href={`/dashboard/sequences/${params.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors">
            <Edit2 size={14} /> Edit
          </Link>
          <div className="relative">
            <button onClick={() => setMoreOpen(v => !v)} aria-label="More sequence actions" aria-expanded={moreOpen} disabled={!!busyAction}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors">
              <MoreHorizontal size={16} />
            </button>
            {moreOpen && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-11 z-20 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg`}>
                <button onClick={() => void handleDuplicate()} disabled={!!busyAction} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50">
                  <Copy size={13} /> Duplicate
                </button>
                <div className="border-t border-[var(--divider)]" />
                <button onClick={() => void handleDelete()} disabled={!!busyAction} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-error transition-colors hover:bg-error/10 disabled:opacity-50">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(actionError || loadError) && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{actionError || loadError}</div>}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {([['overview', 'Overview'], ['analytics', 'Analytics'], ['contacts', 'Contacts']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k)} aria-pressed={activeTab === k}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === k ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Enrolled" value={Number(stats.total_enrollments || 0).toLocaleString()} sub="Total contacts" />
            <StatTile label="Active now" value={Number(stats.active_enrollments || 0).toLocaleString()} sub="In progress" accent="var(--accent)" />
            <StatTile label="Completed" value={stats.completed_enrollments == null ? '—' : Number(stats.completed_enrollments).toLocaleString()} sub="Finished all steps" accent="#16A085" />
            <StatTile label="Conversion" value={stats.conversion_rate == null ? '—' : `${stats.conversion_rate}%`} sub="Goal achieved" accent="#8B3FFB" />
            <StatTile label="Messages sent" value={stats.messages_sent == null ? '—' : Number(stats.messages_sent).toLocaleString()} />
            <StatTile label="Stopped" value={stats.stopped_enrollments == null ? '—' : Number(stats.stopped_enrollments).toLocaleString()} />
            <StatTile label="Failed" value={stats.failed_enrollments == null ? '—' : Number(stats.failed_enrollments).toLocaleString()} />
          </div>

          {/* Steps timeline */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Sequence Steps</h3>
              <span className="text-xs text-[var(--text-tertiary)]">{steps.length} steps total</span>
            </div>
            <div className="p-4 space-y-2">
              {steps.map((step: StepData, i: number) => (
                <React.Fragment key={i}>
                  <StepRow
                    step={step} index={i}
                  />
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-[var(--border)]" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-surface-elevated p-6 text-sm text-text-muted">The sequence analytics API provides aggregate counts only. Daily enrollment and per-step reply charts are not available.</div>
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Enrollment breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'In Progress', value: Number(stats.active_enrollments || 0), color: 'var(--accent)' },
              { label: 'Completed', value: stats.completed_enrollments == null ? '—' : Number(stats.completed_enrollments), color: '#16A085' },
              { label: 'Stopped', value: stats.stopped_enrollments == null ? '—' : Number(stats.stopped_enrollments), color: '#FF4757' },
            ].map(c => (
              <div key={c.label} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 text-center">
                <p className="text-2xl font-black" style={{ color: c.color }}>{c.value.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Enrollment outcomes and delivery context */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Enrolled Contacts</h3>
              <button onClick={exportEnrollments} disabled={enrollments.length === 0} className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline disabled:opacity-40">
                Export CSV <ArrowUpRight size={12} />
              </button>
            </div>
            {enrollments.length === 0 ? <div className="p-5 text-center text-[var(--text-tertiary)]">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No enrollment records found.</p>
            </div> : <div className="divide-y divide-border">{enrollments.map((item) => {
              const reason = item.stop_reason || item.failed_reason
              const sender = item.conversation?.channel
              return <div key={item.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[var(--text-primary)]">{item.conversation?.sender_name || item.conversation?.sender_id || 'Unknown contact'}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Sending account: {sender?.page_name || sender?.page_id || sender?.type || 'Unavailable'}</p>
                  {reason && <p className="text-xs text-warning">Reason: {String(reason).replaceAll('_', ' ')}</p>}
                </div>
                <span className="shrink-0 text-text-muted">{item.status}</span>
              </div>
            })}</div>}
          </div>
        </div>
      )}
    </main>
  )
}
