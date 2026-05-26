import { minutesToTime } from '../../utils/timeUtils.js'

export default function CampActivityBlock({ activity, teamColor, onClick }) {
  const bg = activity.color || teamColor || '#4f6ef7'
  return (
    <div
      className="camp-activity"
      style={{ background: bg }}
      onClick={(e) => { e.stopPropagation(); onClick(activity) }}
    >
      <div className="camp-activity__label">{activity.label}</div>
      <div className="camp-activity__time">
        {minutesToTime(activity.startMinute)}–{minutesToTime(activity.endMinute)}
      </div>
    </div>
  )
}
