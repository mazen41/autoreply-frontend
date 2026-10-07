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

export default function SequencesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')

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
      id: seq.id,
      name: seq.name,
      description: seq.description,
      channel: (seq.channel as Channel) || null,
      status: (seq.status as SeqStatus) || 'draft',
      trigger_type: seq.trigger_type || 'manual',
      trigger: seq.trigger_type ? seq.trigger_type.replace(/_/g, ' ') : 'Manual Trigger',
      enrolled: seq.total_enrollments || 0,
      completed: 0,
      conversionRate: 0,
      messagesSent: 0,
      updatedAt: seq.updated_at ? new Date(seq.updated_at).toLocaleDateString() : '—',
      stepsCount: seq.steps?.length ?? 0,
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
      if (sortBy === 'enrolled') return b.enrolled - a.enrolled
      return b.id - a.id
    })
  }, [transformedSequences, search, statusFilter, channelFilter, sortBy])

  const stats = useMemo(() => {
    const total = transformedSequences.length
    const active = transformedSequences.filter(s => s.status === 'active').length
    const enrolled = transformedSequences.reduce((sum, sequence) => sum + sequence.enrolled, 0)
    return { total, active, enrolled }
  }, [transformedSequences])

  const handleAction = async (action: string, id: number) => {
    try {
      if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this sequence?')) return
      if (!await deleteSequence(id)) throw new Error('Delete failed')
      toast.success('Sequence deleted')
    } else if (action === 'pause') {
      if (!await pauseSequence(id)) throw new Error('Pause failed')
      toast.success('Sequence paused')
    } else if (action === 'activate') {
      if (!await activateSequence(id)) throw new Error('Activation failed')
      toast.success('Sequence activated')
    } else if (action === 'duplicate') {
      if (!await duplicateSequence(id)) throw new Error('Duplicate failed')
      toast.success('Sequence duplicated')
      }
    } catch {
      toast.error('The sequence change could not be completed.')
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
      {error && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchSequences()}>Retry</Button></div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Sequences"
          value={stats.total}
          subValue={`${stats.active} currently active`}
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
          label="Total enrollments"
          value={stats.enrolled.toLocaleString()}
          subValue="Across sequences returned by the API"
          icon={<MessageSquare size={18} />}
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
        sortOptions={[{ value: 'updated', label: 'Recently Updated' }, { value: 'enrolled', label: 'Most Enrolled' }]}
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
            const ch = seq.channel ? CH_CONFIG[seq.channel] : null

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

                    {ch && <Badge variant={ch.badgeVariant} size="sm" className="shrink-0 capitalize">{ch.label}</Badge>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 py-4">
                  {/* Trigger row */}
                  <div className="flex items-center gap-2 text-xs bg-surface-elevated/40 p-2.5 rounded-lg border border-border/70">
                    <Zap size={14} className="text-warning shrink-0" />
                    <span className="text-text-tertiary">Trigger:</span>
                    <span className="font-semibold text-text-primary truncate">{seq.trigger}</span>
                    <span className="text-text-tertiary ml-auto shrink-0 font-medium">
                      {seq.stepsCount} configured steps
                    </span>
                  </div>

                  {/* Only the enrollment total is provided in the sequence list API. */}
                  <div className="grid grid-cols-1 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-0.5">Enrolled</span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{seq.enrolled.toLocaleString()}</span>
                    </div>
                  </div>
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
