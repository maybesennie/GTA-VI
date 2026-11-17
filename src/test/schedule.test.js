import { describe, expect, it } from 'vitest'
import { DAY, HOUR, LAUNCH_AT, MINUTE, WARMUP_AT } from '../utils/constants.js'
import {
  currentGamingShift,
  defaultSchedule,
  dayRange,
  findConflicts,
  laneSegments,
  liveShifts,
  nextRotation,
  nextShift,
  playerTotals,
  sortShifts,
  suggestNewShift,
  validateSchedule,
  validateShift,
} from '../utils/schedule.js'
import {
  formatDuration,
  formatHMS,
  formatSAClock,
  formatTime,
  fromInputValue,
  sastDate,
  sastParts,
  splitDuration,
  toInputValue,
} from '../utils/time.js'

const at = (day, h, m = 0) => sastDate(2026, 11, day, h, m)

describe('time helpers (South Africa, UTC+2)', () => {
  it('launch is 19 Nov 2026 00:00 SAST = 18 Nov 22:00 UTC', () => {
    expect(new Date(LAUNCH_AT).toISOString()).toBe('2026-11-18T22:00:00.000Z')
    expect(WARMUP_AT).toBe(at(18, 16, 30))
  })

  it('formats wall-clock time independent of the machine timezone', () => {
    expect(formatTime(LAUNCH_AT)).toBe('00:00')
    expect(sastParts(at(19, 4, 15))).toMatchObject({ day: 19, month: 11, hour: 4, minute: 15 })
  })

  it('Intl clock agrees with the fixed SAST offset', () => {
    expect(formatSAClock(at(18, 23, 5) + 9000)).toBe('23:05:09')
  })

  it('round-trips datetime-local values', () => {
    expect(toInputValue(at(19, 4, 0))).toBe('2026-11-19T04:00')
    expect(fromInputValue('2026-11-19T04:00')).toBe(at(19, 4, 0))
    expect(fromInputValue('')).toBeNaN()
    expect(fromInputValue('garbage')).toBeNaN()
  })

  it('formats durations and timers', () => {
    expect(formatDuration(4.5 * HOUR)).toBe('4h 30m')
    expect(formatDuration(45 * MINUTE)).toBe('45m')
    expect(formatDuration(6 * HOUR)).toBe('6h')
    expect(formatHMS(27 * HOUR + 4 * MINUTE + 9000)).toBe('27:04:09')
    expect(formatHMS(-5)).toBe('00:00:00')
  })

  it('splits a countdown into days, hours, minutes, seconds', () => {
    expect(splitDuration(9 * DAY + 2 * HOUR + 3 * MINUTE + 4000)).toEqual({ days: 9, hours: 2, minutes: 3, seconds: 4 })
  })
})

describe('default schedule', () => {
  const shifts = defaultSchedule()

  it('is valid and starts with Sennie on GTA V at 16:30', () => {
    expect(validateSchedule(shifts)).toBe(true)
    const first = sortShifts(shifts)[0]
    expect(first).toMatchObject({ player: 'sennie', type: 'gaming', title: 'GTA V', start: at(18, 16, 30), end: at(18, 23, 30) })
  })

  it('has the 23:30–00:00 transition', () => {
    const t = shifts.find((s) => s.type === 'transition')
    expect([t.start, t.end]).toEqual([at(18, 23, 30), at(19, 0, 0)])
  })

  it('has Simphiwe 00:00–04:00 then Sennie 04:00–09:00 on 19 Nov', () => {
    const sim = shifts.find((s) => s.player === 'simphiwe' && s.type === 'gaming' && s.start === at(19, 0))
    const sen = shifts.find((s) => s.player === 'sennie' && s.type === 'gaming' && s.start === at(19, 4))
    expect(sim.end).toBe(at(19, 4))
    expect(sen.end).toBe(at(19, 9))
    expect((sen.end - sen.start) / HOUR).toBe(5)
  })

  it('gives Sennie a 1–2h break while Simphiwe rests, then a 3–5h session', () => {
    const brk = shifts.find((s) => s.player === 'sennie' && s.type === 'personal')
    const rest = shifts.find((s) => s.player === 'simphiwe' && s.type === 'sleep')
    expect((brk.end - brk.start) / HOUR).toBeGreaterThanOrEqual(1)
    expect((brk.end - brk.start) / HOUR).toBeLessThanOrEqual(2)
    expect([rest.start, rest.end]).toEqual([brk.start, brk.end])
    const back = shifts.find((s) => s.player === 'sennie' && s.type === 'gaming' && s.start === brk.end)
    expect((back.end - back.start) / HOUR).toBeGreaterThanOrEqual(3)
    expect((back.end - back.start) / HOUR).toBeLessThanOrEqual(5)
  })

  it('has Sennie sleeping while Simphiwe takes over, and later rotations flagged flexible', () => {
    const sleep = shifts.find((s) => s.player === 'sennie' && s.type === 'sleep')
    const takeover = shifts.find((s) => s.player === 'simphiwe' && s.type === 'gaming' && s.start === sleep.start)
    expect(takeover).toBeTruthy()
    expect(shifts.filter((s) => s.start >= at(19, 4)).every((s) => s.flexible)).toBe(true)
  })

  it('has no same-player overlaps', () => {
    shifts.forEach((s) => expect(findConflicts(s, shifts)).toEqual([]))
  })
})

