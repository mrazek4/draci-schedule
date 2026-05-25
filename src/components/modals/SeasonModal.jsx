import { useState } from 'react'
import './Modal.css'

export default function SeasonModal({ onClose, onAdd }) {
  const [name, setName]                         = useState('')
  const [copyAvailabilities, setCopyAvail]      = useState(true)
  const [copyTeams, setCopyTeams]               = useState(true)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({ name: trimmed, copyAvailabilities, copyTeams })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Nová sezóna</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label">Název</label>
            <input
              className="modal__input"
              type="text"
              placeholder="2026/2027"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={copyAvailabilities}
                onChange={(e) => setCopyAvail(e.target.checked)}
              />
              Zachovat dostupnosti hal
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={copyTeams}
                onChange={(e) => setCopyTeams(e.target.checked)}
              />
              Zachovat týmy
            </label>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Zrušit</button>
            <button type="submit" className="btn btn--primary">Vytvořit</button>
          </div>
        </form>
      </div>
    </div>
  )
}
