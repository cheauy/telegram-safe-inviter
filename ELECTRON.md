# Tenh Gram — Windows desktop app (.exe)

Tenh Gram runs as a Windows desktop app via Electron. The desktop app is a
thin shell around the exact same app that runs on `http://localhost:3040`:
same server (`src/server.js`), same UI (`src/ui.js`), same accounts. No
browser and no `npm start` needed — double-click Tenh Gram and it opens.

## How it works

- `electron/main.cjs` starts the existing server in-process
  (`createServer()` + `startBackgroundTasks()` from `src/server.js`) on port
  3040 (or `$PORT`), then opens a 1280×800 window at
  `http://127.0.0.1:3040/`.
- If port 3040 already answers — e.g. you left `npm start` running — the
  window reuses that server instead of failing with "port in use".
- Closing the window quits the app and stops the server it started.
- Only one Tenh Gram window can run at a time; launching it again focuses
  the open window.
- The window has no Node access (`contextIsolation: true`,
  `nodeIntegration: false`, `sandbox: true`); `electron/preload.cjs`
  exposes only a read-only `window.tenhgram` bridge.

## Where your data lives

Desktop data (accounts, sessions, activity) is stored per Windows user at:

```
%APPDATA%\Tenh Gram\data
```

That is separate from the `data\` folder in a repo checkout, so installing
the app does not touch your repo copy, and updating the app keeps your
accounts.

**Moving existing accounts in:** if you already have accounts in a repo
checkout (`C:\Users\TUF\telegram-safe-inviter\data`), copy that `data`
folder to `%APPDATA%\Tenh Gram\data` once before first launch (or, when
running `npm run desktop` from the checkout, the app copies it
automatically on first run if the desktop data folder is still empty).

## Build the .exe (on Windows)

On your Windows PC, in `C:\Users\TUF\telegram-safe-inviter`:

```powershell
npm install
npm run dist:win
```

That generates the icon from the existing logo (`electron/build-icon.cjs`),
then builds with electron-builder. Output in `dist\`:

- `TenhGram-Setup-1.0.0.exe` — installer (per-user, no admin needed)
- `TenhGram-Portable-1.0.0.exe` — portable, no install

Double-click the installer, then launch **Tenh Gram** from Start / Desktop.
No `npm start`, no browser tab.

## Run without building (developer)

```powershell
npm install
npm run desktop
```

Same window, running from the repo checkout. Your repo `data\` folder is
used on first run (see "Moving existing accounts in" above).

## Troubleshooting

- **"Port 3040 is already in use"** — another Tenh Gram server is running
  (e.g. an `npm start` window). Close it and start the app again, or just
  keep using that server: the desktop window reuses it when it answers.
- **Sign-in asks for a new account** — you are looking at the desktop data
  folder, not your repo `data\` folder. Copy the repo `data` folder as
  described above, then restart the app.
- **Blank window** — wait a few seconds (first start loads the server),
  then press `Ctrl+R` in the window. If it stays blank, run
  `npm start` in the repo and open http://localhost:3040 in a browser to
  check whether the server itself is the problem.
