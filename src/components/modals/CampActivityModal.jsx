import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils.js'
import './Modal.css'

export default function CampActivityModal({ activity, campId, dateStr, prefill, campTeams, onClose }) {
  const { addCampActivity, updateCampActivity, deleteCampActivity } = useApp()
  const isEdit = !!activity

  const [teamId,    setTeamId]    = useState(activity?.teamId     ?? prefill?.teamId     ?? campTeams[0]?.id ?? '')
  const [label,     setLabel]     = useState(activity?.label      ?? '')
  const [startTime, setStartTime] = useState(minutesToTime(activity?.startMinute ?? prefill?.startMinute ?? 480))
  const [endTime,   setEndTime]   = useState(minutesToTime(activity?.endMinute   ?? (prefill?.startMinute ?? 480) + 60))
  const [color,     setColor]     = useState(activity?.color ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const start = timeToMinutes(startTime)
    const end   = timeToMinutes(endTime)
    if (!label.trim()) return
    if (end <= start) { alert('Čas konce musí být po čase začátku.'); return }
    const data = { teamId, label: label.trim(), startMinute: start, endMinute: end, ...(color ? { color } : {}) }
    if (isEdit) {
      updateCampActivity(campId, dateStr, activity.id, data)
    } else {
      addCampActivity(campId, dateStr, data)
    }
    onClose()
  }

  function handleDelete() {
    if (!window.confirm('Smazat aktivitu?')) return
    deleteCampActivity(campId, dateStr, activity.id)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Upravit aktivitu' : 'Nová aktivita'}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label">Tým</label>
            <select className="modal__select" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
              {campTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="modal__field">
            <label className="modal__label">Aktivita</label>
            <input
              className="modal__input"
              type="text"
              placeholder="Snídaně, Trénink v hale…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Od</label>
              <input className="modal__input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="modal__field">
              <label className="modal__label">Do</label>
              <input className="modal__input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label">Barva (volitelně)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                className="modal__input"
                style={{ width: 44, padding: 2, cursor: 'pointer' }}
                value={color || '#4f6ef7'}
                onChange={(e) => setColor(e.target.value)}
              />
              {color && (
                <button type="button" className="btn btn--ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setColor('')}>
                  Výchozí barva týmu
                </button>
              )}
            </div>
          </div>

          <div className="modal__actions">
            {isEdit && (
              <button type="button" className="btn btn--danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>
                Smazat
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={onClose}>Zrušit</button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Uložit' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
