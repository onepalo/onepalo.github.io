import { useState, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, Lightbulb, MapPin, ShieldCheck, X } from 'lucide-react'
import { featuredProjects, journeyCvProfile, journeyItems, journeyStatement, leadershipPillars, leadershipProofs } from '../../content/content'
import type { ExperienceId } from '../../content/contentTypes'
import { useDialogController } from '../../utils/useDialogController'
import designerBridge from '../../assets/candidate/DesignerRN.png'
import leaderIllustration from '../../assets/candidate/Leader.png'
import manuelSwoProjectGraph from '../../assets/candidate/manuel-swo-project-graph.png'
import usFlag from 'flag-icons/flags/4x3/us.svg'
import nlFlag from 'flag-icons/flags/4x3/nl.svg'
import ngFlag from 'flag-icons/flags/4x3/ng.svg'
import qaFlag from 'flag-icons/flags/4x3/qa.svg'
import veFlag from 'flag-icons/flags/4x3/ve.svg'
import coFlag from 'flag-icons/flags/4x3/co.svg'
import mxFlag from 'flag-icons/flags/4x3/mx.svg'

interface ExperienceStageProps {
  experience: Exclude<ExperienceId, 'home' | 'campaign'>
  headingRef: RefObject<HTMLHeadingElement | null>
  onNavigate: (experience: ExperienceId) => void
  testimonialSlug: string | null
  onOpenTestimonial: (slug: string) => void
  onCloseTestimonial: () => void
}

const stageMeta = {
  cover: { eyebrow: 'Cover letter', title: 'Why this role. Why now.', intro: 'The value I would bring as Manager - AI Embedment.' },
  'how-i-work': { eyebrow: 'Professional recommendations', title: 'Testimonials', intro: 'What colleagues have experienced working alongside me.' },
  journey: { eyebrow: 'Career overview', title: 'Resume', intro: '' },
  leadership: { eyebrow: 'Leading the AI Embedment Team', title: 'How I will lead', intro: '' },
  impact: { eyebrow: 'Beyond the day job', title: 'Leadership beyond my role', intro: '' },
} as const

const evolvingPhrases = [
  'Always evolving...',
  'Still curious. Still tinkering.',
  'One more thing to learn...',
  'Apparently, I am not done yet.',
  'New puzzle. Same curiosity.',
  'Upgraded after every good question.',
  'Surprise: still evolving.',
] as const

const operatingDeliveryStages = [
  { step: '01', title: 'Shape a useful outcome', duration: 'Intake and framing', description: 'Name the sponsor, user, decision, baseline, and definition of done. Then choose the smallest intervention that can help now.' },
  { step: '02', title: 'Deliver in short cycles', duration: 'Protected delivery', description: 'Use the tools and data available, put a usable increment in front of people quickly, and adjust from evidence rather than assumptions.' },
  { step: '03', title: 'Decide its next home', duration: 'Close, hand off, or grow', description: 'Name the owner and support path. Continue as a longer workstream only when value, readiness, and sponsorship justify the investment.' },
] as const

type FeaturedProjectField = 'businessMoment' | 'collaboration' | 'outcome' | 'aiInPractice'

const featuredProjectHighlights: Record<string, Record<FeaturedProjectField, readonly string[]>> = {
  'GoA PP SmartTrends': {
    businessMoment: [],
    collaboration: [],
    outcome: ['72M log rows into 36k standardized reservoir units', 'months to hours'],
    aiInPractice: [],
  },
  Yet2Find: {
    businessMoment: [],
    collaboration: [],
    outcome: ['integrated interface', 'reduced manual QC'],
    aiInPractice: [],
  },
  'Shell Savoy': {
    businessMoment: [],
    collaboration: ['governed well master'],
    outcome: [],
    aiInPractice: ['strong data foundation'],
  },
}

const flagSources = { us: usFlag, nl: nlFlag, ng: ngFlag, qa: qaFlag, ve: veFlag, co: coFlag, mx: mxFlag } as const

interface Testimonial {
  id: string
  slug: string
  name: string
  role: string
  excerpt: string
  endorsementType?: 'leadership' | 'technical' | 'hybrid'
  fullRecommendation?: readonly string[]
  projectGraph?: {
    src: string
    alt: string
    caption: string
  }
  isDraft?: boolean
}

