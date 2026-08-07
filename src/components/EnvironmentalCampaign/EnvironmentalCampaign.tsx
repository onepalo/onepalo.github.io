import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { RefObject } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import cyclist from '../../assets/candidate/Cycling/DirtyCycling.png'
import monitor from '../../assets/candidate/Cycling/RN_AirMonitor.png'
import playgroundResidue from '../IMG2018_8516.jpeg'
import { campaignStory, leadershipProofs } from '../../content/content'

interface EnvironmentalCampaignProps {
  headingRef: RefObject<HTMLHeadingElement | null>
  onReturn: () => void
}

export function EnvironmentalCampaign({ headingRef, onReturn }: EnvironmentalCampaignProps) {
  const campaignReferences = leadershipProofs.find((proof) => proof.title === 'Environmental Awareness Campaign - Nigeria')?.references ?? []
  const shouldReduceMotion = useReducedMotion()

  return (
    <main className="campaign-view" aria-labelledby="campaign-title">
      <button className="campaign-back" type="button" onClick={onReturn}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to Proof
      </button>
      <div className="campaign-scroll-shell">
        <div className="campaign-story-column">
          <section className="campaign-narrative">
            <header className="campaign-intro">
              <p className="campaign-eyebrow">{campaignStory.eyebrow} / {campaignStory.location}</p>
              <h1 id="campaign-title" tabIndex={-1} ref={headingRef}>{campaignStory.title}</h1>
              <p className="campaign-lede">{campaignStory.lede}</p>
              <p className="campaign-scroll-cue" aria-hidden="true">Scroll to follow the signal</p>
            </header>
            <aside className="campaign-rider-stage-mobile" aria-label="Cyclist after a ride in Port Harcourt, the starting point for the air-quality investigation.">
              <figure className="campaign-rider">
                <img src={cyclist} alt="" />
              </figure>
              <p className="campaign-rider-caption">Port Harcourt / a question begins</p>
            </aside>
            {campaignStory.acts.map((act) => (
              <section className={`campaign-act campaign-act--${act.id}`} key={act.id} aria-labelledby={`campaign-${act.id}-title`}>
                <motion.div
                  className="campaign-act-copy"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.48 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                >
                  <p className="campaign-chapter">{act.chapter}</p>
                  <h2 id={`campaign-${act.id}-title`}>{act.title}</h2>
                  <p>{act.body}</p>
                  {act.reference && (
                    <a className="campaign-source-link" href={act.reference.url} target="_blank" rel="noopener noreferrer">
                      {act.reference.label} <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                  {act.id === 'trace' && (
                    <motion.figure
                      className="campaign-personal-evidence"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.28 }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.18 }}
                    >
                      <img src={playgroundResidue} alt="Rafael Navarro's young son at a Port Harcourt playground, holding up hands marked with dark residue." />
                      <figcaption>A few minutes at a playground / the concern became personal.</figcaption>
                    </motion.figure>
                  )}
                  {act.id === 'signal' && (
                    <motion.figure
                      className="campaign-monitor"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.28 }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.18 }}
                    >
                      <img src={monitor} alt="Rafael Navarro holding the air-quality monitor used for the public measurements." />
                      <figcaption>At home, a question became a measurement.</figcaption>
                    </motion.figure>
                  )}
                </motion.div>
              </section>
            ))}
          </section>

          <section className="campaign-closing" aria-label="Campaign conclusion and reporting">
            <p>{campaignStory.closing}</p>
            <aside className="campaign-references" aria-label="Reporting and context">
              <strong>Reporting and context</strong>
              <ul>
                {campaignReferences.map((reference) => (
                  <li key={reference.url}>
                    <a href={reference.url} target="_blank" rel="noopener noreferrer">
                      {reference.label} <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        </div>
        <aside className="campaign-rider-stage" aria-label="Cyclist after a ride in Port Harcourt, the starting point for the air-quality investigation.">
          <figure className="campaign-rider">
            <img src={cyclist} alt="" />
          </figure>
          <p className="campaign-rider-caption">Port Harcourt / a question begins</p>
        </aside>
      </div>
    </main>
  )
}