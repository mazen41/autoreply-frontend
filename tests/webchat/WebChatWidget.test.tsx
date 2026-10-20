import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../lib/LangContext', () => ({ useLang: () => ({ isRTL: false }) }))

import WebChatWidget from '../../components/webchat/WebChatWidget'

afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear() })

describe('public Web Chat widget', () => {
  it('creates a business-scoped visitor session and captures optional lead details', async () => {
    let sessionPayload: Record<string, unknown> = {}
    let sessionUrl = ''
    let sessionHeaders: HeadersInit | undefined
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/web-chat/sessions?business_id=')) {
        sessionUrl = String(input)
        sessionHeaders = init?.headers
        sessionPayload = JSON.parse(String(init?.body))
        return { ok: true, json: async () => ({ session_id: 'opaque-session-token' }) }
      }
      return { ok: true, json: async () => ({ messages: [] }) }
    }))

    render(<WebChatWidget businessId={7} />)
    fireEvent.click(screen.getByTitle('Chat'))
    fireEvent.change(screen.getByLabelText('Your name (optional)'), { target: { value: 'Mazen' } })
    fireEvent.change(screen.getByLabelText('Your email (optional)'), { target: { value: 'mazen@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start chat' }))

    await waitFor(() => expect(sessionPayload.business_id).toBe(7))
    expect(sessionPayload.visitor_name).toBe('Mazen')
    expect(sessionPayload.visitor_email).toBe('mazen@example.com')
    expect(sessionPayload.site_url).toBeTruthy()
    expect(sessionUrl).toContain('business_id=7')
    expect(sessionHeaders).not.toHaveProperty('Authorization')
    expect(window.localStorage.getItem('naz_web_chat_7')).toBe('opaque-session-token')
  })
})
