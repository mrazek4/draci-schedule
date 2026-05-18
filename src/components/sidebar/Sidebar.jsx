import { useApp } from '../../context/AppContext.jsx'
import TeamList from './TeamList.jsx'
import logo from '../../assets/1629729771_club_logo.webp'
import './Sidebar.css'

export default function Sidebar({ onManageTeams, onManageHalls, onAddTraining }) {
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

      <p className="sidebar__section-title">Týmy</p>
      <div className="sidebar__team-list">
        <TeamList teams={teams} />
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
      </div>
    </div>
  )
}
