import { GRID_START_MINUTE, SLOT_MINUTES } from './timeUtils.js'

// col 1 = time axis; content cols start at 2
export function getGridColumn(dayIndex, hallIndex, nHalls) {
  return 2 + dayIndex * nHalls + hallIndex
}

// row 1 = day header, row 2 = hall header, content rows start at 3
export function getGridRow(startMinute) {
  return 3 + (startMinute - GRID_START_MINUTE) / SLOT_MINUTES
}

export function getGridRowSpan(startMinute, endMinute) {
  return (endMinute - startMinute) / SLOT_MINUTES
}

export function isWithinAvailability(hallId, dayOfWeek, startMinute, endMinute, availabilities) {
  return availabilities.some(
    (av) =>
      av.hallId === hallId &&
      av.dayOfWeek === dayOfWeek &&
      av.startMinute <= startMinute &&
      av.endMinute >= endMinute
  )
}

export function hasConflict(trainings, training) {
  return trainings.some(
    (t) =>
      t.id !== training.id &&
      t.hallId === training.hallId &&
      t.dayOfWeek === training.dayOfWeek &&
      t.startMinute < training.endMinute &&
      t.endMinute > training.startMinute
  )
}
