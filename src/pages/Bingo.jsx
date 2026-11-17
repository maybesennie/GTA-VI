import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Repeat, RotateCcw, Shuffle, Sparkles } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import BingoBoard from '../components/BingoBoard.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import WinCelebration from '../components/WinCelebration.jsx'
import {
  CENTER_INDEX,
  TILE_BY_ID,
  bingoProgress,
  completedLines,
  defaultBingoState,
  newlyCompletedLines,
  poolTileIds,
  replaceTile,
  shuffleBoard,
  toggleTile,
} from '../utils/bingo.js'

export default function Bingo() {
  const { bingo, setBingo } = useStore()
  const [swapMode, setSwapMode] = useState(false)
  const [popIndex, setPopIndex] = useState(null)
  const [win, setWin] = useState(null)
  const [confirm, setConfirm] = useState(null) // 'reset' | 'shuffle'
  const [includePool, setIncludePool] = useState(false)
  const [picker, setPicker] = useState(null) // { kind: 'cell', index } | { kind: 'pool', tileId }
  const popTimer = useRef(null)

  useEffect(() => () => clearTimeout(popTimer.current), [])

  const stats = bingoProgress(bingo)
  const lines = useMemo(() => completedLines(bingo.cells, bingo.done), [bingo])
  const lineIndices = useMemo(() => new Set(lines.flatMap((l) => l.indices)), [lines])
  const pool = poolTileIds(bingo)

  const handlePress = useCallback(
    (index) => {
      if (swapMode) {
        if (index !== CENTER_INDEX) setPicker({ kind: 'cell', index })
        return
      }
      const next = toggleTile(bingo, index)
      setBingo(next)
      if (next.done[next.cells[index]]) {
        setPopIndex(index)
        clearTimeout(popTimer.current)
        popTimer.current = setTimeout(() => setPopIndex(null), 800)
      }
      const won = newlyCompletedLines(bingo, next)
      if (won.length) setWin(won)
    },
    [bingo, setBingo, swapMode],
  )

  const closeWin = useCallback(() => setWin(null), [])

  const doReset = () => {
    setBingo(defaultBingoState())
    setConfirm(null)
    setSwapMode(false)
  }

  const doShuffle = () => {
    setBingo(shuffleBoard(bingo, { includePool }))
    setConfirm(null)
  }

  const pickReplacement = (index, tileId) => {
    setBingo(replaceTile(bingo, index, tileId))
    setPicker(null)
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Side quests</p>
          <h1 className="page__title">GTA VI Bingo</h1>
          <p className="page__lead">Tap a tile when it happens. Tap again to undo. Five in a row, column or diagonal is a bingo.</p>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className={`btn btn--secondary ${swapMode ? 'btn--active' : ''}`}
            aria-pressed={swapMode}
            onClick={() => setSwapMode((v) => !v)}
          >
            <Repeat size={16} aria-hidden="true" />
            {swapMode ? 'Done swapping' : 'Swap tiles'}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setIncludePool(false)
              setConfirm('shuffle')
            }}
          >
            <Shuffle size={16} aria-hidden="true" />
            Shuffle
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setConfirm('reset')}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset board
          </button>
        </div>
      </header>

      <div className="bingo-layout">
        <div className="bingo-main">
          {swapMode && (
            <p className="notice" role="status">
              <Repeat size={16} aria-hidden="true" />
              <span>Swap mode: tap any tile except the centre to replace it from the optional pool.</span>
            </p>
          )}
          <BingoBoard
            cells={bingo.cells}
            done={bingo.done}
            lineIndices={lineIndices}
            popIndex={popIndex}
            swapMode={swapMode}
            onPress={handlePress}
          />
        </div>

        <aside className="bingo-side">
          <section className="card bingo-stats" aria-label="Bingo progress">
            <p className="eyebrow">Progress</p>
            <p className="bingo-stats__big">
              {stats.completed}
              <span> / {stats.total} tiles</span>
            </p>
            <ProgressBar value={stats.percent} label="Bingo completion" />
            <p className="bingo-stats__pct">{stats.percent}% complete</p>
            <p className={`bingo-stats__lines ${lines.length ? 'is-win' : ''}`}>
              <Sparkles size={15} aria-hidden="true" />
              {lines.length ? `${lines.length} bingo ${lines.length === 1 ? 'line' : 'lines'}` : 'No bingo yet'}
            </p>
            {lines.length > 0 && (
              <ul className="bingo-stats__list" aria-label="Completed lines">
                {lines.map((l) => (
                  <li key={l.id}>{l.label}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="card pool" aria-labelledby="pool-title">
            <h2 id="pool-title" className="section-title">
              Optional challenge pool
            </h2>
            <p className="pool__hint">Not on the board. Swap one in for any tile except the centre.</p>
            <ul className="pool__list">
              {pool.map((id) => (
                <li key={id} className="pool__item">
                  <span>{TILE_BY_ID[id].text}</span>
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => setPicker({ kind: 'pool', tileId: id })}
                    aria-label={`Swap in ${TILE_BY_ID[id].text}`}
                  >
                    Swap in
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {win && <WinCelebration lines={win} onClose={closeWin} />}

      {confirm === 'reset' && (
        <ConfirmDialog
          title="Reset the bingo board?"
          message="All progress is cleared and the original 25 tiles go back in their starting positions."
          confirmLabel="Reset board"
          onCancel={() => setConfirm(null)}
          onConfirm={doReset}
        />
      )}

      {confirm === 'shuffle' && (
        <ConfirmDialog
          title="Shuffle the board?"
          message="The 24 tiles around the centre are rearranged. START GTA VI stays in the middle, and progress stays with each tile."
          confirmLabel="Shuffle"
          tone="primary"
          onCancel={() => setConfirm(null)}
          onConfirm={doShuffle}
        >
          <label className="toggle toggle--block">
            <input type="checkbox" checked={includePool} onChange={(e) => setIncludePool(e.target.checked)} />
            <span className="toggle__box" aria-hidden="true" />
            <span>Also draw from the optional pool (tiles that leave the board lose their progress)</span>
          </label>
        </ConfirmDialog>
      )}

      {picker?.kind === 'cell' && (
        <Modal title="Replace with a pool tile" onClose={() => setPicker(null)} size="sm">
          <p className="modal__message">
            Replacing <strong>{TILE_BY_ID[bingo.cells[picker.index]].text}</strong>. It moves to the pool and loses its progress.
          </p>
          <ul className="picker">
            {pool.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  className="picker__option"
                  onClick={() => pickReplacement(picker.index, id)}
                  data-autofocus={i === 0 ? true : undefined}
                >
                  {TILE_BY_ID[id].text}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {picker?.kind === 'pool' && (
        <Modal title={`Swap in “${TILE_BY_ID[picker.tileId].text}”`} onClose={() => setPicker(null)} size="sm">
          <p className="modal__message">Choose which board tile it replaces. The centre tile can't be replaced.</p>
          <ul className="picker picker--grid">
            {bingo.cells.map((id, index) =>
              index === CENTER_INDEX ? null : (
                <li key={id}>
                  <button
                    type="button"
                    className="picker__option"
                    onClick={() => pickReplacement(index, picker.tileId)}
                    data-autofocus={index === 0 ? true : undefined}
                  >
                    <span className="picker__num">{index + 1}</span>
                    {TILE_BY_ID[id].text}
                  </button>
                </li>
              ),
            )}
          </ul>
        </Modal>
      )}
    </div>
  )
}
