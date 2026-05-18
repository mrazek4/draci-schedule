export const defaultHalls = [
  { id: 'hala-ricany', name: 'Hala Říčany', color: '#4f6ef7' },
  { id: 'sokolovna', name: 'Sokolovna', color: '#8b5cf6' },
]

export const defaultHallAvailabilities = [
  // Hala Říčany: Po–Pá 15:00–22:00, So–Ne 09:00–20:00
  { id: 'av-1', hallId: 'hala-ricany', dayOfWeek: 0, startMinute: 900, endMinute: 1320 },
  { id: 'av-2', hallId: 'hala-ricany', dayOfWeek: 1, startMinute: 900, endMinute: 1320 },
  { id: 'av-3', hallId: 'hala-ricany', dayOfWeek: 2, startMinute: 900, endMinute: 1320 },
  { id: 'av-4', hallId: 'hala-ricany', dayOfWeek: 3, startMinute: 900, endMinute: 1320 },
  { id: 'av-5', hallId: 'hala-ricany', dayOfWeek: 4, startMinute: 900, endMinute: 1320 },
  { id: 'av-6', hallId: 'hala-ricany', dayOfWeek: 5, startMinute: 540, endMinute: 1200 },
  { id: 'av-7', hallId: 'hala-ricany', dayOfWeek: 6, startMinute: 540, endMinute: 1200 },
  // Sokolovna: Po–Pá 16:00–21:00
  { id: 'av-8', hallId: 'sokolovna', dayOfWeek: 0, startMinute: 960, endMinute: 1260 },
  { id: 'av-9', hallId: 'sokolovna', dayOfWeek: 1, startMinute: 960, endMinute: 1260 },
  { id: 'av-10', hallId: 'sokolovna', dayOfWeek: 2, startMinute: 960, endMinute: 1260 },
  { id: 'av-11', hallId: 'sokolovna', dayOfWeek: 3, startMinute: 960, endMinute: 1260 },
  { id: 'av-12', hallId: 'sokolovna', dayOfWeek: 4, startMinute: 960, endMinute: 1260 },
]

export const defaultTeams = [
  { id: 'u8',      name: 'U8',       shortName: 'U8',  color: '#f59e0b' },
  { id: 'u10',     name: 'U10',      shortName: 'U10', color: '#10b981' },
  { id: 'u12',     name: 'U12',      shortName: 'U12', color: '#ef4444' },
  { id: 'u14',     name: 'U14',      shortName: 'U14', color: '#3b82f6' },
  { id: 'u16',     name: 'U16',      shortName: 'U16', color: '#ec4899' },
  { id: 'dospeli', name: 'Dospělí',  shortName: 'DOS', color: '#f97316' },
]

export const defaultTrainings = [
  {
    id: 'tr-1',
    teamId: 'u10',
    hallId: 'hala-ricany',
    dayOfWeek: 0,
    startMinute: 960,
    endMinute: 1080,
    note: '',
  },
  {
    id: 'tr-2',
    teamId: 'u14',
    hallId: 'sokolovna',
    dayOfWeek: 2,
    startMinute: 1020,
    endMinute: 1140,
    note: '',
  },
]

export const defaultState = {
  halls: defaultHalls,
  hallAvailabilities: defaultHallAvailabilities,
  teams: defaultTeams,
  trainings: defaultTrainings,
  weekOffset: 0,
}
