import { memo } from 'react'
import { Check, Play, Repeat } from 'lucide-react'
import { CENTER_INDEX, tileById } from '../utils/bingo.js'

const Tile = memo(function Tile({ index, tileId, tile, done, inLine, pop, swapMode, onPress }) {
  const center = index === CENTER_INDEX
  const swappable = swapMode && !center
  const classes = [
    'tile',
    center && 'tile--center',
    done && 'tile--done',
    inLine && 'tile--line',
    pop && 'tile--pop',
    swappable && 'tile--swap',
  ]
    .filter(Boolean)
    .join(' ')

  const label = swappable
    ? `Replace ${tile.text}, tile ${index + 1}`
    : `${tile.text}, tile ${index + 1}, ${done ? 'completed' : 'not completed'}${inLine ? ', part of a bingo line' : ''}`

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onPress(index)}
      aria-pressed={swappable ? undefined : done}
      aria-label={label}
      disabled={swapMode && center}
    >
      <span className="tile__num" aria-hidden="true">
        {index + 1}
      </span>
      {center && !done && <Play className="tile__icon" size={14} aria-hidden="true" />}
      {done && <Check className="tile__icon tile__icon--check" size={14} strokeWidth={3} aria-hidden="true" />}
      {swappable && <Repeat className="tile__icon tile__icon--swap" size={14} aria-hidden="true" />}
      <span className="tile__text">{tile.text}</span>
    </button>
  )
})

export default function BingoBoard({ cells, customTiles = [], done, lineIndices, popIndex, swapMode, onPress }) {
  return (
    <div className="board" role="group" aria-label="GTA VI bingo board, 5 by 5">
      {cells.map((tileId, index) => (
        <Tile
          key={`${index}-${tileId}`}
          index={index}
          tileId={tileId}
          tile={tileById({ customTiles }, tileId)}
          done={Boolean(done[tileId])}
          inLine={lineIndices.has(index)}
          pop={popIndex === index}
          swapMode={swapMode}
          onPress={onPress}
        />
      ))}
    </div>
  )
}
