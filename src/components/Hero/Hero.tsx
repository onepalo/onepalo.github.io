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
              <p>I use AI openly. It helps me explore ideas, test assumptions, and learn faster. Having worked across countries, disciplines, languages, and increasingly complex data environments, I've learned that valuable insights often emerge at the intersection of different perspectives. AI is exceptionally useful in that space: it helps me connect concepts, surface patterns, and explore lines of inquiry that might otherwise remain undiscovered.</p>
              <p>But generating possibilities is not the same as creating understanding. The most important work still happens after the options appear: deciding which signals matter, questioning what seems obvious, evaluating uncertainty, and determining what actions are worth pursuing. Those decisions require context, experience, and accountability. AI can inform them, but it cannot own them.</p>
              <p><strong>AI expands the space of possibilities. Human judgment determines which possibilities become reality.</strong></p>
              <p><em>If AI eventually evolves into something approaching AGI, many of today's assumptions about expertise, work, responsibility, and value creation may need to be reconsidered. Until then, I view AI not as a replacement for human thinking, but as a powerful tool that amplifies our ability to explore, learn, and make sense of an increasingly complex world.</em></p>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}