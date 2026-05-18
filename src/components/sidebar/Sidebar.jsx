import { useApp } from '../../context/AppContext.jsx'
import TeamList from './TeamList.jsx'
import logo from '../../assets/1629729771_club_logo.webp'
import './Sidebar.css'

export default function Sidebar({ onManageTeams, onManageHalls, onAddTraining, theme, onToggleTheme, hiddenTeamIds, onToggleTeam, onShowAll, onHideAll }) {
  const { teams } = useApp()

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <img src={logo} alt="FBC Draci" className="sidebar__logo-img" />
        <div>
          <h1>FBC Draci</h1>
          <p>Říčany</p>
        </div>
      </div>

      <div className="sidebar__section-header">
        <p className="sidebar__section-title">Týmy</p>
        <div className="sidebar__filter-btns">
          <button className="sidebar__filter-btn" onClick={onShowAll}>vše</button>
          <button className="sidebar__filter-btn" onClick={onHideAll}>žádný</button>
        </div>
      </div>
      <div className="sidebar__team-list">
        <TeamList teams={teams} hiddenTeamIds={hiddenTeamIds} onToggleTeam={onToggleTeam} />
      </div>

      <div className="sidebar__actions">
        <button className="sidebar__btn sidebar__btn--accent" onClick={onAddTraining}>
          + Přidat trénink
        </button>
        <button className="sidebar__btn" onClick={onManageTeams}>
          <span>⚙</span> Správa týmů
        </button>
        <button className="sidebar__btn" onClick={onManageHalls}>
          <span>🏟</span> Správa hal
        </button>
        <button className="sidebar__btn sidebar__btn--theme" onClick={onToggleTheme}>
          {theme === 'light' ? '◑ Tmavý režim' : '○ Světlý režim'}
        </button>
      </div>
    </div>
  )
}
