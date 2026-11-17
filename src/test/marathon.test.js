import { describe, expect, it } from 'vitest'
import { HOUR, MINUTE } from '../utils/constants.js'
import { elapsedMs, endTimer, initialTimer, pauseTimer, resumeTimer, startTimer, validateTimer } from '../utils/marathon.js'
import {
  DEFAULT_CATEGORIES,
  addCustomItem,
  categoryProgress,
  defaultChecklistState,
  deleteCustomItem,
  overallProgress,
  resetChecklist,
  toggleItem,
  validateChecklist,
} from '../utils/checklist.js'
import { readStored, writeStored } from '../utils/storage.js'

describe('marathon timer', () => {
  it('starts idle with zero elapsed', () => {
    expect(elapsedMs(initialTimer(), 123456)).toBe(0)
  })

  it('counts elapsed time while running', () => {
    const t = startTimer(1000)
    expect(t.status).toBe('running')
    expect(elapsedMs(t, 1000 + 2 * HOUR)).toBe(2 * HOUR)
  })

  it('pause freezes the clock and resume continues without counting the gap', () => {
    let t = startTimer(0)
    t = pauseTimer(t, HOUR)
    expect(t.status).toBe('paused')
    expect(elapsedMs(t, 10 * HOUR)).toBe(HOUR)
    t = resumeTimer(t, 5 * HOUR)
    expect(elapsedMs(t, 5 * HOUR + 30 * MINUTE)).toBe(1.5 * HOUR)
  })

  it('end freezes the final time whether running or paused', () => {
    const running = endTimer(startTimer(0), 3 * HOUR)
    expect(running.status).toBe('ended')
    expect(elapsedMs(running, 99 * HOUR)).toBe(3 * HOUR)
    const paused = endTimer(pauseTimer(startTimer(0), 2 * HOUR), 9 * HOUR)
    expect(elapsedMs(paused, 99 * HOUR)).toBe(2 * HOUR)
  })

  it('ignores invalid transitions', () => {
    const idle = initialTimer()
    expect(pauseTimer(idle, 1)).toBe(idle)
    expect(resumeTimer(idle, 1)).toBe(idle)
    expect(endTimer(idle, 1)).toBe(idle)
    const running = startTimer(0)
    expect(resumeTimer(running, 5)).toBe(running)
  })

  it('records events and survives a JSON round trip (page refresh while running)', () => {
    let t = startTimer(0)
    t = pauseTimer(t, 10)
    t = resumeTimer(t, 20)
    expect(t.events.map((e) => e.type)).toEqual(['start', 'pause', 'resume'])
    const restored = JSON.parse(JSON.stringify(t))
    expect(validateTimer(restored)).toBe(true)
    expect(elapsedMs(restored, 20 + HOUR)).toBe(10 + HOUR)
  })

  it('rejects corrupt timers', () => {
    expect(validateTimer({ status: 'running', accumulated: 0, events: [] })).toBe(false)
    expect(validateTimer(null)).toBe(false)
  })
})

describe('checklist', () => {
  it('contains every category and item from the brief', () => {
    expect(DEFAULT_CATEGORIES.map((c) => c.title)).toEqual([
      'Food & Drinks',
      'Gaming Equipment',
      'Streaming & Recording',
      'Personal Preparation',
      'Final Preparation',
    ])
    expect(DEFAULT_CATEGORIES.map((c) => c.items.length)).toEqual([5, 9, 5, 6, 7])
  })

  it('toggles items and computes category and overall percentages', () => {
    let s = defaultChecklistState()
    s = toggleItem(s, 'food-1')
    s = toggleItem(s, 'food-2')
    expect(categoryProgress(DEFAULT_CATEGORIES[0], s)).toEqual({ done: 2, total: 5, percent: 40 })
    expect(overallProgress(s)).toMatchObject({ done: 2, total: 32, percent: 6 })
    s = toggleItem(s, 'food-1')
    expect(categoryProgress(DEFAULT_CATEGORIES[0], s).done).toBe(1)
  })

  it('adds and deletes custom items, counting them in progress', () => {
    let s = defaultChecklistState()
    s = addCustomItem(s, 'food', '  Biltong  ')
    const item = s.custom.food[0]
    expect(item.text).toBe('Biltong')
    s = toggleItem(s, item.id)
    expect(categoryProgress(DEFAULT_CATEGORIES[0], s)).toEqual({ done: 1, total: 6, percent: 17 })
    s = deleteCustomItem(s, 'food', item.id)
    expect(categoryProgress(DEFAULT_CATEGORIES[0], s)).toEqual({ done: 0, total: 5, percent: 0 })
    expect(s.checked[item.id]).toBeUndefined()
  })

  it('ignores blank custom items', () => {
    const s = defaultChecklistState()
    expect(addCustomItem(s, 'food', '   ')).toBe(s)
  })

  it('reset unticks everything and optionally removes custom items', () => {
    let s = addCustomItem(defaultChecklistState(), 'gaming', 'Spare batteries')
    s = toggleItem(toggleItem(s, 'gaming-1'), s.custom.gaming[0].id)
    const kept = resetChecklist(s)
    expect(kept.checked).toEqual({})
    expect(kept.custom.gaming).toHaveLength(1)
    expect(resetChecklist(s, { removeCustom: true }).custom.gaming).toHaveLength(0)
  })

  it('validates stored data', () => {
    expect(validateChecklist(defaultChecklistState())).toBe(true)
    expect(validateChecklist({ checked: {}, custom: { food: 'x' } })).toBe(false)
    expect(validateChecklist(null)).toBe(false)
  })
})

describe('storage helpers', () => {
  it('round-trips values', () => {
    expect(writeStored('k', { a: 1 })).toBe(true)
    expect(readStored('k', null)).toEqual({ a: 1 })
  })

  it('falls back on missing, corrupt or invalid data', () => {
    expect(readStored('missing', () => 'dflt')).toBe('dflt')
    window.localStorage.setItem('bad', '{not json')
    expect(readStored('bad', 'dflt')).toBe('dflt')
    writeStored('v', 5)
    expect(readStored('v', 'dflt', (x) => typeof x === 'string')).toBe('dflt')
  })
})
