import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { ExperienceStage } from '../components/ExperienceStage/ExperienceStage'
import { WorldNav } from '../components/WorldNav/WorldNav'
import App from './App'

const getCarousel = () => screen.getByRole('button', { name: 'Show next testimonial' }).closest<HTMLElement>('.testimonial-carousel')!

beforeEach(() => {
  window.history.replaceState(null, '', '#cover')
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

describe('story navigation', () => {
  it('offers AI Operations as a home planet instead of Testimonials', async () => {
    const user = userEvent.setup()
    const onOpenWorld = vi.fn()
    const { container } = render(<WorldNav onOpenWorld={onOpenWorld} />)
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Why Me?', 'Resume', 'AI Operations', 'Beyond',
    ])
    expect(container.querySelector('.world-ai-operations')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'AI Operations' }))
    expect(onOpenWorld).toHaveBeenCalledWith('ai-operations')
  })

  it('orders the tabs with AI Operations before Beyond', async () => {
    const user = userEvent.setup()
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(navigation).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Home', 'Why Me?', 'Resume', 'AI Operations', 'Beyond',
    ])
    await user.click(within(navigation).getByRole('button', { name: 'Beyond' }))
    expect(window.location.hash).toBe('#impact')
    expect(await screen.findByRole('heading', { name: 'Leadership beyond my role' })).toBeTruthy()
    expect(document.title).toBe("Beyond | Rafael's Exploration Journal")
  })

  it.each([
    ['journey', 'ai-operations'],
    ['impact', 'cover'],
  ] as const)('continues from %s to %s', async (experience, next) => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<ExperienceStage experience={experience} headingRef={createRef<HTMLHeadingElement>()} onNavigate={onNavigate} testimonialSlug={null} onOpenTestimonial={vi.fn()} onCloseTestimonial={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Continue the story' }))
    expect(onNavigate).toHaveBeenCalledWith(next)
  })
})

describe('testimonial navigation', () => {
  it('includes all recommendations beneath Why Me without a separate navigation tab', async () => {
    const user = userEvent.setup()
    render(<App />)
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(navigation).getAllByRole('button')).toHaveLength(5)
    expect(within(navigation).queryByRole('button', { name: 'Testimonial' })).toBeNull()
    expect(within(navigation).getByRole('button', { name: 'Why Me?' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('heading', { name: 'Why me. Why us.', level: 1 })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'What colleagues say', level: 2 })).toBeTruthy()
    const progress = getCarousel().querySelector('.testimonial-carousel-progress')!
    for (let index = 1; index <= 11; index += 1) {
      expect(progress.textContent).toBe(`${index} / 11`)
      await user.click(screen.getByRole('button', { name: 'Show next testimonial' }))
    }
    expect(progress.textContent).toBe('1 / 11')
    await user.click(screen.getByRole('button', { name: 'Continue the story' }))
    expect(window.location.hash).toBe('#journey')
    expect(await screen.findByRole('heading', { name: 'Resume', level: 1 })).toBeTruthy()
  })

  it.each(['#how-i-work', '#testimonial'])('opens legacy %s within Why Me', (hash) => {
    window.history.replaceState(null, '', hash)
    render(<App />)
    expect(window.location.hash).toBe('#cover')
    expect(screen.getByRole('heading', { name: 'What colleagues say' })).toBeTruthy()
    expect(document.title).toBe("Why Me | Rafael's Exploration Journal")
  })

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
    expect(window.location.hash).toBe('#cover')
  })

  it('keeps focus inside a directly linked recommendation after the heading timer', () => {
    vi.useFakeTimers()
    window.history.replaceState(null, '', '#testimonial/manuel-poupon')
    render(<App />)
    const closeButton = within(screen.getByRole('dialog', { name: 'Manuel Poupon' })).getByRole('button', { name: /Close recommendation/ })
    expect(screen.getByRole('button', { name: 'Why Me?' }).getAttribute('aria-current')).toBe('page')
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
    expect(window.location.hash).toBe('#cover')
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