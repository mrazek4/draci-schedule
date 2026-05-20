import { createContext, useContext, useCallback, useEffect } from 'react'
import { useServerStorage } from '../hooks/useServerStorage.js'
import { defaultState, defaultHallAvailabilities } from '../data/defaults.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState, isLoading] = useServerStorage('draci-schedule-v7', defaultState)

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
        teams: next.teams.map((t) => {
          if (t.id === 'mz-ric' && t.shortName !== 'MLŘ') return { ...t, shortName: 'MLŘ' }
          if (t.id === 'mz-cer' && t.shortName !== 'MLČ') return { ...t, shortName: 'MLČ' }
          return t
        }),
      }

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
  }, [])

  // Computed: current season's data
  const trainings          = state.trainingsBySeason?.[state.currentSeasonId] ?? []
  const hallAvailabilities = state.availabilitiesBySeason?.[state.currentSeasonId] ?? []

  // --- Trainings ---
  const addTraining = useCallback((training) => {
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

  const moveTraining = useCallback((trainingId, dayOfWeek, hallId, startMinute) => {
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

  const updateTraining = useCallback((trainingId, patch) => {
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

  const deleteTraining = useCallback((trainingId) => {
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
  const addHall = useCallback((hall) => {
    setState((s) => ({ ...s, halls: [...s.halls, { id: crypto.randomUUID(), ...hall }] }))
  }, [setState])

  const updateHall = useCallback((hallId, patch) => {
    setState((s) => ({
      ...s,
      halls: s.halls.map((h) => (h.id === hallId ? { ...h, ...patch } : h)),
    }))
  }, [setState])

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
  const setHallAvailabilities = useCallback((hallId, availabilities) => {
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

  // --- Teams ---
  const addTeam = useCallback((team) => {
    setState((s) => ({ ...s, teams: [...s.teams, { ...team, id: crypto.randomUUID() }] }))
  }, [setState])

  const updateTeam = useCallback((teamId, patch) => {
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)),
    }))
  }, [setState])

  const deleteTeam = useCallback((teamId) => {
    setState((s) => {
      const filterTs = (ts) => ts.filter((t) =>
        t.teamIds ? !t.teamIds.includes(teamId) : t.teamId !== teamId
      )
      return {
        ...s,
        teams: s.teams.filter((t) => t.id !== teamId),
        trainingsBySeason: Object.fromEntries(
          Object.entries(s.trainingsBySeason ?? {}).map(([id, ts]) => [id, filterTs(ts)])
        ),
      }
    })
  }, [setState])

  // --- Seasons ---
  const addSeason = useCallback((name) => {
    const id = crypto.randomUUID().slice(0, 8)
    setState((s) => {
      const curAvails = s.availabilitiesBySeason?.[s.currentSeasonId] ?? []
      return {
        ...s,
        seasons: [...(s.seasons ?? []), { id, name }],
        currentSeasonId: id,
        trainingsBySeason: { ...(s.trainingsBySeason ?? {}), [id]: [] },
        availabilitiesBySeason: {
          ...(s.availabilitiesBySeason ?? {}),
          [id]: curAvails.map((a) => ({ ...a, id: crypto.randomUUID() })),
        },
      }
    })
  }, [setState])

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

  const setCurrentSeason = useCallback((id) => {
    setState((s) => ({ ...s, currentSeasonId: id }))
  }, [setState])

  const setTrainingsForSeason = useCallback((seasonId, newTrainings) => {
    setState((s) => ({
      ...s,
      trainingsBySeason: { ...(s.trainingsBySeason ?? {}), [seasonId]: newTrainings },
    }))
  }, [setState])

  // Import: replaces trainings AND sets availability for that season from the data
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
  const setUserRole = useCallback((email, role) => {
    setState((s) => ({ ...s, userRoles: { ...(s.userRoles ?? {}), [email]: role } }))
  }, [setState])

  const removeUserRole = useCallback((email) => {
    setState((s) => {
      const { [email]: _, ...rest } = s.userRoles ?? {}
      return { ...s, userRoles: rest }
    })
  }, [setState])

  // --- Week navigation ---
  const setWeekOffset = useCallback((offset) => update({ weekOffset: offset }), [update])

  const value = {
    ...state,
    trainings,
    hallAvailabilities,
    isLoading,
    addTraining, moveTraining, updateTraining, deleteTraining,
    addHall, updateHall, deleteHall, setHallAvailabilities,
    addTeam, updateTeam, deleteTeam,
    addSeason, deleteSeason, setCurrentSeason, setTrainingsForSeason, importTrainings,
    setUserRole, removeUserRole,
    setWeekOffset,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
