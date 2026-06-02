import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { useServerStorage } from '../hooks/useServerStorage.js'
import { defaultState, defaultHallAvailabilities } from '../data/defaults.js'

const AppContext = createContext(null)

const getSnapshot = (s) => ({
  trainingsBySeason: s.trainingsBySeason,
  campActivities: s.campActivities,
  teamsBySeason: s.teamsBySeason,
  availabilitiesBySeason: s.availabilitiesBySeason,
  halls: s.halls,
})

// Provider: spravuje veškerý stav aplikace a zpřístupňuje ho přes context
export function AppProvider({ children }) {
  const [state, setState, isLoading] = useServerStorage('draci-schedule-v7', defaultState)

  const stateRef   = useRef(state)
  const historyRef = useRef([])
  const redoRef    = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => { stateRef.current = state }, [state])

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-29), getSnapshot(stateRef.current)]
    redoRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (!historyRef.current.length) return
    const prev = historyRef.current[historyRef.current.length - 1]
    redoRef.current = [...redoRef.current, getSnapshot(stateRef.current)]
    historyRef.current = historyRef.current.slice(0, -1)
    setState(s => ({ ...s, ...prev }))
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(true)
  }, [setState])

  const redo = useCallback(() => {
    if (!redoRef.current.length) return
    const next = redoRef.current[redoRef.current.length - 1]
    historyRef.current = [...historyRef.current, getSnapshot(stateRef.current)]
    redoRef.current = redoRef.current.slice(0, -1)
    setState(s => ({ ...s, ...next }))
    setCanUndo(true)
    setCanRedo(redoRef.current.length > 0)
  }, [setState])

  // Aplikuje částečný patch na state (spread merge)
  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch })), [setState])

  useEffect(() => {
    setState((s) => {
      let next = s

      // v6 → v7: flat trainings[] → trainingsBySeason
      if (s.trainings !== undefined && s.trainingsBySeason === undefined) {
        const seasonId = '2025-2026'
        const { trainings, ...rest } = next
        next = {
          ...rest,
          seasons: [{ id: seasonId, name: '2025/2026' }],
          currentSeasonId: seasonId,
          trainingsBySeason: { [seasonId]: trainings || [] },
        }
      }

      // Backfill hall codes
      const HALL_CODES = { gymnazium: 'GYRI', cercany: 'CER', fialka: 'FIA', 'mestska-hala': 'MSH', 'pet-zs': '5ZS' }
      next = {
        ...next,
        halls: next.halls.map((h) => h.code ? h : { ...h, code: HALL_CODES[h.id] ?? '' }),
        ...(next.teams ? { teams: next.teams.map((t) => {
          if (t.id === 'mz-ric' && t.shortName !== 'MLŘ') return { ...t, shortName: 'MLŘ' }
          if (t.id === 'mz-cer' && t.shortName !== 'MLČ') return { ...t, shortName: 'MLČ' }
          return t
        }) } : {}),
      }

      // Migrate flat teams[] → teamsBySeason
      if (next.teamsBySeason === undefined) {
        const globalTeams = next.teams ?? defaultState.teamsBySeason[defaultState.currentSeasonId]
        const teamsBySeason = Object.fromEntries(
          (next.seasons ?? []).map((se) => [se.id, globalTeams])
        )
        const { teams: _t, ...restNoTeams } = next
        next = { ...restNoTeams, teamsBySeason }
      }

      // Migrate missing camps
      if (next.camps === undefined) next = { ...next, camps: [], campActivities: {} }

      // Migrate missing camp activity templates
      if (next.campActivityTemplates === undefined)
        next = { ...next, campActivityTemplates: defaultState.campActivityTemplates }

      // Migrate missing userRoles + bootstrap admin from env var
      if (next.userRoles === undefined) {
        next = { ...next, userRoles: defaultState.userRoles }
      } else {
        const bootstrapEntries = Object.entries(defaultState.userRoles ?? {})
        for (const [email, role] of bootstrapEntries) {
          if (!(next.userRoles ?? {})[email]) {
            next = { ...next, userRoles: { ...(next.userRoles ?? {}), [email]: role } }
          }
        }
      }

      // Migrate flat hallAvailabilities → availabilitiesBySeason
      if (next.hallAvailabilities !== undefined && next.availabilitiesBySeason === undefined) {
        const src = Array.isArray(next.hallAvailabilities) ? next.hallAvailabilities : defaultHallAvailabilities
        const availabilitiesBySeason = Object.fromEntries(
          (next.seasons ?? []).map((se) => [
            se.id,
            src.map((a) => ({ ...a, id: crypto.randomUUID() })),
          ])
        )
        const { hallAvailabilities, hallAvailReset1, ...rest } = next
        next = { ...rest, availabilitiesBySeason }
      }

      return next
    })
  }, [isLoading])

  // Computed: current season's data
  const trainings          = state.trainingsBySeason?.[state.currentSeasonId] ?? []
  const hallAvailabilities = state.availabilitiesBySeason?.[state.currentSeasonId] ?? []
  const teams              = state.teamsBySeason?.[state.currentSeasonId] ?? state.teams ?? []

  // --- Trainings ---
  // Přidá nový trénink do aktuální sezóny
  const addTraining = useCallback((training) => {
    pushHistory()
    setState((s) => {
      const cur = s.trainingsBySeason?.[s.currentSeasonId] ?? []
      return {
        ...s,
        trainingsBySeason: {
          ...s.trainingsBySeason,
          [s.currentSeasonId]: [...cur, { id: crypto.randomUUID(), note: '', ...training }],
        },
      }
    })
  }, [setState])

  // Přesune trénink na jiný den, halu nebo čas; zachová původní délku
  const moveTraining = useCallback((trainingId, dayOfWeek, hallId, startMinute) => {
    pushHistory()
    setState((s) => {
      const cur = s.trainingsBySeason?.[s.currentSeasonId] ?? []
      return {
        ...s,
        trainingsBySeason: {
          ...s.trainingsBySeason,
          [s.currentSeasonId]: cur.map((t) => {
            if (t.id !== trainingId) return t
            const duration = t.endMinute - t.startMinute
            return { ...t, dayOfWeek, hallId, startMinute, endMinute: startMinute + duration }
          }),
        },
      }
    })
  }, [setState])

  // Aktualizuje vybrané vlastnosti tréninku
  const updateTraining = useCallback((trainingId, patch) => {
    pushHistory()
    setState((s) => {
      const cur = s.trainingsBySeason?.[s.currentSeasonId] ?? []
      return {
        ...s,
        trainingsBySeason: {
          ...s.trainingsBySeason,
          [s.currentSeasonId]: cur.map((t) => (t.id === trainingId ? { ...t, ...patch } : t)),
        },
      }
    })
  }, [setState])

  // Odstraní trénink podle ID
  const deleteTraining = useCallback((trainingId) => {
    pushHistory()
    setState((s) => {
      const cur = s.trainingsBySeason?.[s.currentSeasonId] ?? []
      return {
        ...s,
        trainingsBySeason: {
          ...s.trainingsBySeason,
          [s.currentSeasonId]: cur.filter((t) => t.id !== trainingId),
        },
      }
    })
  }, [setState])

  // --- Halls ---
  // Přidá novou halu
  const addHall = useCallback((hall) => {
    setState((s) => ({ ...s, halls: [...s.halls, { id: crypto.randomUUID(), ...hall }] }))
  }, [setState])

  // Aktualizuje vlastnosti haly
  const updateHall = useCallback((hallId, patch) => {
    setState((s) => ({
      ...s,
      halls: s.halls.map((h) => (h.id === hallId ? { ...h, ...patch } : h)),
    }))
  }, [setState])

  // Odstraní halu včetně jejích tréninků a dostupností ve všech sezónách
  const deleteHall = useCallback((hallId) => {
    setState((s) => {
      const filterTs = (ts) => ts.filter((t) => t.hallId !== hallId)
      const filterAvs = (avs) => (avs ?? []).filter((a) => a.hallId !== hallId)
      return {
        ...s,
        halls: s.halls.filter((h) => h.id !== hallId),
        trainingsBySeason: Object.fromEntries(
          Object.entries(s.trainingsBySeason ?? {}).map(([id, ts]) => [id, filterTs(ts)])
        ),
        availabilitiesBySeason: Object.fromEntries(
          Object.entries(s.availabilitiesBySeason ?? {}).map(([id, avs]) => [id, filterAvs(avs)])
        ),
      }
    })
  }, [setState])

  // --- Hall availabilities (scoped to current season) ---
  // Nastaví dostupnosti haly pro aktuální sezónu (přepíše stávající)
  const setHallAvailabilities = useCallback((hallId, availabilities) => {
    pushHistory()
    setState((s) => {
      const cur = s.availabilitiesBySeason?.[s.currentSeasonId] ?? []
      return {
        ...s,
        availabilitiesBySeason: {
          ...(s.availabilitiesBySeason ?? {}),
          [s.currentSeasonId]: [
            ...cur.filter((a) => a.hallId !== hallId),
            ...availabilities.map((a) => ({ ...a, hallId, id: a.id || crypto.randomUUID() })),
          ],
        },
      }
    })
  }, [setState])

  // --- Teams (per-season) ---
  // Přidá nový tým do aktuální sezóny
  const addTeam = useCallback((team) => {
    pushHistory()
    setState((s) => {
      const cur = s.teamsBySeason?.[s.currentSeasonId] ?? []
      return { ...s, teamsBySeason: { ...(s.teamsBySeason ?? {}), [s.currentSeasonId]: [...cur, { ...team, id: crypto.randomUUID() }] } }
    })
  }, [setState])

  // Aktualizuje vlastnosti týmu v aktuální sezóně
  const updateTeam = useCallback((teamId, patch) => {
    pushHistory()
    setState((s) => {
      const cur = s.teamsBySeason?.[s.currentSeasonId] ?? []
      return { ...s, teamsBySeason: { ...(s.teamsBySeason ?? {}), [s.currentSeasonId]: cur.map((t) => (t.id === teamId ? { ...t, ...patch } : t)) } }
    })
  }, [setState])

  // Odstraní tým a jeho tréninky z aktuální sezóny
  const deleteTeam = useCallback((teamId) => {
    pushHistory()
    setState((s) => {
      const cur   = s.teamsBySeason?.[s.currentSeasonId] ?? []
      const curTs = s.trainingsBySeason?.[s.currentSeasonId] ?? []
      const filterTs = (ts) => ts.filter((t) => t.teamIds ? !t.teamIds.includes(teamId) : t.teamId !== teamId)
      return {
        ...s,
        teamsBySeason:     { ...(s.teamsBySeason     ?? {}), [s.currentSeasonId]: cur.filter((t) => t.id !== teamId) },
        trainingsBySeason: { ...(s.trainingsBySeason ?? {}), [s.currentSeasonId]: filterTs(curTs) },
      }
    })
  }, [setState])

  // --- Seasons ---
  // Vytvoří novou sezónu; volitelně zkopíruje dostupnosti hal a týmy z aktuální sezóny
  const addSeason = useCallback((name, { copyAvailabilities = true, copyTeams = true } = {}) => {
    const id = crypto.randomUUID().slice(0, 8)
    setState((s) => {
      const curAvails = copyAvailabilities ? (s.availabilitiesBySeason?.[s.currentSeasonId] ?? []) : []
      const curTeams  = copyTeams          ? (s.teamsBySeason?.[s.currentSeasonId]           ?? []) : []
      return {
        ...s,
        seasons: [...(s.seasons ?? []), { id, name }],
        currentSeasonId: id,
        trainingsBySeason:      { ...(s.trainingsBySeason      ?? {}), [id]: [] },
        availabilitiesBySeason: { ...(s.availabilitiesBySeason ?? {}), [id]: curAvails.map((a) => ({ ...a, id: crypto.randomUUID() })) },
        teamsBySeason:          { ...(s.teamsBySeason          ?? {}), [id]: curTeams.map((t) => ({ ...t })) },
      }
    })
  }, [setState])

  // Odstraní sezónu a přepne na první zbývající
  const deleteSeason = useCallback((seasonId) => {
    setState((s) => {
      const seasons = (s.seasons ?? []).filter((se) => se.id !== seasonId)
      if (seasons.length === 0) return s
      const { [seasonId]: _rt, ...trainingsRest } = s.trainingsBySeason ?? {}
      const { [seasonId]: _ra, ...availsRest    } = s.availabilitiesBySeason ?? {}
      const currentSeasonId = s.currentSeasonId === seasonId ? seasons[0].id : s.currentSeasonId
      return { ...s, seasons, currentSeasonId, trainingsBySeason: trainingsRest, availabilitiesBySeason: availsRest }
    })
  }, [setState])

  // Přepne aktivní sezónu
  const setCurrentSeason = useCallback((id) => {
    setState((s) => ({ ...s, currentSeasonId: id }))
  }, [setState])

  // Nahradí tréninky v dané sezóně novým polem
  const setTrainingsForSeason = useCallback((seasonId, newTrainings) => {
    setState((s) => ({
      ...s,
      trainingsBySeason: { ...(s.trainingsBySeason ?? {}), [seasonId]: newTrainings },
    }))
  }, [setState])

  // Importuje tréninky a automaticky odvodí dostupnosti hal z časových rozsahů tréninků
  const importTrainings = useCallback((seasonId, newTrainings) => {
    setState((s) => {
      const byHall = {}
      for (const t of newTrainings) {
        if (!byHall[t.hallId]) byHall[t.hallId] = {}
        const d = t.dayOfWeek
        if (!byHall[t.hallId][d]) byHall[t.hallId][d] = { start: t.startMinute, end: t.endMinute }
        else {
          byHall[t.hallId][d].start = Math.min(byHall[t.hallId][d].start, t.startMinute)
          byHall[t.hallId][d].end   = Math.max(byHall[t.hallId][d].end,   t.endMinute)
        }
      }
      const newAvails = []
      for (const [hallId, days] of Object.entries(byHall)) {
        for (const [day, { start, end }] of Object.entries(days)) {
          newAvails.push({ id: crypto.randomUUID(), hallId, dayOfWeek: parseInt(day), startMinute: start, endMinute: end })
        }
      }
      return {
        ...s,
        trainingsBySeason: { ...(s.trainingsBySeason ?? {}), [seasonId]: newTrainings },
        availabilitiesBySeason: { ...(s.availabilitiesBySeason ?? {}), [seasonId]: newAvails },
      }
    })
  }, [setState])

  // --- User roles ---
  // Nastaví roli uživatele (admin / vybor)
  const setUserRole = useCallback((email, role) => {
    setState((s) => ({ ...s, userRoles: { ...(s.userRoles ?? {}), [email]: role } }))
  }, [setState])

  // Odebere roli uživatele
  const removeUserRole = useCallback((email) => {
    setState((s) => {
      const { [email]: _, ...rest } = s.userRoles ?? {}
      return { ...s, userRoles: rest }
    })
  }, [setState])

  // --- Camps ---
  // Přidá nové soustředění
  const addCamp = useCallback((camp) => {
    setState((s) => ({
      ...s,
      camps: [...(s.camps ?? []), { id: crypto.randomUUID().slice(0, 8), ...camp }],
    }))
  }, [setState])

  // Aktualizuje vlastnosti soustředění
  const updateCamp = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      camps: (s.camps ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }, [setState])

  // Odstraní soustředění včetně všech jeho aktivit
  const deleteCamp = useCallback((id) => {
    setState((s) => {
      const { [id]: _deleted, ...restActivities } = s.campActivities ?? {}
      return {
        ...s,
        camps: (s.camps ?? []).filter((c) => c.id !== id),
        campActivities: restActivities,
      }
    })
  }, [setState])

  // Přidá aktivitu do programu daného dne soustředění
  const addCampActivity = useCallback((campId, dateStr, activity) => {
    pushHistory()
    setState((s) => {
      const all  = s.campActivities ?? {}
      const days = all[campId] ?? {}
      const list = days[dateStr] ?? []
      return {
        ...s,
        campActivities: { ...all, [campId]: { ...days, [dateStr]: [...list, { id: crypto.randomUUID(), ...activity }] } },
      }
    })
  }, [setState])

  // Aktualizuje aktivitu v programu soustředění
  const updateCampActivity = useCallback((campId, dateStr, activityId, patch) => {
    pushHistory()
    setState((s) => {
      const all  = s.campActivities ?? {}
      const days = all[campId] ?? {}
      const list = days[dateStr] ?? []
      return {
        ...s,
        campActivities: { ...all, [campId]: { ...days, [dateStr]: list.map((a) => (a.id === activityId ? { ...a, ...patch } : a)) } },
      }
    })
  }, [setState])

  // Odstraní aktivitu z programu soustředění
  const deleteCampActivity = useCallback((campId, dateStr, activityId) => {
    pushHistory()
    setState((s) => {
      const all  = s.campActivities ?? {}
      const days = all[campId] ?? {}
      const list = days[dateStr] ?? []
      return {
        ...s,
        campActivities: { ...all, [campId]: { ...days, [dateStr]: list.filter((a) => a.id !== activityId) } },
      }
    })
  }, [setState])

  // --- Camp activity templates ---
  // Přidá novou šablonu aktivity soustředění
  const addCampActivityTemplate = useCallback((tpl) => {
    setState((s) => ({
      ...s,
      campActivityTemplates: [...(s.campActivityTemplates ?? []), { id: crypto.randomUUID().slice(0, 8), ...tpl }],
    }))
  }, [setState])

  // Aktualizuje šablonu aktivity soustředění
  const updateCampActivityTemplate = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      campActivityTemplates: (s.campActivityTemplates ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [setState])

  // Odstraní šablonu aktivity soustředění
  const deleteCampActivityTemplate = useCallback((id) => {
    setState((s) => ({
      ...s,
      campActivityTemplates: (s.campActivityTemplates ?? []).filter((t) => t.id !== id),
    }))
  }, [setState])

  // --- Week navigation ---
  // Nastaví offset týdne v kalendáři (0 = aktuální týden)
  const setWeekOffset = useCallback((offset) => update({ weekOffset: offset }), [update])

  const value = {
    ...state,
    trainings,
    hallAvailabilities,
    teams,
    isLoading,
    undo, redo, canUndo, canRedo,
    addTraining, moveTraining, updateTraining, deleteTraining,
    addHall, updateHall, deleteHall, setHallAvailabilities,
    addTeam, updateTeam, deleteTeam,
    addSeason, deleteSeason, setCurrentSeason, setTrainingsForSeason, importTrainings,
    setUserRole, removeUserRole,
    addCamp, updateCamp, deleteCamp, addCampActivity, updateCampActivity, deleteCampActivity,
    addCampActivityTemplate, updateCampActivityTemplate, deleteCampActivityTemplate,
    setWeekOffset,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Hook pro přístup k AppContext; vyhodí chybu pokud je použit mimo AppProvider
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
