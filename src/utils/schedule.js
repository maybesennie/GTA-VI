import { DAY, HOUR, MINUTE, PLAYER_IDS, ASSIGNABLE } from './constants.js'
import { roundUpTo, sastDate, startOfDay } from './time.js'

export const ACTIVITY_TYPES = {
  gaming: { id: 'gaming', label: 'Gaming', rest: false, defaultMinutes: 240 },
  sleep: { id: 'sleep', label: 'Sleep', rest: true, defaultMinutes: 360 },
  meal: { id: 'meal', label: 'Meal break', rest: true, defaultMinutes: 45 },
  personal: { id: 'personal', label: 'Shower / personal', rest: true, defaultMinutes: 30 },
  transition: { id: 'transition', label: 'Transition', rest: false, defaultMinutes: 30 },
}
export const ACTIVITY_ORDER = ['gaming', 'sleep', 'meal', 'personal', 'transition']

const d = (day, hour, minute) => sastDate(2026, 11, day, hour, minute)

/** The starting schedule. Everything from 04:00 on 19 Nov is flagged flexible. */
export function defaultSchedule() {
  return [
    {
      id: 'shift-1',
      player: 'sennie',
      type: 'gaming',
      title: 'GTA V',
      start: d(18, 16, 30),
      end: d(18, 23, 30),
      notes: 'Warm-up session before launch.',
      flexible: false,
    },
    {
      id: 'shift-2',
      player: 'both',
      type: 'transition',
      title: 'Transition and preparation',
      start: d(18, 23, 30),
      end: d(19, 0, 0),
      notes: 'Final checks, snacks within reach, ready for midnight.',
      flexible: false,
    },
    {
      id: 'shift-3',
      player: 'simphiwe',
      type: 'gaming',
      title: 'GTA VI',
      start: d(19, 0, 0),
      end: d(19, 4, 0),
      notes: 'Opening shift.',
      flexible: false,
    },
    {
      id: 'shift-4',
      player: 'sennie',
      type: 'gaming',
      title: 'GTA VI',
      start: d(19, 4, 0),
      end: d(19, 9, 0),
      notes: 'Approximately 5 hours.',
      flexible: true,
    },
    {
      id: 'shift-5',
      player: 'sennie',
      type: 'personal',
      title: 'Shower, food and personal break',
      start: d(19, 9, 0),
      end: d(19, 10, 30),
      notes: 'Planned 1–2 hours while Simphiwe rests.',
      flexible: true,
    },
    {
      id: 'shift-6',
      player: 'simphiwe',
      type: 'sleep',
      title: 'Rest',
      start: d(19, 9, 0),
      end: d(19, 10, 30),
      notes: '',
      flexible: true,
    },
    {
      id: 'shift-7',
      player: 'sennie',
      type: 'gaming',
      title: 'GTA VI',
      start: d(19, 10, 30),
      end: d(19, 14, 30),
      notes: 'Second session, planned 3–5 hours.',
      flexible: true,
    },
    {
      id: 'shift-8',
      player: 'sennie',
      type: 'sleep',
      title: 'Sleep',
      start: d(19, 14, 30),
      end: d(19, 20, 30),
      notes: 'Length depends on how the session goes.',
      flexible: true,
    },
    {
      id: 'shift-9',
      player: 'simphiwe',
      type: 'gaming',
      title: 'GTA VI',
      start: d(19, 14, 30),
      end: d(19, 20, 30),
      notes: 'Simphiwe takes over while Sennie sleeps.',
      flexible: true,
    },
  ]
}

export const sortShifts = (shifts) =>
  [...shifts].sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id))

export const playersOf = (shift) => (shift.player === 'both' ? PLAYER_IDS : [shift.player])

export const isLive = (shift, now) => shift.start <= now && now < shift.end

export const liveShifts = (shifts, now) => sortShifts(shifts).filter((s) => isLive(s, now))

/** The gaming shift that is running right now (who is supposed to be playing). */
export function currentGamingShift(shifts, now) {
  return liveShifts(shifts, now).find((s) => s.type === 'gaming') || null
}

/** The next shift of any kind that has not started yet. */
export function nextShift(shifts, now) {
  return sortShifts(shifts).find((s) => s.start > now) || null
}

