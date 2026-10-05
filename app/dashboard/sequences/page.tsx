'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit2,
  Zap,
  Users,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  MoreHorizontal,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import FilterBar from '../../../components/ui/FilterBar'
import EmptyState from '../../../components/ui/EmptyState'
import { useSequences } from '../../../hooks/useSequences'
import toast from 'react-hot-toast'

type SeqStatus = 'active' | 'paused' | 'draft' | 'archived'
type Channel = 'whatsapp' | 'telegram' | 'email'

interface SequenceWithStats {
  id: number
  name: string
  description?: string | null
  channel?: 'whatsapp' | 'telegram' | 'email' | null
  status: SeqStatus
  trigger_type: string
  trigger?: string
  enrolled: number
  completed: number
  conversionRate: number
  messagesSent: number
  updatedAt?: string
  createdAt?: string
  stepsCount: number
}

const CH_CONFIG: Record<Channel, { label: string; badgeVariant: 'success' | 'ai' | 'outline' }> = {
  whatsapp: { label: 'WhatsApp', badgeVariant: 'success' },
  telegram: { label: 'Telegram', badgeVariant: 'outline' },
  email: { label: 'Email', badgeVariant: 'ai' },
}

const DEMO_SEQUENCES: SequenceWithStats[] = [
  {
    id: 1,
    name: 'New Customer Welcome & Onboarding',
    description: '3-step sequence welcoming new clients, introducing top product categories, and offering a 10% coupon.',
    channel: 'whatsapp',
    status: 'active',
    trigger_type: 'new_user',
    trigger: 'New Customer Registration',
    enrolled: 1840,
    completed: 1620,
    conversionRate: 24,
    messagesSent: 4890,
    updatedAt: '2 hours ago',
    stepsCount: 3,
  },
  {
    id: 2,
    name: 'Abandoned Cart 48h Recovery Drip',
    description: 'Triggered when checkout is started but unpaid after 2 hours. Follows up with stock alert and direct link.',
    channel: 'whatsapp',
    status: 'active',
    trigger_type: 'order_created',
    trigger: 'Checkout Initiated (Unpaid)',
    enrolled: 820,
    completed: 710,
    conversionRate: 31,
    messagesSent: 1640,
    updatedAt: 'Yesterday',
    stepsCount: 2,
  },
  {
    id: 3,
    name: 'Post-Delivery Review & Feedback Loop',
    description: 'Sends automated Google Review request 3 days after shipping status marks Delivered.',
    channel: 'telegram',
    status: 'paused',
    trigger_type: 'tag_added',
    trigger: 'Tag: Order Delivered',
    enrolled: 430,
    completed: 390,
    conversionRate: 18,
    messagesSent: 430,
    updatedAt: '3 days ago',
    stepsCount: 1,
  },
]

