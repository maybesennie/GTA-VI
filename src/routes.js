import { CalendarClock, Gauge, LayoutDashboard, LayoutGrid, ListChecks, Map, Settings } from 'lucide-react'
import Overview from './pages/Overview.jsx'
import Calendar from './pages/Calendar.jsx'
import Bingo from './pages/Bingo.jsx'
import Checklist from './pages/Checklist.jsx'
import Control from './pages/Control.jsx'
import LeonidaMap from './pages/LeonidaMap.jsx'
import SettingsPage from './pages/Settings.jsx'

export const ROUTES = [
  { id: 'overview', label: 'Overview', short: 'Overview', icon: LayoutDashboard, component: Overview },
  { id: 'calendar', label: 'Marathon Calendar', short: 'Calendar', icon: CalendarClock, component: Calendar },
  { id: 'bingo', label: 'GTA VI Bingo', short: 'Bingo', icon: LayoutGrid, component: Bingo },
  { id: 'checklist', label: 'Preparation Checklist', short: 'Checklist', icon: ListChecks, component: Checklist },
  { id: 'control', label: 'Marathon Control', short: 'Control', icon: Gauge, component: Control },
  { id: 'map', label: 'Leonida Map', short: 'Map', icon: Map, component: LeonidaMap },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: Settings, component: SettingsPage },
]

export const ROUTE_IDS = ROUTES.map((r) => r.id)
