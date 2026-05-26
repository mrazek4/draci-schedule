import { minutesToTime } from '../../utils/timeUtils.js'
import CampActivityBlock from './CampActivityBlock.jsx'
import CampSlot from './CampSlot.jsx'
import './Camp.css'

const SLOT_MIN  = 15
const SLOT_W    = 44
const ROW_H     = 52
const COL_TEAM  = 130
const HDR_H     = 32
const DAY_START = 360   // 6:00
const DAY_END   = 1380  // 23:00

export default function CampGrid({ campTeams, activities, onSlotClick, onActivityClick }) {
  if (!campTeams.length) {
    return <div className="camp-empty">Soustředění nemá přiřazené týmy. Uprav ho v sidebaru.</div>
  }

  // dynamic time range from activities, clamped to day defaults
  const allStarts = activities.map((a) => a.startMinute)
  const allEnds   = activities.map((a) => a.endMinute)
  const minTime   = Math.floor(Math.min(DAY_START, ...allStarts) / 60) * 60
  const maxTime   = Math.ceil(Math.max(DAY_END, ...allEnds) / 60) * 60

  const timeSlots = []
  for (let m = minTime; m < maxTime; m += SLOT_MIN) timeSlots.push(m)

  // col 1 = team label, col 2+ = time slots
  const timeCol  = (minute) => 2 + (minute - minTime) / SLOT_MIN
  const teamRow  = (i) => i + 2  // row 1 = header

  const gridTemplateColumns = `${COL_TEAM}px repeat(${timeSlots.length}, minmax(${SLOT_W}px, 1fr))`
  const gridTemplateRows    = `${HDR_H}px repeat(${campTeams.length}, minmax(${ROW_H}px, 1fr))`
  const minWidth            = COL_TEAM + timeSlots.length * SLOT_W

  return (
    <div className="camp-scroll">
      <div className="camp-grid" style={{ gridTemplateColumns, gridTemplateRows, minWidth }}>

        {/* corner */}
        <div className="camp-corner" style={{ gridColumn: 1, gridRow: 1 }} />

        {/* time header — one cell per hour */}
        {Array.from({ length: (maxTime - minTime) / 60 }, (_, i) => minTime + i * 60).map((minute) => (
          <div
            key={`h-${minute}`}
            className="camp-time-label"
            style={{ gridColumn: `${timeCol(minute)} / span 4`, gridRow: 1 }}
          >
            {minutesToTime(minute)}
          </div>
        ))}

        {/* team rows */}
        {campTeams.map((team, ti) => {
          const teamActivities = activities.filter((a) => a.teamId === team.id)
          return [
            // team label
            <div
              key={`tl-${team.id}`}
              className="camp-team-label"
              style={{ gridColumn: 1, gridRow: teamRow(ti) }}
            >
              <span className="camp-team-dot" style={{ background: team.color }} />
              {team.shortName}
            </div>,

            // slot cells for this team row
            ...timeSlots.map((minute) => {
              const isHour = minute % 60 === 0
              const bg = ti % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'
              return (
                <CampSlot
                  key={`s-${ti}-${minute}`}
                  teamId={team.id}
                  startMinute={minute}
                  isHour={isHour}
                  style={{ gridColumn: timeCol(minute), gridRow: teamRow(ti), background: bg }}
                  onClick={() => onSlotClick?.({ teamId: team.id, startMinute: minute })}
                />
              )
            }),

            // activity blocks for this team row
            ...teamActivities.map((activity) => {
              const colStart = timeCol(activity.startMinute)
              const colSpan  = Math.max(1, (activity.endMinute - activity.startMinute) / SLOT_MIN)
              return (
                <div
                  key={`a-${activity.id}`}
                  style={{
                    gridColumn: `${colStart} / span ${colSpan}`,
                    gridRow: teamRow(ti),
                    position: 'relative',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <CampActivityBlock
                    activity={activity}
                    teamColor={team.color}
                    onClick={onActivityClick}
                  />
                </div>
              )
            }),
          ]
        })}
      </div>
    </div>
  )
}
