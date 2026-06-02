import { useDroppable } from '@dnd-kit/core'

// Drop target pro aktivity soustředění; přijímá tým nebo šablonu aktivity
export default function CampSlot({ teamId, templateLabel, templateColor, startMinute, isHour, style, onClick }) {
  const id = templateLabel
    ? `camp-tpl-slot-${templateLabel}-${startMinute}`
    : `camp-slot-${teamId}-${startMinute}`

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { teamId, templateLabel, templateColor, startMinute, available: true },
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
