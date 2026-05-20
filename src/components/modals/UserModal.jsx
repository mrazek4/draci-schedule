import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../auth/AuthProvider.jsx'
import './Modal.css'

export default function UserModal({ onClose }) {
  const { userRoles, setUserRole, removeUserRole } = useApp()
  const { user } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [newRole,  setNewRole]  = useState('vybor')

  const entries = Object.entries(userRoles ?? {})

  function handleAdd(e) {
    e.preventDefault()
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    setUserRole(email, newRole)
    setNewEmail('')
    setNewRole('vybor')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Správa uživatelů</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        {entries.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Zatím žádní uživatelé s přiřazenou rolí.
          </p>
        )}

        <div className="manage-list">
          {entries.map(([email, role]) => (
            <div key={email} className="manage-item">
              <span className="manage-item__name" style={{ fontSize: 12 }}>{email}</span>
              <select
                className="modal__select"
                style={{ width: 160, fontSize: 12 }}
                value={role}
                onChange={(e) => setUserRole(email, e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="vybor">Editor</option>
              </select>
              <button
                className="manage-item__btn manage-item__btn--danger"
                disabled={email === user?.email}
                title={email === user?.email ? 'Nemůžeš odebrat vlastní roli' : 'Odebrat'}
                onClick={() => removeUserRole(email)}
              >
                Odebrat
              </button>
            </div>
          ))}
        </div>

        <div className="modal__divider" />

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="modal__field" style={{ flex: 1, marginBottom: 0 }}>
            <label className="modal__label">Email</label>
            <input
              className="modal__input"
              type="email"
              placeholder="jan@florbaldraci.cz"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="modal__field" style={{ width: 160, marginBottom: 0 }}>
            <label className="modal__label">Role</label>
            <select className="modal__select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="vybor">Editor</option>
            </select>
          </div>
          <button type="submit" className="btn btn--primary" style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
            Přidat
          </button>
        </form>
      </div>
    </div>
  )
}
