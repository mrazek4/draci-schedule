import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useCanEdit } from '../../auth/useRole.js'

export default function HallTile({ hall }) {
  const canEdit = useCanEdit()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `hall-${hall.id}`,
    data: { type: 'NEW_TRAINING_FROM_HALL', hallId: hall.id },
    disabled: !canEdit,
  })

  return (
    <div
      ref={setNodeRef}
      className={`team-tile${isDragging ? ' team-tile--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
    >
      <span className="team-tile__dot" style={{ background: hall.color, borderColor: hall.color, flexShrink: 0 }} />
      <span className="team-tile__name">{hall.name}</span>
    </div>
  )
}
