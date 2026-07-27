import { Award, Home, Route, UserRound, UsersRound } from 'lucide-react'
import type { ExperienceId } from '../../content/contentTypes'
import rafaelPortrait from '../../assets/candidate/rafael-navarro-portrait.png'

interface NavigationProps {
  activeExperience: ExperienceId
  onNavigate: (experience: ExperienceId) => void
}

const navigationItems: Array<{ id: ExperienceId; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'cover', label: 'Why Me?', icon: UserRound },
  { id: 'leadership', label: 'Lead the Team', icon: UsersRound },
  { id: 'journey', label: 'Resume', icon: Route },
  { id: 'impact', label: 'Proof', icon: Award },
]

export function Navigation({ activeExperience, onNavigate }: NavigationProps) {
  return (
    <header className="site-header">
      <button className="wordmark" type="button" onClick={() => onNavigate('home')} aria-label="Exploration Rafael Navarro home">
        <span className="wordmark-mark" aria-hidden="true"><img src={rafaelPortrait} alt="" /></span>
        <span className="wordmark-copy"><strong>Rafael Navarro</strong><em>AI Exploration Geoscientist</em></span>
      </button>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navigationItems.map(({ id, label, icon: Icon }) => (
          <button
            className={activeExperience === id ? 'nav-item is-active' : 'nav-item'}
            type="button"
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={activeExperience === id ? 'page' : undefined}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}