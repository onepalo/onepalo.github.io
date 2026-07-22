import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { RefObject } from 'react'
import cyclist from '../../assets/candidate/Cycling/DirtyCycling.png'
import { leadershipProofs } from '../../content/content'

interface EnvironmentalCampaignProps {
  headingRef: RefObject<HTMLHeadingElement | null>
  onReturn: () => void
}

export function EnvironmentalCampaign({ headingRef, onReturn }: EnvironmentalCampaignProps) {
  const campaignReferences = leadershipProofs.find((proof) => proof.title === 'Environmental Awareness Campaign - Lagos, Nigeria')?.references ?? []

  return (
    <main className="campaign-view" aria-labelledby="campaign-title">
      <button className="campaign-back" type="button" onClick={onReturn}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to Proof
      </button>
      <section className="campaign-story">
        <p className="campaign-eyebrow">Lagos, Nigeria</p>
        <h1 id="campaign-title" tabIndex={-1} ref={headingRef}>When air-quality data became a public question.</h1>
        <p className="campaign-lede">A personal concern about the air in Lagos became a public-data campaign: making conditions more visible, understandable, and harder to ignore.</p>
        <div className="campaign-story-space" aria-label="Environmental campaign story in progress">
          <p>Campaign story</p>
          <span>The full story is taking shape, Under Construction.</span>
        </div>
        <aside className="campaign-references" aria-label="Published coverage">
          <strong>Featured by</strong>
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
      <figure className="campaign-cyclist" aria-hidden="true">
        <img src={cyclist} alt="" />
      </figure>
    </main>
  )
}