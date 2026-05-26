import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { useRole, useCanEdit } from '../../auth/useRole.js'
import TeamList from './TeamList.jsx'
import HallTile from './HallTile.jsx'
import SeasonModal from '../modals/SeasonModal.jsx'
import { exportToExcel } from '../../utils/exportUtils.js'
import { parseExcelTrainings } from '../../utils/importUtils.js'
import logo from '../../assets/1629729771_club_logo.webp'
import './Sidebar.css'

export default function Sidebar({ onManageTeams, onManageHalls, onManageUsers, onAddTraining, theme, onToggleTheme, hiddenTeamIds, onToggleTeam, onShowAll, onHideAll, viewMode, onSwitchView, currentCampId, onSelectCamp, onAddCamp, onEditCamp }) {
  const { teams, halls, trainings, seasons, currentSeasonId, setCurrentSeason, addSeason, deleteSeason, importTrainings, addHall, camps, deleteCamp } = useApp()
  const { user, logout } = useAuth()
  const canEdit = useCanEdit()
  const role    = useRole()
  const fileInputRef = useRef(null)
  const [hallMapping, setHallMapping] = useState(null)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [listMode, setListMode] = useState('teams')

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

        <div className="sidebar__tabs">
          <button
            className={`sidebar__tab${viewMode === 'schedule' ? ' sidebar__tab--active' : ''}`}
            onClick={() => onSwitchView('schedule')}
          >
            Rozvrh
          </button>
          <button
            className={`sidebar__tab${viewMode === 'camp' ? ' sidebar__tab--active' : ''}`}
            onClick={() => onSwitchView('camp')}
          >
            Soustředění
          </button>
        </div>

        {viewMode === 'camp' ? (
          <>
            <div className="sidebar__section-header" style={{ marginTop: 8 }}>
              <p className="sidebar__section-title">Soustředění</p>
              {canEdit && <button className="sidebar__season-btn" onClick={onAddCamp} title="Přidat soustředění">+</button>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
              {(camps ?? []).length === 0
                ? <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '8px 4px' }}>Žádná soustředění.</p>
                : (camps ?? []).map((camp) => (
                  <div
                    key={camp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: currentCampId === camp.id ? 'var(--color-accent)' : 'transparent',
                      color: currentCampId === camp.id ? '#fff' : 'rgba(255,255,255,0.75)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                    onClick={() => onSelectCamp(camp.id)}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{camp.name}</span>
                    {canEdit && (
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.7, padding: '0 2px', color: 'inherit' }}
                        onClick={(e) => { e.stopPropagation(); onEditCamp(camp) }}
                        title="Upravit"
                      >✎</button>
                    )}
                    {canEdit && (
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.7, padding: '0 2px', color: 'inherit' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Smazat soustředění "${camp.name}"?`)) deleteCamp(camp.id)
                        }}
                        title="Smazat"
                      >✕</button>
                    )}
                  </div>
                ))
              }
            </div>
          </>
        ) : (
          <>
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
              {canEdit && <button className="sidebar__season-btn" onClick={() => setShowSeasonModal(true)} title="Přidat sezónu">+</button>}
              {canEdit && <button className="sidebar__season-btn sidebar__season-btn--del" onClick={handleDeleteSeason} title="Smazat sezónu" disabled={(seasons?.length ?? 0) <= 1}>✕</button>}
            </div>

            <div className="sidebar__section-header">
              <div style={{ display: 'flex', gap: 0 }}>
                <button
                  className={`sidebar__filter-btn${listMode === 'teams' ? ' sidebar__filter-btn--active' : ''}`}
                  onClick={() => setListMode('teams')}
                >Týmy</button>
                <button
                  className={`sidebar__filter-btn${listMode === 'halls' ? ' sidebar__filter-btn--active' : ''}`}
                  onClick={() => setListMode('halls')}
                >Haly</button>
              </div>
              {listMode === 'teams' && (
                <div className="sidebar__filter-btns">
                  <button className="sidebar__filter-btn" onClick={onShowAll}>vše</button>
                  <button className="sidebar__filter-btn" onClick={onHideAll}>žádný</button>
                </div>
              )}
            </div>
            <div className="sidebar__team-list">
              {listMode === 'teams'
                ? <TeamList teams={teams} hiddenTeamIds={hiddenTeamIds} onToggleTeam={onToggleTeam} />
                : halls.map((h) => <HallTile key={h.id} hall={h} />)
              }
            </div>
          </>
        )}

        <div className="sidebar__actions">
          {canEdit && viewMode !== 'camp' && (
            <button className="sidebar__btn sidebar__btn--accent" onClick={onAddTraining}>
              + Přidat trénink
            </button>
          )}
          {canEdit && viewMode !== 'camp' && (
            <button className="sidebar__btn" onClick={onManageTeams}>
              <span>⚙</span> Správa týmů
            </button>
          )}
          {canEdit && viewMode !== 'camp' && (
            <button className="sidebar__btn" onClick={onManageHalls}>
              <span>🏟</span> Správa hal
            </button>
          )}
          {role === 'admin' && viewMode !== 'camp' && (
            <button className="sidebar__btn" onClick={onManageUsers}>
              <span>👥</span> Správa uživatelů
            </button>
          )}
          {viewMode !== 'camp' && (
            <button className="sidebar__btn" onClick={async () => {
              try { await exportToExcel(trainings, teams, halls) }
              catch (err) { alert('Chyba při exportu: ' + err.message) }
            }}>
              ↓ Export .xlsx
            </button>
          )}
          {canEdit && viewMode !== 'camp' && (
            <button className="sidebar__btn" onClick={() => fileInputRef.current?.click()}>
              ↑ Import .xlsx
            </button>
          )}
          {canEdit && <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />}
          <button className="sidebar__btn sidebar__btn--theme" onClick={onToggleTheme}>
            {theme === 'light' ? '◑ Tmavý režim' : '○ Světlý režim'}
          </button>
          <div className="sidebar__user">
            <span className="sidebar__user-name">{user?.name ?? user?.email ?? ''}</span>
            <button className="sidebar__btn sidebar__btn--logout" onClick={logout}>Odhlásit</button>
          </div>
        </div>
      </div>

      {showSeasonModal && (
        <SeasonModal
          onClose={() => setShowSeasonModal(false)}
          onAdd={({ name, copyAvailabilities, copyTeams }) => {
            addSeason(name, { copyAvailabilities, copyTeams })
            setShowSeasonModal(false)
          }}
        />
      )}

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
