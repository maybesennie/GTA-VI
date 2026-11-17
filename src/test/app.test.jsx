import { describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NowProvider } from '../hooks/useNow.jsx'
import { StoreProvider } from '../context/StoreContext.jsx'
import App from '../App.jsx'
import Overview from '../pages/Overview.jsx'
import { LAUNCH_AT, STORAGE_KEYS } from '../utils/constants.js'
import { sastDate } from '../utils/time.js'

function renderApp(hash = '#/overview') {
  window.sessionStorage.setItem(STORAGE_KEYS.splash, '1') // skip the splash
  window.location.hash = hash
  return render(<App />)
}

async function goTo(hashId) {
  await act(async () => {
    window.location.hash = `#/${hashId}`
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('overview', () => {
  it('shows the title, subtitle and a live countdown to 19 Nov 2026', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'GTA VI: THE MARATHON' })).toBeInTheDocument()
    expect(screen.getByText('48–72 hours. Two players. One unforgettable launch.')).toBeInTheDocument()
    expect(screen.getByText('Countdown to launch')).toBeInTheDocument()
    expect(screen.getByText('Africa/Johannesburg')).toBeInTheDocument()
  })

  it('countdown shows exact values for a frozen clock', () => {
    const now = LAUNCH_AT - (9 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000
    window.sessionStorage.setItem(STORAGE_KEYS.splash, '1')
    render(
      <NowProvider fixed={now}>
        <StoreProvider>
          <Overview />
        </StoreProvider>
      </NowProvider>,
    )
    const timers = screen.getAllByRole('timer')
    expect(timers[0]).toHaveTextContent('9')
    expect(timers[0]).toHaveTextContent('02')
    expect(timers[0]).toHaveTextContent('03')
    expect(timers[0]).toHaveTextContent('04')
  })
})

