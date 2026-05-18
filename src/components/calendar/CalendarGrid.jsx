import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime, GRID_START_MINUTE, GRID_END_MINUTE } from '../../utils/timeUtils.js'
import { isWithinAvailability } from '../../utils/calendarUtils.js'
import TimeSlot from './TimeSlot.jsx'
import TrainingBlock from './TrainingBlock.jsx'
import './CalendarGrid.css'

const SLOT_MIN = 15          // 15-minute resolution
const SLOT_W   = 44          // px per 15-min slot
const ROW_H    = 44          // px per row
const COL_DAY  = 60          // px – day label column
const COL_HALL = 120         // px – hall label column
const HDR_H    = 32          // px – time header row

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']
const DAY_SHORT = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']

export default function CalendarGrid({ onTrainingClick, onSlotClick, hiddenTeamIds = [] }) {
  const { halls, hallAvailabilities, trainings } = useApp()

  const visibleTrainings = hiddenTeamIds.length === 0
    ? trainings
    : trainings.filter((t) => {
        const ids = t.teamIds ?? (t.teamId ? [t.teamId] : [])
        return ids.some((id) => !hiddenTeamIds.includes(id))
      })

  if (!halls.length || !hallAvailabilities.length) {
    return (
      <div style={{ padding: 32, color: 'var(--color-text-muted)', fontSize: 14 }}>
        Přidej haly a jejich dostupnost přes „Správa hal" v levém panelu.
      </div>
    )
  }

  // ── build rows: (dayOfWeek, hall) pairs sorted by day, then hall order ──
  const rows = []
  for (let day = 0; day < 5; day++) {
    for (const hall of halls) {
      if (hallAvailabilities.some((a) => a.hallId === hall.id && a.dayOfWeek === day)) {
        rows.push({ dayOfWeek: day, hall })
      }
    }
  }

  // ── time range: dynamic from availabilities + trainings ──
  const allStarts = hallAvailabilities.map((a) => a.startMinute)
  const allEnds   = [
    ...hallAvailabilities.map((a) => a.endMinute),
    ...trainings.map((t) => t.endMinute),
  ]
  const minTime = Math.floor(Math.min(...allStarts) / 60) * 60   // snap to whole hour
  const maxTime = Math.ceil(Math.max(...allEnds)   / 60) * 60   // snap to whole hour

  const timeSlots = []
  for (let m = minTime; m < maxTime; m += SLOT_MIN) timeSlots.push(m)

  // col helpers: 1=day, 2=hall, 3+=time
  const timeCol  = (minute) => 3 + (minute - minTime) / SLOT_MIN
  const rowIndex = (day, hallId) => rows.findIndex((r) => r.dayOfWeek === day && r.hall.id === hallId)
  const gridRow  = (ri) => ri + 2   // row 1 = header

  // day groups for spanning day label
  const dayGroups = {}
  rows.forEach(({ dayOfWeek }, i) => {
    if (!dayGroups[dayOfWeek]) dayGroups[dayOfWeek] = { start: i, count: 0 }
    dayGroups[dayOfWeek].count++
  })

  const gridTemplateColumns = `${COL_DAY}px ${COL_HALL}px repeat(${timeSlots.length}, minmax(${SLOT_W}px, 1fr))`
  const gridTemplateRows    = `${HDR_H}px repeat(${rows.length}, minmax(${ROW_H}px, 1fr))`

  // alternating day background
  const dayColors = {}
  Object.keys(dayGroups).forEach((day, i) => {
    dayColors[day] = i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'
  })

  return (
    <div className="calendar-scroll">
      <div className="calendar-grid-h" style={{ gridTemplateColumns, gridTemplateRows }}>

        {/* ── corner ── */}
        <div className="gh-corner">
          <span className="gh-corner__den">Den</span>
          <span className="gh-corner__hala">Hala</span>
        </div>

        {/* ── time header: one cell per hour, spanning 4 slots, centered ── */}
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

        {/* ── day labels (spanning) ── */}
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

        {/* ── hall labels + time slot cells ── */}
        {rows.map((row, ri) => {
          const bg = dayColors[row.dayOfWeek]
          return [
            <div
              key={`hall-${ri}`}
              className="gh-hall-label"
              style={{ gridColumn: 2, gridRow: gridRow(ri), background: bg, borderLeftColor: row.hall.color }}
            >
              {row.hall.name}
            </div>,
            ...timeSlots.map((minute) => {
              const available = isWithinAvailability(
                row.hall.id, row.dayOfWeek, minute, minute + SLOT_MIN, hallAvailabilities
              )
              return (
                <TimeSlot
                  key={`${ri}-${minute}`}
                  dayOfWeek={row.dayOfWeek}
                  hallId={row.hall.id}
                  startMinute={minute}
                  available={available}
                  style={{
                    gridColumn: timeCol(minute),
                    gridRow: gridRow(ri),
                    background: undefined,
                    borderTop: `1px solid var(--color-border)`,
                    borderBottom: `1px solid var(--color-border)`,
                  }}
                  onClick={onSlotClick
                    ? () => onSlotClick({ hallId: row.hall.id, dayOfWeek: row.dayOfWeek, startMinute: minute, endMinute: minute + 60 })
                    : undefined}
                />
              )
            }),
          ]
        })}

        {/* ── training blocks ── */}
        {visibleTrainings.map((training) => {
          const ri = rowIndex(training.dayOfWeek, training.hallId)
          if (ri === -1) return null
          const colStart = timeCol(training.startMinute)
          const colSpan  = (training.endMinute - training.startMinute) / SLOT_MIN
          return (
            <div
              key={training.id}
              style={{
                gridColumn: `${colStart} / span ${colSpan}`,
                gridRow: gridRow(ri),
                position: 'relative',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              <TrainingBlock training={training} onClick={onTrainingClick} />
            </div>
          )
        })}

      </div>
    </div>
  )
}
