import { createContext, useContext, useCallback, useEffect } from 'react'
import { useServerStorage } from '../hooks/useServerStorage.js'
import { defaultState } from '../data/defaults.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState, isLoading] = useServerStorage('draci-schedule-v7', defaultState)

  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch })), [setState])

  // Migrate from v6 (trainings[] top-level) to v7 (trainingsBySeason), fix shortNames, add hall codes
  useEffect(() => {
    setState((s) => {
      let next = s

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

      const HALL_CODES = { gymnazium: 'GYRI', cercany: 'CER', fialka: 'FIA', 'mestska-hala': 'MSH', 'pet-zs': '5ZS' }
      return {
        ...next,
        halls: next.halls.map((h) => h.code ? h : { ...h, code: HALL_CODES[h.id] ?? '' }),
        teams: next.teams.map((t) => {
          if (t.id === 'mz-ric' && t.shortName !== 'MLŘ') return { ...t, shortName: 'MLŘ' }
          if (t.id === 'mz-cer' && t.shortName !== 'MLČ') return { ...t, shortName: 'MLČ' }
          return t
        }),
      }
    })
  }, [])

  // Computed: current season's trainings
  const trainings = state.trainingsBySeason?.[state.currentSeasonId] ?? []

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
    setState((s) => ({ ...s, halls: [...s.halls, { ...hall, id: crypto.randomUUID() }] }))
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
      const trainingsBySeason = Object.fromEntries(
        Object.entries(s.trainingsBySeason ?? {}).map(([id, ts]) => [id, filterTs(ts)])
      )
      return {
        ...s,
        halls: s.halls.filter((h) => h.id !== hallId),
        hallAvailabilities: s.hallAvailabilities.filter((a) => a.hallId !== hallId),
        trainingsBySeason,
      }
    })
  }, [setState])

  // --- Hall availabilities ---
  const setHallAvailabilities = useCallback((hallId, availabilities) => {
    setState((s) => ({
      ...s,
      hallAvailabilities: [
        ...s.hallAvailabilities.filter((a) => a.hallId !== hallId),
        ...availabilities.map((a) => ({ ...a, hallId, id: a.id || crypto.randomUUID() })),
      ],
    }))
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
      const trainingsBySeason = Object.fromEntries(
        Object.entries(s.trainingsBySeason ?? {}).map(([id, ts]) => [id, filterTs(ts)])
      )
      return { ...s, teams: s.teams.filter((t) => t.id !== teamId), trainingsBySeason }
    })
  }, [setState])

  // --- Seasons ---
  const addSeason = useCallback((name) => {
    const id = crypto.randomUUID().slice(0, 8)
    setState((s) => ({
      ...s,
      seasons: [...(s.seasons ?? []), { id, name }],
      currentSeasonId: id,
      trainingsBySeason: { ...(s.trainingsBySeason ?? {}), [id]: [] },
    }))
  }, [setState])

  const deleteSeason = useCallback((seasonId) => {
    setState((s) => {
      const seasons = (s.seasons ?? []).filter((se) => se.id !== seasonId)
      if (seasons.length === 0) return s
      const { [seasonId]: _removed, ...rest } = s.trainingsBySeason ?? {}
      const currentSeasonId = s.currentSeasonId === seasonId ? seasons[0].id : s.currentSeasonId
      return { ...s, seasons, currentSeasonId, trainingsBySeason: rest }
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

  // --- Week navigation ---
  const setWeekOffset = useCallback((offset) => update({ weekOffset: offset }), [update])

  const value = {
    ...state,
    trainings,
    isLoading,
    addTraining, moveTraining, updateTraining, deleteTraining,
    addHall, updateHall, deleteHall, setHallAvailabilities,
    addTeam, updateTeam, deleteTeam,
    addSeason, deleteSeason, setCurrentSeason, setTrainingsForSeason,
    setWeekOffset,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
