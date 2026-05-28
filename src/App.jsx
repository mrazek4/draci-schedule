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
import CampView from './components/camp/CampView.jsx'
import TrainingModal from './components/modals/TrainingModal.jsx'
import TeamModal from './components/modals/TeamModal.jsx'
import HallModal from './components/modals/HallModal.jsx'
import UserModal from './components/modals/UserModal.jsx'
import CampModal from './components/modals/CampModal.jsx'
import CampActivityModal from './components/modals/CampActivityModal.jsx'
import CampActivityTemplatesModal from './components/modals/CampActivityTemplatesModal.jsx'
import { minutesToTime, SLOT_MINUTES } from './utils/timeUtils.js'
import { isWithinAvailability } from './utils/calendarUtils.js'

function AppInner() {
  const { teams, halls, hallAvailabilities, trainings, camps, campActivities, addTraining, moveTraining, updateCampActivity, isLoading } = useApp()

  const [activeItem, setActiveItem]               = useState(null)
  const [trainingModal, setTrainingModal]         = useState(null)
  const [showAddModal, setShowAddModal]           = useState(null)
  const [showTeamModal, setShowTeamModal]         = useState(false)
  const [showHallModal, setShowHallModal]         = useState(false)
  const [showUserModal, setShowUserModal]         = useState(false)
  const [toast, setToast]                         = useState(null)
  const [theme, setTheme]                         = useState(() => localStorage.getItem('theme') || 'light')
  const [hiddenTeamIds, setHiddenTeamIds]         = useState([])
  const [viewMode, setViewMode]                   = useState('schedule')
  const [perspective, setPerspective]             = useState('teams')
  const [currentCampId, setCurrentCampId]         = useState(null)
  const [currentCampDate, setCurrentCampDate]     = useState(null)
  const [showCampModal, setShowCampModal]               = useState(null)
  const [campActivityModal, setCampActivityModal]       = useState(null)
  const [showCampTemplatesModal, setShowCampTemplatesModal] = useState(false)
  const canEdit = useCanEdit()

  const activeCamp = camps?.find((c) => c.id === currentCampId)
  const campTeams  = activeCamp ? teams.filter((t) => activeCamp.teamIds?.includes(t.id)) : []

  function switchToView(mode) {
    setViewMode(mode)
    if (mode === 'camp' && !currentCampId && camps?.length > 0) {
      setCurrentCampId(camps[0].id)
    }
  }

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
      if (!slot.hallId) return  // team-row slots don't accept team tiles
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
      if (!slot.hallId) return  // team-row slots don't accept move
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

    if (drag.type === 'MOVE_CAMP_ACTIVITY') {
      if (!slot.teamId) return
      const activeDateStr = currentCampDate ?? activeCamp?.startDate
      const dayActivities = campActivities?.[currentCampId]?.[activeDateStr] ?? []
      const activity = dayActivities.find((a) => a.id === drag.activityId)
      if (!activity) return
      const duration = activity.endMinute - activity.startMinute
      updateCampActivity(currentCampId, activeDateStr, activity.id, {
        teamId: slot.teamId,
        startMinute: slot.startMinute,
        endMinute: slot.startMinute + duration,
      })
      return
    }

    if (drag.type === 'NEW_CAMP_ACTIVITY_FROM_TEMPLATE') {
      if (!slot.teamId) return
      setCampActivityModal({
        prefill: {
          teamId: slot.teamId,
          startMinute: slot.startMinute,
          templateLabel: drag.label,
          color: drag.color,
        },
      })
      return
    }

    if (drag.type === 'NEW_TRAINING_FROM_HALL') {
      const valid = isWithinAvailability(
        drag.hallId, slot.dayOfWeek,
        slot.startMinute, slot.startMinute + 60,
        hallAvailabilities
      )
      if (!valid) {
        const hall = halls.find((h) => h.id === drag.hallId)
        showToast(`Hala ${hall?.name ?? ''} v tento čas není dostupná`)
        return
      }
      setShowAddModal({
        hallId: drag.hallId,
        dayOfWeek: slot.dayOfWeek,
        startMinute: slot.startMinute,
        ...(slot.teamId ? { teamIds: [slot.teamId] } : {}),
      })
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
  if (activeItem?.type === 'NEW_CAMP_ACTIVITY_FROM_TEMPLATE') {
    overlayContent = (
      <div className="drag-overlay-tile">
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeItem.color ?? '#888', display: 'inline-block' }} />
        {activeItem.label}
      </div>
    )
  }
  if (activeItem?.type === 'MOVE_CAMP_ACTIVITY') {
    const dayActivities = campActivities?.[currentCampId]?.[currentCampDate ?? activeCamp?.startDate] ?? []
    const activity = dayActivities.find((a) => a.id === activeItem.activityId)
    if (activity) {
      const team = campTeams.find((t) => t.id === activity.teamId)
      const bg = activity.color || team?.color || '#4f6ef7'
      overlayContent = (
        <div className="camp-activity" style={{ background: bg, width: 120, opacity: 0.9 }}>
          <div className="camp-activity__label">{activity.label}</div>
          <div className="camp-activity__time">{minutesToTime(activity.startMinute)}–{minutesToTime(activity.endMinute)}</div>
        </div>
      )
    }
  }
  if (activeItem?.type === 'NEW_TRAINING_FROM_HALL') {
    const hall = halls.find((h) => h.id === activeItem.hallId)
    if (hall) {
      overlayContent = (
        <div className="drag-overlay-tile">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: hall.color, display: 'inline-block' }} />
          {hall.name}
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
            viewMode={viewMode}
            onSwitchView={switchToView}
            currentCampId={currentCampId}
            onSelectCamp={(id) => { setCurrentCampId(id); setCurrentCampDate(null) }}
            onAddCamp={() => setShowCampModal({})}
            onEditCamp={(camp) => setShowCampModal(camp)}
            onManageCampTemplates={() => setShowCampTemplatesModal(true)}
            listMode={perspective}
            onListModeChange={setPerspective}
          />
        }
      >
        {viewMode === 'schedule'
          ? <CalendarView onTrainingClick={setTrainingModal} onSlotClick={canEdit ? (prefill) => setShowAddModal(prefill) : null} hiddenTeamIds={hiddenTeamIds} perspective={perspective} />
          : <CampView
              campId={currentCampId}
              date={currentCampDate}
              onDateChange={setCurrentCampDate}
              onSlotClick={canEdit ? (prefill) => setCampActivityModal({ prefill }) : null}
              onActivityClick={(activity) => setCampActivityModal({ activity })}
              onBack={() => setViewMode('schedule')}
            />
        }
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
      {showCampModal !== null && (
        <CampModal
          camp={showCampModal?.id ? showCampModal : undefined}
          onClose={() => setShowCampModal(null)}
          onSaved={() => setShowCampModal(null)}
        />
      )}
      {showCampTemplatesModal && (
        <CampActivityTemplatesModal onClose={() => setShowCampTemplatesModal(false)} />
      )}
      {campActivityModal !== null && currentCampId && (currentCampDate ?? activeCamp?.startDate) && (
        <CampActivityModal
          activity={campActivityModal.activity}
          prefill={campActivityModal.prefill}
          campId={currentCampId}
          dateStr={currentCampDate ?? activeCamp?.startDate}
          campTeams={campTeams}
          onClose={() => setCampActivityModal(null)}
        />
      )}
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
