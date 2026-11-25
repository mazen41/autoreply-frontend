import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../lib/businessContext', () => ({ getBusinessHeaders: () => ({ 'X-Business-Id': '7' }) }))
vi.mock('../../lib/LangContext', () => ({ useLang: () => ({ isRTL: false, lang: 'en' }) }))

import TrainingReview from '../../components/dashboard/TrainingReview'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('AI correction review approval labels', () => {
  it.each([
    ['faq', 'Added to FAQs for this business.'],
    ['knowledge', 'Saved as a knowledge file and indexing started.'],
    ['tone', 'Recorded for review. It does not change replies yet.'],
    ['general', 'Recorded for review. It does not change replies yet.'],
  ])('shows the approval effect for %s corrections', async (learningType, effect) => {
    document.cookie = 'naz_token=test-token'
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ corrections: [{
        id: 4,
        ai_draft: 'Example AI reply',
        human_correction: 'Reviewed reply',
        approved: false,
        learning_type: learningType,
        created_at: '2026-11-21T10:00:00Z',
        originalMessage: { content: 'Can I return order [REDACTED_ORDER_NUMBER]?' },
      }] }),
    })))
    const approve = vi.fn().mockResolvedValue(effect)

    render(<TrainingReview onApprove={approve} onReject={vi.fn().mockResolvedValue(undefined)} />)
    fireEvent.click(await screen.findByText('Example AI reply'))
    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Approve for training' })).toBeNull()
    if (learningType === 'faq') {
      expect(screen.getByText(/Customer question preview \(redacted\)/)).toBeTruthy()
      const question = screen.getByRole('textbox', { name: 'FAQ question (required)' })
      fireEvent.change(question, { target: { value: 'Can I return order #1234567?' } })
      expect(screen.getByText(/Can I return \[REDACTED_ORDER_NUMBER\]\?/)).toBeTruthy()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(effect))
    expect(approve).toHaveBeenCalledWith(4, learningType === 'faq' ? 'Can I return order #1234567?' : undefined)
  })
})
