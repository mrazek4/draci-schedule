import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export default function TeamTile({ team }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `team-${team.id}`,
    data: { type: 'NEW_TRAINING', teamId: team.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={`team-tile${isDragging ? ' team-tile--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
    >
      <span className="team-tile__dot" style={{ background: team.color }} />
      <span className="team-tile__name">{team.name}</span>
    </div>
  )
}
