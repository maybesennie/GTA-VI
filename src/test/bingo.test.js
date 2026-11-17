import { describe, expect, it } from 'vitest'
import {
  ALL_TILES,
  addCustomTile,
  BOARD_TEXT,
  CENTER_ID,
  CENTER_INDEX,
  LINES,
  POOL_TEXT,
  TILE_BY_ID,
  bingoProgress,
  completedLines,
  deleteCustomTile,
  defaultBingoState,
  resetBingoState,
  newlyCompletedLines,
  poolTileIds,
  replaceTile,
  shuffleBoard,
  toggleTile,
  tileById,
  updateCustomTile,
  validateBingoState,
} from '../utils/bingo.js'

const mark = (state, indices) => indices.reduce((s, i) => toggleTile(s, i), state)

describe('bingo board layout', () => {
  it('has 25 tiles in the exact supplied order', () => {
    expect(BOARD_TEXT).toHaveLength(25)
    expect(BOARD_TEXT.slice(0, 5)).toEqual(['First carjack', 'Police chase', 'Beach at sunrise', 'Jet ski', 'Take a selfie'])
    expect(BOARD_TEXT.slice(5, 10)).toEqual(['Scuba dive', 'Catch a fish', 'Dirt bike', 'Go to Nightclub set', 'Tip a dancer'])
    expect(BOARD_TEXT.slice(10, 15)).toEqual(['Airboat ride', 'Go hunting and kill a bear', 'Start GTA VI', 'Mini golf', 'Gym session'])
    expect(BOARD_TEXT.slice(15, 20)).toEqual(['Kayak', 'Base jump', 'Win a race', 'Masked robbery', 'Escape 6 stars'])
    expect(BOARD_TEXT.slice(20)).toEqual(['Visit all regions', 'Experience bad weather', '48 hours', 'Shooting range', 'Play past sunrise'])
  })

  it('puts START GTA VI in the centre', () => {
    const state = defaultBingoState()
    expect(state.cells[CENTER_INDEX]).toBe(CENTER_ID)
    expect(TILE_BY_ID[CENTER_ID].text).toBe('Start GTA VI')
  })

  it('keeps the five custom tiles in an optional pool, off the board', () => {
    expect(POOL_TEXT).toEqual([
      '24 Hours',
      'Get arrested',
      'Drive across the map on ONE full tank',
      'Find the rarest wildlife',
      'Gain and erase your criminal profile for a robbery',
    ])
    const state = defaultBingoState()
    expect(poolTileIds(state)).toHaveLength(5)
    expect(poolTileIds(state).map((id) => TILE_BY_ID[id].text)).toEqual(POOL_TEXT)
    expect(ALL_TILES).toHaveLength(30)
  })

  it('has 12 lines: 5 rows, 5 columns, 2 diagonals', () => {
    expect(LINES).toHaveLength(12)
    expect(LINES.every((l) => l.indices.length === 5)).toBe(true)
  })
})

describe('bingo detection', () => {
  it('detects every row', () => {
    for (let r = 0; r < 5; r += 1) {
      const state = mark(defaultBingoState(), [0, 1, 2, 3, 4].map((c) => r * 5 + c))
      expect(completedLines(state.cells, state.done).map((l) => l.id)).toEqual([`row-${r + 1}`])
    }
  })

  it('detects every column', () => {
    for (let c = 0; c < 5; c += 1) {
      const state = mark(defaultBingoState(), [0, 1, 2, 3, 4].map((r) => r * 5 + c))
      expect(completedLines(state.cells, state.done).map((l) => l.id)).toEqual([`col-${c + 1}`])
    }
  })

  it('detects both diagonals', () => {
    const main = mark(defaultBingoState(), [0, 6, 12, 18, 24])
    expect(completedLines(main.cells, main.done).map((l) => l.id)).toEqual(['diag-main'])
    const anti = mark(defaultBingoState(), [4, 8, 12, 16, 20])
    expect(completedLines(anti.cells, anti.done).map((l) => l.id)).toEqual(['diag-anti'])
  })

  it('does not report four in a row', () => {
    const state = mark(defaultBingoState(), [0, 1, 2, 3])
    expect(completedLines(state.cells, state.done)).toHaveLength(0)
  })

  it('reports newly completed lines only once', () => {
    const almost = mark(defaultBingoState(), [0, 1, 2, 3])
    const won = toggleTile(almost, 4)
    expect(newlyCompletedLines(almost, won).map((l) => l.id)).toEqual(['row-1'])
    expect(newlyCompletedLines(won, toggleTile(won, 10))).toHaveLength(0)
  })

  it('supports a full-board blackout with 12 lines', () => {
    const state = mark(defaultBingoState(), Array.from({ length: 25 }, (_, i) => i))
    expect(completedLines(state.cells, state.done)).toHaveLength(12)
    expect(bingoProgress(state)).toMatchObject({ completed: 25, percent: 100, lines: 12 })
  })
})

