import type { ExperienceId } from '../content/contentTypes'

const experiences: ExperienceId[] = ['home', 'cover', 'how-i-work', 'leadership', 'journey', 'impact', 'campaign']

export function experienceFromHash(hash: string): ExperienceId {
  const candidate = hash.replace('#', '')
  if (candidate === 'testimonial') return 'how-i-work'
  return experiences.find((experience) => experience === candidate) ?? 'home'
}

export function hashForExperience(experience: ExperienceId): string {
  if (experience === 'home') return '#'
  return experience === 'how-i-work' ? '#testimonial' : `#${experience}`
}