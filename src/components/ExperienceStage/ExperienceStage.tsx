import { useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, BatteryCharging, ChevronDown, CircleDot, ExternalLink, HeartHandshake, Lightbulb, Mail, MapPin, MessageCircle, Network, ShieldCheck, Sprout } from 'lucide-react'
import { integrationNodes, journeyCvProfile, journeyItems, journeyStatement, leadershipPillars, leadershipProofs, leadershipRhythms, leadershipSignals, thinkingNodes } from '../../content/content'
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
  experience: Exclude<ExperienceId, 'home'>
  headingRef: RefObject<HTMLHeadingElement | null>
  onNavigate: (experience: ExperienceId) => void
}

const stageMeta = {
  cover: { eyebrow: 'Cover letter', title: 'Why this role. Why now.', intro: 'The Value I Can Bring as Team Lead, AI Embedment.' },
  journey: { eyebrow: 'Career overview', title: 'Resume / CV', intro: '' },
  leadership: { eyebrow: 'Leading the AI Embedment Team', title: 'How I will lead the team', intro: '' },
  impact: { eyebrow: 'Evidence, not claims', title: 'Proof of Leadership', intro: '' },
} as const

const leadershipPrincipleDetails = [
  { behavior: 'Regular one-to-ones make room for strengths, energy, workload, growth, and the context behind performance.', evidence: 'Each person can point to a visible growth narrative, a stretch responsibility, or a meaningful exposure opportunity.' },
  { behavior: 'Teams decide locally within clear quality, ownership, and delivery guardrails rather than wait for permission.', evidence: 'Decision records are clear, reusable work improves, and teams make trade-offs without losing technical rigor.' },
  { behavior: 'Assumptions, uncertainty, and dissent are brought into the work early, while there is still time to change course.', evidence: 'Risks and requests for help surface without blame, and stronger evidence changes decisions in public.' },
] as const

const leadershipRhythmDetails = [
  { duration: '60 minutes', outcome: 'Priorities, dependencies, evidence, learning, and recognition stay visible across the team.', workingAgreement: 'Async first: Status, decisions, documentation, and help requests live in shared spaces. Meetings are reserved for collaboration, learning, and decisions that need people in the room.' },
  { duration: '45 minutes per direct report', outcome: 'People leave with clearer support, a development focus, and a realistic view of their workload and energy.', workingAgreement: 'Protect the conversation: This is dedicated time for feedback, development, workload, and context. It is not a status meeting.' },
  { duration: 'Quarterly reset', outcome: 'The team explicitly continues, scales, pauses, or stops work based on value, trust, and adoption.', workingAgreement: 'Make the trade-offs visible: Review the evidence together, then name what the team will continue, scale, pause, or stop.' },
] as const

const leadershipSignalDetails = [
  'Capability growth becomes visible in the work people own, not only in a development plan.',
  'Dissent, risk, and requests for help arrive early enough to improve the work rather than explain a failure.',
  'More decisions, facilitation, and mentoring happen through the team without waiting for a manager to intervene.',
  'Delivery remains ambitious while people retain the energy and enjoyment to build together over time.',
] as const

const flagSources = { us: usFlag, nl: nlFlag, ng: ngFlag, qa: qaFlag, ve: veFlag, co: coFlag, mx: mxFlag } as const

function handleTabListNavigation(event: KeyboardEvent<HTMLButtonElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

  const tabList = event.currentTarget.closest('[role="tablist"]')
  const tabs = tabList ? Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')) : []
  const currentIndex = tabs.indexOf(event.currentTarget)
  if (currentIndex < 0) return

  event.preventDefault()
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  tabs[nextIndex].focus()
  tabs[nextIndex].click()
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
      {experience === 'impact' && <LeadershipProof />}
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
        <section className="journey-statement" aria-labelledby="career-statement-title">
          <span>Career statement</span>
          <p id="career-statement-title">{journeyStatement.context} <span className="journey-statement-key">{journeyStatement.keyStatement}</span>{journeyStatement.conclusion}</p>
        </section>
        <CvProfile />
      </div>
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
                {item.reference && <p className="journey-reference"><span className="journey-reference-contact"><Mail size={15} strokeWidth={2} aria-hidden="true" /><span>Contact mail</span></span><strong>{item.reference.name}</strong><em>{item.reference.role}</em></p>}
            </div>
          </details>
        ))}
      </div>
    </>
  )
}

