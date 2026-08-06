import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Hero } from '../components/Hero/Hero'
import { Navigation } from '../components/Navigation/Navigation'
import { ExperienceStage } from '../components/ExperienceStage/ExperienceStage'
import { EnvironmentalCampaign } from '../components/EnvironmentalCampaign/EnvironmentalCampaign'
import { heroContent } from '../content/content'
import type { ExperienceId } from '../content/contentTypes'
import { experienceFromHash, hashForExperience } from '../utils/hashNavigation'

const titles: Record<ExperienceId, string> = {
  home: "Rafael's Exploration Journal",
  cover: "Why This Role, Why Now | Rafael's Exploration Journal",
  'how-i-work': "Testimonial | Rafael's Exploration Journal",
  leadership: "How I Will Lead the Team | Rafael's Exploration Journal",
  journey: "Resume | Rafael's Exploration Journal",
  impact: "Leadership Beyond My Role | Rafael's Exploration Journal",
  campaign: "Environmental Awareness Campaign | Rafael's Exploration Journal",
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
    const syncWithHash = () => {
      const experience = experienceFromHash(window.location.hash)
      if (window.location.hash === '#how-i-work') {
        window.history.replaceState(null, '', hashForExperience(experience))
      }
      setActiveExperience(experience)
    }
    syncWithHash()
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
      const modalIsOpen = document.querySelector('[role="dialog"][aria-modal="true"]')
      if (event.key === 'Escape' && activeExperience !== 'home' && !modalIsOpen) openExperience(activeExperience === 'campaign' ? 'impact' : 'home')
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [activeExperience])

  return (
    <div className="app-shell">
      {activeExperience !== 'campaign' && <Navigation activeExperience={activeExperience} onNavigate={openExperience} />}
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
        ) : activeExperience === 'campaign' ? (
          <EnvironmentalCampaign headingRef={stageHeadingRef} onReturn={() => openExperience('impact')} />
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