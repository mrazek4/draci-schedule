import { useApp } from '../../context/AppContext.jsx'
import { exportCampDay } from '../../utils/exportUtils.js'
import CampGrid from './CampGrid.jsx'
import CampTemplateGrid from './CampTemplateGrid.jsx'
import './Camp.css'

const DAY_NAMES  = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
const MONTH_NAMES = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince']

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

function shiftDate(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export default function CampView({ campId, date, onDateChange, onSlotClick, onActivityClick, onBack, perspective, onPerspectiveChange }) {
  const { camps, campActivities, teams } = useApp()

  const camp = camps?.find((c) => c.id === campId)
  if (!camp) {
    return (
      <div className="camp-wrap">
        <div className="camp-empty">Vyberte soustředění v levém panelu.</div>
      </div>
    )
  }

  const currentDate   = date ?? camp.startDate
  const canGoPrev     = currentDate > camp.startDate
  const canGoNext     = currentDate < camp.endDate
  const dayActivities = (campActivities?.[campId]?.[currentDate] ?? [])
  const campTeams     = teams.filter((t) => camp.teamIds?.includes(t.id))

  async function handleExport() {
    try {
      await exportCampDay(currentDate, campTeams, dayActivities)
    } catch (err) {
      alert('Chyba při exportu: ' + err.message)
    }
  }

  return (
    <div className="camp-wrap">
      <div className="camp-header">
        <button className="camp-header__nav-btn" onClick={onBack} style={{ marginRight: 4 }}>
          ← Rozvrh
        </button>
        <span className="camp-header__title">{camp.name}</span>

        {/* Perspective toggle */}
        <div style={{ display: 'flex', gap: 2, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <button
            className="camp-header__nav-btn"
            style={{ borderRadius: 0, border: 'none', background: perspective === 'teams' ? 'var(--color-accent)' : undefined, color: perspective === 'teams' ? '#fff' : undefined }}
            onClick={() => onPerspectiveChange('teams')}
          >
            Týmy
          </button>
          <button
            className="camp-header__nav-btn"
            style={{ borderRadius: 0, border: 'none', background: perspective === 'templates' ? 'var(--color-accent)' : undefined, color: perspective === 'templates' ? '#fff' : undefined }}
            onClick={() => onPerspectiveChange('templates')}
          >
            Šablony
          </button>
        </div>

        <div className="camp-header__nav">
          <button className="camp-header__nav-btn" disabled={!canGoPrev} onClick={() => onDateChange(shiftDate(currentDate, -1))}>←</button>
          <span className="camp-header__date-label">{formatDate(currentDate)}</span>
          <button className="camp-header__nav-btn" disabled={!canGoNext} onClick={() => onDateChange(shiftDate(currentDate, 1))}>→</button>
        </div>

        <button className="camp-header__export-btn" onClick={handleExport}>↓ Export dne</button>
      </div>

      {perspective === 'templates'
        ? <CampTemplateGrid
            campTeams={campTeams}
            activities={dayActivities}
            onSlotClick={onSlotClick}
            onActivityClick={onActivityClick}
          />
        : <CampGrid
            campTeams={campTeams}
            activities={dayActivities}
            onSlotClick={onSlotClick}
            onActivityClick={onActivityClick}
          />
      }
    </div>
  )
}
