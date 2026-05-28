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

function matches(actLabel, tplLabel) {
  return actLabel === tplLabel || actLabel.startsWith(tplLabel + '-')
}

function sublabelOf(actLabel, tplLabel) {
  return actLabel.startsWith(tplLabel + '-') ? actLabel.slice(tplLabel.length + 1) : ''
}

// Group activities that overlap in time into clusters
function overlapGroups(activities) {
  if (!activities.length) return []
  const sorted = [...activities].sort((a, b) => a.startMinute - b.startMinute)
  const groups = []
  let group = [sorted[0]]
  let groupEnd = sorted[0].endMinute

  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i]
    if (a.startMinute < groupEnd) {
      group.push(a)
      groupEnd = Math.max(groupEnd, a.endMinute)
    } else {
      groups.push(group)
      group = [a]
      groupEnd = a.endMinute
    }
  }
  groups.push(group)
  return groups
}

// Assign vertical lanes within a group using greedy algorithm
function assignLanes(group) {
  const laneEnds = []
  const assigned = group.map((a) => {
    let lane = laneEnds.findIndex((end) => end <= a.startMinute)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = a.endMinute
    return { activity: a, lane }
  })
  const totalLanes = laneEnds.length
  return assigned.map((item) => ({ ...item, totalLanes }))
}

function TeamBlock({ activity, team, templateLabel, onClick, posStyle }) {
  const bg  = activity.color || team?.color || '#4f6ef7'
  const sub = sublabelOf(activity.label, templateLabel)
  return (
    <div
      className="camp-activity"
      style={{ background: bg, pointerEvents: 'all', ...posStyle }}
      onClick={(e) => { e.stopPropagation(); onClick?.(activity) }}
    >
      <div className="camp-activity__label">
        {team?.shortName ?? '?'}{sub ? ` · ${sub}` : ''}
      </div>
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
  const maxTime   = Math.ceil(Math.max(DAY_END,   ...allEnds)   / 60) * 60

  const timeSlots = []
  for (let m = minTime; m < maxTime; m += SLOT_MIN) timeSlots.push(m)

  const timeCol = (minute) => 2 + (minute - minTime) / SLOT_MIN
  const tplRow  = (i) => i + 2

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
          <div key={`h-${minute}`} className="camp-time-label"
            style={{ gridColumn: `${timeCol(minute)} / span 4`, gridRow: 1 }}>
            {minutesToTime(minute)}
          </div>
        ))}

        {/* template rows */}
        {templates.map((tpl, ti) => {
          const tplActivities = activities.filter((a) => matches(a.label, tpl.label))
          const bg = ti % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'
          const groups = overlapGroups(tplActivities)

          return [
            // label
            <div key={`tl-${tpl.id}`} className="camp-team-label"
              style={{ gridColumn: 1, gridRow: tplRow(ti) }}>
              <span className="camp-team-dot" style={{ background: tpl.color ?? '#888' }} />
              {tpl.label}
            </div>,

            // slots
            ...timeSlots.map((minute) => (
              <CampSlot key={`s-${ti}-${minute}`}
                templateLabel={tpl.label}
                templateColor={tpl.color}
                startMinute={minute}
                isHour={minute % 60 === 0}
                style={{ gridColumn: timeCol(minute), gridRow: tplRow(ti), background: bg }}
                onClick={() => onSlotClick?.({ templateLabel: tpl.label, templateColor: tpl.color, startMinute: minute })}
              />
            )),

            // activity groups — one wrapper per overlap cluster
            ...groups.map((group) => {
              const assigned    = assignLanes(group)
              const groupStart  = Math.min(...group.map((a) => a.startMinute))
              const groupEnd    = Math.max(...group.map((a) => a.endMinute))
              const groupDur    = groupEnd - groupStart
              const colStart    = timeCol(groupStart)
              const colSpan     = Math.max(1, (groupEnd - groupStart) / SLOT_MIN)

              return (
                <div key={`g-${group[0].id}`}
                  style={{
                    gridColumn: `${colStart} / span ${colSpan}`,
                    gridRow: tplRow(ti),
                    position: 'relative',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  {assigned.map(({ activity, lane, totalLanes }) => {
                    const team     = campTeams.find((t) => t.id === activity.teamId)
                    const leftPct  = (activity.startMinute - groupStart) / groupDur * 100
                    const widthPct = (activity.endMinute   - activity.startMinute) / groupDur * 100
                    const topPct   = lane / totalLanes * 100
                    const htPct    = 1   / totalLanes * 100

                    return (
                      <TeamBlock
                        key={activity.id}
                        activity={activity}
                        team={team}
                        templateLabel={tpl.label}
                        onClick={onActivityClick}
                        posStyle={{
                          left:   `calc(${leftPct}%  + 1px)`,
                          width:  `calc(${widthPct}% - 2px)`,
                          top:    `calc(${topPct}%   + 2px)`,
                          height: `calc(${htPct}%    - 4px)`,
                          right:  'auto',
                          bottom: 'auto',
                        }}
                      />
                    )
                  })}
                </div>
              )
            }),
          ]
        })}
      </div>
    </div>
  )
}
