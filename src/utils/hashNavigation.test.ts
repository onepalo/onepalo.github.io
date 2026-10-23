import { describe, expect, it } from 'vitest'
import { experienceFromHash, hashForExperience, hashForTestimonial, testimonialSlugFromHash } from './hashNavigation'
import type { ExperienceId } from '../content/contentTypes'

describe('hash navigation', () => {
  it.each<ExperienceId>(['home', 'cover', 'journey', 'impact', 'campaign', 'ai-operations'])('round trips %s', (experience) => {
    expect(experienceFromHash(hashForExperience(experience))).toBe(experience)
  })

  it.each(['#how-i-work', '#testimonial', '#testimonial/'])('routes legacy testimonial link %s to Why Me', (hash) => {
    expect(experienceFromHash(hash)).toBe('cover')
  })

  it('parses a direct recommendation link', () => {
    const hash = hashForTestimonial('manuel-poupon')
    expect(experienceFromHash(hash)).toBe('cover')
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