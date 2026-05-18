import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils.js'
import './Modal.css'

const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

function AvailabilityEditor({ hallId, onClose }) {
  const { hallAvailabilities, setHallAvailabilities } = useApp()
  const existing = hallAvailabilities.filter((a) => a.hallId === hallId)

  const [rows, setRows] = useState(
    existing.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      start: minutesToTime(a.startMinute),
      end: minutesToTime(a.endMinute),
    }))
  )

  function addRow() {
    setRows((r) => [...r, { id: crypto.randomUUID(), dayOfWeek: 0, start: '15:00', end: '22:00' }])
  }

  function removeRow(id) {
    setRows((r) => r.filter((row) => row.id !== id))
  }

  function updateRow(id, field, value) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  function handleSave() {
    const availabilities = rows.map((row) => ({
      id: row.id,
      dayOfWeek: Number(row.dayOfWeek),
      startMinute: timeToMinutes(row.start),
      endMinute: timeToMinutes(row.end),
    }))
    setHallAvailabilities(hallId, availabilities)
    onClose()
  }

  return (
    <>
      {rows.map((row) => (
        <div key={row.id} className="avail-row">
          <select
            className="modal__select"
            style={{ width: 56, padding: '5px 4px' }}
            value={row.dayOfWeek}
            onChange={(e) => updateRow(row.id, 'dayOfWeek', e.target.value)}
          >
            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <div className="avail-row__inputs">
            <input type="time" value={row.start} onChange={(e) => updateRow(row.id, 'start', e.target.value)} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>–</span>
            <input type="time" value={row.end} onChange={(e) => updateRow(row.id, 'end', e.target.value)} />
          </div>
          <button className="avail-row__remove" onClick={() => removeRow(row.id)}>×</button>
        </div>
      ))}
      <button className="btn btn--ghost" style={{ fontSize: 12, marginTop: 4 }} onClick={addRow}>+ Přidat okno</button>
      <div className="modal__actions">
        <button className="btn btn--ghost" onClick={onClose}>Zrušit</button>
        <button className="btn btn--primary" onClick={handleSave}>Uložit dostupnost</button>
      </div>
    </>
  )
}

function HallForm({ initial, onSave, onCancel }) {
  const [name, setName]   = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? '#4f6ef7')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div className="modal__field" style={{ flex: 1 }}>
          <label className="modal__label">Název haly</label>
          <input className="modal__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Hala Říčany" required />
        </div>
        <div className="modal__field" style={{ width: 80 }}>
          <label className="modal__label">Barva</label>
          <input type="color" className="modal__input" style={{ height: 36, padding: 2, cursor: 'pointer' }} value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="color-preview" style={{ background: color }} />
      </div>
      <div className="modal__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Zrušit</button>
        <button type="submit" className="btn btn--primary">{initial ? 'Uložit' : 'Přidat'}</button>
      </div>
    </form>
  )
}

export default function HallModal({ onClose }) {
  const { halls, addHall, updateHall, deleteHall } = useApp()
  const [editing, setEditing]     = useState(null)
  const [adding, setAdding]       = useState(false)
  const [editingAvail, setEditingAvail] = useState(null)

  if (editingAvail) {
    const hall = halls.find((h) => h.id === editingAvail)
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">Dostupnost – {hall?.name}</h2>
            <button className="modal__close" onClick={() => setEditingAvail(null)}>×</button>
          </div>
          <AvailabilityEditor hallId={editingAvail} onClose={() => setEditingAvail(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Správa hal</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="manage-list">
          {halls.map((hall) =>
            editing?.id === hall.id ? (
              <div key={hall.id} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                <HallForm
                  initial={hall}
                  onSave={(patch) => { updateHall(hall.id, patch); setEditing(null) }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={hall.id} className="manage-item">
                <span className="manage-item__dot" style={{ background: hall.color }} />
                <span className="manage-item__name">{hall.name}</span>
                <button className="manage-item__btn" onClick={() => setEditingAvail(hall.id)}>Dostupnost</button>
                <button className="manage-item__btn" onClick={() => setEditing(hall)}>Upravit</button>
                <button className="manage-item__btn manage-item__btn--danger" onClick={() => deleteHall(hall.id)}>Smazat</button>
              </div>
            )
          )}
        </div>

        {adding ? (
          <>
            <div className="modal__divider" />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10 }}>NOVÁ HALA</p>
            <HallForm
              onSave={(hall) => { addHall(hall); setAdding(false) }}
              onCancel={() => setAdding(false)}
            />
          </>
        ) : (
          <div className="modal__actions" style={{ justifyContent: 'flex-start', paddingTop: 8, borderTop: 'none', marginTop: 0 }}>
            <button className="btn btn--primary" onClick={() => setAdding(true)}>+ Přidat halu</button>
          </div>
        )}
      </div>
    </div>
  )
}
