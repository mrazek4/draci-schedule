import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, timeToMinutes } from '../../utils/timeUtils.js'
import './Modal.css'

export default function CampActivityModal({ activity, campId, dateStr, prefill, campTeams, onClose }) {
  const { addCampActivity, updateCampActivity, deleteCampActivity, campActivityTemplates } = useApp()
  const isEdit = !!activity

  const [selectedTemplate, setSelectedTemplate] = useState(
    prefill?.templateLabel ? { label: prefill.templateLabel, color: prefill.color } : null
  )
  const effectiveTemplateLabel = selectedTemplate?.label ?? null

  const [teamId,   setTeamId]   = useState(activity?.teamId  ?? prefill?.teamId ?? campTeams[0]?.id ?? '')
  const [label,    setLabel]    = useState(activity?.label    ?? '')
  const [sublabel, setSublabel] = useState('')

  // In edit mode: once templates are available, detect matching template + sublabel
  useEffect(() => {
    if (!isEdit || !campActivityTemplates?.length) return
    const match = campActivityTemplates.find((t) =>
      activity.label === t.label || activity.label.startsWith(t.label + '-')
    )
    if (!match) return
    setSelectedTemplate({ label: match.label, color: match.color })
    setLabel('')
    if (activity.label.startsWith(match.label + '-')) {
      setSublabel(activity.label.slice(match.label.length + 1))
    }
  }, [campActivityTemplates])
  const [startTime,  setStartTime]  = useState(minutesToTime(activity?.startMinute ?? prefill?.startMinute ?? 480))
  const [endTime,    setEndTime]    = useState(minutesToTime(activity?.endMinute   ?? (prefill?.startMinute ?? 480) + 60))
  const [color,      setColor]      = useState(activity?.color ?? prefill?.color ?? '')
  const [note,       setNote]       = useState(activity?.note ?? '')
  const [forAllTeams, setForAllTeams] = useState(false)

  function selectTemplate(tpl) {
    if (selectedTemplate?.label === tpl.label) {
      setSelectedTemplate(null)
      if (!color) setColor('')
    } else {
      setSelectedTemplate(tpl)
      if (!color) setColor(tpl.color ?? '')
    }
  }

  function buildLabel() {
    if (effectiveTemplateLabel) {
      return sublabel.trim() ? `${effectiveTemplateLabel}-${sublabel.trim()}` : effectiveTemplateLabel
    }
    return label.trim()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const start    = timeToMinutes(startTime)
    const end      = timeToMinutes(endTime)
    const fullLabel = buildLabel()
    if (!fullLabel) { if (!isEdit) alert('Vyber šablonu aktivity.'); return }
    if (end <= start) { alert('Čas konce musí být po čase začátku.'); return }

    const base = { label: fullLabel, startMinute: start, endMinute: end, note, ...(color ? { color } : {}) }

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

          {/* Template chip picker — shown in both create and edit mode */}
          {(campActivityTemplates ?? []).length > 0 && (
            <div className="modal__field">
              <label className="modal__label">Šablona</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(campActivityTemplates ?? []).map((tpl) => {
                  const active = selectedTemplate?.label === tpl.label
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => selectTemplate(tpl)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${active ? tpl.color ?? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: active ? (tpl.color ?? 'var(--color-accent)') : 'var(--color-surface-2)',
                        color: active ? '#fff' : 'var(--color-text)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      {tpl.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upřesnění — when template selected; otherwise raw label field (edit) or disabled hint (create) */}
          {effectiveTemplateLabel ? (
            <div className="modal__field">
              <label className="modal__label">Upřesnění (volitelně)</label>
              <input
                className="modal__input"
                type="text"
                placeholder="např. fotbal, florbal…"
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
              />
              {sublabel.trim() && (
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                  Zobrazí se jako: <strong>{effectiveTemplateLabel}-{sublabel.trim()}</strong>
                </p>
              )}
            </div>
          ) : isEdit ? (
            <div className="modal__field">
              <label className="modal__label">Aktivita</label>
              <input
                className="modal__input"
                type="text"
                placeholder="Název aktivity"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus
                required
              />
            </div>
          ) : (
            <div className="modal__field">
              <label className="modal__label">Upřesnění (volitelně)</label>
              <input
                className="modal__input"
                type="text"
                placeholder="Nejprve vyber šablonu…"
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                disabled
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
            <label className="modal__label">Poznámka (volitelně)</label>
            <textarea
              className="modal__textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Volitelná poznámka…"
            />
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
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!isEdit && !effectiveTemplateLabel}
            >
              {isEdit ? 'Uložit' : (forAllTeams ? `Přidat pro ${campTeams.length} týmů` : 'Přidat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
