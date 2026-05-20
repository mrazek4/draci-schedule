import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useCanEdit } from '../../auth/useRole.js'

export default function TeamTile({ team, isVisible = true, onToggle }) {
  const canEdit = useCanEdit()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `team-${team.id}`,
    data: { type: 'NEW_TRAINING', teamId: team.id },
    disabled: !canEdit,
  })

  return (
    <div
      ref={setNodeRef}
      className={`team-tile${isDragging ? ' team-tile--dragging' : ''}${!isVisible ? ' team-tile--hidden' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
    >
      <button
        className="team-tile__vis"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggle?.(team.id) }}
        tabIndex={-1}
        title={isVisible ? 'Skrýt tým' : 'Zobrazit tým'}
      >
        <span className="team-tile__dot" style={{ background: isVisible ? team.color : 'transparent', borderColor: team.color }} />
      </button>
      <span className="team-tile__name">{team.name}</span>
    </div>
  )
}
