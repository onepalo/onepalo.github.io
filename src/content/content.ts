import type { CampaignStory, FeaturedProject, HeroContent, IntegrationNode, JourneyCvProfile, JourneyItem, LeadershipPillar, LeadershipProof, World } from './contentTypes'
import empathyAiLogo from './Asset 31.png'

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
  { id: 'how-i-work', title: 'How I work', shortTitle: 'How I work', description: 'The connections behind my work, and what colleagues see in practice.', accentColor: '#b65f4a', visualHint: 'working connections' },
  { id: 'journey', title: 'Resume', shortTitle: 'Resume', description: 'From field geophysics to global product and analytics delivery.', accentColor: '#d6a94a', visualHint: 'constellation route' },
  { id: 'impact', title: 'Proof of Leadership', shortTitle: 'Leadership proof', description: 'Work I have led, built, and carried beyond my day job.', accentColor: '#e07a5f', visualHint: 'proof points' },
]

export const journeyItems: JourneyItem[] = [
  { title: 'Senior Geoscientist Analyst Specialist', discipline: 'Digital', countryCodes: ['us'], location: 'United States', period: 'Jun 2025 - Present', organization: 'Shell US Hosting Company', teaser: 'Driving AI-enabled analytics adoption across subsurface workflows.', summary: 'I now turn fragmented subsurface data into decision-ready workflows for exploration, production, and WRFM teams, using AI, Databricks, Spotfire, and governed data.', evidence: ['Connected Spotfire to ESRI, Oracle DB, Databricks, and Denodo; formalized geoscience analytics use cases as Spotfire CAP representative.', 'Delivered Yet2Find, BPA2 QC, PSI, and GoA Production tools; Contribute enabling WRFM Gap-to-Potential diagnostics and prototyped LLM/MCP workflows.', 'Built GoA PP SmartTrends on Databricks, turning 72M well-log rows into 36k standardized reservoir units, cutting analysis cycle time from months to hours.'], learningCore: 'Scalable subsurface AI earns trust when data access is governed, traceable, and built around repeatable workflows.', capabilities: ['Spotfire', 'Databricks', 'Data connectors', 'LLM/MCP'], reference: { name: 'Yann Freudenreich', role: 'Subsurface Analytics Manager' } },
  { title: 'Senior X-Digi Geoscientist (Product Owner)', discipline: 'Digital', countryCodes: ['us'], location: 'United States', period: 'Jun 2020 - May 2025', organization: 'Shell US Hosting Company', teaser: 'Bridging geoscience and product delivery to ship global exploration tools.', summary: 'This is where I learned to bring geoscientists, developers, UX designers, and decision makers into one conversation, then turn that conversation into products people could use.', evidence: ['Delivered XStation, a geospatial platform giving global exploration teams access to integrated datasets and dashboards.', 'Delivered ARMPlay for Corporate ARM opportunity screening; applied AI/NLP to democratize insight generation and reduce manual effort.', 'Owned vision, roadmap, and backlog across multiple initiatives, leading dev and UX teams through PoC-led, iterative delivery to production.'], learningCore: 'Domain expertise becomes durable value when it guides product vision, experimentation, and multidisciplinary delivery.', capabilities: ['Product vision', 'Roadmap & backlog', 'UX/dev delivery', 'AI/NLP'], reference: { name: 'Francesco Menapace', role: 'GM Data and Digital Innovation' } },
  { title: 'Sr Exploration Geoscientist (Technical Lead)', discipline: 'Geo', countryCodes: ['nl'], location: 'Netherlands', period: 'Oct 2018 - Jun 2020', organization: 'Shell International E&P', teaser: "Leading 10 disciplines to revitalize Nigeria's shallow water portfolio.", summary: 'This is where I led geologists, geophysicists, basin modelers, and data specialists around one shared view of Nigeria\'s shallow-water portfolio.', evidence: ['Led a ~10-person multidisciplinary team through a two-phase portfolio revitalization: regional play maps, then volume estimates and risk assessments.', 'Built the Hydrocarbon Distribution Dashboard covering 90,000+ reservoirs and 5,000 wells.', 'Streamlined prospect maturation so multiple reservoir-seal pairs could be evaluated without compromising QC or technical quality.'], learningCore: 'Portfolio renewal works when specialists share a common evidence base for play mapping, volumes, and risk.', capabilities: ['Play mapping', 'Volumetrics & risk', 'Portfolio renewal', 'Data dashboards'], reference: { name: 'Arjan van Vliet', role: 'Energy Transition Advisor' } },
  { title: 'Exploration Geoscientist', discipline: 'Geo', countryCodes: ['ng'], location: 'Nigeria', period: 'Jul 2014 - Oct 2018', organization: 'Shell Petroleum Development Company (SPDC)', teaser: 'From high-pressure wells to 22.8 MMBOE delivered to development.', summary: 'This is where I worked closest to the decision: supporting high-pressure wells and deep targets where every update to the subsurface model had real operational consequences.', evidence: ['Prospect owner for Gbaran 26 and 27: high-pressure wells with targets deeper than 16,000 ft; provided daily operational geology and Look-Ahead VSP support.', 'Delivered subsurface model updates, velocity models, volumetrics/QI evaluations, and formal exploration-to-development handovers.', "Contributed 22.8 MMBOE to Development in 2017, approximately 15% of Nigeria's Contingent Resources target, using CTD, AVD, and Syn2D workflows.", 'Took over HD-JK to identify drilling opportunities that added resources at minimal incremental exploration cost and positively influenced FIDs.'], learningCore: 'Operational geoscience connects daily well decisions to credible subsurface models and development handovers.', capabilities: ['HP wells', 'Operational geology', 'VSP/Look-Ahead VSP', 'Velocity models'], reference: { name: 'Manuel Poupon', role: 'Nigeria DW Principal' } },
  { title: 'Senior Seismic Interpreter', discipline: 'Geo', countryCodes: ['qa'], location: 'Qatar', period: 'Feb 2012 - Jul 2014', organization: 'Qatar Shell Service Company (QSSC)', teaser: 'Showcasing a world-first fiber-optic seismic trial to senior stakeholders.', summary: 'This is where I learned to listen closely to the subsurface: combining seismic calibration, VSP operations, and new acquisition technology to sharpen the picture beneath critical wells.', evidence: ['Delivered well-seismic calibration, synthetic generation, and target-depth functions; planned and managed VSP operations for QSD-1 and North Field appraisal wells with Qatar Petroleum.', 'Led 2012-2013 seismic processing for Qatar, coordinating virtually with the Netherlands processing team.', 'Processed and showcased a ~4,000-channel battery-less fiber-optic seismic trial (Shell/PGS) to senior stakeholders.'], learningCore: 'Seismic innovation becomes valuable when rigorous calibration is paired with clear communication to decision makers.', capabilities: ['VSP planning', 'Well-seismic calibration', 'Seismic processing', 'Fiber-optic seismic'], reference: { name: 'Craig Harvey', role: 'Exploration Manager EMEA' } },
  { title: 'Exploration Geoscientist (Consulting)', discipline: 'Geo', countryCodes: ['ve', 'co', 'mx'], location: 'Venezuela | Colombia | Mexico', period: '2006 - Jan 2012', organization: 'Consulting', teaser: 'Building a cross-basin foundation across Venezuela, Colombia, and Mexico.', summary: 'This is where I began learning the craft: building my foundation across Venezuela, Colombia, and Mexico through real data, real uncertainty, and real drilling decisions.', evidence: ['Gained hands-on exposure to the full seismic cycle: 2 yrs acquisition QC, 6 mo processing fundamentals, and 3+ yrs interpretation across onshore and deepwater settings.', 'Contributed to a ~60 km2 3D survey design in Catatumbo and supported well proposals that led to new finds in Colombia.', 'Supported deepwater drilling preparation for Gulf of Mexico and offshore Venezuela (MSLNG), building velocity models for pore-pressure and fracture-gradient prediction ahead of operations.'], learningCore: 'Full-cycle exposure to acquisition, processing, and interpretation builds the judgment needed for complex exploration problems.', capabilities: ['Acquisition QC', 'Processing', 'AVO & spectral decomposition', 'Drilling preparation'] },
]

