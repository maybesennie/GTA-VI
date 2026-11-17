export default function StatCard({ icon: Icon, label, value, sub, accent = 'pink', href, linkLabel, children }) {
  return (
    <article className={`card stat stat--${accent}`}>
      <header className="stat__head">
        <span className="stat__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <h3 className="stat__label">{label}</h3>
      </header>
      <div className="stat__body">
        <div className="stat__main">
          <p className="stat__value">{value}</p>
          {sub && <p className="stat__sub">{sub}</p>}
        </div>
        {children}
      </div>
      {href && (
        <a className="stat__link" href={href}>
          {linkLabel}
        </a>
      )}
    </article>
  )
}
