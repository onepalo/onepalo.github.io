import { useState } from 'react'
import { CircleHelp, X } from 'lucide-react'
import type { HeroContent, ExperienceId } from '../../content/contentTypes'
import { useDialogController } from '../../utils/useDialogController'
import { CharacterVisual } from '../CharacterVisual/CharacterVisual'
import { WorldNav } from '../WorldNav/WorldNav'

interface HeroProps {
  content: HeroContent
  onOpenWorld: (experience: ExperienceId) => void
}

export function Hero({ content, onOpenWorld }: HeroProps) {
  const signature = 'By Rafael Navarro'
  const [isAiPerspectiveOpen, setIsAiPerspectiveOpen] = useState(false)
  const closeAiPerspective = () => setIsAiPerspectiveOpen(false)
  const closeButtonRef = useDialogController<HTMLButtonElement>(isAiPerspectiveOpen, closeAiPerspective)

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="contour-field" aria-hidden="true">
        <svg viewBox="0 0 1440 850" preserveAspectRatio="none"><path d="M-40 190 C 170 80 250 325 450 194 S 700 46 887 188 S 1215 300 1480 112" /><path d="M-80 226 C 160 117 255 369 456 232 S 714 82 892 226 S 1199 334 1500 148" /><path d="M-30 661 C 172 463 400 785 622 613 S 1032 440 1490 684" /><path d="M-20 699 C 178 496 398 819 618 648 S 1028 474 1470 719" /></svg>
      </div>
      <h1 id="hero-title" className="sr-only">{content.title}</h1>
      <WorldNav onOpenWorld={onOpenWorld} />
      <CharacterVisual />
      <button
        className="hero-ai-perspective-trigger"
        type="button"
        onClick={() => setIsAiPerspectiveOpen(true)}
        aria-label="Read Rafael's perspective on working with AI"
        aria-expanded={isAiPerspectiveOpen}
        aria-controls="ai-perspective-dialog"
        title="A note on working with AI"
      >
        <CircleHelp size={22} aria-hidden="true" />
      </button>
      <div className="author-signature" aria-hidden="true">
        <span className="signature-spark signature-spark-1" />
        <span className="signature-spark signature-spark-2" />
        <span className="signature-spark signature-spark-3" />
        <span className="signature-spark signature-spark-4" />
        <span className="signature-spark signature-spark-5" />
        <span className="signature-copy">
          {Array.from(signature).map((letter, index) => (
            <span className="signature-letter" style={{ animationDelay: `${0.3 + index * 0.075}s` }} key={`${letter}-${index}`}>
              {letter === ' ' ? '\u00a0' : letter}
            </span>
          ))}
        </span>
      </div>
      {isAiPerspectiveOpen && (
        <div className="hero-ai-perspective-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAiPerspective() }}>
          <section className="hero-ai-perspective-dialog" id="ai-perspective-dialog" role="dialog" aria-modal="true" aria-label="Rafael's perspective on working with AI">
            <header>
              <p>A note on working with AI</p>
              <button ref={closeButtonRef} className="hero-ai-perspective-close" type="button" onClick={closeAiPerspective} aria-label="Close AI perspective" title="Close">
                <X size={21} aria-hidden="true" />
              </button>
            </header>
            <div className="hero-ai-perspective-copy">
              <p>I use AI openly. It helps me explore ideas, test assumptions, and learn faster. Working across countries, disciplines, languages, and increasingly complex data has taught me that useful insight often comes from bringing different perspectives together. AI is helpful there: it can connect concepts, surface patterns, and open up questions I might not have considered.</p>
              <p>But producing options is not the same as understanding a problem. The important work starts after the options appear: deciding which signals matter, questioning what seems obvious, judging uncertainty, and choosing what is worth doing. That takes context, experience, and accountability. AI can inform those decisions, but it cannot own them.</p>
              <p><strong>AI opens possibilities. Human judgment makes them real.</strong></p>
              <p><em>If AI eventually develops into something approaching AGI, we may need to revisit many of today's assumptions about expertise, work, responsibility, and value creation. Until then, I see AI as a powerful tool for extending human thinking, not replacing it.</em></p>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}