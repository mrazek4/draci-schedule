import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useCanEdit } from '../../auth/useRole.js'
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils.js'
import { isWithinAvailability } from '../../utils/calendarUtils.js'
import './Modal.css'

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek']

export default function TrainingModal({ training, prefill = {}, onClose, onCopy }) {
  const { teams, halls, hallAvailabilities, addTraining, updateTraining, deleteTraining } = useApp()
  const canEdit  = useCanEdit()
  const isCreate = !training

  const initialTeamIds = training
    ? (training.teamIds ?? (training.teamId ? [training.teamId] : []))
    : (prefill.teamIds ?? [])

  const [teamId1,   setTeamId1]   = useState(initialTeamIds[0] ?? '')
  const [teamId2,   setTeamId2]   = useState(initialTeamIds[1] ?? '')
  const [hallId,    setHallId]    = useState(training?.hallId    ?? prefill.hallId    ?? (halls[0]?.id ?? ''))
  const [dayOfWeek, setDayOfWeek] = useState(training?.dayOfWeek ?? prefill.dayOfWeek ?? 0)
  const [startTime, setStartTime] = useState(minutesToTime(training?.startMinute ?? prefill.startMinute ?? 900))
  const [endTime,   setEndTime]   = useState(minutesToTime(training?.endMinute   ?? prefill.endMinute   ?? 960))
  const [note,      setNote]      = useState(training?.note ?? prefill.note ?? '')
  const [error,     setError]     = useState(null)

  const activeHallId = isCreate ? hallId : training.hallId
  const hall = halls.find((h) => h.id === activeHallId)

  function validate() {
    if (!teamId1) { setError('Vyber alespoň jeden tým.'); return null }
    const startMinute = timeToMinutes(startTime)
    const endMinute   = timeToMinutes(endTime)
    if (endMinute <= startMinute) { setError('Čas konce musí být po čase začátku.'); return null }
    if (endMinute - startMinute < 15) { setError('Trénink musí trvat alespoň 15 minut.'); return null }
    // In edit mode, only re-check hall availability when the user changed the time
    const timeChanged = !isCreate
      ? (startMinute !== training.startMinute || endMinute !== training.endMinute)
      : true
    if (timeChanged) {
      const dow = isCreate ? Number(dayOfWeek) : training.dayOfWeek
      if (!isWithinAvailability(activeHallId, dow, startMinute, endMinute, hallAvailabilities)) {
        setError(`Hala ${hall?.name ?? ''} v tomto čase není dostupná.`)
        return null
      }
    }
    setError(null)
    return {
      startMinute,
      endMinute,
      teamIds: [teamId1, ...(teamId2 ? [teamId2] : [])],
    }
  }

  function handleSave() {
    const result = validate()
    if (!result) return
    if (isCreate) {
      addTraining({
        teamIds: result.teamIds,
        hallId,
        dayOfWeek: Number(dayOfWeek),
        startMinute: result.startMinute,
        endMinute: result.endMinute,
        note,
      })
    } else {
      updateTraining(training.id, {
        teamIds: result.teamIds,
        startMinute: result.startMinute,
        endMinute: result.endMinute,
        note,
      })
    }
    onClose()
  }

  function handleDelete() {
    deleteTraining(training.id)
    onClose()
  }

  const title = isCreate
    ? 'Nový trénink'
    : (teams.filter((t) => initialTeamIds.includes(t.id)).map((t) => t.name).join(' + ') || 'Trénink')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="modal__field">
          <label className="modal__label">Hala</label>
          {isCreate ? (
            <select className="modal__select" value={hallId} onChange={(e) => setHallId(e.target.value)}>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-text)' }}>{hall?.name ?? '–'}</p>
          )}
        </div>

        <div className="modal__field">
          <label className="modal__label">Den</label>
          {isCreate ? (
            <select className="modal__select" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-text)' }}>{DAY_NAMES[training.dayOfWeek]}</p>
          )}
        </div>

        <div className="modal__row">
          <div className="modal__field">
            <label className="modal__label">Od</label>
            <input type="time" className="modal__input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="modal__field">
            <label className="modal__label">Do</label>
            <input type="time" className="modal__input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="modal__field">
          <label className="modal__label">Tým 1</label>
          <select className="modal__select" value={teamId1} onChange={(e) => setTeamId1(e.target.value)}>
            <option value="">– vyber tým –</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">
            Tým 2{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              (volitelný – společný trénink)
            </span>
          </label>
          <select className="modal__select" value={teamId2} onChange={(e) => setTeamId2(e.target.value)}>
            <option value="">– žádný –</option>
            {teams.filter((t) => t.id !== teamId1).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">Poznámka</label>
          <textarea
            className="modal__textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Volitelná poznámka…"
          />
        </div>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 4 }}>{error}</p>}

        <div className={`modal__actions${!isCreate && canEdit ? ' modal__actions--spread' : ''}`}>
          {canEdit && !isCreate && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--danger" onClick={handleDelete}>Smazat</button>
              <button className="btn btn--ghost" onClick={() => onCopy?.({
                hallId: training.hallId,
                dayOfWeek: training.dayOfWeek,
                startMinute: training.startMinute,
                endMinute: training.endMinute,
                teamIds: initialTeamIds,
                note,
              })}>Kopírovat</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost" onClick={onClose}>Zavřít</button>
            {canEdit && (
              <button className="btn btn--primary" onClick={handleSave}>
                {isCreate ? 'Přidat' : 'Uložit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
