const LABELS = {
  idle: 'Not started',
  running: 'Live',
  paused: 'Paused',
  ended: 'Ended',
}

export default function StatusPill({ status }) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" aria-hidden="true" />
      {LABELS[status] || LABELS.idle}
    </span>
  )
}
