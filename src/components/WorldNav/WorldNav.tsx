import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties } from 'react'
import { worlds } from '../../content/content'
import type { ExperienceId } from '../../content/contentTypes'

interface WorldNavProps {
  onOpenWorld: (experience: ExperienceId) => void
}

export function WorldNav({ onOpenWorld }: WorldNavProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="world-nav" aria-label="Candidate story worlds">
      <svg className="orbit-lines" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
        <path d="M110 364 C 220 92, 735 86, 899 318" />
        <path d="M185 220 C 480 500, 721 474, 858 176" />
        <path d="M487 493 C 502 335, 521 194, 508 44" />
      </svg>
      {worlds.map((world, index) => (
        <motion.button
          className={`world-node world-${world.id}`}
          type="button"
          key={world.id}
          onClick={() => onOpenWorld(world.id)}
          style={{ '--world-color': world.accentColor } as CSSProperties}
          animate={shouldReduceMotion ? undefined : { y: [0, index % 2 ? -9 : 9, 0] }}
          transition={{ duration: 5.5 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.35 }}
        >
          <span className="world-orb" aria-hidden="true"><span /></span>
          <span className="world-content">
            <span className="world-title">{world.title}</span>
          </span>
        </motion.button>
      ))}
    </div>
  )
}