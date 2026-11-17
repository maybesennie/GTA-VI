import { ExternalLink, MapPin } from 'lucide-react'

const MAP_URL = 'https://map.stateofleonida.net/'

export default function LeonidaMap() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow"><MapPin size={14} aria-hidden="true" /> Explore Leonida</p>
          <h1 className="page__title">Leonida Map</h1>
          <p className="page__lead">The interactive community map is embedded below. Pan, zoom, and explore it without leaving the marathon app.</p>
        </div>
        <a className="btn btn--secondary" href={MAP_URL} target="_blank" rel="noreferrer">
          Open map separately <ExternalLink size={15} aria-hidden="true" />
        </a>
      </header>
      <section className="card map-card" aria-label="Interactive State of Leonida map">
        <iframe
          className="map-frame"
          src={MAP_URL}
          title="Interactive State of Leonida map"
          loading="lazy"
          allow="fullscreen"
          referrerPolicy="no-referrer"
        />
      </section>
      <p className="map-credit">
        Map by <a href={MAP_URL} target="_blank" rel="noreferrer">State of Leonida</a>. It is an independent third-party site, not affiliated with Rockstar Games.
      </p>
    </div>
  )
}
