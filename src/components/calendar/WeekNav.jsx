import { useApp } from '../../context/AppContext.jsx'
import { formatWeekRange } from '../../utils/timeUtils.js'

export default function WeekNav() {
  const { weekOffset, setWeekOffset } = useApp()

  return (
    <div className="week-nav">
      <button className="week-nav__btn" onClick={() => setWeekOffset(weekOffset - 1)}>← Předchozí</button>
      <button className="week-nav__today" onClick={() => setWeekOffset(0)}>Tento týden</button>
      <button className="week-nav__btn" onClick={() => setWeekOffset(weekOffset + 1)}>Další →</button>
      <span className="week-nav__label">{formatWeekRange(weekOffset)}</span>
    </div>
  )
}
