'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Pause, Copy, MoreHorizontal, Edit2, TrendingUp,
  Users, CheckCircle, MessageSquare, AlertCircle, Clock, Zap,
  ChevronDown, BarChart2, ArrowUpRight, Trash2, RefreshCw
} from 'lucide-react'
import { useSequences } from '../../../../hooks/useSequences'

const STATUS_CONFIG = {
  active: { label: 'Active',  color: '#16A085', bg: 'rgba(22,160,133,0.1)', dot: '#16A085' },
  paused: { label: 'Paused',  color: '#F39C12', bg: 'rgba(243,156,18,0.1)', dot: '#F39C12' },
  draft:  { label: 'Draft',   color: '#6A6A78', bg: 'rgba(106,106,120,0.1)', dot: '#A9AAB8' },
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
const ENROLL_DATA = [12, 18, 24, 15, 31, 28, 40, 35, 29, 45, 52, 48, 60, 42]

function TinyBarChart() {
  const max = Math.max(...ENROLL_DATA)
  return (
    <div className="flex items-end gap-0.5 h-16">
      {ENROLL_DATA.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all hover:opacity-80"
          style={{ height: `${(v / max) * 100}%`, background: 'var(--accent)', opacity: 0.7 + (i / ENROLL_DATA.length) * 0.3 }} />
      ))}
    </div>
  )
}