function CvProfile() {
  return (
    <section className="journey-cv-profile" aria-label="CV profile">
      <div className="cv-profile-columns">
        <div className="cv-profile-column">
          <div className="cv-profile-line"><h3>Digital Core</h3><p>{journeyCvProfile.digitalCore}</p></div>
          <div className="cv-profile-line"><h3>Subsurface Domain</h3><p>{journeyCvProfile.subsurfaceDomain}</p></div>
          <div className="cv-profile-line"><h3>Education & certifications</h3><p>{journeyCvProfile.education}</p></div>
        </div>
        <div className="cv-profile-column">
          <div className="cv-profile-line"><h3>Achievements</h3><ul>{journeyCvProfile.achievements.map((achievement, achievementIndex) => <li key={`achievement-${achievementIndex}`}>{achievement}</li>)}</ul></div>
          <div className="cv-profile-line"><h3>References</h3><ul className="cv-references">{journeyCvProfile.references.map((reference, referenceIndex) => <li key={`reference-${referenceIndex}`}><strong>{reference.name}</strong><span>{reference.role}</span></li>)}</ul></div>
        </div>
      </div>
    </section>
  )
}

function Thinking() {
  const [activeNodeId, setActiveNodeId] = useState(thinkingNodes[0].id)
  const activeNode = thinkingNodes.find((node) => node.id === activeNodeId) ?? thinkingNodes[0]

  return <div className="thinking-system">
    <div className="thinking-cycle">
      <div className="thinking-core"><span>Starting point</span><strong>Ambiguous<br />problem</strong><small>Technical, human, and delivery constraints</small></div>
      <svg className="thinking-rings" viewBox="0 0 600 600" aria-hidden="true"><defs><marker id="thinking-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" /></marker></defs><circle cx="300" cy="300" r="118" /><circle cx="300" cy="300" r="220" /><path d="M80 384 C178 55 461 75 531 274" /><path className="thinking-cycle-arrow" d="M300 80 A220 220 0 1 1 121 172" markerEnd="url(#thinking-arrowhead)" /></svg>
      <div className="thinking-steps" aria-label="Decision cycle">
        {thinkingNodes.map((node) => <button type="button" className={`thinking-step thinking-step-${node.order}${activeNodeId === node.id ? ' is-active' : ''}`} key={node.id} onClick={() => setActiveNodeId(node.id)} aria-pressed={activeNodeId === node.id}><span>{String(node.order).padStart(2, '0')}</span><strong>{node.title}</strong></button>)}
      </div>
    </div>
    <section className="thinking-detail" aria-live="polite" aria-labelledby="thinking-detail-title">
      <p className="thinking-detail-label">Selected step {String(activeNode.order).padStart(2, '0')}</p>
      <div><h2 id="thinking-detail-title">{activeNode.title}</h2><p>{activeNode.description}</p><p className="thinking-example"><span>In practice</span>{activeNode.example}</p></div>
    </section>
  </div>
}

function IntegrationMap() {
  return <div className="integration-map"><svg viewBox="0 0 1000 700" aria-hidden="true">{integrationNodes.map((node) => <line key={node.id} x1="500" y1="350" x2={node.x * 10} y2={node.y * 7} />)}</svg><div className="integration-center"><img src={rafaelPortrait} alt="Rafael Navarro" /></div>{integrationNodes.map((node) => <article className={`integration-node connection-${node.connectionType}`} key={node.id} style={{ '--node-x': `${node.x}%`, '--node-y': `${node.y}%` } as CSSProperties}><CircleDot size={15} aria-hidden="true" /><h2>{node.label}</h2><p>{node.description}</p></article>)}</div>
}

function OperatingSystem() {
  return <section className="operating-system-section" aria-labelledby="operating-system-title">
    <details className="operating-system">
      <summary>
        <span className="operating-system-label">The operating system</span>
        <span className="operating-system-copy">
          <span id="operating-system-title" className="operating-system-title" role="heading" aria-level={2}>Make the thinking visible before asking people to move.</span>
          <span>How these principles become daily practice.</span>
        </span>
        <ChevronDown className="operating-system-chevron" size={22} aria-hidden="true" />
      </summary>
      <div className="operating-system-detail">
        <Thinking />
      </div>
    </details>
  </section>
}

