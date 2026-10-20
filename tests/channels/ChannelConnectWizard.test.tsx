import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ChannelConnectWizard, { ALL_CHANNELS } from '../../components/channels/ChannelConnectWizard'

afterEach(() => cleanup())

describe('supported channel connection wizard', () => {
  it('lists only integrations with implemented connection flows', () => {
    expect(ALL_CHANNELS.map((channel) => channel.id)).toEqual([
      'instagram',
      'facebook',
      'whatsapp',
      'telegram',
      'gmail',
      'salla',
      'shopify',
      'woocommerce',
    ])
  })

  it('routes the selected supported integration through the connection handler', async () => {
    const onContinueConnection = vi.fn().mockResolvedValue(undefined)
    render(
      <ChannelConnectWizard
        isOpen
        onClose={vi.fn()}
        onContinueConnection={onContinueConnection}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Shopify/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue setup' }))

    await waitFor(() => expect(onContinueConnection).toHaveBeenCalledOnce())
    expect(onContinueConnection.mock.calls[0][0].id).toBe('shopify')
    expect(screen.queryByText(/TikTok Direct Messages/i)).toBeNull()
  })
})
