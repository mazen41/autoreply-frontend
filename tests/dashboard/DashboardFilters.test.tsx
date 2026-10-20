import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../lib/businessContext', () => ({ getBusinessHeaders: () => ({ 'X-Business-Id': '7' }) }))

import DashboardPage from '../../app/dashboard/page'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('home dashboard filters', () => {
  it('applies selected channel and bot to KPI, chart, and inbox requests', async () => {
    document.cookie = 'naz_token=test-token'
    const requestedUrls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      requestedUrls.push(url)
      if (url.endsWith('/api/channels')) return { ok: true, json: async () => [{ id: 21, type: 'facebook', page_name: 'Facebook Page', status: 'connected' }] }
      if (url.endsWith('/api/bots')) return { ok: true, json: async () => ({ bots: [{ id: 31, name: 'Sales Bot' }] }) }
      if (url.includes('/api/reports/daily-messages')) return { ok: true, json: async () => ({ data: [1], dates: ['2026-10-20'] }) }
      if (url.includes('/api/reports/ai-performance')) return { ok: true, json: async () => ({ auto_replies: 1, ai_share_of_replies: 100, median_response_time_formatted: '2s' }) }
      if (url.includes('/api/stats')) return { ok: true, json: async () => ({ total_messages: 1 }) }
      if (url.includes('/api/inbox')) return { ok: true, json: async () => ({ data: [] }) }
      return { ok: true, json: async () => ({}) }
    }))

    render(<DashboardPage />)
    await screen.findByRole('option', { name: 'Facebook Page' })
    await screen.findByRole('option', { name: 'Sales Bot' })
    fireEvent.change(screen.getByLabelText('Channel or connected account'), { target: { value: '21' } })
    fireEvent.change(screen.getByLabelText('Bot'), { target: { value: '31' } })

    await waitFor(() => {
      expect(requestedUrls.some(url => url.includes('/api/stats?') && url.includes('channel_id=21') && url.includes('bot_id=31'))).toBe(true)
      expect(requestedUrls.some(url => url.includes('/api/reports/daily-messages?') && url.includes('channel_id=21') && url.includes('bot_id=31'))).toBe(true)
      expect(requestedUrls.some(url => url.includes('/api/reports/ai-performance?') && url.includes('channel_id=21') && url.includes('bot_id=31'))).toBe(true)
      expect(requestedUrls.some(url => url.includes('/api/inbox?') && url.includes('channel_id=21') && url.includes('bot_id=31'))).toBe(true)
    })
  })
})
