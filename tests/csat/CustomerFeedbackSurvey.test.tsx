import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useParams: () => ({ token: 'opaque-survey-token' }) }))

import CustomerFeedbackPage from '../../app/feedback/[token]/page'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('customer feedback survey', () => {
  it('accepts one response and supports opting out of future requests', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input); calls.push(url)
      if (url.endsWith('/response')) return { ok: true, json: async () => ({ success: true }) }
      if (url.endsWith('/opt-out')) return { ok: true, json: async () => ({ success: true }) }
      return { ok: true, json: async () => ({ active: true, business_name: 'Naz Store' }) }
    }))

    render(<CustomerFeedbackPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Good' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }))
    await waitFor(() => expect(screen.getByText('Thank you for your feedback.')).toBeTruthy())
    expect(calls.some((url) => url.endsWith('/response'))).toBe(true)

    cleanup()
    calls.length = 0
    render(<CustomerFeedbackPage />)
    fireEvent.click(await screen.findByText('Do not ask me for feedback again'))
    expect(await screen.findByText('Your preference is saved. We will not send you future feedback requests for this business.')).toBeTruthy()
    expect(calls.some((url) => url.endsWith('/opt-out'))).toBe(true)
  })
})
