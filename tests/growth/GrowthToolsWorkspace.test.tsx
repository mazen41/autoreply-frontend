import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(async () => 'data:image/png;base64,qr') } }))
vi.mock('../../lib/businessContext', () => ({ getBusinessHeaders: () => ({ 'X-Business-Id': '7' }), getSelectedBusinessId: () => 7 }))

import GrowthToolsPage from '../../app/dashboard/growth/page'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('growth tools workspace', () => {
  it('configures website chat and provides an embed link with QR and attribution reporting', async () => {
    document.cookie = 'naz_token=secret'
    const calls: Array<{ url: string; method: string; body?: string }> = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input); const method = init?.method || 'GET'
      calls.push({ url, method, body: init?.body as string | undefined })
      if (url.includes('/web-chat/attribution')) return { ok: true, json: async () => ({ total_sessions: 3, sources: [{ source: 'instagram', medium: 'social', campaign: 'launch', sessions: 3 }] }) }
      if (method === 'PUT') return { ok: true, json: async () => ({ enabled: true, allowed_domains: ['shop.example.com'] }) }
      return { ok: true, json: async () => ({ enabled: false, allowed_domains: [] }) }
    }))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => {}) } })

    render(<GrowthToolsPage />)
    expect(await screen.findByText('3 sessions')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Allowed website domains'), { target: { value: 'shop.example.com' } })
    fireEvent.click(screen.getByLabelText('Enable public website chat'))
    fireEvent.click(screen.getByRole('button', { name: 'Save setup' }))

    await waitFor(() => expect(calls.some((call) => call.method === 'PUT' && JSON.parse(call.body || '{}').enabled === true)).toBe(true))
    expect(await screen.findByText('3 sessions')).toBeTruthy()
    expect(screen.getByAltText('QR code for the attributed chat link')).toBeTruthy()
    expect(screen.getByLabelText('Website chat embed code').getAttribute('value') || (screen.getByLabelText('Website chat embed code') as HTMLTextAreaElement).value).toContain('embed=1')
  })
})
