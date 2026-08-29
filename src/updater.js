// Thin wrapper around electron-updater. See UPDATER_SETUP.md for the one-time GitHub setup this
// needs before any check (manual or automatic) can actually succeed.
//
// Checks never download or install anything on their own -- this is a shared kiosk machine, not a
// personal laptop, so autoDownload/autoInstallOnAppQuit stay off; staff always has to explicitly
// click to install, in Settings, once a check finds something.

const { autoUpdater } = require('electron-updater');
const { Notification } = require('electron');

let wired = false;
// Distinguishes an automatic (background, once-a-day -- see checkForUpdatesAutomatically) check from
// a manual one (the Settings button) purely to decide whether a found update also needs a standalone
// notification: a manual check already shows its result inline in Settings, right where staff is
// already looking, so a second nudge there would just be noise. An automatic check happens with
// nobody necessarily looking at that screen, so it's the one case that needs its own notice.
let checkIsAutomatic = false;

function wireUpdater(getMainWindow) {
  if (wired) return;
  wired = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  const send = (payload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('update-status', payload);
  };

  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }));
  autoUpdater.on('update-available', (info) => {
    send({ status: 'available', version: info?.version });
    if (checkIsAutomatic && Notification.isSupported()) {
      new Notification({
        title: '⬆️ Update available',
        body: `Version ${info?.version || 'unknown'} is ready to install -- see Settings to update.`,
        silent: true
      }).show();
    }
  });
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }));
  autoUpdater.on('error', (error) => send({ status: 'error', message: error?.message || String(error) }));
  autoUpdater.on('download-progress', (progress) => send({ status: 'downloading', percent: Math.round(progress?.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => send({ status: 'downloaded', version: info?.version }));
}

function checkForUpdatesManually() {
  checkIsAutomatic = false;
  return autoUpdater.checkForUpdates();
}

// Only ever called from the "Download update" button, once a check has already found something --
// see the 'available' status above. Never automatic (autoDownload stays off), same reasoning as the
// rest of this file: a shared kiosk shouldn't start pulling a ~100MB download or restart itself
// without a person actually choosing that, right now.
function downloadUpdate() {
  return autoUpdater.downloadUpdate();
}

// Quits and relaunches into the newly-downloaded version. Only ever called from the "Restart and
// install" button, which itself only appears after 'update-downloaded' -- i.e. staff has already
// explicitly asked for this, twice over (download, then install).
function quitAndInstallUpdate() {
  autoUpdater.quitAndInstall();
}

// Called at most once a day from main.js, on launch -- see GymDatabase.getLastUpdateCheckAt. Errors
// (no internet, publish config not finished yet, GitHub unreachable) are swallowed here rather than
// left to reject an unawaited promise: a background check failing silently is correct behavior for
// this one, since staff never asked for it and the manual button remains available regardless.
function checkForUpdatesAutomatically() {
  checkIsAutomatic = true;
  return autoUpdater.checkForUpdates()
    .catch((error) => console.error('Automatic update check failed:', error?.message || error))
    .finally(() => { checkIsAutomatic = false; });
}

module.exports = {
  wireUpdater,
  checkForUpdatesManually,
  checkForUpdatesAutomatically,
  downloadUpdate,
  quitAndInstallUpdate
};
