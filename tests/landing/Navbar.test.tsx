import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import Navbar from '../../components/landing/Navbar'
import { LangProvider } from '../../lib/LangContext'
import { translations } from '../../lib/i18n'

const pathnameState = vi.hoisted(() => ({ value: '/' }))

vi.mock('next/navigation', () => ({ usePathname: () => pathnameState.value }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a> }))
vi.mock('next/image', () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
  const imgProps = { ...props }
  delete imgProps.priority
  // eslint-disable-next-line @next/next/no-img-element -- This is a test-only Next Image mock.
  return <img {...imgProps} alt={imgProps.alt ?? ''} />
} }))
vi.mock('../../lib/AuthContext', () => ({ useAuth: () => ({ user: null }) }))

describe('landing navbar mobile navigation', () => {
  beforeEach(() => {
    pathnameState.value = '/'
    document.body.style.overflow = ''
    document.cookie = 'naz-lang=ar; path=/'
  })
  afterEach(() => cleanup())

  it('keeps the menu open until a route change or Escape and restores body scrolling', async () => {
    const view = render(<LangProvider><Navbar /></LangProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'فتح القائمة' }))
    expect(await screen.findByRole('region', { name: 'قائمة التنقل' })).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(screen.getByRole('region', { name: 'قائمة التنقل' })).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('region', { name: 'قائمة التنقل' })).toBeNull())
    expect(document.body.style.overflow).toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'فتح القائمة' }))
    expect(await screen.findByRole('region', { name: 'قائمة التنقل' })).toBeTruthy()
    pathnameState.value = '/pricing'
    view.rerender(<LangProvider><Navbar /></LangProvider>)
    await waitFor(() => expect(screen.queryByRole('region', { name: 'قائمة التنقل' })).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('uses translated labels when switching from Arabic to English', async () => {
    render(<LangProvider><Navbar /></LangProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'فتح القائمة' }))
    await screen.findByRole('region', { name: 'قائمة التنقل' })
    const mobileMenu = screen.getByRole('region', { name: 'قائمة التنقل' })
    fireEvent.click(within(mobileMenu).getByRole('button', { name: 'EN' }))

    expect(await within(mobileMenu).findByRole('link', { name: translations.en.nav.commandCenter })).toBeTruthy()
    expect(document.documentElement.dir).toBe('ltr')
  })
})
