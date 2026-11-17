import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/overview.css'
import './styles/calendar.css'
import './styles/bingo.css'
import './styles/checklist.css'
import './styles/control.css'
import './styles/settings.css'
import './styles/map.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
