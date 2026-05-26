import ExcelJS from 'exceljs'

const DAY_NAMES      = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']
const DAY_NAMES_FULL = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

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

export async function exportDailySchedule(dayOfWeek, teams, trainings, halls) {
  const dayName = DAY_NAMES_FULL[dayOfWeek]

  const dayTrainings = trainings.filter((t) => t.dayOfWeek === dayOfWeek)

  const teamSlots = teams
    .map((team) => ({
      team,
      slots: dayTrainings
        .filter((t) => {
          const ids = t.teamIds ?? (t.teamId ? [t.teamId] : [])
          return ids.includes(team.id)
        })
        .sort((a, b) => a.startMinute - b.startMinute)
        .map((t) => ({
          od:       minutesToTimeStr(t.startMinute),
          do:       minutesToTimeStr(t.endMinute),
          aktivita: halls.find((h) => h.id === t.hallId)?.name ?? t.hallId,
        })),
    }))
    .filter((ts) => ts.slots.length > 0)

  if (teamSlots.length === 0) {
    alert(`V ${dayName.toLowerCase()} nejsou žádné tréninky.`)
    return
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'FBC Draci Říčany'
  const ws = wb.addWorksheet(dayName)

  // 3 columns per team: OD(7), DO(7), AKTIVITA(22)
  teamSlots.forEach((_, i) => {
    ws.getColumn(i * 3 + 1).width = 7
    ws.getColumn(i * 3 + 2).width = 7
    ws.getColumn(i * 3 + 3).width = 22
  })

  const thin    = { style: 'thin' }
  const allBord = { top: thin, left: thin, bottom: thin, right: thin }
  const CENTER  = { vertical: 'middle', horizontal: 'center' }
  const LEFT    = { vertical: 'middle', horizontal: 'left'   }

  // Row 1 — team names merged across 3 columns
  teamSlots.forEach((ts, i) => {
    const col  = i * 3 + 1
    const cell = ws.getCell(1, col)
    cell.value     = ts.team.name.toUpperCase()
    cell.font      = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3B6B' } }
    cell.alignment = CENTER
    cell.border    = allBord
    ws.mergeCells(1, col, 1, col + 2)
  })
  ws.getRow(1).height = 22

  // Row 2 — column headers
  teamSlots.forEach((_, i) => {
    const base = i * 3 + 1
    ;['OD', 'DO', 'AKTIVITA'].forEach((h, j) => {
      const cell     = ws.getCell(2, base + j)
      cell.value     = h
      cell.font      = { bold: true, size: 9 }
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } }
      cell.alignment = CENTER
      cell.border    = allBord
    })
  })
  ws.getRow(2).height = 15

  // Data rows
  const maxSlots = Math.max(...teamSlots.map((ts) => ts.slots.length))
  for (let r = 0; r < maxSlots; r++) {
    const rowIdx = r + 3
    const bgArgb = r % 2 === 0 ? 'FFDEEAF1' : 'FFFFFFFF'
    ws.getRow(rowIdx).height = 15

    teamSlots.forEach((ts, i) => {
      const base   = i * 3 + 1
      const slot   = ts.slots[r]
      const values = slot ? [slot.od, slot.do, slot.aktivita] : ['', '', '']
      values.forEach((v, j) => {
        const cell     = ws.getCell(rowIdx, base + j)
        cell.value     = v
        cell.font      = { size: 9 }
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: slot ? bgArgb : 'FFFFFFFF' } }
        cell.alignment = j === 2 ? LEFT : CENTER
        cell.border    = allBord
      })
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = Object.assign(document.createElement('a'), { href: url, download: `rozvrh-${DAY_NAMES[dayOfWeek].toLowerCase()}.xlsx` })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportCampDay(date, campTeams, dayActivities) {
  const teamSlots = campTeams
    .map((team) => ({
      team,
      slots: (dayActivities ?? [])
        .filter((a) => a.teamId === team.id)
        .sort((a, b) => a.startMinute - b.startMinute)
        .map((a) => ({
          od:       minutesToTimeStr(a.startMinute),
          do:       minutesToTimeStr(a.endMinute),
          aktivita: a.label,
        })),
    }))
    .filter((ts) => ts.slots.length > 0)

  if (teamSlots.length === 0) {
    alert('Pro tento den nejsou žádné aktivity.')
    return
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'FBC Draci Říčany'
  const ws = wb.addWorksheet(date)

  teamSlots.forEach((_, i) => {
    ws.getColumn(i * 3 + 1).width = 7
    ws.getColumn(i * 3 + 2).width = 7
    ws.getColumn(i * 3 + 3).width = 22
  })

  const thin    = { style: 'thin' }
  const allBord = { top: thin, left: thin, bottom: thin, right: thin }
  const CENTER  = { vertical: 'middle', horizontal: 'center' }
  const LEFT    = { vertical: 'middle', horizontal: 'left'   }

  teamSlots.forEach((ts, i) => {
    const col  = i * 3 + 1
    const cell = ws.getCell(1, col)
    cell.value     = ts.team.name.toUpperCase()
    cell.font      = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3B6B' } }
    cell.alignment = CENTER
    cell.border    = allBord
    ws.mergeCells(1, col, 1, col + 2)
  })
  ws.getRow(1).height = 22

  teamSlots.forEach((_, i) => {
    const base = i * 3 + 1
    ;['OD', 'DO', 'AKTIVITA'].forEach((h, j) => {
      const cell     = ws.getCell(2, base + j)
      cell.value     = h
      cell.font      = { bold: true, size: 9 }
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8CCE4' } }
      cell.alignment = CENTER
      cell.border    = allBord
    })
  })
  ws.getRow(2).height = 15

  const maxSlots = Math.max(...teamSlots.map((ts) => ts.slots.length))
  for (let r = 0; r < maxSlots; r++) {
    const rowIdx = r + 3
    const bgArgb = r % 2 === 0 ? 'FFDEEAF1' : 'FFFFFFFF'
    ws.getRow(rowIdx).height = 15

    teamSlots.forEach((ts, i) => {
      const base   = i * 3 + 1
      const slot   = ts.slots[r]
      const values = slot ? [slot.od, slot.do, slot.aktivita] : ['', '', '']
      values.forEach((v, j) => {
        const cell     = ws.getCell(rowIdx, base + j)
        cell.value     = v
        cell.font      = { size: 9 }
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: slot ? bgArgb : 'FFFFFFFF' } }
        cell.alignment = j === 2 ? LEFT : CENTER
        cell.border    = allBord
      })
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = Object.assign(document.createElement('a'), { href: url, download: `soustredeni-${date}.xlsx` })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
