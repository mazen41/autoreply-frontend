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
import Select from '../../../components/ui/Select'
import EmptyState from '../../../components/ui/EmptyState'
import { useSequences } from '../../../hooks/useSequences'
import toast from 'react-hot-toast'
import { useLang } from '../../../lib/LangContext'

type SeqStatus = 'active' | 'paused' | 'draft' | 'archived'
type Channel = 'whatsapp' | 'telegram' | 'email'
type TargetChannel = 'whatsapp' | 'telegram' | 'email' | 'instagram' | 'facebook'

interface SequenceWithStats {
  id: number
  name: string
  description?: string | null
  channel?: 'whatsapp' | 'telegram' | 'email' | null
  targetChannels: TargetChannel[]
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
  const { isRTL } = useLang()
  const L = (en: string, ar: string) => isRTL ? ar : en
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [pendingActionId, setPendingActionId] = useState<number | null>(null)

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
      targetChannels: (Array.isArray(seq.settings?.target_channels) && seq.settings.target_channels.length > 0
        ? seq.settings.target_channels
        : seq.channel ? [seq.channel] : []) as TargetChannel[],
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
      const matchChannel = channelFilter === 'all' || seq.targetChannels.includes(channelFilter as TargetChannel)
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
    setPendingActionId(id)
    try {
      if (action === 'delete') {
      if (!confirm(L('Are you sure you want to delete this sequence?', 'هل أنت متأكد من حذف هذا التسلسل؟'))) return
      if (!await deleteSequence(id)) throw new Error('Delete failed')
      toast.success(L('Sequence deleted', 'تم حذف التسلسل'))
    } else if (action === 'pause') {
      if (!await pauseSequence(id)) throw new Error('Pause failed')
      toast.success(L('Sequence paused', 'تم إيقاف التسلسل'))
    } else if (action === 'activate') {
      if (!await activateSequence(id)) throw new Error('Activation failed')
      toast.success(L('Sequence activated', 'تم تفعيل التسلسل'))
    } else if (action === 'duplicate') {
      if (!await duplicateSequence(id)) throw new Error('Duplicate failed')
      toast.success(L('Sequence duplicated', 'تم نسخ التسلسل'))
      }
    } catch {
      toast.error(L('The sequence change could not be completed.', 'تعذر إكمال التغيير على التسلسل.'))
    } finally {
      setPendingActionId(null)
    }
  }

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8">
      <PageHeader
        title={L('Automated sequences', 'التسلسلات التلقائية')}
        description={L('Build timed, personalized follow-ups triggered by customer activity across your connected channels.', 'أنشئ رسائل متابعة مخصصة تُرسل تلقائيًا وفق نشاط العملاء عبر قنواتك المتصلة.')}
        badge={
          <Badge variant="ai" dot>
            {L('Automation', 'الأتمتة')}
          </Badge>
        }
        primaryAction={
          <Link href="/dashboard/sequences/new">
            <Button variant="primary" icon={<Plus size={14} />}>
              {L('Create sequence', 'إنشاء تسلسل')}
            </Button>
          </Link>
        }
      />

      {/* KPI Overview */}
      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchSequences()}>{L('Retry', 'إعادة المحاولة')}</Button></div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={L('Total sequences', 'إجمالي التسلسلات')}
          value={stats.total}
          subValue={`${stats.active} ${L('currently active', 'نشط حاليًا')}`}
          icon={<Layers size={18} />}
        />
        <MetricCard
          label={L('Active automations', 'الأتمتة النشطة')}
          value={stats.active}
          subValue={L('Currently running', 'تعمل حاليًا')}
          icon={<Play size={18} />}
          variant="ai"
        />
        <MetricCard
          label={L('Total enrollments', 'إجمالي المشتركين')}
          value={stats.enrolled.toLocaleString()}
          subValue={L('Across all sequences', 'عبر جميع التسلسلات')}
          icon={<MessageSquare size={18} />}
        />
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        dir={isRTL ? 'rtl' : 'ltr'}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={L('Search sequences by name or description…', 'ابحث باسم التسلسل أو وصفه…')}
        tabs={[
          { id: 'all', label: L('All sequences', 'كل التسلسلات'), count: transformedSequences.length },
          { id: 'active', label: L('Active', 'نشط'), count: transformedSequences.filter(s => s.status === 'active').length },
          { id: 'paused', label: L('Paused', 'متوقف مؤقتًا'), count: transformedSequences.filter(s => s.status === 'paused').length },
          { id: 'draft', label: L('Drafts', 'مسودات'), count: transformedSequences.filter(s => s.status === 'draft').length },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        sortOptions={[{ value: 'updated', label: L('Recently updated', 'الأحدث تحديثًا') }, { value: 'enrolled', label: L('Most enrolled', 'الأكثر اشتراكًا') }]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        actions={(
          <div className="w-40 shrink-0">
            <Select
              dir={isRTL ? 'rtl' : 'ltr'}
              ariaLabel={L('Filter by channel', 'تصفية حسب القناة')}
              value={channelFilter}
              onValueChange={setChannelFilter}
              options={[
                { value: 'all', label: L('All channels', 'كل القنوات') },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'telegram', label: 'Telegram' },
                { value: 'email', label: L('Email', 'البريد الإلكتروني') },
                { value: 'instagram', label: 'Instagram' },
                { value: 'facebook', label: 'Facebook' },
              ]}
            />
          </div>
        )}
      />

      {/* Sequence Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-xs text-text-tertiary">{L('Loading sequences…', 'جارٍ تحميل التسلسلات…')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={Activity}
            title={L('No sequences match your filters', 'لا توجد تسلسلات تطابق عوامل التصفية')}
            description={search || statusFilter !== 'all' || channelFilter !== 'all' ? L('Adjust your search or filters, or reset them to see all sequences.', 'عدّل البحث أو عوامل التصفية أو أعد ضبطها لعرض كل التسلسلات.') : L('Create a sequence to send follow-ups automatically when customers take action.', 'أنشئ تسلسلًا لإرسال المتابعات تلقائيًا عند تفاعل العملاء.')}
            primaryAction={
              !search && statusFilter === 'all' && channelFilter === 'all' ? (
                <Link href="/dashboard/sequences/new">
                  <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                    {L('Create first sequence', 'إنشاء أول تسلسل')}
                  </Button>
                </Link>
              ) : <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setChannelFilter('all') }}>{L('Clear filters', 'مسح عوامل التصفية')}</Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((seq) => {
            const channelLabels: Record<TargetChannel, string> = {
              whatsapp: 'WhatsApp',
              telegram: 'Telegram',
              email: 'Email',
              instagram: 'Instagram',
              facebook: 'Messenger',
            }

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
                          {seq.status === 'active' ? L('ACTIVE', 'نشط') : seq.status === 'paused' ? L('PAUSED', 'متوقف') : seq.status === 'draft' ? L('DRAFT', 'مسودة') : L('ARCHIVED', 'مؤرشف')}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {seq.description || L('Automated follow-up sequence.', 'تسلسل متابعة تلقائي.')}
                      </p>
                    </div>

                    {seq.targetChannels.map(target => (
                      <Badge key={target} variant={CH_CONFIG[target as Channel]?.badgeVariant || 'outline'} size="sm" className="shrink-0 capitalize">
                        {channelLabels[target] || target}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 py-4">
                  {/* Trigger row */}
                  <div className="flex items-center gap-2 text-xs bg-surface-elevated/40 p-2.5 rounded-lg border border-border/70">
                    <Zap size={14} className="text-warning shrink-0" />
                    <span className="text-text-tertiary">{L('Trigger:', 'المُشغّل:')}</span>
                    <span className="font-semibold text-text-primary truncate">{seq.trigger}</span>
                    <span className="text-text-tertiary ms-auto shrink-0 font-medium">
                      {seq.stepsCount} {L('steps', 'خطوات')}
                    </span>
                  </div>

                  {/* Only the enrollment total is provided in the sequence list API. */}
                  <div className="grid grid-cols-1 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-[10px] text-text-tertiary uppercase font-bold block mb-0.5">{L('Enrolled', 'مشترك')}</span>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{seq.enrolled.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="justify-between border-t border-border/60 bg-surface-elevated/20">
                  <span className="text-[11px] text-text-tertiary">{L('Updated', 'آخر تحديث')} {seq.updatedAt}</span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={seq.status === 'active' ? 'outline' : 'secondary'}
                      size="xs"
                      onClick={() => handleAction(seq.status === 'active' ? 'pause' : 'activate', seq.id)}
                      loading={pendingActionId === seq.id}
                      disabled={pendingActionId !== null}
                      icon={seq.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                    >
                      {seq.status === 'active' ? L('Pause', 'إيقاف مؤقت') : L('Activate', 'تفعيل')}
                    </Button>
                    <Link href={`/dashboard/sequences/${seq.id}/edit`}>
                      <Button variant="ghost" size="xs" icon={<Edit2 size={12} />}>
                        {L('Edit', 'تعديل')}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleAction('duplicate', seq.id)}
                      disabled={pendingActionId !== null}
                      icon={<Copy size={12} />}
                      title={L('Duplicate', 'نسخ')}
                      aria-label={L(`Duplicate ${seq.name}`, `نسخ ${seq.name}`)}
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleAction('delete', seq.id)}
                      disabled={pendingActionId !== null}
                      className="text-text-tertiary hover:text-error hover:bg-error/10"
                      icon={<Trash2 size={12} />}
                      title={L('Delete', 'حذف')}
                      aria-label={L(`Delete ${seq.name}`, `حذف ${seq.name}`)}
                    />
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
