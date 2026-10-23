import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Hero } from '../components/Hero/Hero'
import { Navigation } from '../components/Navigation/Navigation'
import { ExperienceStage } from '../components/ExperienceStage/ExperienceStage'
import { EnvironmentalCampaign } from '../components/EnvironmentalCampaign/EnvironmentalCampaign'
import { heroContent } from '../content/content'
import type { ExperienceId } from '../content/contentTypes'
import { experienceFromHash, hashForExperience, hashForTestimonial, testimonialSlugFromHash } from '../utils/hashNavigation'

const AIOperationsCenter = lazy(() => import('../components/AIOperationsCenter/AIOperationsCenter').then(({ AIOperationsCenter: component }) => ({ default: component })))

const titles: Record<ExperienceId, string> = {
  home: "Rafael's Exploration Journal",
  cover: "Why Me | Rafael's Exploration Journal",
  journey: "Resume | Rafael's Exploration Journal",
  impact: "Beyond | Rafael's Exploration Journal",
  campaign: "Environmental Awareness Campaign | Rafael's Exploration Journal",
  'ai-operations': "AI Operations Center | Rafael's Exploration Journal",
}

export default function App() {
  const [activeExperience, setActiveExperience] = useState<ExperienceId>(() => experienceFromHash(window.location.hash))
  const [testimonialSlug, setTestimonialSlug] = useState(() => testimonialSlugFromHash(window.location.hash))
  const stageHeadingRef = useRef<HTMLHeadingElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const openExperience = (experience: ExperienceId) => {
    window.history.pushState(null, '', hashForExperience(experience))
    setActiveExperience(experience)
    setTestimonialSlug(null)
  }

  const openTestimonial = (slug: string) => {
    window.history.pushState(null, '', hashForTestimonial(slug))
    setActiveExperience('cover')
    setTestimonialSlug(slug)
  }

  const closeTestimonial = () => {
    window.history.replaceState(null, '', hashForExperience('cover'))
    setTestimonialSlug(null)
  }

  useEffect(() => {
    const syncWithHash = () => {
      const experience = experienceFromHash(window.location.hash)
      const slug = testimonialSlugFromHash(window.location.hash)
      if (window.location.hash === '#how-i-work' || window.location.hash === '#testimonial') {
        window.history.replaceState(null, '', hashForExperience(experience))
      }
      setActiveExperience(experience)
      setTestimonialSlug(slug)
    }
    syncWithHash()
    window.addEventListener('hashchange', syncWithHash)
    window.addEventListener('popstate', syncWithHash)
    return () => {
      window.removeEventListener('hashchange', syncWithHash)
      window.removeEventListener('popstate', syncWithHash)
    }
  }, [])

  useEffect(() => {
    document.title = titles[activeExperience]
    if (activeExperience !== 'home') {
      const focusTimer = window.setTimeout(() => {
        if (!document.querySelector('[role="dialog"][aria-modal="true"]')) stageHeadingRef.current?.focus()
      }, 550)
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
    <div className={`app-shell${activeExperience === 'ai-operations' ? ' app-shell-ai-operations' : ''}`}>
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
        ) : activeExperience === 'ai-operations' ? (
          <Suspense fallback={<main className="operations-page"><p className="operations-subtitle">Loading AI Operations Center...</p></main>}>
            <AIOperationsCenter headingRef={stageHeadingRef} onNavigate={openExperience} />
          </Suspense>
        ) : (
          <motion.main
            key={activeExperience}
            className="stage-view"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          >
            <ExperienceStage experience={activeExperience} headingRef={stageHeadingRef} onNavigate={openExperience} testimonialSlug={testimonialSlug} onOpenTestimonial={openTestimonial} onCloseTestimonial={closeTestimonial} />
          </motion.main>
        )}
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">{activeExperience === 'home' ? heroContent.title : `${titles[activeExperience]} opened`}</p>
    </div>
  )
}