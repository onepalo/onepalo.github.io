import { describe, expect, it } from 'vitest'
import { experienceFromHash, hashForExperience, hashForTestimonial, testimonialSlugFromHash } from './hashNavigation'
import type { ExperienceId } from '../content/contentTypes'

describe('hash navigation', () => {
  it.each<ExperienceId>(['home', 'cover', 'how-i-work', 'journey', 'impact', 'campaign', 'ai-operations'])('round trips %s', (experience) => {
    expect(experienceFromHash(hashForExperience(experience))).toBe(experience)
  })

  it('supports legacy testimonial links', () => {
    expect(experienceFromHash('#how-i-work')).toBe('how-i-work')
    expect(hashForExperience('how-i-work')).toBe('#testimonial')
  })

  it('parses a direct recommendation link', () => {
    const hash = hashForTestimonial('manuel-poupon')
    expect(experienceFromHash(hash)).toBe('how-i-work')
    expect(testimonialSlugFromHash(hash)).toBe('manuel-poupon')
  })

  it.each(['', '#', '#unknown'])('falls back to home for %s', (hash) => {
    expect(experienceFromHash(hash)).toBe('home')
    expect(testimonialSlugFromHash(hash)).toBeNull()
  })

  it.each(['#testimonial', '#testimonial/'])('does not open a recommendation for %s', (hash) => {
    expect(testimonialSlugFromHash(hash)).toBeNull()
  })
})