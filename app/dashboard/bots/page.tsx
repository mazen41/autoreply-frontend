'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bot, Plus, Pencil, Radio, BookOpen } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ChannelIcon from '../../../components/ui/ChannelIcon'
import BotWizardModal from '../../../components/bots/BotWizardModal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

type BotRecord = {
  id: number
  name: string
  status?: string
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

export default function BotsPage() {
  const [bots, setBots] = useState<BotRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotRecord | null>(null)

  const fetchBots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to load bots.')
      const response = await fetch(`${API}/api/bots`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`Could not load bots (HTTP ${response.status}).`)
      const data = await response.json()
      setBots(Array.isArray(data.bots) ? data.bots : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load bots.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchBots() }, [fetchBots])

  function openCreate() {
    setEditingBot(null)
    setModalOpen(true)
  }

  function openEdit(bot: BotRecord) {
    setEditingBot(bot)
    setModalOpen(true)
  }

  const activeCount = bots.filter((bot) => bot.status === 'active').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Bots & Agents"
        description="Create agents, assign communication channels, and choose the commerce connections they can use."
        breadcrumbs={[{ label: 'NazBiz', href: '/dashboard' }, { label: 'AI Bots' }]}
        primaryAction={<Button variant="primary" size="md" icon={<Plus size={16} />} onClick={openCreate}>Create New Bot</Button>}
      />

      {error && <div role="alert" className="flex items-center justify-between border border-error/30 bg-error/5 px-4 py-3 text-sm"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void fetchBots()}>Retry</Button></div>}

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><Bot className="text-brand" size={20} /><div><div className="text-xs text-text-muted">Bots</div><div className="text-xl font-semibold">{loading ? '—' : bots.length}</div></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Radio className="text-brand" size={20} /><div><div className="text-xs text-text-muted">Active bots</div><div className="text-xl font-semibold">{loading ? '—' : activeCount}</div></div></CardContent></Card>
      </div>

      {loading ? <div className="py-12 text-center text-sm text-text-muted" role="status">Loading bots…</div> : bots.length === 0 ? (
        <Card className="py-12"><EmptyState icon={Bot} title={error ? 'Bots could not be loaded' : 'No bots configured yet'} description={error ? 'Retry after checking your connection.' : 'Create your first AI agent and configure its channels and commerce connections.'} primaryAction={!error ? <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>Create New Bot</Button> : undefined} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {bots.map((bot) => {
            const assignments = bot.knowledge_assignments || bot.knowledgeAssignments || []
            const commerce = bot.ecommerce_connections || []
            return <Card key={bot.id} className="flex flex-col">
              <CardHeader className="pb-2"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{bot.name}</CardTitle><p className="mt-1 text-xs text-text-muted">{bot.ai_provider || 'AI provider not set'}{bot.ai_model ? ` · ${bot.ai_model}` : ''}</p></div><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${bot.status === 'active' ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-surface-elevated text-text-muted'}`}>{bot.status || 'unknown'}</span></div></CardHeader>
              <CardContent className="flex-1 space-y-4 pt-3">
                <section><h3 className="mb-2 text-xs font-medium text-text-muted">Channels ({bot.channels?.length || 0})</h3>{bot.channels?.length ? <div className="flex flex-wrap gap-2">{bot.channels.map((channel) => <span key={channel.id} title={channel.page_name || channel.page_id || channel.type} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs"><ChannelIcon type={channel.type as any} size={14} />{channel.page_name || channel.type}</span>)}</div> : <p className="text-xs text-text-tertiary">No channels assigned</p>}</section>
                <section><h3 className="mb-2 text-xs font-medium text-text-muted">Commerce connections ({commerce.length})</h3>{commerce.length ? <ul className="space-y-1">{commerce.map((connection) => <li key={connection.id} className="text-xs text-text-secondary">{connection.type}{connection.page_name ? ` · ${connection.page_name}` : ''}{connection.pivot?.is_default ? ' · default' : ''}</li>)}</ul> : <p className="text-xs text-text-tertiary">No commerce connection assigned</p>}</section>
                <div className="flex items-center gap-2 border-t border-border/50 pt-3 text-xs text-text-muted"><BookOpen size={14} />{assignments.length} knowledge source{assignments.length === 1 ? '' : 's'}</div>
              </CardContent>
              <CardFooter className="justify-end"><Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(bot)}>Edit configuration</Button></CardFooter>
            </Card>
          })}
        </div>
      )}

      {modalOpen && <BotWizardModal bot={editingBot} onClose={() => { setModalOpen(false); setEditingBot(null) }} onSaved={() => { setModalOpen(false); setEditingBot(null); void fetchBots() }} />}
    </div>
  )
}
