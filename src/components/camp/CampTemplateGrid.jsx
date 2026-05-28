import { useApp } from '../../context/AppContext.jsx'
import { minutesToTime } from '../../utils/timeUtils.js'
import CampSlot from './CampSlot.jsx'
import './Camp.css'

const SLOT_MIN  = 15
const SLOT_W    = 44
const ROW_H     = 52
const COL_LABEL = 130
const HDR_H     = 32
const DAY_START = 360
const DAY_END   = 1380

function matches(activityLabel, templateLabel) {
  return activityLabel === templateLabel || activityLabel.startsWith(templateLabel + '-')
}

function sublabelOf(activityLabel, templateLabel) {
  return activityLabel.startsWith(templateLabel + '-')
    ? activityLabel.slice(templateLabel.length + 1)
    : ''
}

function TeamBlock({ activity, team, templateLabel, onClick }) {
  const bg = activity.color || team?.color || '#4f6ef7'
  const sub = sublabelOf(activity.label, templateLabel)
  return (
    <div
      className="camp-activity"
      style={{ background: bg, pointerEvents: 'all' }}
      onClick={(e) => { e.stopPropagation(); onClick?.(activity) }}
    >
      <div className="camp-activity__label">{team?.shortName ?? '?'}{sub ? ` · ${sub}` : ''}</div>
      <div className="camp-activity__time">
        {minutesToTime(activity.startMinute)}–{minutesToTime(activity.endMinute)}
      </div>
    </div>
  )
}

export default function CampTemplateGrid({ campTeams, activities, onSlotClick, onActivityClick }) {
  const { campActivityTemplates } = useApp()
  const templates = campActivityTemplates ?? []

  if (!templates.length) {
    return <div className="camp-empty">Přidej šablony aktivit přes ⚙ v levém panelu.</div>
  }

  const allStarts = activities.map((a) => a.startMinute)
  const allEnds   = activities.map((a) => a.endMinute)
  const minTime   = Math.floor(Math.min(DAY_START, ...allStarts) / 60) * 60
  const maxTime   = Math.ceil(Math.max(DAY_END, ...allEnds)   / 60) * 60

  const timeSlots = []
  for (let m = minTime; m < maxTime; m += SLOT_MIN) timeSlots.push(m)

  const timeCol  = (minute) => 2 + (minute - minTime) / SLOT_MIN
  const tplRow   = (i) => i + 2

  const gridTemplateColumns = `${COL_LABEL}px repeat(${timeSlots.length}, minmax(${SLOT_W}px, 1fr))`
  const gridTemplateRows    = `${HDR_H}px repeat(${templates.length}, minmax(${ROW_H}px, 1fr))`
  const minWidth            = COL_LABEL + timeSlots.length * SLOT_W

  return (
    <div className="camp-scroll">
      <div className="camp-grid" style={{ gridTemplateColumns, gridTemplateRows, minWidth }}>

        {/* corner */}
        <div className="camp-corner" style={{ gridColumn: 1, gridRow: 1 }} />

        {/* time header */}
        {Array.from({ length: (maxTime - minTime) / 60 }, (_, i) => minTime + i * 60).map((minute) => (
          <div
            key={`h-${minute}`}
            className="camp-time-label"
            style={{ gridColumn: `${timeCol(minute)} / span 4`, gridRow: 1 }}
          >
            {minutesToTime(minute)}
          </div>
        ))}

        {/* template rows */}
        {templates.map((tpl, ti) => {
          const tplActivities = activities.filter((a) => matches(a.label, tpl.label))
          const bg = ti % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'

          return [
            // template label
            <div
              key={`tl-${tpl.id}`}
              className="camp-team-label"
              style={{ gridColumn: 1, gridRow: tplRow(ti) }}
            >
              <span className="camp-team-dot" style={{ background: tpl.color ?? '#888' }} />
              {tpl.label}
            </div>,

            // slot cells
            ...timeSlots.map((minute) => {
              const isHour = minute % 60 === 0
              return (
                <CampSlot
                  key={`s-${ti}-${minute}`}
                  templateLabel={tpl.label}
                  templateColor={tpl.color}
                  startMinute={minute}
                  isHour={isHour}
                  style={{ gridColumn: timeCol(minute), gridRow: tplRow(ti), background: bg }}
                  onClick={() => onSlotClick?.({ templateLabel: tpl.label, templateColor: tpl.color, startMinute: minute })}
                />
              )
            }),

            // activity blocks grouped by start time (one per team)
            ...tplActivities.map((activity) => {
              const colStart = timeCol(activity.startMinute)
              const colSpan  = Math.max(1, (activity.endMinute - activity.startMinute) / SLOT_MIN)
              const team     = campTeams.find((t) => t.id === activity.teamId)
              return (
                <div
                  key={`a-${activity.id}`}
                  style={{
                    gridColumn: `${colStart} / span ${colSpan}`,
                    gridRow: tplRow(ti),
                    position: 'relative',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <TeamBlock
                    activity={activity}
                    team={team}
                    templateLabel={tpl.label}
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
