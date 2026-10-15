import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommentsPage from '../../app/dashboard/comments/page'

describe('comments workspace redesign & automation trust center', () => {
  let request: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.cookie = 'naz_token=test-token; path=/'
    request = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/api/bots')) {
        return { ok: true, json: async () => ({ bots: [{ id: 1, name: 'Test bot', status: 'active' }] }) } as Response
      }
      if (url.endsWith('/api/channels')) {
        return { ok: true, json: async () => ({ data: [{ id: 11, type: 'facebook', page_name: 'Test page', status: 'connected' }] }) } as Response
      }
      if (url.endsWith('/api/bots/1/comment-automation')) {
        return {
          ok: true,
          json: async () => ({
            channels: [
              {
                id: 11,
                type: 'facebook',
                name: 'Test page',
                status: 'connected',
                enabled: true,
                public_reply_enabled: true,
                settings: { trigger_keywords: ['price'], fallback_response: 'Thanks' },
              },
            ],
          }),
        } as Response
      }
      if (url.includes('/api/social-comments/scenarios?')) {
        return { ok: true, json: async () => ({ data: [] }) } as Response
      }
      if (url.includes('/api/social-comments?')) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 101,
                platform: 'facebook',
                event_type: 'comment_created',
                comment_id: 'comment-101',
                commenter_id: 'cust-1',
                comment_text: 'Is this available?',
                created_at: new Date().toISOString(),
                status: 'processed',
                failure_code: null,
                failure_reason: null,
                bot: { id: 1, name: 'Test bot' },
                channel: { id: 11, type: 'facebook', page_name: 'Test page' },
                reply: { content: 'Yes, it is available!', source: 'comment_public_reply', created_at: new Date().toISOString() },
              },
            ],
            current_page: 1,
            last_page: 1,
            total: 1,
            stats: { total: 1, replied: 1, needs_attention: 0, pending: 0, skipped: 0, failed: 0, cancelled: 0, retryable: 0 },
          }),
        } as Response
      }
      if (url.endsWith('/api/social-comments/simulate')) {
        return {
          ok: true,
          json: async () => ({
            dry_run: true,
            decision: {
              matched: true,
              reason: null,
              action: 'public',
              rule: { id: 'legacy', name: 'Legacy rule' },
              matched_keywords: ['price'],
              excluded_keywords: [],
              delay_minutes: 0,
              permitted_actions: ['public'],
            },
            public_reply_preview: 'Thanks',
            preview_source: 'configured_fallback',
            private_reply_preview: null,
            diagnostics: {
              channel_connected: true,
              comment_webhook_status: 'unknown',
              private_reply_enabled: false,
              commerce_context: { status: 'unresolved' },
            },
          }),
        } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })
    vi.stubGlobal('fetch', request)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders comments inbox as default view and displays incoming comments with metrics', async () => {
    render(<CommentsPage />)

    // Check header & segmented tab buttons
    expect(await screen.findByText(/مركز التعليقات والردود الآلية|Comments Workspace/i)).toBeTruthy()
    expect((await screen.findAllByRole('button', { name: /التعليقات الواردة|Comments Inbox/i })).length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('button', { name: /قواعد الأتمتة|Automation Rules/i })).length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('button', { name: /مركز الاختبار|Test Center/i })).length).toBeGreaterThan(0)

    // Check incoming comment rendered in the inbox list and detail
    const commentNodes = await screen.findAllByText('Is this available?')
    expect(commentNodes.length).toBeGreaterThanOrEqual(1)
  })

  it('navigates seamlessly between Comments, Rules, and Test Center tabs', async () => {
    render(<CommentsPage />)

    // Navigate to Automation Rules tab
    const rulesButtons = await screen.findAllByRole('button', { name: /قواعد الأتمتة|Automation Rules/i })
    fireEvent.click(rulesButtons[0])
    expect(await screen.findByText(/إدارة قواعد التعليقات الآلية|Comment Automation Rules/i)).toBeTruthy()

    // Navigate to Test Center tab
    const testCenterButtons = await screen.findAllByRole('button', { name: /مركز الاختبار|Test Center/i })
    fireEvent.click(testCenterButtons[0])
    expect(await screen.findByText(/مركز اختبار موثوقية الأتمتة|Automation Test Center/i)).toBeTruthy()
  })

  it('executes real dry-run simulation and renders decision in Test Center without live sends', async () => {
    render(<CommentsPage />)

    // Switch to Test Center tab
    const testCenterButtons = await screen.findAllByRole('button', { name: /مركز الاختبار|Test Center/i })
    fireEvent.click(testCenterButtons[0])

    const commentInput = await screen.findByLabelText(/تعليق تجريبي|Synthetic comment/i)
    fireEvent.change(commentInput, { target: { value: 'What is the price?' } })

    const simulateButtons = await screen.findAllByRole('button', { name: /محاكاة القاعدة|Simulate rule/i })
    const simulateButton = simulateButtons[0] as HTMLButtonElement
    await waitFor(() => expect(simulateButton.disabled).toBe(false))
    fireEvent.click(simulateButton)

    await waitFor(() =>
      expect(request.mock.calls.some(([url]) => String(url).endsWith('/api/social-comments/simulate'))).toBe(true)
    )
    expect(await screen.findByText((content) => content.includes('Legacy rule'))).toBeTruthy()
    expect(request).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/social-comments\/simulate$/),
      expect.objectContaining({ method: 'POST' })
    )
    expect(request.mock.calls.filter(([url]) => String(url).endsWith('/simulate'))).toHaveLength(1)
  })
})
