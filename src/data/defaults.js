export const defaultHalls = [
  { id: 'gymnazium',    name: 'Gymnázium',    color: '#4f6ef7' },
  { id: 'cercany',      name: 'Čerčany',      color: '#10b981' },
  { id: 'fialka',       name: 'Fialka',       color: '#ec4899' },
  { id: 'mestska-hala', name: 'Městská hala', color: '#f59e0b' },
  { id: 'pet-zs',       name: '5.ZŠ',         color: '#8b5cf6' },
]

export const defaultHallAvailabilities = [
  // Gymnázium: Po 17:00–21:30, Út 17:00–21:30, Čt 17:00–21:30
  { id: 'av-gym-0', hallId: 'gymnazium', dayOfWeek: 0, startMinute: 1020, endMinute: 1290 },
  { id: 'av-gym-1', hallId: 'gymnazium', dayOfWeek: 1, startMinute: 1020, endMinute: 1290 },
  { id: 'av-gym-3', hallId: 'gymnazium', dayOfWeek: 3, startMinute: 1020, endMinute: 1290 },
  // Čerčany: Út 16:30–19:30, St 18:00–19:30, Čt 17:45–19:15
  { id: 'av-cer-1', hallId: 'cercany', dayOfWeek: 1, startMinute:  990, endMinute: 1170 },
  { id: 'av-cer-2', hallId: 'cercany', dayOfWeek: 2, startMinute: 1080, endMinute: 1170 },
  { id: 'av-cer-3', hallId: 'cercany', dayOfWeek: 3, startMinute: 1065, endMinute: 1155 },
  // Fialka: Čt 18:00–19:30
  { id: 'av-fia-3', hallId: 'fialka',  dayOfWeek: 3, startMinute: 1080, endMinute: 1170 },
  // Městská hala: St 17:30–21:30
  { id: 'av-mh-2',  hallId: 'mestska-hala', dayOfWeek: 2, startMinute: 1050, endMinute: 1290 },
  // 5.ZŠ: Po 17:30–21:30, Út 19:00–20:00, St 17:00–21:30, Čt 19:00–21:30
  { id: 'av-5zs-0', hallId: 'pet-zs', dayOfWeek: 0, startMinute: 1050, endMinute: 1290 },
  { id: 'av-5zs-1', hallId: 'pet-zs', dayOfWeek: 1, startMinute: 1140, endMinute: 1200 },
  { id: 'av-5zs-2', hallId: 'pet-zs', dayOfWeek: 2, startMinute: 1020, endMinute: 1290 },
  { id: 'av-5zs-3', hallId: 'pet-zs', dayOfWeek: 3, startMinute: 1140, endMinute: 1290 },
]

export const defaultTeams = [
  { id: 'muzi-a',   name: 'Muži A',                shortName: 'MŽA', color: '#e53e3e' },
  { id: 'muzi-b',   name: 'Muži B',                shortName: 'MŽB', color: '#dd6b20' },
  { id: 'muzi-c',   name: 'Muži C',                shortName: 'MŽC', color: '#d69e2e' },
  { id: 'juniori',  name: 'Junioři',               shortName: 'JUN', color: '#38a169' },
  { id: 'dorost-a', name: 'Dorost A',              shortName: 'DOA', color: '#3182ce' },
  { id: 'dorost-b', name: 'Dorost B',              shortName: 'DOB', color: '#00b5d8' },
  { id: 'sz',       name: 'Starší žáci',           shortName: 'STŽ',  color: '#805ad5' },
  { id: 'sz-b',     name: 'Starší žáci B',         shortName: 'STŽB', color: '#b83280' },
  { id: 'mz-ric',   name: 'Mladší žáci Říčany',   shortName: 'MLŘ', color: '#2c7a7b' },
  { id: 'mz-cer',   name: 'Mladší žáci Čerčany',  shortName: 'MLČ', color: '#276749' },
  { id: 'el-ric',   name: 'Elévové Říčany',        shortName: 'ELŘ', color: '#c05621' },
  { id: 'el-cer',   name: 'Elévové Čerčany',       shortName: 'ELČ', color: '#975a16' },
  { id: 'pr-cer',   name: 'Přípravka Čerčany',     shortName: 'PŘČ',  color: '#2b6cb0' },
  { id: 'pr-ric',   name: 'Přípravka Říčany',      shortName: 'PŘŘ',  color: '#553c9a' },
  { id: 'brankari', name: 'Brankáři',              shortName: 'BR',  color: '#4a5568' },
]

export const defaultTrainings = []

export const defaultState = {
  halls: defaultHalls,
  hallAvailabilities: defaultHallAvailabilities,
  teams: defaultTeams,
  trainings: defaultTrainings,
  weekOffset: 0,
}
