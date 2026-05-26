import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { minutesToTime } from '../../utils/timeUtils.js'
import { useCanEdit } from '../../auth/useRole.js'

export default function CampActivityBlock({ activity, teamColor, onClick }) {
  const canEdit = useCanEdit()
  const bg = activity.color || teamColor || '#4f6ef7'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `camp-activity-${activity.id}`,
    data: { type: 'MOVE_CAMP_ACTIVITY', activityId: activity.id },
    disabled: !canEdit,
  })

  return (
    <div
      ref={setNodeRef}
      className="camp-activity"
      style={{
        background: bg,
        opacity: isDragging ? 0.35 : 1,
        transform: CSS.Translate.toString(transform),
        cursor: canEdit ? 'grab' : 'pointer',
      }}
      onClick={(e) => { e.stopPropagation(); if (!isDragging) onClick(activity) }}
      {...listeners}
      {...attributes}
    >
      <div className="camp-activity__label">{activity.label}</div>
      <div className="camp-activity__time">
        {minutesToTime(activity.startMinute)}–{minutesToTime(activity.endMinute)}
      </div>
    </div>
  )
}