function Leadership() {
  const pillarIcons = [HeartHandshake, ShieldCheck, Lightbulb]
  const signalIcons = [Sprout, MessageCircle, Network, BatteryCharging]
  const [activeLeadershipSection, setActiveLeadershipSection] = useState<'principles' | 'rhythm' | 'signals'>('principles')
  const [activePillarIndex, setActivePillarIndex] = useState(0)
  const [activeRhythmIndex, setActiveRhythmIndex] = useState(0)
  const [activeSignalIndex, setActiveSignalIndex] = useState(0)
  const activePillar = leadershipPillars[activePillarIndex]
  const activePillarDetail = leadershipPrincipleDetails[activePillarIndex]
  const ActivePillarIcon = pillarIcons[activePillarIndex]
  const activeRhythm = leadershipRhythms[activeRhythmIndex]
  const activeRhythmDetail = leadershipRhythmDetails[activeRhythmIndex]
  const activeSignal = leadershipSignals[activeSignalIndex]
  const ActiveSignalIcon = signalIcons[activeSignalIndex]
  const activeLeadershipStep = { principles: 0, rhythm: 1, signals: 2 }[activeLeadershipSection]

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
          <p><span className="cover-letter-emphasis">I want to build a team that learns quickly without becoming frantic.</span> New models invite teams to chase releases, trust persuasive answers, or confuse activity with progress. My response is to keep people, trusted evidence, and AI in one feedback loop, so domain expertise shapes decisions and the work earns adoption.</p>
          <div className="leadership-intent-commitments">
            <p><strong>What I ask of the team:</strong> I will ask people to stay curious, say when they do not know, challenge assumptions, and own the outcomes they shape. AI work cannot wait for certainty; it needs people comfortable learning in public and correcting course without making every mistake personal.</p>
            <p><strong>What the team can expect from me:</strong> I will know people rather than manage them at a distance, make time for feedback and growth, and create guardrails that make autonomy real. I cannot promise permanence in a changing organization, but I can help make the time we do control deeply worthwhile: purposeful work, visible learning, stronger relationships, and meaningful value each person can carry forward. My aim is to build a team whose creativity, trust, and sustained performance make its contribution unmistakable, and make the organization think carefully before losing that capability.</p>
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
            <p className="eyebrow">How the team operates</p>
            <h2 id="leadership-operating-model-title">The practices that make the commitment real.</h2>
          </div>
        </header>
        <div className="leadership-focus-selector" role="tablist" aria-label="Leadership areas" style={{ '--active-step': activeLeadershipStep } as CSSProperties}>
          <button type="button" role="tab" id="leadership-principles-tab" aria-selected={activeLeadershipSection === 'principles'} aria-controls="leadership-focus-panel" onClick={() => setActiveLeadershipSection('principles')} onKeyDown={handleTabListNavigation}><HeartHandshake className="leadership-focus-icon" size={18} aria-hidden="true" /><span className="leadership-focus-label">Principles</span><span className="leadership-focus-description">How I create trust</span></button>
          <button type="button" role="tab" id="leadership-rhythm-tab" aria-selected={activeLeadershipSection === 'rhythm'} aria-controls="leadership-focus-panel" onClick={() => setActiveLeadershipSection('rhythm')} onKeyDown={handleTabListNavigation}><Network className="leadership-focus-icon" size={18} aria-hidden="true" /><span className="leadership-focus-label">Rhythm</span><span className="leadership-focus-description">How we stay aligned</span></button>
          <button type="button" role="tab" id="leadership-signals-tab" aria-selected={activeLeadershipSection === 'signals'} aria-controls="leadership-focus-panel" onClick={() => setActiveLeadershipSection('signals')} onKeyDown={handleTabListNavigation}><Sprout className="leadership-focus-icon" size={18} aria-hidden="true" /><span className="leadership-focus-label">Signals</span><span className="leadership-focus-description">What success looks like</span></button>
        </div>
        <div id="leadership-focus-panel" role="tabpanel" aria-labelledby={`leadership-${activeLeadershipSection}-tab`}>
          {activeLeadershipSection === 'principles' && (
      <section className="leadership-principles" aria-labelledby="leadership-principles-title">
        <div className="leadership-section-heading">
          <p className="eyebrow">The promises made concrete</p>
          <h2 id="leadership-principles-title">The conditions I will work to create</h2>
        </div>
        <div className="leadership-practice-intro">
          <p>These are not management rituals. They are the conditions that let a team take on difficult work without losing its sense of purpose or one another.</p>
          <p>When people know they are trusted, supported, and expected to contribute their judgment, they can move with more confidence and make better decisions together.</p>
        </div>
        <div className="leadership-principle-selector" role="tablist" aria-label="Leadership principles">
          {leadershipPillars.map((pillar, index) => {
            const Icon = pillarIcons[index]
            return <button type="button" className={activePillarIndex === index ? 'is-active' : ''} role="tab" id={`principle-${index}-tab`} aria-selected={activePillarIndex === index} aria-controls="principle-panel" key={pillar.title} onClick={() => setActivePillarIndex(index)} onKeyDown={handleTabListNavigation}><Icon size={17} aria-hidden="true" /><h3>{pillar.title}</h3></button>
          })}
        </div>
        <section className="leadership-principle-detail" id="principle-panel" role="tabpanel" aria-labelledby={`principle-${activePillarIndex}-tab`}>
          <ActivePillarIcon size={23} aria-hidden="true" />
          <div>
            <p className="leadership-detail-label">Selected principle</p>
            <h3>{activePillar.title}</h3>
            <p className="leadership-principle-statement">{activePillar.statement}</p>
            <div className="leadership-detail-grid">
              <p><span>What this enables</span>{activePillarDetail.behavior}</p>
              <p><span>Evidence I would expect</span>{activePillarDetail.evidence}</p>
            </div>
          </div>
        </section>
      </section>
          )}

          {activeLeadershipSection === 'rhythm' && (
      <section className="leadership-rhythm" aria-labelledby="leadership-rhythm-title">
        <div className="leadership-section-heading">
          <p className="eyebrow">The team rhythm</p>
          <h2 id="leadership-rhythm-title">Enough cadence to align. Enough space to do the work.</h2>
        </div>
        <div className="leadership-practice-intro">
          <p>A team of fifteen needs more than meetings; it needs a dependable rhythm in which people can ask for help early, learn from one another, and see how their work connects to the whole.</p>
          <p>The cadence below protects time for deep work while ensuring that learning, decisions, and recognition do not get lost in the pace of delivery.</p>
        </div>
        <div className="leadership-rhythm-selector" role="tablist" aria-label="Team rhythm">
          {leadershipRhythms.map((rhythm, index) => <button type="button" className={activeRhythmIndex === index ? 'is-active' : ''} role="tab" id={`rhythm-${index}-tab`} aria-selected={activeRhythmIndex === index} aria-controls="rhythm-panel" key={rhythm.cadence} onClick={() => setActiveRhythmIndex(index)} onKeyDown={handleTabListNavigation}>
            <span>{rhythm.cadence}</span>
            <h3>{rhythm.title}</h3>
          </button>)}
        </div>
        <section className="leadership-rhythm-detail" id="rhythm-panel" role="tabpanel" aria-labelledby={`rhythm-${activeRhythmIndex}-tab`}>
          <p className="leadership-detail-label">{activeRhythm.cadence} · {activeRhythmDetail.duration}</p>
          <div><h3>{activeRhythm.title}</h3><p className="leadership-detail-statement">A dependable cadence makes shared progress visible without turning the week into a meeting.</p><p>{activeRhythm.description}</p><p className="leadership-outcome"><span>Result</span>{activeRhythmDetail.outcome}</p></div>
        </section>
        <p className="leadership-async"><strong>Working agreement:</strong> {activeRhythmDetail.workingAgreement}</p>
      </section>
          )}

          {activeLeadershipSection === 'signals' && (
      <section className="leadership-signals" aria-labelledby="leadership-signals-title">
        <div className="leadership-section-heading">
          <p className="eyebrow">What success looks like</p>
          <h2 id="leadership-signals-title">Signals I would expect to see by month 12</h2>
        </div>
        <div className="leadership-practice-intro">
          <p>Success will not only show up in the workflows we deliver. It will show up in how people grow, how quickly risks surface, and how much leadership the team can carry without waiting for permission.</p>
        </div>
        <div className="leadership-signals-grid">
          {leadershipSignals.map((signal, index) => {
            const Icon = signalIcons[index]
            return <button type="button" className={activeSignalIndex === index ? 'is-active' : ''} key={signal.title} onClick={() => setActiveSignalIndex(index)} aria-pressed={activeSignalIndex === index}><Icon size={19} aria-hidden="true" /><span>{signal.title}</span></button>
          })}
        </div>
        <section className="leadership-signal-detail" aria-live="polite">
          <ActiveSignalIcon size={22} aria-hidden="true" />
          <div><p className="leadership-detail-label">Signal to observe</p><h3>{activeSignal.title}</h3><p className="leadership-detail-statement">The proof is in what the team can do, say, and sustain without waiting for direction.</p><p>{activeSignal.description}</p><p className="leadership-outcome"><span>What I would notice</span>{leadershipSignalDetails[activeSignalIndex]}</p></div>
        </section>
      </section>
          )}
        </div>
      </section>

      <OperatingSystem />
    </div>
  )
}

