export default function ProgressBar({ value, accent = 'pink', label, className = '' }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={`bar bar--${accent} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
    >
      <span className="bar__fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}
