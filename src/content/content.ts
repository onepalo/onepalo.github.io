import type { FeaturedProject, HeroContent, IntegrationNode, JourneyCvProfile, JourneyItem, LeadershipPillar, LeadershipProof, LeadershipRhythm, LeadershipSignal, World } from './contentTypes'
import empathyAiLogo from './Asset 31.png'

export const heroContent: HeroContent = {
  eyebrow: 'Interactive Candidate Story',
  title: 'Connecting exploration, digital delivery, and decision impact.',
  subtitle: 'An interactive view of how I think, what I have delivered, and why I am ready to create impact in this role.',
  primaryCta: 'Explore the universe',
  secondaryCta: 'View evidence',
}

export const worlds: World[] = [
  { id: 'cover', title: 'Why Me?', shortTitle: 'Why Me?', description: 'Why this role is the natural next step in my career.', accentColor: '#2e6f95', visualHint: 'personal statement' },
  { id: 'leadership', title: 'How I Will Lead the Team', shortTitle: 'Leadership', description: 'The people, standards, and rhythms I will create for an AI Embedment team.', accentColor: '#42a5a5', visualHint: 'team compass' },
  { id: 'journey', title: 'Resume / CV', shortTitle: 'Resume / CV', description: 'From field geophysics to global product and analytics delivery.', accentColor: '#d6a94a', visualHint: 'constellation route' },
  { id: 'impact', title: 'Proof of Leadership', shortTitle: 'Leadership proof', description: 'Results, influence, and initiative demonstrated in and beyond the day job.', accentColor: '#e07a5f', visualHint: 'proof points' },
]

