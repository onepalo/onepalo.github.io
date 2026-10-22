import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assignReserveMission } from './backupSimulation'
import { OfficeVisitors } from './OfficeVisitors'

let nextFrame: FrameRequestCallback

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
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    nextFrame = callback
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('office reserve visitors', () => {
  it('animates the trip using the shared simulation clock and disappears only after returning', () => {
    const visits = assignReserveMission([], 'data-rescue', 0, 0)
    const clock = { current: 0 }
    const { container, rerender } = render(<OfficeVisitors visits={visits} clock={clock} isRunning />)
    expect(screen.getByRole('img', { name: 'Temporary reserve visitors: Ada' })).toBeTruthy()
    expect(container.querySelector('.office-visitor')?.getAttribute('data-phase')).toBe('outbound')
    const setTime = (time: number) => act(() => {
      clock.current = time
      nextFrame(0)
    })
    setTime(visits[0].travelMs)
    expect(container.querySelector('.office-visitor')?.getAttribute('data-phase')).toBe('working')
    rerender(<OfficeVisitors visits={visits} clock={clock} isRunning={false} />)
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1)
    expect(container.querySelector('.office-visitor')?.getAttribute('data-phase')).toBe('working')
    rerender(<OfficeVisitors visits={visits} clock={clock} isRunning />)
    setTime(visits[0].travelMs + visits[0].workMs)
    expect(container.querySelector('.office-visitor')?.getAttribute('data-phase')).toBe('returning')
    setTime(visits[0].travelMs * 2 + visits[0].workMs)
    expect(container.querySelector('.office-visitors')).toBeNull()
  })

  it('renders a stationary visitor and a fixed sprite frame for reduced motion', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      ...window.matchMedia('(prefers-reduced-motion: reduce)'),
      matches: true,
    })
    const visits = assignReserveMission([], 'decision-brief', 2, 0)
    const clock = { current: 0 }
    const { container } = render(<OfficeVisitors visits={visits} clock={clock} isRunning />)
    const destination = visits[0].path[visits[0].path.length - 1]
    expect(container.querySelector('.office-visitor')?.getAttribute('transform')).toBe(`translate(${destination.x} ${destination.y})`)
    expect(container.querySelector('image')?.getAttribute('x')).toBe('-32')
  })

  it('reports missing guest images visibly without replacing the office scene', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const visits = assignReserveMission([], 'seismic-clue', 1, 0)
    const { container } = render(<OfficeVisitors visits={visits} clock={{ current: 0 }} isRunning />)
    fireEvent.error(container.querySelector('image')!)
    expect(screen.getByRole('alert').textContent).toContain('A reserve visitor sprite could not load')
    expect(error).toHaveBeenCalledOnce()
    expect(container.querySelector('.office-visitor')).toBeTruthy()
  })

  it('allocates no animation frames when there are no missions', () => {
    const { container } = render(<OfficeVisitors visits={[]} clock={{ current: 0 }} isRunning />)
    expect(container.childElementCount).toBe(0)
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })
})
