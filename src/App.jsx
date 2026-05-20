import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'

import { AppProvider, useApp } from './context/AppContext.jsx'
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx'
import { useCanEdit } from './auth/useRole.js'
import LoginPage from './auth/LoginPage.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Sidebar from './components/sidebar/Sidebar.jsx'
import CalendarView from './components/calendar/CalendarView.jsx'
import TrainingModal from './components/modals/TrainingModal.jsx'
import TeamModal from './components/modals/TeamModal.jsx'
import HallModal from './components/modals/HallModal.jsx'
import UserModal from './components/modals/UserModal.jsx'
import { minutesToTime, SLOT_MINUTES } from './utils/timeUtils.js'
import { isWithinAvailability } from './utils/calendarUtils.js'

function AppInner() {
  const { teams, halls, hallAvailabilities, trainings, addTraining, moveTraining, isLoading } = useApp()

  const [activeItem, setActiveItem]         = useState(null)
  const [trainingModal, setTrainingModal]   = useState(null)
  const [showAddModal, setShowAddModal]     = useState(null)
  const [showTeamModal, setShowTeamModal]   = useState(false)
  const [showHallModal, setShowHallModal]   = useState(false)
  const [showUserModal, setShowUserModal]   = useState(false)
  const [toast, setToast]                   = useState(null)
  const [theme, setTheme]                   = useState(() => localStorage.getItem('theme') || 'light')
  const [hiddenTeamIds, setHiddenTeamIds]   = useState([])
  const canEdit = useCanEdit()

  function toggleTeamVisibility(teamId) {
    setHiddenTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() { setTheme((t) => (t === 'light' ? 'dark' : 'light')) }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragStart({ active }) {
    setActiveItem(active.data.current)
  }

  function handleDragEnd({ active, over }) {
    setActiveItem(null)
    if (!canEdit || !over) return

    const slot = over.data.current
    if (!slot?.available) return

    const drag = active.data.current

    if (drag.type === 'NEW_TRAINING') {
      const valid = isWithinAvailability(
        slot.hallId, slot.dayOfWeek,
        slot.startMinute, slot.startMinute + 60,
        hallAvailabilities
      )
      if (!valid) {
        const hall = halls.find((h) => h.id === slot.hallId)
        showToast(`Hala ${hall?.name ?? ''} v tento čas není dostupná`)
        return
      }
      addTraining({
        teamIds: [drag.teamId],
        hallId: slot.hallId,
        dayOfWeek: slot.dayOfWeek,
        startMinute: slot.startMinute,
        endMinute: slot.startMinute + 60,
      })
    }

    if (drag.type === 'MOVE_TRAINING') {
      const training = trainings.find((t) => t.id === drag.trainingId)
      if (!training) return
      const duration = training.endMinute - training.startMinute
      const valid = isWithinAvailability(
        slot.hallId, slot.dayOfWeek,
        slot.startMinute, slot.startMinute + duration,
        hallAvailabilities
      )
      if (!valid) {
        const hall = halls.find((h) => h.id === slot.hallId)
        showToast(`Hala ${hall?.name ?? ''} v tento čas není dostupná`)
        return
      }
      moveTraining(drag.trainingId, slot.dayOfWeek, slot.hallId, slot.startMinute)
    }
  }

  // Determine drag overlay content
  let overlayContent = null
  if (activeItem?.type === 'NEW_TRAINING') {
    const team = teams.find((t) => t.id === activeItem.teamId)
    if (team) {
      overlayContent = (
        <div className="drag-overlay-tile">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, display: 'inline-block' }} />
          {team.name}
        </div>
      )
    }
  }
  if (activeItem?.type === 'MOVE_TRAINING') {
    const training = trainings.find((t) => t.id === activeItem.trainingId)
    const team = training ? teams.find((t) => t.id === training.teamId) : null
    if (team && training) {
      overlayContent = (
        <div className="drag-overlay-block" style={{ background: team.color }}>
          {team.shortName} {minutesToTime(training.startMinute)}–{minutesToTime(training.endMinute)}
        </div>
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AppShell
        sidebar={
          <Sidebar
            onManageTeams={() => setShowTeamModal(true)}
            onManageHalls={() => setShowHallModal(true)}
            onManageUsers={() => setShowUserModal(true)}
            onAddTraining={() => setShowAddModal({})}
            theme={theme}
            onToggleTheme={toggleTheme}
            hiddenTeamIds={hiddenTeamIds}
            onToggleTeam={toggleTeamVisibility}
            onShowAll={() => setHiddenTeamIds([])}
            onHideAll={() => setHiddenTeamIds(teams.map((t) => t.id))}
          />
        }
      >
        <CalendarView onTrainingClick={setTrainingModal} onSlotClick={canEdit ? (prefill) => setShowAddModal(prefill) : null} hiddenTeamIds={hiddenTeamIds} />
      </AppShell>

      <DragOverlay>{overlayContent}</DragOverlay>
      {isLoading && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--color-bg)', zIndex: 100 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Načítám data…</p>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}

      {showAddModal !== null && <TrainingModal prefill={showAddModal} onClose={() => setShowAddModal(null)} />}
      {trainingModal  && <TrainingModal training={trainingModal} onClose={() => setTrainingModal(null)} onCopy={(prefill) => { setTrainingModal(null); setShowAddModal(prefill) }} />}
      {showTeamModal  && <TeamModal onClose={() => setShowTeamModal(false)} />}
      {showHallModal  && <HallModal onClose={() => setShowHallModal(false)} />}
      {showUserModal  && <UserModal onClose={() => setShowUserModal(false)} />}
    </DndContext>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1F5E' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Přihlašuji…</p>
    </div>
  )

  if (!user) return <LoginPage />

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