function CoverLetter() {
  return (
    <div className="leadership-view">
      <section className="leadership-opening" aria-label="Why I want this job">
        <p className="eyebrow">Why I want this job</p>
        <div className="leadership-opening-copy">
          <p>I want this job because <span className="cover-letter-emphasis">I have lived on both sides of the divide it is meant to close</span>: the pressure of a subsurface decision, and the digital work that loses force when it becomes disconnected from the people and workflows it is meant to serve.</p>
          <p>I also understand that not all AI work has the same purpose. There is an important place for frontier AI: teams can spend months or years testing new models, capabilities, and systems whose value may only become clear over time. But that is not where I believe this team creates its most immediate value.</p>
          <p>Our work sits closer to the business: finding the decisions that matter now, bringing trusted data and domain expertise into the loop, and using AI to make those decisions faster, clearer, and more consistent. <span className="cover-letter-emphasis">Not AI for its own sake, but practical tools that people can understand, challenge, and use in their everyday work.</span></p>
          <p>The question I want to answer now is whether I can <span className="cover-letter-emphasis">lead and grow a team of fifteen people who create that confidence at scale</span>: a team trusted to connect domain expertise, data, and AI to the decisions the business needs to make now.</p>
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
          <p>The Lead AI Embedment role needs someone credible with a geoscientist, data scientist, product owner, and asset stakeholder without flattening the work into generic innovation language. That is the bridge I have been building toward.</p>
          <p>My career began in subsurface interpretation and evolved into analytics, product ownership, and AI-enabled decision support. That journey taught me that successful adoption rarely comes from technology alone. It comes from helping people frame better questions, challenge assumptions, and connect evidence to decisions. I want to use that experience to elevate the capability of the teams around me, create opportunities for others to lead, and build an environment where innovation is both practical and trusted. <span className="cover-letter-emphasis">That is the multiplier effect I want to be accountable for</span>.</p>
        </div>
      </section>
    </div>
  )
}

