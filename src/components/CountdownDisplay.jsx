import { formatDuration, splitDuration } from '../utils/time.js'

const pad = (n) => String(n).padStart(2, '0')

/** Days / hours / minutes / seconds boxes. Pass `parts` to limit which units show. */
export default function CountdownDisplay({ ms, compact = false }) {
  const { days, hours, minutes, seconds } = splitDuration(ms)
  const segments = [
    ['Days', String(days)],
    ['Hours', pad(hours)],
    ['Minutes', pad(minutes)],
    ['Seconds', pad(seconds)],
  ]
  return (
    <div className={`countdown ${compact ? 'countdown--compact' : ''}`} role="timer" aria-label={formatDuration(ms)}>
      {segments.map(([label, value]) => (
        <div className="countdown__seg" key={label}>
          <span className="countdown__num">{value}</span>
          <span className="countdown__label">{label}</span>
        </div>
      ))}
    </div>
  )
}
