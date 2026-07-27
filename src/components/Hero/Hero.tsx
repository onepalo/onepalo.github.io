import { useEffect, useRef, useState } from 'react'
import { CircleHelp, X } from 'lucide-react'
import type { HeroContent, ExperienceId } from '../../content/contentTypes'
import { CharacterVisual } from '../CharacterVisual/CharacterVisual'
import { WorldNav } from '../WorldNav/WorldNav'

interface HeroProps {
  content: HeroContent
  onOpenWorld: (experience: ExperienceId) => void
}

export function Hero({ content, onOpenWorld }: HeroProps) {
  const signature = 'By Rafael Navarro'
  const [isAiPerspectiveOpen, setIsAiPerspectiveOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const closeAiPerspective = () => setIsAiPerspectiveOpen(false)

  useEffect(() => {
    if (!isAiPerspectiveOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAiPerspective()
    }

    closeButtonRef.current?.focus()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isAiPerspectiveOpen])

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
              <p>I use AI openly. It helps me think broader, learn faster, and explore more possibilities than I could on my own. English is not my first language, and having worked across countries, disciplines, and increasingly complex data environments, I value how it accelerates research, challenges assumptions, and helps me connect ideas that might otherwise remain disconnected. I enjoy those benefits while staying aware of their limits.</p>
              <p>But exploration is only part of the journey. The real value comes from deciding which signals matter, which assumptions hold up under scrutiny, and which actions are worth pursuing. AI can assist that process, but it cannot substitute for the judgment developed through experience or the accountability that comes with real-world decisions.</p>
              <p><strong>AI can expand the conversation. Human judgment provides the direction.</strong></p>
              <p><em>Perhaps this balance will change if we eventually reach AGI. If that day comes, society will need to redefine many of its assumptions about work, expertise, responsibility, and value creation. Until then, I see AI as a powerful amplifier of human capability, not a replacement for human judgment.</em></p>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}