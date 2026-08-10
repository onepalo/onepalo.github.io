import type { CampaignStory, FeaturedProject, HeroContent, JourneyCvProfile, JourneyItem, LeadershipPillar, LeadershipProof, World } from './contentTypes'

export const heroContent: HeroContent = {
  eyebrow: 'Rafael Navarro / Manager - AI Embedment candidate',
  title: 'From subsurface decisions to AI-enabled workflows.',
  subtitle: 'The work I have delivered across geoscience, digital products, and AI, and how I would lead an AI Embedment team.',
  primaryCta: 'Explore the universe',
  secondaryCta: 'View evidence',
}

export const worlds: World[] = [
  { id: 'cover', title: 'Why Me?', shortTitle: 'Why Me?', description: 'Why this role is the natural next step in my career.', accentColor: '#2e6f95', visualHint: 'personal statement' },
  { id: 'leadership', title: 'How I Will Lead', shortTitle: 'Leadership', description: 'How I would build a team that puts useful AI into everyday technical work.', accentColor: '#42a5a5', visualHint: 'team compass' },
  { id: 'how-i-work', title: 'Testimonial', shortTitle: 'Testimonial', description: 'What colleagues have experienced working alongside me.', accentColor: '#b65f4a', visualHint: 'professional recommendations' },
  { id: 'journey', title: 'Resume', shortTitle: 'Resume', description: 'From field geophysics to global product and analytics delivery.', accentColor: '#d6a94a', visualHint: 'constellation route' },
  { id: 'impact', title: 'Leadership Beyond My Role', shortTitle: 'Beyond my role', description: 'Work I have led, built, and carried beyond my day job.', accentColor: '#e07a5f', visualHint: 'proof points' },
]

