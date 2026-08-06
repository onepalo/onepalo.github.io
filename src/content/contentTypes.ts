export type ExperienceId = 'home' | 'cover' | 'how-i-work' | 'journey' | 'leadership' | 'impact' | 'campaign'

export interface HeroContent {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
}

export interface World {
  id: Exclude<ExperienceId, 'home' | 'campaign'>
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
  platforms: string[]
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

export interface CampaignStoryAct {
  id: 'trace' | 'signal' | 'reach' | 'action'
  chapter: string
  title: string
  body: string
  reference?: {
    label: string
    url: string
  }
}

export interface CampaignStory {
  location: string
  eyebrow: string
  title: string
  lede: string
  acts: CampaignStoryAct[]
  closing: string
}

export interface LeadershipPillar {
  title: string
  statement: string
}