export const journeyItems: JourneyItem[] = [
  { title: 'Senior Geoscientist Analyst Specialist', discipline: 'Digital', countryCodes: ['us'], location: 'United States', period: 'Jun 2025 - Present', organization: 'Shell US Hosting Company', teaser: 'Driving AI-enabled analytics adoption across subsurface workflows.', summary: 'This is my decision engine: turning fragmented subsurface data into trusted decision engines for exploration, production, and WRFM teams, with AI, Databricks, Spotfire, and governed data as the leverage.', evidence: ['Connected Spotfire to ESRI, Oracle DB, Databricks, and Denodo; formalized geoscience analytics use cases as Spotfire CAP representative.', 'Delivered Yet2Find, BPA2 QC, PSI, and GoA Production tools; Contribute enabling WRFM Gap-to-Potential diagnostics and prototyped LLM/MCP workflows.', 'Built GoA PP SmartTrends on Databricks, turning 72M well-log rows into 36k standardized reservoir units, cutting analysis cycle time from months to hours.'], learningCore: 'Scalable subsurface AI earns trust when data access is governed, traceable, and built around repeatable workflows.', capabilities: ['Spotfire', 'Databricks', 'Data connectors', 'LLM/MCP'], reference: { name: 'Yann Freudenreich', role: 'Subsurface Analytics Manager' } },
  { title: 'Senior X-Digi Geoscientist (Product Owner)', discipline: 'Digital', countryCodes: ['us'], location: 'United States', period: 'Jun 2020 - May 2025', organization: 'Shell US Hosting Company', teaser: 'Bridging geoscience and product delivery to ship global exploration tools.', summary: 'This is where I became a product builder and a translation layer: bringing geoscientists, developers, UX designers, and decision makers into one conversation to turn ideas into adopted products.', evidence: ['Delivered XStation, a geospatial platform giving global exploration teams access to integrated datasets and dashboards.', 'Delivered ARMPlay for Corporate ARM opportunity screening; applied AI/NLP to democratize insight generation and reduce manual effort.', 'Owned vision, roadmap, and backlog across multiple initiatives, leading dev and UX teams through PoC-led, iterative delivery to production.'], learningCore: 'Domain expertise becomes durable value when it guides product vision, experimentation, and multidisciplinary delivery.', capabilities: ['Product vision', 'Roadmap & backlog', 'UX/dev delivery', 'AI/NLP'], reference: { name: 'Francesco Menapace', role: 'GM Data and Digital Innovation' } },
  { title: 'Sr Exploration Geoscientist (Technical Lead)', discipline: 'Geo', countryCodes: ['nl'], location: 'Netherlands', period: 'Oct 2018 - Jun 2020', organization: 'Shell International E&P', teaser: "Leading 10 disciplines to revitalize Nigeria's shallow water portfolio.", summary: 'This is where I learned to orchestrate expertise: bringing geologists, geophysicists, basin modelers, and data specialists around one shared view of Nigeria\'s shallow-water portfolio.', evidence: ['Led a ~10-person multidisciplinary team through a two-phase portfolio revitalization: regional play maps, then volume estimates and risk assessments.', 'Built the Hydrocarbon Distribution Dashboard covering 90,000+ reservoirs and 5,000 wells.', 'Streamlined prospect maturation so multiple reservoir-seal pairs could be evaluated without compromising QC or technical quality.'], learningCore: 'Portfolio renewal works when specialists share a common evidence base for play mapping, volumes, and risk.', capabilities: ['Play mapping', 'Volumetrics & risk', 'Portfolio renewal', 'Data dashboards'], reference: { name: 'Arjan van Vliet', role: 'Energy Transition Advisor' } },
  { title: 'Exploration Geoscientist', discipline: 'Geo', countryCodes: ['ng'], location: 'Nigeria', period: 'Jul 2014 - Oct 2018', organization: 'Shell Petroleum Development Company (SPDC)', teaser: 'From high-pressure wells to 22.8 MMBOE delivered to development.', summary: 'This is where I worked closest to the decision: supporting high-pressure wells and deep targets where every update to the subsurface model had real operational consequences.', evidence: ['Prospect owner for Gbaran 26 and 27: high-pressure wells with targets deeper than 16,000 ft; provided daily operational geology and Look-Ahead VSP support.', 'Delivered subsurface model updates, velocity models, volumetrics/QI evaluations, and formal exploration-to-development handovers.', "Contributed 22.8 MMBOE to Development in 2017, approximately 15% of Nigeria's Contingent Resources target, using CTD, AVD, and Syn2D workflows.", 'Took over HD-JK to identify drilling opportunities that added resources at minimal incremental exploration cost and positively influenced FIDs.'], learningCore: 'Operational geoscience connects daily well decisions to credible subsurface models and development handovers.', capabilities: ['HP wells', 'Operational geology', 'VSP/Look-Ahead VSP', 'Velocity models'], reference: { name: 'Manuel Poupon', role: 'Nigeria DW Principal' } },
  { title: 'Senior Seismic Interpreter', discipline: 'Geo', countryCodes: ['qa'], location: 'Qatar', period: 'Feb 2012 - Jul 2014', organization: 'Qatar Shell Service Company (QSSC)', teaser: 'Showcasing a world-first fiber-optic seismic trial to senior stakeholders.', summary: 'This is where I learned to listen closely to the subsurface: combining seismic calibration, VSP operations, and new acquisition technology to sharpen the picture beneath critical wells.', evidence: ['Delivered well-seismic calibration, synthetic generation, and target-depth functions; planned and managed VSP operations for QSD-1 and North Field appraisal wells with Qatar Petroleum.', 'Led 2012-2013 seismic processing for Qatar, coordinating virtually with the Netherlands processing team.', 'Processed and showcased a ~4,000-channel battery-less fiber-optic seismic trial (Shell/PGS) to senior stakeholders.'], learningCore: 'Seismic innovation becomes valuable when rigorous calibration is paired with clear communication to decision makers.', capabilities: ['VSP planning', 'Well-seismic calibration', 'Seismic processing', 'Fiber-optic seismic'], reference: { name: 'Craig Harvey', role: 'Exploration Manager EMEA' } },
  { title: 'Exploration Geoscientist (Consulting)', discipline: 'Geo', countryCodes: ['ve', 'co', 'mx'], location: 'Venezuela | Colombia | Mexico', period: '2006 - Jan 2012', organization: 'Consulting', teaser: 'Building a cross-basin foundation across Venezuela, Colombia, and Mexico.', summary: 'This is where I began learning the craft: building my foundation across Venezuela, Colombia, and Mexico through real data, real uncertainty, and real drilling decisions.', evidence: ['Gained hands-on exposure to the full seismic cycle: 2 yrs acquisition QC, 6 mo processing fundamentals, and 3+ yrs interpretation across onshore and deepwater settings.', 'Contributed to a ~60 km2 3D survey design in Catatumbo and supported well proposals that led to new finds in Colombia.', 'Supported deepwater drilling preparation for Gulf of Mexico and offshore Venezuela (MSLNG), building velocity models for pore-pressure and fracture-gradient prediction ahead of operations.'], learningCore: 'Full-cycle exposure to acquisition, processing, and interpretation builds the judgment needed for complex exploration problems.', capabilities: ['Acquisition QC', 'Processing', 'AVO & spectral decomposition', 'Drilling preparation'] },
]