export const journeyItems: JourneyItem[] = [
  { title: 'Senior Advance Analyst Specialist', discipline: 'Digital', countryCodes: ['us'], location: 'United States', period: 'Jun 2025 - Present', organization: 'Shell US Hosting Company', teaser: 'Driving AI-enabled analytics adoption across subsurface workflows.', summary: 'I now turn fragmented subsurface data into decision-ready workflows for exploration, production, and WRFM teams, using AI, Databricks, Spotfire, and governed data.', evidence: ['Connected Spotfire to ESRI, Oracle DB, Databricks, and Denodo; formalized geoscience analytics use cases as Spotfire CAP representative.', 'Delivered Yet2Find, BPA2 QC, PSI, and GoA Production tools; Contribute enabling WRFM Gap-to-Potential diagnostics and prototyped LLM/MCP workflows.', 'Built GoA PP SmartTrends on Databricks, turning 72M well-log rows into 36k standardized reservoir units, cutting analysis cycle time from months to hours.'], learningCore: 'Scalable subsurface AI earns trust when data access is governed, traceable, and built around repeatable workflows.', capabilities: ['Spotfire', 'Databricks', 'Data connectors', 'LLM/MCP'], reference: { name: 'Yann Freudenreich', role: 'Subsurface Analytics Manager' } },
  { title: 'Senior X-Digi Geoscientist (Product Owner)', discipline: 'Digital', countryCodes: ['us'], location: 'United States', period: 'Jun 2020 - May 2025', organization: 'Shell US Hosting Company', teaser: 'Bridging geoscience and product delivery to ship global exploration tools.', summary: 'As a Product Owner, I learned to bring geoscientists, developers, UX designers, and decision makers into one conversation, then turn that conversation into products people could use.', evidence: ['Delivered XStation, a geospatial platform giving global exploration teams access to integrated datasets and dashboards.', 'Delivered ARMPlay for Corporate ARM opportunity screening; applied AI/NLP to democratize insight generation and reduce manual effort.', 'Owned vision, roadmap, and backlog across multiple initiatives, leading dev and UX teams through PoC-led, iterative delivery to production.'], learningCore: 'Domain expertise becomes durable value when it guides product vision, experimentation, and multidisciplinary delivery.', capabilities: ['Product vision', 'Roadmap & backlog', 'UX/dev delivery', 'AI/NLP'], reference: { name: 'Francesco Menapace', role: 'GM Data and Digital Innovation' } },
  { title: 'Sr Exploration Geoscientist (Technical Lead)', discipline: 'Geo', countryCodes: ['nl'], location: 'Netherlands', period: 'Oct 2018 - Jun 2020', organization: 'Shell International E&P', teaser: "Leading 10 disciplines to revitalize Nigeria's shallow water portfolio.", summary: 'In the Netherlands, I led geologists, geophysicists, basin modelers, and data specialists around one shared view of Nigeria\'s shallow-water portfolio.', evidence: ['Led a ~10-person multidisciplinary team through a two-phase portfolio revitalization: regional play maps, then volume estimates and risk assessments.', 'Built the Hydrocarbon Distribution Dashboard covering 90,000+ reservoirs and 5,000 wells.', 'Streamlined prospect maturation so multiple reservoir-seal pairs could be evaluated without compromising QC or technical quality.'], learningCore: 'Portfolio renewal works when specialists share a common evidence base for play mapping, volumes, and risk.', capabilities: ['Play mapping', 'Volumetrics & risk', 'Portfolio renewal', 'Data dashboards'], reference: { name: 'Arjan van Vliet', role: 'Energy Transition Advisor' } },
  { title: 'Exploration Geoscientist', discipline: 'Geo', countryCodes: ['ng'], location: 'Nigeria', period: 'Jul 2014 - Oct 2018', organization: 'Shell Petroleum Development Company (SPDC)', teaser: 'From high-pressure wells to 22.8 MMBOE delivered to development.', summary: 'In Nigeria, I worked closest to the decision: supporting high-pressure wells and deep targets where every update to the subsurface model had real operational consequences.', evidence: ['Prospect owner for Gbaran 26 and 27: high-pressure wells with targets deeper than 16,000 ft; provided daily operational geology and Look-Ahead VSP support.', 'Delivered subsurface model updates, velocity models, volumetrics/QI evaluations, and formal exploration-to-development handovers.', "Contributed 22.8 MMBOE to Development in 2017, approximately 15% of Nigeria's Contingent Resources target, using CTD, AVD, and Syn2D workflows.", 'Took over HD-JK to identify drilling opportunities that added resources at minimal incremental exploration cost and positively influenced FIDs.'], learningCore: 'Operational geoscience connects daily well decisions to credible subsurface models and development handovers.', capabilities: ['HP wells', 'Operational geology', 'VSP/Look-Ahead VSP', 'Velocity models'], reference: { name: 'Manuel Poupon', role: 'Nigeria DW Principal' } },
  { title: 'Senior Seismic Interpreter', discipline: 'Geo', countryCodes: ['qa'], location: 'Qatar', period: 'Feb 2012 - Jul 2014', organization: 'Qatar Shell Service Company (QSSC)', teaser: 'Showcasing a world-first fiber-optic seismic trial to senior stakeholders.', summary: 'In Qatar, I learned to listen closely to the subsurface: combining seismic calibration, VSP operations, and new acquisition technology to sharpen the picture beneath critical wells.', evidence: ['Delivered well-seismic calibration, synthetic generation, and target-depth functions; planned and managed VSP operations for QSD-1 and North Field appraisal wells with Qatar Petroleum.', 'Led 2012-2013 seismic processing for Qatar, coordinating virtually with the Netherlands processing team.', 'Processed and showcased a ~4,000-channel battery-less fiber-optic seismic trial (Shell/PGS) to senior stakeholders.'], learningCore: 'Seismic innovation becomes valuable when rigorous calibration is paired with clear communication to decision makers.', capabilities: ['VSP planning', 'Well-seismic calibration', 'Seismic processing', 'Fiber-optic seismic'], reference: { name: 'Craig Harvey', role: 'Exploration Manager EMEA' } },
  { title: 'Exploration Geoscientist (Consulting)', discipline: 'Geo', countryCodes: ['ve', 'co', 'mx'], location: 'Venezuela | Colombia | Mexico', period: '2006 - Jan 2012', organization: 'Consulting', teaser: 'Building a cross-basin foundation across Venezuela, Colombia, and Mexico.', summary: 'Early in my career, I began learning the craft across Venezuela, Colombia, and Mexico through real data, real uncertainty, and real drilling decisions.', evidence: ['Gained hands-on exposure to the full seismic cycle: 2 yrs acquisition QC, 6 mo processing fundamentals, and 3+ yrs interpretation across onshore and deepwater settings.', 'Contributed to a ~60 km2 3D survey design in Catatumbo and supported well proposals that led to new finds in Colombia.', 'Supported deepwater drilling preparation for Gulf of Mexico and offshore Venezuela (MSLNG), building velocity models for pore-pressure and fracture-gradient prediction ahead of operations.'], learningCore: 'Full-cycle exposure to acquisition, processing, and interpretation builds the judgment needed for complex exploration problems.', capabilities: ['Acquisition QC', 'Processing', 'AVO & spectral decomposition', 'Drilling preparation'] },
]

