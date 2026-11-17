import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Pencil, Plus, Repeat, RotateCcw, Shuffle, Sparkles, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import BingoBoard from '../components/BingoBoard.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import WinCelebration from '../components/WinCelebration.jsx'
import {
  CENTER_INDEX,
  addCustomTile,
  bingoProgress,
  completedLines,
  deleteCustomTile,
  MAX_CUSTOM_TILES,
  MAX_TILE_TEXT_LENGTH,
  newlyCompletedLines,
  poolTileIds,
  replaceTile,
  resetBingoState,
  shuffleBoard,
  tileById,
  toggleTile,
  updateCustomTile,
} from '../utils/bingo.js'

export default function Bingo() {
  const { bingo, setBingo } = useStore()
  const [swapMode, setSwapMode] = useState(false)
  const [popIndex, setPopIndex] = useState(null)
  const [win, setWin] = useState(null)
  const [confirm, setConfirm] = useState(null) // 'reset' | 'shuffle'
  const [includePool, setIncludePool] = useState(false)
  const [picker, setPicker] = useState(null) // { kind: 'cell', index } | { kind: 'pool', tileId }
  const [customText, setCustomText] = useState('')
  const [customError, setCustomError] = useState('')
  const [editingTile, setEditingTile] = useState(null)
  const [editText, setEditText] = useState('')
  const [editError, setEditError] = useState('')
  const [deleteTileId, setDeleteTileId] = useState(null)
  const popTimer = useRef(null)
  const customInputId = useId()
  const editInputId = useId()

  useEffect(() => () => clearTimeout(popTimer.current), [])

  const stats = bingoProgress(bingo)
  const lines = useMemo(() => completedLines(bingo.cells, bingo.done), [bingo])
  const lineIndices = useMemo(() => new Set(lines.flatMap((l) => l.indices)), [lines])
  const pool = poolTileIds(bingo)
  const boardTileIds = new Set(bingo.cells)

  const addCustomChallenge = (event) => {
    event.preventDefault()
    const next = addCustomTile(bingo, customText)
    if (next === bingo) {
      setCustomError('Enter a unique challenge. Custom challenges are limited to 60 characters and 50 items.')
      return
    }
    setBingo(next)
    setCustomText('')
    setCustomError('')
  }

  const saveCustomChallenge = (event) => {
    event.preventDefault()
    const next = updateCustomTile(bingo, editingTile, editText)
    if (next === bingo) {
      setEditError('Enter a unique challenge name.')
      return
    }
    setBingo(next)
    setEditingTile(null)
    setEditError('')
  }

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
    setBingo(resetBingoState(bingo))
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
            customTiles={bingo.customTiles}
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
                  <span>{tileById(bingo, id).text}</span>
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => setPicker({ kind: 'pool', tileId: id })}
                    aria-label={`Swap in ${tileById(bingo, id).text}`}
                  >
                    Swap in
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card custom-challenges" aria-labelledby="custom-challenges-title">
            <h2 id="custom-challenges-title" className="section-title">Your challenges</h2>
            <p className="pool__hint">Write your own challenge, then swap it onto the board from the optional pool.</p>
            <form className="custom-challenges__form" onSubmit={addCustomChallenge}>
              <label className="field__label" htmlFor={customInputId}>New challenge</label>
              <div className="custom-challenges__add">
                <input
                  id={customInputId}
                  className="input"
                  value={customText}
                  maxLength={MAX_TILE_TEXT_LENGTH}
                  placeholder="e.g. Find a hidden landmark"
                  onChange={(event) => {
                    setCustomText(event.target.value)
                    setCustomError('')
                  }}
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={!customText.trim() || (bingo.customTiles || []).length >= MAX_CUSTOM_TILES}
                >
                  <Plus size={16} aria-hidden="true" />
                  Add
                </button>
              </div>
              {customError && <p className="field__error" role="alert">{customError}</p>}
              <p className="field__hint">{(bingo.customTiles || []).length} of {MAX_CUSTOM_TILES} custom challenges</p>
            </form>
            {(bingo.customTiles || []).length > 0 ? (
              <ul className="custom-challenges__list">
                {bingo.customTiles.map((tile) => {
                  const onBoard = boardTileIds.has(tile.id)
                  return (
                    <li key={tile.id} className="custom-challenges__item">
                      <div>
                        <span>{tile.text}</span>
                        <span className="custom-challenges__status">{onBoard ? 'On board' : 'In pool'}</span>
                      </div>
                      <div className="custom-challenges__actions">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Edit challenge ${tile.text}`}
                          onClick={() => {
                            setEditingTile(tile.id)
                            setEditText(tile.text)
                            setEditError('')
                          }}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          aria-label={`Delete challenge ${tile.text}`}
                          disabled={onBoard}
                          title={onBoard ? 'Swap this challenge off the board before deleting it' : undefined}
                          onClick={() => setDeleteTileId(tile.id)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="empty-inline">Your custom challenges will appear here.</p>
            )}
          </section>
        </aside>
      </div>

      {win && <WinCelebration lines={win} onClose={closeWin} />}

      {confirm === 'reset' && (
        <ConfirmDialog
          title="Reset the bingo board?"
          message="Progress is cleared and the original 25 tiles return to their starting positions. Your custom challenges stay in the optional pool."
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

      {editingTile && (
        <Modal title="Edit custom challenge" onClose={() => setEditingTile(null)} size="sm">
          <form className="form" onSubmit={saveCustomChallenge}>
            <label className="field__label" htmlFor={editInputId}>Challenge text</label>
            <input
              id={editInputId}
              className="input"
              value={editText}
              maxLength={MAX_TILE_TEXT_LENGTH}
              required
              autoFocus
              onChange={(event) => {
                setEditText(event.target.value)
                setEditError('')
              }}
            />
            {editError && <p className="field__error" role="alert">{editError}</p>}
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditingTile(null)}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={!editText.trim()}>Save challenge</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTileId && (
        <ConfirmDialog
          title="Delete this custom challenge?"
          message={`${tileById(bingo, deleteTileId)?.text || 'This challenge'} will be removed from your optional pool.`}
          confirmLabel="Delete challenge"
          onCancel={() => setDeleteTileId(null)}
          onConfirm={() => {
            setBingo(deleteCustomTile(bingo, deleteTileId))
            setDeleteTileId(null)
          }}
        />
      )}

      {picker?.kind === 'cell' && (
        <Modal title="Replace with a pool tile" onClose={() => setPicker(null)} size="sm">
          <p className="modal__message">
            Replacing <strong>{tileById(bingo, bingo.cells[picker.index]).text}</strong>. It moves to the pool and loses its progress.
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
                  {tileById(bingo, id).text}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {picker?.kind === 'pool' && (
        <Modal title={`Swap in “${tileById(bingo, picker.tileId).text}”`} onClose={() => setPicker(null)} size="sm">
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
                    {tileById(bingo, id).text}
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
