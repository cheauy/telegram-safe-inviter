'use strict';
/**
 * Tenh Gram — Electron preload script.
 *
 * Runs with contextIsolation on and no Node access in the page. It exposes
 * the smallest possible read-only bridge: the platform name, so the web UI
 * could adapt if it ever needs to. No app internals, no server handles.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('tenhgram', {
  platform: process.platform,
  isDesktop: true,
});
