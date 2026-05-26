import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import './Modal.css'

export default function CampModal({ camp, onClose, onSaved }) {
  const { teams, addCamp, updateCamp } = useApp()
  const isEdit = !!camp

  const [name,      setName]      = useState(camp?.name      ?? '')
  const [startDate, setStartDate] = useState(camp?.startDate ?? '')
  const [endDate,   setEndDate]   = useState(camp?.endDate   ?? '')
  const [teamIds,   setTeamIds]   = useState(camp?.teamIds   ?? [])

  function toggleTeam(id) {
    setTeamIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return
    if (endDate < startDate) { alert('Datum konce musí být po datu začátku.'); return }
    const data = { name: name.trim(), startDate, endDate, teamIds }
    if (isEdit) {
      updateCamp(camp.id, data)
    } else {
      addCamp(data)
    }
    onSaved?.()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Upravit soustředění' : 'Nové soustředění'}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label">Název</label>
            <input
              className="modal__input"
              type="text"
              placeholder="Soustředění 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Od</label>
              <input
                className="modal__input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="modal__field">
              <label className="modal__label">Do</label>
              <input
                className="modal__input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label">Týmy</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {teams.map((t) => (
                <label
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: teamIds.includes(t.id) ? t.color : 'var(--color-surface-2)',
                    color: teamIds.includes(t.id) ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    userSelect: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={teamIds.includes(t.id)}
                    onChange={() => toggleTeam(t.id)}
                    style={{ display: 'none' }}
                  />
                  {t.shortName}
                </label>
              ))}
            </div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Zrušit</button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Uložit' : 'Vytvořit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