export const journeyStatement = {
  firstParagraph: 'My career began in exploration and subsurface interpretation, working with uncertainty and technical decisions that had real consequences. Over time, I carried that experience into analytics, software-enabled workflows, AI, and digital product leadership.',
  keyStatement: 'Today, with more than 15 years across geoscience and technology',
  conclusion: ', I bring domain expertise, data, software, and product delivery together to help teams make better decisions and build workflows they can use again.',
}

export const journeyCvProfile: JourneyCvProfile = {
  digitalCore: 'Spotfire | Databricks | SQL/Python | Data governance | NLP/LLM | Agentic AI | Figma | Azure DevOps | ArcGIS | VS Code | GitHub',
  subsurfaceDomain: 'Seismic acquisition & processing | Seismic interpretation | Drilling operations & VSP | Prospect maturation | Volumetrics & Risk | Petrophysics | WRFM',
  achievements: [
    'Delivered 22.8 MMBOE opportunity from high-pressure exploration portfolio.',
    'Led digital products supporting subsurface workflows across global assets.',
    'International experience across USA, Netherlands, Nigeria, Qatar, Venezuela, Colombia and Mexico.',
  ],
  education: 'Universidad Simón Bolívar | Geophysicist | 2007',
  references: [
    { name: 'Francesco Menapace', role: 'GM Data and Digital Innovation' },
    { name: 'Manuel Poupon', role: 'Nigeria DW Principal' },
  ],
}

export const featuredProjects: FeaturedProject[] = [
  {
    title: 'GoA PP SmartTrends',
    businessMoment: 'Regional interpretation needed standardized reservoir insight, but raw well-log data was too granular to use consistently and too important to simplify by hand.',
    collaboration: 'Worked across subsurface interpretation and asset analytics needs to define reusable reservoir units and a workflow that teams could inspect together.',
    outcome: 'Turned 72M log rows into 36k standardized reservoir units, reducing the analysis cycle from months to hours and creating reproducible datasets for scenario testing.',
    aiInPractice: 'AI assists people in exploring and explaining trends; governed rules and domain review remain at the centre of the decision.',
    platforms: ['Databricks', 'Spotfire', 'VS Code'],
  },
  {
    title: 'Yet2Find',
    businessMoment: 'Opportunity screening relied on prospect, lease, spatial, and tabular data held across separate sources, making a shared view of yet-to-find potential difficult to establish.',
    collaboration: 'Worked with geoscience, geomatics, and commercial-data contributors to bring the evidence behind the screening decision into one analytical workflow.',
    outcome: 'Created an integrated interface for prospect, lease, and volumetric assessment that reduced manual QC and made company-level attribution easier to test and discuss.',
    aiInPractice: 'The value starts with trusted, connected evidence: automation supports the workflow while technical and commercial judgment stays visible.',
    platforms: ['FME', 'Spotfire', 'VS Code'],
  },
  {
    title: 'Shell Savoy',
    businessMoment: 'Production, well, log, deviation, and coordinate data used inconsistent identifiers and definitions, slowing cross-discipline readiness for interpretation and candidate screening.',
    collaboration: 'Worked with geology, petrophysics, reservoir, and WRFM perspectives to establish a governed well master and a shared analytical layer.',
    outcome: 'Created a more consistent starting point for interpretation, production diagnostics, and opportunity screening across the asset team.',
    aiInPractice: 'A strong data foundation makes advanced analytics and AI useful later; it is practical preparation, not AI for its own sake.',
    platforms: ['Databricks', 'Spotfire', 'VS Code'],
  },
]

