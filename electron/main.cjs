'use strict';
/**
 * Tenh Gram — Windows desktop shell (Electron).
 *
 * This file is CommonJS on purpose: package.json sets "type": "module", so
 * the Electron entry point must use a .cjs extension. It does NOT contain
 * any app logic. It starts the existing Tenh Gram server (src/server.js,
 * unchanged behaviour) and shows it in a desktop window, so the user never
 * has to run `npm start` or open localhost in a browser.
 *
 * How it works:
 *  1. Data (accounts, sessions, activity) lives in the OS user-data folder
 *     (%APPDATA%\Tenh Gram\data on Windows) via TELEGRAM_DATA_DIR, which
 *     authStore.js / safetyState.js already honour. That keeps user data
 *     writable (Program Files is not) and safe across app updates.
 *  2. If port 3040 already answers (e.g. the user left `npm start`
 *     running), the window simply reuses that server instead of failing.
 *  3. Otherwise the server is started in-process: createServer() +
 *     startBackgroundTasks() from src/server.js, exactly as the CLI does.
 *  4. Closing the window quits the app and stops the server it started.
 *  5. 1-click updates: electron-updater checks GitHub Releases (auto-check
 *     10s after start + File/Help > Check for Updates). A downloaded
 *     update only installs when the user clicks "Restart now".
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');

// electron-updater is a runtime dependency (see package.json). It is
// optional at load time: if it is missing, updates are simply disabled
// and the app still starts normally.
let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

const APP_NAME = 'Tenh Gram';
const DEFAULT_PORT = 3040;

const appRoot = app.getAppPath();
// In dev (`npm run desktop`) appRoot is the repo root; packaged it is
// <resources>/app.asar. The server and public assets live under it.
const serverEntry = path.join(appRoot, 'src', 'server.js');
const windowIcon = path.join(appRoot, 'public', 'logo.png');

const userDataDir = path.join(app.getPath('userData'), 'data');
const envFile = path.join(appRoot, '.env');

let mainWindow = null;
let httpServer = null;
let stopBackgroundTasks = null;
let serverOwned = false;
let updateDownloaded = false;
let manualUpdateCheck = false;

/** Send an update status to the window (preload exposes it to the page). */
function sendUpdateStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('tenhgram:update-status', status);
  }
}

/**
 * 1-click updates (electron-updater, GitHub Releases).
 *
 * - Only the installed (NSIS) app can update: in dev (`npm run desktop`)
 *   and in the portable .exe there is no installed version to replace,
 *   so the updater is skipped / reports that updates need the installer.
 * - Auto-check runs once, 10s after start, and stays silent when there
 *   is no update or no network. A manual check shows the result.
 * - Nothing restarts on its own: when an update is downloaded the user
 *   gets "Restart now / Later" and only "Restart now" installs it.
 */
function setupUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ state: 'checking' });
  });
  autoUpdater.on('update-available', info => {
    sendUpdateStatus({ state: 'available', version: info && info.version });
    if (manualUpdateCheck) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: APP_NAME,
        message: `Tenh Gram ${info.version} is available. Downloading it now — you will be asked before it installs.`,
        buttons: ['OK'],
      });
    }
  });
  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus({ state: 'up-to-date' });
    if (manualUpdateCheck) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: APP_NAME,
        message: 'You are on the latest version of Tenh Gram.',
        buttons: ['OK'],
      });
    }
  });
  autoUpdater.on('download-progress', progress => {
    const percent = Math.round(progress.percent || 0);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(percent / 100);
    }
    sendUpdateStatus({ state: 'downloading', percent });
  });
  autoUpdater.on('update-downloaded', info => {
    updateDownloaded = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }
    sendUpdateStatus({ state: 'downloaded', version: info && info.version });
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: APP_NAME,
        message: `Tenh Gram ${info.version} is ready to install. Restart now to update, or keep using this version for now.`,
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });
  autoUpdater.on('error', err => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }
    sendUpdateStatus({ state: 'error', message: err && err.message });
    // Silent on the automatic check (e.g. offline); only a manual
    // check tells the user.
    if (manualUpdateCheck) {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: APP_NAME,
        message: `Could not check for updates.\n${err && err.message ? err.message : 'Check your internet connection and try again.'}`,
        buttons: ['OK'],
      });
    }
  });
}

