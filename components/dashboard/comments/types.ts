export type CommentEvent = {
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
  decision_trace?: {
    rule?: { id?: string; name?: string } | null
    matched?: boolean
    matched_keywords?: string[]
    excluded_keywords?: string[]
    requested_action?: string
    permitted_actions?: string[]
    delay_minutes?: number
    reason?: string | null
    final_status?: string
    public_reply?: { status?: string; reason?: string | null; reply_id?: string | null }
  }
  channel?: { id: number; type: string; page_name?: string | null; page_id?: string | null }
  bot?: { id: number; name: string } | null
  reply?: { content: string; source: string; created_at: string } | null
}

export type CommentsResponse = {
  data: CommentEvent[]
  current_page: number
  last_page: number
  total: number
  stats: {
    total: number
    replied: number
    skipped: number
    cancelled: number
    failed: number
    retryable: number
    pending: number
    needs_attention: number
  }
}

export type BotOption = {
  id: number
  name: string
  status: string
  channels?: Array<{ id: number; type: string }>
}

export type CommentRule = {
  id: string
  name: string
  keywords: string[]
  excluded_keywords: string[]
  match: 'contains' | 'equals'
  action: 'public' | 'dm' | 'both'
  public_reply_variants: string[]
  dm_message?: string | null
  delay_minutes: number
  post_ids: string[]
  enabled: boolean
}

export type RuleChannel = {
  id: number
  type: string
  name?: string | null
  status: string
  enabled: boolean
  public_reply_enabled: boolean
  settings: Record<string, unknown>
}

export type Scenario = {
  id: number
  name: string
  input: {
    comment_text: string
    post_id?: string
    is_live_comment?: boolean
  }
  expected: Record<string, unknown>
}

export type SimulationResult = {
  dry_run: boolean
  decision: {
    matched: boolean
    reason: string | null
    action: string
    rule: { id: string; name: string } | null
    matched_keywords: string[]
    excluded_keywords: string[]
    delay_minutes: number
    permitted_actions: string[]
  }
  public_reply_preview: string | null
  preview_source: string | null
  diagnostics: {
    channel_connected: boolean
    comment_webhook_status: string
    private_reply_enabled: boolean
    commerce_context: { status: string; provider?: string; name?: string }
  }
}

export type SuiteResult = {
  summary: { total: number; passed: number; failed: number }
  results: Array<{
    scenario_id: number
    name: string
    passed: boolean
    expected: Record<string, unknown>
    actual: Record<string, unknown>
    diagnostic: string | null
  }>
}
