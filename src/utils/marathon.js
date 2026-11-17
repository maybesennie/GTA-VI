import { uid } from './id.js'
import { PLAYER_IDS } from './constants.js'

export const initialTimer = () => ({
  status: 'idle', // idle | running | paused | ended
  startedAt: null,
  accumulated: 0, // ms banked from finished running stretches
  resumedAt: null, // when the current running stretch began
  endedAt: null,
  events: [],
})

const event = (type, at) => ({ id: uid('ev'), type, at })

export function startTimer(now) {
  return {
    status: 'running',
    startedAt: now,
    accumulated: 0,
    resumedAt: now,
    endedAt: null,
    events: [event('start', now)],
  }
}

export function pauseTimer(timer, now) {
  if (timer.status !== 'running') return timer
  return {
    ...timer,
    status: 'paused',
    accumulated: timer.accumulated + Math.max(0, now - timer.resumedAt),
    resumedAt: null,
    events: [...timer.events, event('pause', now)],
  }
}

export function resumeTimer(timer, now) {
  if (timer.status !== 'paused') return timer
  return { ...timer, status: 'running', resumedAt: now, events: [...timer.events, event('resume', now)] }
}

export function endTimer(timer, now) {
  if (timer.status !== 'running' && timer.status !== 'paused') return timer
  const banked = timer.status === 'running' ? Math.max(0, now - timer.resumedAt) : 0
  return {
    ...timer,
    status: 'ended',
    accumulated: timer.accumulated + banked,
    resumedAt: null,
    endedAt: now,
    events: [...timer.events, event('end', now)],
  }
}

export function elapsedMs(timer, now) {
  if (timer.status === 'running') return timer.accumulated + Math.max(0, now - timer.resumedAt)
  return timer.accumulated
}

export function validateTimer(value) {
  return (
    !!value &&
    ['idle', 'running', 'paused', 'ended'].includes(value.status) &&
    Number.isFinite(value.accumulated) &&
    Array.isArray(value.events) &&
    (value.status !== 'running' || Number.isFinite(value.resumedAt))
  )
}

export function validateHandovers(value) {
  return (
    Array.isArray(value) &&
    value.every((h) => h && typeof h.id === 'string' && PLAYER_IDS.includes(h.player) && Number.isFinite(h.at))
  )
}

export function validateNotes(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (n) => n && typeof n.id === 'string' && PLAYER_IDS.includes(n.author) && typeof n.text === 'string' && Number.isFinite(n.at),
    )
  )
}
