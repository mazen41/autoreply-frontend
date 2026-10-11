import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import BotWizardModal from '../../components/bots/BotWizardModal'
import { translations } from '../../lib/i18n'

const copy = translations.ar.botWizard

const connectedAccounts = [
  { id: 101, type: 'salla', page_id: 'salla-shop', page_name: 'Salla Boutique', status: 'connected', bots: [] },
  { id: 102, type: 'shopify', page_id: 'shopify-store', page_name: 'Shopify Store', status: 'connected', bots: [] },
  { id: 103, type: 'facebook', page_id: 'fb-page', page_name: 'Facebook Page', status: 'connected', bots: [] },
  { id: 104, type: 'instagram', page_id: 'ig-account', page_name: 'Instagram Account', status: 'connected', bots: [] },
]

function mockChannels(data = connectedAccounts) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes('/api/channels')) {
      return { ok: true, json: async () => ({ data }) } as Response
    }
    return { ok: true, json: async () => ({ files: [], profile: {} }) } as Response
  }))
}

function openChannelStep(container: HTMLElement) {
  const stepButton = container.querySelector<HTMLButtonElement>('[data-step="2"]')
  if (!stepButton) throw new Error('Channel mapping step button not found')
  fireEvent.click(stepButton)
}

describe('BotWizardModal channel mapping', () => {
  beforeEach(() => {
    document.cookie = 'naz_token=test-token; path=/'
    mockChannels()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps commerce stores out of the communication channel grid', async () => {
    const { container } = render(<BotWizardModal bot={{ id: 4, name: 'Sales', ai_instructions: 'Helpful bot instructions' }} onClose={vi.fn()} onSaved={vi.fn()} />)
    await waitFor(() => expect(screen.queryByText(copy.loading)).toBeNull())
    openChannelStep(container)

    await waitFor(() => expect(container.querySelector('#channels-heading')).not.toBeNull())
    const channelHeading = container.querySelector('#channels-heading')
    if (!channelHeading) throw new Error('Channel mapping heading not found')
    const channelSection = channelHeading.closest('section')
    if (!channelSection) throw new Error('Channel mapping section not found')
    const channelGrid = within(channelSection)
    expect(channelGrid.getAllByText('Facebook Page').length).toBeGreaterThan(0)
    expect(channelGrid.getAllByText('Instagram Account').length).toBeGreaterThan(0)
    expect(channelGrid.queryByText('Salla Boutique')).toBeNull()
    expect(channelGrid.queryByText('Shopify Store')).toBeNull()
    expect(screen.getByText('Salla Boutique')).not.toBeNull()
  })

  it('clears a legacy store primary assignment and shows the notice', async () => {
    mockChannels([
      { ...connectedAccounts[0], bots: [] },
      connectedAccounts[2],
    ])
    const bot = {
      id: 5,
      name: 'Legacy bot',
      ai_instructions: 'Helpful bot instructions',
      channels: [{ id: 101, type: 'salla', page_name: 'Salla Boutique', pivot: { is_primary: true } }],
    }
    const { container } = render(<BotWizardModal bot={bot} onClose={vi.fn()} onSaved={vi.fn()} />)
    await screen.findByText(copy.stalePrimary)
    openChannelStep(container)

    await waitFor(() => expect(container.querySelector('#channels-heading')).not.toBeNull())
    const channelHeading = container.querySelector('#channels-heading')
    if (!channelHeading) throw new Error('Channel mapping heading not found')
    const channelSection = channelHeading.closest('section')
    if (!channelSection) throw new Error('Channel mapping section not found')
    expect(within(channelSection).queryByText('Salla Boutique')).toBeNull()
    expect(within(channelSection).getAllByText('Facebook Page').length).toBeGreaterThan(0)
  })
})
