import { startOfWeek, addDays, format } from 'date-fns'
import { cs } from 'date-fns/locale'

export const GRID_START_MINUTE = 480   // 08:00
export const GRID_END_MINUTE   = 1320  // 22:00
export const SLOT_MINUTES      = 30

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function snapToSlot(minutes) {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES
}

export function getWeekDays(weekOffset = 0) {
  const base = startOfWeek(new Date(), { weekStartsOn: 1 })
  const monday = addDays(base, weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    return {
      dayOfWeek: i,
      date,
      label: format(date, 'EEE d.M.', { locale: cs }),
    }
  })
}

export function formatWeekRange(weekOffset = 0) {
  const days = getWeekDays(weekOffset)
  const from = format(days[0].date, 'd. M.', { locale: cs })
  const to   = format(days[6].date, 'd. M. yyyy', { locale: cs })
  return `${from} – ${to}`
}

export function getTimeSlots() {
  const slots = []
  for (let m = GRID_START_MINUTE; m < GRID_END_MINUTE; m += SLOT_MINUTES) {
    slots.push(m)
  }
  return slots
}
