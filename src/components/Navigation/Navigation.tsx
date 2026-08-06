import { Home, UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ExperienceId } from '../../content/contentTypes'
import rafaelPortrait from '../../assets/candidate/rafael-navarro-portrait.png'

interface NavigationProps {
  activeExperience: ExperienceId
  onNavigate: (experience: ExperienceId) => void
}

type NavigationItem = { id: ExperienceId; label: string; icon?: typeof Home; materialIcon?: string }

interface NavigationButtonProps {
  item: NavigationItem
  isActive: boolean
  onSelect: (experience: ExperienceId) => void
}

const homeNavigationItem: NavigationItem = { id: 'home', label: 'Home', icon: Home }

const navigationItems: NavigationItem[] = [
  { id: 'how-i-work', label: 'Testimonial', materialIcon: 'taunt' },
  { id: 'journey', label: 'Resume', materialIcon: 'work_history' },
  { id: 'impact', label: 'Beyond my role', materialIcon: 'cheer' },
]

const approachItems: Array<{ id: Extract<ExperienceId, 'cover' | 'leadership'>; label: string; materialIcon?: string }> = [
  { id: 'cover', label: 'Why Me?', materialIcon: 'person_raised_hand' },
  { id: 'leadership', label: 'Lead the Team', materialIcon: 'diversity_1' },
]

function NavigationButton({ item: { id, label, icon: Icon, materialIcon }, isActive, onSelect }: NavigationButtonProps) {
  return (
    <button
      className={isActive ? 'nav-item is-active' : 'nav-item'}
      type="button"
      onClick={() => onSelect(id)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
    >
      {materialIcon ? <span className="material-symbols-outlined nav-material-icon" aria-hidden="true">{materialIcon}</span> : Icon && <Icon size={15} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  )
}

export function Navigation({ activeExperience, onNavigate }: NavigationProps) {
  const isApproachActive = activeExperience === 'cover' || activeExperience === 'leadership'
  const approachDisclosureRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const closeApproachMenu = (event: PointerEvent) => {
      if (!approachDisclosureRef.current?.contains(event.target as Node)) approachDisclosureRef.current?.removeAttribute('open')
    }
    const closeApproachMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !approachDisclosureRef.current?.open) return
      event.preventDefault()
      event.stopPropagation()
      approachDisclosureRef.current.removeAttribute('open')
      approachDisclosureRef.current.querySelector<HTMLElement>('summary')?.focus()
    }

    document.addEventListener('pointerdown', closeApproachMenu)
    document.addEventListener('keydown', closeApproachMenuOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeApproachMenu)
      document.removeEventListener('keydown', closeApproachMenuOnEscape)
    }
  }, [])

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
        <NavigationButton item={homeNavigationItem} isActive={activeExperience === homeNavigationItem.id} onSelect={navigateTo} />
        <details ref={approachDisclosureRef} className={isApproachActive ? 'nav-disclosure is-active' : 'nav-disclosure'}>
          <summary className="nav-disclosure-trigger" aria-label="My approach" title="My approach">
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
        {navigationItems.map((item) => <NavigationButton item={item} isActive={activeExperience === item.id} onSelect={navigateTo} key={item.id} />)}
      </nav>
    </header>
  )
}