import CalendarGrid from './CalendarGrid.jsx'
import TeamCalendarGrid from './TeamCalendarGrid.jsx'

export default function CalendarView({ onTrainingClick, onSlotClick, hiddenTeamIds, perspective }) {
  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <div>
          <div className="calendar-header__title">Rozvrh tréninků</div>
          <div className="calendar-header__sub">FBC Draci Říčany</div>
        </div>
      </div>
      {perspective === 'halls'
        ? <TeamCalendarGrid onTrainingClick={onTrainingClick} onSlotClick={onSlotClick} />
        : <CalendarGrid onTrainingClick={onTrainingClick} onSlotClick={onSlotClick} hiddenTeamIds={hiddenTeamIds} />
      }
    </div>
  )
}