// ─── Step row ─────────────────────────────────────────────────────────────────
function StepRow({ step, index, isHighestDropoff }: {
  step: typeof MOCK_SEQUENCE.steps[0]; index: number; isHighestDropoff: boolean
}) {
  const colors: Record<string, { border: string; bg: string; icon: string }> = {
    message:   { border: 'border-blue-100 dark:border-blue-900/30',    bg: 'bg-blue-50/50 dark:bg-blue-900/10',   icon: 'text-blue-500' },
    delay:     { border: 'border-purple-100 dark:border-purple-900/30', bg: 'bg-purple-50/50 dark:bg-purple-900/10', icon: 'text-purple-500' },
    condition: { border: 'border-emerald-100 dark:border-emerald-900/30', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', icon: 'text-emerald-600' },
  }
  const StepIcon = step.type === 'message' ? MessageSquare : step.type === 'delay' ? Clock : AlertCircle
  const c = colors[step.type]

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${c.border} ${c.bg} ${isHighestDropoff ? 'ring-2 ring-red-300 dark:ring-red-700' : ''} relative`}>
      {isHighestDropoff && (
        <span className="absolute -top-2 right-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
          Highest Drop-off
        </span>
      )}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon} bg-white dark:bg-black/20 border border-current/10`}>
        <StepIcon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{step.label}</p>
        <p className="text-xs text-[var(--text-tertiary)] capitalize">{step.type}</p>
      </div>
      {step.sent !== null && (
        <div className="flex gap-6 text-right flex-shrink-0">
          <div>
            <p className="text-sm font-black text-[var(--text-primary)]">{step.sent?.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Sent</p>
          </div>
          <div>
            <p className="text-sm font-black text-emerald-600">
              {step.delivered ? Math.round((step.delivered / step.sent!) * 100) : 0}%
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Delivered</p>
          </div>
          <div>
            <p className="text-sm font-black text-[var(--accent)]">
              {step.replied ? Math.round((step.replied / step.sent!) * 100) : 0}%
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Reply rate</p>
          </div>
        </div>
      )}
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
  const { fetchSequence, activateSequence, pauseSequence, deleteSequence } = useSequences()
  
  const [sequence, setSequence] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('draft')
  const [moreOpen, setMoreOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'contacts'>('overview')
  
  const sequenceId = params.id ? parseInt(params.id as string) : 0
  
  useEffect(() => {
    if (sequenceId) {
      loadSequence()
    }
  }, [sequenceId])
  
  const loadSequence = async () => {
    setLoading(true)
    const data = await fetchSequence(sequenceId)
    if (data) {
      setSequence(data)
      setStatus(data.status || 'draft')
    }
    setLoading(false)
  }
  
  const handleStatusToggle = async () => {
    if (status === 'active') {
      const paused = await pauseSequence(sequenceId)
      if (paused) {
        setStatus('paused')
        setSequence(paused)
      }
    } else {
      const activated = await activateSequence(sequenceId)
      if (activated) {
        setStatus('active')
        setSequence(activated)
      }
    }
  }
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      const deleted = await deleteSequence(sequenceId)
      if (deleted) {
        router.push('/dashboard/sequences')
      }
    }
  }
  
  const st = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading sequence...</div>
      </div>
    )
  }
  
  if (!sequence) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Sequence not found</div>
      </div>
    )
  }
  
  const steps = sequence.steps || []
  const stats = {
    enrolled: sequence.total_enrollments || 0,
    active: sequence.active_enrollments || 0,
    completed: 0, // Would need from analytics
    dropped: 0,
    messagesSent: 0, // Would need from analytics
    deliveryRate: 0,
    replyRate: 0,
    conversionRate: 0,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/sequences"
            className="mt-1 p-2 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black text-[var(--text-primary)]">{sequence.name}</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: st.bg, color: st.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                {st.label}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                {sequence.channel === 'whatsapp' ? '● WhatsApp' : sequence.channel === 'telegram' ? '● Telegram' : '● Email'}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{sequence.description}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1"><Zap size={11} className="text-amber-500" /> {sequence.trigger_type}</span>
              <span>·</span>
              <span>{steps.length} steps</span>
              <span>·</span>
              <span>Updated {new Date(sequence.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setStatus(s => s === 'active' ? 'paused' : 'active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              status === 'active'
                ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
            }`}>
            {status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
          </button>
          <Link href={`/dashboard/sequences/${params.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors">
            <Edit2 size={14} /> Edit
          </Link>
          <div className="relative">
            <button onClick={() => setMoreOpen(v => !v)}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors">
              <MoreHorizontal size={16} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-11 w-40 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-lg z-20 overflow-hidden">
                <button className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">
                  <Copy size={13} /> Duplicate
                </button>
                <button className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">
                  <RefreshCw size={13} /> Send Test
                </button>
                <div className="border-t border-[var(--divider)]" />
                <button className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {([['overview', 'Overview'], ['analytics', 'Analytics'], ['contacts', 'Contacts']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k)}
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
            <StatTile label="Enrolled"    value={seq.stats.enrolled.toLocaleString()} sub="Total contacts" />
            <StatTile label="Active Now"  value={seq.stats.active.toLocaleString()} sub="In progress" accent="var(--accent)" />
            <StatTile label="Completed"   value={seq.stats.completed.toLocaleString()} sub="Finished all steps" accent="#16A085" />
            <StatTile label="Conversion"  value={`${seq.stats.conversionRate}%`} sub="Goal achieved" accent="#8B3FFB" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Msgs Sent"   value={seq.stats.messagesSent.toLocaleString()} />
            <StatTile label="Delivery"    value={`${seq.stats.deliveryRate}%`} accent="#16A085" />
            <StatTile label="Reply Rate"  value={`${seq.stats.replyRate}%`} accent="var(--accent)" />
            <StatTile label="Dropped"     value={seq.stats.dropped.toLocaleString()} />
          </div>

          {/* Steps timeline */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Sequence Steps</h3>
              <span className="text-xs text-[var(--text-tertiary)]">{seq.steps.length} steps total</span>
            </div>
            <div className="p-4 space-y-2">
              {seq.steps.map((step, i) => (
                <React.Fragment key={i}>
                  <StepRow
                    step={step} index={i}
                    isHighestDropoff={step.type === 'message' && i === seq.steps.findIndex(s => s.type === 'message' && s.sent === 891)}
                  />
                  {i < seq.steps.length - 1 && (
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
          {/* Enrollment chart */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Enrollments Over Time</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last 14 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <ArrowUpRight size={14} /> +18% vs last period
              </div>
            </div>
            <TinyBarChart />
            <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-2">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Per-step drop-off */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Step-by-Step Drop-off</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">See where contacts leave the sequence</p>
            <div className="space-y-3">
              {seq.steps.filter(s => s.type === 'message').map((step, i) => {
                const rate = step.sent && step.replied ? Math.round((step.replied / step.sent) * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">{step.label}</span>
                      <span className="font-bold text-[var(--text-primary)]">{rate}% replied</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${rate}%`,
                          background: rate < 20 ? '#FF4757' : rate < 30 ? '#F39C12' : '#16A085'
                        }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Completion Rate', value: `${Math.round((seq.stats.completed / seq.stats.enrolled) * 100)}%`, desc: 'Contacts who finish all steps', color: '#16A085' },
              { label: 'Avg Reply Rate',  value: `${seq.stats.replyRate}%`, desc: 'Across all message steps', color: 'var(--accent)' },
              { label: 'Conversion',      value: `${seq.stats.conversionRate}%`, desc: 'Achieved the sequence goal', color: '#8B3FFB' },
            ].map(m => (
              <div key={m.label} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 text-center">
                <p className="text-2xl font-black mb-1" style={{ color: m.color }}>{m.value}</p>
                <p className="text-xs font-bold text-[var(--text-primary)] mb-0.5">{m.label}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Enrollment breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'In Progress',  value: seq.stats.active,    color: 'var(--accent)' },
              { label: 'Completed',    value: seq.stats.completed,  color: '#16A085' },
              { label: 'Dropped',      value: seq.stats.dropped,    color: '#FF4757' },
            ].map(c => (
              <div key={c.label} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 text-center">
                <p className="text-2xl font-black" style={{ color: c.color }}>{c.value.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Placeholder table */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Enrolled Contacts</h3>
              <button className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline">
                Export CSV <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="p-5 text-center text-[var(--text-tertiary)]">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Contact enrollment data loads from your CRM.</p>
              <p className="text-xs mt-1 opacity-60">Connect your CRM to see detailed contact progress here.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
