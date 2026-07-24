import { useState, type CSSProperties, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, BatteryCharging, ChevronDown, CircleDot, HeartHandshake, Lightbulb, Mail, MapPin, MessageCircle, Network, ShieldCheck, Sprout, X } from 'lucide-react'
import { featuredProjects, integrationNodes, journeyCvProfile, journeyItems, journeyStatement, leadershipPillars, leadershipProofs, leadershipRhythms, leadershipSignals } from '../../content/content'
import type { ExperienceId } from '../../content/contentTypes'
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
  cover: { eyebrow: 'Cover letter', title: 'Why this role. Why now.', intro: 'The Value I Can Bring as Team Lead, AI Embedment.' },
  journey: { eyebrow: 'Career overview', title: 'Resume / CV', intro: '' },
  leadership: { eyebrow: 'Leading the AI Embedment Team', title: 'How I will lead the team', intro: '' },
  impact: { eyebrow: 'Leadership is a practice, not a title.', title: 'Proof of Leadership', intro: '' },
} as const

const leadershipPrincipleDetails = [
  { behavior: 'Every effort begins with a named decision, sponsor, users, baseline, and value hypothesis rather than a technology looking for a use case.' },
  { behavior: 'Squads learn the real workflow with domain experts, then test a useful change in the context where people already make decisions.' },
  { behavior: 'Start with the tools, data, and approved models already available. When something works, turn it into a simpler starting point for the next team.' },
] as const

const leadershipRhythmDetails = [
  { duration: '60 minutes', practice: 'Use the weekly meeting to address the next increment, user feedback, dependencies, and delivery decisions while they can still change the work. Status, decisions, documentation, and help requests stay async; meeting time is for collaboration, learning, and decisions that need people in the room.' },
  { duration: '60 minutes', practice: 'Use the sponsor review to direct capacity toward the clearest opportunities. Bring the actual evidence on value, workflow readiness, user commitment, risk, and potential for reuse before adding work.' },
  { duration: 'Half-day review', practice: 'At the quarterly review, decide whether to continue, scale, pause, or stop. Look at use, adoption, quality, and reuse together, then protect the capacity needed to adopt what has proved useful.' },
] as const

const leadershipRhythmIcons = ['groups', 'person', 'restart_alt'] as const

const leadershipSignalDetails = [
  'Three to five workflows have demonstrated value in live use, with an operational owner, runbook, and a clear measure of what changed. At least one can be replicated with less effort than the first deployment.',
  'A clear opportunity can reach a first useful version in one to three months, rather than entering a six-to-twenty-four-month programme by default.',
  'We will be honest about what is estimated, what has worked in a trial, and what is delivering value in day-to-day use. Reusable data patterns, evaluations, connectors, and workflow components make the next delivery faster.',
] as const

