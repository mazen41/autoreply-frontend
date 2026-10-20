import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const { listen, leave, privateChannel } = vi.hoisted(() => {
  const listen = vi.fn()
  const leave = vi.fn()
  const privateChannel = vi.fn(() => ({ listen }))
  return { listen, leave, privateChannel }
})

vi.mock('../../lib/AuthContext', () => ({ useAuth: () => ({ user: { id: 42 } }) }))
vi.mock('../../lib/echo', () => ({ getEcho: () => ({ private: privateChannel, leave }) }))

import NotificationCenter from '../../components/NotificationCenter'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('NotificationCenter', () => {
  it('loads notifications and subscribes to only the signed-in user private channel', async () => {
    vi.stubEnv('NEXT_PUBLIC_PUSHER_KEY', 'test-key')
    document.cookie = 'naz_token=test-token'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notifications: { data: [] }, unread_count: 0 }),
    }))

    render(<NotificationCenter />)

    await waitFor(() => expect(privateChannel).toHaveBeenCalledWith('user.42'))
    expect(listen).toHaveBeenCalledWith('.new-notification', expect.any(Function))
  })

  it('adds a received private notification and increments unread count once', async () => {
    vi.stubEnv('NEXT_PUBLIC_PUSHER_KEY', 'test-key')
    document.cookie = 'naz_token=test-token'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notifications: { data: [] }, unread_count: 0 }),
    }))

    render(<NotificationCenter />)
    await waitFor(() => expect(listen).toHaveBeenCalled())
    const onNotification = listen.mock.calls.at(-1)?.[1] as (notification: object) => void
    const notification = {
      id: 81,
      type: 'escalation',
      title: 'Needs attention',
      message: 'A conversation needs a human reply.',
      created_at: new Date().toISOString(),
    }

    onNotification(notification)
    onNotification(notification)

    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('Needs attention')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
  })
})
