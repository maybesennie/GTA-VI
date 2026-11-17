import { createContext, useContext, useEffect, useState } from 'react'

const NowContext = createContext(Date.now())

/**
 * One shared ticking clock. Components that call useNow() re-render every
 * second; everything else is left alone. Pass `fixed` (ms) to freeze time in tests.
 */
export function NowProvider({ children, fixed, tickMs = 1000 }) {
  const [now, setNow] = useState(() => fixed ?? Date.now())

  useEffect(() => {
    if (fixed !== undefined) {
      setNow(fixed)
      return undefined
    }
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, tickMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [fixed, tickMs])

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>
}

export const useNow = () => useContext(NowContext)
