import { PLAYERS } from '../utils/constants.js'

export default function PlayerBadge({ player, className = '' }) {
  const meta = PLAYERS[player] || PLAYERS.both
  return (
    <span className={`player player--${meta.id} ${className}`}>
      <span className="player__dot" aria-hidden="true" />
      {meta.name}
    </span>
  )
}
