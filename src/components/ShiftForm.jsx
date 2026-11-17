import { useId, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal.jsx'
import { TYPE_ICONS } from './icons.js'
import { ACTIVITY_ORDER, ACTIVITY_TYPES, findConflicts, validateShift } from '../utils/schedule.js'
import { ASSIGNABLE, MINUTE } from '../utils/constants.js'
import { formatDuration, fromInputValue, toInputValue } from '../utils/time.js'
import { useStore } from '../context/StoreContext.jsx'
import { playerName } from '../utils/settings.js'

const DURATION_CHIPS = [
  [30, '30m'],
  [60, '1h'],
  [120, '2h'],
  [180, '3h'],
  [240, '4h'],
  [300, '5h'],
  [360, '6h'],
]

export default function ShiftForm({ mode, initial, shifts, onSave, onClose }) {
  const { settings } = useStore()
  const formId = useId()
  const [player, setPlayer] = useState(initial.player)
  const [type, setType] = useState(initial.type)
  const [title, setTitle] = useState(initial.title || '')
  const [start, setStart] = useState(toInputValue(initial.start))
  const [end, setEnd] = useState(toInputValue(initial.end))
  const [notes, setNotes] = useState(initial.notes || '')
  const [flexible, setFlexible] = useState(Boolean(initial.flexible))

  const startMs = fromInputValue(start)
  const endMs = fromInputValue(end)
  const error = validateShift({ player, type, start: startMs, end: endMs })
  const conflicts = error ? [] : findConflicts({ id: initial.id, player, type, start: startMs, end: endMs }, shifts)

  function handleStart(value) {
    const oldStart = startMs
    const oldEnd = endMs
    setStart(value)
    const next = fromInputValue(value)
    // Keep the shift length when the start moves.
    if (Number.isFinite(next) && Number.isFinite(oldStart) && Number.isFinite(oldEnd) && oldEnd > oldStart) {
      setEnd(toInputValue(next + (oldEnd - oldStart)))
    }
  }

  function setLength(minutes) {
    if (Number.isFinite(startMs)) setEnd(toInputValue(startMs + minutes * MINUTE))
  }

  function submit(e) {
    e.preventDefault()
    if (error) return
    onSave({ player, type, title: title.trim(), start: startMs, end: endMs, notes: notes.trim(), flexible })
  }

  return (
    <Modal
      title={mode === 'add' ? 'Add shift' : 'Edit shift'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn--primary" disabled={Boolean(error)}>
            {mode === 'add' ? 'Add to schedule' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id={formId} className="form" onSubmit={submit} noValidate>
        <fieldset className="field">
          <legend className="field__label">Player</legend>
          <div className="segmented" role="radiogroup" aria-label="Player">
            {ASSIGNABLE.map((id) => (
              <label key={id} className={`segmented__item segmented__item--${id}`}>
                <input type="radio" name={`${formId}-player`} value={id} checked={player === id} onChange={() => setPlayer(id)} />
                <span>{playerName(id, settings)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field__label">Activity</legend>
          <div className="chips" role="radiogroup" aria-label="Activity type">
            {ACTIVITY_ORDER.map((id) => {
              const Icon = TYPE_ICONS[id]
              return (
                <label key={id} className="chip">
                  <input type="radio" name={`${formId}-type`} value={id} checked={type === id} onChange={() => setType(id)} />
                  <span>
                    <Icon size={15} aria-hidden="true" />
                    {ACTIVITY_TYPES[id].label}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {settings.streamerMode ? (
          <p className="privacy-message">Custom shift titles and notes are hidden while streamer mode is on.</p>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor={`${formId}-title`}>
              Title <span className="field__optional">optional</span>
            </label>
            <input
              id={`${formId}-title`}
              className="input"
              value={title}
              maxLength={60}
              placeholder={ACTIVITY_TYPES[type].label}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor={`${formId}-start`}>
              Start
            </label>
            <input
              id={`${formId}-start`}
              type="datetime-local"
              className="input"
              value={start}
              onChange={(e) => handleStart(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`${formId}-end`}>
              End
            </label>
            <input
              id={`${formId}-end`}
              type="datetime-local"
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <span className="field__label" id={`${formId}-len`}>
            Set length
          </span>
          <div className="chips" role="group" aria-labelledby={`${formId}-len`}>
            {DURATION_CHIPS.map(([minutes, label]) => (
              <button key={minutes} type="button" className="chip chip--button" onClick={() => setLength(minutes)}>
                {label}
              </button>
            ))}
          </div>
          <p className="field__hint" aria-live="polite">
            {error ? (
              <span className="field__error">{error}</span>
            ) : (
              <>Duration: {formatDuration(endMs - startMs)}. Times are South Africa Standard Time (SAST).</>
            )}
          </p>
        </div>

        {conflicts.length > 0 && (
          <p className="notice notice--warn" role="status">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              Overlaps {conflicts.length === 1 ? 'another shift' : `${conflicts.length} other shifts`} for the same player. You
              can still save it.
            </span>
          </p>
        )}

        {!settings.streamerMode && (
          <div className="field">
            <label className="field__label" htmlFor={`${formId}-notes`}>
              Notes <span className="field__optional">optional</span>
            </label>
            <textarea
              id={`${formId}-notes`}
              className="input input--area"
              rows={3}
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        <label className="toggle">
          <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} />
          <span className="toggle__box" aria-hidden="true" />
          <span>Flexible: the timing is approximate</span>
        </label>
      </form>
    </Modal>
  )
}
