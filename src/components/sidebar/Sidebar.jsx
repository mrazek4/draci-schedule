import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import TeamList from './TeamList.jsx'
import { exportToExcel } from '../../utils/exportUtils.js'
import { parseExcelTrainings } from '../../utils/importUtils.js'
import logo from '../../assets/1629729771_club_logo.webp'
import './Sidebar.css'

export default function Sidebar({ onManageTeams, onManageHalls, onAddTraining, theme, onToggleTheme, hiddenTeamIds, onToggleTeam, onShowAll, onHideAll }) {
  const { teams, halls, trainings, seasons, currentSeasonId, setCurrentSeason, addSeason, deleteSeason, importTrainings, addHall } = useApp()
  const fileInputRef = useRef(null)
  const [hallMapping, setHallMapping] = useState(null)

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

  function confirmAndImport(parsedTrainings, skipped) {
    const season = seasons?.find((s) => s.id === currentSeasonId)
    const skipNote = skipped > 0 ? ` (přeskočeno: ${skipped})` : ''
    if (window.confirm(`Nalezeno ${parsedTrainings.length} tréninků${skipNote}.\nNahradit tréninky v sezóně "${season?.name}"?`)) {
      importTrainings(currentSeasonId, parsedTrainings.map((t) => ({ ...t, id: crypto.randomUUID() })))
    }
    setHallMapping(null)
  }

  function handleApplyMapping() {
    const extra = []
    for (const [name, rows] of Object.entries(hallMapping.unknownHalls)) {
      const sel = hallMapping.selections[name]
      if (sel === '__skip__') continue
      if (sel === '__new__') {
        const { code, color } = hallMapping.newHallData[name]
        if (!code.trim()) { alert(`Zadej kód pro halu "${name}"`); return }
        const newId = crypto.randomUUID()
        addHall({ id: newId, name, code: code.trim().toUpperCase(), color })
        rows.forEach((r) => extra.push({ ...r, hallId: newId }))
      } else {
        rows.forEach((r) => extra.push({ ...r, hallId: sel }))
      }
    }
    confirmAndImport([...hallMapping.parsedTrainings, ...extra], hallMapping.skipped)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { trainings: parsed, skipped, unknownHalls } = await parseExcelTrainings(file, teams, halls)
      fileInputRef.current.value = ''

      if (Object.keys(unknownHalls).length > 0) {
        const selections  = Object.fromEntries(Object.keys(unknownHalls).map((n) => [n, '__skip__']))
        const newHallData = Object.fromEntries(Object.keys(unknownHalls).map((n) => [n, { code: '', color: '#94a3b8' }]))
        setHallMapping({ parsedTrainings: parsed, skipped, unknownHalls, selections, newHallData })
      } else {
        confirmAndImport(parsed, skipped)
      }
    } catch (err) {
      alert('Chyba při čtení souboru: ' + err.message)
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
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

      {hallMapping && (
        <div className="modal-backdrop" onClick={() => setHallMapping(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Neznámé haly</h2>
              <button className="modal__close" onClick={() => setHallMapping(null)}>×</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Tyto haly z Excelu nebyly nalezeny. Namapuj je na existující nebo vytvoř nové.
            </p>

            {Object.entries(hallMapping.unknownHalls).map(([name, rows]) => {
              const sel = hallMapping.selections[name]
              return (
                <div key={name} className="modal__field">
                  <label className="modal__label">"{name}" — {rows.length} tréninků</label>
                  <select
                    className="modal__select"
                    value={sel}
                    onChange={(e) => setHallMapping((m) => ({
                      ...m, selections: { ...m.selections, [name]: e.target.value },
                    }))}
                  >
                    <option value="__skip__">— přeskočit —</option>
                    <option value="__new__">✚ Vytvořit novou halu</option>
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}{h.code ? ` (${h.code})` : ''}</option>
                    ))}
                  </select>

                  {sel === '__new__' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input
                        className="modal__input"
                        placeholder="Kód (např. PAC)"
                        maxLength={6}
                        style={{ flex: 1, textTransform: 'uppercase' }}
                        value={hallMapping.newHallData[name].code}
                        onChange={(e) => setHallMapping((m) => ({
                          ...m, newHallData: { ...m.newHallData, [name]: { ...m.newHallData[name], code: e.target.value.toUpperCase() } },
                        }))}
                      />
                      <input
                        type="color"
                        className="modal__input"
                        style={{ width: 44, padding: 2, cursor: 'pointer' }}
                        value={hallMapping.newHallData[name].color}
                        onChange={(e) => setHallMapping((m) => ({
                          ...m, newHallData: { ...m.newHallData, [name]: { ...m.newHallData[name], color: e.target.value } },
                        }))}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            <div className="modal__actions">
              <button className="btn btn--ghost" onClick={() => setHallMapping(null)}>Zrušit</button>
              <button className="btn btn--primary" onClick={handleApplyMapping}>Pokračovat</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
