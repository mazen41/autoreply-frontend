import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CampaignsPage from '../../app/dashboard/campaigns/page'
import { LangProvider } from '../../lib/LangContext'

describe('campaigns workspace redesign & lifecycle management', () => {
  let request: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.cookie = 'naz_token=test-token; path=/'
    document.cookie = 'naz-lang=en; path=/'
    localStorage.setItem('naz_selected_business_id', '1')

    request = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/api/auth/user')) {
        return {
          ok: true,
          json: async () => ({ id: 1, email: 'test@example.com', current_business_id: 1 }),
        } as Response
      }

      if (url.includes('/api/businesses/1/campaigns/101/logs')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 1,
              campaign_id: 101,
              conversation_id: 501,
              status: 'sent',
              provider_message_id: 'wamid.123',
              error_message: null,
              sent_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              conversation: { id: 501, sender_name: 'Sara Customer' },
            },
          ],
        } as Response
      }

      if (url.includes('/api/businesses/1/campaigns')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 101,
              name: 'VIP Ramadan Discount',
              message: 'Hello {{name}}, enjoy 20% off with code RAMADAN!',
              status: 'sent',
              total_recipients: 150,
              sent_count: 148,
              delivered_count: 145,
              failed_count: 2,
              scheduled_at: null,
              sent_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              channel: { id: 11, type: 'whatsapp', page_name: '+966500000000', status: 'connected' },
            },
            {
              id: 102,
              name: 'Weekend Flash Sale',
              message: 'Flash sale starts tonight!',
              status: 'scheduled',
              total_recipients: 80,
              sent_count: 0,
              delivered_count: 0,
              failed_count: 0,
              scheduled_at: new Date(Date.now() + 86400000).toISOString(),
              sent_at: null,
              created_at: new Date().toISOString(),
              channel: { id: 11, type: 'whatsapp', page_name: '+966500000000', status: 'connected' },
            },
          ],
        } as Response
      }

      if (url.endsWith('/api/email-campaigns')) {
        return {
          ok: true,
          json: async () => ({ data: [] }),
        } as Response
      }

      if (url.endsWith('/api/channels')) {
        return {
          ok: true,
          json: async () => [
            { id: 11, type: 'whatsapp', page_name: '+966500000000', status: 'connected' },
          ],
        } as Response
      }

      if (url.includes('/api/businesses/1/campaigns/audience/preview')) {
        return {
          ok: true,
          json: async () => ({
            sender: { channel_id: 11, channel_type: 'whatsapp', account_name: '+966500000000', connected: true },
            total_matched: 120,
            eligible: 115,
            excluded: { messaging_window_expired: 5 },
            campaign_ready: true,
            configuration_reason: null,
            rechecked_at_delivery: true,
          }),
        } as Response
      }

      return { ok: true, json: async () => ({}) } as Response
    })

    vi.stubGlobal('fetch', request)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders campaigns workspace with lifecycle banner, orientation guide, and real KPIs', async () => {
    render(
      <LangProvider>
        <CampaignsPage />
      </LangProvider>
    )

    // Check title and lifecycle header
    expect(await screen.findByText('Marketing & Broadcast Campaigns')).toBeTruthy()
    expect(screen.getByText('Campaign Execution Lifecycle')).toBeTruthy()
    expect(screen.getByText('Messaging Systems Guide — Which tool fits your goal?')).toBeTruthy()

    // Real KPI metrics from the mock data (1 sent + 1 scheduled = 2 total, 1 scheduled, 148 sent messages)
    expect(await screen.findByText('VIP Ramadan Discount')).toBeTruthy()
    expect(screen.getByText('Weekend Flash Sale')).toBeTruthy()
    expect(screen.getAllByText('148').length).toBeGreaterThanOrEqual(1)
  })

  it('opens campaign detail drawer when a campaign card is clicked and fetches delivery logs', async () => {
    render(
      <LangProvider>
        <CampaignsPage />
      </LangProvider>
    )

    const campaignCard = await screen.findByText('VIP Ramadan Discount')
    fireEvent.click(campaignCard)

    // Drawer should open and show detail view
    expect(await screen.findByText('Recipient Delivery Logs')).toBeTruthy()
    expect(await screen.findByText('Sara Customer')).toBeTruthy()
    expect(screen.getByText('wamid.123')).toBeTruthy()
  })

  it('opens guided creation wizard and advances through steps', async () => {
    render(
      <LangProvider>
        <CampaignsPage />
      </LangProvider>
    )

    const createBtns = await screen.findAllByRole('button', { name: '+ Create Campaign' })
    fireEvent.click(createBtns[0])

    // Wizard modal opens at Step 1
    expect(await screen.findByText('Create New Broadcast Campaign')).toBeTruthy()
    expect(screen.getByText('Step 1: Campaign Details')).toBeTruthy()

    // Input campaign name
    const input = screen.getByPlaceholderText('e.g. VIP Summer Sale Announcement')
    fireEvent.change(input, { target: { value: 'New Test Broadcast' } })

    // Advance to Step 2
    const nextBtn = screen.getByRole('button', { name: 'Next Step' })
    fireEvent.click(nextBtn)

    expect(await screen.findByText('Step 2: Choose Sending Channel & Account')).toBeTruthy()
    expect(screen.getAllByText('+966500000000').length).toBeGreaterThanOrEqual(1)
  })
})
