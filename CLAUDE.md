# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Architecture

Single-page React 18 + Vite app. No router. State persists to `localStorage` under key `draci-schedule-v6`.

### State (`src/context/AppContext.jsx`)
Central context wraps all data and CRUD actions. `useLocalStorage` hook auto-syncs to localStorage. Components call `useApp()` to access state and actions. Never write to localStorage directly.

### Data model
- **Hall** `{ id, name, color }` – physical sports hall
- **HallAvailability** `{ id, hallId, dayOfWeek, startMinute, endMinute }` – recurring weekly availability windows; time in minutes from midnight (e.g. 900 = 15:00)
- **Team** `{ id, name, shortName, color }` – age group / team
- **Training** `{ id, teamId, hallId, dayOfWeek, startMinute, endMinute, note }` – weekly recurring (no specific date); `dayOfWeek`: 0=Mon … 6=Sun

### Calendar grid (`src/components/calendar/CalendarGrid.jsx`)
CSS Grid with axes: Time (Y) × Day (X) × Hall (sub-column per day).
- Column formula: `getGridColumn(dayIndex, hallIndex, nHalls)` → `2 + dayIndex * nHalls + hallIndex`
- Row formula: `getGridRow(startMinute)` → `3 + (startMinute - 480) / 30` (08:00 start, 30-min slots)
- `TrainingBlock` uses inline `grid-column` + `grid-row` styles (not absolute pixel positioning)

### Drag & drop (`@dnd-kit/core`)
Both drag operations share one `<DndContext>` in `App.jsx`:
- **Create**: `TeamTile` (sidebar) → `TimeSlot` cell; drops call `addTraining`, default 60 min
- **Move**: `TrainingBlock` → `TimeSlot`; drops call `moveTraining`, preserves duration
- `active.data.current.type` distinguishes `'NEW_TRAINING'` vs `'MOVE_TRAINING'`
- Drops rejected if target cell is outside hall availability

### Key files
| File | Role |
|------|------|
| `src/context/AppContext.jsx` | All state + actions |
| `src/components/calendar/CalendarGrid.jsx` | CSS Grid master, renders slots + training blocks |
| `src/components/calendar/TimeSlot.jsx` | `useDroppable` drop target |
| `src/components/sidebar/TeamTile.jsx` | `useDraggable` drag source (new training) |
| `src/components/calendar/TrainingBlock.jsx` | `useDraggable` drag source (move training) |
| `src/utils/timeUtils.js` | `minutesToTime`, `getWeekDays`, slot helpers |
| `src/utils/calendarUtils.js` | Grid position math, availability check, conflict check |
| `src/data/defaults.js` | Seed data loaded on first run |
