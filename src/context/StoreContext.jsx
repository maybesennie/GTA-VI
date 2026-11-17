import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { STORAGE_KEYS } from '../utils/constants.js'
import { defaultSchedule, validateSchedule } from '../utils/schedule.js'
import { defaultBingoState, validateBingoState } from '../utils/bingo.js'
import { defaultChecklistState, validateChecklist } from '../utils/checklist.js'
import { defaultSettingsState, validateSettingsState } from '../utils/settings.js'
import {
  elapsedMs,
  endTimer,
  initialTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  validateHandovers,
  validateNotes,
  validateTimer,
} from '../utils/marathon.js'
import { uid } from '../utils/id.js'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [shifts, setShifts] = useLocalStorage(STORAGE_KEYS.schedule, defaultSchedule, validateSchedule)
  const [bingo, setBingo] = useLocalStorage(STORAGE_KEYS.bingo, defaultBingoState, validateBingoState)
  const [checklist, setChecklist] = useLocalStorage(STORAGE_KEYS.checklist, defaultChecklistState, validateChecklist)
  const [timer, setTimer] = useLocalStorage(STORAGE_KEYS.timer, initialTimer, validateTimer)
  const [handovers, setHandovers] = useLocalStorage(STORAGE_KEYS.handovers, () => [], validateHandovers)
  const [notes, setNotes] = useLocalStorage(STORAGE_KEYS.notes, () => [], validateNotes)
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, defaultSettingsState, validateSettingsState)

  const updateSettings = useCallback(
    (patch) =>
      setSettings((current) => ({
        ...current,
        ...patch,
        names: patch.names ? { ...current.names, ...patch.names } : current.names,
      })),
    [setSettings],
  )

  // Schedule
  const addShift = useCallback(
    (values) => setShifts((list) => [...list, { id: uid('shift'), ...values }]),
    [setShifts],
  )
  const updateShift = useCallback(
    (id, patch) => setShifts((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    [setShifts],
  )
  const deleteShift = useCallback((id) => setShifts((list) => list.filter((s) => s.id !== id)), [setShifts])
  const resetSchedule = useCallback(() => setShifts(defaultSchedule()), [setShifts])

  // Marathon clock
  const startMarathon = useCallback(() => setTimer(startTimer(Date.now())), [setTimer])
  const pauseMarathon = useCallback(() => setTimer((t) => pauseTimer(t, Date.now())), [setTimer])
  const resumeMarathon = useCallback(() => setTimer((t) => resumeTimer(t, Date.now())), [setTimer])
  const endMarathon = useCallback(() => setTimer((t) => endTimer(t, Date.now())), [setTimer])

  // Handover log
  const recordHandover = useCallback(
    (player, note = '') => {
      const at = Date.now()
      const entry = {
        id: uid('handover'),
        player,
        at,
        note: note.trim(),
        elapsedMs: timer.status === 'idle' ? null : elapsedMs(timer, at),
      }
      setHandovers((list) => [...list, entry])
    },
    [timer, setHandovers],
  )
  const deleteHandover = useCallback((id) => setHandovers((list) => list.filter((h) => h.id !== id)), [setHandovers])

  // Notes
  const addNote = useCallback(
    (author, text) => {
      const clean = text.trim().slice(0, 500)
      if (!clean) return
      setNotes((list) => [...list, { id: uid('note'), author, text: clean, at: Date.now() }])
    },
    [setNotes],
  )
  const deleteNote = useCallback((id) => setNotes((list) => list.filter((n) => n.id !== id)), [setNotes])

  const value = useMemo(
    () => ({
      shifts,
      addShift,
      updateShift,
      deleteShift,
      resetSchedule,
      bingo,
      setBingo,
      checklist,
      setChecklist,
      timer,
      startMarathon,
      pauseMarathon,
      resumeMarathon,
      endMarathon,
      handovers,
      recordHandover,
      deleteHandover,
      notes,
      addNote,
      deleteNote,
      settings,
      updateSettings,
    }),
    [
      shifts,
      addShift,
      updateShift,
      deleteShift,
      resetSchedule,
      bingo,
      setBingo,
      checklist,
      setChecklist,
      timer,
      startMarathon,
      pauseMarathon,
      resumeMarathon,
      endMarathon,
      handovers,
      recordHandover,
      deleteHandover,
      notes,
      addNote,
      deleteNote,
      settings,
      updateSettings,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
