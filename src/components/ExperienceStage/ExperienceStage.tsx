import { useState, type CSSProperties, type RefObject } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, BatteryCharging, Check, ChevronDown, CircleDot, ExternalLink, HeartHandshake, Lightbulb, MapPin, MessageCircle, Network, ShieldCheck, Sprout } from 'lucide-react'
import { impactStories, integrationNodes, journeyCvProfile, journeyItems, journeyStatement, leadershipPillars, leadershipProofs, leadershipRhythms, leadershipSignals, thinkingNodes } from '../../content/content'
import type { ExperienceId } from '../../content/contentTypes'
import rafaelPortrait from '../../assets/candidate/rafael-navarro-portrait.png'

interface ExperienceStageProps {
  experience: Exclude<ExperienceId, 'home'>
  headingRef: RefObject<HTMLHeadingElement | null>
  onNavigate: (experience: ExperienceId) => void
}

const stageMeta = {
  cover: { eyebrow: 'Cover letter', title: 'Why this role. Why now.', intro: 'A case for the contribution I can make as Lead AI Embedment.' },
  journey: { eyebrow: 'Career overview', title: 'Resume / CV', intro: '' },
  leadership: { eyebrow: 'Leading the AI Embedment Team', title: 'How I will lead the team', intro: '' },
  impact: { eyebrow: 'Evidence, not claims', title: 'Proof of Leadership', intro: '' },
} as const

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
        <button type="button" className="button button-secondary" onClick={() => onNavigate(nextExperience(experience))}>
          Continue the story <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function Journey() {
  const [openRoleIndex, setOpenRoleIndex] = useState(0)

  return (
    <>
      <div className="journey-overview">
        <blockquote className="journey-preface">
          <span>Career statement</span>
          <p>{journeyStatement}</p>
        </blockquote>
        <CvProfile />
      </div>
      <div className="journey-timeline">
        {journeyItems.map((item, index) => (
          <details
            className="journey-card"
            key={`journey-role-${index}`}
            open={openRoleIndex === index}
            onToggle={(event) => setOpenRoleIndex(event.currentTarget.open ? index : -1)}
          >
            <summary className="journey-card-summary">
              <span className={`journey-marker${item.countryCodes.length > 1 ? ' journey-marker-mixed' : ''}`} aria-hidden="true">
                {item.countryCodes.map((countryCode) => (
                  <img key={countryCode} src={`https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${countryCode}.svg`} alt="" />
                ))}
              </span>
              <div className="journey-card-heading">
                  <div className="journey-heading-meta">
                    <h2>{item.title}</h2>
                    <span className={`journey-discipline journey-discipline-${item.discipline.toLowerCase()}`}>{item.discipline}</span>
                  </div>
                  <p className="journey-role-context">
                    <span>{item.organization}</span>
                    <span><MapPin size={14} aria-hidden="true" /> {item.location}</span>
                    <span>{item.period}</span>
                  </p>
                  <p className="journey-teaser">{item.teaser}</p>
              </div>
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
                {item.reference && <p className="journey-reference"><span>Reference:</span><strong>{item.reference.name}</strong><em>{item.reference.role}</em></p>}
            </div>
          </details>
        ))}
      </div>
    </>
  )
}

function CvProfile() {
  return (
    <section className="journey-cv-profile" aria-labelledby="cv-profile-title">
      <header>
        <p className="journey-proof-label">CV profile</p>
        <h2 id="cv-profile-title">Profile at a glance</h2>
      </header>
      <div className="cv-profile-lines">
        <div className="cv-profile-line"><h3>Digital Core</h3><p>{journeyCvProfile.digitalCore}</p></div>
        <div className="cv-profile-line"><h3>Subsurface Domain</h3><p>{journeyCvProfile.subsurfaceDomain}</p></div>
        <div className="cv-profile-line"><h3>Achievements</h3><ul>{journeyCvProfile.achievements.map((achievement, achievementIndex) => <li key={`achievement-${achievementIndex}`}>{achievement}</li>)}</ul></div>
        <div className="cv-profile-line"><h3>Education & certifications</h3><p>{journeyCvProfile.education}</p></div>
        <div className="cv-profile-line"><h3>References</h3><ul className="cv-references">{journeyCvProfile.references.map((reference, referenceIndex) => <li key={`reference-${referenceIndex}`}><strong>{reference.name}</strong><span>{reference.role}</span></li>)}</ul></div>
      </div>
    </section>
  )
}

