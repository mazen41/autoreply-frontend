'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, BookOpen, Bot, CheckCircle2, Pause, Pencil, Play, Plus, Radio, RefreshCw, Search, Store, Trash2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import Select from '../../../components/ui/Select'
import BotWizardModal from '../../../components/bots/BotWizardModal'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

type BotRecord = {
  id: number
  name: string
  status?: string
  effective_ai_enabled?: boolean
  effective_ai_channels?: number
  ai_pause_reason?: string | null
  ai_provider?: string
  ai_model?: string
  ai_instructions?: string
  reply_style?: string
  ai_confidence_threshold?: number
  channels?: Array<{ id: number; type: string; page_name?: string; page_id?: string; pivot?: { is_primary?: boolean } }>
  ecommerce_connections?: Array<{ id: number; type: string; page_name?: string; page_id?: string; status?: string; pivot?: { is_default?: boolean } }>
  ecommerce_channel_id?: number | null
  knowledge_assignments?: Array<{ id: number; business_knowledge_file_id?: number; knowledge_file?: { file_name?: string } }>
  knowledgeAssignments?: Array<{ id: number; business_knowledge_file_id?: number; knowledge_file?: { file_name?: string } }>
}

type BotStatusFilter = 'all' | 'active' | 'inactive' | 'draft'