const operatingDeliveryStages = [
  { step: '01', title: 'Frame', duration: 'Up to 2 weeks', description: 'Name the decision, sponsor, users, data, baseline, and value hypothesis.' },
  { step: '02', title: 'Validate', duration: 'Up to 4 weeks', description: 'Test workflow fit, data feasibility, and practitioner feedback before committing to a build.' },
  { step: '03', title: 'Build and adopt', duration: 'Up to 6 weeks', description: 'Put a useful version into the real workflow with an owner, support, and a way to learn from use.' },
  { step: '04', title: 'Scale or stop', duration: 'Use and results', description: 'Strengthen, replicate, pause, or close the work based on what people use, what changes, and what holds up in practice.' },
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
      {experience === 'journey' && <Journey />}
      {experience === 'leadership' && <Leadership />}
      {experience === 'impact' && <LeadershipProof onOpenCampaign={() => onNavigate('campaign')} />}
      <div className="stage-next">
        <button type="button" className="stage-return" onClick={() => onNavigate('home')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Return to universe
        </button>
        <button type="button" className="stage-return" onClick={() => onNavigate(nextExperience(experience))}>
          Continue the story <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function Journey() {
  const [openRoleIndexes, setOpenRoleIndexes] = useState(() => new Set<number>())

  return (
    <>
      <div className="journey-overview">
        <CvProfile />
        <div className="journey-overview-main">
          <section className="journey-statement" aria-labelledby="career-statement-title">
            <h2 id="career-statement-title">Career statement</h2>
            <p>{journeyStatement.firstParagraph}</p>
            <p><span className="journey-statement-key">{journeyStatement.keyStatement}</span>{journeyStatement.conclusion}</p>
            <p className="journey-evolving" aria-label="Always evolving">
              <span>Always evolving...</span>
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
                <p className="journey-organization">{item.organization}<span className="journey-period">{item.period}</span></p>
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
                <section className="journey-learning-core" aria-label="Learning core">
                  <p className="journey-proof-label">Learning core</p>
                  <p>{item.learningCore}</p>
                  <ul className="chips">{item.capabilities.map((capability, capabilityIndex) => <li key={`capability-${capabilityIndex}`}>{capability}</li>)}</ul>
                </section>
                {item.reference && <p className="journey-reference"><span className="journey-reference-contact"><Mail size={15} strokeWidth={2} aria-hidden="true" /><span>Reference</span></span><strong>{item.reference.name}</strong><em>{item.reference.role}</em></p>}
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
        <div className="featured-project-dialog-backdrop" role="presentation" onMouseDown={() => setActiveProjectIndex(null)}>
          <section className="featured-project-dialog" role="dialog" aria-modal="true" aria-labelledby="featured-project-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><p className="journey-proof-label">Project story</p><h2 id="featured-project-dialog-title">{activeProject.title}</h2></div>
              <button className="featured-project-dialog-close" type="button" onClick={() => setActiveProjectIndex(null)} aria-label={`Close ${activeProject.title} project story`}><X size={20} aria-hidden="true" /></button>
            </header>
            <dl>
              <div><dt>Business moment</dt><dd>{renderHighlightedText(activeProject.businessMoment, activeProjectHighlights?.businessMoment ?? [])}</dd></div>
              <div><dt>How I embedded</dt><dd>{renderHighlightedText(activeProject.collaboration, activeProjectHighlights?.collaboration ?? [])}</dd></div>
              <div><dt>What changed</dt><dd>{renderHighlightedText(activeProject.outcome, activeProjectHighlights?.outcome ?? [])}</dd></div>
              <div><dt>AI in practice</dt><dd>{renderHighlightedText(activeProject.aiInPractice, activeProjectHighlights?.aiInPractice ?? [])}</dd></div>
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
  return <div className="integration-map"><svg viewBox="0 0 1000 700" aria-hidden="true">{integrationNodes.map((node) => <line key={node.id} x1="500" y1="350" x2={node.x * 10} y2={node.y * 7} />)}</svg><div className="integration-center"><img src={rafaelPortrait} alt="Rafael Navarro" /></div>{integrationNodes.map((node) => <article className={`integration-node connection-${node.connectionType}`} key={node.id} style={{ '--node-x': `${node.x}%`, '--node-y': `${node.y}%` } as CSSProperties}><CircleDot size={15} aria-hidden="true" /><h2>{node.label}</h2><p>{node.description}</p></article>)}</div>
}

function Leadership() {
  const pillarIcons = [HeartHandshake, ShieldCheck, Lightbulb]
  const signalIcons = [Sprout, MessageCircle, Network, BatteryCharging]

  return (
    <div className="leadership-view">
      <section className="leadership-intent" aria-labelledby="leadership-commitment-title">
        <header className="leadership-chapter-heading">
          <p>01</p>
          <div>
            <p className="eyebrow">Leadership commitment</p>
            <h2 id="leadership-commitment-title">The standard I will set for the team.</h2>
          </div>
        </header>
        <div className="leadership-intent-copy">
          <p>I want to build a team that learns quickly without becoming frantic. New models invite teams to chase releases, trust persuasive answers, or confuse activity with progress. My response is to keep people, trusted evidence, and AI in one feedback loop, so domain expertise shapes decisions and the work earns adoption.</p>
          <p><span className="cover-letter-emphasis">The standard is not AI activity; it is a meaningful improvement in a decision people need to make.</span> We will focus our effort where domain credibility, available AI capabilities, and a clear business opportunity can produce a useful change in the workflow, quickly enough for users to shape it.</p>
          <div className="leadership-intent-commitments">
            <p><strong>What I ask of the team:</strong> I will ask people to stay curious, say when they do not know, challenge assumptions, and own the outcomes they shape. AI work cannot wait for certainty; it needs people comfortable learning in public and correcting course without making every mistake personal.</p>
            <p><strong>What the team can expect from me:</strong> I will know people rather than manage them at a distance, make time for feedback and growth, and set guardrails that give autonomy real meaning. I cannot promise permanence in a changing organization. I can make sure the time we do control is worthwhile: useful work, visible growth, stronger relationships, and experience people carry forward.</p>
          </div>
        </div>
        <blockquote className="leadership-pullquote">Leadership is not a title. It is the willingness to move first, listen closely, and make others stronger.</blockquote>
        <figure className="leadership-shared-effort">
          <img src={leaderIllustration} alt="A leader pulling alongside the team." />
          <figcaption>Shared effort. Shared momentum. Lead by example.</figcaption>
        </figure>
      </section>

      <section className="leadership-focus" aria-labelledby="leadership-operating-model-title">
        <header className="leadership-chapter-heading leadership-operating-model-heading">
          <p>02</p>
          <div>
            <br></br>
          </div>
        </header>
        <section className="operating-delivery-loop" aria-labelledby="operating-delivery-loop-title">
          <header>
            <p className="eyebrow">How the team operates</p>
            <h2 id="operating-delivery-loop-title">Useful AI in real workflows, not research for its own sake.</h2>
            <p>An AI Embedment team works alongside asset teams, combines domain expertise with the tools already available, and turns priority decisions into workflows people can use.</p>
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
        </section>
        <section className="leadership-principles" aria-labelledby="leadership-principles-title">
          <div className="leadership-section-heading">
            <p className="eyebrow">How we choose and build</p>
            <h2 id="leadership-principles-title">Principles that keep delivery close to value</h2>
          </div>
          <div className="leadership-practice-intro">
            <p>I would rather see three workflows people rely on than a long list of AI pilots. The work has to matter to the people making the decision and to the team that will live with the result.</p>
            <p>Squads need room to move, clear quality and risk boundaries, and permission to change direction when the evidence changes.</p>
          </div>
          <div className="operating-principles-grid">
            {leadershipPillars.map((pillar, index) => {
              const Icon = pillarIcons[index]
              const detail = leadershipPrincipleDetails[index]
              return <article className="operating-principle-card" key={pillar.title}>
                <Icon size={22} aria-hidden="true" />
                <h3>{pillar.title}</h3>
                <p className="operating-statement">{pillar.statement}</p>
                <p><span>What this enables</span>{detail.behavior}</p>
              </article>
            })}
          </div>
        </section>

        <section className="leadership-rhythm" aria-labelledby="leadership-rhythm-title">
          <div className="leadership-section-heading">
            <p className="eyebrow">The team rhythm</p>
            <h2 id="leadership-rhythm-title">A cadence that protects speed, learning, and adoption</h2>
          </div>
          <div className="leadership-practice-intro">
            <p>Short cycles let us test the work with users before we spend months building the wrong thing. They give us regular moments to make trade-offs visible and adjust the work while it is still easy to change.</p>
            <p>Communication remains async by default; meeting time is reserved for collaboration, decisions, and the evidence that changes the next move.</p>
          </div>
          <div className="operating-rhythm-list">
            {leadershipRhythms.map((rhythm, index) => (
              <article key={rhythm.cadence}>
                <header><span className="material-symbols-outlined" aria-hidden="true">{leadershipRhythmIcons[index]}</span><p>{rhythm.cadence}</p><p>{leadershipRhythmDetails[index].duration}</p></header>
                <h3>{rhythm.title}</h3>
                <p className="operating-statement">{rhythm.description}</p>
                <p><span>How we work</span>{leadershipRhythmDetails[index].practice}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="leadership-signals" aria-labelledby="leadership-signals-title">
          <div className="leadership-section-heading">
            <p className="eyebrow">What success looks like</p>
            <h2 id="leadership-signals-title">Signals I would expect to see by month 12</h2>
          </div>
          <div className="leadership-practice-intro">
            <p>By month 12, I would want to point to a few workflows people rely on, with evidence that they improve the work and can be reused elsewhere.</p>
          </div>
          <div className="operating-signals-grid">
            {leadershipSignals.map((signal, index) => {
              const Icon = signalIcons[index]
              return <article className="operating-signal-card" key={signal.title}>
                <Icon size={21} aria-hidden="true" />
                <h3>{signal.title}</h3>
                <p className="operating-statement">{signal.description}</p>
                <p><span>What I would notice</span>{leadershipSignalDetails[index]}</p>
              </article>
            })}
          </div>
        </section>
      </section>
    </div>
  )
}

function CoverLetter() {
  return (
    <div className="leadership-view">
      <section className="leadership-opening" aria-label="Why I want this job">
        <p className="eyebrow">Why I want this job</p>
        <div className="leadership-opening-copy">
          <p>I want this job because <span className="cover-letter-emphasis">I have worked on both sides of the gap this role is meant to close</span>: the pressure of a subsurface decision, and the digital work that loses force when it becomes disconnected from the people and workflows it is meant to serve.</p>
          <p>I also understand that not all AI work has the same purpose. There is an important place for frontier AI: teams can spend months or years testing new models, capabilities, and systems whose value may only become clear over time. But that is not where I believe this team creates its most immediate value.</p>
          <p>Our work sits closer to the business: finding the decisions that matter now, bringing trusted data and domain expertise into the loop, and using AI to make those decisions faster, clearer, and more consistent. Not AI for its own sake, but practical tools that people can understand, challenge, and use in their everyday work.</p>
          <p>The question I want to answer now is whether I can lead and grow a team of fifteen people who create that confidence at scale: a team trusted to connect domain expertise, data, and AI to the decisions the business needs to make now.</p>
        </div>
      </section>

      <section className="leadership-readiness" aria-label="The career that led me here">
        <p className="eyebrow">The career that led me here</p>
        <div className="leadership-narrative-copy">
          <p>For more than fifteen years, I have worked where technical judgment has consequences: prospects, high-pressure wells, portfolio renewal, risk, and the handover from an uncertain subsurface picture to a decision someone has to own. The real work, I learned, is helping specialists see the same evidence, disagree productively, and decide what to do next.</p>
          <p>Leading a multidisciplinary team during a regional rejuvenation PBE effort in the Netherlands showed me the power of aligning diverse expertise around a common set of facts. The challenge was not simply technical integration. It was creating the conditions for better decisions. Over the last six years, I have carried that lesson into digital products, data governance, analytics, and AI. Successful adoption happens when solutions solve real problems, integrate into daily work, and build confidence through consistent, measurable value.</p>
        </div>
        <blockquote className="leadership-pullquote leadership-readiness-quote">I do not want the next chapter of my career to be a story about what I can do alone.</blockquote>
        <figure className="leadership-designer-bridge">
          <img src={designerBridge} alt="A person connecting subsurface expertise with technology and AI." />
        </figure>
      </section>

      <section className="leadership-system-map" aria-labelledby="system-map-title">
        <details className="leadership-system-map-details">
          <summary>
            <span className="eyebrow">Already fluent across the system</span>
            <span className="leadership-system-map-copy">
              <span id="system-map-title" className="leadership-system-map-title" role="heading" aria-level={2}>Technical depth and delivery belong in the same conversation.</span>
              <span>I have learned to move between the evidence, the digital capabilities, the product choices, and the people who act on the result without losing sight of the decision at the centre.</span>
            </span>
            <ChevronDown className="leadership-system-map-chevron" size={22} aria-hidden="true" />
          </summary>
          <div className="leadership-system-map-detail">
            <IntegrationMap />
          </div>
        </details>
      </section>

      <section className="leadership-choice" aria-label="Why lead now">
        <p className="eyebrow">Why lead now</p>
        <div className="leadership-narrative-copy">
          <p>The Lead AI Embedment role needs someone who can speak credibly with geoscientists, data scientists, product owners, and asset stakeholders without reducing the work to generic innovation language. That is the bridge I have been building toward.</p>
          <p>AI has become accessible to many of us, and exploration is an important start. But for this programme to genuinely move forward, it needs someone who can take a problem from the first customer conversation through to something people trust in their everyday work: listen closely, connect the right disciplines, turn an idea into something real quickly, and earn the trust needed to bring it into day-to-day work. That is the kind of work I have built my reputation on.</p>
          <p>My career began in subsurface interpretation and evolved into analytics, product ownership, and AI-enabled decision support. That journey taught me that successful adoption rarely comes from technology alone. It comes from helping people frame better questions, challenge assumptions, and connect evidence to decisions. I want to use that experience to elevate the capability of the teams around me, create opportunities for others to lead, and build an environment where innovation is both practical and trusted. <span className="cover-letter-emphasis">That is the kind of team leadership I want to be accountable for</span>.</p>
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
        {leadershipProofs.map((proof) => <article className={`personal-leadership-card${proof.logoSrc ? ' has-logo' : ''}`} key={proof.title}><span>{proof.theme}</span><div className="personal-leadership-card-title"><h3>{proof.title}</h3>{proof.logoSrc && <img src={proof.logoSrc} alt={proof.logoAlt ?? ''} />}</div><p>{proof.description}</p>{proof.title === 'Environmental Awareness Campaign - Port Harcourt, Nigeria' && <button className="leadership-proof-cta" type="button" onClick={onOpenCampaign}>Click here for more <ArrowRight size={14} aria-hidden="true" /></button>}</article>)}
      </div>
    </section>
  </div>
}

function nextExperience(current: Exclude<ExperienceId, 'home' | 'campaign'>): Exclude<ExperienceId, 'home' | 'campaign'> {
  const order: Array<Exclude<ExperienceId, 'home' | 'campaign'>> = ['cover', 'leadership', 'journey', 'impact']
  return order[(order.indexOf(current) + 1) % order.length]
}