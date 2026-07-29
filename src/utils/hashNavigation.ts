import type { ExperienceId } from '../content/contentTypes'

const experiences: ExperienceId[] = ['home', 'cover', 'how-i-work', 'leadership', 'journey', 'impact', 'campaign']

export function experienceFromHash(hash: string): ExperienceId {
  const candidate = hash.replace('#', '') as ExperienceId
  return experiences.includes(candidate) ? candidate : 'home'
}

export function hashForExperience(experience: ExperienceId): string {
  return experience === 'home' ? '#' : `#${experience}`
}