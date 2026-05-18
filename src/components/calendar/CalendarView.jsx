import CalendarGrid from './CalendarGrid.jsx'

export default function CalendarView({ onTrainingClick, onSlotClick, hiddenTeamIds }) {
  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <div>
          <div className="calendar-header__title">Rozvrh tréninků</div>
          <div className="calendar-header__sub">FBC Draci Říčany</div>
        </div>
        <span className="calendar-header__badge">Admin plánování</span>
      </div>
      <CalendarGrid onTrainingClick={onTrainingClick} onSlotClick={onSlotClick} hiddenTeamIds={hiddenTeamIds} />
    </div>
  )
}
