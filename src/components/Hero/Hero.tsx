import type { HeroContent, ExperienceId } from '../../content/contentTypes'
import { CharacterVisual } from '../CharacterVisual/CharacterVisual'
import { WorldNav } from '../WorldNav/WorldNav'

interface HeroProps {
  content: HeroContent
  onOpenWorld: (experience: ExperienceId) => void
}

export function Hero({ content, onOpenWorld }: HeroProps) {
  const signature = 'By Rafael Navarro'

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="contour-field" aria-hidden="true">
        <svg viewBox="0 0 1440 850" preserveAspectRatio="none"><path d="M-40 190 C 170 80 250 325 450 194 S 700 46 887 188 S 1215 300 1480 112" /><path d="M-80 226 C 160 117 255 369 456 232 S 714 82 892 226 S 1199 334 1500 148" /><path d="M-30 661 C 172 463 400 785 622 613 S 1032 440 1490 684" /><path d="M-20 699 C 178 496 398 819 618 648 S 1028 474 1470 719" /></svg>
      </div>
      <h1 id="hero-title" className="sr-only">{content.title}</h1>
      <WorldNav onOpenWorld={onOpenWorld} />
      <CharacterVisual />
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
    </section>
  )
}