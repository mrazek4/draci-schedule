import WeekNav from './WeekNav.jsx'
import CalendarGrid from './CalendarGrid.jsx'

export default function CalendarView({ onTrainingClick }) {
  return (
    <div className="calendar-wrap">
      <WeekNav />
      <CalendarGrid onTrainingClick={onTrainingClick} />
    </div>
  )
}
