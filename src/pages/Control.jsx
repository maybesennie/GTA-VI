import { useMemo, useState } from 'react'
import { History, NotebookPen, Pause, Play, RotateCw, Square, Trash2, UserCheck } from 'lucide-react'
import { useNow } from '../hooks/useNow.jsx'
import { useStore } from '../context/StoreContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import PlayerBadge from '../components/PlayerBadge.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { TYPE_ICONS } from '../components/icons.js'
import { ACTIVITY_TYPES, sortShifts } from '../utils/schedule.js'
import { elapsedMs } from '../utils/marathon.js'
import { HOUR, PLAYER_IDS, TARGET_MAX_HOURS, TARGET_MIN_HOURS } from '../utils/constants.js'
import { formatDateTime, formatDayLabel, formatDuration, formatHMS, formatTime, toHours } from '../utils/time.js'
import { playerName } from '../utils/settings.js'

const EVENT_LABELS = { start: 'Marathon started', pause: 'Paused', resume: 'Resumed', end: 'Marathon ended' }

function MarathonClock() {
  const now = useNow()
  const { timer, startMarathon, pauseMarathon, resumeMarathon, endMarathon } = useStore()
  const [confirm, setConfirm] = useState(null) // 'end' | 'restart'
  const elapsed = elapsedMs(timer, now)
  const status = timer.status
  const minMark = (TARGET_MIN_HOURS / TARGET_MAX_HOURS) * 100
  const pct = Math.min(100, (elapsed / (TARGET_MAX_HOURS * HOUR)) * 100)

  return (
    <section className="card clock" aria-labelledby="clock-title">
      <div className="clock__head">
        <h2 id="clock-title" className="section-title">
          Marathon clock
        </h2>
        <StatusPill status={status} />
      </div>

      <p className="clock__time" role="timer" aria-label={`${formatDuration(elapsed)} elapsed`}>
        {formatHMS(elapsed)}
      </p>
      <p className="clock__sub">
        {toHours(elapsed)} hours elapsed
        {timer.startedAt && <> · started {formatDateTime(timer.startedAt)}</>}
        {timer.endedAt && <> · ended {formatDateTime(timer.endedAt)}</>}
      </p>

      <div className="targetbar targetbar--wide">
        <div className="targetbar__track" aria-hidden="true">
          <span className="targetbar__fill" style={{ width: `${pct}%` }} />
          <span className="targetbar__tick" style={{ left: `${minMark}%` }} />
        </div>
        <div className="targetbar__labels" aria-hidden="true">
          <span>0h</span>
          <span style={{ left: `${minMark}%` }}>{TARGET_MIN_HOURS}h</span>
          <span>{TARGET_MAX_HOURS}h</span>
        </div>
      </div>

      <div className="clock__buttons">
        <button
          type="button"
          className="btn btn--primary"
          disabled={status === 'running' || status === 'paused'}
          onClick={() => (status === 'ended' ? setConfirm('restart') : startMarathon())}
        >
          <Play size={16} aria-hidden="true" />
          Start Marathon
        </button>
        <button type="button" className="btn btn--secondary" disabled={status !== 'running'} onClick={pauseMarathon}>
          <Pause size={16} aria-hidden="true" />
          Pause Marathon
        </button>
        <button type="button" className="btn btn--turq" disabled={status !== 'paused'} onClick={resumeMarathon}>
          <RotateCw size={16} aria-hidden="true" />
          Resume Marathon
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={status !== 'running' && status !== 'paused'}
          onClick={() => setConfirm('end')}
        >
          <Square size={16} aria-hidden="true" />
          End Marathon
        </button>
      </div>

      {timer.events.length > 0 && (
        <details className="clock__log">
          <summary>Clock history ({timer.events.length})</summary>
          <ol>
            {[...timer.events].reverse().map((ev) => (
              <li key={ev.id}>
                <span>{EVENT_LABELS[ev.type]}</span>
                <time>{formatDateTime(ev.at)}</time>
              </li>
            ))}
          </ol>
        </details>
      )}

      {confirm === 'end' && (
        <ConfirmDialog
          title="End the marathon?"
          message={`The clock stops at ${formatHMS(elapsed)}. You can start a new one afterwards, which resets the timer.`}
          confirmLabel="End marathon"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            endMarathon()
            setConfirm(null)
          }}
        />
      )}
      {confirm === 'restart' && (
        <ConfirmDialog
          title="Start a new marathon?"
          message="The finished timer is replaced and counting starts again from zero."
          confirmLabel="Start new marathon"
          tone="primary"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            startMarathon()
            setConfirm(null)
          }}
        />
      )}
    </section>
  )
}