function Thinking() {
  const shouldReduceMotion = useReducedMotion()
  return <div className="thinking-system"><div className="thinking-core"><span>Starting point</span><strong>Ambiguous<br />problem</strong><small>Technical, human, and delivery constraints</small></div><svg className="thinking-rings" viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="118" /><circle cx="300" cy="300" r="220" /><path d="M80 384 C178 55 461 75 531 274" /></svg><div className="thinking-nodes">{thinkingNodes.map((node) => <motion.article className={`thinking-node thinking-node-${node.order}`} key={node.id} initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.88 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: node.order * 0.06 }}><span className="node-number">{String(node.order).padStart(2, '0')}</span><h2>{node.title}</h2><p>{node.description}</p><small>{node.example}</small></motion.article>)}</div></div>
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
          <span>Frame the decision, state the hypothesis, connect the evidence, challenge assumptions, prototype with users, and scale only what proves useful.</span>
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

  return (
    <div className="leadership-view">
      <section className="leadership-ai-context" aria-label="What I want to build">
        <p className="eyebrow">The team I want to build</p>
        <div className="leadership-narrative-copy">
          <p>New models arrive faster than anyone can absorb them, inviting teams to chase releases, trust persuasive answers, or confuse activity with progress. I want to build a team that learns quickly without becoming frantic, keeping people, trusted data, and AI in one feedback loop.</p>
          <p>Conversational systems can make a weak answer sound persuasive. The response is to keep the loop intact: domain experts define and challenge the decision, governed sources make evidence traceable, analytics make patterns visible, and AI accelerates work inside real workflows where people can test, improve, or reject it.</p>
          <blockquote className="leadership-pullquote">Fast enough to matter. Rigorous enough to be trusted. Humble enough to change our minds.</blockquote>
        </div>
      </section>

      <section className="leadership-contract" aria-label="The contract with the team">
        <p className="eyebrow">The contract with the team</p>
        <div className="leadership-narrative-copy">
          <p>I will ask people to stay curious, say when they do not know, challenge assumptions, and own the outcomes they shape. AI work cannot wait for certainty; it needs people comfortable learning in public and correcting course without making every mistake personal.</p>
          <p>In return, I will know people rather than manage them at a distance, make time for feedback and growth, and create guardrails that make autonomy real. I cannot promise permanence in a changing organization, but I can make the next year consequential: purposeful work, visible learning, stronger relationships, and value each person can carry forward.</p>
        </div>
      </section>

      <OperatingSystem />

      <section className="leadership-promises" aria-labelledby="leadership-principles-title">
        <div className="leadership-section-heading">
          <p className="eyebrow">The promises made concrete</p>
          <h2 id="leadership-principles-title">The conditions I will work to create</h2>
        </div>
        <div className="leadership-practice-intro">
          <p>These are not management rituals. They are the conditions that let a team take on difficult work without losing its sense of purpose or one another.</p>
          <p>When people know they are trusted, supported, and expected to contribute their judgment, they can move with more confidence and make better decisions together.</p>
        </div>
        <div className="leadership-pillars">
          {leadershipPillars.map((pillar, index) => {
            const Icon = pillarIcons[index]
            return <article className="leadership-pillar" key={pillar.title}>
              <Icon size={22} aria-hidden="true" />
              <h3>{pillar.title}</h3>
              <p>{pillar.statement}</p>
            </article>
          })}
        </div>
        <p className="leadership-practices"><strong>In practice:</strong> Each person has a visible growth narrative; teams make local trade-offs inside clear guardrails; and evidence, decision records, and constructive dissent keep the work honest.</p>
      </section>

      <section className="leadership-rhythm" aria-labelledby="leadership-rhythm-title">
        <div className="leadership-section-heading">
          <p className="eyebrow">The team rhythm</p>
          <h2 id="leadership-rhythm-title">Enough cadence to align. Enough space to do the work.</h2>
        </div>
        <div className="leadership-practice-intro">
          <p>A team of fifteen needs more than meetings; it needs a dependable rhythm in which people can ask for help early, learn from one another, and see how their work connects to the whole.</p>
          <p>The cadence below protects time for deep work while ensuring that learning, decisions, and recognition do not get lost in the pace of delivery.</p>
        </div>
        <div className="leadership-rhythm-list">
          {leadershipRhythms.map((rhythm) => <article key={rhythm.cadence}>
            <span>{rhythm.cadence}</span>
            <div><h3>{rhythm.title}</h3><p>{rhythm.description}</p></div>
          </article>)}
        </div>
        <p className="leadership-async"><strong>Async first:</strong> Status, decisions, documentation, and help requests live in shared spaces. Meetings are reserved for collaboration, learning, and decisions that need people in the room.</p>
      </section>

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
            return <article key={signal.title}><Icon size={19} aria-hidden="true" /><div><h3>{signal.title}</h3><p>{signal.description}</p></div></article>
          })}
        </div>
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
          <p>I want this job because I have lived on both sides of the divide it is meant to close: the pressure of a subsurface decision, and the digital work that loses force when it is disconnected from its people and workflow.</p>
          <p>This is an opportunity to bring those worlds together, not to build AI for its own sake, but to help assets make better decisions with tools people can understand, challenge, and use. The question I want to answer now is whether I can help fifteen people create that confidence together, at a scale no individual can reach alone.</p>
        </div>
      </section>

      <section className="leadership-readiness" aria-label="The career that led me here">
        <p className="eyebrow">The career that led me here</p>
        <div className="leadership-narrative-copy">
          <p>For more than fifteen years, I have worked where technical judgment has consequences: prospects, high-pressure wells, portfolio renewal, risk, and the handover from an uncertain subsurface picture to a decision someone has to own. The real work, I learned, is helping specialists see the same evidence, disagree productively, and decide what to do next.</p>
          <p>Coordinating a multidisciplinary portfolio refresh in the Netherlands showed me what happens when ten disciplines share an evidence base rather than defend separate interpretations. Over the last six years, that same lesson has shaped my work with product roadmaps, governed data, analytics, and AI: a solution matters only when it fits the workflow, saves time, sharpens a decision, and earns trust.</p>
        </div>
      </section>

      <section className="leadership-system-map" aria-labelledby="system-map-title">
        <p className="eyebrow">Already fluent across the system</p>
        <div className="leadership-system-map-copy">
          <h2 id="system-map-title">Technical depth and delivery belong in the same conversation.</h2>
          <p>I have learned to move between the evidence, the digital capabilities, the product choices, and the people who act on the result without losing sight of the decision at the centre.</p>
        </div>
        <IntegrationMap />
      </section>

      <section className="leadership-choice" aria-label="Why lead now">
        <p className="eyebrow">Why lead now</p>
        <div className="leadership-narrative-copy">
          <p>The Lead AI Embedment role needs someone credible with a geoscientist, data scientist, product manager, and asset stakeholder without flattening the work into generic innovation language. That is the bridge I have been building toward.</p>
          <blockquote className="leadership-pullquote">I do not want the next chapter of my career to be a story about what I can do alone.</blockquote>
          <p>I want to use my technical fluency to raise the capability around me: ask the sharper question, recognize when a model has drifted from its decision, and give younger specialists room to lead. That is the multiplier effect I want to be accountable for.</p>
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
    <section className="technical-impact" aria-labelledby="technical-impact-title">
      <div className="leadership-proof-heading">
        <div><h2 id="technical-impact-title">Leadership improves the decision.</h2><p>These examples show how technical depth, collaboration, and delivery turn complex evidence into practical outcomes.</p></div>
      </div>
      <div className="impact-grid">{impactStories.map((story) => <article className="impact-card" key={story.title}><div className="impact-card-top"><p className="metric">{story.metric}</p><ul className="chips">{story.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div><h3>{story.title}</h3><dl><div><dt>Situation</dt><dd>{story.situation}</dd></div><div><dt>Complexity</dt><dd>{story.complexity}</dd></div><div><dt>My role</dt><dd>{story.myRole}</dd></div><div><dt>Action</dt><dd>{story.action}</dd></div><div><dt>Outcome</dt><dd>{story.outcome}</dd></div></dl><p className="relevance"><Check size={15} aria-hidden="true" /> {story.relevance}</p></article>)}</div>
    </section>
  </div>
}

function nextExperience(current: Exclude<ExperienceId, 'home'>): Exclude<ExperienceId, 'home'> {
  const order: Array<Exclude<ExperienceId, 'home'>> = ['cover', 'leadership', 'journey', 'impact']
  return order[(order.indexOf(current) + 1) % order.length]
}