export const journeyStatement = {
  context: 'My career began in exploration and subsurface interpretation, building a strong foundation in geoscience, uncertainty assessment, and technical decision-making. Over time, that foundation expanded beyond the subsurface into analytics, software-enabled workflows, AI, and digital product leadership.',
  keyStatement: 'Today, with more than 15 years of experience across geoscience and technology',
  conclusion: ', I leverage a unique combination of domain expertise, data, software, and product thinking to transform complex technical workflows into scalable solutions that accelerate decision-making, unlock efficiencies, and deliver measurable business value.',
}

export const journeyCvProfile: JourneyCvProfile = {
  digitalCore: 'Spotfire | Databricks SQL/Python | Data governance | NLP/LLM | Agentic AI | Figma | Azure DevOps | ArcGIS | VS Code | GitHub',
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
    platforms: ['DataBricks', 'Spotfire', 'VSCode'],
  },
  {
    title: 'Yet2Find',
    businessMoment: 'Opportunity screening relied on prospect, lease, spatial, and tabular data held across separate sources, making a shared view of yet-to-find potential difficult to establish.',
    collaboration: 'Worked with geoscience, geomatics, and commercial-data contributors to bring the evidence behind the screening decision into one analytical workflow.',
    outcome: 'Created an integrated interface for prospect, lease, and volumetric assessment that reduced manual QC and made company-level attribution easier to test and discuss.',
    aiInPractice: 'The value starts with trusted, connected evidence: automation supports the workflow while technical and commercial judgment stays visible.',
    platforms: ['FME', 'Spotfire', 'VSCode'],
  },
  {
    title: 'Shell Savoy',
    businessMoment: 'Production, well, log, deviation, and coordinate data used inconsistent identifiers and definitions, slowing cross-discipline readiness for interpretation and candidate screening.',
    collaboration: 'Worked with geology, petrophysics, reservoir, and WRFM perspectives to establish a governed well master and a shared analytical layer.',
    outcome: 'Created a more consistent starting point for interpretation, production diagnostics, and opportunity screening across the asset team.',
    aiInPractice: 'A strong data foundation makes advanced analytics and AI useful later; it is practical preparation, not AI for its own sake.',
    platforms: ['DataBricks', 'Spotfire', 'VSCode'],
  },
]

export const integrationNodes: IntegrationNode[] = [
  { id: 'exploration', label: 'Exploration', description: 'Opportunity maturation, risk, and technical framing.', connectionType: 'domain', x: 18, y: 20 },
  { id: 'subsurface', label: 'Subsurface', description: 'Integrated earth-model and reservoir evidence.', connectionType: 'domain', x: 78, y: 18 },
  { id: 'digital', label: 'Digital & Data', description: 'Governed datasets, analytics, and usable interfaces.', connectionType: 'delivery', x: 84, y: 48 },
  { id: 'ai', label: 'AI / Automation', description: 'Lower-friction access to insight through practical prototypes.', connectionType: 'capability', x: 76, y: 76 },
  { id: 'product', label: 'Product Teams', description: 'Roadmaps, feedback, and iterative delivery.', connectionType: 'delivery', x: 19, y: 77 },
  { id: 'stakeholders', label: 'Business Stakeholders', description: 'Decision context, prioritization, and adoption.', connectionType: 'alignment', x: 12, y: 49 },
  { id: 'community', label: 'Technical Communities', description: 'Shared practice, peer review, and reuse.', connectionType: 'alignment', x: 48, y: 11 },
  { id: 'governance', label: 'Platform Governance', description: 'Trust, scalability, and responsible operationalization.', connectionType: 'delivery', x: 48, y: 87 },
]

