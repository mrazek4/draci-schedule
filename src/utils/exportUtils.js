import * as XLSX from 'xlsx'

const DAY_NAMES = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']

function minutesToTimeStr(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function exportToExcel(trainings, teams, halls) {
  if (!trainings || trainings.length === 0) {
    alert('Žádné tréninky k exportu.')
    return
  }

  const minMinute = Math.floor(Math.min(...trainings.map((t) => t.startMinute)) / 15) * 15
  const maxMinute = Math.ceil(Math.max(...trainings.map((t) => t.endMinute)) / 15) * 15

  // Build time slots (15-min steps), last slot is phantom (for endMinute boundary)
  const timeSlots = []
  for (let m = minMinute; m <= maxMinute; m += 15) timeSlots.push(m)

  // col = index in timeSlots + 2 (offset for Den, Místo/Čas columns)
  const minuteToCol = {}
  timeSlots.forEach((m, i) => { minuteToCol[m] = i + 2 })

  // Collect (dayOfWeek, hallId) pairs that have trainings, sorted by day then hall order
  const pairs = []
  const seen = new Set()
  for (let day = 0; day <= 6; day++) {
    for (const hall of halls) {
      const key = `${day}_${hall.id}`
      if (!seen.has(key) && trainings.some((t) => t.dayOfWeek === day && t.hallId === hall.id)) {
        seen.add(key)
        pairs.push({ dayOfWeek: day, hallId: hall.id })
      }
    }
  }

  const ws = {}
  const merges = []

  // Header row (row 0): Den | Místo/Čas | 16:00 | 16:15 | ...
  ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = { v: 'Den', t: 's' }
  ws[XLSX.utils.encode_cell({ r: 0, c: 1 })] = { v: 'Místo/Čas', t: 's' }
  timeSlots.forEach((m, i) => {
    ws[XLSX.utils.encode_cell({ r: 0, c: i + 2 })] = { v: minutesToTimeStr(m), t: 's' }
  })

  // Data rows
  pairs.forEach(({ dayOfWeek, hallId }, idx) => {
    const r = idx + 1
    const hall = halls.find((h) => h.id === hallId)
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = { v: DAY_NAMES[dayOfWeek], t: 's' }
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = { v: hall?.name ?? hallId, t: 's' }

    const rowTrainings = trainings.filter((t) => t.dayOfWeek === dayOfWeek && t.hallId === hallId)
    for (const training of rowTrainings) {
      const teamIdArr = training.teamIds ?? (training.teamId ? [training.teamId] : [])
      const label = teamIdArr
        .map((id) => teams.find((t) => t.id === id)?.shortName ?? id)
        .join(' + ')

      const startCol = minuteToCol[training.startMinute]
      const endColExclusive = minuteToCol[training.endMinute]
      if (startCol == null || endColExclusive == null) continue

      const endCol = endColExclusive - 1
      ws[XLSX.utils.encode_cell({ r, c: startCol })] = { v: label, t: 's' }
      if (endCol > startCol) merges.push({ s: { r, c: startCol }, e: { r, c: endCol } })
    }
  })

  const lastRow = pairs.length
  const lastCol = timeSlots.length + 1
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } })
  ws['!merges'] = merges
  ws['!cols'] = [{ wch: 4 }, { wch: 14 }, ...timeSlots.map(() => ({ wch: 6 }))]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rozvrh')
  XLSX.writeFile(wb, 'treninky.xlsx')
}
