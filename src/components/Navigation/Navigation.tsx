import { Home, UserRound } from 'lucide-react'
import { useRef } from 'react'
import type { ExperienceId } from '../../content/contentTypes'
import rafaelPortrait from '../../assets/candidate/rafael-navarro-portrait.png'

interface NavigationProps {
  activeExperience: ExperienceId
  onNavigate: (experience: ExperienceId) => void
}

const navigationItems: Array<{ id: ExperienceId; label: string; icon?: typeof Home; materialIcon?: string }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'how-i-work', label: 'Testimonials', materialIcon: 'taunt' },
  { id: 'journey', label: 'Resume', materialIcon: 'work_history' },
  { id: 'impact', label: 'Proof', materialIcon: 'cheer' },
]

const approachItems: Array<{ id: Extract<ExperienceId, 'cover' | 'leadership'>; label: string; materialIcon?: string }> = [
  { id: 'cover', label: 'Why Me?', materialIcon: 'person_raised_hand' },
  { id: 'leadership', label: 'Lead the Team', materialIcon: 'diversity_1' },
]

export function Navigation({ activeExperience, onNavigate }: NavigationProps) {
  const isApproachActive = activeExperience === 'cover' || activeExperience === 'leadership'
  const approachDisclosureRef = useRef<HTMLDetailsElement>(null)

  function navigateTo(experience: ExperienceId) {
    approachDisclosureRef.current?.removeAttribute('open')
    onNavigate(experience)
  }

  return (
    <header className="site-header">
      <button className="wordmark" type="button" onClick={() => navigateTo('home')} aria-label="Exploration Rafael Navarro home">
        <span className="wordmark-mark" aria-hidden="true"><img src={rafaelPortrait} alt="" /></span>
        <span className="wordmark-copy"><strong>Rafael Navarro</strong><em>Geoscientist</em></span>
      </button>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navigationItems.slice(0, 1).map(({ id, label, icon: Icon, materialIcon }) => (
          <button
            className={activeExperience === id ? 'nav-item is-active' : 'nav-item'}
            type="button"
            key={id}
            onClick={() => navigateTo(id)}
            aria-label={label}
            aria-current={activeExperience === id ? 'page' : undefined}
          >
            {materialIcon ? <span className="material-symbols-outlined nav-material-icon" aria-hidden="true">{materialIcon}</span> : Icon && <Icon size={15} aria-hidden="true" />}
            <span>{label}</span>
          </button>
        ))}
        <details ref={approachDisclosureRef} className={isApproachActive ? 'nav-disclosure is-active' : 'nav-disclosure'}>
          <summary className="nav-disclosure-trigger" aria-label="My approach">
            <UserRound size={15} aria-hidden="true" />
            <span className="nav-disclosure-label">My approach</span>
            <span className="material-symbols-outlined nav-disclosure-arrow" aria-hidden="true">keyboard_arrow_down</span>
          </summary>
          <div className="nav-disclosure-menu">
            {approachItems.map(({ id, label, materialIcon }) => (
              <button
                className={activeExperience === id ? 'nav-disclosure-item is-active' : 'nav-disclosure-item'}
                type="button"
                key={id}
                onClick={() => navigateTo(id)}
                aria-label={label}
                aria-current={activeExperience === id ? 'page' : undefined}
              >
                {materialIcon && <span className="material-symbols-outlined nav-material-icon" aria-hidden="true">{materialIcon}</span>}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </details>
        {navigationItems.slice(1).map(({ id, label, icon: Icon, materialIcon }) => (
          <button
            className={activeExperience === id ? 'nav-item is-active' : 'nav-item'}
            type="button"
            key={id}
            onClick={() => navigateTo(id)}
            aria-label={label}
            aria-current={activeExperience === id ? 'page' : undefined}
          >
            {materialIcon ? <span className="material-symbols-outlined nav-material-icon" aria-hidden="true">{materialIcon}</span> : Icon && <Icon size={15} aria-hidden="true" />}
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}