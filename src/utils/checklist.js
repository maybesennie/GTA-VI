import { uid } from './id.js'

export const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    letter: 'A',
    title: 'Food & Drinks',
    items: ['Red Bulls / energy drinks', 'Snacks', 'Proper meals', 'Water bottles', 'Easy-to-prepare food'],
  },
  {
    id: 'gaming',
    letter: 'B',
    title: 'Gaming Equipment',
    items: [
      'PS5 console',
      'Xbox console (optional)',
      'Controllers',
      'Controller charging cables',
      'Headsets',
      'Microphone',
      'HDMI cables',
      'Extension cords',
      'Stable internet connection',
    ],
  },
  {
    id: 'streaming',
    letter: 'C',
    title: 'Streaming & Recording',
    items: [
      'Streaming software if needed',
      'Capture card if needed',
      'Recording storage',
      'Microphone checks',
      'Internet speed test',
    ],
  },
  {
    id: 'personal',
    letter: 'D',
    title: 'Personal Preparation',
    items: [
      'Shower and hygiene supplies',
      'Comfortable clothes',
      'Blankets',
      'Pillows',
      'Sleeping arrangements',
      'Phone chargers',
    ],
  },
  {
    id: 'final',
    letter: 'E',
    title: 'Final Preparation',
    items: [
      'Clear console storage',
      'Update console software',
      'Update games',
      'Test controllers',
      'Test internet connection',
      'Arrange player handover',
      'Prepare the room',
    ],
  },
].map((cat) => ({
  ...cat,
  items: cat.items.map((text, i) => ({ id: `${cat.id}-${i + 1}`, text })),
}))

export const defaultChecklistState = () => ({
  checked: {},
  custom: Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, []])),
})

export function categoryItems(category, state) {
  const custom = (state.custom[category.id] || []).map((item) => ({ ...item, custom: true }))
  return [...category.items.map((item) => ({ ...item, custom: false })), ...custom]
}

export function categoryProgress(category, state) {
  const items = categoryItems(category, state)
  const done = items.filter((item) => state.checked[item.id]).length
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 }
}

export function overallProgress(state) {
  let done = 0
  let total = 0
  DEFAULT_CATEGORIES.forEach((cat) => {
    const p = categoryProgress(cat, state)
    done += p.done
    total += p.total
  })
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

export function toggleItem(state, itemId) {
  const checked = { ...state.checked }
  if (checked[itemId]) delete checked[itemId]
  else checked[itemId] = true
  return { ...state, checked }
}

export function addCustomItem(state, categoryId, text) {
  const clean = text.trim().slice(0, 80)
  if (!clean) return state
  const list = state.custom[categoryId] || []
  return { ...state, custom: { ...state.custom, [categoryId]: [...list, { id: uid('custom'), text: clean }] } }
}

export function deleteCustomItem(state, categoryId, itemId) {
  const checked = { ...state.checked }
  delete checked[itemId]
  return {
    checked,
    custom: { ...state.custom, [categoryId]: (state.custom[categoryId] || []).filter((i) => i.id !== itemId) },
  }
}

export function resetChecklist(state, { removeCustom = false } = {}) {
  return {
    checked: {},
    custom: removeCustom ? defaultChecklistState().custom : state.custom,
  }
}

export function validateChecklist(value) {
  return (
    !!value &&
    typeof value.checked === 'object' &&
    value.checked !== null &&
    typeof value.custom === 'object' &&
    value.custom !== null &&
    Object.values(value.custom).every(
      (list) => Array.isArray(list) && list.every((i) => i && typeof i.id === 'string' && typeof i.text === 'string'),
    )
  )
}
