import * as XLSX from 'xlsx'

const DAY_MAP = {
  PO: 0, UT: 1, ÚT: 1, ST: 2, CT: 3, ČT: 3, PA: 4, PÁ: 4, SO: 5, NE: 6,
}

function parseCellTime(cell) {
  if (!cell) return null
  // Formatted string "16:15"
  const src = cell.w || (typeof cell.v === 'string' ? cell.v : null)
  if (src) {
    const m = String(src).match(/^(\d{1,2}):(\d{2})$/)
    if (m) return parseInt(m[1]) * 60 + parseInt(m[2])
  }
  // Excel numeric time fraction (0..1)
  if (typeof cell.v === 'number' && cell.v > 0 && cell.v < 1) {
    return Math.round(cell.v * 24 * 60)
  }
  return null
}

function findHall(cellValue, halls) {
  const name = String(cellValue || '').trim().toLowerCase()
  if (!name) return null
  return halls.find(
    (h) => h.name.toLowerCase().includes(name) || name.includes(h.name.toLowerCase())
  ) ?? null
}

function findTeams(cellText, teams) {
  if (!cellText) return []
  return String(cellText)
    .split(/\s*\+\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((abbr) => teams.find((t) => t.shortName.toUpperCase() === abbr.toUpperCase()))
    .filter(Boolean)
}

export function parseExcelTrainings(file, teams, halls) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellStyles: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const range = XLSX.utils.decode_range(ws['!ref'])
        const merges = ws['!merges'] || []

        // Build col → minute map from header row (row 0), starting at col 2
        const colToMinute = {}
        for (let c = 2; c <= range.e.c; c++) {
          const mins = parseCellTime(ws[XLSX.utils.encode_cell({ r: 0, c })])
          if (mins !== null) colToMinute[c] = mins
        }

        const trainings = []
        let skipped = 0

        for (let r = 1; r <= range.e.r; r++) {
          const dayCell = ws[XLSX.utils.encode_cell({ r, c: 0 })]
          const hallCell = ws[XLSX.utils.encode_cell({ r, c: 1 })]
          if (!dayCell || !hallCell) continue

          const dayAbbr = String(dayCell.v || '').trim().toUpperCase()
          const dayOfWeek = DAY_MAP[dayAbbr]
          if (dayOfWeek === undefined) continue

          const hall = findHall(hallCell.v, halls)
          if (!hall) { skipped++; continue }

          // Process merged cells in this row
          const rowMerges = merges.filter((m) => m.s.r === r && m.s.c >= 2)
          const coveredCols = new Set()

          for (const merge of rowMerges) {
            const startMinute = colToMinute[merge.s.c]
            const endMinute = colToMinute[merge.e.c + 1]
            if (startMinute == null || endMinute == null) continue

            const cell = ws[XLSX.utils.encode_cell({ r, c: merge.s.c })]
            const matchedTeams = findTeams(cell?.v, teams)
            if (matchedTeams.length === 0) { skipped++; continue }

            for (let c = merge.s.c; c <= merge.e.c; c++) coveredCols.add(c)
            trainings.push({
              teamIds: matchedTeams.map((t) => t.id),
              hallId: hall.id,
              dayOfWeek,
              startMinute,
              endMinute,
              note: '',
            })
          }

          // Process single (non-merged) cells with content
          for (let c = 2; c <= range.e.c; c++) {
            if (coveredCols.has(c)) continue
            const cell = ws[XLSX.utils.encode_cell({ r, c })]
            if (!cell?.v) continue

            const startMinute = colToMinute[c]
            const endMinute = colToMinute[c + 1]
            if (startMinute == null || endMinute == null) continue

            const matchedTeams = findTeams(cell.v, teams)
            if (matchedTeams.length === 0) continue

            trainings.push({
              teamIds: matchedTeams.map((t) => t.id),
              hallId: hall.id,
              dayOfWeek,
              startMinute,
              endMinute,
              note: '',
            })
          }
        }

        resolve({ trainings, skipped })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
