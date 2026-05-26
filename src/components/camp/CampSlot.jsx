import { useDroppable } from '@dnd-kit/core'

export default function CampSlot({ teamId, startMinute, isHour, style, onClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `camp-slot-${teamId}-${startMinute}`,
    data: { teamId, startMinute },
  })

  return (
    <div
      ref={setNodeRef}
      className={`camp-slot${isHour ? ' camp-slot--hour' : ''}${isOver ? ' camp-slot--over' : ''}`}
      style={style}
      onClick={onClick}
    />
  )
}