export const leadershipProofs: LeadershipProof[] = [
  { theme: 'Lead', title: 'Environmental Awareness Campaign - Nigeria', description: 'Took responsibility for making an unmeasured health and safety concern visible: turning a personal observation about Port Harcourt air quality into a public-data initiative. The monitoring supported public discussion about environmental exposure, transparency, and wellbeing, and was documented by international reporting on air pollution in Nigeria.', references: [{ label: 'Undark investigation', url: 'https://undark.org/2018/10/22/air-pollution-lagos' }, { label: 'France24 / AFP report', url: 'https://www.france24.com/en/20180423-nigerians-demand-air-quality-data-over-pollution-fears' }, { label: 'IQAir feature', url: 'https://www.iqair.com/newsroom/air-quality-in-africa' }] },
  { theme: 'Build', title: 'EmpathyAI - Founder', description: 'Founded EmpathyAI, an independent applied-AI initiative exploring how organizations can hear workforce ideas and act on them. Its first concept, Connectify, creates an inclusive space for people to share ideas anonymously or openly, across hierarchy and language. AI-assisted synthesis helps leaders identify patterns, sentiment, and practical opportunities for action.', links: [{ label: 'Explore Connectify', url: 'https://www.empathyailab.com/connectify' }, { label: 'Open EmpathyAI app', url: 'https://dev.empathyailab.com/' }] },
  { theme: 'Compete', title: 'Competitive Pickleball - DUPR 4.0', description: 'Applies the same disciplined, iterative improvement mindset used in analytics and technical product work to competitive sport. Deliberate practice, direct feedback, clear communication with a partner, and calm decisions under pressure give me a clear lesson for the next match.' },
]

export const campaignStory: CampaignStory = {
  location: 'Port Harcourt, Nigeria',
  eyebrow: 'Leadership, health and safety',
  title: 'When a health risk needed to be visible.',
  lede: 'I became concerned about the air in Port Harcourt after seeing black residue on my clothes and around my home. With little public data available, I decided to make the risk visible.',
  acts: [
    {
      id: 'trace',
      chapter: '01 / The trace',
      title: 'It began after a ride.',
      body: 'After cycling through Port Harcourt, a fine black residue began appearing on clothes, at home, and across nearby surfaces. One afternoon, I saw the same residue on my young son\'s hands and clothes after only a few minutes at a nearby playground. The concern was no longer abstract. Many people had noticed it, but there was no public data showing what was in the air.',
    },
    {
      id: 'signal',
      chapter: '02 / The signal',
      title: 'I decided to measure it.',
      body: 'At the time, there was very little public air-quality monitoring in Nigeria. I installed a PM2.5 monitor at home and shared its readings through AirVisual, now IQAir. Within months, it became one of the few publicly accessible sources of air-quality data in the country. Readings often rose far above internationally recognized health guidelines. I was not trying to make a personal complaint louder. I wanted to give people evidence they could see, question, and use.',
      reference: { label: 'Read the Undark investigation', url: 'https://undark.org/2018/10/22/air-pollution-lagos' },
    },
    {
      id: 'reach',
      chapter: '03 / The signal travels',
      title: 'Once the data was public, people began using it.',
      body: 'Once the readings were public, residents, environmental groups, researchers, and journalists began referring to them. Later reporting and studies strengthened the understanding that much of the region\'s particulate pollution was associated with refining activities, including illegal crude-oil refining operations in the Niger Delta. The data came from Port Harcourt, but it helped make a wider pollution problem harder to overlook.',
      reference: { label: 'Read the France24 / AFP report', url: 'https://www.france24.com/en/20180423-nigerians-demand-air-quality-data-over-pollution-fears' },
    },
    {
      id: 'action',
      chapter: '04 / What changed',
      title: 'The data led to practical conversations.',
      body: 'The growing visibility of the issue contributed to action inside SPDC. The company provided air purifiers to employees as a mitigation measure and introduced daily air-quality reports. Those reports were useful, but they were not live. My monitoring node gave people a real-time view of the conditions, which is why many preferred to check it when they wanted to understand the air quality at that moment. That was the outcome I had hoped for: not simply more attention, but practical support for people and better information for daily decisions. For me, that was the responsibility: once you can see a risk, you do not leave it as a chart. You help people decide what to do about it.',
    },
  ],
  closing: 'Measuring the air did not solve the pollution. But it gave people something real to look at, question, and use in deciding what to do next. That is the kind of leadership I believe in: seeing a problem, bringing evidence forward, and helping others act.',
}

export const leadershipPillars: LeadershipPillar[] = [
  { title: 'Start with the decision, not the technology', statement: 'Find the decision that is blocked, who needs to make it, and what would help them move forward. Work alongside the people closest to the problem before deciding what to build. A simple tool that makes the next decision easier is more useful than an impressive model people cannot question or use.' },
  { title: 'Build for the way people already work', statement: 'Use a lightweight intervention when a team needs help quickly. When a solution needs to be shared and used again, build it into the platforms and workflows people already rely on. Reuse what is working before creating something new.' },
]