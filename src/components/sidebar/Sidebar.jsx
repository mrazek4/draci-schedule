import { useApp } from '../../context/AppContext.jsx'
import TeamList from './TeamList.jsx'
import './Sidebar.css'

export default function Sidebar({ onManageTeams, onManageHalls }) {
  const { teams } = useApp()

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <h1>FBC Draci</h1>
        <p>Říčany</p>
      </div>

      <p className="sidebar__section-title">Týmy</p>
      <div className="sidebar__team-list">
        <TeamList teams={teams} />
      </div>

      <div className="sidebar__actions">
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
