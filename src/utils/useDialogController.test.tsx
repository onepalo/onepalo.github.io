import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useDialogController } from './useDialogController'

function DialogHarness() {
  const [isOpen, setIsOpen] = useState(false)
  const initialFocusRef = useDialogController<HTMLButtonElement>(isOpen, () => setIsOpen(false))
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open dialog</button>
      <button>Background action</button>
      {isOpen && <section role="dialog" aria-modal="true" aria-label="Test dialog">
        <button ref={initialFocusRef} onClick={() => setIsOpen(false)}>Close dialog</button>
        <button disabled>Disabled action</button>
        <button>Last action</button>
      </section>}
    </>
  )
}

afterEach(cleanup)

describe('dialog focus controller', () => {
  it('focuses the close button and wraps Tab in both directions', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const dialog = within(screen.getByRole('dialog'))
    const first = dialog.getByRole('button', { name: 'Close dialog' })
    const last = dialog.getByRole('button', { name: 'Last action' })
    expect(document.activeElement).toBe(first)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(last)
    await user.tab()
    expect(document.activeElement).toBe(first)
    await user.tab()
    expect(document.activeElement).toBe(last)
  })

  it('recovers escaped focus and restores the opener after Escape', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    const opener = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(opener)
    screen.getByRole('button', { name: 'Background action' }).focus()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })
})