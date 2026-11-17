import { useEffect, useState } from 'react'
import { readStored, writeStored } from '../utils/storage.js'

/**
 * useState that persists to localStorage and stays in sync across browser tabs.
 * `validate` guards against corrupt or outdated data: failing it resets to the default.
 */
export function useLocalStorage(key, initial, validate) {
  const [value, setValue] = useState(() => readStored(key, initial, validate))

  useEffect(() => {
    writeStored(key, value)
  }, [key, value])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return
      setValue(readStored(key, initial, validate))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // `initial` and `validate` are module-level constants at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue]
}
