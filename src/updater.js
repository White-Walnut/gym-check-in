// Thin wrapper around electron-updater. Wired up so the plumbing exists, but nothing in this file is
// ever called automatically -- src/main.js only calls checkForUpdatesManually() in response to an
// explicit staff button press, and there is no startup check or background polling anywhere.
//
// The GitHub-provider publish config in package.json ("build.publish") still has placeholder
// owner/repo values, so a real check will currently fail. That's expected until setup is finished --
// see UPDATER_SETUP.md for the exact steps.

const { autoUpdater } = require('electron-updater');

let wired = false;

function wireUpdater(getMainWindow) {
  if (wired) return;
  wired = true;

  // Never download or install without the app asking first -- this is a shared kiosk machine, not a
  // personal laptop; an update should not silently land mid-shift.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  const send = (payload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('update-status', payload);
  };

  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }));
  autoUpdater.on('update-available', (info) => send({ status: 'available', version: info?.version }));
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }));
  autoUpdater.on('error', (error) => send({ status: 'error', message: error?.message || String(error) }));
  autoUpdater.on('update-downloaded', (info) => send({ status: 'downloaded', version: info?.version }));
}

function checkForUpdatesManually() {
  return autoUpdater.checkForUpdates();
}

module.exports = { wireUpdater, checkForUpdatesManually };
