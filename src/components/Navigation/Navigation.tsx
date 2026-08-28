import { Home, UserRound } from 'lucide-react'
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
  { id: 'cover', label: 'Why Me?', icon: UserRound },
  { id: 'how-i-work', label: 'Testimonial', materialIcon: 'taunt' },
  { id: 'journey', label: 'Resume', materialIcon: 'work_history' },
  { id: 'impact', label: 'Beyond my role', materialIcon: 'cheer' },
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
  function navigateTo(experience: ExperienceId) {
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
        {navigationItems.map((item) => <NavigationButton item={item} isActive={activeExperience === item.id} onSelect={navigateTo} key={item.id} />)}
      </nav>
    </header>
  )
}