/**
 * Next player rotation: the next upcoming gaming shift that belongs to a
 * different player than the one currently on duty.
 */
export function nextRotation(shifts, now, currentPlayerId = null) {
  return (
    sortShifts(shifts).find(
      (s) =>
        s.type === 'gaming' &&
        s.start > now &&
        (!currentPlayerId || currentPlayerId === 'both' || s.player !== currentPlayerId),
    ) || null
  )
}

/** Planned and completed gaming / rest time for each player (transitions are ignored). */
export function playerTotals(shifts, now) {
  const totals = {}
  PLAYER_IDS.forEach((id) => {
    totals[id] = { gaming: { planned: 0, done: 0 }, rest: { planned: 0, done: 0 } }
  })
  shifts.forEach((s) => {
    if (s.type === 'transition') return
    const bucket = ACTIVITY_TYPES[s.type]?.rest ? 'rest' : 'gaming'
    const planned = Math.max(0, s.end - s.start)
    const done = Math.min(planned, Math.max(0, now - s.start))
    playersOf(s).forEach((p) => {
      totals[p][bucket].planned += planned
      totals[p][bucket].done += done
    })
  })
  return totals
}

export function validateShift({ player, type, start, end }) {
  if (!ASSIGNABLE.includes(player)) return 'Choose who this shift belongs to.'
  if (!ACTIVITY_TYPES[type]) return 'Choose an activity type.'
  if (!Number.isFinite(start)) return 'Enter a valid start time.'
  if (!Number.isFinite(end)) return 'Enter a valid end time.'
  if (end <= start) return 'The end time must be after the start time.'
  if (end - start > DAY) return "A single shift can't be longer than 24 hours. Split it into two."
  return null
}

/** Shifts that overlap this one for the same player (transitions never conflict). */
export function findConflicts(shift, shifts) {
  if (shift.type === 'transition') return []
  const mine = playersOf(shift)
  return shifts.filter(
    (o) =>
      o.id !== shift.id &&
      o.type !== 'transition' &&
      shift.start < o.end &&
      o.start < shift.end &&
      playersOf(o).some((p) => mine.includes(p)),
  )
}

/** Sensible defaults for a brand-new shift: appended after the last one. */
export function suggestNewShift(shifts, type, now) {
  const latestEnd = shifts.reduce((max, s) => Math.max(max, s.end), 0)
  const start = Math.max(latestEnd, roundUpTo(now))
  const minutes = ACTIVITY_TYPES[type].defaultMinutes
  const gaming = sortShifts(shifts).filter((s) => s.type === 'gaming')
  const last = gaming[gaming.length - 1]
  let player = 'sennie'
  if (last) {
    player =
      type === 'gaming'
        ? last.player === 'sennie'
          ? 'simphiwe'
          : 'sennie'
        : last.player === 'both'
          ? 'sennie'
          : last.player
  }
  return {
    player,
    type,
    title: '',
    start,
    end: start + minutes * MINUTE,
    notes: '',
    flexible: false,
  }
}

/** Day start timestamps (SAST) covering every shift. */
export function dayRange(shifts) {
  if (!shifts.length) return []
  const first = startOfDay(Math.min(...shifts.map((s) => s.start)))
  const last = startOfDay(Math.max(...shifts.map((s) => s.end)) - 1)
  const days = []
  for (let t = first; t <= last; t += DAY) days.push(t)
  return days
}

/** Positioned segments (percent of a 24h strip) for one player on one day. */
export function laneSegments(shifts, dayStart, playerId) {
  const dayEnd = dayStart + DAY
  return shifts
    .filter((s) => playersOf(s).includes(playerId) && s.end > dayStart && s.start < dayEnd)
    .map((s) => {
      const from = Math.max(s.start, dayStart)
      const to = Math.min(s.end, dayEnd)
      return {
        id: s.id,
        shift: s,
        left: ((from - dayStart) / DAY) * 100,
        width: ((to - from) / DAY) * 100,
      }
    })
}

export function validateSchedule(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        ASSIGNABLE.includes(s.player) &&
        ACTIVITY_TYPES[s.type] &&
        Number.isFinite(s.start) &&
        Number.isFinite(s.end),
    )
  )
}

export { HOUR }
