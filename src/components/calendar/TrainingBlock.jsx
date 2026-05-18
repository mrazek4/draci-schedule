import { useDraggable } from '@dnd-kit/core'
import { minutesToTime } from '../../utils/timeUtils.js'
import { hasConflict } from '../../utils/calendarUtils.js'
import { useApp } from '../../context/AppContext.jsx'

export default function TrainingBlock({ training, onClick }) {
  const { teams, trainings } = useApp()
  const team = teams.find((t) => t.id === training.teamId)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `training-${training.id}`,
    data: { type: 'MOVE_TRAINING', trainingId: training.id },
  })

  const conflict = hasConflict(trainings, training)

  const label = team?.shortName ?? '?'
  const bg = team?.color ?? '#555'
  const timeLabel = `${minutesToTime(training.startMinute)}–${minutesToTime(training.endMinute)}`

  let cls = 'training-block'
  if (isDragging) cls += ' training-block--dragging'
  if (conflict) cls += ' training-block--conflict'

  return (
    <div
      ref={setNodeRef}
      className={cls}
      style={{ background: bg, color: '#fff', pointerEvents: 'all' }}
      onClick={(e) => { e.stopPropagation(); onClick?.(training) }}
      {...listeners}
      {...attributes}
    >
      <span className="training-block__short">{label}</span>
      <span className="training-block__time">{timeLabel}</span>
    </div>
  )
}
