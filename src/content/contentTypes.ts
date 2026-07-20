export type ExperienceId = 'home' | 'cover' | 'journey' | 'leadership' | 'impact'

export interface HeroContent {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
}

export interface World {
  id: Exclude<ExperienceId, 'home'>
  title: string
  shortTitle: string
  description: string
  accentColor: string
  visualHint: string
}

export interface JourneyItem {
  title: string
  discipline: 'Digital' | 'Geo'
  countryCodes: Array<'us' | 'nl' | 'ng' | 'qa' | 've' | 'co' | 'mx'>
  location: string
  period: string
  organization: string
  teaser: string
  summary: string
  capabilities: string[]
  evidence: string[]
  learningCore: string
  reference?: {
    name: string
    role: string
  }
}

export interface JourneyCvProfile {
  digitalCore: string
  subsurfaceDomain: string
  achievements: string[]
  education: string
  references: Array<{ name: string; role: string }>
}

export interface FeaturedProject {
  title: string
  businessMoment: string
  collaboration: string
  outcome: string
  aiInPractice: string
}

export interface ThinkingNode {
  id: string
  title: string
  description: string
  example: string
  order: number
}

export interface IntegrationNode {
  id: string
  label: string
  description: string
  connectionType: string
  x: number
  y: number
}

export interface LeadershipProof {
  theme: string
  title: string
  description: string
  logoSrc?: string
  logoAlt?: string
  references?: Array<{
    label: string
    url: string
  }>
}

export interface LeadershipPillar {
  title: string
  statement: string
}

export interface LeadershipRhythm {
  cadence: string
  title: string
  description: string
}

export interface LeadershipSignal {
  title: string
  description: string
}