import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useParams: () => ({ businessId: '7', slug: 'returns' }) }))

import PublicHelpCenterPage from '../../app/help/[businessId]/page'
import PublicHelpArticlePage from '../../app/help/[businessId]/[slug]/page'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('public Help Center', () => {
  it('shows only the published content returned by the public Help Center API', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/7')
      ? { ok: true, json: async () => ({ business: { name: 'Naz Store' }, articles: [{ id: 1, title: 'Returns', slug: 'returns', category: 'Orders', excerpt: 'How returns work' }] }) }
      : { ok: true, json: async () => ({ business: { name: 'Naz Store' }, article: { title: 'Returns', slug: 'returns', category: 'Orders', content: 'Contact the store within 14 days.', published_at: null } }) }))
    render(<PublicHelpCenterPage />)
    expect(await screen.findByText('How returns work')).toBeTruthy()
    render(<PublicHelpArticlePage />)
    await waitFor(() => expect(screen.getByText('Contact the store within 14 days.')).toBeTruthy())
  })
})
