import { useStore } from '../context/StoreContext.jsx'
import { PLAYERS } from '../utils/constants.js'
import { playerName } from '../utils/settings.js'

export default function PlayerBadge({ player, className = '' }) {
  const { settings } = useStore()
  const meta = PLAYERS[player] || PLAYERS.both
  return (
    <span className={`player player--${meta.id} ${className}`}>
      <span className="player__dot" aria-hidden="true" />
      {playerName(meta.id, settings)}
    </span>
  )
}
