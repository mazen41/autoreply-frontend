import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../lib/businessContext', () => ({ getBusinessHeaders: () => ({ 'X-Business-Id': '7' }) }))

import CasesPage from '../../app/dashboard/cases/page'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('cases workspace', () => {
  it('creates a case, links a conversation, and adds an internal note', async () => {
    document.cookie = 'naz_token=test-token'
    const savedCase = {
      id: 15, case_number: 'CASE-ABC123', subject: 'Delivery issue', description: null,
      status: 'open', priority: 'normal', conversation_id: 9,
      conversation: { id: 9, sender_name: 'Mazen', sender_id: 'contact-9', channel: { type: 'facebook' } },
      comments: [],
    }
    let commentSaved = false
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/cases/options')) return { ok: true, json: async () => ({ conversations: [{ id: 9, label: 'Mazen · Conversation #9' }], orders: [] }) }
      if (url.endsWith('/api/cases') && init?.method === 'POST') return { ok: true, status: 201, json: async () => ({ case: savedCase }) }
      if (url.endsWith('/api/cases/15/comments')) { commentSaved = true; return { ok: true, status: 201, json: async () => ({ comment: { body: 'Checking delivery' } }) } }
      if (url.endsWith('/api/cases/15')) return { ok: true, json: async () => ({ case: { ...savedCase, comments: commentSaved ? [{ id: 1, body: 'Checking delivery', created_at: new Date().toISOString(), author: { name: 'Agent' } }] : [] } }) }
      if (url.includes('/api/cases?')) return { ok: true, json: async () => ({ data: commentSaved ? [{ ...savedCase, comments_count: 1 }] : [] }) }
      return { ok: true, json: async () => ({}) }
    }))

    render(<CasesPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Mazen · Conversation #9' })).toBeTruthy())
    fireEvent.change(screen.getByPlaceholderText('Subject'), { target: { value: 'Delivery issue' } })
    fireEvent.change(screen.getByDisplayValue('Link a conversation (optional)'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: /Create case/i }))
    await screen.findByText('CASE-ABC123')
    fireEvent.change(screen.getByLabelText('Internal note'), { target: { value: 'Checking delivery' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add internal note' }))
    expect(await screen.findByText('Checking delivery')).toBeTruthy()
  })
})