export default function BotsPage() {
  const { isRTL } = useLang()
  const [bots, setBots] = useState<BotRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [busyBotId, setBusyBotId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BotStatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotRecord | null>(null)

  const fetchBots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error(isRTL ? 'انتهت جلستك. سجّل الدخول مجدداً.' : 'Your session expired. Sign in again to load bots.')
      const response = await fetch(`${API}/api/bots`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || `${isRTL ? 'تعذر تحميل الوكلاء' : 'Could not load bots'} (HTTP ${response.status}).`)
      setBots(Array.isArray(data.bots) ? data.bots : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isRTL ? 'تعذر تحميل الوكلاء.' : 'Could not load bots.'))
    } finally {
      setLoading(false)
    }
  }, [isRTL])

  useEffect(() => { void fetchBots() }, [fetchBots])

  function openCreate() {
    setEditingBot(null)
    setModalOpen(true)
  }

  function openEdit(bot: BotRecord) {
    setEditingBot(bot)
    setModalOpen(true)
  }

  const changeStatus = async (bot: BotRecord, status: 'active' | 'inactive') => {
    setBusyBotId(bot.id)
    setError(null)
    setNotice('')
    try {
      const response = await fetch(`${API}/api/bots/${bot.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...getBusinessHeaders() },
        body: JSON.stringify({ status }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || (isRTL ? 'تعذر تحديث حالة الوكيل.' : 'Could not update bot status.'))
      setBots(current => current.map(item => item.id === bot.id ? { ...item, status } : item))
      setNotice(status === 'active'
        ? (isRTL ? `تم تفعيل ${bot.name}.` : `${bot.name} activated.`)
        : (isRTL ? `تم إيقاف ${bot.name}.` : `${bot.name} paused.`))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isRTL ? 'تعذر تحديث حالة الوكيل.' : 'Could not update bot status.'))
    } finally {
      setBusyBotId(null)
    }
  }

  const deleteBot = async (bot: BotRecord) => {
    const confirmed = window.confirm(isRTL
      ? `هل تريد حذف الوكيل "${bot.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Delete "${bot.name}"? This action cannot be undone.`)
    if (!confirmed) return

    setBusyBotId(bot.id)
    setError(null)
    setNotice('')
    try {
      const response = await fetch(`${API}/api/bots/${bot.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || (isRTL ? 'تعذر حذف الوكيل.' : 'Could not delete bot.'))
      setBots(current => current.filter(item => item.id !== bot.id))
      setNotice(isRTL ? `تم حذف ${bot.name}.` : `${bot.name} deleted.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isRTL ? 'تعذر حذف الوكيل.' : 'Could not delete bot.'))
    } finally {
      setBusyBotId(null)
    }
  }

  const activeCount = bots.filter((bot) => bot.status === 'active').length
  const readyCount = bots.filter((bot) => bot.effective_ai_enabled).length
  const filteredBots = useMemo(() => bots.filter(bot => {
    const matchesQuery = !query.trim() || [bot.name, bot.ai_provider, bot.ai_model]
      .some(value => value?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    return matchesQuery && (statusFilter === 'all' || bot.status === statusFilter)
  }), [bots, query, statusFilter])

  return (
    <main className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isRTL ? 'الوكلاء الذكيون' : 'AI Bots & Agents'}
        description={isRTL
          ? 'أنشئ الوكلاء، وعيّن قنوات التواصل والمتاجر ومصادر المعرفة التي يمكنهم استخدامها.'
          : 'Create agents and configure the channels, stores, and knowledge sources they can use.'}
        breadcrumbs={[{ label: 'NazBiz', href: '/dashboard' }, { label: isRTL ? 'الوكلاء' : 'AI Bots' }]}
        primaryAction={<Button icon={<Plus size={16} />} onClick={openCreate}>{isRTL ? 'إنشاء وكيل' : 'Create agent'}</Button>}
        secondaryActions={<Button variant="secondary" size="sm" onClick={() => void fetchBots()} loading={loading} icon={<RefreshCw size={14} />}>{isRTL ? 'تحديث' : 'Refresh'}</Button>}
      />

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><Button variant="outline" size="sm" onClick={() => void fetchBots()}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button></div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success"><CheckCircle2 size={16} />{notice}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={isRTL ? 'ملخص الوكلاء' : 'Agent summary'}>
        {[
          { label: isRTL ? 'إجمالي الوكلاء' : 'Total agents', value: bots.length, icon: <Bot size={19} />, tone: 'text-brand bg-brand/10 border-brand/20' },
          { label: isRTL ? 'نشط' : 'Active', value: activeCount, icon: <Radio size={19} />, tone: 'text-success bg-success/10 border-success/20' },
          { label: isRTL ? 'الردود جاهزة' : 'Reply ready', value: readyCount, icon: <CheckCircle2 size={19} />, tone: 'text-success bg-success/10 border-success/20' },
          { label: isRTL ? 'متوقف أو مسودة' : 'Paused or draft', value: bots.length - activeCount, icon: <Pause size={19} />, tone: 'text-warning bg-warning/10 border-warning/20' },
        ].map(metric => <Card key={metric.label} className="border-border bg-surface-card"><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="text-xs font-medium text-text-secondary">{metric.label}</p><p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{loading ? '—' : metric.value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${metric.tone}`}>{metric.icon}</span></CardContent></Card>)}
      </section>

      <section className="rounded-2xl border border-border bg-surface-card p-4 md:p-5" aria-label={isRTL ? 'تصفية الوكلاء' : 'Filter agents'}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="relative min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">{isRTL ? 'بحث' : 'Search agents'}</span>
            <Search size={15} className="pointer-events-none absolute top-[2.35rem] -translate-y-1/2 text-text-tertiary ltr:left-3 rtl:right-3" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder={isRTL ? 'اسم الوكيل أو مزود الذكاء الاصطناعي' : 'Agent name or AI provider'} className="h-10 w-full rounded-xl border border-border bg-surface-elevated/50 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9" />
          </label>
          <div className="w-full md:w-56">
            <Select label={isRTL ? 'الحالة' : 'Status'} dir={isRTL ? 'rtl' : 'ltr'} value={statusFilter} onChange={event => setStatusFilter(event.target.value as BotStatusFilter)} options={[
              { value: 'all', label: isRTL ? 'كل الحالات' : 'All statuses' },
              { value: 'active', label: isRTL ? 'نشط' : 'Active' },
              { value: 'inactive', label: isRTL ? 'متوقف' : 'Paused' },
              { value: 'draft', label: isRTL ? 'مسودة' : 'Draft' },
            ]} />
          </div>
        </div>
      </section>

      {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status">{[0, 1, 2].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-surface-card" />)}</div> : filteredBots.length === 0 ? (
        <Card className="py-10"><EmptyState icon={Bot} title={bots.length === 0 ? (isRTL ? 'لا يوجد وكلاء بعد' : 'No agents yet') : (isRTL ? 'لا توجد نتائج مطابقة' : 'No matching agents')} description={bots.length === 0 ? (isRTL ? 'أنشئ أول وكيل وحدد قنواته ومتاجره ومصادر المعرفة.' : 'Create your first agent and configure its channels, stores, and knowledge sources.') : (isRTL ? 'جرّب تغيير البحث أو الحالة.' : 'Try changing the search or status filter.')} primaryAction={bots.length === 0 ? <Button icon={<Plus size={14} />} size="sm" onClick={openCreate}>{isRTL ? 'إنشاء وكيل' : 'Create agent'}</Button> : undefined} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBots.map(bot => {
            const assignments = bot.knowledge_assignments || bot.knowledgeAssignments || []
            const commerce = bot.ecommerce_connections || []
            const active = bot.status === 'active'
            const ready = Boolean(bot.effective_ai_enabled)
            const statusVariant = active ? 'success' : bot.status === 'draft' ? 'neutral' : 'warning'
            const pauseReason = bot.ai_pause_reason === 'agent_inactive'
              ? (isRTL ? 'الوكيل متوقف' : 'Agent paused')
              : bot.ai_pause_reason === 'no_active_agent'
                ? (isRTL ? 'لا يوجد وكيل نشط على القناة' : 'No active agent on channel')
                : bot.ai_pause_reason === 'multiple_active_agents_without_primary'
                  ? (isRTL ? 'اختر وكيلاً أساسياً للقناة' : 'Choose a primary agent for the channel')
                  : (isRTL ? 'لا توجد قناة نشطة معيّنة' : 'No active channel assigned')
            return <Card key={bot.id} className="flex min-w-0 flex-col border-border bg-surface-card transition-colors hover:border-border-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand"><Bot size={19} /></span>
                  <div className="min-w-0 flex-1"><CardTitle className="truncate text-base">{bot.name}</CardTitle><p className="mt-1 truncate text-xs text-text-tertiary">{bot.ai_provider || (isRTL ? 'مزود الذكاء غير محدد' : 'AI provider not set')}{bot.ai_model ? ` · ${bot.ai_model}` : ''}</p></div>
                  <Badge variant={statusVariant} size="xs" dot>{bot.status || 'unknown'}</Badge>
                </div>
                <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${ready ? 'border-success/20 bg-success/5 text-success' : 'border-warning/20 bg-warning/5 text-warning'}`}>
                  {ready ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                  <span>{ready ? (isRTL ? `الردود نشطة على ${bot.effective_ai_channels || 0} قناة` : `Replies active on ${bot.effective_ai_channels || 0} channel${bot.effective_ai_channels === 1 ? '' : 's'}`) : pauseReason}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 pt-2">
                <section>
                  <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-text-secondary">{isRTL ? 'قنوات التواصل' : 'Communication channels'}</h3><span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] tabular-nums text-text-tertiary">{bot.channels?.length || 0}</span></div>
                  {bot.channels?.length ? <div className="flex flex-wrap gap-2">{bot.channels.map(channel => <span key={channel.id} title={channel.page_name || channel.page_id || channel.type} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface-elevated/60 px-2.5 py-1.5 text-xs text-text-primary"><ChannelIcon type={channel.type as any} size={14} /><span className="truncate">{channel.page_name || channel.type}</span>{channel.pivot?.is_primary && <Badge variant="brand" size="xs">{isRTL ? 'أساسي' : 'Primary'}</Badge>}</span>)}</div> : <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-tertiary">{isRTL ? 'لم يتم تعيين قنوات' : 'No channels assigned'}</p>}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-text-secondary">{isRTL ? 'المتاجر' : 'Commerce stores'}</h3><span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] tabular-nums text-text-tertiary">{commerce.length}</span></div>
                  {commerce.length ? <ul className="space-y-1.5">{commerce.map(connection => <li key={connection.id} className="flex min-w-0 items-center gap-2 text-xs text-text-secondary"><Store size={13} className="shrink-0 text-text-tertiary" /><span className="min-w-0 truncate">{connection.type}{connection.page_name ? ` · ${connection.page_name}` : connection.page_id ? ` · ${connection.page_id}` : ''}</span>{connection.pivot?.is_default && <Badge variant="brand" size="xs">{isRTL ? 'افتراضي' : 'Default'}</Badge>}</li>)}</ul> : <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-tertiary">{isRTL ? 'لم يتم تعيين متجر' : 'No store assigned'}</p>}
                </section>

                <div className="flex items-center gap-2 border-t border-border/70 pt-3 text-xs text-text-tertiary"><BookOpen size={14} />{assignments.length} {isRTL ? 'مصادر معرفة' : `knowledge source${assignments.length === 1 ? '' : 's'}`}</div>
              </CardContent>

              <CardFooter className="flex-wrap justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label={active ? (isRTL ? 'إيقاف الوكيل' : 'Pause agent') : (isRTL ? 'تفعيل الوكيل' : 'Activate agent')} title={active ? (isRTL ? 'إيقاف الوكيل' : 'Pause agent') : (isRTL ? 'تفعيل الوكيل' : 'Activate agent')} disabled={busyBotId !== null} loading={busyBotId === bot.id} onClick={() => void changeStatus(bot, active ? 'inactive' : 'active')} icon={active ? <Pause size={15} /> : <Play size={15} />} />
                  <Button variant="ghost" size="icon" aria-label={isRTL ? 'حذف الوكيل' : 'Delete agent'} title={isRTL ? 'حذف الوكيل' : 'Delete agent'} disabled={busyBotId !== null} onClick={() => void deleteBot(bot)} icon={<Trash2 size={15} className="text-error" />} />
                </div>
                <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(bot)} disabled={busyBotId !== null}>{isRTL ? 'تعديل الإعدادات' : 'Edit configuration'}</Button>
              </CardFooter>
            </Card>
          })}
        </div>
      )}

      {modalOpen && <BotWizardModal bot={editingBot} onClose={() => { setModalOpen(false); setEditingBot(null) }} onSaved={() => { setModalOpen(false); setEditingBot(null); void fetchBots() }} />}
    </main>
  )
}