export const leadershipProofs: LeadershipProof[] = [
  { theme: 'Create', title: 'Environmental Awareness Campaign - Lagos, Nigeria', description: 'Turned a personal concern about air quality into a real-time public data campaign for transparency, reaching thousands of users and drawing international media coverage.', references: [{ label: 'Undark', url: 'https://undark.org/2018/10/22/air-pollution-lagos' }, { label: 'IQAir', url: 'https://www.iqair.com/blog/success-stories/air-quality-in-africa' }, { label: 'France24', url: 'https://www.france24.com/en/20180423-nigerians-demand-air-quality-data-over-pollution-fears' }] },
  { theme: 'Lead', title: 'Cross-Functional & Compliance Leadership', description: 'Led developer and UX teams while aligning IRM and IDT stakeholders around secure, compliant, enterprise-ready delivery. Earlier, as Technical Lead, coordinated a ten-person multidisciplinary team to rejuvenate Play-Based Exploration in Nigeria’s shallow-water portfolio, bringing shared evidence, refreshed play maps, and decision-ready volume and risk assessments into one working picture.' },
  { theme: 'Build', title: 'EmpathyAI - Founder', description: 'Founded EmpathyAI, an independent applied-AI initiative exploring how organizations can turn workforce ideas into actionable innovation. Its first concept, Connectify, reimagines idea sharing across hierarchy, language, and fear of judgment, combining inclusive participation with AI-assisted insight to help leaders surface patterns they might otherwise miss.', logoSrc: empathyAiLogo, logoAlt: 'EmpathyAI logo' },
  { theme: 'Compete', title: 'Competitive Pickleball - DUPR 4.0', description: 'Applies the same disciplined, iterative improvement mindset used in analytics and technical product work to competitive sport. Deliberate practice, direct feedback, clear communication with a partner, and calm decisions under pressure turn each match into evidence for the next adjustment.' },
]

export const leadershipPillars: LeadershipPillar[] = [
  { title: 'Know people personally', statement: 'Know each person’s strengths, aspirations, energy, and development needs.' },
  { title: 'High standards, real support', statement: 'Hold quality, ownership, and delivery expectations high while giving squads room to decide how the work gets done.' },
  { title: 'Think again, together', statement: 'Treat certainty as provisional and change course when stronger evidence arrives.' },
]

export const leadershipRhythms: LeadershipRhythm[] = [
  { cadence: 'Weekly', title: 'Whole-team working rhythm', description: 'One focused hour for priorities, dependencies, help, evidence, learning, and recognition. Facilitation rotates to build distributed leadership.' },
  { cadence: 'Monthly', title: 'Individual growth and connection', description: 'A 45-minute 1:1 with every direct report for energy, workload, feedback, development, and career context.' },
  { cadence: 'Quarterly', title: 'Learning and delivery reset', description: 'Review portfolio evidence and individual growth; continue, scale, pause, or stop work based on value, trust, and adoption.' },
]

export const leadershipSignals: LeadershipSignal[] = [
  { title: 'People grow', description: 'Every person gains a visible capability, stretch responsibility, or exposure opportunity.' },
  { title: 'People speak up', description: 'Risks, dissent, and requests for help surface early, without fear of blame.' },
  { title: 'Leadership distributes', description: 'Squads facilitate, mentor, own reusable assets, and make decisions within guardrails.' },
  { title: 'Energy sustains', description: 'The team delivers at pace without normalizing burnout or losing the enjoyment of building together.' },
]