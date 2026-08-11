import type { ExperienceId } from '../content/contentTypes'

const experiences: ExperienceId[] = ['home', 'cover', 'how-i-work', 'leadership', 'journey', 'impact', 'campaign']

export function experienceFromHash(hash: string): ExperienceId {
  const candidate = hash.replace('#', '')
  if (candidate === 'testimonial' || candidate.startsWith('testimonial/')) return 'how-i-work'
  return experiences.find((experience) => experience === candidate) ?? 'home'
}

export function hashForExperience(experience: ExperienceId): string {
  if (experience === 'home') return '#'
  return experience === 'how-i-work' ? '#testimonial' : `#${experience}`
}

export function testimonialSlugFromHash(hash: string): string | null {
  const prefix = '#testimonial/'
  if (!hash.startsWith(prefix)) return null
  return hash.slice(prefix.length) || null
}

export function hashForTestimonial(slug: string): string {
  return `#testimonial/${slug}`
}