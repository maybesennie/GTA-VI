import { useMemo, useState } from 'react'
import { CalendarPlus, Hourglass, Moon, Plus, RotateCcw, ShowerHead, Utensils } from 'lucide-react'
import { useNow } from '../hooks/useNow.jsx'
import { useStore } from '../context/StoreContext.jsx'
import PlayerBadge from '../components/PlayerBadge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import CountdownDisplay from '../components/CountdownDisplay.jsx'
import ShiftCard from '../components/ShiftCard.jsx'
import ShiftForm from '../components/ShiftForm.jsx'
import DayLanes from '../components/DayLanes.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import {
  ACTIVITY_TYPES,
  currentGamingShift,
  findConflicts,
  liveShifts,
  nextShift,
  playerTotals,
  sortShifts,
  suggestNewShift,
} from '../utils/schedule.js'
import { PLAYER_IDS } from '../utils/constants.js'
import { dayKey, formatDateTime, formatDayLabel, formatDuration, formatTime, startOfDay } from '../utils/time.js'
import { playerName } from '../utils/settings.js'

function ControllerBanner({ gaming, live, now, settings }) {
  if (gaming) {
    const accent = gaming.player === 'simphiwe' ? 'turq' : gaming.player === 'both' ? 'purple' : 'pink'
    return (
      <section className={`card controller controller--${accent}`} aria-label="Who is playing now">
        <p className="eyebrow">On the controller</p>
        <p className="controller__name">
          <span className="controller__pulse" aria-hidden="true" />
          {playerName(gaming.player, settings)}
        </p>
        <p className="controller__sub">
          {settings.streamerMode ? ACTIVITY_TYPES[gaming.type].label : gaming.title || 'Gaming'} until {formatTime(gaming.end)} · {formatDuration(gaming.end - now)} left
        </p>
      </section>
    )
  }
  const breaks = live.filter((s) => s.type !== 'gaming')
  return (
    <section className="card controller controller--idle" aria-label="Who is playing now">
      <p className="eyebrow">On the controller</p>
      <p className="controller__name controller__name--idle">Nobody scheduled</p>
      <p className="controller__sub">
        {breaks.length
          ? breaks
              .map(
                (s) =>
                  `${playerName(s.player, settings)}: ${
                    settings.streamerMode ? ACTIVITY_TYPES[s.type].label : s.title || ACTIVITY_TYPES[s.type].label
                  }`,
              )
              .join(' · ')
          : 'No gaming shift is running right now.'}
      </p>
    </section>
  )
}

function PlayerTotals({ id, totals, settings }) {
  const t = totals[id]
  const pct = t.gaming.planned ? (t.gaming.done / t.gaming.planned) * 100 : 0
  return (
    <article className={`card totals totals--${id}`}>
      <header className="totals__head">
        <PlayerBadge player={id} />
      </header>
      <dl className="totals__grid">
        <div>
          <dt>Gaming planned</dt>
          <dd>{formatDuration(t.gaming.planned)}</dd>
        </div>
        <div>
          <dt>Gaming done</dt>
          <dd>{formatDuration(t.gaming.done)}</dd>
        </div>
        <div>
          <dt>Rest planned</dt>
          <dd>{formatDuration(t.rest.planned)}</dd>
        </div>
        <div>
          <dt>Rest done</dt>
          <dd>{formatDuration(t.rest.done)}</dd>
        </div>
      </dl>
      <ProgressBar value={pct} accent={id === 'simphiwe' ? 'turq' : 'pink'} label={`${playerName(id, settings)} gaming progress`} />
    </article>
  )
}

