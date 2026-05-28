import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils.js'
import './Modal.css'

export default function CampActivityModal({ activity, campId, dateStr, prefill, campTeams, onClose }) {
  const { addCampActivity, updateCampActivity, deleteCampActivity } = useApp()
  const isEdit = !!activity

  // When opened from a template drag, prefill.templateLabel is set
  const templateLabel = prefill?.templateLabel ?? null

  const [teamId,     setTeamId]     = useState(activity?.teamId     ?? prefill?.teamId     ?? campTeams[0]?.id ?? '')
  const [label,      setLabel]      = useState(activity?.label      ?? (templateLabel ? '' : ''))
  const [sublabel,   setSublabel]   = useState('')
  const [startTime,  setStartTime]  = useState(minutesToTime(activity?.startMinute ?? prefill?.startMinute ?? 480))
  const [endTime,    setEndTime]    = useState(minutesToTime(activity?.endMinute   ?? (prefill?.startMinute ?? 480) + 60))
  const [color,      setColor]      = useState(activity?.color ?? prefill?.color ?? '')
  const [forAllTeams, setForAllTeams] = useState(false)

  function buildLabel() {
    if (templateLabel) {
      return sublabel.trim() ? `${templateLabel}-${sublabel.trim()}` : templateLabel
    }
    return label.trim()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const start    = timeToMinutes(startTime)
    const end      = timeToMinutes(endTime)
    const fullLabel = buildLabel()
    if (!fullLabel) return
    if (end <= start) { alert('Čas konce musí být po čase začátku.'); return }

    const base = { label: fullLabel, startMinute: start, endMinute: end, ...(color ? { color } : {}) }

    if (isEdit) {
      updateCampActivity(campId, dateStr, activity.id, { ...base, teamId })
    } else if (forAllTeams) {
      campTeams.forEach((t) => addCampActivity(campId, dateStr, { ...base, teamId: t.id }))
    } else {
      addCampActivity(campId, dateStr, { ...base, teamId })
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
          {/* Team selector — hidden when forAllTeams */}
          {!forAllTeams && (
            <div className="modal__field">
              <label className="modal__label">Tým</label>
              <select className="modal__select" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
                {campTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* "For all teams" checkbox — only in create mode */}
          {!isEdit && (
            <div className="modal__field" style={{ marginTop: forAllTeams ? 0 : -4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={forAllTeams} onChange={(e) => setForAllTeams(e.target.checked)} />
                Pro všechny týmy soustředění
              </label>
            </div>
          )}

          {/* Label — chip when from template, text input otherwise */}
          {templateLabel ? (
            <>
              <div className="modal__field">
                <label className="modal__label">Šablona</label>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                  background: color || 'var(--color-accent)', color: '#fff',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {templateLabel}
                </div>
              </div>
              <div className="modal__field">
                <label className="modal__label">Upřesnění (volitelně)</label>
                <input
                  className="modal__input"
                  type="text"
                  placeholder="např. fotbal, florbal…"
                  value={sublabel}
                  onChange={(e) => setSublabel(e.target.value)}
                  autoFocus
                />
                {sublabel.trim() && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                    Zobrazí se jako: <strong>{templateLabel}-{sublabel.trim()}</strong>
                  </p>
                )}
              </div>
            </>
          ) : (
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
          )}

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
              {isEdit ? 'Uložit' : (forAllTeams ? `Přidat pro ${campTeams.length} týmů` : 'Přidat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
