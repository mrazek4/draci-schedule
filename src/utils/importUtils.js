import * as XLSX from 'xlsx'

const DAY_MAP = {
  PO: 0, UT: 1, ÚT: 1, ST: 2, CT: 3, ČT: 3, PA: 4, PÁ: 4, SO: 5, NE: 6,
}

// Parsuje čas z buňky Excelu (formát HH:MM nebo desetinné číslo); vrátí minuty od půlnoci
function parseCellTime(cell) {
  if (!cell) return null
  const src = cell.w || (typeof cell.v === 'string' ? cell.v : null)
  if (src) {
    const m = String(src).match(/^(\d{1,2}):(\d{2})$/)
    if (m) return parseInt(m[1]) * 60 + parseInt(m[2])
  }
  if (typeof cell.v === 'number' && cell.v > 0 && cell.v < 1) {
    return Math.round(cell.v * 24 * 60)
  }
  return null
}

// Načte textový obsah buňky Excelu na dané pozici (řádek, sloupec)
function getCellText(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })]
  if (!cell) return null
  return (cell.w ?? (cell.v != null ? String(cell.v) : null))?.trim() ?? null
}

// Najde halu podle kódu nebo části názvu (case-insensitive)
function findHall(value, halls) {
  const v = String(value || '').trim()
  if (!v) return null
  const byCode = halls.find((h) => h.code && h.code.toUpperCase() === v.toUpperCase())
  if (byCode) return byCode
  const lower = v.toLowerCase()
  return halls.find((h) => h.name.toLowerCase().includes(lower) || lower.includes(h.name.toLowerCase())) ?? null
}

// Najde tým podle zkratky (case-insensitive)
function findTeam(value, teams) {
  if (!value) return null
  const abbr = String(value).trim()
  if (!abbr) return null
  return teams.find((t) => t.shortName.toUpperCase() === abbr.toUpperCase()) ?? null
}

// Parsuje tréninky z Excel souboru; vrátí Promise se seznamem tréninků a neznámými halami
export function parseExcelTrainings(file, teams, halls) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellStyles: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const range = XLSX.utils.decode_range(ws['!ref'])

        // Build column map from header row
        const colMap = {}
        for (let c = 0; c <= range.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]
          if (cell?.v) colMap[String(cell.v).toLowerCase().trim()] = c
        }

        const denCol = colMap['den']
        const halaCol = colMap['hala']
        const kat1Col = colMap['kategorie']
        const kat2Col = colMap['kategorie2']
        const odCol   = colMap['od']
        const doCol   = colMap['do']

        if (denCol == null || halaCol == null || kat1Col == null || odCol == null || doCol == null) {
          throw new Error('Soubor neobsahuje očekávané sloupce (DEN, HALA, KATEGORIE, OD, DO).')
        }

        const trainings = []
        const unknownHalls = {}
        let skipped = 0

        for (let r = 1; r <= range.e.r; r++) {
          const denText = getCellText(ws, r, denCol)
          if (!denText) continue

          const dayOfWeek = DAY_MAP[denText.toUpperCase()]
          if (dayOfWeek === undefined) continue

          const kat1Text = getCellText(ws, r, kat1Col)
          const team1 = findTeam(kat1Text, teams)
          if (!team1) { skipped++; continue }

          const kat2Text = kat2Col != null ? getCellText(ws, r, kat2Col) : null
          const team2 = findTeam(kat2Text, teams)

          const odCell = ws[XLSX.utils.encode_cell({ r, c: odCol })]
          const doCell = ws[XLSX.utils.encode_cell({ r, c: doCol })]
          const startMinute = parseCellTime(odCell)
          const endMinute   = parseCellTime(doCell)
          if (startMinute == null || endMinute == null || endMinute <= startMinute) { skipped++; continue }

          const halaText = getCellText(ws, r, halaCol)
          const hall = findHall(halaText, halls)

          if (!hall) {
            // Hall unknown but team is valid — collect for mapping dialog
            const key = halaText || '?'
            if (!unknownHalls[key]) unknownHalls[key] = []
            unknownHalls[key].push({
              dayOfWeek,
              startMinute,
              endMinute,
              teamIds: [team1.id, ...(team2 ? [team2.id] : [])],
              note: '',
            })
            continue
          }

          trainings.push({
            teamIds: [team1.id, ...(team2 ? [team2.id] : [])],
            hallId: hall.id,
            dayOfWeek,
            startMinute,
            endMinute,
            note: '',
          })
        }

        resolve({ trainings, skipped, unknownHalls })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
