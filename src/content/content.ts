import type { HeroContent, ImpactStory, IntegrationNode, JourneyCvProfile, JourneyItem, LeadershipPillar, LeadershipProof, LeadershipRhythm, LeadershipSignal, ThinkingNode, World } from './contentTypes'
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
  { title: 'Senior Geoscientist Analyst Specialist', discipline: 'Digital', location: 'United States', period: 'Jun 2025 - Present', organization: 'Shell US Hosting Company', teaser: 'Driving AI-enabled analytics adoption across subsurface workflows.', summary: 'Governed data connectors and AI-assisted workflows make subsurface data accessible, auditable, and repeatable across exploration and WRFM teams.', evidence: ['Connected Spotfire to ESRI, Oracle DB, Databricks, and Denodo; formalized geoscience analytics use cases as Spotfire CAP representative.', 'Delivered Yet2Find, BPA2 QC, PSI, and GoA Production tools; enabled ~$1B-scale WRFM Gap-to-Potential diagnostics and prototyped LLM/MCP workflows.', 'Built GoA PP SmartTrends on Databricks, turning 72M well-log rows into 36k standardized reservoir units, cutting analysis cycle time from months to hours.'], learningCore: 'Scalable subsurface AI earns trust when data access is governed, traceable, and built around repeatable workflows.', capabilities: ['Spotfire', 'Databricks', 'Data connectors', 'LLM/MCP'], reference: { name: 'Yann Freudenreich', role: 'Subsurface Analytics Manager' } },
  { title: 'Senior X-Digi Geoscientist (Product Owner)', discipline: 'Digital', location: 'United States', period: 'Jun 2020 - May 2025', organization: 'Shell US Hosting Company', teaser: 'Bridging geoscience and product delivery to ship global exploration tools.', summary: 'Product Owner bridging geoscience domain expertise with digital product delivery, driving roadmap, cross-functional teams, and PoC-led experimentation to ship secure, adopted tools.', evidence: ['Delivered XStation, a geospatial platform giving global exploration teams access to integrated datasets and dashboards.', 'Delivered ARMPlay for Corporate ARM opportunity screening; applied AI/NLP to democratize insight generation and reduce manual effort.', 'Owned vision, roadmap, and backlog across multiple initiatives, leading dev and UX teams through PoC-led, iterative delivery to production.', 'Platforms & tools delivered: XStation | ARMPlay | Yet2Find | GoA PP SmartTrends | BPA2 QC | PSI.'], learningCore: 'Domain expertise becomes durable value when it guides product vision, experimentation, and multidisciplinary delivery.', capabilities: ['Product vision', 'Roadmap & backlog', 'UX/dev delivery', 'AI/NLP'], reference: { name: 'Francesco Menapace', role: 'GM Data and Digital Innovation' } },
  { title: 'Sr Exploration Geoscientist (Technical Lead)', discipline: 'Geo', location: 'Netherlands', period: 'Oct 2018 - Jun 2020', organization: 'Shell International E&P', teaser: "Leading 10 disciplines to revitalize Nigeria's shallow water portfolio.", summary: 'Technical Lead coordinating a ~10-person multidisciplinary team to refresh a full exploration portfolio.', evidence: ['Led a two-phase portfolio revitalization: regional play maps, then volume estimates and risk assessments.', 'Built the Hydrocarbon Distribution Dashboard covering 90,000+ reservoirs and 5,000 wells.'], learningCore: 'Portfolio renewal works when specialists share a common evidence base for play mapping, volumes, and risk.', capabilities: ['Play mapping', 'Volumetrics & risk', 'Portfolio renewal', 'Data dashboards'], reference: { name: 'Arjan van Vliet', role: 'Energy Transition Advisor' } },
  { title: 'Exploration Geoscientist', discipline: 'Geo', location: 'Nigeria', period: 'Jul 2014 - Oct 2018', organization: 'Shell Petroleum Development Company (SPDC)', teaser: 'From high-pressure wells to 22.8 MMBOE delivered to development.', summary: 'Prospect owner for high-pressure Gbaran wells, providing daily operational geology and VSP support during drilling.', evidence: ['Delivered subsurface model updates, volumetrics/QI evaluations, and formal exploration-to-development handovers.', "Contributed 22.8 MMBOE to Development in 2017, approximately 15% of Nigeria's Contingent Resources target."], learningCore: 'Operational geoscience connects daily well decisions to credible subsurface models and development handovers.', capabilities: ['HP wells', 'Operational geology', 'VSP/Look-Ahead VSP', 'Velocity models'], reference: { name: 'Manuel Poupon', role: 'Nigeria DW Principal' } },
  { title: 'Senior Seismic Interpreter', discipline: 'Geo', location: 'Qatar', period: 'Feb 2012 - Jul 2014', organization: 'Qatar Shell Service Company (QSSC)', teaser: 'Showcasing a world-first fiber-optic seismic trial to senior stakeholders.', summary: 'Responsible for well-seismic calibration and VSP planning and operations, including exploration well QSD-1.', evidence: ['Led 2012-2013 seismic processing for Qatar, coordinating virtually with the Netherlands processing team.', 'Processed and showcased a ~4,000-channel battery-less fiber-optic seismic trial (Shell/PGS) to senior stakeholders.'], learningCore: 'Seismic innovation becomes valuable when rigorous calibration is paired with clear communication to decision makers.', capabilities: ['VSP planning', 'Well-seismic calibration', 'Seismic processing', 'Fiber-optic seismic'], reference: { name: 'Craig Harvey', role: 'Exploration Manager EMEA' } },
  { title: 'Exploration Geoscientist (Consulting)', discipline: 'Geo', location: 'Venezuela | Colombia | Mexico', period: '2006 - Jan 2012', organization: 'Consulting', teaser: 'Building a cross-basin foundation across Venezuela, Colombia, and Mexico.', summary: 'Formative years building a full-cycle geophysical foundation, from field acquisition through interpretation across three countries, developing the technical intuition that later enabled more complex exploration and digital work.', evidence: ['Gained hands-on exposure to the full seismic cycle: 2 yrs acquisition QC, 6 mo processing fundamentals, and 3+ yrs interpretation across onshore and deepwater settings.', 'Contributed to a ~60 km2 3D survey design in Catatumbo and supported well proposals that led to new finds in Colombia.', 'Supported deepwater drilling preparation for Gulf of Mexico and offshore Venezuela (MSLNG), building velocity models for pore-pressure and fracture-gradient prediction ahead of operations.'], learningCore: 'Full-cycle exposure to acquisition, processing, and interpretation builds the judgment needed for complex exploration problems.', capabilities: ['Acquisition QC', 'Processing', 'AVO & spectral decomposition', 'Drilling preparation'] },
]

