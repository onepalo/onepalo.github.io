import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Hero } from '../components/Hero/Hero'
import { Navigation } from '../components/Navigation/Navigation'
import { ExperienceStage } from '../components/ExperienceStage/ExperienceStage'
import { heroContent } from '../content/content'
import type { ExperienceId } from '../content/contentTypes'
import { experienceFromHash, hashForExperience } from '../utils/hashNavigation'

const titles: Record<ExperienceId, string> = {
  home: 'Exploration Universe',
  cover: 'Why This Role, Why Now | Exploration Universe',
  leadership: 'How I Will Lead the Team | Exploration Universe',
  journey: 'Resume / CV | Exploration Universe',
  impact: 'Proof of Leadership | Exploration Universe',
}

export default function App() {
  const [activeExperience, setActiveExperience] = useState<ExperienceId>(() => experienceFromHash(window.location.hash))
  const stageHeadingRef = useRef<HTMLHeadingElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const openExperience = (experience: ExperienceId) => {
    window.history.pushState(null, '', hashForExperience(experience))
    setActiveExperience(experience)
  }

  useEffect(() => {
    const syncWithHash = () => setActiveExperience(experienceFromHash(window.location.hash))
    window.addEventListener('hashchange', syncWithHash)
    return () => window.removeEventListener('hashchange', syncWithHash)
  }, [])

  useEffect(() => {
    document.title = titles[activeExperience]
    if (activeExperience !== 'home') {
      const focusTimer = window.setTimeout(() => stageHeadingRef.current?.focus(), 550)
      return () => window.clearTimeout(focusTimer)
    }
  }, [activeExperience])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeExperience !== 'home') openExperience('home')
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [activeExperience])

  return (
    <div className="app-shell">
      <Navigation activeExperience={activeExperience} onNavigate={openExperience} />
      <AnimatePresence mode="wait" initial={false}>
        {activeExperience === 'home' ? (
          <motion.main
            key="home"
            className="home-view"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Hero
              content={heroContent}
              onOpenWorld={openExperience}
            />
          </motion.main>
        ) : (
          <motion.main
            key={activeExperience}
            className="stage-view"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          >
            <ExperienceStage experience={activeExperience} headingRef={stageHeadingRef} onNavigate={openExperience} />
          </motion.main>
        )}
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">{activeExperience === 'home' ? heroContent.title : `${titles[activeExperience]} opened`}</p>
    </div>
  )
}