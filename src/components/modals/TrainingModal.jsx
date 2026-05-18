import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils.js'
import { isWithinAvailability } from '../../utils/calendarUtils.js'
import './Modal.css'

export default function TrainingModal({ training, onClose }) {
  const { teams, halls, hallAvailabilities, updateTraining, deleteTraining } = useApp()
  const team = teams.find((t) => t.id === training.teamId)
  const hall = halls.find((h) => h.id === training.hallId)

  const [startTime, setStartTime] = useState(minutesToTime(training.startMinute))
  const [endTime, setEndTime]     = useState(minutesToTime(training.endMinute))
  const [note, setNote]           = useState(training.note ?? '')
  const [error, setError]         = useState(null)

  function handleSave() {
    const startMinute = timeToMinutes(startTime)
    const endMinute   = timeToMinutes(endTime)
    if (endMinute <= startMinute) {
      setError('Čas konce musí být po čase začátku.')
      return
    }
    const valid = isWithinAvailability(
      training.hallId, training.dayOfWeek, startMinute, endMinute, hallAvailabilities
    )
    if (!valid) {
      setError(`Hala ${hall?.name ?? ''} v tomto čase není dostupná.`)
      return
    }
    setError(null)
    updateTraining(training.id, { startMinute, endMinute, note })
    onClose()
  }

  function handleDelete() {
    deleteTraining(training.id)
    onClose()
  }

  const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ color: team?.color }}>
            {team?.name ?? 'Trénink'}
          </h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="modal__field">
          <label className="modal__label">Hala</label>
          <p style={{ fontSize: 13, color: 'var(--color-text)' }}>{hall?.name ?? '–'}</p>
        </div>

        <div className="modal__field">
          <label className="modal__label">Den</label>
          <p style={{ fontSize: 13, color: 'var(--color-text)' }}>{DAY_NAMES[training.dayOfWeek]}</p>
        </div>

        <div className="modal__row">
          <div className="modal__field">
            <label className="modal__label">Od</label>
            <input
              type="time"
              className="modal__input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="modal__field">
            <label className="modal__label">Do</label>
            <input
              type="time"
              className="modal__input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
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

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 4 }}>{error}</p>
        )}

        <div className="modal__actions modal__actions--spread">
          <button className="btn btn--danger" onClick={handleDelete}>Smazat</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost" onClick={onClose}>Zrušit</button>
            <button className="btn btn--primary" onClick={handleSave}>Uložit</button>
          </div>
        </div>
      </div>
    </div>
  )
}