function Handovers() {
  const { handovers, recordHandover, deleteHandover, settings } = useStore()
  const [note, setNote] = useState('')
  const entries = useMemo(
    () =>
      handovers.map((h, i) => ({ ...h, from: i > 0 ? handovers[i - 1].player : null })).reverse(),
    [handovers],
  )
  const last = handovers[handovers.length - 1]
  const now = useNow()

  const record = (player) => {
    recordHandover(player, note)
    setNote('')
  }

  return (
    <section className="card" aria-labelledby="handover-title">
      <h2 id="handover-title" className="section-title">
        <UserCheck size={17} aria-hidden="true" /> Player handover
      </h2>
      <p className="muted-line">
        {last ? (
          <>
            <PlayerBadge player={last.player} /> has had the controller since {formatTime(last.at)} ({formatDuration(now - last.at)} ago).
          </>
        ) : (
          'No handover recorded yet.'
        )}
      </p>

      <div className="field">
        <label className="field__label" htmlFor="handover-note">
          Note <span className="field__optional">optional</span>
        </label>
        <input
          id="handover-note"
          className="input"
          type={settings.streamerMode ? 'password' : 'text'}
          autoComplete="off"
          value={note}
          maxLength={120}
          placeholder="Where you stopped, what's next"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="handover-buttons">
        {PLAYER_IDS.map((id) => (
          <button key={id} type="button" className={`btn btn--handover btn--handover-${id}`} onClick={() => record(id)}>
            {playerName(id, settings)} takes over
          </button>
        ))}
      </div>

      <h3 className="subhead">Handover log</h3>
      {entries.length === 0 ? (
        <p className="empty-inline">Takeovers you record appear here, newest first.</p>
      ) : (
        <ul className="log">
          {entries.map((h) => (
            <li key={h.id} className={`log__item log__item--${h.player}`}>
              <div className="log__main">
                <p>
                  <PlayerBadge player={h.player} /> took over
                  {h.from && h.from !== h.player ? <> from {playerName(h.from, settings)}</> : null}
                </p>
                <p className="log__meta">
                  {formatDateTime(h.at)}
                  {h.elapsedMs !== null && <> · marathon time {formatHMS(h.elapsedMs)}</>}
                </p>
                {h.note && (
                  <p className="log__note">
                    {settings.streamerMode ? 'Handover note hidden in streamer mode.' : h.note}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => deleteHandover(h.id)}
                aria-label={`Delete handover to ${playerName(h.player, settings)} at ${formatTime(h.at)}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Notes() {
  const { notes, addNote, deleteNote, settings } = useStore()
  const [author, setAuthor] = useState('sennie')
  const [text, setText] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    addNote(author, text)
    setText('')
  }

  return (
    <section className="card" aria-labelledby="notes-title">
      <h2 id="notes-title" className="section-title">
        <NotebookPen size={17} aria-hidden="true" /> Notes
      </h2>
      <form onSubmit={submit} className="form">
        <div className="segmented" role="radiogroup" aria-label="Note author">
          {PLAYER_IDS.map((id) => (
            <label key={id} className={`segmented__item segmented__item--${id}`}>
              <input type="radio" name="note-author" value={id} checked={author === id} onChange={() => setAuthor(id)} />
              <span>{playerName(id, settings)}</span>
            </label>
          ))}
        </div>
        <label className="visually-hidden" htmlFor="note-text">
          Write a note
        </label>
        {settings.streamerMode ? (
          <p className="privacy-message">Turn off streamer mode to write a private note.</p>
        ) : (
          <textarea
            id="note-text"
            className="input input--area"
            rows={3}
            maxLength={500}
            value={text}
            placeholder="Mission progress, reminders, things for the other player"
            onChange={(e) => setText(e.target.value)}
          />
        )}
        <button type="submit" className="btn btn--primary" disabled={settings.streamerMode || !text.trim()}>
          Add note
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="empty-inline">Nothing here yet. Leave a note for the next player.</p>
      ) : (
        <ul className="log">
          {[...notes].reverse().map((n) => (
            <li key={n.id} className={`log__item log__item--${n.author}`}>
              <div className="log__main">
                <p>
                  <PlayerBadge player={n.author} />
                </p>
                <p className="log__note log__note--body">
                  {settings.streamerMode ? 'Private note hidden in streamer mode.' : n.text}
                </p>
                <p className="log__meta">{formatDateTime(n.at)}</p>
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => deleteNote(n.id)}
                aria-label={`Delete note by ${playerName(n.author, settings)}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ShiftHistory() {
  const now = useNow()
  const { shifts, settings } = useStore()
  const finished = sortShifts(shifts)
    .filter((s) => s.end <= now)
    .reverse()

  return (
    <section className="card" aria-labelledby="history-title">
      <h2 id="history-title" className="section-title">
        <History size={17} aria-hidden="true" /> Completed shifts
      </h2>
      {finished.length === 0 ? (
        <p className="empty-inline">Shifts move here once their end time passes.</p>
      ) : (
        <ul className="history">
          {finished.map((s) => {
            const Icon = TYPE_ICONS[s.type]
            return (
              <li key={s.id} className={`history__item history__item--${s.player}`}>
                <PlayerBadge player={s.player} />
                <span className="history__what">
                  <Icon size={14} aria-hidden="true" />
                  {settings.streamerMode ? ACTIVITY_TYPES[s.type].label : s.title || ACTIVITY_TYPES[s.type].label}
                </span>
                <span className="history__when">
                  {formatDayLabel(s.start)} · {formatTime(s.start)} to {formatTime(s.end)}
                </span>
                <span className="history__dur">{formatDuration(s.end - s.start)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function Control() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Run the marathon</p>
          <h1 className="page__title">Marathon Control</h1>
          <p className="page__lead">Start the clock, hand over the controller, leave notes and see what has been played.</p>
        </div>
      </header>
      <MarathonClock />
      <div className="control-grid">
        <Handovers />
        <Notes />
      </div>
      <ShiftHistory />
    </div>
  )
}
