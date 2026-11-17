import { SAST_OFFSET_MS, TZ, MINUTE, HOUR, DAY } from './constants.js'

const pad = (n) => String(n).padStart(2, '0')
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Break an epoch timestamp into South Africa wall-clock parts. */
export function sastParts(ms) {
  const d = new Date(ms + SAST_OFFSET_MS)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(),
  }
}

/** Build an epoch timestamp from a South Africa wall-clock date and time. */
export function sastDate(year, month, day, hour = 0, minute = 0) {
  return Date.UTC(year, month - 1, day, hour, minute) - SAST_OFFSET_MS
}

/** Value for an <input type="datetime-local"> showing SAST wall-clock time. */
export function toInputValue(ms) {
  const p = sastParts(ms)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

/** Parse a datetime-local value as SAST. Returns NaN when invalid. */
export function fromInputValue(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || '')
  if (!m) return NaN
  return sastDate(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]))
}

export function dayKey(ms) {
  const p = sastParts(ms)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

export function startOfDay(ms) {
  const p = sastParts(ms)
  return sastDate(p.year, p.month, p.day)
}

export function roundUpTo(ms, stepMs = 15 * MINUTE) {
  return Math.ceil(ms / stepMs) * stepMs
}

export function formatTime(ms) {
  const p = sastParts(ms)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

export function formatClock(ms) {
  const p = sastParts(ms)
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`
}

export function formatDayLabel(ms) {
  const p = sastParts(ms)
  return `${WEEKDAYS[p.weekday]} ${p.day} ${MONTHS[p.month - 1]}`
}

export function formatDateTime(ms) {
  return `${formatDayLabel(ms)} · ${formatTime(ms)}`
}

/** "4h 30m", "45m", "6h". */
export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / MINUTE))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function toHours(ms, digits = 1) {
  const f = 10 ** digits
  return Math.round((ms / HOUR) * f) / f
}

export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** Elapsed style timer: "27:04:09" (hours keep counting past 24). */
export function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

let clockFmt
let dateFmt

/** Live clock for Africa/Johannesburg, via Intl (falls back to SAST maths). */
export function formatSAClock(ms) {
  try {
    clockFmt ||= new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    return clockFmt.format(ms)
  } catch {
    return formatClock(ms)
  }
}

export function formatSADate(ms) {
  try {
    dateFmt ||= new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return dateFmt.format(ms)
  } catch {
    return formatDayLabel(ms)
  }
}

export { MINUTE, HOUR, DAY }
