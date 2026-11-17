export const BOARD_SIZE = 5
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE
export const CENTER_INDEX = 12
export const CENTER_ID = 'b13'

// The reference board, row by row (left to right, top to bottom).
export const BOARD_TEXT = [
  'First carjack',
  'Police chase',
  'Beach at sunrise',
  'Jet ski',
  'Take a selfie',
  'Scuba dive',
  'Catch a fish',
  'Dirt bike',
  'Go to Nightclub set',
  'Tip a dancer',
  'Airboat ride',
  'Go hunting and kill a bear',
  'Start GTA VI',
  'Mini golf',
  'Gym session',
  'Kayak',
  'Base jump',
  'Win a race',
  'Masked robbery',
  'Escape 6 stars',
  'Visit all regions',
  'Experience bad weather',
  '48 hours',
  'Shooting range',
  'Play past sunrise',
]

// Optional challenge pool: only used if the players choose to swap them in.
export const POOL_TEXT = [
  '24 Hours',
  'Get arrested',
  'Drive across the map on ONE full tank',
  'Find the rarest wildlife',
  'Gain and erase your criminal profile for a robbery',
]

export const ALL_TILES = [
  ...BOARD_TEXT.map((text, i) => ({ id: `b${i + 1}`, text })),
  ...POOL_TEXT.map((text, i) => ({ id: `c${i + 1}`, text })),
]
export const TILE_BY_ID = Object.fromEntries(ALL_TILES.map((t) => [t.id, t]))

const rows = Array.from({ length: BOARD_SIZE }, (_, r) => ({
  id: `row-${r + 1}`,
  label: `Row ${r + 1}`,
  indices: Array.from({ length: BOARD_SIZE }, (_, c) => r * BOARD_SIZE + c),
}))
const cols = Array.from({ length: BOARD_SIZE }, (_, c) => ({
  id: `col-${c + 1}`,
  label: `Column ${c + 1}`,
  indices: Array.from({ length: BOARD_SIZE }, (_, r) => r * BOARD_SIZE + c),
}))
const diagonals = [
  { id: 'diag-main', label: 'Diagonal (top-left to bottom-right)', indices: [0, 6, 12, 18, 24] },
  { id: 'diag-anti', label: 'Diagonal (top-right to bottom-left)', indices: [4, 8, 12, 16, 20] },
]
export const LINES = [...rows, ...cols, ...diagonals]

export const defaultBingoState = () => ({
  cells: BOARD_TEXT.map((_, i) => `b${i + 1}`),
  done: {},
})

export function completedLines(cells, done) {
  return LINES.filter((line) => line.indices.every((i) => done[cells[i]]))
}

export function bingoProgress(state) {
  const completed = state.cells.filter((id) => state.done[id]).length
  return {
    completed,
    total: CELL_COUNT,
    percent: Math.round((completed / CELL_COUNT) * 100),
    lines: completedLines(state.cells, state.done).length,
  }
}

export function toggleTile(state, index) {
  const id = state.cells[index]
  if (!id) return state
  const done = { ...state.done }
  if (done[id]) delete done[id]
  else done[id] = true
  return { ...state, done }
}

/** Lines that are complete in `next` but were not in `prev`. */
export function newlyCompletedLines(prev, next) {
  const before = new Set(completedLines(prev.cells, prev.done).map((l) => l.id))
  return completedLines(next.cells, next.done).filter((l) => !before.has(l.id))
}

/** Swap a pool (or any off-board) tile into a board position. The centre never moves. */
export function replaceTile(state, index, newId) {
  if (index === CENTER_INDEX || !TILE_BY_ID[newId] || state.cells.includes(newId)) return state
  const old = state.cells[index]
  const cells = [...state.cells]
  cells[index] = newId
  const done = { ...state.done }
  delete done[old]
  delete done[newId]
  return { cells, done }
}

export function poolTileIds(state) {
  return ALL_TILES.map((t) => t.id).filter((id) => !state.cells.includes(id))
}

function shuffled(list, rng) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Randomise the 24 non-centre tiles. Progress stays with each tile. With
 * `includePool`, the 24 are drawn from all 29 non-centre tiles instead, and
 * tiles that leave the board lose their progress.
 */
export function shuffleBoard(state, { includePool = false, rng = Math.random } = {}) {
  const source = includePool
    ? ALL_TILES.map((t) => t.id).filter((id) => id !== CENTER_ID)
    : state.cells.filter((_, i) => i !== CENTER_INDEX)
  const picked = shuffled(source, rng).slice(0, CELL_COUNT - 1)
  let k = 0
  const cells = Array.from({ length: CELL_COUNT }, (_, i) => (i === CENTER_INDEX ? CENTER_ID : picked[k++]))
  const done = {}
  cells.forEach((id) => {
    if (state.done[id]) done[id] = true
  })
  return { cells, done }
}

export function validateBingoState(value) {
  if (!value || !Array.isArray(value.cells) || value.cells.length !== CELL_COUNT) return false
  if (!value.done || typeof value.done !== 'object' || Array.isArray(value.done)) return false
  if (value.cells[CENTER_INDEX] !== CENTER_ID) return false
  if (new Set(value.cells).size !== CELL_COUNT) return false
  return value.cells.every((id) => TILE_BY_ID[id])
}
