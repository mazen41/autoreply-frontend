import React, { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Modal from '../../components/ui/Modal'

function Harness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Open modal</button><Modal isOpen={open} onClose={() => setOpen(false)} title="Test dialog"><button>First action</button><button>Last action</button></Modal></>
}

describe('shared Modal accessibility', () => {
  it('names the dialog, traps keyboard focus, restores focus, and closes on Escape', async () => {
    const { container } = render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open modal' })
    opener.focus()
    fireEvent.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Test dialog' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' })))
    screen.getByRole('button', { name: 'Last action' }).focus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' }))
    screen.getByRole('button', { name: 'Close dialog' }).focus()
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Last action' }))

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
    await waitFor(() => expect(document.activeElement).toBe(opener))
    await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeNull(), { timeout: 500 })
  })

  it('keeps the caller supplied body overflow value after unmount', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = render(<Modal isOpen onClose={vi.fn()} ariaLabel="Custom dialog"><p>Content</p></Modal>)
    expect(screen.getByRole('dialog', { name: 'Custom dialog' })).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })
})
