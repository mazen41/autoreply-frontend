import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => navigation,
}))
vi.mock('../../lib/LangContext', () => ({ useLang: () => ({ isRTL: false, toggleLang: vi.fn() }) }))

describe('DashboardLayout authentication state', () => {
  beforeEach(() => {
    navigation.replace.mockReset()
    navigation.push.mockReset()
    document.cookie = 'naz_token=; max-age=0; path=/'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('redirects to login instead of rendering a fabricated user when no token exists', async () => {
    render(<DashboardLayout><div>Private dashboard content</div></DashboardLayout>)

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByText('Alexander Wright')).toBeNull()
    expect(screen.queryByText('Private dashboard content')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows a retryable unavailable state when account verification cannot reach the API', async () => {
    document.cookie = 'naz_token=test-token; path=/'
    vi.mocked(fetch).mockRejectedValue(new Error('network unavailable'))

    render(<DashboardLayout><div>Private dashboard content</div></DashboardLayout>)

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
    expect(screen.queryByText('Private dashboard content')).toBeNull()
    expect(screen.queryByText('Alexander Wright')).toBeNull()
  })
})
