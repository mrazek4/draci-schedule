import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import './Modal.css'

function TemplateRow({ template, onUpdate, onDelete }) {
  const [label, setLabel] = useState(template.label)
  const [color, setColor] = useState(template.color ?? '#888888')
  const [dirty, setDirty] = useState(false)

  function handleChange(field, value) {
    if (field === 'label') { setLabel(value); setDirty(true) }
    if (field === 'color') { setColor(value); setDirty(true) }
  }

  function handleSave() {
    if (!label.trim()) return
    onUpdate(template.id, { label: label.trim(), color })
    setDirty(false)
  }

  return (
    <div className="manage-item">
      <span className="manage-item__dot" style={{ background: color }} />
      <input
        className="manage-item__name-input"
        value={label}
        onChange={(e) => handleChange('label', e.target.value)}
        onBlur={() => dirty && handleSave()}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => handleChange('color', e.target.value)}
        onBlur={() => dirty && handleSave()}
        style={{ width: 28, height: 28, padding: 2, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4 }}
      />
      <button className="manage-item__btn manage-item__btn--danger" onClick={() => onDelete(template.id)}>Smazat</button>
    </div>
  )
}

export default function CampActivityTemplatesModal({ onClose }) {
  const { campActivityTemplates, addCampActivityTemplate, updateCampActivityTemplate, deleteCampActivityTemplate } = useApp()
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#4f6ef7')

  function handleAdd(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    addCampActivityTemplate({ label: newLabel.trim(), color: newColor })
    setNewLabel('')
    setNewColor('#4f6ef7')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Šablony aktivit</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          {(campActivityTemplates ?? []).map((tpl) => (
            <TemplateRow
              key={tpl.id}
              template={tpl}
              onUpdate={updateCampActivityTemplate}
              onDelete={deleteCampActivityTemplate}
            />
          ))}
          {(campActivityTemplates ?? []).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>Žádné šablony.</p>
          )}
        </div>

        <form onSubmit={handleAdd}>
          <div className="modal__field">
            <label className="modal__label">Nová šablona</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="modal__input"
                type="text"
                placeholder="Název aktivity"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
              />
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{ width: 36, height: 36, padding: 2, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, flexShrink: 0 }}
              />
            </div>
          </div>
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Zavřít</button>
            <button type="submit" className="btn btn--primary">+ Přidat</button>
          </div>
        </form>
      </div>
    </div>
  )
}