export const journeyStatement = 'My career began in exploration and subsurface interpretation, building a strong foundation in geoscience, uncertainty assessment, and technical decision-making. Over time, that foundation expanded beyond the subsurface into analytics, software-enabled workflows, AI, and digital product leadership. Today, with more than 15 years of experience across geoscience and technology, I leverage a unique combination of domain expertise, data, software, and product thinking to transform complex technical workflows into scalable solutions that accelerate decision-making, unlock efficiencies, and deliver measurable business value.'

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

export const thinkingNodes: ThinkingNode[] = [
  { id: 'frame', title: 'Frame', description: 'Clarify the decision, constraints, and users before selecting a solution.', example: 'Define the decision path behind fragmented subsurface data.', order: 1 },
  { id: 'hypothesize', title: 'Hypothesize', description: 'Turn ambiguity into explicit, testable technical and product assumptions.', example: 'Use a proof of concept to validate a workflow before scaling it.', order: 2 },
  { id: 'evidence', title: 'Connect evidence', description: 'Bring data, interpretation, economics, and user context into one view.', example: 'Integrate spatial, tabular, and prospect data for opportunity screening.', order: 3 },
  { id: 'challenge', title: 'Challenge assumptions', description: 'Use QC, uncertainty, and diverse expertise to expose weak signals early.', example: 'Protect technical quality while streamlining reservoir-seal evaluation.', order: 4 },
  { id: 'prototype', title: 'Prototype', description: 'Make the insight tangible with a usable, focused version of the solution.', example: 'Iteratively deliver advanced visual analytics with end users.', order: 5 },
  { id: 'align-scale', title: 'Align & scale', description: 'Create shared ownership, then operationalize what works through governed data, adoption, and measurable outcomes.', example: 'Lead a portfolio refresh and standardize trusted datasets for reusable decisions.', order: 6 },
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

export const impactStories: ImpactStory[] = [
  { title: 'Decision-ready reservoir units', situation: 'High-resolution well-log data was too granular for regional interpretation.', complexity: 'Scale, geological rules, and consistent cross-asset definitions.', myRole: 'Designed the analytics workflow and user-facing visual layer.', action: 'Used distributed SQL to transform 72M log rows into standardized units, then exposed trends in interactive analytics.', outcome: 'Created reproducible, scenario-ready datasets for faster technical interpretation.', metric: '72M rows -> 36k units', relevance: 'Combines geoscience rigor, data engineering, and adoption-minded design.', tags: ['Databricks', 'Spotfire', 'Petrophysics'] },
  { title: 'Nigeria portfolio refresh', situation: 'A shallow-water exploration portfolio needed a consistent technical refresh.', complexity: 'Multiple disciplines, a large evidence base, and a two-phase maturation process.', myRole: 'Technical Lead coordinating a multidisciplinary team of approximately 10.', action: 'Led play mapping, volumes/risk refresh, and a dashboard for hydrocarbon distribution analysis.', outcome: 'Improved screening consistency and portfolio execution readiness.', metric: '90k+ reservoirs / 5k wells', relevance: 'Shows leadership across complex evidence, people, and decisions.', tags: ['Technical lead', 'Portfolio', 'Analytics'] },
  { title: 'High-pressure opportunity maturation', situation: 'Complex Gbaran wells required operational geology and subsurface de-risking.', complexity: 'Deep targets, high pressure, and real-time delivery requirements.', myRole: 'Prospect owner and drilling-support geoscientist.', action: 'Integrated VSP, models, volumetrics, QIs, and exploration-to-development handover work.', outcome: 'Supported handover to Development and additional drilling opportunities.', metric: '22.8 mmboe in 2017', relevance: 'Anchors digital delivery in direct subsurface decision consequences.', tags: ['Operations', 'VSP', 'Volumetrics'] },
  { title: 'Integrated opportunity screening', situation: 'Prospect evidence was scattered across spreadsheets, spatial layers, and databases.', complexity: 'Overlapping prospects and lease ownership complicated attribution and QC.', myRole: 'Built the unified analytics workflow with geomatics support.', action: 'Centralized data and delivered interactive spatial analysis with automated calculations.', outcome: 'Reduced manual QC and enabled faster commercial assessment.', metric: '[metric to verify]', relevance: 'A practical example of turning fragmented evidence into a usable product.', tags: ['Spatial data', 'Product delivery', 'QC'] },
]

export const leadershipProofs: LeadershipProof[] = [
  { theme: 'Create', title: 'Environmental Awareness Campaign - Lagos, Nigeria', description: 'Turned a personal concern about air quality into a real-time public data campaign for transparency, reaching thousands of users and drawing international media coverage.', references: [{ label: 'Undark', url: 'https://undark.org/2018/10/22/air-pollution-lagos' }, { label: 'IQAir', url: 'https://www.iqair.com/blog/success-stories/air-quality-in-africa' }, { label: 'France24', url: 'https://www.france24.com/en/20180423-nigerians-demand-air-quality-data-over-pollution-fears' }] },
  { theme: 'Lead', title: 'Cross-Functional & Compliance Leadership', description: 'Led developer and UX teams while aligning IRM and IDT stakeholders around secure, compliant, enterprise-ready delivery. Earlier, as Technical Lead, coordinated a ten-person multidisciplinary team to rejuvenate Play-Based Exploration in Nigeria’s shallow-water portfolio, bringing shared evidence, refreshed play maps, and decision-ready volume and risk assessments into one working picture.' },
  { theme: 'Build', title: 'EmpathyAI - Founder', description: 'Founded EmpathyAI, an independent applied-AI initiative exploring how organizations can turn workforce ideas into actionable innovation. Its first concept, Connectify, reimagines idea sharing across hierarchy, language, and fear of judgment, combining inclusive participation with AI-assisted insight to help leaders surface patterns they might otherwise miss.', logoSrc: empathyAiLogo, logoAlt: 'EmpathyAI logo' },
  { theme: 'Compete', title: 'Competitive Pickleball - DUPR 4.0', description: 'Brings the same discipline, iteration, and improvement mindset used in analytics and technical product work to competitive sport.' },
]

export const leadershipPillars: LeadershipPillar[] = [
  { title: 'People known, not managed at a distance', statement: 'Know each person’s strengths, aspirations, energy, and development needs.' },
  { title: 'High standards, real support, clear guardrails', statement: 'Hold quality, ownership, and delivery expectations high while giving squads room to decide how the work gets done.' },
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