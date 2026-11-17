export default function SplashScreen() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="splash__inner">
        <span className="brand__mark brand__mark--lg" aria-hidden="true">
          <span />
        </span>
        <p className="splash__kicker">GTA VI Companion</p>
        <h1 className="splash__title">The Marathon</h1>
        <div className="splash__bar" aria-hidden="true">
          <span />
        </div>
        <p className="splash__text">Loading your saved marathon…</p>
      </div>
    </div>
  )
}
