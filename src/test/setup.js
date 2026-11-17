import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

function createMemoryStorage() {
  const entries = new Map()
  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(String(key)) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => entries.delete(String(key)),
    setItem: (key, value) => entries.set(String(key), String(value)),
  }
}

if (!window.localStorage) {
  Object.defineProperty(window, 'localStorage', { configurable: true, value: createMemoryStorage() })
}
if (!window.sessionStorage) {
  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: createMemoryStorage() })
}
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
  window.location.hash = ''
})
