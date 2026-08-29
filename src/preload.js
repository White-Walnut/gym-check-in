// NOTE: this runs as a *sandboxed* preload script (webPreferences.sandbox: true in main.js), which
// only resolves a small built-in module allowlist via require() -- it cannot require local project
// files like src/shared/dates.js. The pure date/renewal helpers are loaded directly by index.html as
// plain <script> tags instead (see src/renderer/index.html), sharing the page's own global scope.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gym', {
  checkIn: (uid) => ipcRenderer.invoke('check-in', uid),
  addMember: (input) => ipcRenderer.invoke('add-member', input),
  updateMember: (input) => ipcRenderer.invoke('update-member', input),
  searchMembers: (query) => ipcRenderer.invoke('search-members', query),
  renewMember: (input) => ipcRenderer.invoke('renew-member', input),
  deleteMember: (input) => ipcRenderer.invoke('delete-member', input),
  expiringMembers: (withinDays) => ipcRenderer.invoke('expiring-members', withinDays),
  getRecentCheckIns: () => ipcRenderer.invoke('recent-check-ins'),
  searchCheckIns: (filters) => ipcRenderer.invoke('search-check-ins', filters),
  exportCheckInsCsv: (filters) => ipcRenderer.invoke('export-check-ins-csv', filters),
  getAppInfo: () => ipcRenderer.invoke('app-info'),
  getPhotoUrl: (photoPath) => ipcRenderer.invoke('photo-url', photoPath),

  chooseMemberPhoto: () => ipcRenderer.invoke('choose-member-photo'),
  setMemberPhoto: (input) => ipcRenderer.invoke('set-member-photo', input),
  captureMemberPhoto: (input) => ipcRenderer.invoke('capture-member-photo', input),
  removeMemberPhoto: (input) => ipcRenderer.invoke('remove-member-photo', input),

  hasStaffPin: () => ipcRenderer.invoke('has-staff-pin'),
  verifyStaffPin: (pin) => ipcRenderer.invoke('verify-staff-pin', pin),
  setStaffPin: (input) => ipcRenderer.invoke('set-staff-pin', input),
  resetStaffPinWithRecovery: (input) => ipcRenderer.invoke('reset-staff-pin-with-recovery', input),
  regenerateRecoveryCode: (input) => ipcRenderer.invoke('regenerate-recovery-code', input),
  lockStaff: () => ipcRenderer.invoke('lock-staff'),
  exportBackup: () => ipcRenderer.invoke('export-backup'),

  getLanguage: () => ipcRenderer.invoke('get-language'),
  setLanguage: (language) => ipcRenderer.invoke('set-language', language),

  getKioskLockdown: () => ipcRenderer.invoke('get-kiosk-lockdown'),
  setKioskLockdown: (enabled) => ipcRenderer.invoke('set-kiosk-lockdown', enabled),
  getDualScreenEnabled: () => ipcRenderer.invoke('get-dual-screen-enabled'),
  setDualScreenEnabled: (enabled) => ipcRenderer.invoke('set-dual-screen-enabled', enabled),
  getCheckinRetentionDays: () => ipcRenderer.invoke('get-checkin-retention-days'),
  setCheckinRetentionDays: (days) => ipcRenderer.invoke('set-checkin-retention-days', days),
  exportMemberData: (input) => ipcRenderer.invoke('export-member-data', input),

  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('quit-and-install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },

  // Dual-screen only: when a scan is physically caught by the staff window, the kiosk (customer-
  // facing) window gets pushed the same result here so it still shows the full outcome.
  onRemoteCheckIn: (callback) => {
    const listener = (_event, result) => callback(result);
    ipcRenderer.on('remote-checkin-result', listener);
    return () => ipcRenderer.removeListener('remote-checkin-result', listener);
  },

  // Fires on every check-in in every window (not just dual-screen's kiosk push) purely to keep the
  // "last check-in" glance in the admin header current, regardless of which window actually caught
  // the scan.
  onCheckinGlanceUpdate: (callback) => {
    const listener = (_event, result) => callback(result);
    ipcRenderer.on('checkin-glance-update', listener);
    return () => ipcRenderer.removeListener('checkin-glance-update', listener);
  }
});
