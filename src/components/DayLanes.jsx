import { useStore } from '../context/StoreContext.jsx'
import { PLAYER_IDS, DAY } from '../utils/constants.js'
import { ACTIVITY_TYPES, dayRange, laneSegments } from '../utils/schedule.js'
import { formatDayLabel, formatTime } from '../utils/time.js'
import { playerName } from '../utils/settings.js'

const TICKS = ['00', '06', '12', '18', '24']

/** Two-lane 24h strips (one lane per player) giving the whole marathon at a glance. */
export default function DayLanes({ shifts, now }) {
  const { settings } = useStore()
  const days = dayRange(shifts)
  if (!days.length) return null

  return (
    <div className="lanes" aria-hidden="true">
      {days.map((dayStart) => {
        const nowPct = now >= dayStart && now < dayStart + DAY ? ((now - dayStart) / DAY) * 100 : null
        return (
          <div className="lanes__day" key={dayStart}>
            <p className="lanes__label">{formatDayLabel(dayStart)}</p>
            <div className="lanes__grid">
              {PLAYER_IDS.map((player) => (
                <div className="lanes__row" key={player}>
                  <span className={`lanes__name lanes__name--${player}`}>{playerName(player, settings)}</span>
                  <div className="lanes__track">
                    {laneSegments(shifts, dayStart, player).map(({ id, shift, left, width }) => (
                      <span
                        key={id}
                        className={`lanes__seg lanes__seg--${player} lanes__seg--${ACTIVITY_TYPES[shift.type].rest ? 'rest' : shift.type}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${settings.streamerMode ? ACTIVITY_TYPES[shift.type].label : shift.title || ACTIVITY_TYPES[shift.type].label} · ${formatTime(shift.start)} to ${formatTime(shift.end)}`}
                      />
                    ))}
                    {nowPct !== null && <span className="lanes__now" style={{ left: `${nowPct}%` }} />}
                  </div>
                </div>
              ))}
              <div className="lanes__ticks">
                {TICKS.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