describe('navigation', () => {
  it('highlights the active section and switches pages', async () => {
    renderApp()
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]
    expect(within(nav).getByRole('link', { name: /Overview/ })).toHaveAttribute('aria-current', 'page')
    await goTo('bingo')
    expect(screen.getByRole('heading', { level: 1, name: 'GTA VI Bingo' })).toBeInTheDocument()
    expect(within(screen.getAllByRole('navigation', { name: 'Main' })[0]).getByRole('link', { name: /Bingo/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens the interactive map inside the app', () => {
    renderApp('#/map')
    expect(screen.getByRole('heading', { level: 1, name: 'Leonida Map' })).toBeInTheDocument()
    expect(screen.getByTitle('Interactive State of Leonida map')).toHaveAttribute('src', 'https://map.stateofleonida.net/')
  })
})

describe('bingo page', () => {
  it('marks tiles, detects a row, shows BINGO, and persists after remount', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp('#/bingo')
    for (const name of ['First carjack', 'Police chase', 'Beach at sunrise', 'Jet ski']) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^${name},`) }))
    }
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Take a selfie,/ }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('BINGO!')
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Row 1')
    await user.click(screen.getByRole('button', { name: 'Keep playing' }))

    expect(screen.getByRole('button', { name: /^Take a selfie,.*completed/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('20% complete')).toBeInTheDocument()

    unmount()
    renderApp('#/bingo')
    expect(screen.getByRole('button', { name: /^Take a selfie,.*, completed/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('20% complete')).toBeInTheDocument()
  })

  it('clicking a completed tile again undoes it', async () => {
    const user = userEvent.setup()
    renderApp('#/bingo')
    const tile = screen.getByRole('button', { name: /^Kayak,/ })
    await user.click(tile)
    expect(tile).toHaveAttribute('aria-pressed', 'true')
    await user.click(tile)
    expect(tile).toHaveAttribute('aria-pressed', 'false')
  })

  it('reset needs confirmation', async () => {
    const user = userEvent.setup()
    renderApp('#/bingo')
    await user.click(screen.getByRole('button', { name: /^Kayak,/ }))
    await user.click(screen.getByRole('button', { name: 'Reset board' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: /^Kayak,/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Reset board' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset board' }))
    expect(screen.getByRole('button', { name: /^Kayak,/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('swaps a pool tile onto the board', async () => {
    const user = userEvent.setup()
    renderApp('#/bingo')
    await user.click(screen.getByRole('button', { name: 'Swap in Get arrested' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /First carjack/ }))
    expect(screen.getByRole('button', { name: /^Get arrested,/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^First carjack,/ })).not.toBeInTheDocument()
  })

  it('shuffle keeps START GTA VI in the centre', async () => {
    const user = userEvent.setup()
    renderApp('#/bingo')
    await user.click(screen.getByRole('button', { name: 'Shuffle' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Shuffle' }))
    const tiles = within(screen.getByRole('group', { name: /bingo board/ })).getAllByRole('button')
    expect(tiles).toHaveLength(25)
    expect(tiles[12]).toHaveAccessibleName(/^Start GTA VI, tile 13/)
  })

  it('adds a custom challenge, swaps it onto the board and edits its text', async () => {
    const user = userEvent.setup()
    renderApp('#/bingo')
    const input = screen.getByLabelText('New challenge')
    await user.type(input, 'Find a hidden landmark')
    await user.click(screen.getByRole('button', { name: /^Add$/ }))
    await user.click(screen.getByRole('button', { name: 'Swap in Find a hidden landmark' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /First carjack/ }))
    expect(screen.getByRole('button', { name: /^Find a hidden landmark, tile 1/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit challenge Find a hidden landmark' }))
    const edit = screen.getByLabelText('Challenge text')
    await user.clear(edit)
    await user.type(edit, 'Find the lighthouse')
    await user.click(screen.getByRole('button', { name: 'Save challenge' }))
    expect(screen.getByRole('button', { name: /^Find the lighthouse, tile 1/ })).toBeInTheDocument()
  })
})

describe('streamer settings', () => {
  it('updates player names and masks personal content across the app', async () => {
    const user = userEvent.setup()
    renderApp('#/checklist')
    await user.type(screen.getByLabelText('Add a custom item to Food & Drinks'), 'Private prep task')
    await user.click(screen.getByRole('button', { name: 'Add item to Food & Drinks' }))

    await goTo('control')
    await user.type(screen.getByLabelText(/^Note/, { selector: '#handover-note' }), 'Private handover details')
    await user.click(screen.getByRole('button', { name: 'Simphiwe takes over' }))
    await user.type(screen.getByLabelText('Write a note'), 'Private control reminder')
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    await goTo('settings')
    const firstName = screen.getByLabelText('Player 1 display name')
    await user.clear(firstName)
    await user.type(firstName, 'Nova')
    await user.click(screen.getByRole('button', { name: 'Save names' }))

    await goTo('calendar')
    expect(screen.getAllByText('Nova').length).toBeGreaterThan(0)

    await goTo('settings')
    await user.click(screen.getByRole('checkbox', { name: 'Off' }))
    await goTo('calendar')
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0)
    expect(screen.queryByText('Nova')).not.toBeInTheDocument()
    expect(screen.queryByText('Warm-up session before launch.')).not.toBeInTheDocument()

    await goTo('checklist')
    expect(screen.getByText('Private checklist item')).toBeInTheDocument()
    expect(screen.queryByText('Private prep task')).not.toBeInTheDocument()

    await goTo('control')
    expect(screen.getByText('Handover note hidden in streamer mode.')).toBeInTheDocument()
    expect(screen.getByText('Private note hidden in streamer mode.')).toBeInTheDocument()
    expect(screen.queryByText('Private handover details')).not.toBeInTheDocument()
    expect(screen.queryByText('Private control reminder')).not.toBeInTheDocument()
    expect(screen.getByText('Turn off streamer mode to write a private note.')).toBeInTheDocument()
  })
})

describe('checklist page', () => {
  it('ticks items, updates progress, adds and deletes custom items, and persists', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp('#/checklist')
    await user.click(screen.getByRole('checkbox', { name: 'Snacks' }))
    expect(screen.getByRole('checkbox', { name: 'Snacks' })).toBeChecked()
    expect(screen.getByText('1 of 5 done')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Add a custom item to Food & Drinks'), 'Biltong')
    await user.click(screen.getByRole('button', { name: 'Add item to Food & Drinks' }))
    expect(screen.getByRole('checkbox', { name: 'Biltong' })).toBeInTheDocument()
    expect(screen.getByText('1 of 6 done')).toBeInTheDocument()

    unmount()
    renderApp('#/checklist')
    expect(screen.getByRole('checkbox', { name: 'Snacks' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Biltong' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete custom item Biltong' }))
    expect(screen.queryByRole('checkbox', { name: 'Biltong' })).not.toBeInTheDocument()
  })

  it('reset needs confirmation and clears ticks', async () => {
    const user = userEvent.setup()
    renderApp('#/checklist')
    await user.click(screen.getByRole('checkbox', { name: 'Blankets' }))
    await user.click(screen.getByRole('button', { name: 'Reset checklist' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset checklist' }))
    expect(screen.getByRole('checkbox', { name: 'Blankets' })).not.toBeChecked()
  })
})

describe('calendar page', () => {
  it('renders the initial schedule and totals', () => {
    renderApp('#/calendar')
    expect(screen.getByRole('heading', { level: 1, name: 'Marathon Calendar' })).toBeInTheDocument()
    expect(screen.getByText('GTA V')).toBeInTheDocument()
    expect(screen.getByText('Transition and preparation')).toBeInTheDocument()
    expect(screen.getAllByText('Flexible').length).toBeGreaterThan(0)
  })

  it('adds a shift with a note, then edits and deletes it', async () => {
    const user = userEvent.setup()
    renderApp('#/calendar')
    await user.click(screen.getByRole('button', { name: 'Meal break' }))
    const dialog = screen.getByRole('dialog', { name: 'Add shift' })
    await user.type(within(dialog).getByLabelText(/^Title/), 'Braai dinner')
    await user.type(within(dialog).getByLabelText(/^Notes/), 'Chicken and pap')
    await user.click(within(dialog).getByRole('button', { name: 'Add to schedule' }))
    expect(screen.getByText('Braai dinner')).toBeInTheDocument()
    expect(screen.getByText('Chicken and pap')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Edit Braai dinner/ }))
    const editor = screen.getByRole('dialog', { name: 'Edit shift' })
    await user.click(within(editor).getByRole('radio', { name: 'Simphiwe' }))
    const title = within(editor).getByLabelText(/^Title/)
    await user.clear(title)
    await user.type(title, 'Late dinner')
    await user.click(within(editor).getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Late dinner')).toBeInTheDocument()
    expect(screen.queryByText('Braai dinner')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Delete Late dinner/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete shift' }))
    expect(screen.queryByText('Late dinner')).not.toBeInTheDocument()
  })

  it('blocks a shift whose end is before its start', async () => {
    const user = userEvent.setup()
    renderApp('#/calendar')
    await user.click(screen.getByRole('button', { name: 'Add shift' }))
    const dialog = screen.getByRole('dialog', { name: 'Add shift' })
    const end = within(dialog).getByLabelText('End')
    await user.clear(end)
    await user.type(end, '2020-01-01T00:00')
    expect(within(dialog).getByText(/end time must be after/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Add to schedule' })).toBeDisabled()
  })

  it('shows the live shift and who is on duty at a frozen time', () => {
    const now = sastDate(2026, 11, 19, 5, 0)
    render(
      <NowProvider fixed={now}>
        <StoreProvider>
          <CalendarOnly />
        </StoreProvider>
      </NowProvider>,
    )
    const banner = screen.getByRole('region', { name: 'Who is playing now' })
    expect(banner).toHaveTextContent('Sennie')
    expect(banner).toHaveTextContent('4h 0m'.replace(' 0m', '')) // 4h left until 09:00
    expect(screen.getAllByText('Live now').length).toBeGreaterThan(0)
  })
})

// Imported lazily to keep the top of the file tidy.
import Calendar from '../pages/Calendar.jsx'
function CalendarOnly() {
  return <Calendar />
}

describe('marathon control', () => {
  it('start, pause, resume and end, persisting the state', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp('#/control')
    const start = screen.getByRole('button', { name: 'Start Marathon' })
    const pause = screen.getByRole('button', { name: 'Pause Marathon' })
    const resume = screen.getByRole('button', { name: 'Resume Marathon' })
    const end = screen.getByRole('button', { name: 'End Marathon' })
    expect([pause, resume, end].every((b) => b.disabled)).toBe(true)

    await user.click(start)
    expect(screen.getByRole('button', { name: 'Pause Marathon' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Start Marathon' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Pause Marathon' }))
    expect(screen.getByRole('button', { name: 'Resume Marathon' })).toBeEnabled()

    unmount()
    renderApp('#/control')
    expect(screen.getByRole('button', { name: 'Resume Marathon' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Resume Marathon' }))
    await user.click(screen.getByRole('button', { name: 'End Marathon' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'End marathon' }))
    expect(screen.getByRole('button', { name: 'Start Marathon' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'End Marathon' })).toBeDisabled()
  })

  it('records handovers with a note, adds and deletes notes', async () => {
    const user = userEvent.setup()
    renderApp('#/control')
    await user.type(screen.getByLabelText(/^Note/, { selector: '#handover-note' }), 'Parked at the beach')
    await user.click(screen.getByRole('button', { name: 'Simphiwe takes over' }))
    expect(screen.getByText('Parked at the beach')).toBeInTheDocument()
    expect(screen.getByText(/took over/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Write a note'), 'Remember to hydrate')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    expect(screen.getByText('Remember to hydrate')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete note by Sennie' }))
    expect(screen.queryByText('Remember to hydrate')).not.toBeInTheDocument()
  })

  it('lists completed shifts in the history', () => {
    const now = sastDate(2026, 11, 19, 12, 0)
    render(
      <NowProvider fixed={now}>
        <StoreProvider>
          <ControlOnly />
        </StoreProvider>
      </NowProvider>,
    )
    const history = screen.getByRole('heading', { name: /Completed shifts/ }).closest('section')
    expect(within(history).getAllByRole('listitem').length).toBeGreaterThanOrEqual(5)
  })
})

import Control from '../pages/Control.jsx'
function ControlOnly() {
  return <Control />
}
