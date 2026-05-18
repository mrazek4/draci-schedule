import { useDroppable } from '@dnd-kit/core'

export default function TimeSlot({ dayOfWeek, hallId, startMinute, available, style, children }) {
  const id = `slot-${dayOfWeek}-${hallId}-${startMinute}`
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { dayOfWeek, hallId, startMinute, available },
    disabled: !available,
  })

  let cls = 'time-slot'
  if (!available)             cls += ' time-slot--unavailable'
  else                        cls += ' time-slot--available'
  if (isOver && available)    cls += ' time-slot--over'
  if (startMinute % 60 === 0) cls += ' time-slot--hour-mark'

  return (
    <div ref={setNodeRef} className={cls} style={style}>
      {children}
    </div>
  )
}
