import { useApp } from '../../context/AppContext.jsx'
import { getWeekDays, getTimeSlots, minutesToTime, GRID_START_MINUTE, SLOT_MINUTES } from '../../utils/timeUtils.js'
import { getGridColumn, getGridRow, getGridRowSpan, isWithinAvailability } from '../../utils/calendarUtils.js'
import TimeSlot from './TimeSlot.jsx'
import TrainingBlock from './TrainingBlock.jsx'
import { isToday } from 'date-fns'
import './CalendarGrid.css'

export default function CalendarGrid({ onTrainingClick }) {
  const { halls, hallAvailabilities, trainings, weekOffset } = useApp()
  const weekDays = getWeekDays(weekOffset)
  const timeSlots = getTimeSlots()
  const nHalls = halls.length
  const nDays = 7

  // total content columns = nDays * nHalls; col 1 = time axis
  const gridTemplateColumns = `${56}px repeat(${nDays * nHalls}, minmax(80px, 1fr))`
  // row 1 = day header, row 2 = hall header, rows 3+ = slots
  const gridTemplateRows = `37px 22px repeat(${timeSlots.length}, var(--slot-height))`

  return (
    <div className="calendar-scroll">
      <div
        className="calendar-grid"
        style={{ gridTemplateColumns, gridTemplateRows }}
      >
        {/* ── corner cell ── */}
        <div style={{ gridColumn: 1, gridRow: '1 / 3', background: 'var(--color-surface)', borderBottom: '2px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 11 }} />

        {/* ── day headers (row 1) ── */}
        {weekDays.map(({ dayOfWeek, date, label }) => (
          <div
            key={dayOfWeek}
            className={`grid-day-header${isToday(date) ? ' grid-day-header--today' : ''}`}
            style={{
              gridColumn: `${getGridColumn(dayOfWeek, 0, nHalls)} / span ${nHalls}`,
              gridRow: 1,
            }}
          >
            {label}
          </div>
        ))}

        {/* ── hall headers (row 2) ── */}
        {weekDays.map(({ dayOfWeek }) =>
          halls.map((hall, hi) => (
            <div
              key={`${dayOfWeek}-${hall.id}`}
              className="grid-hall-header"
              style={{
                gridColumn: getGridColumn(dayOfWeek, hi, nHalls),
                gridRow: 2,
                borderLeft: hi === 0 ? '1px solid var(--color-border)' : undefined,
                color: hall.color,
              }}
            >
              {hall.name}
            </div>
          ))
        )}

        {/* ── time axis labels ── */}
        {timeSlots.map((startMinute, si) => (
          <div
            key={startMinute}
            className="grid-time-label"
            style={{ gridColumn: 1, gridRow: si + 3 }}
          >
            {startMinute % 60 === 0 ? minutesToTime(startMinute) : ''}
          </div>
        ))}

        {/* ── slot cells ── */}
        {weekDays.map(({ dayOfWeek }) =>
          halls.map((hall, hi) =>
            timeSlots.map((startMinute, si) => {
              const available = isWithinAvailability(
                hall.id, dayOfWeek, startMinute, startMinute + SLOT_MINUTES, hallAvailabilities
              )
              const col = getGridColumn(dayOfWeek, hi, nHalls)
              const row = si + 3
              return (
                <TimeSlot
                  key={`${dayOfWeek}-${hall.id}-${startMinute}`}
                  dayOfWeek={dayOfWeek}
                  hallId={hall.id}
                  startMinute={startMinute}
                  available={available}
                  style={{
                    gridColumn: col,
                    gridRow: row,
                    borderLeft: hi === 0 ? '1px solid var(--color-border)' : undefined,
                  }}
                />
              )
            })
          )
        )}

        {/* ── training blocks ── */}
        {trainings.map((training) => {
          const hi = halls.findIndex((h) => h.id === training.hallId)
          if (hi === -1) return null
          const col = getGridColumn(training.dayOfWeek, hi, nHalls)
          const rowStart = getGridRow(training.startMinute)
          const rowSpan = getGridRowSpan(training.startMinute, training.endMinute)
          return (
            <div
              key={training.id}
              style={{
                gridColumn: col,
                gridRow: `${rowStart} / span ${rowSpan}`,
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
