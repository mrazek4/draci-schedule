import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, GRID_START_MINUTE, GRID_END_MINUTE } from '../../utils/timeUtils.js'
import TimeSlot from './TimeSlot.jsx'
import './CalendarGrid.css'

const SLOT_MIN = 15
const SLOT_W   = 44
const ROW_H    = 44
const COL_DAY  = 60
const COL_TEAM = 120
const HDR_H    = 32

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek']
const DAY_SHORT = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']

// Blok tréninku v pohledu "týmy": zobrazuje kód haly místo zkratky týmu
function HallBlock({ training, hall, onClick }) {
  const bg = hall?.color ?? '#555'
  return (
    <div
      className="training-block"
      style={{ background: bg, color: '#fff', pointerEvents: 'all' }}
      onClick={(e) => { e.stopPropagation(); onClick?.(training) }}
    >
      <span className="training-block__short">{hall?.code ?? hall?.name ?? '?'}</span>
      <span className="training-block__time">
        {minutesToTime(training.startMinute)}–{minutesToTime(training.endMinute)}
      </span>
    </div>
  )
}

// Horizontální CSS grid s řádky (den × tým) a sloupci (čas); pohled rozvrhu per tým
export default function TeamCalendarGrid({ onTrainingClick, onSlotClick }) {
  const { teams, halls, hallAvailabilities, trainings } = useApp()

  if (!teams.length) {
    return (
      <div style={{ padding: 32, color: 'var(--color-text-muted)', fontSize: 14 }}>
        Přidej týmy přes „Správa týmů" v levém panelu.
      </div>
    )
  }

  const rows = []
  for (let day = 0; day < 5; day++) {
    for (const team of teams) {
      rows.push({ dayOfWeek: day, team })
    }
  }

  const allStarts = hallAvailabilities.map((a) => a.startMinute)
  const allEnds   = [
    ...hallAvailabilities.map((a) => a.endMinute),
    ...trainings.map((t) => t.endMinute),
  ]
  const minTime = Math.floor(Math.min(...allStarts) / 60) * 60
  const maxTime = Math.ceil(Math.max(...allEnds)     / 60) * 60

  const timeSlots = []
  for (let m = minTime; m < maxTime; m += SLOT_MIN) timeSlots.push(m)

  const timeCol  = (minute) => 3 + (minute - minTime) / SLOT_MIN
  const rowIndex = (day, teamId) => rows.findIndex((r) => r.dayOfWeek === day && r.team.id === teamId)
  const gridRow  = (ri) => ri + 2

  const dayGroups = {}
  rows.forEach(({ dayOfWeek }, i) => {
    if (!dayGroups[dayOfWeek]) dayGroups[dayOfWeek] = { start: i, count: 0 }
    dayGroups[dayOfWeek].count++
  })

  const gridTemplateColumns = `${COL_DAY}px ${COL_TEAM}px repeat(${timeSlots.length}, minmax(${SLOT_W}px, 1fr))`
  const gridTemplateRows    = `${HDR_H}px repeat(${rows.length}, minmax(${ROW_H}px, 1fr))`

  const dayColors = {}
  Object.keys(dayGroups).forEach((day, i) => {
    dayColors[day] = i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'
  })

  return (
    <div className="calendar-scroll">
      <div className="calendar-grid-h" style={{ gridTemplateColumns, gridTemplateRows }}>

        {/* corner */}
        <div className="gh-corner">
          <span className="gh-corner__den">Den</span>
          <span className="gh-corner__hala">Tým</span>
        </div>

        {/* time header */}
        {Array.from({ length: (maxTime - minTime) / 60 }, (_, i) => minTime + i * 60)
          .map((minute, idx, arr) => (
            <div
              key={`hour-${minute}`}
              className="gh-time-label gh-time-label--hour"
              style={{ gridColumn: `${timeCol(minute)} / span 4`, gridRow: 1 }}
            >
              <span>{minutesToTime(minute)}</span>
              {idx === arr.length - 1 && maxTime > 1320 && (
                <span className="gh-time-label__close">{minutesToTime(maxTime)}</span>
              )}
            </div>
          ))}

        {/* day labels */}
        {Object.entries(dayGroups).map(([day, { start, count }]) => (
          <div
            key={`day-${day}`}
            className="gh-day-label"
            style={{
              gridColumn: 1,
              gridRow: `${gridRow(start)} / span ${count}`,
              background: dayColors[day],
            }}
          >
            <span className="gh-day-label__short">{DAY_SHORT[day]}</span>
            <span className="gh-day-label__long">{DAY_NAMES[day]}</span>
          </div>
        ))}

        {/* team labels + time slots */}
        {rows.map((row, ri) => {
          const bg = dayColors[row.dayOfWeek]
          return [
            <div
              key={`team-${ri}`}
              className="gh-hall-label"
              style={{ gridColumn: 2, gridRow: gridRow(ri), background: bg, borderLeftColor: row.team.color }}
            >
              <span className="gh-hall-label__name">{row.team.shortName}</span>
            </div>,
            ...timeSlots.map((minute) => (
              <TimeSlot
                key={`${ri}-${minute}`}
                dayOfWeek={row.dayOfWeek}
                teamId={row.team.id}
                startMinute={minute}
                available={true}
                style={{
                  gridColumn: timeCol(minute),
                  gridRow: gridRow(ri),
                  borderTop:    '1px solid var(--color-border)',
                  borderBottom: '1px solid var(--color-border)',
                }}
                onClick={onSlotClick
                  ? () => onSlotClick({ teamId: row.team.id, dayOfWeek: row.dayOfWeek, startMinute: minute, endMinute: minute + 60 })
                  : undefined}
              />
            )),
          ]
        })}

        {/* training blocks — one per teamId in the training */}
        {trainings.map((training) => {
          const teamIds = training.teamIds ?? (training.teamId ? [training.teamId] : [])
          const hall    = halls.find((h) => h.id === training.hallId)
          return teamIds.map((teamId) => {
            const ri = rowIndex(training.dayOfWeek, teamId)
            if (ri === -1) return null
            const colStart = timeCol(training.startMinute)
            const colSpan  = (training.endMinute - training.startMinute) / SLOT_MIN
            return (
              <div
                key={`${training.id}-${teamId}`}
                style={{
                  gridColumn: `${colStart} / span ${colSpan}`,
                  gridRow: gridRow(ri),
                  position: 'relative',
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                <HallBlock training={training} hall={hall} onClick={onTrainingClick} />
              </div>
            )
          })
        })}

      </div>
    </div>
  )
}
