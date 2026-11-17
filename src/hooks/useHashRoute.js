import { useCallback, useEffect, useState } from 'react'

/** Tiny hash router (#/calendar) so refresh and the back button keep your place. */
export function useHashRoute(validIds, fallback) {
  const read = useCallback(() => {
    const id = window.location.hash.replace(/^#\/?/, '').split(/[?/]/)[0]
    return validIds.includes(id) ? id : fallback
  }, [validIds, fallback])

  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [read])

  const navigate = useCallback((id) => {
    window.location.hash = `/${id}`
  }, [])

  return [route, navigate]
}
