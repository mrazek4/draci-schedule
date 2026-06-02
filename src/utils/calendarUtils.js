import { GRID_START_MINUTE, SLOT_MINUTES } from './timeUtils.js'

// Vrátí číslo sloupce v CSS gridu pro daný den a index haly
export function getGridColumn(dayIndex, hallIndex, nHalls) {
  return 2 + dayIndex * nHalls + hallIndex
}

// Vrátí číslo řádku v CSS gridu pro daný čas v minutách (obsah začíná od řádku 3)
export function getGridRow(startMinute) {
  return 3 + (startMinute - GRID_START_MINUTE) / SLOT_MINUTES
}

// Vrátí počet řádků gridu, které pokryje daný časový úsek
export function getGridRowSpan(startMinute, endMinute) {
  return (endMinute - startMinute) / SLOT_MINUTES
}

// Zkontroluje, zda daný čas spadá do dostupnosti haly
export function isWithinAvailability(hallId, dayOfWeek, startMinute, endMinute, availabilities) {
  return availabilities.some(
    (av) =>
      av.hallId === hallId &&
      av.dayOfWeek === dayOfWeek &&
      av.startMinute <= startMinute &&
      av.endMinute >= endMinute
  )
}

// Zkontroluje, zda trénink koliduje s jiným tréninkem ve stejné hale a ve stejný den
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
