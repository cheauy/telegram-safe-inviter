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
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { app, BrowserWindow, dialog } = require('electron');

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
