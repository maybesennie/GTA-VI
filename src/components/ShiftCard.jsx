import { AlertTriangle, Pencil, Trash2, Timer } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import PlayerBadge from './PlayerBadge.jsx'
import ProgressBar from './ProgressBar.jsx'
import { TYPE_ICONS } from './icons.js'
import { ACTIVITY_TYPES } from '../utils/schedule.js'
import { dayKey, formatDayLabel, formatDuration, formatTime } from '../utils/time.js'
import { playerName } from '../utils/settings.js'

export default function ShiftCard({ shift, now, hasConflict, onEdit, onDelete, onEndNow }) {
  const { settings } = useStore()
  const live = shift.start <= now && now < shift.end
  const done = shift.end <= now
  const status = live ? 'live' : done ? 'done' : 'upcoming'
  const Icon = TYPE_ICONS[shift.type]
  const typeLabel = ACTIVITY_TYPES[shift.type].label
  const name = settings.streamerMode ? typeLabel : shift.title || typeLabel
  const endsNextDay = dayKey(shift.end - 1) !== dayKey(shift.start)
  const progress = live ? ((now - shift.start) / (shift.end - shift.start)) * 100 : 0
  const summary = `${name}, ${playerName(shift.player, settings)}, ${formatTime(shift.start)} to ${formatTime(shift.end)}`

  return (
    <li className={`shift shift--${shift.player} shift--${status}`}>
      <div className="shift__time">
        <span>{formatTime(shift.start)}</span>
        <span className="shift__time-end">{formatTime(shift.end)}</span>
      </div>
      <div className="shift__rail" aria-hidden="true">
        <span className="shift__dot" />
      </div>
      <article className="shift__card" aria-label={summary}>
        <div className="shift__top">
          <PlayerBadge player={shift.player} />
          <span className="tag">
            <Icon size={13} aria-hidden="true" />
            {typeLabel}
          </span>
          {live && (
            <span className="tag tag--live">
              <span className="live-dot" aria-hidden="true" />
              Live now
            </span>
          )}
          {done && <span className="tag tag--muted">Completed</span>}
          {shift.flexible && <span className="tag tag--flex">Flexible</span>}
          {hasConflict && (
            <span className="tag tag--warn">
              <AlertTriangle size={12} aria-hidden="true" />
              Overlap
            </span>
          )}
        </div>

        <h4 className="shift__title">{name}</h4>
        <p className="shift__meta">
          {formatDuration(shift.end - shift.start)} · {formatTime(shift.start)} to {formatTime(shift.end)}
          {endsNextDay && <> ({formatDayLabel(shift.end - 1)})</>}
        </p>
        {!settings.streamerMode && shift.notes && <p className="shift__notes">{shift.notes}</p>}

        {live && (
          <div className="shift__progress">
            <ProgressBar value={progress} accent={shift.player === 'simphiwe' ? 'turq' : 'pink'} label="Shift progress" />
            <span>{formatDuration(shift.end - now)} left</span>
          </div>
        )}

        <div className="shift__actions">
          {live && (
            <button type="button" className="btn btn--small btn--ghost" onClick={() => onEndNow(shift)}>
              <Timer size={14} aria-hidden="true" />
              End now
            </button>
          )}
          <button type="button" className="btn btn--small btn--ghost" onClick={() => onEdit(shift)} aria-label={`Edit ${summary}`}>
            <Pencil size={14} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            className="btn btn--small btn--ghost btn--danger-text"
            onClick={() => onDelete(shift)}
            aria-label={`Delete ${summary}`}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      </article>
    </li>
  )
}