describe('bingo toggling and progress', () => {
  it('toggles a tile on and off', () => {
    const on = toggleTile(defaultBingoState(), 7)
    expect(on.done[on.cells[7]]).toBe(true)
    const off = toggleTile(on, 7)
    expect(off.done[off.cells[7]]).toBeUndefined()
  })

  it('computes completed count and percentage', () => {
    const state = mark(defaultBingoState(), [0, 1, 2, 3, 4, 5])
    expect(bingoProgress(state)).toMatchObject({ completed: 6, total: 25, percent: 24 })
  })
})

describe('bingo replace and shuffle', () => {
  it('replaces a tile from the pool and clears progress on both tiles', () => {
    const state = toggleTile(defaultBingoState(), 0)
    const next = replaceTile(state, 0, 'c2')
    expect(next.cells[0]).toBe('c2')
    expect(next.done.b1).toBeUndefined()
    expect(poolTileIds(next)).toContain('b1')
  })

  it('never replaces the centre or an on-board tile', () => {
    const state = defaultBingoState()
    expect(replaceTile(state, CENTER_INDEX, 'c1')).toBe(state)
    expect(replaceTile(state, 0, 'b5')).toBe(state)
    expect(replaceTile(state, 0, 'nope')).toBe(state)
  })

  it('shuffle keeps the centre fixed, keeps all tiles unique and keeps progress per tile', () => {
    let seed = 7
    const rng = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const start = mark(defaultBingoState(), [0, 1, 12])
    const shuffled = shuffleBoard(start, { rng })
    expect(shuffled.cells[CENTER_INDEX]).toBe(CENTER_ID)
    expect(new Set(shuffled.cells).size).toBe(25)
    expect([...shuffled.cells].sort()).toEqual([...start.cells].sort())
    expect(Object.keys(shuffled.done).sort()).toEqual(['b1', 'b13', 'b2'])
    expect(shuffled.cells).not.toEqual(start.cells)
  })

  it('shuffle with the pool draws 24 unique non-centre tiles and drops progress for tiles that leave', () => {
    const start = mark(defaultBingoState(), [0, 12])
    const shuffled = shuffleBoard(start, { includePool: true, rng: () => 0.42 })
    expect(shuffled.cells[CENTER_INDEX]).toBe(CENTER_ID)
    expect(new Set(shuffled.cells).size).toBe(25)
    expect(validateBingoState(shuffled)).toBe(true)
    Object.keys(shuffled.done).forEach((id) => expect(shuffled.cells).toContain(id))
  })
})

describe('bingo state validation', () => {
  it('accepts the default state and rejects corrupt data', () => {
    expect(validateBingoState(defaultBingoState())).toBe(true)
    expect(validateBingoState(null)).toBe(false)
    expect(validateBingoState({ cells: [], done: {} })).toBe(false)
    const moved = defaultBingoState()
    ;[moved.cells[0], moved.cells[12]] = [moved.cells[12], moved.cells[0]]
    expect(validateBingoState(moved)).toBe(false)
  })
})

describe('custom bingo challenges', () => {
  it('adds, edits, swaps, validates and resets custom challenges without losing them', () => {
    const added = addCustomTile(defaultBingoState(), 'Find a hidden landmark')
    const customId = added.customTiles[0].id
    expect(poolTileIds(added)).toContain(customId)
    expect(validateBingoState(added)).toBe(true)
    expect(addCustomTile(added, 'find a hidden landmark')).toBe(added)

    const onBoard = replaceTile(added, 0, customId)
    expect(tileById(onBoard, onBoard.cells[0]).text).toBe('Find a hidden landmark')
    expect(validateBingoState(onBoard)).toBe(true)
    expect(deleteCustomTile(onBoard, customId)).toBe(onBoard)

    const renamed = updateCustomTile(onBoard, customId, 'Find the lighthouse')
    expect(tileById(renamed, customId).text).toBe('Find the lighthouse')
    const reset = resetBingoState(renamed)
    expect(reset.cells).toEqual(defaultBingoState().cells)
    expect(reset.customTiles).toEqual(renamed.customTiles)
    expect(deleteCustomTile(reset, customId).customTiles).toEqual([])
  })

  it('keeps older saved bingo states valid without a custom challenge list', () => {
    const legacy = defaultBingoState()
    delete legacy.customTiles
    expect(validateBingoState(legacy)).toBe(true)
  })
})
