/** Safe localStorage helpers: a broken or blocked store never crashes the app. */

export function readStored(key, fallback, validate) {
  const resolveFallback = () => (typeof fallback === 'function' ? fallback() : fallback)
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return resolveFallback()
    const parsed = JSON.parse(raw)
    if (validate && !validate(parsed)) return resolveFallback()
    return parsed
  } catch {
    return resolveFallback()
  }
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
