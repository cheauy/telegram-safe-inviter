'use strict';
/**
 * Tenh Gram — Electron preload script.
 *
 * Runs with contextIsolation on and no Node access in the page. It exposes
 * the smallest possible read-only bridge: the platform name, so the web UI
 * could adapt if it ever needs to. No app internals, no server handles.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tenhgram', {
  platform: process.platform,
  isDesktop: true,
  // 1-click updates: ask the main process to check, and listen for
  // status events ({ state: 'checking'|'available'|'downloading'|
  // 'downloaded'|'up-to-date'|'error', percent?, version? }).
  checkForUpdates: () => ipcRenderer.invoke('tenhgram:check-for-updates'),
  onUpdateStatus: callback => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('tenhgram:update-status', listener);
    return () => ipcRenderer.removeListener('tenhgram:update-status', listener);
  },
});
