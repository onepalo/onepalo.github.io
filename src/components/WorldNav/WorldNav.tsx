import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import { worlds } from '../../content/content'
import type { ExperienceId } from '../../content/contentTypes'

interface WorldNavProps {
  onOpenWorld: (experience: ExperienceId) => void
}

export function WorldNav({ onOpenWorld }: WorldNavProps) {
  const shouldReduceMotion = useReducedMotion()
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.matchMedia('(max-width: 760px)').matches)

  useEffect(() => {
    const compactLayoutQuery = window.matchMedia('(max-width: 760px)')
    const updateCompactLayout = () => setIsCompactLayout(compactLayoutQuery.matches)

    compactLayoutQuery.addEventListener('change', updateCompactLayout)
    return () => compactLayoutQuery.removeEventListener('change', updateCompactLayout)
  }, [])

  return (
    <div className="world-nav" aria-label="Candidate story worlds">
      {worlds.map((world, index) => (
        <motion.button
          className={`world-node world-${world.id}`}
          type="button"
          key={world.id}
          onClick={() => onOpenWorld(world.id)}
          style={{ '--world-color': world.accentColor } as CSSProperties}
          animate={shouldReduceMotion || isCompactLayout ? undefined : { y: [0, index % 2 ? -9 : 9, 0] }}
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