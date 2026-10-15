import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CommentsPage from '../../app/dashboard/comments/page'

describe('comment automation trust center', () => {
  let request: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.cookie = 'naz_token=test-token; path=/'
    request = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/api/bots')) return { ok: true, json: async () => ({ bots: [{ id: 1, name: 'Test bot', status: 'active' }] }) } as Response
      if (url.endsWith('/api/channels')) return { ok: true, json: async () => ({ data: [{ id: 11, type: 'facebook', page_name: 'Test page', status: 'connected' }] }) } as Response
      if (url.endsWith('/api/bots/1/comment-automation')) return { ok: true, json: async () => ({ channels: [{ id: 11, type: 'facebook', name: 'Test page', status: 'connected', enabled: true, public_reply_enabled: true, settings: { trigger_keywords: ['price'], fallback_response: 'Thanks' } }] }) } as Response
      if (url.includes('/api/social-comments/scenarios?')) return { ok: true, json: async () => ({ data: [] }) } as Response
      if (url.includes('/api/social-comments?')) return { ok: true, json: async () => ({ data: [], current_page: 1, last_page: 1, total: 0, stats: { total: 0, replied: 0, needs_attention: 0 } }) } as Response
      if (url.endsWith('/api/social-comments/simulate')) return { ok: true, json: async () => ({
        dry_run: true,
        decision: { matched: true, reason: null, action: 'public', rule: { id: 'legacy', name: 'Legacy rule' }, matched_keywords: ['price'], excluded_keywords: [], delay_minutes: 0, permitted_actions: ['public'] },
        public_reply_preview: 'Thanks', preview_source: 'configured_fallback', private_reply_preview: null,
        diagnostics: { channel_connected: true, comment_webhook_status: 'unknown', private_reply_enabled: false, commerce_context: { status: 'unresolved' } },
      }) } as Response
      return { ok: true, json: async () => ({}) } as Response
    })
    vi.stubGlobal('fetch', request)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('uses the real dry-run endpoint and renders its decision without sending a reply', async () => {
    render(<CommentsPage />)
    const comment = await screen.findByLabelText('تعليق تجريبي')
    fireEvent.change(comment, { target: { value: 'What is the price?' } })
    const simulateButton = await screen.findByRole('button', { name: 'محاكاة القاعدة' })
    await waitFor(() => expect(simulateButton.disabled).toBe(false))
    fireEvent.click(simulateButton)

    await waitFor(() => expect(request.mock.calls.some(([url]) => String(url).endsWith('/api/social-comments/simulate'))).toBe(true))
    expect(await screen.findByText((content) => content.includes('تطابق: Legacy rule'))).toBeTruthy()
    expect(request).toHaveBeenCalledWith(expect.stringMatching(/\/api\/social-comments\/simulate$/), expect.objectContaining({ method: 'POST' }))
    expect(request.mock.calls.filter(([url]) => String(url).endsWith('/simulate'))).toHaveLength(1)
  })
})
