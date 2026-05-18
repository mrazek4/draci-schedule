import { createContext, useContext, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { defaultState } from '../data/defaults.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useLocalStorage('draci-schedule-v5', defaultState)

  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch })), [setState])

  // --- Trainings ---
  const addTraining = useCallback((training) => {
    setState((s) => ({
      ...s,
      trainings: [...s.trainings, { ...training, id: crypto.randomUUID(), note: '' }],
    }))
  }, [setState])

  const moveTraining = useCallback((trainingId, dayOfWeek, hallId, startMinute) => {
    setState((s) => ({
      ...s,
      trainings: s.trainings.map((t) => {
        if (t.id !== trainingId) return t
        const duration = t.endMinute - t.startMinute
        return { ...t, dayOfWeek, hallId, startMinute, endMinute: startMinute + duration }
      }),
    }))
  }, [setState])

  const updateTraining = useCallback((trainingId, patch) => {
    setState((s) => ({
      ...s,
      trainings: s.trainings.map((t) => (t.id === trainingId ? { ...t, ...patch } : t)),
    }))
  }, [setState])

  const deleteTraining = useCallback((trainingId) => {
    setState((s) => ({ ...s, trainings: s.trainings.filter((t) => t.id !== trainingId) }))
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
    setState((s) => ({
      ...s,
      halls: s.halls.filter((h) => h.id !== hallId),
      hallAvailabilities: s.hallAvailabilities.filter((a) => a.hallId !== hallId),
      trainings: s.trainings.filter((t) => t.hallId !== hallId),
    }))
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
    setState((s) => ({
      ...s,
      teams: s.teams.filter((t) => t.id !== teamId),
      trainings: s.trainings.filter((t) => t.teamId !== teamId),
    }))
  }, [setState])

  // --- Week navigation ---
  const setWeekOffset = useCallback((offset) => update({ weekOffset: offset }), [update])

  const value = {
    ...state,
    addTraining, moveTraining, updateTraining, deleteTraining,
    addHall, updateHall, deleteHall, setHallAvailabilities,
    addTeam, updateTeam, deleteTeam,
    setWeekOffset,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
