const DAY_NAMES = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']

function minutesToTimeStr(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function hexToArgb(hex) {
  return 'FF' + hex.replace('#', '').toUpperCase()
}

function textArgbForBg(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? 'FF000000' : 'FFFFFFFF'
}

function border(top = 'thin', left = 'thin', bottom = 'thin', right = 'thin') {
  return { top: { style: top }, left: { style: left }, bottom: { style: bottom }, right: { style: right } }
}

export async function exportToExcel(trainings, teams, halls) {
  if (!trainings || trainings.length === 0) {
    alert('Žádné tréninky k exportu.')
    return
  }

  const { default: ExcelJS } = await import('exceljs')

  const minMinute = Math.floor(Math.min(...trainings.map((t) => t.startMinute)) / 15) * 15
  const maxMinute = Math.ceil(Math.max(...trainings.map((t) => t.endMinute)) / 15) * 15

  // 15-min time slots: header columns go from minMinute up to (but not including) maxMinute,
  // so the last training block extends to the right edge of the table.
  const timeSlots = []
  for (let m = minMinute; m < maxMinute; m += 15) timeSlots.push(m)

  const minuteToIdx = {}
  timeSlots.forEach((m, i) => { minuteToIdx[m] = i })
  minuteToIdx[maxMinute] = timeSlots.length  // boundary for endMinute calculation

  // Worksheet col for a given slot index (cols 1,2 = Den, Hala)
  const tCol = (idx) => idx + 3

  // Collect (dayOfWeek, hallId) pairs with trainings, sorted day-first
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

  const wb = new ExcelJS.Workbook()
  wb.creator = 'FBC Draci Říčany'
  const ws = wb.addWorksheet('Rozvrh tréninků')

  // Freeze first row + first two columns
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }]

  // Column widths
  ws.getColumn(1).width = 6
  ws.getColumn(2).width = 17
  timeSlots.forEach((_, i) => { ws.getColumn(i + 3).width = 7.5 })

  const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  const CENTER = { vertical: 'middle', horizontal: 'center' }
  const LEFT   = { vertical: 'middle', horizontal: 'left' }

  // ── Row 1: header ─────────────────────────────────────────────────────────
  const hRow = ws.addRow(['Den', 'Místo/čas', ...timeSlots.map(minutesToTimeStr)])
  hRow.height = 18
  hRow.eachCell((cell, col) => {
    cell.font      = { bold: true, size: 9 }
    cell.alignment = CENTER
    cell.fill      = HEADER_FILL
    const isHour   = col >= 3 && timeSlots[col - 3] % 60 === 0
    cell.border    = border(
      'medium',
      col === 1 ? 'medium' : isHour ? 'medium' : 'thin',
      'medium',
      col === 2 ? 'medium' : 'thin',
    )
  })

  // ── Data rows ──────────────────────────────────────────────────────────────
  let prevDay = -1
  for (const { dayOfWeek, hallId } of pairs) {
    const isNewDay = dayOfWeek !== prevDay
    prevDay = dayOfWeek

    const hall = halls.find((h) => h.id === hallId)
    const row  = ws.addRow([DAY_NAMES[dayOfWeek], hall?.name ?? hallId, ...Array(timeSlots.length).fill(null)])
    row.height = 21
    const r = row.number

    // Den
    const denCell = row.getCell(1)
    denCell.font      = { bold: true, size: 9 }
    denCell.alignment = CENTER
    denCell.border    = border(isNewDay ? 'medium' : 'thin', 'medium', 'thin', 'thin')

    // Hala
    const halaCell = row.getCell(2)
    halaCell.font      = { bold: true, size: 9 }
    halaCell.alignment = LEFT
    halaCell.border    = border(isNewDay ? 'medium' : 'thin', 'thin', 'thin', 'medium')

    // All time cells — default empty borders
    timeSlots.forEach((minute, idx) => {
      const isHour = minute % 60 === 0
      row.getCell(tCol(idx)).border = border(
        isNewDay ? 'medium' : 'thin',
        isHour ? 'medium' : 'thin',
        'thin',
        'thin',
      )
    })

    // Training blocks
    const rowTr = trainings.filter((t) => t.dayOfWeek === dayOfWeek && t.hallId === hallId)
    for (const tr of rowTr) {
      const teamIds = tr.teamIds ?? (tr.teamId ? [tr.teamId] : [])
      const label   = teamIds.map((id) => teams.find((t) => t.id === id)?.shortName ?? id).join(' + ')
      const bgHex   = teams.find((t) => t.id === teamIds[0])?.color ?? '#94a3b8'

      const si = minuteToIdx[tr.startMinute]
      const ei = minuteToIdx[tr.endMinute]      // exclusive
      if (si == null || ei == null || ei <= si) continue

      const sc = tCol(si)
      const ec = tCol(ei) - 1                   // inclusive end col
      if (ec > sc) ws.mergeCells(r, sc, r, ec)

      const cell      = ws.getCell(r, sc)
      cell.value      = label
      cell.font       = { bold: true, size: 9, color: { argb: textArgbForBg(bgHex) } }
      cell.alignment  = CENTER
      cell.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(bgHex) } }
      const isHour    = timeSlots[si] % 60 === 0
      cell.border     = border(isNewDay ? 'medium' : 'thin', isHour ? 'medium' : 'thin', 'thin', 'thin')
    }
  }

  // Download
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = Object.assign(document.createElement('a'), { href: url, download: 'treninky.xlsx' })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
