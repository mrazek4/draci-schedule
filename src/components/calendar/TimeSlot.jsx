import { useDroppable } from '@dnd-kit/core'

// Drop target pro DnD; vizuálně indikuje dostupnost a hover stav slotu
export default function TimeSlot({ dayOfWeek, hallId, teamId, startMinute, available, style, children, onClick }) {
  const id = teamId ? `slot-${dayOfWeek}-t${teamId}-${startMinute}` : `slot-${dayOfWeek}-${hallId}-${startMinute}`
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { dayOfWeek, hallId, teamId, startMinute, available },
    disabled: !available,
  })

  let cls = 'time-slot'
  if (!available)             cls += ' time-slot--unavailable'
  else                        cls += ' time-slot--available'
  if (isOver && available)    cls += ' time-slot--over'
  if (startMinute % 60 === 0) cls += ' time-slot--hour-mark'

  return (
    <div ref={setNodeRef} className={cls} style={style} onClick={available ? onClick : undefined}>
      {children}
    </div>
  )
}