export default function Calendar() {
  const now = useNow()
  const { shifts, addShift, updateShift, deleteShift, resetSchedule, settings } = useStore()
  const [editor, setEditor] = useState(null) // { mode, initial }
  const [toDelete, setToDelete] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const sorted = useMemo(() => sortShifts(shifts), [shifts])
  const live = liveShifts(sorted, now)
  const gaming = currentGamingShift(sorted, now)
  const next = nextShift(sorted, now)
  const totals = playerTotals(sorted, now)

  const groups = useMemo(() => {
    const map = new Map()
    sorted.forEach((s) => {
      const key = dayKey(s.start)
      if (!map.has(key)) map.set(key, { key, dayStart: startOfDay(s.start), items: [] })
      map.get(key).items.push(s)
    })
    return [...map.values()]
  }, [sorted])

  const conflictIds = useMemo(
    () => new Set(sorted.filter((s) => findConflicts(s, sorted).length > 0).map((s) => s.id)),
    [sorted],
  )

  const openAdd = (type) => setEditor({ mode: 'add', initial: suggestNewShift(shifts, type, Date.now()) })

  const handleSave = (values) => {
    if (editor.mode === 'add') addShift(values)
    else updateShift(editor.initial.id, values)
    setEditor(null)
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Shared schedule</p>
          <h1 className="page__title">Marathon Calendar</h1>
          <p className="page__lead">
            Who plays, who rests and when. Everything is editable, and nothing past the opening shifts is locked in.
          </p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn--primary" onClick={() => openAdd('gaming')}>
            <Plus size={16} aria-hidden="true" />
            Add shift
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => openAdd('sleep')}>
            <Moon size={16} aria-hidden="true" />
            Sleep
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => openAdd('meal')}>
            <Utensils size={16} aria-hidden="true" />
            Meal break
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => openAdd('personal')}>
            <ShowerHead size={16} aria-hidden="true" />
            Shower / personal
          </button>
        </div>
      </header>

      <div className="calendar-top">
        <ControllerBanner gaming={gaming} live={live} now={now} settings={settings} />
        <section className="card next-shift" aria-label="Next shift">
          <p className="eyebrow">
            <Hourglass size={13} aria-hidden="true" /> Next shift
          </p>
          {next ? (
            <>
              <CountdownDisplay ms={next.start - now} compact />
              <p className="next-shift__what">
                <PlayerBadge player={next.player} /> · {settings.streamerMode ? ACTIVITY_TYPES[next.type].label : next.title || ACTIVITY_TYPES[next.type].label}
              </p>
              <p className="next-shift__when">Starts {formatDateTime(next.start)}</p>
            </>
          ) : (
            <p className="empty-inline">No upcoming shifts. Add one to keep the rotation going.</p>
          )}
        </section>
      </div>

      <div className="totals-row">
        {PLAYER_IDS.map((id) => (
          <PlayerTotals key={id} id={id} totals={totals} settings={settings} />
        ))}
      </div>

      {sorted.length > 0 && (
        <section className="card lanes-card" aria-labelledby="lanes-title">
          <h2 id="lanes-title" className="section-title">
            At a glance
          </h2>
          <DayLanes shifts={sorted} now={now} />
          <ul className="legend" aria-label="Legend">
            <li>
              <span className="legend__swatch legend__swatch--gaming" /> Gaming
            </li>
            <li>
              <span className="legend__swatch legend__swatch--rest" /> Sleep and breaks
            </li>
            <li>
              <span className="legend__swatch legend__swatch--now" /> Now
            </li>
          </ul>
        </section>
      )}

      <section aria-labelledby="timeline-title" className="timeline-section">
        <div className="section-head">
          <h2 id="timeline-title" className="section-title">
            Timeline
          </h2>
          <button type="button" className="btn btn--small btn--ghost" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} aria-hidden="true" />
            Restore default schedule
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="empty">
            <CalendarPlus size={28} aria-hidden="true" />
            <h3>No shifts yet</h3>
            <p>Add the first shift, or restore the starting schedule.</p>
            <div className="empty__actions">
              <button type="button" className="btn btn--primary" onClick={() => openAdd('gaming')}>
                Add shift
              </button>
              <button type="button" className="btn btn--secondary" onClick={resetSchedule}>
                Restore default schedule
              </button>
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <div className="day-group" key={group.key}>
              <h3 className="day-group__title">
                {formatDayLabel(group.dayStart)}
                {dayKey(now) === group.key && <span className="tag tag--today">Today</span>}
              </h3>
              <ol className="timeline">
                {group.items.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    now={now}
                    hasConflict={conflictIds.has(shift.id)}
                    onEdit={(s) => setEditor({ mode: 'edit', initial: s })}
                    onDelete={setToDelete}
                    onEndNow={(s) => updateShift(s.id, { end: Math.max(s.start + 60 * 1000, Date.now()) })}
                  />
                ))}
              </ol>
            </div>
          ))
        )}
        <p className="timeline-note">
          Later rotations are open on purpose. Add or adjust shifts as the marathon unfolds.
        </p>
      </section>

      {editor && (
        <ShiftForm mode={editor.mode} initial={editor.initial} shifts={shifts} onSave={handleSave} onClose={() => setEditor(null)} />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this shift?"
          message={`${settings.streamerMode ? ACTIVITY_TYPES[toDelete.type].label : toDelete.title || ACTIVITY_TYPES[toDelete.type].label} (${playerName(toDelete.player, settings)}, ${formatTime(toDelete.start)} to ${formatTime(toDelete.end)}) will be removed from the schedule.`}
          confirmLabel="Delete shift"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            deleteShift(toDelete.id)
            setToDelete(null)
          }}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Restore the default schedule?"
          message="Your changes to the calendar will be replaced by the original schedule. This can't be undone."
          confirmLabel="Restore schedule"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetSchedule()
            setConfirmReset(false)
          }}
        />
      )}
    </div>
  )
}
