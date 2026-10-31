import type { ExperienceId } from '../content/contentTypes'

const experiences: ExperienceId[] = ['home', 'cover', 'journey', 'impact', 'campaign']

export function experienceFromHash(hash: string): ExperienceId {
  const candidate = hash.replace('#', '')
  if (candidate === 'how-i-work' || candidate === 'testimonial' || candidate.startsWith('testimonial/')) return 'cover'
  return experiences.find((experience) => experience === candidate) ?? 'home'
}

export function hashForExperience(experience: ExperienceId): string {
  if (experience === 'home') return '#'
  return `#${experience}`
}

export function testimonialSlugFromHash(hash: string): string | null {
  const prefix = '#testimonial/'
  if (!hash.startsWith(prefix)) return null
  return hash.slice(prefix.length) || null
}

export function hashForTestimonial(slug: string): string {
  return `#testimonial/${slug}`
}