export const journeyStatement = {
  firstParagraph: 'My career began in exploration and subsurface interpretation, building a strong foundation in geoscience, uncertainty assessment, and technical decision-making. Over time, that foundation expanded beyond the subsurface into analytics, software-enabled workflows, AI, and digital product leadership.',
  keyStatement: 'Today, with more than 15 years of experience across geoscience and technology',
  conclusion: ', I work across domain expertise, data, software, and product delivery to help teams make better decisions and build workflows they can reuse.',
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

export const integrationNodes: IntegrationNode[] = [
  { id: 'domain', label: 'Subsurface & wells', description: 'Exploration, wells, reservoir, production, and technical judgement.', connectionType: 'domain', x: 25, y: 24 },
  { id: 'evidence', label: 'Data & evidence', description: 'Source data, trusted definitions, visible gaps, and uncertainty.', connectionType: 'delivery', x: 75, y: 24 },
  { id: 'workflow', label: 'AI-enabled workflows', description: 'Useful automation, models, and interfaces around the next call.', connectionType: 'capability', x: 75, y: 76 },
  { id: 'product', label: 'Product & experience', description: 'Discovery, design, feedback, and delivery people can use.', connectionType: 'delivery', x: 25, y: 76 },
  { id: 'central', label: 'Central AI & technology', description: 'Data platforms, GenAI capabilities, security, and specialist help.', connectionType: 'alignment', x: 50, y: 12 },
  { id: 'adoption', label: 'Use, learn & improve', description: 'User feedback, adoption, support, and evidence of value.', connectionType: 'alignment', x: 50, y: 88 },
]

export const leadershipProofs: LeadershipProof[] = [
  { theme: 'Create', title: 'Environmental Awareness Campaign - Nigeria', description: 'Turned a personal concern about air quality into a public-data initiative that made conditions in Port Harcourt more visible and understandable. The monitoring contributed to public discussion around transparency and health, and was documented by international reporting on air pollution in Nigeria.', references: [{ label: 'Undark: Port Harcourt investigation', url: 'https://undark.org/2018/10/22/air-pollution-lagos' }, { label: 'France24 / AFP: demand for air-quality data', url: 'https://www.france24.com/en/20180423-nigerians-demand-air-quality-data-over-pollution-fears' }, { label: 'IQAir: Revealing the Invisible - Rafael in Nigeria', url: 'https://www.iqair.com/newsroom/air-quality-in-africa' }] },
  { theme: 'Lead', title: 'Leading Across Subsurface & Data', description: 'Led developer and UX teams while aligning IRM and IDT stakeholders around delivery that met security, compliance, and real operating needs. Earlier, as Technical Lead, coordinated a ten-person multidisciplinary team to rejuvenate Play-Based Exploration in Nigeria’s shallow-water portfolio, bringing shared evidence, refreshed play maps, and decision-ready volume and risk assessments into one working picture.' },
  { theme: 'Build', title: 'EmpathyAI - Founder', description: 'Founded EmpathyAI, an independent applied-AI initiative exploring how organizations can hear workforce ideas and act on them. Its first concept, Connectify, reimagines idea sharing across hierarchy, language, and fear of judgment, combining inclusive participation with AI-assisted insight to help leaders surface patterns they might otherwise miss.', logoSrc: empathyAiLogo, logoAlt: 'EmpathyAI logo' },
  { theme: 'Compete', title: 'Competitive Pickleball - DUPR 4.0', description: 'Applies the same disciplined, iterative improvement mindset used in analytics and technical product work to competitive sport. Deliberate practice, direct feedback, clear communication with a partner, and calm decisions under pressure give me a clear lesson for the next match.' },
]

export const campaignStory: CampaignStory = {
  location: 'Port Harcourt, Nigeria',
  eyebrow: 'An air-quality story',
  title: 'When air-quality data became a public question.',
  lede: 'A personal concern about the air in Port Harcourt became a public-data initiative: making conditions more visible, understandable, and harder to ignore.',
  acts: [
    {
      id: 'trace',
      chapter: '01 / The trace',
      title: 'It began after a ride.',
      body: 'After cycling through Port Harcourt, a fine black residue began appearing on clothes, at home, and across nearby surfaces. It was a physical observation shared by many residents, but one that had no clear public record behind it.',
    },
    {
      id: 'signal',
      chapter: '02 / The signal',
      title: 'A question needed a measurement.',
      body: 'With little publicly available monitoring in Nigeria at the time, a PM2.5 station was installed at home and its measurements were published through the AirVisual network, now IQAir. Within months, it became one of the few publicly accessible sources of air-quality data in the country. Readings often rose far above internationally recognized health guidelines. The point was not to make a private concern louder; it was to make it observable.',
      reference: { label: 'Read the Undark investigation', url: 'https://undark.org/2018/10/22/air-pollution-lagos' },
    },
    {
      id: 'reach',
      chapter: '03 / The signal travels',
      title: 'Evidence made the invisible discussable.',
      body: 'The public data became part of a wider conversation among residents, environmental groups, researchers, and journalists. Later reporting and studies strengthened the understanding that much of the region\'s particulate pollution was associated with refining activities, including illegal crude-oil refining operations in the Niger Delta. Port Harcourt was the lived context, while the underlying challenge reached far beyond one city.',
      reference: { label: 'Read the France24 / AFP report', url: 'https://www.france24.com/en/20180423-nigerians-demand-air-quality-data-over-pollution-fears' },
    },
    {
      id: 'action',
      chapter: '04 / What changed',
      title: 'Attention became a form of care.',
      body: 'Greater awareness helped create space for conversations about environmental exposure and employee wellbeing, including clearer air-quality communication, pollution alerts, and air-purification support for affected families.',
    },
  ],
  closing: 'Measuring the air did not solve the pollution. It gave people a shared way to see it, question it, and act on it.',
}

export const leadershipPillars: LeadershipPillar[] = [
  { title: 'Start with the people doing the work', statement: 'Before we reach for a model or a dashboard, we spend time with the people carrying the decision. We learn where the work slows down, what they already do to get around the problem, what they need to trust, and what would make the next call easier. The best idea is not always the most technical one; it is the one that fits the work and gives people a clearer way forward.' },
  { title: 'Use the right tool for the job', statement: 'We can vibe code small utilities, prototypes, and ad hoc workflows when that is the fastest way to help someone move. When a workflow needs to be shared, trusted, and kept alive, we expose it through the platforms people already use - Databricks, Spotfire, AWS, and AZURE - so the data, controls, and experience can grow with the need. Do not rebuild what already works; connect it, extend it, and make it easier to use.' },
]