const testimonials: readonly Testimonial[] = ([
  {
    id: '03',
    slug: 'manuel-poupon',
    name: 'Manuel Poupon',
    role: 'Nigeria DW Principal',
    excerpt: 'I had the privilege of working with Rafael on several exploration projects in Nigeria, both onshore and in Shallow Water. In the Nigeria Shallow Water offshore regional project, Rafael\'s contribution was a true game changer.',
    endorsementType: 'hybrid',
    fullRecommendation: [
      'I had the privilege to work with Rafael on several Exploration projects in Nigeria (onshore and Shallow Water) and always appreciated his curiosity, can-do attitude and enthusiasm allied with solid G&G skills that allowed him to always push the boundaries of what is possible within the project timeline. Their is one particular project though where Rafael\'s contribution was a true game changer (see graph below).',
      'This Nigeria shallow water offshore regional project (2020-2021) was a poster child of one team member (Rafael) taking the lead and in a very short amount of time provided a tool to the entire team to all reservoirs, all wells, all production data at our findertips to reach a level of G&G and RE integration that was never achieved over this SWO basin.',
      'I was also aware of Rafael\'s environmental awareness campaign in Port Harcourt where black soot and particulate pollution had become a daily concern. Rafael took the lead and in a very short amount of time installed a real-time PM2.5 monitor at his home and made the readings public, providing residents and colleagues with a way to see the issue as it was happening.',
      'Rafael then took this evidence to management and pushed for changes in the mitigation plans. The growing visibility of the pollution issue led to practical measures such as air purifiers and daily air-quality reports. This was another example of Rafael\'s passion and leadership, taking a health concern and turning it into evidence and actions people could use.',
    ],
    projectGraph: {
      src: manuelSwoProjectGraph,
      alt: 'Nigeria Shallow Water 2020-2021 technology deployment overview showing Rafael Navarro as the implementer of data science templates and their project impact.',
      caption: 'Nigeria Shallow Water technology deployment, 2020-2021.',
    },
  },
  {
    id: '02',
    slug: 'michael-oconnell',
    name: "Michael O'Connell",
    role: 'Chief Analytics Officer, Spotfire',
    excerpt: 'Rafael Navarro is one of the top few geoscientists and data scientists I have ever met. He sees through tough problems to an ideal solution, then figures out a way to get there with geoscience efficiency and statistical rigor.',
    endorsementType: 'hybrid',
    fullRecommendation: [
      'Rafael Navarro is one of the top few geoscientists and data scientists I have ever met. He sees through tough problems to an ideal solution, then figures out a way to get there with geoscience efficiency and statistical rigor. He is a highly capable scientist and software engineer, fluent in handling massive datasets and using visual data science methodologies to surface hidden patterns that form a solid basis for business investments.',
      'I have seen Rafael build visual geoscience and data science solutions involving hundreds of millions of depth-indexed well log records, creating geologically meaningful reservoir summaries and sophisticated asset valuation applications. These solutions use innovative Python and Spotfire visual data science methods to estimate regional porosity-depth trends and uncertainty envelopes, accounting for spatial clustering, well over-representation, and petrophysical uncertainty in a rigorous and reproducible manner.',
      'During 2026, I have seen Rafael adopt best-of-breed emerging AI capabilities to interrogate data and build these applications, guiding exploratory analysis and accelerating insight generation through code generation and natural-language interaction. The methodologies Rafael brings together are clearly accelerating prospect evaluation, with rapid assessment of reservoir property ranges, trends, and uncertainty across business regions of interest.',
      'I have no hesitation in recommending Rafael for either an individual contributor or leadership position. His enthusiasm and passion for scientific discovery and business development put him in a good position to lead a team of visual data science and geoscience professionals, guiding Shell forward through business uncertainty and rapid technology innovation.',
    ],
  },
  {
    id: '05',
    slug: 'brent-wignall',
    name: 'Brent Wignall',
    role: 'Senior Exploration Evaluation GPO - Assurance and Process',
    excerpt: 'Rafael has always shown a keen interest in the different problems we have brought to him, and has developed innovative approaches to combine and examine the different datasets held by Exploration.',
    endorsementType: 'technical',
    fullRecommendation: [
      'Rafael has always shown a keen interest in the different problems we have brought to him, and has developed innovative approaches to combine and examine the different datasets held by Exploration. For Rafael there are no organizational boundaries or barriers- only different spheres of activity that can benefit from joining together to develop new insights from otherwise disconnected and stale datasets.',
      'Our work on Pinon is a practical example. Rafael built the Spotfire interface for this play-assessment capability, connecting users to a spatialized Oracle-SDE dataset of play outlines, geological attributes, lead portfolios, and discovery history. The interface made it easier to filter, compare, and contrast plays through a consistent view of the portfolio.',
      'He translated the needs of the exploration users into an accessible analytical experience, helping the team look across play risk, maturity, uncertainty, yet-to-find potential, and resilience without adding unnecessary complexity. This gave users a more transparent way to examine the data behind the scoring and use it in portfolio discussions and prioritization decisions.',
    ],
  },
  {
    id: '06',
    slug: 'emily-guidry',
    name: 'Emily Guidry',
    role: 'Senior Geoscientist | Global Growth',
    excerpt: 'He is able to get to the heart of a problem quickly, while still being thoughtful about the uncertainty and constraints around it. This makes it easier to have practical conversations about what can be done now, what needs more work, and where the right digital or analytical support can make a real difference.',
    endorsementType: 'hybrid',
    fullRecommendation: [
      "I've worked closely with Rafael on multiple confidential new business opportunities where decisions need to be made quickly with imperfect information. What stands out most about my experience working with him is his ability to balance technical skills with a pragmatic approach.",
      'He is able to get to the heart of a problem quickly, while still being thoughtful about the uncertainty and constraints around it. This makes it easier to have practical conversations about what can be done now, what needs more work, and where the right digital or analytical support can make a real difference.',
      'Over the past year, I have seen this directly across three projects we delivered together, each involving large and complex datasets. One was a highly confidential opportunity with an especially tight delivery window. Rafael worked through the technical detail quickly, kept us focused on the decision we were trying to support, and helped us put something useful in front of the team when it mattered.',
      'Rafael has deep knowledge of the cutting-edge tools available to Shell and, across different projects, he connected our team with the right people from other Shell technology teams, unlocking tools that led to improved outcomes. He brings the technical context needed to assess an option, but stays focused on whether it will genuinely help the people doing the work.',
      'On top of his technical expertise, Rafael is easy to work with. He is responsive, constructive, and comfortable working across disciplines when a problem needs different perspectives. That combination makes him a go-to person for me when I need AI and digital support.',
    ],
  },
  {
    id: '07',
    slug: 'homerson-uy',
    name: 'Homerson Uy',
    role: 'Senior Product Owner • Subsurface Evaluation',
    excerpt: "I've worked with Rafael on a range of initiatives involving BPA2, GeoX, analytics, and data accessibility. Throughout our interactions, he consistently demonstrated initiative in improving access to exploration data, modernizing analytics workflows, and identifying opportunities to create greater value from existing platforms and datasets.",
    endorsementType: 'hybrid',
    fullRecommendation: [
      "I've worked with Rafael on a range of initiatives involving BPA2, GeoX, analytics, and data accessibility. Throughout our interactions, he consistently demonstrated initiative in improving access to exploration data, modernizing analytics workflows, and identifying opportunities to create greater value from existing platforms and datasets.",
      'One example was a solution Rafael developed for the Gulf of America portfolio. It consumed governed prospect and lead data from BPA2 and combined it with other relevant data sources to create an integrated view of the current portfolio. The result gave the team a clearer, more consistent way to assess opportunities, rather than working from fragmented spreadsheets, systems, and spatial layers.',
      'Rafael built this capability end to end himself, drawing on his detailed understanding of how the relevant systems and data fit together. It allowed the portfolio to be partitioned by lease, operator, and shareholder, helping the team examine exposure and ownership from the perspectives needed for more reliable commercial and technical decisions.',
      'Rafael is particularly effective at bringing together people who look at the same problem from different angles. He listens carefully to what users need, understands the constraints of the existing tools and data, and turns those conversations into practical next steps. This helps the team make progress without losing sight of the bigger opportunity.',
      'He combines a genuine interest in the technical detail with an ability to keep the work focused on what will create value. Whether the task is making data easier to find, improving an analytics workflow, or getting more from an established platform, he looks for solutions that are useful, workable, and aligned with the realities of delivery.',
      'What stands out is his ability to see opportunities where others see constraints, combining technical curiosity with a strong focus on user value. I enjoy collaborating with him because it simply makes life easier. He understands the timelines and challenges we face and works with us to find practical compromises that move things forward.',
    ],
  },
  {
    id: '08',
    slug: 'nathan-suurmeyer',
    name: 'Nathan Suurmeyer',
    role: 'ThinkOnward Head of Innovation',
    excerpt: "The clearest reflection of Rafael's character is what he chooses to build when he sees a problem worth solving.",
    endorsementType: 'hybrid',
    fullRecommendation: [
      "The clearest reflection of Rafael's character is what he chooses to build when he sees a problem worth solving. The air quality project he started while living abroad has always stood out to me. It showed someone who cared enough to take initiative, bring others along, and create something useful for the broader community.",
      'That same energy and sense of purpose carries through to his work for Shell customers. Whether developing an application or creating a straightforward Spotfire dashboard, Rafael has a knack for turning data into something people can understand and act on.',
    ],
  },
  {
    id: '01',
    slug: 'craig-harvey',
    name: 'Craig Harvey',
    role: 'Exploration Manager EMEA',
    excerpt: 'I had the pleasure of working with Rafael in Qatar, where he was our resident Geophysicist within a highly multicultural team. He embraced the challenge of working in a new environment, strengthened his English along the way, and delivered the technical programme with confidence, personality and style.',
    endorsementType: 'leadership',
    fullRecommendation: [
      'I had the pleasure of working with Rafael in Qatar, where he was our resident Geophysicist within a highly multicultural team. He embraced the challenge of working in a new environment, strengthened his English along the way, and delivered the technical programme with confidence, personality and style.',
      'Rafael is a genuine catalyst. He moves quickly, brings people together and injects energy into everything he touches. He is passionate, dynamic and never afraid to challenge the status quo. From the moment we met, he has been excited by the potential of technology to create impact, deliver value and change the way organisations work.',
      'What makes Rafael especially compelling is the breadth of his capability. He combines strong technical domain expertise in subsurface with leadership experience across data and digital. He understands the technology, but more importantly, he knows how to mobilise people around it and turn ambition into action.',
      'His energy extends well beyond the workplace. Whether leading an environmental campaign in Port Harcourt or building an extraordinary social media movement in Venezuela that attracted more than two million followers, Rafael has repeatedly demonstrated his passion and energy for making a difference and his ability to inspire others at scale. Rafael consistently demonstrates the ability to engage communities, inspire action, and deliver meaningful change. These experiences speak volumes about his leadership, influence, and determination to leave a positive mark wherever he operates.',
      'Rafael is bold, creative and full of momentum. If you have a role that needs technical credibility, digital ambition and a leader who can inspire, Rafa is your guy.',
    ],
  },
  {
    id: '09',
    slug: 'frederico-miranda',
    name: 'Frederico Miranda',
    role: 'Principal Exploration Geoscientist • Subsurface Brazil',
    excerpt: 'From our first conversation, Rafael made a complicated portfolio problem feel manageable. He understood what the Brazil team needed, then turned complex prospect data into a tool that gave us a clearer view of the portfolio and made the conversations around it far more useful.',
    endorsementType: 'hybrid',
    fullRecommendation: [
      'Shortly after joining Shell, the Brazil Exploration Growth team needed a portfolio visualization tool to improve the understanding, communication, and management of our BPA2 prospect portfolio. Appointed by Brent Wignall to support this effort, I reached out to Rafael Navarro. From our very first interaction, Rafael stood out for his openness, responsiveness, and genuine commitment to finding solutions.',
      'It was a privilege to work with Rafael on the development of the BPA2 Brazil Spotfire Tool. Rafael played a pivotal role in transforming complex exploration portfolio data into a clear, intuitive, and highly effective visualization platform. His ability to bridge technical expertise with business needs significantly improved transparency and the quality of portfolio discussions and decision-making.',
      'Throughout the project, Rafael consistently demonstrated exceptional collaboration and leadership. He proactively engaged stakeholders and ensured that different perspectives were incorporated into practical and impactful solutions. His reliability, ownership, and focus on delivering value were critical to the success of the initiative.',
      'Beyond his technical capabilities, Rafael is a trusted partner and an inspiring colleague. He works through a genuine desire to help others succeed. He creates an environment where collaboration thrives, people feel supported, and teams can perform at their best. I am confident he will make a significant positive impact wherever he serves.',
    ],
  },
  {
    id: '10',
    slug: 'lisa-walz',
    name: 'Lisa Walz',
    role: 'Senior Geoscientist • Technical Project Lead Paleogene',
    excerpt: 'Having worked with Rafael on numerous projects in the past I would like to highlight his recent work and collaboration with the Paleogene Team as part of his Subsurface analytics role. With his technical geoscience background Rafael is uniquely equipped to help the business understand and unravel complex subsurface issues and ensures solutions translate into sustainable value and adoption at scale.',
    endorsementType: 'hybrid',
    fullRecommendation: [
      'Having worked with Rafael on numerous projects in the past I would like to highlight his recent work and collaboration with the Paleogene Team as part of his Subsurface analytics role.',
      'With his technical geoscience background Rafael is uniquely equipped to help the business understand and unravel complex subsurface issues and ensures solutions translate into sustainable value and adoption at scale.',
      'Our collaboration on Yet2Find (Y2F) is a tangible example of this. Rafael helped bring prospect data from BPA2, Oracle, spreadsheets, and spatial layers into an integrated Gulf of America portfolio workflow. This created a clearer, more consistent way to explore opportunities and consider leases and ownership alongside the technical portfolio view.',
      'His work on the PSI-Shell GoA PP SmartTrends project demonstrated the same ability to turn a complex subsurface data challenge into something useful for interpreters and decision makers. By standardizing large volumes of well-log data into consistent reservoir units and making the results accessible through interactive analysis, he helped create a workflow that supports faster comparison, screening, and technical conversations across the team.',
      'He can connect business challenges with innovative solutions while keeping the end users in mind. While he maintains an enterprise first mindset he focuses on problems that matter most to the business, delivering independent of reporting lines, business units, or other artificial boundaries.',
      'It has always been a pleasure working with Rafael and his positive impact to projects can always be felt.',
    ],
  },
  {
    id: '04',
    slug: 'luke-buskie',
    name: 'Luke Buskie',
    role: 'Senior Innovation Lead • Innovation Program (WRFM)',
    excerpt: 'Rafael has been a valuable partner in helping our WRFM innovation team turn technical needs into practical diagnostic tools and workflows that users can build on.',
    endorsementType: 'hybrid',
    isDraft: true,
    fullRecommendation: [
      'I have worked with Rafael to create a sandbox environment that enables our WRFM innovation team to develop and test diagnostic tools around real business needs. He helped establish a practical space where the team can explore ideas, learn quickly, and move toward solutions that are useful to the ultimate users.',
      'Rafael has provided consistent, hands-on support as we develop features involving scripting, functions, well-log data, and new generations of workflows. This includes helping connect Spotfire to Databricks and Data on Demand, while preparing for future push-compute capabilities that can make demanding analysis more practical for the team. He combines strong technical knowledge with an understanding of the WRFM context, helping us work through implementation questions while keeping the focus on the user cases we need to solve.',
      'More recently, Rafael has been advancing agentic-AI development in the sandbox environment. This work has the potential to become an important enabler for the WRFM Innovation Program, helping the team explore, develop, and scale diagnostic workflows around the needs of their users.',
      'What I value most is his collaborative approach. Rafael is responsive and constructive, and he helps translate complex technical possibilities into practical next steps. His support has made it easier for our team to build diagnostic capabilities with greater confidence and momentum.',
    ],
  },
] satisfies Testimonial[]).sort((first, second) => first.id.localeCompare(second.id))

