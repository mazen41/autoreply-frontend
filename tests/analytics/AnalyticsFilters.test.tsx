import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../lib/businessContext', () => ({
  getBusinessHeaders: () => ({ 'X-Business-Id': '7' }),
  getSelectedBusinessId: () => '7',
}))

import AnalyticsPage from '../../app/dashboard/analytics/page'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('analytics filters', () => {
  it('loads account and bot options and applies both to analytics requests', async () => {
    document.cookie = 'naz_token=test-token'
    const requestedUrls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      requestedUrls.push(url)
      if (url.endsWith('/api/channels')) {
        return { ok: true, status: 200, json: async () => ({ data: [{ id: 12, type: 'shopify', page_name: 'Egypt Store' }] }) }
      }
      if (url.endsWith('/api/bots')) {
        return { ok: true, status: 200, json: async () => ({ bots: [{ id: 5, name: 'Sales Bot' }] }) }
      }
      if (url.includes('/analytics/csat')) {
        return { ok: true, status: 200, json: async () => ({ csat_score: 75, total_ratings: 4, positive_ratings: 3, negative_ratings: 1 }) }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ conversations: { total: 1 }, ai: { ai_share_of_replies: 100 } }),
      }
    }))

    render(<AnalyticsPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Egypt Store' })).toBeTruthy())
    fireEvent.change(screen.getByLabelText('Connected account'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('Bot'), { target: { value: '5' } })

    await waitFor(() => expect(requestedUrls.some((url) => url.includes('channel_id=12') && url.includes('bot_id=5'))).toBe(true))
    await waitFor(() => expect(requestedUrls.some((url) => url.includes('/analytics/csat?') && url.includes('channel_id=12') && url.includes('bot_id=5'))).toBe(true))
    expect(await screen.findByText('75%')).toBeTruthy()
    expect(screen.getByText('Positive rating share')).toBeTruthy()
  })
})
