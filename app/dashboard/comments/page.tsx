'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MessageSquare,
  ShieldCheck,
  FlaskConical,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { getBusinessHeaders } from '../../../lib/businessContext'
import Tabs, { TabItem } from '../../../components/ui/Tabs'
import CommentsInbox from '../../../components/dashboard/comments/CommentsInbox'
import CommentRulesManager from '../../../components/dashboard/comments/CommentRulesManager'
import CommentTestCenter from '../../../components/dashboard/comments/CommentTestCenter'
import {
  BotOption,
  CommentEvent,
  CommentRule,
  CommentsResponse,
  RuleChannel,
  Scenario,
  SimulationResult,
  SuiteResult,
} from '../../../components/dashboard/comments/types'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

function token() {
  if (typeof document === 'undefined') return ''
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
}

function legacyRules(settings: Record<string, unknown>): CommentRule[] {
  const keywords = Array.isArray(settings.trigger_keywords)
    ? (settings.trigger_keywords as unknown[]).filter((value): value is string => typeof value === 'string')
    : []
  if (!keywords.length) return []
  return [
    {
      id: 'legacy',
      name: 'Existing keyword rule',
      keywords,
      excluded_keywords: Array.isArray(settings.excluded_keywords)
        ? (settings.excluded_keywords as unknown[]).filter((value): value is string => typeof value === 'string')
        : [],
      match: 'contains',
      action: 'public',
      public_reply_variants:
        typeof settings.fallback_response === 'string' && settings.fallback_response.trim()
          ? [settings.fallback_response]
          : [],
      delay_minutes: 0,
      post_ids: [],
      enabled: true,
    },
  ]
}

interface CommentsPageProps {
  initialTab?: 'comments' | 'rules' | 'test-center'
}

