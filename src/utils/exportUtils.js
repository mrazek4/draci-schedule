const DAY_NAMES = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']

function minutesToTimeStr(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export async function exportToExcel(trainings, teams, halls) {
  if (!trainings || trainings.length === 0) {
    alert('Žádné tréninky k exportu.')
    return
  }

  const { default: ExcelJS } = await import('exceljs')

  const sorted = [...trainings].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.startMinute - b.startMinute
  )

  const wb = new ExcelJS.Workbook()
  wb.creator = 'FBC Draci Říčany'
  const ws = wb.addWorksheet('Rozvrh tréninků')

  const HEADERS = ['DEN', 'HALA', 'KATEGORIE', 'KATEGORIE2', 'OD', 'DO', 'TRENÉR1', 'TRENÉR2', 'TRENÉR3', 'ID', 'Délka']
  const WIDTHS  = [6, 18, 14, 14, 8, 8, 14, 14, 14, 5, 8]
  WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w })

  const CENTER = { vertical: 'middle', horizontal: 'center' }
  const LEFT   = { vertical: 'middle', horizontal: 'left'   }
  const CENTER_COLS = new Set([1, 5, 6, 10, 11])  // DEN, OD, DO, ID, Délka

  // Header row
  const hRow = ws.addRow(HEADERS)
  hRow.height = 18
  hRow.eachCell((cell, col) => {
    cell.value     = HEADERS[col - 1]
    cell.font      = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
    cell.alignment = CENTER_COLS.has(col) ? CENTER : LEFT
    cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } }

  // Data rows
  sorted.forEach((tr, idx) => {
    const teamIds = tr.teamIds ?? (tr.teamId ? [tr.teamId] : [])
    const team1   = teams.find((t) => t.id === teamIds[0])
    const team2   = teams.find((t) => t.id === teamIds[1])
    const hall    = halls.find((h) => h.id === tr.hallId)
    const duration = tr.endMinute - tr.startMinute

    const values = [
      DAY_NAMES[tr.dayOfWeek] ?? '',
      hall?.name ?? tr.hallId,
      team1?.shortName ?? '',
      team2?.shortName ?? '',
      minutesToTimeStr(tr.startMinute),
      minutesToTimeStr(tr.endMinute),
      '', '', '',
      idx + 1,
      formatDuration(duration),
    ]

    const row = ws.addRow(values)
    row.height = 18

    const isOdd = (idx + 1) % 2 === 1
    const bgArgb = isOdd ? 'FFDEEAF1' : 'FFFFFFFF'

    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font      = { size: 10 }
      cell.alignment = CENTER_COLS.has(col) ? CENTER : LEFT
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
      cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = Object.assign(document.createElement('a'), { href: url, download: 'treninky.xlsx' })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
