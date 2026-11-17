# GTA VI: The Marathon

A companion app for Sennie and Simphiwe's 48–72 hour GTA VI marathon. React + Vite, no backend, no accounts. Everything saves in your browser (LocalStorage).

## Run it on Windows with VS Code

1. Install **Node.js LTS** from https://nodejs.org (tick the default options), then restart VS Code.
2. In VS Code: **File → Open Folder…** and choose the `gta-vi-marathon` folder.
3. Open the terminal: **Terminal → New Terminal**.
4. Install and start:

   ```
   npm install
   npm run dev
   ```

5. Your browser opens at http://localhost:5173. If it doesn't, open that address yourself.

To stop the app press `Ctrl + C` in the terminal.

### Other commands

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the 75 automated tests |

### If something goes wrong

- **`npm` is not recognised**: Node isn't installed or VS Code needs a restart.
- **PowerShell says scripts are disabled**: use a Command Prompt terminal (the `+ ▾` menu in the terminal panel), or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.
- **Port 5173 is busy**: Vite picks the next free port and prints it.

## Using it

- **Overview**: countdown to 19 Nov 2026 00:00 SAST (becomes an elapsed timer once the marathon starts), South Africa clock, who is on duty, next rotation, prep and bingo progress.
- **Marathon Calendar**: the starting schedule is pre-loaded. Add, edit and delete shifts, switch players, add sleep, meal and shower/personal breaks, and add notes. The live shift, next-shift countdown, per-player gaming and rest totals, and a 24h "at a glance" strip update in real time. Times everywhere are South Africa time (SAST, UTC+2), whatever your PC's timezone is.
- **GTA VI Bingo**: the 25 tiles in the original order with START GTA VI in the centre. Tap to complete, tap again to undo. Rows, columns and diagonals trigger a BINGO overlay. *Swap tiles* (or *Swap in* on the pool) puts any of the five optional challenges on the board. *Shuffle* keeps the centre fixed. *Reset board* asks first.
- **Preparation Checklist**: five categories with percentages, custom items you can delete, and a reset with confirmation.
- **Marathon Control**: Start / Pause / Resume / End with a persistent clock (it keeps counting correctly after a refresh or closing the browser), handover log, notes for each player, and a history of completed shifts.

## Notes

- Data lives in this browser on this computer. Use the same browser on the same machine for both players, or clear site data to wipe everything.
- The schedule's later rotations are flagged *Flexible* and are meant to be edited as the marathon unfolds.
- Fonts (Inter, Barlow Condensed) load from Google Fonts; offline, the app falls back to system fonts.

## Structure

```
src/
  components/   reusable UI (modal, shift card, bingo board, rings, nav…)
  pages/        Overview, Calendar, Bingo, Checklist, Control
  context/      StoreContext: all persisted state
  hooks/        useLocalStorage, useNow (shared clock), useHashRoute
  utils/        pure logic: time, schedule, bingo, checklist, marathon timer
  styles/       CSS per area
  test/         unit and UI tests
```