export default function CommentsPage({ initialTab = 'comments' }: CommentsPageProps) {
  const { isRTL } = useLang()
  const [activeTab, setActiveTab] = useState<'comments' | 'rules' | 'test-center'>(initialTab)

  // Comments Inbox state
  const [comments, setComments] = useState<CommentEvent[]>([])
  const [stats, setStats] = useState({
    total: 0,
    replied: 0,
    skipped: 0,
    cancelled: 0,
    failed: 0,
    retryable: 0,
    pending: 0,
    needs_attention: 0,
  })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Rules & Automation state
  const [bots, setBots] = useState<BotOption[]>([])
  const [selectedBotId, setSelectedBotId] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [ruleChannels, setRuleChannels] = useState<RuleChannel[]>([])
  const [rules, setRules] = useState<CommentRule[]>([])
  const [ruleBusy, setRuleBusy] = useState(false)
  const [ruleNotice, setRuleNotice] = useState('')

  // Scenarios & Simulation state
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

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token()}`,
      Accept: 'application/json',
      ...getBusinessHeaders(),
    }),
    []
  )

  // 1. Fetch bots
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

  useEffect(() => {
    void loadTestData()
  }, [loadTestData])

  // 2. Fetch bot rules & scenarios when bot changes
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
      setRules(
        Array.isArray(selectedChannel?.settings.rules)
          ? (selectedChannel.settings.rules as CommentRule[])
          : legacyRules(selectedChannel?.settings || {})
      )
      setScenarios((Array.isArray(scenariosBody.data) ? scenariosBody.data : []) as Scenario[])
      setTestError('')
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not load comment rules and test cases.')
    }
  }, [authHeaders, selectedBotId, selectedChannelId])

  useEffect(() => {
    void loadBotRules()
  }, [loadBotRules])

  // Save rules to backend
  const saveRules = async () => {
    if (!selectedBotId || !selectedChannelId) return
    setRuleBusy(true)
    setTestError('')
    setRuleNotice('')
    try {
      const hasDuplicates = rules.some((rule) =>
        ['keywords', 'excluded_keywords', 'post_ids'].some((key) => {
          const values = rule[key as 'keywords' | 'excluded_keywords' | 'post_ids']
            .map((value) => value.trim().toLocaleLowerCase())
            .filter(Boolean)
          return values.length !== new Set(values).size
        })
      )
      if (hasDuplicates) {
        throw new Error(isRTL ? 'احذف الكلمات أو معرّفات المنشورات المكررة قبل الحفظ.' : 'Remove duplicate keywords or post IDs before saving.')
      }

      const prepared = rules.map((rule) => ({
        ...rule,
        name: rule.name.trim(),
        keywords: rule.keywords.map((value) => value.trim()).filter(Boolean),
        excluded_keywords: rule.excluded_keywords.map((value) => value.trim()).filter(Boolean),
        public_reply_variants: rule.public_reply_variants.map((value) => value.trim()).filter(Boolean),
        post_ids: [...new Set(rule.post_ids.map((value) => value.trim()).filter(Boolean))],
      }))

      const hasInvalid = prepared.some(
        (rule) => !rule.name || rule.keywords.length === 0 || (rule.action !== 'dm' && rule.public_reply_variants.length === 0)
      )
      if (hasInvalid) {
        throw new Error(isRTL ? 'أدخل اسماً وكلمة تفعيل ورداً عاماً لكل قاعدة مفعّلة.' : 'Each rule needs a name, at least one keyword, and a public reply.')
      }

      const response = await fetch(`${API}/bots/${selectedBotId}/comment-automation`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: ruleChannels.map((channel) => ({
            channel_id: channel.id,
            enabled: channel.enabled,
            public_reply_enabled: channel.public_reply_enabled,
            private_reply_enabled: false,
            settings: channel.id === Number(selectedChannelId) ? { ...channel.settings, rules: prepared } : channel.settings,
          })),
        }),
      })

      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `Could not save comment rules (HTTP ${response.status}).`)
      setRuleChannels(body.channels || [])
      setRules(prepared)
      setRuleNotice(isRTL ? 'تم حفظ القواعد بنجاح.' : 'Comment rules saved successfully.')
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not save comment rules.')
    } finally {
      setRuleBusy(false)
    }
  }

  // Toggle channel-level automation
  const handleToggleChannelEnabled = (channelId: number, enabled: boolean) => {
    setRuleChannels((current) =>
      current.map((c) => (c.id === channelId ? { ...c, enabled } : c))
    )
  }

  // Run single simulation
  const runSimulation = async () => {
    if (!selectedBotId || !selectedChannelId || !scenarioText.trim()) return
    setTestBusy(true)
    setTestError('')
    setTestNotice('')
    setSimulation(null)
    try {
      const response = await fetch(`${API}/social-comments/simulate`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: Number(selectedBotId),
          channel_id: Number(selectedChannelId),
          comment_text: scenarioText.trim(),
          ...(scenarioPostId.trim() ? { post_id: scenarioPostId.trim() } : {}),
        }),
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

  // Save regression scenario
  const saveScenario = async () => {
    if (!selectedBotId || !selectedChannelId || !scenarioName.trim() || !scenarioText.trim()) return
    setTestBusy(true)
    setTestError('')
    setTestNotice('')
    try {
      const matched = expectedMatch === 'matched'
      const response = await fetch(`${API}/social-comments/scenarios`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: Number(selectedBotId),
          channel_id: Number(selectedChannelId),
          name: scenarioName.trim(),
          input: {
            comment_text: scenarioText.trim(),
            ...(scenarioPostId.trim() ? { post_id: scenarioPostId.trim() } : {}),
          },
          expected: { matched, ...(matched ? { action: expectedAction } : { action: 'none' }) },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || `Could not save scenario (HTTP ${response.status}).`)
      setScenarioName('')
      setTestNotice(isRTL ? 'تم حفظ سيناريو الاختبار بنجاح.' : 'Test scenario saved successfully.')
      await loadBotRules()
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not save this scenario.')
    } finally {
      setTestBusy(false)
    }
  }

  // Run test suite
  const runSuite = async () => {
    if (!selectedBotId || scenarios.length === 0) return
    setTestBusy(true)
    setTestError('')
    setTestNotice('')
    setSuite(null)
    try {
      const response = await fetch(`${API}/social-comments/scenarios/run`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
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

  // Delete scenario
  const deleteScenario = async (scenarioId: number) => {
    setTestBusy(true)
    setTestError('')
    try {
      const response = await fetch(`${API}/social-comments/scenarios/${scenarioId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || `Could not delete scenario (HTTP ${response.status}).`)
      await loadBotRules()
    } catch (cause) {
      setTestError(cause instanceof Error ? cause.message : 'Could not delete this scenario.')
    } finally {
      setTestBusy(false)
    }
  }

  // Load incoming comments
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ per_page: '50', status, page: String(page) })
        if (platform !== 'all') params.set('platform', platform)
        if (search.trim()) params.set('search', search.trim())
        const response = await fetch(`${API}/social-comments?${params}`, {
          headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...getBusinessHeaders() },
        })
        const body = (await response.json().catch(() => ({}))) as CommentsResponse & { message?: string }
        if (!response.ok) throw new Error(body.message || `Could not load comments (HTTP ${response.status}).`)
        const rows = Array.isArray(body.data) ? body.data : []
        setComments(rows)
        const defaults = { total: 0, replied: 0, skipped: 0, cancelled: 0, failed: 0, retryable: 0, pending: 0, needs_attention: 0 }
        setStats({ ...defaults, ...(body.stats || {}), total: body.total || 0 })
        setLastPage(body.last_page || 1)
        setSelectedId((current) => (rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not load comments.')
        if (!silent) setComments([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [page, platform, search, status]
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load(true)
    }, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  // Tabs configuration
  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: 'comments',
        label: isRTL ? 'التعليقات الواردة' : 'Comments Inbox',
        icon: <MessageSquare size={14} />,
        count: stats.total > 0 ? stats.total : undefined,
      },
      {
        id: 'rules',
        label: isRTL ? 'قواعد الأتمتة' : 'Automation Rules',
        icon: <ShieldCheck size={14} />,
        count: rules.length > 0 ? rules.length : undefined,
      },
      {
        id: 'test-center',
        label: isRTL ? 'مركز الاختبار' : 'Test Center',
        icon: <FlaskConical size={14} />,
        count: scenarios.length > 0 ? scenarios.length : undefined,
      },
    ],
    [isRTL, stats.total, rules.length, scenarios.length]
  )

  return (
    <main
      className="mx-auto h-full max-w-[1520px] space-y-6 overflow-y-auto p-4 md:p-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Calm, Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {isRTL ? 'مركز التعليقات والردود الآلية' : 'Comments Workspace'}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
              <SlidersHorizontal size={11} />
              {isRTL ? 'نشط' : 'Active'}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-relaxed">
            {isRTL
              ? 'تابع تعليقات فيسبوك وإنستغرام الواردة، واضبط قواعد الردود الذكية، واختبر موثوقيتها بأمان.'
              : 'Review incoming customer comments from connected pages, manage automated reply rules, and test automation.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-xs font-medium text-text-primary transition hover:bg-surface-elevated disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{isRTL ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Tabs Navigation */}
      <div>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'comments' | 'rules' | 'test-center')}
          variant="segmented"
          size="md"
        />
      </div>

      {/* Global Error Banner */}
      {error && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-xs text-error">
          {error}
        </div>
      )}

      {/* 3. Tab Views */}
      {activeTab === 'comments' && (
        <CommentsInbox
          comments={comments}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          stats={stats}
          platform={platform}
          setPlatform={setPlatform}
          status={status}
          setStatus={setStatus}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          lastPage={lastPage}
          loading={loading}
          isRTL={isRTL}
        />
      )}

      {activeTab === 'rules' && (
        <CommentRulesManager
          bots={bots}
          selectedBotId={selectedBotId}
          setSelectedBotId={setSelectedBotId}
          ruleChannels={ruleChannels}
          selectedChannelId={selectedChannelId}
          setSelectedChannelId={setSelectedChannelId}
          rules={rules}
          setRules={setRules}
          ruleBusy={ruleBusy}
          ruleNotice={ruleNotice}
          saveRules={saveRules}
          isRTL={isRTL}
          onToggleChannelEnabled={handleToggleChannelEnabled}
        />
      )}

      {activeTab === 'test-center' && (
        <CommentTestCenter
          bots={bots}
          selectedBotId={selectedBotId}
          setSelectedBotId={setSelectedBotId}
          ruleChannels={ruleChannels}
          selectedChannelId={selectedChannelId}
          setSelectedChannelId={setSelectedChannelId}
          scenarios={scenarios}
          scenarioName={scenarioName}
          setScenarioName={setScenarioName}
          scenarioText={scenarioText}
          setScenarioText={setScenarioText}
          scenarioPostId={scenarioPostId}
          setScenarioPostId={setScenarioPostId}
          expectedMatch={expectedMatch}
          setExpectedMatch={setExpectedMatch}
          expectedAction={expectedAction}
          setExpectedAction={setExpectedAction}
          simulation={simulation}
          suite={suite}
          testBusy={testBusy}
          testError={testError}
          testNotice={testNotice}
          runSimulation={runSimulation}
          saveScenario={saveScenario}
          runSuite={runSuite}
          deleteScenario={deleteScenario}
          isRTL={isRTL}
        />
      )}
    </main>
  )
}