function renderHighlightedText(text: string, highlights: readonly string[]) {
  const pattern = new RegExp(`(${highlights.map((highlight) => highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const normalizedHighlights = new Set(highlights.map((highlight) => highlight.toLowerCase()))

  return text.split(pattern).map((part, index) => normalizedHighlights.has(part.toLowerCase()) ? <strong className="featured-project-emphasis" key={`${part}-${index}`}>{part}</strong> : part)
}

export function ExperienceStage({ experience, headingRef, onNavigate, testimonialSlug, onOpenTestimonial, onCloseTestimonial }: ExperienceStageProps) {
  const meta = stageMeta[experience]

  return (
    <section className={`experience-stage experience-${experience}`} aria-labelledby={`${experience}-title`}>
      <header className="stage-intro">
        <>
          <p className="eyebrow">{meta.eyebrow}</p>
          <h1 id={`${experience}-title`} tabIndex={-1} ref={headingRef}>{meta.title}</h1>
          {meta.intro && <p>{meta.intro}</p>}
        </>
      </header>
      {experience === 'cover' && <CoverLetter />}
      {experience === 'how-i-work' && <HowIWork testimonialSlug={testimonialSlug} onOpenTestimonial={onOpenTestimonial} onCloseTestimonial={onCloseTestimonial} />}
      {experience === 'journey' && <Journey />}
      {experience === 'leadership' && <Leadership />}
      {experience === 'impact' && <LeadershipProof onOpenCampaign={() => onNavigate('campaign')} />}
      <div className="stage-next">
        <button type="button" className="stage-return" aria-label="Return to universe" onClick={() => onNavigate('home')}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="stage-action-label-full">Return to universe</span>
          <span className="stage-action-label-mobile" aria-hidden="true">Return</span>
        </button>
        <button type="button" className="stage-return" aria-label="Continue the story" onClick={() => onNavigate(nextExperience(experience))}>
          <span className="stage-action-label-full">Continue the story</span>
          <span className="stage-action-label-mobile" aria-hidden="true">Continue</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function Journey() {
  const [openRoleIndexes, setOpenRoleIndexes] = useState(() => new Set<number>())
  const [evolvingPhraseIndex, setEvolvingPhraseIndex] = useState(0)

  return (
    <>
      <div className="journey-overview">
        <CvProfile />
        <div className="journey-overview-main">
          <section className="journey-statement" aria-labelledby="career-statement-title">
            <h2 id="career-statement-title">Career statement</h2>
            <p>{journeyStatement.firstParagraph}</p>
            <p><span className="journey-statement-key">{journeyStatement.keyStatement}</span>{journeyStatement.conclusion}</p>
            <p className="journey-evolving">
              <button className="journey-evolving-button" type="button" onClick={() => setEvolvingPhraseIndex((currentIndex) => (currentIndex + 1) % evolvingPhrases.length)} aria-label="Reveal the next evolving thought" title="Psst... click me.">
                <span className="journey-evolving-phrase" key={evolvingPhraseIndex}>{evolvingPhrases[evolvingPhraseIndex]}</span>
              </button>
            </p>
          </section>
        </div>
      </div>
      <FeaturedProjects />
      <section className="journey-timeline-section" aria-labelledby="professional-experience-title">
        <header className="journey-timeline-heading">
          <h2 id="professional-experience-title">Professional experience</h2>
        </header>
        <div className="journey-timeline">
          {journeyItems.map((item, index) => (
          <details
            className="journey-card"
            key={`journey-role-${index}`}
            open={openRoleIndexes.has(index)}
            onToggle={(event) => {
              const isOpen = event.currentTarget.open
              setOpenRoleIndexes((currentIndexes) => {
                const nextIndexes = new Set(currentIndexes)
                if (isOpen) {
                  nextIndexes.add(index)
                } else {
                  nextIndexes.delete(index)
                }
                return nextIndexes
              })
            }}
          >
            <summary className="journey-card-summary">
              <span className={`journey-marker${item.countryCodes.length > 1 ? ' journey-marker-mixed' : ''}`} aria-hidden="true">
                {item.countryCodes.map((countryCode) => (
                  <img key={countryCode} src={flagSources[countryCode]} alt="" />
                ))}
              </span>
              <div className="journey-card-heading">
                <h2>{item.title}</h2>
                <p className="journey-organization">{item.organization}{' '}<span className="journey-period">{item.period}</span></p>
                <p className="journey-location"><MapPin size={14} aria-hidden="true" /> {item.location}</p>
              </div>
              <span className={`journey-discipline journey-discipline-${item.discipline.toLowerCase()}`}>{item.discipline}</span>
              <ChevronDown className="journey-chevron" size={19} aria-hidden="true" />
            </summary>
            <div className="journey-detail">
                <p className="journey-summary">{item.summary}</p>
                <div className="journey-evidence-group">
                  <p className="journey-proof-label">Selected contributions</p>
                  <ul className="journey-evidence">{item.evidence.map((point, evidenceIndex) => <li key={`evidence-${evidenceIndex}`}>{point}</li>)}</ul>
                </div>
                <section className="journey-learning-core" aria-label="What I learned">
                  <p className="journey-proof-label">What I learned</p>
                  <p>{item.learningCore}</p>
                  <ul className="chips">{item.capabilities.map((capability, capabilityIndex) => <li key={`capability-${capabilityIndex}`}>{capability}</li>)}</ul>
                </section>
                {item.reference && <p className="journey-reference"><span className="journey-reference-contact"><span className="material-symbols-outlined" aria-hidden="true">contact_mail</span><span>Reference</span></span><strong>{item.reference.name}</strong><em>{item.reference.role}</em></p>}
            </div>
          </details>
          ))}
        </div>
      </section>
    </>
  )
}

function FeaturedProjects() {
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null)
  const activeProject = activeProjectIndex === null ? null : featuredProjects[activeProjectIndex]
  const activeProjectHighlights = activeProject ? featuredProjectHighlights[activeProject.title] : null
  const closeProjectDialog = () => setActiveProjectIndex(null)
  const closeButtonRef = useDialogController<HTMLButtonElement>(activeProject !== null, closeProjectDialog)

  return (
    <section className="featured-projects" aria-labelledby="featured-projects-title">
      <header className="journey-statement featured-projects-heading">
        <h2 id="featured-projects-title">Recent AI-enabled work</h2>
        <p>Three recent examples of using domain expertise, data, and AI to improve decisions people need to make now.</p>
      </header>
      <div className="featured-project-list">
        {featuredProjects.map((project, index) => (
          <button className="featured-project" type="button" key={project.title} onClick={() => setActiveProjectIndex(index)} aria-haspopup="dialog">
            <div className="featured-project-content">
              <h3>{project.title}</h3>
              <p>Click here to view the project story</p>
            </div>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      {activeProject && (
        <div className="featured-project-dialog-backdrop" role="presentation" onMouseDown={closeProjectDialog}>
          <section className="featured-project-dialog" role="dialog" aria-modal="true" aria-labelledby="featured-project-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><p className="journey-proof-label">Project story</p><h2 id="featured-project-dialog-title">{activeProject.title}</h2></div>
              <button ref={closeButtonRef} className="featured-project-dialog-close" type="button" onClick={closeProjectDialog} aria-label={`Close ${activeProject.title} project story`}><X size={20} aria-hidden="true" /></button>
            </header>
            <dl>
              <div><dt>The problem</dt><dd>{renderHighlightedText(activeProject.businessMoment, activeProjectHighlights?.businessMoment ?? [])}</dd></div>
              <div><dt>What I did</dt><dd>{renderHighlightedText(activeProject.collaboration, activeProjectHighlights?.collaboration ?? [])}</dd></div>
              <div><dt>The result</dt><dd>{renderHighlightedText(activeProject.outcome, activeProjectHighlights?.outcome ?? [])}</dd></div>
              <div><dt>Where AI helped</dt><dd>{renderHighlightedText(activeProject.aiInPractice, activeProjectHighlights?.aiInPractice ?? [])}</dd></div>
            </dl>
            <footer className="featured-project-platforms"><span>Platforms used</span><ul>{activeProject.platforms.map((platform) => <li key={platform}>{platform}</li>)}</ul></footer>
          </section>
        </div>
      )}
    </section>
  )
}

function CvProfile() {
  const profileSections = ['Digital core', 'Subsurface domain', 'Achievements', 'Education & certifications', 'References'] as const
  const [activeProfileIndex, setActiveProfileIndex] = useState(0)

  return (
    <section className="journey-cv-profile" aria-label="CV profile">
      <div className="cv-profile-nav">
        <header className="cv-profile-heading">
          <h2>Professional at a glance</h2>
        </header>
        {profileSections.map((profileSection, index) => (
          <details className="cv-profile-stack" key={profileSection} open={activeProfileIndex === index} onToggle={(event) => { if (event.currentTarget.open) setActiveProfileIndex(index) }}>
            <summary><span>{profileSection}</span><ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="cv-profile-stack-content">
              {index === 0 && <p>{journeyCvProfile.digitalCore}</p>}
              {index === 1 && <p>{journeyCvProfile.subsurfaceDomain}</p>}
              {index === 2 && <ul className="cv-profile-achievements">{journeyCvProfile.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}</ul>}
              {index === 3 && <p>{journeyCvProfile.education}</p>}
              {index === 4 && <ul className="cv-references">{journeyCvProfile.references.map((reference) => <li key={reference.name}><strong>{reference.name}</strong><span>{reference.role}</span></li>)}</ul>}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

interface TestimonialCarouselProps {
  testimonialSlug: string | null
  onOpenTestimonial: (slug: string) => void
  onCloseTestimonial: () => void
}

function TestimonialCarousel({ testimonialSlug, onOpenTestimonial, onCloseTestimonial }: TestimonialCarouselProps) {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(() => {
    const linkedTestimonialIndex = testimonials.findIndex((testimonial) => testimonial.slug === testimonialSlug)
    return linkedTestimonialIndex === -1 ? 0 : linkedTestimonialIndex
  })
  const [openRecommendation, setOpenRecommendation] = useState(() => testimonials.find((testimonial) => testimonial.slug === testimonialSlug) ?? null)
  const [isProjectGraphVisible, setIsProjectGraphVisible] = useState(false)
  const activeTestimonial = testimonials[activeTestimonialIndex]
  const previousTestimonialIndex = (activeTestimonialIndex - 1 + testimonials.length) % testimonials.length
  const nextTestimonialIndex = (activeTestimonialIndex + 1) % testimonials.length
  const previousTestimonial = testimonials[previousTestimonialIndex]
  const nextTestimonial = testimonials[nextTestimonialIndex]
  const closeRecommendation = () => {
    setOpenRecommendation(null)
    setIsProjectGraphVisible(false)
    onCloseTestimonial()
  }
  const closeRecommendationButtonRef = useDialogController<HTMLButtonElement>(openRecommendation !== null, closeRecommendation)
  const testimonialRibbonLabel = (testimonial: Testimonial) => testimonial.isDraft ? 'DRAFT' : testimonial.endorsementType?.toUpperCase()
  const ribbonLabel = testimonialRibbonLabel(activeTestimonial)
  const testimonialVariantClass = (testimonial: Testimonial) => testimonial.isDraft ? ' is-draft' : testimonial.endorsementType ? ` is-${testimonial.endorsementType}` : ''

  function openFullRecommendation(testimonial: Testimonial) {
    setIsProjectGraphVisible(false)
    setOpenRecommendation(testimonial)
    onOpenTestimonial(testimonial.slug)
  }

  function moveTestimonial(direction: -1 | 1) {
    setActiveTestimonialIndex((currentIndex) => (currentIndex + direction + testimonials.length) % testimonials.length)
  }

  return (
    <>
      <section className="testimonial-carousel" aria-label="Testimonials" aria-roledescription="carousel" tabIndex={0} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            moveTestimonial(-1)
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            moveTestimonial(1)
          }
        }}>
          <div className="testimonial-carousel-deck">
            <button type="button" className={`testimonial-carousel-preview testimonial-carousel-preview-previous${testimonialVariantClass(previousTestimonial)}`} data-ribbon={testimonialRibbonLabel(previousTestimonial)} onClick={() => setActiveTestimonialIndex(previousTestimonialIndex)} aria-label={`Show previous ${previousTestimonial.isDraft ? 'draft ' : ''}testimonial by ${previousTestimonial.name}`}>
              <span className="testimonial-preview-number">{previousTestimonial.id}</span>
              <strong>{previousTestimonial.name}</strong>
              <span className="testimonial-preview-role">{previousTestimonial.role}</span>
              <p>{previousTestimonial.excerpt}</p>
            </button>
            <article className={`testimonial-carousel-slide${testimonialVariantClass(activeTestimonial)}${ribbonLabel ? ' has-ribbon' : ''}`} key={activeTestimonial.id}>
              {ribbonLabel && <span className={`testimonial-ribbon is-${activeTestimonial.isDraft ? 'draft' : activeTestimonial.endorsementType}`}>{ribbonLabel}</span>}
              <div className="testimonial-carousel-context" aria-hidden="true">
                <span>{activeTestimonial.id} / {testimonials.length.toString().padStart(2, '0')}</span>
                {activeTestimonial.isDraft && <span className="testimonial-draft-note">Awaiting final wording and confirmation</span>}
              </div>
              <div className="testimonial-carousel-message">
                <blockquote>{activeTestimonial.excerpt}</blockquote>
                {activeTestimonial.fullRecommendation && <button type="button" className="testimonial-read-full" onClick={() => openFullRecommendation(activeTestimonial)}>Read full recommendation <ArrowRight size={15} aria-hidden="true" /></button>}
              </div>
              <footer><strong>{activeTestimonial.name}</strong><span>{activeTestimonial.role}</span></footer>
            </article>
            <button type="button" className={`testimonial-carousel-preview testimonial-carousel-preview-next${testimonialVariantClass(nextTestimonial)}`} data-ribbon={testimonialRibbonLabel(nextTestimonial)} onClick={() => setActiveTestimonialIndex(nextTestimonialIndex)} aria-label={`Show next ${nextTestimonial.isDraft ? 'draft ' : ''}testimonial by ${nextTestimonial.name}`}>
              <span className="testimonial-preview-number">{nextTestimonial.id}</span>
              <strong>{nextTestimonial.name}</strong>
              <span className="testimonial-preview-role">{nextTestimonial.role}</span>
              <p>{nextTestimonial.excerpt}</p>
            </button>
          </div>
          <nav className="testimonial-carousel-navigation" aria-label="Testimonial navigation">
            <button type="button" className="testimonial-carousel-arrow" onClick={() => moveTestimonial(-1)} aria-label="Show previous testimonial" title="Previous testimonial"><ArrowLeft size={19} aria-hidden="true" /></button>
            <p className="testimonial-carousel-progress" aria-live="polite">{activeTestimonialIndex + 1} <span aria-hidden="true">/</span> {testimonials.length}</p>
            <button type="button" className="testimonial-carousel-arrow" onClick={() => moveTestimonial(1)} aria-label="Show next testimonial" title="Next testimonial"><ArrowRight size={19} aria-hidden="true" /></button>
          </nav>
      </section>
      {openRecommendation && (
        <div className="featured-project-dialog-backdrop testimonial-dialog-backdrop" role="presentation" onMouseDown={closeRecommendation}>
          <section className={`featured-project-dialog testimonial-dialog${testimonialVariantClass(openRecommendation)}`} role="dialog" aria-modal="true" aria-labelledby="testimonial-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p className="journey-proof-label">Full recommendation</p>
                <h2 id="testimonial-dialog-title">{openRecommendation.name}</h2>
                <p className="testimonial-dialog-role">{openRecommendation.role}</p>
              </div>
              <button ref={closeRecommendationButtonRef} className="featured-project-dialog-close testimonial-dialog-close" type="button" onClick={closeRecommendation} aria-label={`Close recommendation from ${openRecommendation.name}`}><X size={20} aria-hidden="true" /></button>
            </header>
            <div className="testimonial-dialog-copy">
              {openRecommendation.fullRecommendation?.map((paragraph, index) => (
                <div className="testimonial-dialog-paragraph" key={`${openRecommendation.id}-paragraph-${index}`}>
                  <p>{paragraph}</p>
                  {index === 0 && openRecommendation.projectGraph && (
                    <>
                      <button type="button" className="testimonial-evidence-toggle" onClick={() => setIsProjectGraphVisible((isVisible) => !isVisible)} aria-expanded={isProjectGraphVisible} aria-controls="manuel-project-graph">
                        {isProjectGraphVisible ? 'Hide referenced project graph' : 'View referenced project graph'}
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                      {isProjectGraphVisible && (
                        <figure className="testimonial-evidence" id="manuel-project-graph">
                          <img src={openRecommendation.projectGraph.src} alt={openRecommendation.projectGraph.alt} />
                          <figcaption>{openRecommendation.projectGraph.caption}</figcaption>
                        </figure>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function Leadership() {
  const pillarIcons = [ShieldCheck, Lightbulb]

  return (
    <div className="leadership-view">
      <section className="leadership-intent" aria-labelledby="leadership-commitment-title">
        <header className="leadership-chapter-heading">
          <p>01</p>
          <div>
            <p className="eyebrow">The leadership I bring</p>
            <h2 id="leadership-commitment-title">What I have led, and how I would build from here.</h2>
          </div>
        </header>
        <div className="leadership-intent-copy">
          <p>In the Netherlands, I coordinated an approximately ten-person team across geology, geophysics, basin modelling, and data engineering to refresh the Nigeria Shallow Water portfolio. We had to turn a wide, messy body of evidence into regional play maps, volumes, and risk that people could work with together.</p>
          <p>Later, as a Product Owner, I worked with development and UX teams, geoscientists, and business stakeholders to turn real workflow needs into products. More recently, I have built data and analytics workflows that help teams get from fragmented information to something they can use to make a decision.</p>
          <p>That is the kind of leadership I know: make the decision clear, bring the right people into the room, let the evidence be challenged, and stay close enough to know whether the work is helping. I will set a high bar, but I do not want people to perform confidence when they are uncertain. In AI work especially, we need people who can say, &quot;I do not know yet,&quot; &quot;the data is not ready,&quot; or &quot;this is not solving the right problem.&quot;</p>
          <div className="leadership-intent-commitments">
            <p><strong>What I ask of the team:</strong> Bring your curiosity, say what you see, and own your part of the outcome. We will make mistakes. The important thing is to notice them early, learn, and keep going together.</p>
            <p><strong>What the team can expect from me:</strong> I will make time to listen, give clear feedback, and help you grow. I will also be honest about priorities and boundaries, so you know where you can decide for yourself.</p>
          </div>
        </div>
        <blockquote className="leadership-pullquote">I want people to leave this team more capable, more confident, and more connected than when they joined.</blockquote>
        <figure className="leadership-shared-effort">
          <img src={leaderIllustration} alt="A leader pulling alongside the team." />
          <figcaption>Good work moves faster when no one has to pull alone.</figcaption>
        </figure>
      </section>

      <section className="leadership-strategy" aria-labelledby="leadership-strategy-title">
        <header className="leadership-chapter-heading">
          <p>02</p>
          <div>
            <p className="eyebrow">My strategy</p>
            <h2 id="leadership-strategy-title">Run AI Embedment as a rapid delivery and adoption capability.</h2>
          </div>
        </header>
        <p className="leadership-strategy-thesis">The team would help operating teams solve immediate problems through focused pieces of work. Every engagement should create a useful signal early, even when the full solution needs more time. We would only take on work where the likely value is clear, and only as much as the AI specialists on the team can realistically deliver.</p>
        <div className="leadership-strategy-capacity" aria-label="Delivery capacity guardrails">
          <div><strong>3-4</strong><h3>Completed pieces of work per quarter</h3><p>Target per AI specialist, adjusted for complexity. Work ranges from short interventions to complex projects. With ten specialists, that means roughly 30 completed pieces of work each quarter.</p></div>
          <div><strong>2</strong><h3>Active pieces of work maximum</h3><p>Per AI specialist at any one time. This protects focus and gives people room to finish useful work before taking on more.</p></div>
          <div><strong>Up to 12</strong><h3>Weeks per piece of work</h3><p>Short interventions take up to 2 weeks. Projects take 3-6 weeks. Complex projects can run for up to a quarter.</p></div>
        </div>
        <div className="leadership-strategy-story">
          <header>
            <p className="eyebrow">How I would choose the work</p>
            <h3>Start small. Scale what delivers.</h3>
          </header>
          <div className="leadership-strategy-story-copy">
            <p>Capacity is a choice, not a queue. Work enters only when an operating team has a pressing decision to improve or friction to remove, and a clear value case. We choose for urgency, readiness, likely value, and speed to impact.</p>
            <p>We begin with a short <strong>intervention</strong> that can deliver a usable result within two weeks. If the need is larger, it becomes a <strong>project</strong> delivered over three to six weeks, or a <strong>complex project</strong> completed within the quarter. Complex work still has to show an early usable signal; its longer horizon is for finishing, integrating, and proving the full solution. Work that repeatedly delivers value can continue as a <strong>workstream</strong>, with a quarterly decision to invest again. Each AI specialist still owns a clear <strong>quarterly outcome</strong>, so broader ambition never obscures accountability.</p>
          </div>
          <p className="leadership-strategy-proof"><span>What earns the next investment</span> Less effort, better decisions, lower risk, sustained use, or a solution another team can reuse.</p>
        </div>
      </section>

      <section className="leadership-focus operating-delivery-loop" aria-labelledby="operating-delivery-loop-title">
        <header className="leadership-chapter-heading">
          <p>03</p>
          <div>
            <p className="eyebrow">How the team operates</p>
            <h2 id="operating-delivery-loop-title">Move from a clear outcome to a clear next home.</h2>
            <p className="leadership-chapter-intro">A lightweight delivery loop keeps immediate work moving without allowing successful prototypes to become unsupported products.</p>
          </div>
        </header>
        <ol>
          {operatingDeliveryStages.map((stage) => (
            <li key={stage.step}>
              <span>{stage.step}</span>
              <h3>{stage.title}</h3>
              <strong>{stage.duration}</strong>
              <p>{stage.description}</p>
            </li>
          ))}
        </ol>
        <div className="operating-delivery-rhythm">
          <p>Weekly, we unblock delivery and share what changed for customers. Monthly, we rebalance the portfolio with sponsors. Quarterly, we review outcomes, value, and ownership before making the next projects decision.</p>
          <p>Updates, decisions, and notes belong in writing. Meeting time is for the conversations that need judgement, challenge, or help from other people.</p>
        </div>
        <section className="operating-principles" aria-labelledby="operating-principles-title">
          <header>
            <p className="eyebrow">Operating principles</p>
            <h3 id="operating-principles-title">Two rules that keep delivery honest.</h3>
            <p>Speed does not lower the bar for usefulness, trust, or responsible technical choices.</p>
          </header>
          <div className="operating-principles-grid">
            {leadershipPillars.map((pillar, index) => {
              const Icon = pillarIcons[index]
              return <article className="operating-principle-card" key={pillar.title}>
                <Icon size={22} aria-hidden="true" />
                <h4>{pillar.title}</h4>
                <p>{pillar.statement}</p>
              </article>
            })}
          </div>
        </section>
      </section>
    </div>
  )
}

interface HowIWorkProps {
  testimonialSlug: string | null
  onOpenTestimonial: (slug: string) => void
  onCloseTestimonial: () => void
}

function HowIWork({ testimonialSlug, onOpenTestimonial, onCloseTestimonial }: HowIWorkProps) {
  return (
    <section className="how-i-work-view" aria-label="Testimonial">
      <TestimonialCarousel key={testimonialSlug ?? 'carousel'} testimonialSlug={testimonialSlug} onOpenTestimonial={onOpenTestimonial} onCloseTestimonial={onCloseTestimonial} />
    </section>
  )
}

function CoverLetter() {
  return (
    <div className="leadership-view">
      <section className="leadership-opening" aria-label="Why I want this job">
        <p className="eyebrow">Why I want this job</p>
        <div className="leadership-opening-copy">
          <p>This role feels like the natural next step for me. My career has brought together a grounding in subsurface exploration, hands-on work in technology, and experience of making decisions under pressure. It has taught me what it takes to turn both into something useful for the people making those decisions. In my current work, I help people make sense of fragmented data, competing interpretations, and decisions that cannot wait for perfect information. AI can help, but only when it makes that work clearer. The aim is to use the evidence available responsibly, then standardize what proves worth scaling.</p>
          <p>I have coordinated an approximately ten-person subsurface team and led development and UX teams through product delivery. This role is the next responsibility I am ready to take on: helping a global AI Embedment team grow, make good calls, and build the confidence, ownership, and shared purpose that lets people do work they are proud of.</p>
        </div>
        <blockquote className="leadership-pullquote">I do not want the next chapter of my career to be a story about what I can do alone.</blockquote>
        <figure className="leadership-designer-bridge">
          <img src={designerBridge} alt="A person connecting subsurface expertise with technology and AI." />
        </figure>
      </section>

      <section className="leadership-readiness" aria-label="The career that led me here">
        <p className="eyebrow">The career that led me here</p>
        <div className="leadership-narrative-copy">
          <p>For more than fifteen years, I have worked where technical judgment has consequences: prospects, high-pressure wells, portfolio renewal, risk, and the handover from an uncertain subsurface picture to a decision someone has to own. The real work, I learned, is helping specialists see the same evidence, disagree productively, and decide what to do next.</p>
          <p>Leading a multidisciplinary team during a regional rejuvenation effort in the Netherlands showed me what happens when diverse experts work from the same evidence. Over the last six years, I have carried that lesson into digital products, analytics, and AI: the work succeeds when it solves a real problem and becomes part of daily practice.</p>
        </div>
      </section>

      <section className="leadership-choice" aria-label="Why lead now">
        <p className="eyebrow">Why lead now</p>
        <div className="leadership-narrative-copy">
          <p>This role needs someone who can work comfortably with geoscientists, data scientists, product owners, and asset teams. I have been learning how to bring those perspectives into the same conversation.</p>
          <p>AI is accessible to many of us. The harder work is taking a real problem from the first conversation to something people trust enough to use in their everyday work. That means listening closely, bringing the right people together, and <span className="cover-letter-emphasis">making something useful before the moment has passed.</span></p>
          <p>I want to use that experience to help people grow, make room for others to lead, and build a team that does useful work people can stand behind.</p>
        </div>
      </section>
    </div>
  )
}

function LeadershipProof({ onOpenCampaign }: { onOpenCampaign: () => void }) {
  const proofVariant = (title: string) => title === 'Environmental Awareness Campaign - Nigeria' ? ' is-campaign' : title === 'EmpathyAI - Founder' ? ' is-empathy' : ' is-practice'

  return <div className="leadership-proof-view">
    <section className="personal-leadership" aria-label="Leadership evidence beyond the day job">
      <div className="leadership-proof-heading">
        <div>
          <p className="leadership-proof-kicker">Independent proof</p>
          <p>The same habits behind my technical work also shape what I create, lead, and pursue beyond the day job.</p>
        </div>
      </div>
      <div className="personal-leadership-grid">
        {leadershipProofs.map((proof) => <article className={`personal-leadership-card${proof.title === 'Environmental Awareness Campaign - Nigeria' ? ' is-featured' : ''}${proofVariant(proof.title)}`} key={proof.title}><span>{proof.theme}</span><h3>{proof.title}</h3><p>{proof.description}</p>{proof.title === 'Environmental Awareness Campaign - Nigeria' && <button className="leadership-proof-cta" type="button" onClick={onOpenCampaign}>Explore the campaign <ArrowRight size={14} aria-hidden="true" /></button>}{proof.links && <div className="leadership-proof-cta-group">{proof.links.map((link) => <a className="leadership-proof-cta" href={link.url} target="_blank" rel="noopener noreferrer" key={link.url}>{link.label} <ArrowRight size={14} aria-hidden="true" /></a>)}</div>}</article>)}
      </div>
    </section>
  </div>
}

function nextExperience(current: Exclude<ExperienceId, 'home' | 'campaign'>): Exclude<ExperienceId, 'home' | 'campaign'> {
  const order: Array<Exclude<ExperienceId, 'home' | 'campaign'>> = ['cover', 'how-i-work', 'leadership', 'journey', 'impact']
  return order[(order.indexOf(current) + 1) % order.length]
}