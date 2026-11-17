import { useEffect, useState } from 'react'
import { Eye, EyeOff, Save, ShieldCheck } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'

export default function SettingsPage() {
  const { settings, updateSettings } = useStore()
  const [names, setNames] = useState(settings.names)

  useEffect(() => setNames(settings.names), [settings.names])

  const namesChanged = names.sennie !== settings.names.sennie || names.simphiwe !== settings.names.simphiwe
  const saveNames = (event) => {
    event.preventDefault()
    updateSettings({ names: { sennie: names.sennie.trim(), simphiwe: names.simphiwe.trim() } })
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Personalize the stream</p>
          <h1 className="page__title">Settings</h1>
          <p className="page__lead">Choose the names shown throughout the app and turn on privacy-friendly streamer mode.</p>
        </div>
      </header>

      <section className="card settings-card" aria-labelledby="streamer-mode-title">
        <div className="settings-card__head">
          <span className="settings-card__icon" aria-hidden="true">
            {settings.streamerMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
          <div>
            <h2 id="streamer-mode-title" className="section-title">Streamer mode</h2>
            <p className="muted-line">Quickly mask personal details before sharing your screen.</p>
          </div>
        </div>
        <label className="toggle settings-toggle">
          <input
            type="checkbox"
            checked={settings.streamerMode}
            onChange={(event) => updateSettings({ streamerMode: event.target.checked })}
          />
          <span className="toggle__box" aria-hidden="true" />
          <span>{settings.streamerMode ? 'On — private details are masked' : 'Off'}</span>
        </label>
        <ul className="settings-privacy-list">
          <li>Player names are replaced with Player 1 and Player 2.</li>
          <li>Custom schedule titles, schedule notes, handover notes, and private control notes are hidden.</li>
          <li>Custom preparation checklist labels are hidden; bingo challenges stay visible for viewers.</li>
          <li>Your data stays in this browser. Streamer mode only changes what this app displays; it is not a security or screen-sharing boundary.</li>
        </ul>
      </section>

      <section className="card settings-card" aria-labelledby="player-names-title">
        <div className="settings-card__head">
          <span className="settings-card__icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 id="player-names-title" className="section-title">Player names</h2>
            <p className="muted-line">
              These names appear in the calendar, handovers, and progress cards.
              {settings.streamerMode && ' Inputs are masked while streamer mode is on.'}
            </p>
          </div>
        </div>
        <form className="settings-names" onSubmit={saveNames}>
          <div className="field">
            <label className="field__label" htmlFor="player-one-name">Player 1 display name</label>
            <input
              id="player-one-name"
              className="input"
              type={settings.streamerMode ? 'password' : 'text'}
              autoComplete="off"
              maxLength={32}
              required
              value={names.sennie}
              onChange={(event) => setNames((current) => ({ ...current, sennie: event.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="player-two-name">Player 2 display name</label>
            <input
              id="player-two-name"
              className="input"
              type={settings.streamerMode ? 'password' : 'text'}
              autoComplete="off"
              maxLength={32}
              required
              value={names.simphiwe}
              onChange={(event) => setNames((current) => ({ ...current, simphiwe: event.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={!namesChanged || !names.sennie.trim() || !names.simphiwe.trim()}>
            <Save size={16} aria-hidden="true" />
            Save names
          </button>
        </form>
      </section>
    </div>
  )
}
