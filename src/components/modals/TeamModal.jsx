import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import './Modal.css'

function TeamForm({ initial, onSave, onCancel }) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [shortName, setShortName] = useState(initial?.shortName ?? '')
  const [color, setColor]         = useState(initial?.color ?? '#4f6ef7')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), shortName: shortName.trim() || name.trim().slice(0, 3).toUpperCase(), color })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal__row">
        <div className="modal__field">
          <label className="modal__label">Název týmu</label>
          <input className="modal__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="např. U12" required />
        </div>
        <div className="modal__field">
          <label className="modal__label">Zkratka (3 zn.)</label>
          <input className="modal__input" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="U12" maxLength={4} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div className="modal__field" style={{ flex: 1 }}>
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

export default function TeamModal({ onClose }) {
  const { teams, addTeam, updateTeam, deleteTeam } = useApp()
  const [editing, setEditing] = useState(null)
  const [adding, setAdding]   = useState(false)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Správa týmů</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="manage-list">
          {teams.map((team) =>
            editing?.id === team.id ? (
              <div key={team.id} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                <TeamForm
                  initial={team}
                  onSave={(patch) => { updateTeam(team.id, patch); setEditing(null) }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={team.id} className="manage-item">
                <span className="manage-item__dot" style={{ background: team.color }} />
                <span className="manage-item__name">{team.name} <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>({team.shortName})</span></span>
                <button className="manage-item__btn" onClick={() => setEditing(team)}>Upravit</button>
                <button className="manage-item__btn manage-item__btn--danger" onClick={() => deleteTeam(team.id)}>Smazat</button>
              </div>
            )
          )}
        </div>

        {adding ? (
          <>
            <div className="modal__divider" />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10 }}>NOVÝ TÝM</p>
            <TeamForm
              onSave={(team) => { addTeam(team); setAdding(false) }}
              onCancel={() => setAdding(false)}
            />
          </>
        ) : (
          <div className="modal__actions" style={{ justifyContent: 'flex-start', paddingTop: 8, borderTop: 'none', marginTop: 0 }}>
            <button className="btn btn--primary" onClick={() => setAdding(true)}>+ Přidat tým</button>
          </div>
        )}
      </div>
    </div>
  )
}
