import { ArrowRight, CalendarClock, Clock3, Gamepad2, LayoutGrid, ListChecks, Repeat, Target, Timer } from 'lucide-react'
import { useNow } from '../hooks/useNow.jsx'
import { useStore } from '../context/StoreContext.jsx'
import CountdownDisplay from '../components/CountdownDisplay.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusPill from '../components/StatusPill.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import { bingoProgress } from '../utils/bingo.js'
import { overallProgress } from '../utils/checklist.js'
import { elapsedMs } from '../utils/marathon.js'
import { currentGamingShift, nextRotation } from '../utils/schedule.js'
import { LAUNCH_AT, PLAYERS, TARGET_MAX_HOURS, TARGET_MIN_HOURS, WARMUP_AT, HOUR } from '../utils/constants.js'
import {
  formatDateTime,
  formatDuration,
  formatHMS,
  formatSAClock,
  formatSADate,
  formatTime,
  splitDuration,
  toHours,
} from '../utils/time.js'

function Hero({ now, timer, elapsed }) {
  const status = timer.status
  const started = status !== 'idle'
  const preLaunch = now < LAUNCH_AT

  return (
    <section className="card hero" aria-labelledby="hero-title">
      <div className="hero__sun" aria-hidden="true" />
      <div className="hero__content">
        <p className="eyebrow">Launch day · 19 November 2026</p>
        <h1 id="hero-title" className="hero__title">
          GTA VI: THE MARATHON
        </h1>
        <p className="hero__subtitle">48–72 hours. Two players. One unforgettable launch.</p>

        {started ? (
          <div className="hero__timer">
            <div className="hero__timer-head">
              <p className="eyebrow">Marathon elapsed</p>
              <StatusPill status={status} />
            </div>
            <ElapsedClock ms={elapsed} />
            <p className="hero__note">
              {status === 'ended'
                ? 'The marathon has ended. Final time shown.'
                : status === 'paused'
                  ? 'The clock is paused. Resume it from Marathon Control.'
                  : 'The clock keeps running until you pause or end it in Marathon Control.'}
            </p>
          </div>
        ) : preLaunch ? (
          <div className="hero__timer">
            <p className="eyebrow">Countdown to launch</p>
            <CountdownDisplay ms={LAUNCH_AT - now} />
            <p className="hero__note">
              Warm-up shift starts {formatDateTime(WARMUP_AT)}. Launch at {formatDateTime(LAUNCH_AT)}.
            </p>
          </div>
        ) : (
          <div className="hero__timer">
            <p className="eyebrow">Launch has passed</p>
            <p className="hero__passed">
              It has been {formatDuration(now - LAUNCH_AT)} since launch. Start the clock when the marathon begins.
            </p>
            <a className="btn btn--primary" href="#/control">
              Go to Marathon Control <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      <aside className="hero__clock" aria-label="Current time in South Africa">
        <Clock3 size={16} aria-hidden="true" />
        <div>
          <p className="hero__clock-time">{formatSAClock(now)}</p>
          <p className="hero__clock-date">{formatSADate(now)}</p>
          <p className="hero__clock-zone">Africa/Johannesburg</p>
        </div>
      </aside>
    </section>
  )
}

function ElapsedClock({ ms }) {
  const [h, m, s] = formatHMS(ms).split(':')
  return (
    <div className="countdown countdown--elapsed" role="timer" aria-label={formatDuration(ms)}>
      {[
        ['Hours', h],
        ['Minutes', m],
        ['Seconds', s],
      ].map(([label, value]) => (
        <div className="countdown__seg" key={label}>
          <span className="countdown__num">{value}</span>
          <span className="countdown__label">{label}</span>
        </div>
      ))}
    </div>
  )
}

function TargetBar({ elapsed }) {
  const maxMs = TARGET_MAX_HOURS * HOUR
  const pct = Math.min(100, (elapsed / maxMs) * 100)
  const minPct = (TARGET_MIN_HOURS / TARGET_MAX_HOURS) * 100
  return (
    <div className="targetbar">
      <div
        className="targetbar__track"
        role="progressbar"
        aria-label="Progress toward the 72 hour target"
        aria-valuemin={0}
        aria-valuemax={TARGET_MAX_HOURS}
        aria-valuenow={Math.min(TARGET_MAX_HOURS, toHours(elapsed))}
      >
        <span className="targetbar__fill" style={{ width: `${pct}%` }} />
        <span className="targetbar__tick" style={{ left: `${minPct}%` }} />
      </div>
      <div className="targetbar__labels" aria-hidden="true">
        <span>0h</span>
        <span style={{ left: `${minPct}%` }}>{TARGET_MIN_HOURS}h</span>
        <span>{TARGET_MAX_HOURS}h</span>
      </div>
    </div>
  )
}

export default function Overview() {
  const now = useNow()
  const { shifts, timer, bingo, checklist, handovers } = useStore()

  const elapsed = elapsedMs(timer, now)
  const bingoStats = bingoProgress(bingo)
  const prep = overallProgress(checklist)
  const onDuty = currentGamingShift(shifts, now)
  const rotation = nextRotation(shifts, now, onDuty?.player)
  const lastHandover = handovers[handovers.length - 1]
  const loggedDiffers = onDuty && lastHandover && lastHandover.player !== onDuty.player && timer.status !== 'idle'

  const hoursSub =
    timer.status === 'idle'
      ? 'The clock has not started yet'
      : elapsed >= TARGET_MIN_HOURS * HOUR
        ? `${TARGET_MIN_HOURS}h target reached`
        : `${toHours(TARGET_MIN_HOURS * HOUR - elapsed)}h to the ${TARGET_MIN_HOURS}h mark`

  const rotationIn = rotation ? splitDuration(rotation.start - now) : null

  return (
    <div className="page">
      <Hero now={now} timer={timer} elapsed={elapsed} />

      <div className="stat-grid">
        <StatCard
          icon={Target}
          label="Marathon target"
          value={`${TARGET_MIN_HOURS}–${TARGET_MAX_HOURS} hours`}
          sub="Aim for 48, stretch to 72"
          accent="purple"
        >
          <TargetBar elapsed={elapsed} />
        </StatCard>

        <StatCard
          icon={Timer}
          label="Hours completed"
          value={`${toHours(elapsed)} h`}
          sub={hoursSub}
          accent="turq"
          href="#/control"
          linkLabel="Open Marathon Control"
        />

        <StatCard
          icon={Gamepad2}
          label="Player on duty"
          value={onDuty ? PLAYERS[onDuty.player].name : 'Nobody yet'}
          sub={
            onDuty
              ? `Until ${formatTime(onDuty.end)} · ${formatDuration(onDuty.end - now)} left`
              : 'No gaming shift is running now'
          }
          accent={onDuty?.player === 'simphiwe' ? 'turq' : 'pink'}
          href="#/calendar"
          linkLabel="Open calendar"
        >
          {loggedDiffers && (
            <p className="stat__aside">Logged at the controller: {PLAYERS[lastHandover.player].name}</p>
          )}
        </StatCard>

        <StatCard
          icon={Repeat}
          label="Next rotation"
          value={rotation ? PLAYERS[rotation.player].name : 'None scheduled'}
          sub={
            rotation
              ? `${formatDateTime(rotation.start)} · in ${
                  rotationIn.days ? `${rotationIn.days}d ` : ''
                }${formatDuration(rotation.start - now - rotationIn.days * 24 * HOUR)}`
              : 'Add a gaming shift in the calendar'
          }
          accent={rotation?.player === 'simphiwe' ? 'turq' : 'pink'}
          href="#/calendar"
          linkLabel="Edit schedule"
        />

        <StatCard
          icon={ListChecks}
          label="Preparation"
          value={`${prep.done} of ${prep.total}`}
          sub="checklist items ready"
          accent="turq"
          href="#/checklist"
          linkLabel="Open checklist"
        >
          <ProgressRing value={prep.percent} from="#36E0CF" to="#9747FF" label={`Preparation ${prep.percent} percent`} />
        </StatCard>

        <StatCard
          icon={LayoutGrid}
          label="Bingo"
          value={`${bingoStats.completed} of ${bingoStats.total}`}
          sub={`${bingoStats.lines} bingo ${bingoStats.lines === 1 ? 'line' : 'lines'}`}
          accent="pink"
          href="#/bingo"
          linkLabel="Open bingo"
        >
          <ProgressRing value={bingoStats.percent} label={`Bingo ${bingoStats.percent} percent`} />
        </StatCard>
      </div>

      <section className="card quick" aria-label="Shortcuts">
        <CalendarClock size={18} aria-hidden="true" />
        <p>
          Update shifts in the <a href="#/calendar">calendar</a>, tick off bingo tiles as they happen, and press start in{' '}
          <a href="#/control">Marathon Control</a> when the clock should begin.
        </p>
      </section>
    </div>
  )
}
