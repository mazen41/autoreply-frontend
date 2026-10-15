'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Camera, Check, CheckCheck, CircleSlash2, Clock3, Globe2, MessageCircle, MessageSquareText, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'
import Button from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import RadioGroup from '../../../components/ui/Radio'
import Switch from '../../../components/ui/Switch'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

type CommentEvent = {
  id: number
  platform: 'facebook' | 'instagram' | string
  event_type: string
  post_id: string | null
  comment_id: string
  commenter_id: string | null
  comment_text: string | null
  platform_created_at: string | null
  created_at: string
  status: string
  failure_code: string | null
  failure_reason: string | null
  decision_trace?: { rule?: { id?: string; name?: string } | null; matched?: boolean; matched_keywords?: string[]; excluded_keywords?: string[]; requested_action?: string; permitted_actions?: string[]; delay_minutes?: number; reason?: string | null; final_status?: string; public_reply?: { status?: string; reason?: string | null; reply_id?: string | null } }
  channel?: { id: number; type: string; page_name?: string | null; page_id?: string | null }
  bot?: { id: number; name: string } | null
  reply?: { content: string; source: string; created_at: string } | null
}

type CommentsResponse = {
  data: CommentEvent[]
  current_page: number
  last_page: number
  total: number
  stats: { total: number; replied: number; skipped: number; cancelled: number; failed: number; retryable: number; pending: number; needs_attention: number }
}

type BotOption = { id: number; name: string; status: string; channels?: Array<{ id: number; type: string }> }
type CommentRule = { id: string; name: string; keywords: string[]; excluded_keywords: string[]; match: 'contains' | 'equals'; action: 'public' | 'dm' | 'both'; public_reply_variants: string[]; dm_message?: string | null; delay_minutes: number; post_ids: string[]; enabled: boolean }
type RuleChannel = { id: number; type: string; name?: string | null; status: string; enabled: boolean; public_reply_enabled: boolean; settings: Record<string, unknown> }
type Scenario = { id: number; name: string; input: { comment_text: string; post_id?: string; is_live_comment?: boolean }; expected: Record<string, unknown> }
type SimulationResult = {
  dry_run: boolean
  decision: { matched: boolean; reason: string | null; action: string; rule: { id: string; name: string } | null; matched_keywords: string[]; excluded_keywords: string[]; delay_minutes: number; permitted_actions: string[] }
  public_reply_preview: string | null
  preview_source: string | null
  diagnostics: { channel_connected: boolean; comment_webhook_status: string; private_reply_enabled: boolean; commerce_context: { status: string; provider?: string; name?: string } }
}
type SuiteResult = { summary: { total: number; passed: number; failed: number }; results: Array<{ scenario_id: number; name: string; passed: boolean; expected: Record<string, unknown>; actual: Record<string, unknown>; diagnostic: string | null }> }

function token() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

