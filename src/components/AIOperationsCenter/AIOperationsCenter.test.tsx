import { createRef } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AIOperationsCenter } from './AIOperationsCenter'

vi.mock('./characterLooks', async (importOriginal) => ({
  ...await importOriginal<typeof import('./characterLooks')>(),
  buildCharacterSheets: vi.fn(() => new Promise<HTMLCanvasElement[]>(() => {})),
}))

vi.mock('pixi.js', () => ({
  Application: vi.fn(),
  Container: vi.fn(),
  Graphics: vi.fn(),
  Rectangle: vi.fn(),
  Sprite: vi.fn(),
  Text: vi.fn(),
  TextStyle: vi.fn(),
  Texture: vi.fn(),
  TilingSprite: vi.fn(),
}))

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  })))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('office simulation controls', () => {
  it('keeps the floor and lounge pause indicators consistent through pause, resume, and reset', async () => {
    const user = userEvent.setup()
    render(<AIOperationsCenter headingRef={createRef<HTMLHeadingElement>()} onNavigate={vi.fn()} />)
    const floor = screen.getByRole('region', { name: 'AI agent rooms map' })
    expect(within(floor).getByText('LIVE SIMULATION')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Pause simulation' }))
    expect(within(floor).getByText('SIMULATION PAUSED')).toBeTruthy()
    expect(screen.getByText('LOUNGE PAUSED')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Resume lounge and simulation' }))
    expect(within(floor).getByText('LIVE SIMULATION')).toBeTruthy()
    expect(screen.getByText('LOUNGE OPEN')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Pause simulation' }))
    await user.click(screen.getByRole('button', { name: 'Reset simulation' }))
    expect(within(floor).getByText('LIVE SIMULATION')).toBeTruthy()
    expect(screen.getByText('LOUNGE OPEN')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pause simulation' })).toBeTruthy()
  })
})
