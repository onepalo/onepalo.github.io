import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const getCarousel = () => screen.getByRole('button', { name: 'Show next testimonial' }).closest<HTMLElement>('.testimonial-carousel')!

beforeEach(() => {
  window.history.replaceState(null, '', '#testimonial')
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('testimonial navigation', () => {
  it('keeps the current slide and restores its opener when closing a recommendation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Show next testimonial' }))
    const carousel = getCarousel()
    const progress = carousel.querySelector('.testimonial-carousel-progress')?.textContent
    const opener = within(carousel).getByRole('button', { name: /Read full recommendation/ })
    await user.click(opener)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(window.location.hash).toMatch(/^#testimonial\/.+/)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Close recommendation/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(carousel.querySelector('.testimonial-carousel-progress')?.textContent).toBe(progress)
    expect(document.activeElement).toBe(opener)
    expect(window.location.hash).toBe('#testimonial')
  })

  it('keeps focus inside a directly linked recommendation after the heading timer', () => {
    vi.useFakeTimers()
    window.history.replaceState(null, '', '#testimonial/manuel-poupon')
    render(<App />)
    const closeButton = within(screen.getByRole('dialog', { name: 'Manuel Poupon' })).getByRole('button', { name: /Close recommendation/ })
    expect(document.activeElement).toBe(closeButton)
    act(() => vi.advanceTimersByTime(600))
    expect(document.activeElement).toBe(closeButton)
  })

  it('synchronizes the dialog with browser Back and Forward', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Read full recommendation/ }))
    const hash = window.location.hash
    window.history.back()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(window.location.hash).toBe('#testimonial')
    window.history.forward()
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(window.location.hash).toBe(hash)
  })

  it('selects a different linked recommendation without recreating the carousel', () => {
    render(<App />)
    const carousel = getCarousel()
    act(() => {
      window.history.pushState(null, '', '#testimonial/manuel-poupon')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('dialog', { name: 'Manuel Poupon' })).toBeTruthy()
    act(() => {
      window.history.pushState(null, '', '#testimonial/michael-oconnell')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('dialog', { name: "Michael O'Connell" })).toBeTruthy()
    expect(getCarousel()).toBe(carousel)
    expect(carousel.querySelector('footer strong')?.textContent).toBe("Michael O'Connell")
  })

  it('ignores unknown recommendation slugs without crashing', () => {
    window.history.replaceState(null, '', '#testimonial/unknown')
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(getCarousel()).toBeTruthy()
  })
})