/** One update check. `manual` = the user clicked it, so show the result. */
function checkForUpdates(manual) {
  manualUpdateCheck = !!manual;
  if (!autoUpdater) {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: APP_NAME,
        message: 'Updates are not available in this copy of Tenh Gram.',
        buttons: ['OK'],
      });
    }
    return;
  }
  if (!app.isPackaged) {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: APP_NAME,
        message:
          '1-click updates only work in the installed app.\n\nInstall Tenh Gram from TenhGram-Setup-1.0.0.exe (not the portable .exe, not npm run desktop), then Help > Check for Updates will work.',
        buttons: ['OK'],
      });
    }
    return;
  }
  if (updateDownloaded) {
    // Already downloaded: offer the restart again instead of re-checking.
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: APP_NAME,
        message: 'An update is already downloaded and ready to install. Restart now?',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
    return;
  }
  autoUpdater.checkForUpdates().catch(() => {
    // The 'error' event above reports it; never crash on a failed check.
  });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Check for Updates', click: () => checkForUpdates(true) },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Check for Updates', click: () => checkForUpdates(true) },
        {
          label: 'About Tenh Gram',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: APP_NAME,
              message: `Tenh Gram ${app.getVersion()}\n\nTelegram Safe Inviter — Windows desktop app.`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function getPort() {
  const parsed = Number(process.env.PORT || DEFAULT_PORT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

/** Load the repo .env (dev runs) the same way `npm start` does. */
function loadEnvFile() {
  if (!fs.existsSync(envFile)) return;
  try {
    // Node >= 20.10. No-ops for keys already set in the environment.
    process.loadEnvFile(envFile);
  } catch {
    // A malformed .env must not stop the app; the server falls back to
    // per-user config stored in the data dir.
  }
}

/**
 * First run only: if this install has no accounts yet but a data/ folder
 * sits next to the app (a `npm run desktop` run from an existing repo
 * checkout), copy it so existing accounts keep working.
 */
function migrateExistingData() {
  try {
    const targetUsers = path.join(userDataDir, 'users.json');
    const sourceUsers = path.join(appRoot, 'data', 'users.json');
    if (fs.existsSync(targetUsers) || !fs.existsSync(sourceUsers)) return;
    fs.cpSync(path.join(appRoot, 'data'), userDataDir, { recursive: true });
  } catch {
    // Migration is a convenience, never a fatal error.
  }
}

/** True when something already serves Tenh Gram on this port. */
function probeServer(port) {
  return new Promise(resolve => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/', timeout: 1500 },
      res => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('timeout', () => req.destroy(new Error('probe timeout')));
    req.on('error', () => resolve(false));
  });
}

async function ensureServer(port) {
  if (await probeServer(port)) return; // Reuse the running server.

  const serverModule = await import(serverEntry);
  httpServer = serverModule.createServer();
  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, '127.0.0.1', () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });
  stopBackgroundTasks = serverModule.startBackgroundTasks();
  serverOwned = true;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: APP_NAME,
    icon: fs.existsSync(windowIcon) ? windowIcon : undefined,
    backgroundColor: '#f5f7fb',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

async function start() {
  const port = getPort();
  process.env.TELEGRAM_DATA_DIR = userDataDir;
  loadEnvFile();
  migrateExistingData();

  try {
    await ensureServer(port);
  } catch (err) {
    const message =
      err && err.code === 'EADDRINUSE'
        ? `Port ${port} is already in use by another program.\nClose the other Tenh Gram server (or change PORT) and start Tenh Gram again.`
        : `Tenh Gram could not start its server:\n${err && err.message ? err.message : String(err)}`;
    dialog.showErrorBox(APP_NAME, message);
    app.quit();
    return;
  }

  try {
    await createWindow(port);
  } catch (err) {
    dialog.showErrorBox(APP_NAME, `Tenh Gram could not open its window:\n${err.message}`);
    app.quit();
    return;
  }

  // 1-click updates: menu + manual check, and one silent auto-check.
  setupUpdater();
  buildMenu();
  ipcMain.handle('tenhgram:check-for-updates', () => {
    checkForUpdates(true);
    return true;
  });
  if (app.isPackaged && autoUpdater) {
    setTimeout(() => checkForUpdates(false), 10000);
  }
}

function stopOwnedServer() {
  if (stopBackgroundTasks) {
    stopBackgroundTasks();
    stopBackgroundTasks = null;
  }
  if (serverOwned && httpServer) {
    httpServer.close();
    httpServer = null;
    serverOwned = false;
  }
}

// One app at a time: a second launch just focuses the running window.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(start);

  app.on('window-all-closed', () => {
    stopOwnedServer();
    app.quit();
  });

  app.on('before-quit', stopOwnedServer);
}
