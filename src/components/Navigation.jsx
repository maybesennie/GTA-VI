import { useNow } from '../hooks/useNow.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { formatSAClock } from '../utils/time.js'
import { ROUTES } from '../routes.js'
import StatusPill from './StatusPill.jsx'

export function Brand() {
  return (
    <div className="brand">
      <span className="brand__mark" aria-hidden="true">
        <span />
      </span>
      <div>
        <p className="brand__kicker">GTA VI Companion</p>
        <p className="brand__name">The Marathon</p>
      </div>
    </div>
  )
}

function SideStatus() {
  const now = useNow()
  const { timer } = useStore()
  return (
    <div className="side-status">
      <StatusPill status={timer.status} />
      <p className="side-status__clock" aria-label="South Africa time">
        {formatSAClock(now)}
      </p>
      <p className="side-status__zone">South Africa (SAST)</p>
    </div>
  )
}

export function Sidebar({ active }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Main">
        <ul className="nav-list">
          {ROUTES.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <a href={`#/${id}`} className="nav-link" aria-current={active === id ? 'page' : undefined}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <SideStatus />
    </aside>
  )
}

export function MobileHeader({ active }) {
  const { timer } = useStore()
  const current = ROUTES.find((r) => r.id === active)
  return (
    <header className="mobile-header">
      <Brand />
      <div className="mobile-header__right">
        <StatusPill status={timer.status} />
        <span className="visually-hidden">Current section: {current?.label}</span>
      </div>
    </header>
  )
}

export function BottomNav({ active }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ROUTES.map(({ id, short, label, icon: Icon }) => (
        <a
          key={id}
          href={`#/${id}`}
          className="bottom-nav__link"
          aria-current={active === id ? 'page' : undefined}
          aria-label={label}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{short}</span>
        </a>
      ))}
    </nav>
  )
}
