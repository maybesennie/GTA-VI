import { useEffect, useRef, useState } from 'react'
import { NowProvider } from './hooks/useNow.jsx'
import { StoreProvider } from './context/StoreContext.jsx'
import { useHashRoute } from './hooks/useHashRoute.js'
import { ROUTES, ROUTE_IDS } from './routes.js'
import { BottomNav, MobileHeader, Sidebar } from './components/Navigation.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import { STORAGE_KEYS } from './utils/constants.js'

function shouldShowSplash() {
  try {
    return !window.sessionStorage.getItem(STORAGE_KEYS.splash)
  } catch {
    return false
  }
}

function Shell() {
  const [route] = useHashRoute(ROUTE_IDS, 'overview')
  const [booting, setBooting] = useState(shouldShowSplash)
  const mainRef = useRef(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (!booting) return undefined
    const id = setTimeout(() => {
      try {
        window.sessionStorage.setItem(STORAGE_KEYS.splash, '1')
      } catch {
        /* private mode: just show the splash again next time */
      }
      setBooting(false)
    }, 900)
    return () => clearTimeout(id)
  }, [booting])

  // Move to the top and hand focus to the page when the section changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [route])

  if (booting) return <SplashScreen />

  const Page = ROUTES.find((r) => r.id === route).component

  return (
    <div className="app">
      <button
        type="button"
        className="skip-link"
        onClick={() => mainRef.current?.focus()}
      >
        Skip to content
      </button>
      <Sidebar active={route} />
      <MobileHeader active={route} />
      <main id="main" className="main" ref={mainRef} tabIndex={-1}>
        <div className="main__inner" key={route}>
          <Page />
        </div>
      </main>
      <BottomNav active={route} />
    </div>
  )
}

export default function App() {
  return (
    <NowProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </NowProvider>
  )
}