describe('live / next calculations', () => {
  const shifts = defaultSchedule()

  it('before the schedule starts nothing is live and the next shift is the 16:30 warm-up', () => {
    const now = at(10, 13, 16)
    expect(liveShifts(shifts, now)).toEqual([])
    expect(currentGamingShift(shifts, now)).toBeNull()
    expect(nextShift(shifts, now).id).toBe('shift-1')
  })

  it('at 17:00 on 18 Nov Sennie is on duty and the next rotation is Simphiwe at 00:00', () => {
    const now = at(18, 17, 0)
    const cur = currentGamingShift(shifts, now)
    expect(cur.player).toBe('sennie')
    expect(nextShift(shifts, now).type).toBe('transition')
    const rot = nextRotation(shifts, now, cur.player)
    expect(rot.player).toBe('simphiwe')
    expect(rot.start).toBe(at(19, 0))
  })

  it('shift boundaries are start-inclusive, end-exclusive', () => {
    expect(currentGamingShift(shifts, at(19, 0)).player).toBe('simphiwe')
    expect(currentGamingShift(shifts, at(18, 23, 30) - 1).player).toBe('sennie')
    expect(currentGamingShift(shifts, at(18, 23, 30))).toBeNull()
    expect(currentGamingShift(shifts, at(19, 0) - 1)).toBeNull()
    expect(currentGamingShift(shifts, at(19, 4)).player).toBe('sennie')
  })

  it('during the transition nobody is on the controller', () => {
    expect(currentGamingShift(shifts, at(18, 23, 45))).toBeNull()
  })

  it('during the break Sennie is on personal time and nobody plays', () => {
    const now = at(19, 9, 30)
    expect(currentGamingShift(shifts, now)).toBeNull()
    expect(liveShifts(shifts, now)).toHaveLength(2)
  })

  it('returns null after the last shift', () => {
    expect(nextShift(shifts, at(25, 0))).toBeNull()
  })
})

describe('player totals', () => {
  const shifts = defaultSchedule()

  it('sums planned gaming and rest per player', () => {
    const t = playerTotals(shifts, 0)
    // Sennie: 7 + 5 + 4 = 16h gaming; 1.5 + 6 = 7.5h rest
    expect(t.sennie.gaming.planned / HOUR).toBe(16)
    expect(t.sennie.rest.planned / HOUR).toBe(7.5)
    // Simphiwe: 4 + 6 = 10h gaming; 1.5h rest
    expect(t.simphiwe.gaming.planned / HOUR).toBe(10)
    expect(t.simphiwe.rest.planned / HOUR).toBe(1.5)
    expect(t.sennie.gaming.done).toBe(0)
  })

  it('counts progress only up to now', () => {
    const t = playerTotals(shifts, at(19, 2))
    expect(t.sennie.gaming.done / HOUR).toBe(7)
    expect(t.simphiwe.gaming.done / HOUR).toBe(2)
  })

  it('splits a shared shift across both players and ignores transitions', () => {
    const list = [
      { id: 'a', player: 'both', type: 'gaming', start: 0, end: 2 * HOUR },
      { id: 'b', player: 'both', type: 'transition', start: 2 * HOUR, end: 3 * HOUR },
    ]
    const t = playerTotals(list, 10 * HOUR)
    expect(t.sennie.gaming.planned).toBe(2 * HOUR)
    expect(t.simphiwe.gaming.planned).toBe(2 * HOUR)
  })
})

describe('editing: validation, conflicts, suggestions', () => {
  it('validates shifts', () => {
    expect(validateShift({ player: 'sennie', type: 'gaming', start: 0, end: HOUR })).toBeNull()
    expect(validateShift({ player: 'sennie', type: 'gaming', start: HOUR, end: HOUR })).toMatch(/after/)
    expect(validateShift({ player: 'sennie', type: 'gaming', start: NaN, end: HOUR })).toMatch(/start/)
    expect(validateShift({ player: 'x', type: 'gaming', start: 0, end: HOUR })).toMatch(/who/)
    expect(validateShift({ player: 'sennie', type: 'gaming', start: 0, end: 25 * HOUR })).toMatch(/24 hours/)
  })

  it('detects overlaps for the same player only', () => {
    const a = { id: 'a', player: 'sennie', type: 'gaming', start: 0, end: 4 * HOUR }
    const b = { id: 'b', player: 'sennie', type: 'sleep', start: 3 * HOUR, end: 6 * HOUR }
    const c = { id: 'c', player: 'simphiwe', type: 'gaming', start: 0, end: 4 * HOUR }
    expect(findConflicts(a, [a, b, c]).map((s) => s.id)).toEqual(['b'])
    expect(findConflicts({ ...a, end: 3 * HOUR }, [a, b, c])).toEqual([])
  })

  it('suggests the next shift after the last one, alternating players', () => {
    const shifts = defaultSchedule()
    const s = suggestNewShift(shifts, 'gaming', at(10, 13))
    expect(s.start).toBe(at(19, 20, 30))
    expect(s.player).toBe('sennie')
    expect(s.end - s.start).toBe(4 * HOUR)
  })

  it('rejects invalid stored schedules', () => {
    expect(validateSchedule([{ id: 'x' }])).toBe(false)
    expect(validateSchedule('nope')).toBe(false)
  })
})

describe('day lanes', () => {
  it('covers 18 and 19 Nov and clips shifts to each day', () => {
    const shifts = defaultSchedule()
    const days = dayRange(shifts)
    expect(days).toEqual([at(18, 0), at(19, 0)])
    const seg = laneSegments(shifts, at(18, 0), 'sennie')[0]
    expect(seg.left).toBeCloseTo((16.5 / 24) * 100, 5)
    expect(seg.width).toBeCloseTo((7 / 24) * 100, 5)
  })
})
