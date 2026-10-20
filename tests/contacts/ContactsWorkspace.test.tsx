import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../lib/businessContext', () => ({ getSelectedBusinessId: () => 7 }))

import ContactsPage from '../../app/dashboard/contacts/page'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('contacts workspace', () => {
  it('keeps pagination on the selected page instead of resetting after load', async () => {
    document.cookie = 'naz_token=test-token'
    const requestedPages: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/customers?')) {
        const parsed = new URL(url)
        const page = parsed.searchParams.get('page') || '1'
        requestedPages.push(page)
        const name = page === '2' ? 'Second contact' : 'First contact'
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{
              id: Number(page), name, phone: null, email: null, avatar: null, tags: [], lead_score: 0,
              custom_fields: {}, conversations_count: 0, conversations_max_last_message_at: null,
              created_at: '2026-10-20T00:00:00Z',
            }],
            current_page: Number(page), last_page: 2,
          }),
        }
      }
      if (url.endsWith('/api/channels')) return { ok: true, status: 200, json: async () => [] }
      if (url.endsWith('/api/customers/assignees')) return { ok: true, status: 200, json: async () => ({ assignees: [] }) }
      throw new Error(`Unexpected request: ${url}`)
    }))

    render(<ContactsPage />)
    expect(await screen.findByText('First contact')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Next|التالي/ }))

    expect(await screen.findByText('Second contact')).toBeTruthy()
    await waitFor(() => expect(requestedPages.at(-1)).toBe('2'))
  })

  it('saves a contact assignee selected from the active business team', async () => {
    document.cookie = 'naz_token=test-token'
    const contact = {
      id: 1, name: 'First contact', phone: null, email: null, avatar: null, tags: [], lead_score: 0,
      assigned_to: null, custom_fields: {}, conversations_count: 0, conversations_max_last_message_at: null,
      created_at: '2026-10-20T00:00:00Z',
    }
    const requests: Array<{url:string;init?:RequestInit}> = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?:RequestInit) => {
      const url = String(input)
      requests.push({url,init})
      if (url.includes('/api/customers?')) return { ok: true, status: 200, json: async () => ({ data: [contact], current_page: 1, last_page: 1 }) }
      if (url.endsWith('/api/channels')) return { ok: true, status: 200, json: async () => [] }
      if (url.endsWith('/api/customers/assignees')) return { ok: true, status: 200, json: async () => ({ assignees: [{id:9,name:'Team agent',role:'agent'}] }) }
      if (url.endsWith('/api/customers/1') && init?.method === 'PATCH') return { ok: true, status: 200, json: async () => ({customer:{...contact,assigned_to:9}}) }
      if (url.endsWith('/api/customers/1')) return { ok: true, status: 200, json: async () => ({
        customer: {...contact,conversations:[],notes:[]}, orders:[],consents:[],comments:[],
      }) }
      throw new Error(`Unexpected request: ${url}`)
    }))

    render(<ContactsPage />)
    fireEvent.click(await screen.findByText('First contact'))
    const assigneeOption = await screen.findByRole('option', {name:'Team agent · agent'})
    const assigneeSelect = assigneeOption.closest('select')
    if (!assigneeSelect) throw new Error('Assignee option is not inside a select')
    fireEvent.change(assigneeSelect, {target:{value:'9'}})
    fireEvent.click(screen.getByRole('button', {name:/Save profile|حفظ الملف/}))

    await waitFor(() => {
      const patchRequest = requests.find(request => request.url.endsWith('/api/customers/1') && request.init?.method === 'PATCH')
      expect(JSON.parse(String(patchRequest?.init?.body)).assigned_to).toBe(9)
    })
  })
})