function LeadershipProof() {
  return <div className="leadership-proof-view">
    <section className="personal-leadership" aria-labelledby="beyond-day-job-title">
      <div className="leadership-proof-heading">
        <div>
          <h2 id="beyond-day-job-title">Leadership is a practice, not a title.</h2>
          <p>The same habits behind my technical work also shape what I create, lead, and pursue beyond the day job.</p>
        </div>
      </div>
      <div className="personal-leadership-grid">
        {leadershipProofs.map((proof) => <article className={`personal-leadership-card${proof.logoSrc ? ' has-logo' : ''}`} key={proof.title}><span>{proof.theme}</span><div className="personal-leadership-card-title"><h3>{proof.title}</h3>{proof.logoSrc && <img src={proof.logoSrc} alt={proof.logoAlt ?? ''} />}</div><p>{proof.description}</p>{proof.references && <div className="leadership-proof-references"><strong>Featured by</strong><ul>{proof.references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.label} <ExternalLink size={12} aria-hidden="true" /></a></li>)}</ul></div>}</article>)}
      </div>
    </section>
  </div>
}

function nextExperience(current: Exclude<ExperienceId, 'home'>): Exclude<ExperienceId, 'home'> {
  const order: Array<Exclude<ExperienceId, 'home'>> = ['cover', 'leadership', 'journey', 'impact']
  return order[(order.indexOf(current) + 1) % order.length]
}