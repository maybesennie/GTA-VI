# GTA VI: The Marathon

A companion app for Sennie and Simphiwe's 48–72 hour GTA VI marathon. React + Vite, no backend, no accounts. Everything saves in your browser (LocalStorage).

## Install the Windows app

Download `GTA-VI-The-Marathon-Setup-1.0.0-x64.exe` from the [v1.0.0 release](https://github.com/maybesennie/GTA-VI/releases/tag/v1.0.0), run the installer, and follow the prompts. The installer is per-user and does not require administrator access. It adds Start menu and optional desktop shortcuts.

The installer is not code-signed, so Windows SmartScreen may show a warning before installation.

The Windows app stores its data locally, separately from the website in your browser. Names, schedule, bingo progress, and other settings do not sync between installations.

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
| `npm test` | Run the automated tests |
| `npm run app:preview` | Build and open the desktop app |
| `npm run package:win` | Build the Windows installer into `release/` |

### If something goes wrong

- **`npm` is not recognised**: Node isn't installed or VS Code needs a restart.
- **PowerShell says scripts are disabled**: use a Command Prompt terminal (the `+ ▾` menu in the terminal panel), or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.
- **Port 5173 is busy**: Vite picks the next free port and prints it.

## Using it

- **Overview**: countdown to 19 Nov 2026 00:00 SAST (becomes an elapsed timer once the marathon starts), South Africa clock, who is on duty, next rotation, prep and bingo progress.
- **Marathon Calendar**: the starting schedule is pre-loaded. Add, edit and delete shifts, switch players, add sleep, meal and shower/personal breaks, and add notes. The live shift, next-shift countdown, per-player gaming and rest totals, and a 24h "at a glance" strip update in real time. Times everywhere are South Africa time (SAST, UTC+2), whatever your PC's timezone is.
- **GTA VI Bingo**: the 25 tiles in the original order with START GTA VI in the centre. Tap to complete, tap again to undo. Rows, columns and diagonals trigger a BINGO overlay. *Swap tiles* (or *Swap in* on the pool) puts any of the five optional challenges on the board. *Shuffle* keeps the centre fixed. *Reset board* asks first.
- **Your challenges**: add, rename and remove up to 50 custom bingo challenges, then swap them onto the board. Custom challenges are saved with the board.
- **Preparation Checklist**: five categories with percentages, custom items you can delete, and a reset with confirmation.
- **Marathon Control**: Start / Pause / Resume / End with a persistent clock (it keeps counting correctly after a refresh or closing the browser), handover log, notes for each player, and a history of completed shifts.
- **Leonida Map**: explore the community-created State of Leonida interactive map in an embedded section, or open it in a separate tab.
- **Settings**: change both player display names and enable **Streamer mode**. Streamer mode masks names, custom schedule titles/notes, handover and control notes, and custom preparation labels. Bingo challenges remain visible for viewers. This is a display aid only; data remains in browser storage and is not protected from browser tools or other apps.

## Notes

- Data lives in this browser on this computer. Use the same browser on the same machine for both players, or clear site data to wipe everything.
- The schedule's later rotations are flagged *Flexible* and are meant to be edited as the marathon unfolds.
- Fonts (Inter, Barlow Condensed) load from Google Fonts; offline, the app falls back to system fonts.

## Structure

```
src/
  components/   reusable UI (modal, shift card, bingo board, rings, nav…)
  pages/        Overview, Calendar, Bingo, Checklist, Control, Map, Settings
  context/      StoreContext: all persisted state
  hooks/        useLocalStorage, useNow (shared clock), useHashRoute
  utils/        pure logic: time, schedule, bingo, checklist, marathon timer
  styles/       CSS per area
  test/         unit and UI tests
```