export default function SequencesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')

  const {
    sequences,
    loading,
    activateSequence,
    pauseSequence,
    duplicateSequence,
    deleteSequence,
  } = useSequences()

  const transformedSequences = useMemo(() => {
    if (!sequences || sequences.length === 0) return DEMO_SEQUENCES
    return sequences.map(seq => ({
      id: seq.id,
      name: seq.name,
      description: seq.description,
      channel: (seq.channel as Channel) || 'whatsapp',
      status: (seq.status as SeqStatus) || 'draft',
      trigger_type: seq.trigger_type || 'manual',
      trigger: seq.trigger_type ? seq.trigger_type.replace(/_/g, ' ') : 'Manual Trigger',
      enrolled: seq.total_enrollments || 0,
      completed: seq.active_enrollments || 0,
      conversionRate: seq.total_enrollments ? Math.round(((seq.active_enrollments || 0) / seq.total_enrollments) * 100) : 0,
      messagesSent: (seq.total_enrollments || 0) * 2,
      updatedAt: new Date(seq.updated_at).toLocaleDateString(),
      stepsCount: seq.steps?.length || 2,
    }))
  }, [sequences])

  const filtered = useMemo(() => {
    return transformedSequences.filter(seq => {
      const matchSearch =
        !search ||
        seq.name.toLowerCase().includes(search.toLowerCase()) ||
        (seq.description && seq.description.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'all' || seq.status === statusFilter
      const matchChannel = channelFilter === 'all' || seq.channel === channelFilter
      return matchSearch && matchStatus && matchChannel
    }).sort((a, b) => {
      if (sortBy === 'performance') return b.conversionRate - a.conversionRate
      if (sortBy === 'enrolled') return b.enrolled - a.enrolled
      return b.id - a.id
    })
  }, [transformedSequences, search, statusFilter, channelFilter, sortBy])

  const stats = useMemo(() => {
    const total = transformedSequences.length
    const active = transformedSequences.filter(s => s.status === 'active').length
    const sent = transformedSequences.reduce((acc, s) => acc + s.messagesSent, 0)
    const avgConversion = total > 0
      ? Math.round(transformedSequences.reduce((acc, s) => acc + s.conversionRate, 0) / total)
      : 0
    return { total, active, sent, avgConversion }
  }, [transformedSequences])

  const handleAction = async (action: string, id: number) => {
    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this sequence?')) return
      await deleteSequence(id)
      toast.success('Sequence deleted')
    } else if (action === 'pause') {
      await pauseSequence(id)
      toast.success('Sequence paused')
    } else if (action === 'activate') {
      await activateSequence(id)
      toast.success('Sequence activated')
    } else if (action === 'duplicate') {
      await duplicateSequence(id)
      toast.success('Sequence duplicated')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Sequences"
        description="Deliver timely, personalized message drip cadences across WhatsApp and social channels to nurture leads and recover abandoned carts."
        badge={
          <Badge variant="ai" dot>
            Marketing Automation
          </Badge>
        }
        primaryAction={
          <Link href="/dashboard/sequences/new">
            <Button variant="primary" icon={<Plus size={14} />}>
              Create Sequence
            </Button>
          </Link>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sequences"
          value={stats.total}
          subValue={`${stats.active} live in production`}
          icon={<Layers size={18} />}
        />
        <MetricCard
          label="Active Automations"
          value={stats.active}
          subValue="Actively sending drips"
          icon={<Play size={18} />}
          variant="ai"
        />
        <MetricCard
          label="Dispatched Messages"
          value={stats.sent.toLocaleString()}
          subValue="Across customer journeys"
          icon={<MessageSquare size={18} />}
        />
        <MetricCard
          label="Avg Conversion Rate"
          value={`${stats.avgConversion}%`}
          trend={{ value: 4.8, isPositive: true }}
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sequences by title or trigger..."
        tabs={[
          { id: 'all', label: 'All Sequences', count: transformedSequences.length },
          { id: 'active', label: 'Active', count: transformedSequences.filter(s => s.status === 'active').length },
          { id: 'paused', label: 'Paused', count: transformedSequences.filter(s => s.status === 'paused').length },
          { id: 'draft', label: 'Drafts', count: transformedSequences.filter(s => s.status === 'draft').length },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        sortOptions={[
          { value: 'updated', label: 'Recently Updated' },
          { value: 'performance', label: 'Highest Conversion' },
          { value: 'enrolled', label: 'Most Enrolled' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      />

      {/* Sequence Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-xs text-text-tertiary">Loading automated sequences...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={Activity}
            title="No sequences match your criteria"
            description={search ? 'Try broadening your search keywords or clearing active filters.' : 'Build multi-step automated message workflows triggered by customer actions.'}
            primaryAction={
              !search ? (
                <Link href="/dashboard/sequences/new">
                  <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                    Create First Sequence
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((seq) => {
            const ch = CH_CONFIG[seq.channel || 'whatsapp'] || CH_CONFIG.whatsapp
            const completionPct = seq.enrolled > 0 ? Math.round((seq.completed / seq.enrolled) * 100) : 0

            return (
              <Card key={seq.id} variant="interactive" className="flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/sequences/${seq.id}`}
                          className="font-bold text-sm text-text-primary hover:text-brand transition-colors truncate"
                        >
                          {seq.name}
                        </Link>
                        <Badge
                          variant={seq.status === 'active' ? 'success' : seq.status === 'paused' ? 'warning' : 'outline'}
                          dot
                          size="sm"
                        >
                          {seq.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {seq.description || 'Automated drip sequence.'}
                      </p>
                    </div>

                    <Badge variant={ch.badgeVariant} size="sm" className="shrink-0 capitalize">
                      {ch.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 py-4">
                  {/* Trigger row */}
                  <div className="flex items-center gap-2 text-xs bg-surface-elevated/40 p-2.5 rounded-lg border border-border/70">
                    <Zap size={14} className="text-warning shrink-0" />
                    <span className="text-text-tertiary">Trigger:</span>
                    <span className="font-semibold text-text-primary truncate">{seq.trigger}</span>
                    <span className="text-text-tertiary ml-auto shrink-0 font-medium">
                      {seq.stepsCount} steps
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-0.5">Enrolled</span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{seq.enrolled.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-0.5">Finished</span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{seq.completed.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-0.5">Sent</span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{seq.messagesSent.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-success/5 border border-success/15">
                      <span className="text-[10px] text-success uppercase font-bold block mb-0.5">Conv.</span>
                      <span className="text-xs font-bold text-success tabular-nums">{seq.conversionRate}%</span>
                    </div>
                  </div>

                  {/* Completion bar */}
                  {seq.enrolled > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-text-tertiary">
                        <span>Cohort Completion</span>
                        <span className="font-semibold text-text-primary">{completionPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand to-brand transition-all duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="justify-between border-t border-border/60 bg-surface-elevated/20">
                  <span className="text-[11px] text-text-tertiary">Updated {seq.updatedAt}</span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={seq.status === 'active' ? 'outline' : 'secondary'}
                      size="xs"
                      onClick={() => handleAction(seq.status === 'active' ? 'pause' : 'activate', seq.id)}
                      icon={seq.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                    >
                      {seq.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                    <Link href={`/dashboard/sequences/${seq.id}/edit`}>
                      <Button variant="ghost" size="xs" icon={<Edit2 size={12} />}>
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleAction('duplicate', seq.id)}
                      icon={<Copy size={12} />}
                      title="Duplicate"
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleAction('delete', seq.id)}
                      className="text-text-tertiary hover:text-error hover:bg-error/10"
                      icon={<Trash2 size={12} />}
                      title="Delete"
                    />
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}