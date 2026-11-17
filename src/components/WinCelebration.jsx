import { useEffect, useMemo } from 'react'
import { Trophy } from 'lucide-react'

const COLORS = ['#FF3D91', '#36E0CF', '#9747FF', '#F5F1FA']

/** BINGO overlay with light CSS confetti (disabled for reduced-motion users). */
export default function WinCelebration({ lines, onClose }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.round(((i * 37) % 100) + (i % 3)),
        delay: (i % 10) * 0.12,
        duration: 2.4 + (i % 5) * 0.35,
        color: COLORS[i % COLORS.length],
        drift: ((i % 7) - 3) * 14,
      })),
    [],
  )

  useEffect(() => {
    const id = setTimeout(onClose, 9000)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div className="win" role="alertdialog" aria-modal="true" aria-labelledby="win-title" aria-describedby="win-desc">
      <div className="win__confetti" aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${Math.min(98, p.left)}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>
      <div className="win__card">
        <Trophy size={30} aria-hidden="true" />
        <h2 id="win-title" className="win__title">
          BINGO!
        </h2>
        <p id="win-desc" className="win__desc">
          {lines.length === 1 ? `${lines[0].label} is complete.` : `${lines.map((l) => l.label).join(' and ')} are complete.`}
        </p>
        <button type="button" className="btn btn--primary" onClick={onClose} autoFocus>
          Keep playing
        </button>
      </div>
    </div>
  )
}
