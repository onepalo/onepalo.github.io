import { useState, type CSSProperties, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, CircleDot, Lightbulb, MapPin, ShieldCheck, X } from 'lucide-react'
import { featuredProjects, integrationNodes, journeyCvProfile, journeyItems, journeyStatement, leadershipPillars, leadershipProofs } from '../../content/content'
import type { ExperienceId } from '../../content/contentTypes'
import { useDialogController } from '../../utils/useDialogController'
import rafaelPortrait from '../../assets/candidate/rafael-navarro-portrait.png'
import designerBridge from '../../assets/candidate/DesignerRN.png'
import leaderIllustration from '../../assets/candidate/Leader.png'
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
}

const stageMeta = {
  cover: { eyebrow: 'Cover letter', title: 'Why this role. Why now.', intro: 'The value I would bring as Manager - AI Embedment.' },
  'how-i-work': { eyebrow: 'Working across disciplines', title: 'How I work', intro: 'Two perspectives on how I work: the disciplines I bring together around a decision, and what colleagues experience working alongside me.' },
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

const testimonials = [
  { id: '01', name: 'Emily Guidry', role: 'Senior Geoscientist | NBD LA/SA', quote: 'In new business work, the picture is rarely complete and the decision rarely waits. Rafael is good at laying out what we know, where the uncertainty sits, and who needs to be part of the conversation. He gives the team enough structure to move forward without making the problem look simpler than it is.' },
  { id: '02', name: 'Brent Wignall', role: 'ProducSenior Exploration Evaluation GPO', quote: 'Rafael has always shown a keen interest in the different problems we have brought to him, and has developed innovative approaches to combine and examine the different datasets held by Exploration.  For Rafael there are no organizational boundaries or barriers- only different spheres of activity that can benefit from joining together to develop new insights from otherwise disconnected and stale datasets.' },
  { id: '03', name: 'Manuel Poupon', role: 'Nigeria DW Principal', quote: 'Deepwater decisions do not come with perfect information. Rafael was clear about which data we could trust, which assumptions still needed testing, and what the next practical step should be. That honesty helped us keep moving while staying conscious of the risk.' },
  { id: '04', name: 'Homerson Uy', role: 'Senior Product Owner', quote: 'Rafael brings a rare combination to product work: he understands the subsurface problem in depth, but he still listens before deciding what to build. He can translate between technical users and a delivery team without losing what matters to either side.' },
  { id: '05', name: 'Francesco Menapace', role: 'Asset sponsor', quote: 'What I value in Rafael is his focus on the outcome. He will test an idea quickly, listen to what users are telling us, and stop or change direction when the work is not helping. That makes it easier to invest in the opportunities where the team can make a real difference.' },
  { id: '06', name: 'Michael OConell', role: 'Spotfire Chief Analyst Officer', quote: 'Rafael does not treat a dashboard as finished simply because it works. He pays attention to whether users understand it, trust the data, and come back to it when they have another decision to make. That practical focus is what turns analytics into adoption.' },
  { id: '07', name: 'Example colleague 07', role: 'Global portfolio colleague', quote: 'A solution that works in one asset does not automatically work everywhere else. Rafael asks which parts are specific to the local problem and which parts are worth reusing. He helps teams share what they have learned without forcing every asset into the same answer.' },
  { id: '08', name: 'Example colleague 08', role: 'Team member', quote: 'Rafael expects me to say when I disagree or when I do not know something yet. He is direct about the standard we need to meet, but he also makes time to work through a difficult problem with me. I leave those conversations knowing what I own and where I can ask for help.' },
]

function renderHighlightedText(text: string, highlights: readonly string[]) {
  const pattern = new RegExp(`(${highlights.map((highlight) => highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const normalizedHighlights = new Set(highlights.map((highlight) => highlight.toLowerCase()))

  return text.split(pattern).map((part, index) => normalizedHighlights.has(part.toLowerCase()) ? <strong className="featured-project-emphasis" key={`${part}-${index}`}>{part}</strong> : part)
}

export function ExperienceStage({ experience, headingRef, onNavigate }: ExperienceStageProps) {
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
      {experience === 'how-i-work' && <HowIWork />}
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

function IntegrationMap() {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0)
  const activeTestimonial = testimonials[activeTestimonialIndex]
  const previousTestimonialIndex = (activeTestimonialIndex - 1 + testimonials.length) % testimonials.length
  const nextTestimonialIndex = (activeTestimonialIndex + 1) % testimonials.length
  const previousTestimonial = testimonials[previousTestimonialIndex]
  const nextTestimonial = testimonials[nextTestimonialIndex]

  function moveTestimonial(direction: -1 | 1) {
    setActiveTestimonialIndex((currentIndex) => (currentIndex + direction + testimonials.length) % testimonials.length)
  }

  return (
    <div className="integration-map-panel">
      <section className="testimonial-carousel" aria-roledescription="carousel" aria-labelledby="testimonials-title" tabIndex={0} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            moveTestimonial(-1)
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            moveTestimonial(1)
          }
        }}>
          <header className="testimonial-carousel-header">
            <h2 className="how-i-work-section-title" id="testimonials-title">Testimonials</h2>
          </header>
          <div className="testimonial-carousel-deck">
            <button type="button" className="testimonial-carousel-preview testimonial-carousel-preview-previous" onClick={() => setActiveTestimonialIndex(previousTestimonialIndex)} aria-label={`Show previous testimonial by ${previousTestimonial.name}`}>
              <span className="testimonial-preview-number">{previousTestimonial.id}</span>
              <strong>{previousTestimonial.name}</strong>
              <span className="testimonial-preview-role">{previousTestimonial.role}</span>
              <p>&quot;{previousTestimonial.quote}&quot;</p>
            </button>
            <article className="testimonial-carousel-slide" key={activeTestimonial.id}>
              <blockquote>&quot;{activeTestimonial.quote}&quot;</blockquote>
              <footer><strong>{activeTestimonial.name}</strong><span>{activeTestimonial.role}</span></footer>
            </article>
            <button type="button" className="testimonial-carousel-preview testimonial-carousel-preview-next" onClick={() => setActiveTestimonialIndex(nextTestimonialIndex)} aria-label={`Show next testimonial by ${nextTestimonial.name}`}>
              <span className="testimonial-preview-number">{nextTestimonial.id}</span>
              <strong>{nextTestimonial.name}</strong>
              <span className="testimonial-preview-role">{nextTestimonial.role}</span>
              <p>&quot;{nextTestimonial.quote}&quot;</p>
            </button>
          </div>
          <nav className="testimonial-carousel-navigation" aria-label="Testimonial navigation">
            <button type="button" className="testimonial-carousel-arrow" onClick={() => moveTestimonial(-1)} aria-label="Show previous testimonial" title="Previous testimonial"><ArrowLeft size={19} aria-hidden="true" /></button>
            <p className="testimonial-carousel-progress" aria-live="polite">{activeTestimonialIndex + 1} <span aria-hidden="true">/</span> {testimonials.length}</p>
            <button type="button" className="testimonial-carousel-arrow" onClick={() => moveTestimonial(1)} aria-label="Show next testimonial" title="Next testimonial"><ArrowRight size={19} aria-hidden="true" /></button>
          </nav>
      </section>
      <section className="integration-map-section" aria-labelledby="integration-map-title">
        <h2 className="how-i-work-section-title" id="integration-map-title">Where I connect</h2>
        <div className="integration-map">
          <svg viewBox="0 0 1000 700" aria-hidden="true">{integrationNodes.map((node) => <line key={node.id} x1="500" y1="350" x2={node.x * 10} y2={node.y * 7} />)}</svg>
          <div className="integration-center"><img src={rafaelPortrait} alt="Rafael Navarro" /></div>
          {integrationNodes.map((node) => <article className={`integration-node connection-${node.connectionType}`} key={node.id} style={{ '--node-x': `${node.x}%`, '--node-y': `${node.y}%` } as CSSProperties}><CircleDot size={15} aria-hidden="true" /><h2>{node.label}</h2><p>{node.description}</p></article>)}
        </div>
      </section>
    </div>
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
        <p className="leadership-strategy-thesis">The team would help operating groups resolve immediate needs through focused, ad hoc delivery. Capacity would scale with the delivery practitioners actually in post, not an assumed final headcount.</p>
        <div className="leadership-strategy-capacity" aria-label="Delivery capacity guardrails">
          <div><strong>2</strong><h3>Owned quarterly outcomes</h3><p>Target per delivery practitioner, adjusted for complexity. The manager is accountable for the portfolio, not included in this measure.</p></div>
          <div><strong>2</strong><h3>Active projects maximum</h3><p>Protect focus and finish useful work before pulling more into delivery.</p></div>
          <div><strong>1-12+</strong><h3>Weeks by engagement</h3><p>Quick interventions can land in 1-2 weeks, projects in 3-6, and proven workstreams continue through usable increments.</p></div>
        </div>
        <div className="leadership-strategy-story">
          <header>
            <p className="eyebrow">How I would choose the work</p>
            <h3>Start small. Grow what proves useful.</h3>
          </header>
          <div className="leadership-strategy-story-copy">
            <p>Capacity is a choice, not a queue. Work enters only when an operating team has a pressing decision to improve or friction to remove. We choose for urgency, readiness, potential value, and speed to impact.</p>
            <p>We begin with the smallest credible <strong>project</strong>: a usable result that can land within the quarter. When adoption and evidence reveal a larger opportunity, it can become a <strong>workstream</strong> delivered through successive increments. Each practitioner still owns a clear <strong>quarterly outcome</strong>, so broader ambition never obscures accountability.</p>
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
          <p>Weekly, we unblock delivery and share what changed for users. Monthly, we rebalance the portfolio with sponsors. Quarterly, we review outcomes, value, and ownership before making the next investment decision.</p>
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

function HowIWork() {
  return (
    <section className="how-i-work-view" aria-label="How I work">
      <IntegrationMap />
    </section>
  )
}

function CoverLetter() {
  return (
    <div className="leadership-view">
      <section className="leadership-opening" aria-label="Why I want this job">
        <p className="eyebrow">Why I want this job</p>
        <div className="leadership-opening-copy">
          <p>I want this job because <span className="cover-letter-emphasis">I have worked on both sides of the gap this role is meant to close</span>: making subsurface decisions under pressure, and building digital tools for the people responsible for those decisions. In my current work, I help people make sense of fragmented data, competing interpretations, and decisions that cannot wait for perfect information. AI can help, but only when it makes that work clearer.</p>
          <p>My career has stayed close to those decisions: first in subsurface interpretation and operations, then in product delivery, analytics, and now AI-enabled workflows. I have learned that a solution is useful only when people understand it, can challenge it, and choose to use it again.</p>
          <p>I have coordinated an approximately ten-person subsurface team and led development and UX teams through product delivery. This role is the next responsibility I am ready to take on: helping a global AI Embedment team grow, make good calls, and do work they can be proud of.</p>
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
  return <div className="leadership-proof-view">
    <section className="personal-leadership" aria-label="Leadership evidence beyond the day job">
      <div className="leadership-proof-heading">
        <div>
          <p>The same habits behind my technical work also shape what I create, lead, and pursue beyond the day job.</p>
        </div>
      </div>
      <div className="personal-leadership-grid">
        {leadershipProofs.map((proof) => <article className={`personal-leadership-card${proof.logoSrc ? ' has-logo' : ''}`} key={proof.title}><span>{proof.theme}</span><div className="personal-leadership-card-title"><h3>{proof.title}</h3>{proof.logoSrc && <img src={proof.logoSrc} alt={proof.logoAlt ?? ''} />}</div><p>{proof.description}</p>{proof.title === 'Environmental Awareness Campaign - Nigeria' && <button className="leadership-proof-cta" type="button" onClick={onOpenCampaign}>Click here for more <ArrowRight size={14} aria-hidden="true" /></button>}</article>)}
      </div>
    </section>
  </div>
}

function nextExperience(current: Exclude<ExperienceId, 'home' | 'campaign'>): Exclude<ExperienceId, 'home' | 'campaign'> {
  const order: Array<Exclude<ExperienceId, 'home' | 'campaign'>> = ['cover', 'how-i-work', 'leadership', 'journey', 'impact']
  return order[(order.indexOf(current) + 1) % order.length]
}