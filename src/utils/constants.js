// South Africa Standard Time is UTC+2 all year (no daylight saving), so a fixed
// offset is exact and keeps every calculation independent of the PC's own timezone.
export const TZ = 'Africa/Johannesburg'
export const SAST_OFFSET_MS = 2 * 60 * 60 * 1000

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export const PLAYERS = {
  sennie: { id: 'sennie', name: 'Sennie', colorVar: 'var(--pink)', hex: '#FF3D91' },
  simphiwe: { id: 'simphiwe', name: 'Simphiwe', colorVar: 'var(--turq)', hex: '#36E0CF' },
  both: { id: 'both', name: 'Both', colorVar: 'var(--purple)', hex: '#9747FF' },
}
export const PLAYER_IDS = ['sennie', 'simphiwe']
export const ASSIGNABLE = ['sennie', 'simphiwe', 'both']

// 19 November 2026, 00:00 SAST
export const LAUNCH_AT = Date.UTC(2026, 10, 19, 0, 0, 0) - SAST_OFFSET_MS
// 18 November 2026, 16:30 SAST (first scheduled shift)
export const WARMUP_AT = Date.UTC(2026, 10, 18, 16, 30, 0) - SAST_OFFSET_MS

export const TARGET_MIN_HOURS = 48
export const TARGET_MAX_HOURS = 72

export const STORAGE_KEYS = {
  schedule: 'gta6-marathon:v1:schedule',
  bingo: 'gta6-marathon:v1:bingo',
  checklist: 'gta6-marathon:v1:checklist',
  timer: 'gta6-marathon:v1:timer',
  handovers: 'gta6-marathon:v1:handovers',
  notes: 'gta6-marathon:v1:notes',
  splash: 'gta6-marathon:v1:splash',
}