function dateLabel(value: string | null | undefined, isRTL: boolean) {
  if (!value) return isRTL ? 'وقت غير معروف' : 'Time unavailable'
  return new Intl.DateTimeFormat(isRTL ? 'ar' : undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status: string, isRTL: boolean) {
  const labels: Record<string, [string, string]> = {
    processed: ['Replied', 'تم الرد'], received: ['Received', 'مستلم'], processing: ['Processing', 'قيد المعالجة'],
    scheduled: ['Scheduled', 'مجدول'], cancelled: ['Cancelled', 'أُلغي'], skipped: ['Skipped', 'تم التخطي'],
    failed: ['Failed', 'فشل'], retryable: ['Retry pending', 'بانتظار إعادة المحاولة'],
  }
  const [en, ar] = labels[status] || [status, status]
  return isRTL ? ar : en
}

function legacyRules(settings: Record<string, unknown>): CommentRule[] {
  const keywords = Array.isArray(settings.trigger_keywords) ? (settings.trigger_keywords as unknown[]).filter((value): value is string => typeof value === 'string') : []
  if (!keywords.length) return []
  return [{
    id: 'legacy', name: 'Existing keyword rule', keywords,
    excluded_keywords: Array.isArray(settings.excluded_keywords) ? (settings.excluded_keywords as unknown[]).filter((value): value is string => typeof value === 'string') : [],
    match: 'contains', action: 'public',
    public_reply_variants: typeof settings.fallback_response === 'string' && settings.fallback_response.trim() ? [settings.fallback_response] : [],
    delay_minutes: 0, post_ids: [], enabled: true,
  }]
}

export default function CommentsPage() {
  const { isRTL } = useLang()
  const [comments, setComments] = useState<CommentEvent[]>([])
  const [stats, setStats] = useState({ total: 0, replied: 0, skipped: 0, cancelled: 0, failed: 0, retryable: 0, pending: 0, needs_attention: 0 })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bots, setBots] = useState<BotOption[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [ruleChannels, setRuleChannels] = useState<RuleChannel[]>([])
  const [rules, setRules] = useState<CommentRule[]>([])
  const [ruleBusy, setRuleBusy] = useState(false)
  const [ruleNotice, setRuleNotice] = useState('')
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioText, setScenarioText] = useState('')
  const [scenarioPostId, setScenarioPostId] = useState('')
  const [expectedMatch, setExpectedMatch] = useState('matched')
  const [expectedAction, setExpectedAction] = useState('public')
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [suite, setSuite] = useState<SuiteResult | null>(null)
  const [testBusy, setTestBusy] = useState(false)
  const [testError, setTestError] = useState('')
  const [testNotice, setTestNotice] = useState('')

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() }), [])

  const loadTestData = useCallback(async () => {
    try {
      const botsResponse = await fetch(`${API}/bots`, { headers: authHeaders() })
      const botsBody = await botsResponse.json()
      if (!botsResponse.ok) throw new Error(botsBody.message || `Could not load bots (HTTP ${botsResponse.status}).`)
      const botRows = (Array.isArray(botsBody.bots) ? botsBody.bots : []) as BotOption[]
      setBots(botRows)
      setSelectedBotId((current) => current || String(botRows.find((bot) => bot.status === 'active')?.id || botRows[0]?.id || ''))
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not load comment automation setup.')
    }
  }, [authHeaders])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Starts an asynchronous API read; updates occur after its responses.
  useEffect(() => { void loadTestData() }, [loadTestData])

  const loadBotRules = useCallback(async () => {
    if (!selectedBotId) {
      setRuleChannels([])
      setScenarios([])
      setSelectedChannelId('')
      return
    }
    try {
      const [settingsResponse, scenariosResponse] = await Promise.all([
        fetch(`${API}/bots/${selectedBotId}/comment-automation`, { headers: authHeaders() }),
        fetch(`${API}/social-comments/scenarios?bot_id=${selectedBotId}`, { headers: authHeaders() }),
      ])
      const [settingsBody, scenariosBody] = await Promise.all([settingsResponse.json(), scenariosResponse.json()])
      if (!settingsResponse.ok) throw new Error(settingsBody.message || `Could not load bot comment settings (HTTP ${settingsResponse.status}).`)
      if (!scenariosResponse.ok) throw new Error(scenariosBody.message || `Could not load test cases (HTTP ${scenariosResponse.status}).`)
      const assigned = (Array.isArray(settingsBody.channels) ? settingsBody.channels : []) as RuleChannel[]
      const nextChannelId = assigned.some((channel) => String(channel.id) === selectedChannelId)
        ? selectedChannelId
        : String(assigned[0]?.id || '')
      setRuleChannels(assigned)
      setSelectedChannelId(nextChannelId)
      const selectedChannel = assigned.find((channel) => String(channel.id) === nextChannelId)
      setRules(Array.isArray(selectedChannel?.settings.rules)
        ? selectedChannel.settings.rules as CommentRule[]
        : legacyRules(selectedChannel?.settings || {}))
      setScenarios((Array.isArray(scenariosBody.data) ? scenariosBody.data : []) as Scenario[])
      setTestError('')
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not load comment rules and test cases.')
    }
  }, [authHeaders, selectedBotId])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Starts asynchronous settings/scenario reads for the selected bot.
  useEffect(() => { void loadBotRules() }, [loadBotRules])

  const updateRule = (ruleId: string, patch: Partial<CommentRule>) => {
    setRules((current) => current.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule))
  }

  const addRule = () => setRules((current) => [...current, {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `rule-${Date.now()}`,
    name: '', keywords: [], excluded_keywords: [], match: 'contains', action: 'public',
    public_reply_variants: [''], delay_minutes: 0, post_ids: [], enabled: true,
  }])

  const saveRules = async () => {
    if (!selectedBotId || !selectedChannelId) return
    setRuleBusy(true)
    setTestError('')
    setRuleNotice('')
    try {
      const hasDuplicates = rules.some((rule) => ['keywords', 'excluded_keywords', 'post_ids'].some((key) => {
        const values = rule[key as 'keywords' | 'excluded_keywords' | 'post_ids'].map((value) => value.trim().toLocaleLowerCase()).filter(Boolean)
        return values.length !== new Set(values).size
      }))
      if (hasDuplicates) throw new Error(isRTL ? 'احذف الكلمات أو معرّفات المنشورات المكررة قبل الحفظ.' : 'Remove duplicate keywords or post IDs before saving.')
      const prepared = rules.map((rule) => ({
        ...rule,
        name: rule.name.trim(),
        keywords: rule.keywords.map((value) => value.trim()).filter(Boolean),
        excluded_keywords: rule.excluded_keywords.map((value) => value.trim()).filter(Boolean),
        public_reply_variants: rule.public_reply_variants.map((value) => value.trim()).filter(Boolean),
        post_ids: [...new Set(rule.post_ids.map((value) => value.trim()).filter(Boolean))],
      }))
      const duplicated = prepared.some((rule) => !rule.name || rule.keywords.length === 0 || (rule.action !== 'dm' && rule.public_reply_variants.length === 0))
      if (duplicated) throw new Error(isRTL ? 'أدخل اسمًا وكلمة تشغيل وردًا عامًا لكل قاعدة عامة.' : 'Each rule needs a name, at least one keyword, and a public reply.')
      const response = await fetch(`${API}/bots/${selectedBotId}/comment-automation`, {
        method: 'PUT', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: ruleChannels.map((channel) => ({
          channel_id: channel.id, enabled: channel.enabled,
          public_reply_enabled: channel.public_reply_enabled, private_reply_enabled: false,
          settings: channel.id === Number(selectedChannelId) ? { ...channel.settings, rules: prepared } : channel.settings,
        })) }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `Could not save comment rules (HTTP ${response.status}).`)
      setRuleChannels(body.channels || [])
      setRules(prepared)
      setRuleNotice(isRTL ? 'تم حفظ القواعد.' : 'Comment rules saved.')
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not save comment rules.')
    } finally {
      setRuleBusy(false)
    }
  }

  const runSimulation = async () => {
    if (!selectedBotId || !selectedChannelId || !scenarioText.trim()) return
    setTestBusy(true)
    setTestError('')
    setTestNotice('')
    setSimulation(null)
    try {
      const response = await fetch(`${API}/social-comments/simulate`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: Number(selectedBotId), channel_id: Number(selectedChannelId), comment_text: scenarioText.trim() }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `Simulation failed (HTTP ${response.status}).`)
      if (body.dry_run !== true) throw new Error('Server did not confirm that this was a dry run.')
      setSimulation(body as SimulationResult)
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not simulate this comment.')
    } finally {
      setTestBusy(false)
    }
  }

  const saveScenario = async () => {
    if (!selectedBotId || !selectedChannelId || !scenarioName.trim() || !scenarioText.trim()) return
    setTestBusy(true)
    setTestError('')
    setTestNotice('')
    try {
      const matched = expectedMatch === 'matched'
      const response = await fetch(`${API}/social-comments/scenarios`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: Number(selectedBotId), channel_id: Number(selectedChannelId), name: scenarioName.trim(),
          input: { comment_text: scenarioText.trim(), ...(scenarioPostId.trim() ? { post_id: scenarioPostId.trim() } : {}) },
          expected: { matched, ...(matched ? { action: expectedAction } : { action: 'none' }) },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `Could not save scenario (HTTP ${response.status}).`)
      setScenarioName('')
      setTestNotice(isRTL ? 'تم حفظ حالة الاختبار.' : 'Test scenario saved.')
      await loadBotRules()
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not save this scenario.')
    } finally {
      setTestBusy(false)
    }
  }

  const runSuite = async () => {
    if (!selectedBotId || scenarios.length === 0) return
    setTestBusy(true)
    setTestError('')
    setTestNotice('')
    setSuite(null)
    try {
      const response = await fetch(`${API}/social-comments/scenarios/run`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: Number(selectedBotId) }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `Test suite failed (HTTP ${response.status}).`)
      if (body.dry_run !== true) throw new Error('Server did not confirm that this was a dry run.')
      setSuite(body as SuiteResult)
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not run the test suite.')
    } finally {
      setTestBusy(false)
    }
  }

  const deleteScenario = async (scenarioId: number) => {
    setTestBusy(true)
    setTestError('')
    try {
      const response = await fetch(`${API}/social-comments/scenarios/${scenarioId}`, { method: 'DELETE', headers: authHeaders() })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || `Could not delete scenario (HTTP ${response.status}).`)
      await loadBotRules()
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not delete this scenario.')
    } finally {
      setTestBusy(false)
    }
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ per_page: '50', status, page: String(page) })
      if (platform !== 'all') params.set('platform', platform)
      if (search.trim()) params.set('search', search.trim())
      const response = await fetch(`${API}/social-comments?${params}`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const body = await response.json().catch(() => ({})) as CommentsResponse & { message?: string }
      if (!response.ok) throw new Error(body.message || `Could not load comments (HTTP ${response.status}).`)
      const rows = Array.isArray(body.data) ? body.data : []
      setComments(rows)
      setStats({
        replied: 0,
        skipped: 0,
        cancelled: 0,
        failed: 0,
        retryable: 0,
        pending: 0,
        needs_attention: 0,
        ...(body.stats || {}),
        total: body.total || 0,
      })
      setLastPage(body.last_page || 1)
      setSelectedId((current) => rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load comments.')
      if (!silent) setComments([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [page, platform, search, status])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const timer = window.setInterval(() => { void load(true) }, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const selected = useMemo(() => comments.find((comment) => comment.id === selectedId) || null, [comments, selectedId])
  const title = isRTL ? 'تعليقات الصفحات' : 'Page comments'
  const subtitle = isRTL
    ? 'تابع تعليقات فيسبوك وإنستغرام والردود العامة في مساحة منفصلة عن محادثات العملاء.'
    : 'Review Facebook and Instagram comments and public replies in a workspace separate from customer chats.'

  return (
    <main className="mx-auto h-full max-w-[1500px] space-y-6 overflow-y-auto p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-brand/10 p-6 md:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <MessageCircle size={14} /> {isRTL ? 'مركز التعليقات' : 'COMMENT CENTER'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{subtitle}</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text-primary transition hover:bg-surface-elevated disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <StatCard label={isRTL ? 'كل التعليقات' : 'All comments'} value={stats.total} icon={<MessageSquareText size={18} />} tone="brand" />
        <StatCard label={isRTL ? 'تم الرد علنًا' : 'Publicly replied'} value={stats.replied} icon={<CheckCheck size={18} />} tone="success" />
        <StatCard label={isRTL ? 'تم التخطي' : 'Skipped'} value={stats.skipped} icon={<CircleSlash2 size={18} />} tone="neutral" />
        <StatCard label={isRTL ? 'أُلغيت' : 'Cancelled'} value={stats.cancelled} icon={<CircleSlash2 size={18} />} tone="neutral" />
        <StatCard label={isRTL ? 'فشلت' : 'Failed'} value={stats.failed} icon={<TriangleAlert size={18} />} tone="error" />
        <StatCard label={isRTL ? 'قابلة لإعادة المحاولة' : 'Retryable'} value={stats.retryable} icon={<RefreshCw size={18} />} tone="warning" />
        <StatCard label={isRTL ? 'قيد المعالجة' : 'Pending'} value={stats.pending} icon={<Clock3 size={18} />} tone="warning" />
      </section>

      <section aria-labelledby="trust-center-heading" className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="trust-center-heading" className="text-lg font-semibold text-text-primary">{isRTL ? 'اختبار موثوقية الأتمتة' : 'Automation Trust Center'}</h2>
              <p className="mt-1 max-w-3xl text-sm text-text-secondary">{isRTL ? 'اختبر قواعد التعليقات ببيانات تجريبية. المحاكاة لا ترسل تعليقًا أو رسالة ولا تستدعي مزود الذكاء الاصطناعي.' : 'Test comment rules with synthetic input. Dry runs never send a comment or message and do not call an AI provider.'}</p>
            </div>
            <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold text-success">{isRTL ? 'آمن — بدون إرسال' : 'Dry run · no sends'}</span>
          </div>
        </div>
        <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            {testError && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{testError}</div>}
            {testNotice && <div role="status" className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">{testNotice}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <Select label={isRTL ? 'الوكيل' : 'Bot'} value={selectedBotId} disabled={bots.length === 0} onChange={(event) => { setSelectedBotId(event.target.value); setSimulation(null); setSuite(null) }} options={bots.map((bot) => ({ value: String(bot.id), label: `${bot.name}${bot.status !== 'active' ? ` · ${bot.status}` : ''}` }))} placeholder={isRTL ? 'اختر وكيلًا' : 'Select a bot'} />
              <Select label={isRTL ? 'الحساب الاجتماعي' : 'Connected account'} value={selectedChannelId} disabled={ruleChannels.length === 0} onChange={(event) => { const id = event.target.value; const channel = ruleChannels.find((candidate) => String(candidate.id) === id); setSelectedChannelId(id); setRules(Array.isArray(channel?.settings.rules) ? channel.settings.rules as CommentRule[] : legacyRules(channel?.settings || {})); setSimulation(null) }} options={ruleChannels.map((channel) => ({ value: String(channel.id), label: `${channel.name || channel.type} · ${channel.type}` }))} placeholder={isRTL ? 'اختر حسابًا' : 'Select an account'} />
            </div>
            {bots.length === 0 && <p className="text-sm text-text-tertiary">{isRTL ? 'أنشئ وكيلًا أولًا لاختبار الأتمتة.' : 'Create a bot before testing comment automation.'}</p>}
            {bots.length > 0 && ruleChannels.length === 0 && <p className="text-sm text-text-tertiary">{isRTL ? 'لا توجد حسابات فيسبوك أو إنستغرام معيّنة لهذا الوكيل.' : 'This bot has no assigned Facebook or Instagram accounts.'}</p>}
            {selectedChannelId && <section aria-labelledby="comment-rules-title" className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 id="comment-rules-title" className="font-semibold text-text-primary">{isRTL ? 'قواعد التعليقات' : 'Comment rules'}</h3><p className="mt-1 text-xs text-text-tertiary">{isRTL ? 'القواعد العامة فقط مفعّلة حاليًا. تُحفظ القواعد في إعدادات الحساب المختار.' : 'Public replies are the currently supported action. Rules save to the selected account settings.'}</p></div>
                <Button size="sm" variant="outline" onClick={addRule}>{isRTL ? 'إضافة قاعدة' : 'Add rule'}</Button>
              </div>
              {rules.length === 0 && <p className="mt-3 text-sm text-text-tertiary">{isRTL ? 'لا توجد قواعد بعد. أضف قاعدة لتفعيل المطابقة.' : 'No rules configured. Add a rule to configure matching.'}</p>}
              <div className="mt-3 space-y-3">{rules.map((rule) => <article key={rule.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><label className="min-w-[180px] flex-1 text-xs font-medium text-text-secondary">{isRTL ? 'اسم القاعدة' : 'Rule name'}<input value={rule.name} onChange={(event) => updateRule(rule.id, { name: event.target.value })} maxLength={120} className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-brand" /></label><Switch checked={rule.enabled} onChange={(enabled) => updateRule(rule.id, { enabled })} label={isRTL ? 'مفعّلة' : 'Enabled'} /><Button size="xs" variant="destructive" onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}>{isRTL ? 'حذف' : 'Delete'}</Button></div>
                <div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-xs font-medium text-text-secondary">{isRTL ? 'كلمات التفعيل، مفصولة بفواصل' : 'Included keywords, comma separated'}<input value={rule.keywords.join(', ')} onChange={(event) => updateRule(rule.id, { keywords: event.target.value.split(',') })} className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-brand" /></label><label className="text-xs font-medium text-text-secondary">{isRTL ? 'كلمات الاستثناء' : 'Excluded keywords'}<input value={rule.excluded_keywords.join(', ')} onChange={(event) => updateRule(rule.id, { excluded_keywords: event.target.value.split(',') })} className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-brand" /></label>
                  <Select label={isRTL ? 'طريقة المطابقة' : 'Match mode'} value={rule.match} onChange={(event) => updateRule(rule.id, { match: event.target.value as CommentRule['match'] })} options={[{ value: 'contains', label: isRTL ? 'تحتوي على كلمة' : 'Contains keyword' }, { value: 'equals', label: isRTL ? 'تساوي النص كاملًا' : 'Exact comment match' }]} />
                  <label className="text-xs font-medium text-text-secondary">{isRTL ? 'تأخير الرد بالدقائق' : 'Reply delay in minutes'}<input type="number" min={0} max={10080} value={rule.delay_minutes} onChange={(event) => updateRule(rule.id, { delay_minutes: Number(event.target.value) })} className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-brand" /></label>
                  <label className="text-xs font-medium text-text-secondary md:col-span-2">{isRTL ? 'نصوص الرد العام، رد واحد في كل سطر' : 'Public reply variants, one per line'}<textarea value={rule.public_reply_variants.join('\n')} onChange={(event) => updateRule(rule.id, { public_reply_variants: event.target.value.split('\n') })} rows={2} maxLength={5000} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" /></label>
                </div>
                <p className="mt-2 text-xs text-text-tertiary">{isRTL ? 'لن تُرسل المعاينة. الرد المؤخر يُلغى إذا وصل إشعار حذف التعليق قبل التنفيذ.' : 'Preview is never sent. A scheduled reply is cancelled if a comment deletion event arrives before execution.'}</p>
              </article>)}</div>
              {ruleNotice && <p role="status" className="mt-3 text-sm text-success">{ruleNotice}</p>}
              <Button className="mt-3" onClick={() => void saveRules()} loading={ruleBusy} disabled={ruleBusy || !selectedChannelId}>{isRTL ? 'حفظ القواعد' : 'Save rules'}</Button>
            </section>}
            <label className="block text-sm font-medium text-text-secondary">
              {isRTL ? 'تعليق تجريبي' : 'Synthetic comment'}
              <textarea value={scenarioText} onChange={(event) => setScenarioText(event.target.value)} maxLength={5000} rows={3} placeholder={isRTL ? 'اكتب تعليقًا تجريبيًا' : 'Enter a synthetic comment'} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand" />
            </label>
            <label className="block text-sm font-medium text-text-secondary">
              {isRTL ? 'معرّف المنشور (اختياري)' : 'Target post ID (optional)'}
              <input value={scenarioPostId} onChange={(event) => setScenarioPostId(event.target.value)} maxLength={160} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text-primary outline-none focus:border-brand" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void runSimulation()} loading={testBusy} disabled={!selectedChannelId || !scenarioText.trim()}>{isRTL ? 'محاكاة القاعدة' : 'Simulate rule'}</Button>
              <Button variant="outline" onClick={() => void runSuite()} loading={testBusy} disabled={!selectedBotId || scenarios.length === 0}>{isRTL ? `تشغيل مجموعة الاختبار (${scenarios.length})` : `Run test suite (${scenarios.length})`}</Button>
            </div>
            <p className="text-xs text-text-tertiary">{isRTL ? 'المعاينة لا تنشئ رد الذكاء الاصطناعي؛ ستعرض فقط الرد الثابت أو الرد الاحتياطي إذا كان مضبوطًا.' : 'The dry run does not generate an AI answer. It only previews a configured reply variant or fallback when available.'}</p>

            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold text-text-primary">{isRTL ? 'حفظ كسيناريو تكراري' : 'Save as regression scenario'}</h3>
              <label className="mt-3 block text-xs font-medium text-text-secondary">{isRTL ? 'اسم السيناريو' : 'Scenario name'}<input value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} maxLength={120} className="mt-1.5 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand" /></label>
              <RadioGroup className="mt-4" orientation="horizontal" value={expectedMatch} onChange={setExpectedMatch} options={[
                { value: 'matched', label: isRTL ? 'متوقع أن تطابق' : 'Expected match' },
                { value: 'not_matched', label: isRTL ? 'متوقع عدم التطابق' : 'Expected no match' },
              ]} />
              {expectedMatch === 'matched' && <Select className="mt-3" label={isRTL ? 'الإجراء المتوقع' : 'Expected action'} value={expectedAction} onChange={(event) => setExpectedAction(event.target.value)} options={[
                { value: 'public', label: isRTL ? 'رد عام' : 'Public reply' },
                { value: 'none', label: isRTL ? 'لا إجراء مسموح' : 'No permitted action' },
              ]} />}
              <Button variant="secondary" className="mt-3" onClick={() => void saveScenario()} loading={testBusy} disabled={!selectedChannelId || !scenarioName.trim() || !scenarioText.trim()}>{isRTL ? 'حفظ السيناريو' : 'Save scenario'}</Button>
            </div>
          </div>

          <div className="space-y-4">
            {simulation && <div role="status" className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-text-primary">{isRTL ? 'نتيجة المحاكاة' : 'Simulation result'}</h3><span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-secondary">{simulation.dry_run ? (isRTL ? 'تجريبي' : 'Dry run') : '—'}</span></div>
              <p className="mt-3 text-sm text-text-primary">{simulation.decision.matched ? (isRTL ? `تطابق: ${simulation.decision.rule?.name || 'قاعدة'}` : `Matched: ${simulation.decision.rule?.name || 'rule'}`) : (isRTL ? 'لم تطابق أي قاعدة' : 'No rule matched')}</p>
              <p className="mt-1 text-xs text-text-tertiary">{isRTL ? 'السبب' : 'Reason'}: {simulation.decision.reason || (isRTL ? 'مسموح' : 'eligible')} · {isRTL ? 'الكلمات المطابقة' : 'Matched keywords'}: {simulation.decision.matched_keywords.join(', ') || '—'}</p>
              <p className="mt-1 text-xs text-text-tertiary">{isRTL ? 'الإجراء' : 'Action'}: {simulation.decision.action} · {isRTL ? 'التأخير' : 'Delay'}: {simulation.decision.delay_minutes} {isRTL ? 'دقيقة' : 'min'}</p>
              {simulation.decision.excluded_keywords.length > 0 && <p className="mt-1 text-xs text-warning">{isRTL ? 'كلمات مستثناة' : 'Excluded keywords'}: {simulation.decision.excluded_keywords.join(', ')}</p>}
              <div className="mt-3 border-t border-border pt-3 text-xs text-text-secondary">
                <p>{isRTL ? 'الحساب' : 'Account'}: {simulation.diagnostics.channel_connected ? (isRTL ? 'متصل' : 'connected') : (isRTL ? 'غير متصل' : 'disconnected')} · {isRTL ? 'حالة Webhook' : 'Webhook'}: {simulation.diagnostics.comment_webhook_status}</p>
                <p className="mt-1">{isRTL ? 'المتجر' : 'Commerce'}: {simulation.diagnostics.commerce_context.status === 'resolved' ? `${simulation.diagnostics.commerce_context.provider} · ${simulation.diagnostics.commerce_context.name || ''}` : (isRTL ? 'غير محدد' : 'unresolved')}</p>
              </div>
              {simulation.public_reply_preview && <div className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3"><p className="text-[11px] font-semibold uppercase text-success">{isRTL ? 'معاينة الرد العام' : 'Public reply preview'} · {simulation.preview_source}</p><p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{simulation.public_reply_preview}</p></div>}
              {!simulation.public_reply_preview && simulation.decision.permitted_actions.includes('public') && <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs text-warning">{isRTL ? 'لم يُنشأ رد الذكاء الاصطناعي في وضع المحاكاة.' : 'AI-generated reply text is not created during a dry run.'}</p>}
            </div>}

            {suite && <div role="status" className="rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold text-text-primary">{isRTL ? 'نتيجة مجموعة الاختبار' : 'Test suite result'}</h3>
              <p className="mt-2 text-sm text-text-secondary">{suite.summary.passed} {isRTL ? 'ناجح' : 'passed'} · {suite.summary.failed} {isRTL ? 'فاشل' : 'failed'} · {suite.summary.total} {isRTL ? 'إجمالي' : 'total'}</p>
              <ul className="mt-3 space-y-2">{suite.results.map((result) => <li key={result.scenario_id} className="rounded-lg border border-border p-3 text-xs">
                <div className="flex items-center justify-between gap-2"><span className="font-medium text-text-primary">{result.name}</span><span className={result.passed ? 'text-success' : 'text-error'}>{result.passed ? (isRTL ? 'ناجح' : 'PASS') : (isRTL ? 'فشل' : 'FAIL')}</span></div>
                <p className="mt-1 text-text-tertiary">{isRTL ? 'متوقع' : 'Expected'}: {JSON.stringify(result.expected)} · {isRTL ? 'فعلي' : 'Actual'}: {JSON.stringify(result.actual)}</p>
                {result.diagnostic && <p className="mt-1 text-warning">{result.diagnostic}</p>}
              </li>)}</ul>
            </div>}

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-text-primary">{isRTL ? 'سيناريوهات محفوظة' : 'Saved scenarios'}</h3><span className="text-xs text-text-tertiary">{scenarios.length}</span></div>
              {scenarios.length === 0 ? <p className="mt-3 text-sm text-text-tertiary">{isRTL ? 'احفظ سيناريو بعد إدخال تعليق تجريبي.' : 'Save a scenario after entering synthetic comment text.'}</p> : <ul className="mt-3 divide-y divide-border">{scenarios.map((scenario) => <li key={scenario.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text-primary">{scenario.name}</p><p className="truncate text-xs text-text-tertiary">{scenario.input.comment_text}</p></div>
                <Button size="xs" variant="ghost" disabled={testBusy} onClick={() => { setScenarioText(scenario.input.comment_text); setScenarioPostId(scenario.input.post_id || '') }}>{isRTL ? 'تحميل' : 'Load'}</Button>
                <Button size="xs" variant="destructive" disabled={testBusy} onClick={() => { if (window.confirm(isRTL ? 'هل تريد حذف السيناريو؟' : 'Delete this saved scenario?')) void deleteScenario(scenario.id) }}>{isRTL ? 'حذف' : 'Delete'}</Button>
              </li>)}</ul>}
            </div>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-text-tertiary ltr:left-3 rtl:right-3" />
            <input aria-label={isRTL ? 'بحث في التعليقات' : 'Search comments'} value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder={isRTL ? 'ابحث في نص التعليق أو معرّف الحساب...' : 'Search comment text or account ID...'} className="h-10 w-full rounded-xl border border-border bg-background text-sm text-text-primary outline-none transition focus:border-brand ltr:pl-9 ltr:pr-3 rtl:pl-3 rtl:pr-9" />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={status === 'all'} onClick={() => { setPage(1); setStatus('all') }}>{isRTL ? 'الكل' : 'All'}</FilterButton>
            <FilterButton active={status === 'needs_attention'} onClick={() => { setPage(1); setStatus('needs_attention') }}>{isRTL ? 'تحتاج مراجعة' : 'Needs attention'}</FilterButton>
            <FilterButton active={status === 'replied'} onClick={() => { setPage(1); setStatus('replied') }}>{isRTL ? 'تم الرد' : 'Replied'}</FilterButton>
            <FilterButton active={status === 'skipped'} onClick={() => { setPage(1); setStatus('skipped') }}>{isRTL ? 'تم التخطي' : 'Skipped'}</FilterButton>
            <FilterButton active={status === 'failed'} onClick={() => { setPage(1); setStatus('failed') }}>{isRTL ? 'فشلت' : 'Failed'}</FilterButton>
          </div>
          <Select label={isRTL ? 'المنصة' : 'Platform'} value={platform} onChange={(event) => { setPage(1); setPlatform(event.target.value) }} options={[
            { value: 'all', label: isRTL ? 'كل المنصات' : 'All platforms' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'instagram', label: 'Instagram' },
          ]} />
        </div>

        <div className="grid min-h-[520px] lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="max-h-[72vh] overflow-y-auto border-b border-border lg:border-b-0 lg:border-e">
            {loading && comments.length === 0 ? <div className="space-y-3 p-4">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-elevated" />)}</div> : comments.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated text-text-tertiary"><MessageCircle size={22} /></div>
                <p className="font-semibold text-text-primary">{isRTL ? 'لا توجد تعليقات هنا' : 'No comments here yet'}</p>
                <p className="mt-1 max-w-xs text-sm text-text-tertiary">{isRTL ? 'ستظهر تعليقات الصفحات هنا عند وصولها.' : 'New comments from your connected pages will appear here.'}</p>
              </div>
            ) : comments.map((comment) => (
              <button key={comment.id} onClick={() => setSelectedId(comment.id)} className={`block w-full border-b border-border/70 p-4 text-start transition hover:bg-surface-elevated/50 ${selectedId === comment.id ? 'bg-brand/5 shadow-[inset_3px_0_0_var(--color-brand)]' : ''}`}>
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={comment.platform} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{comment.channel?.page_name || comment.channel?.page_id || (isRTL ? 'صفحة متصلة' : 'Connected page')}</span>
                  <StatusPill status={comment.status} isRTL={isRTL} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-text-secondary">{comment.comment_text || (isRTL ? 'تعليق بدون نص' : 'Comment has no text')}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-text-tertiary">
                  <span className="truncate">{comment.bot?.name || (isRTL ? 'لم يتم تعيين وكيل' : 'No agent assigned')}</span>
                  <span className="shrink-0">{dateLabel(comment.platform_created_at || comment.created_at, isRTL)}</span>
                </div>
              </button>
            ))}
          </div>

          <article className="min-w-0 p-5 md:p-7">
            {selected ? <>
              <div className="flex flex-wrap items-center gap-2">
                <PlatformIcon platform={selected.platform} />
                <span className="text-sm font-semibold text-text-primary">{selected.platform === 'instagram' ? 'Instagram' : 'Facebook'}</span>
                <span className="text-text-tertiary">·</span>
                <span className="text-sm text-text-secondary">{selected.channel?.page_name || selected.channel?.page_id}</span>
                <span className="ms-auto"><StatusPill status={selected.status} isRTL={isRTL} /></span>
              </div>
              <div className="mt-6 rounded-2xl border border-border bg-background p-5 md:p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"><MessageCircle size={14} /> {isRTL ? 'التعليق الوارد' : 'Incoming comment'}</div>
                <p className="whitespace-pre-wrap break-words text-base leading-7 text-text-primary">{selected.comment_text || (isRTL ? 'تعليق بدون نص' : 'Comment has no text')}</p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-tertiary">
                  <span>{isRTL ? 'الحساب' : 'Commenter'}: {selected.commenter_id || '—'}</span>
                  <span>{isRTL ? 'المنشور' : 'Post'}: {selected.post_id || '—'}</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"><CheckCheck size={14} /> {isRTL ? 'الرد العام' : 'Public reply'}</div>
                {selected.reply?.content ? (
                  <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-text-primary">{selected.reply.content}</p>
                    <p className="mt-4 text-xs text-text-tertiary">{dateLabel(selected.reply.created_at, isRTL)}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-text-secondary">
                    <Clock3 size={17} className="mt-0.5 shrink-0 text-text-tertiary" />
                    <span>{selected.failure_reason || selected.failure_code || (isRTL ? 'لم يتم تسجيل رد عام لهذا التعليق.' : 'No public reply is recorded for this comment.')}</span>
                  </div>
                )}
                {selected.decision_trace && <div className="mt-4 rounded-xl border border-border bg-background p-3 text-xs">
                  <p className="font-semibold text-text-primary">{isRTL ? 'سجل قرار القاعدة' : 'Automation decision trace'}</p>
                  <p className="mt-1 text-text-secondary">{isRTL ? 'القاعدة' : 'Rule'}: {selected.decision_trace.rule?.name || '—'} · {isRTL ? 'الحالة' : 'Outcome'}: {selected.decision_trace.final_status || selected.status}</p>
                  <p className="mt-1 text-text-tertiary">{isRTL ? 'السبب' : 'Reason'}: {selected.decision_trace.reason || selected.failure_code || '—'} · {isRTL ? 'الإجراء' : 'Action'}: {selected.decision_trace.permitted_actions?.join(', ') || 'none'}</p>
                  <p className="mt-1 text-text-tertiary">{isRTL ? 'الكلمات المطابقة' : 'Matched keywords'}: {selected.decision_trace.matched_keywords?.join(', ') || '—'} · {isRTL ? 'تأخير' : 'Delay'}: {selected.decision_trace.delay_minutes ?? 0} {isRTL ? 'دقيقة' : 'min'}</p>
                  {selected.decision_trace.public_reply && <p className="mt-1 text-text-tertiary">{isRTL ? 'حالة الرد العام' : 'Public send'}: {selected.decision_trace.public_reply.status} · {selected.decision_trace.public_reply.reason || selected.decision_trace.public_reply.reply_id || '—'}</p>}
                </div>}
              </div>
              <div className="mt-6 border-t border-border pt-4 text-xs text-text-tertiary">{isRTL ? 'وقت وصول التعليق' : 'Received'} · {dateLabel(selected.platform_created_at || selected.created_at, isRTL)}</div>
            </> : <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center text-text-tertiary"><MessageSquareText size={28} className="mb-3 opacity-50" /><p className="text-sm">{isRTL ? 'اختر تعليقًا لعرض التفاصيل' : 'Select a comment to see its details'}</p></div>}
          </article>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-text-tertiary">
          <span>{isRTL ? `الصفحة ${page} من ${lastPage}` : `Page ${page} of ${lastPage}`}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-border px-3 py-1.5 text-text-secondary hover:bg-surface-elevated disabled:opacity-40">{isRTL ? 'السابق' : 'Previous'}</button>
            <button disabled={page >= lastPage || loading} onClick={() => setPage((value) => Math.min(lastPage, value + 1))} className="rounded-lg border border-border px-3 py-1.5 text-text-secondary hover:bg-surface-elevated disabled:opacity-40">{isRTL ? 'التالي' : 'Next'}</button>
          </div>
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'brand' | 'success' | 'warning' | 'error' | 'neutral' }) {
  const styles = { brand: 'text-brand bg-brand/10', success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', error: 'text-error bg-error/10', neutral: 'text-text-secondary bg-surface-elevated' }
  return <div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="text-sm text-text-secondary">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</span></div><p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">{value.toLocaleString()}</p></div>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`h-10 rounded-xl border px-3 text-sm font-medium transition ${active ? 'border-brand bg-brand text-white' : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'}`}>{children}</button>
}

function PlatformIcon({ platform }: { platform: string }) {
  return platform === 'instagram'
    ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500"><Camera size={15} /></span>
    : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"><Globe2 size={15} /></span>
}

function StatusPill({ status, isRTL }: { status: string; isRTL: boolean }) {
  const replied = status === 'processed'
  const failed = status === 'failed' || status === 'retryable'
  const palette = replied ? 'border-success/20 bg-success/10 text-success' : failed ? 'border-error/20 bg-error/10 text-error' : 'border-warning/20 bg-warning/10 text-warning'
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${palette}`}>{replied ? <Check size={11} /> : null}{statusLabel(status, isRTL)}</span>
}
