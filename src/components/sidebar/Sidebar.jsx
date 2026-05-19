import { useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import TeamList from './TeamList.jsx'
import { exportToExcel } from '../../utils/exportUtils.js'
import { parseExcelTrainings } from '../../utils/importUtils.js'
import logo from '../../assets/1629729771_club_logo.webp'
import './Sidebar.css'

export default function Sidebar({ onManageTeams, onManageHalls, onAddTraining, theme, onToggleTheme, hiddenTeamIds, onToggleTeam, onShowAll, onHideAll }) {
  const { teams, halls, trainings, seasons, currentSeasonId, setCurrentSeason, addSeason, deleteSeason, setTrainingsForSeason } = useApp()
  const fileInputRef = useRef(null)

  function handleAddSeason() {
    const name = prompt('Název sezóny (např. 2026/2027)')
    if (name?.trim()) addSeason(name.trim())
  }

  function handleDeleteSeason() {
    if ((seasons?.length ?? 0) <= 1) { alert('Nelze smazat poslední sezónu.'); return }
    const season = seasons?.find((s) => s.id === currentSeasonId)
    if (window.confirm(`Smazat sezónu "${season?.name}" včetně všech tréninků?`)) {
      deleteSeason(currentSeasonId)
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { trainings: parsed, skipped } = await parseExcelTrainings(file, teams, halls)
      const season = seasons?.find((s) => s.id === currentSeasonId)
      const skipNote = skipped > 0 ? ` (přeskočeno: ${skipped})` : ''
      if (window.confirm(`Nalezeno ${parsed.length} tréninků${skipNote}.\nNahradit tréninky v sezóně "${season?.name}"?`)) {
        setTrainingsForSeason(currentSeasonId, parsed.map((t) => ({ ...t, id: crypto.randomUUID() })))
      }
    } catch (err) {
      alert('Chyba při čtení souboru: ' + err.message)
    }
    fileInputRef.current.value = ''
  }

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <img src={logo} alt="FBC Draci" className="sidebar__logo-img" />
        <div>
          <h1>FBC Draci</h1>
          <p>Říčany</p>
        </div>
      </div>

      <div className="sidebar__season">
        <select
          className="sidebar__season-select"
          value={currentSeasonId ?? ''}
          onChange={(e) => setCurrentSeason(e.target.value)}
        >
          {(seasons ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className="sidebar__season-btn" onClick={handleAddSeason} title="Přidat sezónu">+</button>
        <button className="sidebar__season-btn sidebar__season-btn--del" onClick={handleDeleteSeason} title="Smazat sezónu" disabled={(seasons?.length ?? 0) <= 1}>✕</button>
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
        <button className="sidebar__btn" onClick={async () => {
          try { await exportToExcel(trainings, teams, halls) }
          catch (err) { alert('Chyba při exportu: ' + err.message) }
        }}>
          ↓ Export .xlsx
        </button>
        <button className="sidebar__btn" onClick={() => fileInputRef.current?.click()}>
          ↑ Import .xlsx
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        <button className="sidebar__btn sidebar__btn--theme" onClick={onToggleTheme}>
          {theme === 'light' ? '◑ Tmavý režim' : '○ Světlý režim'}
        </button>
      </div>
    </div>
  )
}
