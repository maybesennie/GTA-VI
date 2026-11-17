import { PLAYER_IDS, PLAYERS } from './constants.js'

export const defaultSettingsState = () => ({
  streamerMode: false,
  names: Object.fromEntries(PLAYER_IDS.map((id) => [id, PLAYERS[id].name])),
})

export function validateSettingsState(value) {
  return (
    value &&
    typeof value.streamerMode === 'boolean' &&
    value.names &&
    PLAYER_IDS.every(
      (id) => typeof value.names[id] === 'string' && value.names[id].trim().length > 0 && value.names[id].length <= 32,
    )
  )
}

export function playerName(id, settings) {
  if (settings?.streamerMode) {
    if (id === 'both') return 'Both players'
    return id === PLAYER_IDS[0] ? 'Player 1' : 'Player 2'
  }
  if (id === 'both') return PLAYERS.both.name
  return settings?.names?.[id] || PLAYERS[id]?.name || 'Unknown player'
}
