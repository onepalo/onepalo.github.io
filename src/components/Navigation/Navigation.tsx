import { Home, UserRound } from 'lucide-react'
import type { ExperienceId } from '../../content/contentTypes'
import rafaelPortrait from '../../assets/candidate/rafael-navarro-portrait.png'

interface NavigationProps {
  activeExperience: ExperienceId
  onNavigate: (experience: ExperienceId) => void
}

const navigationItems: Array<{ id: ExperienceId; label: string; icon?: typeof Home; materialIcon?: string }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'cover', label: 'Why Me?', icon: UserRound },
  { id: 'leadership', label: 'Lead the Team', materialIcon: 'diversity_1' },
  { id: 'journey', label: 'Resume', materialIcon: 'work_history' },
  { id: 'impact', label: 'Proof', materialIcon: 'cheer' },
]

export function Navigation({ activeExperience, onNavigate }: NavigationProps) {
  return (
    <header className="site-header">
      <button className="wordmark" type="button" onClick={() => onNavigate('home')} aria-label="Exploration Rafael Navarro home">
        <span className="wordmark-mark" aria-hidden="true"><img src={rafaelPortrait} alt="" /></span>
        <span className="wordmark-copy"><strong>Rafael Navarro</strong><em>AI Exploration Geoscientist</em></span>
      </button>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navigationItems.map(({ id, label, icon: Icon, materialIcon }) => (
          <button
            className={activeExperience === id ? 'nav-item is-active' : 'nav-item'}
            type="button"
            key={id}
            onClick={() => onNavigate(id)}
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