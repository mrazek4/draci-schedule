import { useState } from 'react'
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

// Phase 1 — merge activities with exactly the same time into one "effective block"
function mergeByExactTime(activities) {
  const map = new Map()
  for (const a of activities) {
    const key = `${a.startMinute}-${a.endMinute}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(a)
  }
  return Array.from(map.values()).map((acts) => ({
    id:          acts[0].id,
    startMinute: acts[0].startMinute,
    endMinute:   acts[0].endMinute,
    activities:  acts,
  }))
}

// Phase 2 — group overlapping effective blocks into clusters
function overlapClusters(blocks) {
  if (!blocks.length) return []
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute)
  const groups = []
  let group   = [sorted[0]]
  let groupEnd = sorted[0].endMinute

  for (let i = 1; i < sorted.length; i++) {
    const b = sorted[i]
    if (b.startMinute < groupEnd) {
      group.push(b)
      groupEnd = Math.max(groupEnd, b.endMinute)
    } else {
      groups.push(group)
      group    = [b]
      groupEnd = b.endMinute
    }
  }
  groups.push(group)
  return groups
}

// Phase 3 — assign vertical lanes within a cluster
function assignLanes(cluster) {
  const laneEnds = []
  const assigned = cluster.map((b) => {
    let lane = laneEnds.findIndex((end) => end <= b.startMinute)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = b.endMinute
    return { block: b, lane }
  })
  const totalLanes = laneEnds.length
  return assigned.map((item) => ({ ...item, totalLanes }))
}

// Renders one effective block (1 or N teams at same time) like a TrainingBlock
function MergedBlock({ block, campTeams, templateLabel, onClick, posStyle }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const teams = block.activities
    .map((a) => campTeams.find((t) => t.id === a.teamId))
    .filter(Boolean)

  const t1    = teams[0]
  const t2    = teams[1]
  const extra = teams.length - 2
  const isMulti = block.activities.length > 1

  const bg = t2
    ? `linear-gradient(135deg, ${t1?.color ?? '#555'} 50%, ${t2.color} 50%)`
    : (t1?.color ?? block.activities[0]?.color ?? '#4f6ef7')

  const label = teams.slice(0, 2).map((t) => t.shortName).join('+') +
                (extra > 0 ? `+${extra}` : '')
  const sub   = sublabelOf(block.activities[0].label, templateLabel)

  function handleClick(e) {
    e.stopPropagation()
    if (isMulti) {
      setPickerOpen((o) => !o)
    } else {
      onClick?.(block.activities[0])
    }
  }

  return (
    <div style={{ position: 'absolute', ...posStyle, right: 'auto', bottom: 'auto' }}>
      <div
        className="camp-activity"
        style={{ background: bg, pointerEvents: 'all', position: 'absolute', inset: 0 }}
        onClick={handleClick}
      >
        <div className="camp-activity__label">{label}{sub ? ` · ${sub}` : ''}</div>
        <div className="camp-activity__time">
          {minutesToTime(block.startMinute)}–{minutesToTime(block.endMinute)}
        </div>
      </div>

      {pickerOpen && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 30,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            minWidth: 160, pointerEvents: 'all',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {block.activities.map((activity, i) => {
            const team = campTeams.find((t) => t.id === activity.teamId)
            return (
              <div
                key={activity.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', cursor: 'pointer', fontSize: 12,
                  borderBottom: i < block.activities.length - 1 ? '1px solid var(--color-border)' : 'none',
                  color: 'var(--color-text)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                onClick={() => { setPickerOpen(false); onClick?.(activity) }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: team?.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{team?.shortName}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{team?.name}</span>
              </div>
            )
          })}
        </div>
      )}
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

        {templates.map((tpl, ti) => {
          const tplActivities = activities.filter((a) => matches(a.label, tpl.label))
          const bg            = ti % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'

          // Build effective blocks and assign lanes
          const effectiveBlocks = mergeByExactTime(tplActivities)
          const clusters        = overlapClusters(effectiveBlocks)

          return [
            // template label
            <div key={`tl-${tpl.id}`} className="camp-team-label"
              style={{ gridColumn: 1, gridRow: tplRow(ti) }}>
              <span className="camp-team-dot" style={{ background: tpl.color ?? '#888' }} />
              {tpl.label}
            </div>,

            // droppable slots
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

            // one wrapper per cluster, blocks positioned inside
            ...clusters.map((cluster) => {
              const assigned   = assignLanes(cluster)
              const groupStart = Math.min(...cluster.map((b) => b.startMinute))
              const groupEnd   = Math.max(...cluster.map((b) => b.endMinute))
              const groupDur   = groupEnd - groupStart
              const colStart   = timeCol(groupStart)
              const colSpan    = Math.max(1, (groupEnd - groupStart) / SLOT_MIN)

              return (
                <div key={`cl-${cluster[0].id}`}
                  style={{
                    gridColumn: `${colStart} / span ${colSpan}`,
                    gridRow: tplRow(ti),
                    position: 'relative',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  {assigned.map(({ block, lane, totalLanes }) => {
                    const leftPct  = (block.startMinute - groupStart) / groupDur * 100
                    const widthPct = (block.endMinute - block.startMinute) / groupDur * 100
                    const topPct   = lane / totalLanes * 100
                    const htPct    = 1   / totalLanes * 100

                    return (
                      <MergedBlock
                        key={block.id}
                        block={block}
                        campTeams={campTeams}
                        templateLabel={tpl.label}
                        onClick={onActivityClick}
                        posStyle={{
                          left:   `calc(${leftPct}%  + 1px)`,
                          width:  `calc(${widthPct}% - 2px)`,
                          top:    `calc(${topPct}%   + 2px)`,
                          height: `calc(${htPct}%    - 4px)`,
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
