const { app, BrowserWindow, ipcMain, dialog, screen, Notification, shell, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { GymDatabase, normaliseUid } = require('./database');
const { localDateString } = require('./shared/dates');
const { resolvePhotoPath, isContainedIn, isAllowedImageExtension } = require('./shared/photo-paths');
const { checkinNotificationCopy } = require('./shared/checkin-notification');
const { toCsv } = require('./shared/csv');
const { parseCapturedPhotoDataUrl } = require('./shared/photo-capture');
const { t } = require('./shared/i18n');
const {
  wireUpdater,
  checkForUpdatesManually,
  checkForUpdatesAutomatically,
  downloadUpdate,
  quitAndInstallUpdate
} = require('./updater');
const logger = require('./logger');

// --- Windows ---------------------------------------------------------------------------------
// Normally there's just one window doing double duty (kiosk display + admin-as-a-modal), same as
// always. When two monitors are detected and "dual-screen" is enabled in Settings, two separate
// windows are created instead: `kioskWindow` (customer-facing, on one display) and `staffWindow`
// (admin content rendered directly on the page, not as a modal, on the other display). `staffWindow`
// stays null in single-window mode -- check it, not a separate flag, to tell the modes apart.
let kioskWindow;
let staffWindow;
let gymDatabase;
let databasePath;
let photosDir;
const smokeArgument = process.argv.find((argument) => argument.startsWith('--smoke-dir='));
const smokeDirectory = smokeArgument ? smokeArgument.slice('--smoke-dir='.length) : null;
// Normal smoke mode always forces single-window (deterministic, no real display dependency). This
// flag opts a smoke run into the real dual-screen path instead, when actual hardware supports it --
// see createWindows() and runSmokeCapture() below. Verification-only; never set in production.
const dualScreenSmoke = process.argv.includes('--dual-screen-smoke');
const rendererErrors = [];

// Smoke mode logs into the throwaway smoke directory instead of the real profile, same as
// databasePath/photosDir above -- a CI/verification run should never touch or depend on real
// machine state. app.getPath('userData') is safe to call this early (before 'ready'); only a
// handful of other paths (like 'exe') actually require it.
logger.init(smokeDirectory || app.getPath('userData'));

// Registered at module scope (not inside whenReady) so they're live for the entire process
// lifetime, including startup itself -- previously an error here had no handler at all, which for
// uncaughtException means Node's default behavior (crash with a bare stack trace nobody at a gym
// front desk would ever see or think to send anyone). Logged, then left to keep running rather than
// force-quit: for a kiosk sitting at a reception desk, a app that logs a hiccup and stays usable is
// far better than one that vanishes mid-shift over something that might not even be fatal.
process.on('uncaughtException', (error) => {
  logger.logError('process', 'Uncaught exception', error);
});
process.on('unhandledRejection', (reason) => {
  logger.logError('process', 'Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

function staffFacingWindow() {
  return staffWindow || kioskWindow;
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const DEMO_PHOTOS_DIR = path.join(ASSETS_DIR, 'members');
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const publicErrors = new Set([
  'invalid_uid', 'invalid_name', 'invalid_membership_type', 'invalid_date',
  'invalid_passes', 'invalid_member', 'invalid_status', 'member_not_found', 'card_exists',
  'not_authorized', 'invalid_pin', 'wrong_pin', 'wrong_recovery_code', 'invalid_amount',
  'invalid_photo', 'invalid_retention_days', 'cancelled'
]);

function adminResult(work) {
  try {
    return { ok: true, data: work() };
  } catch (error) {
    logger.logError('admin', 'Admin operation failed', error);
    return { ok: false, error: publicErrors.has(error.message) ? error.message : 'operation_failed' };
  }
}

// Deletes a member's uploaded photo file, but only if it's a real file this app owns (inside
// photosDir) -- never a demo: token, and never anything outside that one directory.
function deleteOwnedPhotoFile(photoPath) {
  if (!photoPath || typeof photoPath !== 'string' || photoPath.startsWith('demo:')) return;
  const resolved = path.resolve(photoPath);
  if (!isContainedIn(path.resolve(photosDir), resolved)) return;
  try {
    fs.unlinkSync(resolved);
  } catch (error) {
    logger.logError('photos', 'Could not delete old photo file', error);
  }
}

// --- Check-in notifications --------------------------------------------------------------------
// Staff needs to know a check-in happened -- and whether the card was actually valid -- even when
// this app isn't the focused window (they're in the MultiSport app, or just looking elsewhere).
// A native OS notification handles the "not looking at this app" case; it appears above whatever
// currently has focus without any window-management tricks. Text always states validity plainly
// (not just "checked in") since that's the part staff actually needs to act on.

// Single beep for an approved entry, a quick double-beep for a denial -- the same pattern a
// standalone door-badge reader uses, so it reads correctly by ear without staff looking up. Uses
// the OS system beep rather than a custom tone: no audio asset to ship, always audible on the PC's
// default output regardless of which window (if any) has focus, and it can't double up when two
// windows independently render the same check-in (dual-screen mode) since it only ever fires once,
// here in the main process.
function playCheckInChime(allowed) {
  shell.beep();
  if (!allowed) setTimeout(() => shell.beep(), 180);
}

function notifyCheckIn(result) {
  playCheckInChime(Boolean(result.allowed));
  if (!Notification.isSupported()) return;
  const { title, body } = checkinNotificationCopy(result, currentLanguage);
  new Notification({ title, body, silent: true }).show();
}

// --- Staff session (authorization boundary) -----------------------------------------------------
// This is the actual security boundary. The renderer's PIN screen is only a UI convenience; every
// mutating/PII-exposing IPC handler below re-checks `staffUnlocked` itself, so opening DevTools and
// calling window.gym.* directly cannot bypass it the way it could before.

const STAFF_SESSION_MS = 5 * 60 * 1000;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_BASE_MS = 5_000;
const LOCKOUT_MAX_MS = 60_000;

let staffUnlocked = false;
let staffUnlockTimer = null;
let failedPinAttempts = 0;
let lockoutUntil = 0;

// A separate counter/lockout for the recovery code, so a mistyped PIN never burns a recovery
// attempt (or vice versa).
let failedRecoveryAttempts = 0;
let recoveryLockoutUntil = 0;

function lockStaff() {
  staffUnlocked = false;
  if (staffUnlockTimer) {
    clearTimeout(staffUnlockTimer);
    staffUnlockTimer = null;
  }
}

function unlockStaff() {
  staffUnlocked = true;
  failedPinAttempts = 0;
  if (staffUnlockTimer) clearTimeout(staffUnlockTimer);
  staffUnlockTimer = setTimeout(lockStaff, STAFF_SESSION_MS);
}

function assertUnlocked() {
  if (!staffUnlocked) throw new Error('not_authorized');
}

// --- Kiosk lockdown --------------------------------------------------------------------------
// A soft deterrent, not a real OS lockdown -- see the comment on GymDatabase.setKioskLockdown.
// Never applied in smoke-capture mode, which needs normal window control to run its script.
// Applies only to a genuine customer-facing kiosk display -- the second monitor in dual-screen mode.
// `kioskWindow` in single-window mode is actually the staff's own dashboard now (see createWindows),
// so this must never be forced onto it -- kioskWindowIsCustomerFacing tracks which case is live.
let kioskLockdownEnabled = false;
let kioskWindowIsCustomerFacing = false;

// --- Quit confirmation ---------------------------------------------------------------------------
// Closing any window (the single staff dashboard, or either window in two-screen mode) now stops
// members from checking in, so it's asked about instead of just happening -- see confirmAndQuit()
// below. Set true once staff actually confirms (or from a flow that already confirmed its own way,
// like "Restart and install" for updates), so the real close that follows isn't asked about a
// second time.
let quittingConfirmed = false;

// --- Dual-screen -------------------------------------------------------------------------------
// Whether to use two windows when two displays are detected -- see GymDatabase.getDualScreenEnabled.
// Read once at startup; changing it in Settings takes effect on the next launch rather than trying
// to tear down and rebuild live windows while the app is running.
let dualScreenEnabled = false;

// The app-wide UI language -- read at startup and kept current on every 'set-language' call, same
// pattern as kioskLockdownEnabled/dualScreenEnabled above. Unlike those two, this takes effect
// immediately: every read of this variable below (the check-in notification, dialog titles, CSV
// headers) happens fresh at call time, not once at startup, so a language switch needs no restart.
let currentLanguage = 'en';

function windowOptions(extra = {}) {
  return {
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#0b0d0c',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // DevTools exposes the full window.gym IPC bridge to the console; only ever enable it for
      // `npm start`/`--dev`, never in a packaged/installed build reachable at a kiosk.
      devTools: !app.isPackaged,
      // Smoke mode already keeps the database (:memory:) and photos (see photosDir) out of the real
      // userData profile -- browser storage (localStorage, used for the theme/mode choice) needs the
      // same treatment. A partition name with no "persist:" prefix is in-memory and discarded when
      // the app quits, so a smoke run can never read or leave behind the real appearance preference.
      partition: smokeDirectory ? 'smoke' : undefined
    },
    ...extra
  };
}

// Asks once, natively (dialog.showMessageBox -- this intercepts a window closing at the OS level,
// before any confirmation from inside a page could apply, and has to work the same way regardless
// of which window or mode triggered it), then actually quits if confirmed. Checks the form-bearing
// window (staffWindow in two-screen mode, or the single kioskWindow otherwise -- a kiosk-role window
// in two-screen mode never shows the admin panel at all, so it can never itself be the one with
// unsaved changes) for unsaved changes via the same window.__gymHasUnsavedChanges() the renderer
// already exposes for its own tab-switch/Lock warnings, so the one message covers both risks
// instead of showing two popups back to back.
async function confirmAndQuit(triggeringWindow) {
  const formWindow = staffFacingWindow();
  let hasUnsavedChanges = false;
  if (formWindow && !formWindow.isDestroyed()) {
    hasUnsavedChanges = await formWindow.webContents
      .executeJavaScript('window.__gymHasUnsavedChanges ? window.__gymHasUnsavedChanges() : false')
      .catch(() => false);
  }
  const { response } = await dialog.showMessageBox(triggeringWindow, {
    type: 'question',
    buttons: [
      t(currentLanguage, 'main.confirm.quitCancel'),
      t(currentLanguage, 'main.confirm.quitConfirm')
    ],
    defaultId: 0,
    cancelId: 0,
    message: t(currentLanguage, hasUnsavedChanges ? 'main.confirm.quitWithUnsavedChanges' : 'main.confirm.quit')
  });
  if (response === 1) {
    quittingConfirmed = true;
    app.quit();
  }
}

function attachCommonWindowBehaviors(win, { isKioskDisplay }) {
  win.webContents.on('preload-error', (_event, preloadPath, error) => {
    logger.logError('window', `Preload script failed to load: ${preloadPath}`, error);
  });
  // Forwards every renderer-side console.error (including the window.onerror/unhandledrejection
  // handlers wired up in renderer.js, which both just console.error the details) into the same
  // persistent log as everything else -- previously a renderer-side failure had NO trace anywhere
  // outside smoke mode, since DevTools isn't open on a real kiosk. Smoke mode additionally
  // accumulates these into rendererErrors for its own end-of-run summary file (see below); that's
  // additive, not a replacement for this always-on path.
  win.webContents.on('console-message', (event) => {
    if (event.level !== 'error') return;
    logger.logError('renderer', `${event.message} (${event.sourceId}:${event.lineNumber})`);
    if (smokeDirectory) rendererErrors.push(`${event.message} (${event.sourceId}:${event.lineNumber})`);
  });
  // A renderer crash (out-of-memory, a native module fault, etc.) has no JS handler that can catch
  // it -- the page is just gone, with no console error and no uncaughtException. Left alone, a
  // kiosk sitting at reception would show a blank/frozen window until someone physically noticed and
  // restarted the app. Log it, then try one automatic reload -- a self-healed kiosk beats an unmanned
  // desk with a dead screen and nobody around to see it, even if the underlying cause still needs a
  // real fix. Never fires for a normal, expected exit ('clean-exit', e.g. on app quit).
  win.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason === 'clean-exit') return;
    logger.logError('window', `Renderer process gone (${details.reason}, exit code ${details.exitCode})`);
    if (!win.isDestroyed() && !smokeDirectory) win.webContents.reload();
  });
  if (isKioskDisplay) {
    win.on('close', (event) => {
      if (!smokeDirectory && kioskLockdownEnabled) event.preventDefault();
    });
  }
  // Applies to every window, not just this one -- in two-screen mode, closing EITHER the staff or
  // the kiosk window now closes both and quits the whole app (previously closing just the staff
  // window silently orphaned the kiosk display, with no window left to manage it or relay results
  // to). Skipped when this window can't actually be closed anyway (kiosk lockdown already vetoed it
  // above -- asking "do you want to quit?" on an unclosable window would be pure confusion), when
  // already mid-confirmed-quit (letting the real close through), and in smoke mode (which uses
  // .destroy() specifically to bypass all of this and never fires 'close' in the first place; this
  // is defense in depth, not the mechanism that protects it).
  win.on('close', (event) => {
    if (smokeDirectory || quittingConfirmed) return;
    if (isKioskDisplay && kioskLockdownEnabled) return;
    event.preventDefault();
    confirmAndQuit(win);
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (isKioskDisplay && !smokeDirectory && kioskLockdownEnabled) return; // kiosk mode owns fullscreen while locked
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

async function createWindows() {
  const displays = (smokeDirectory && !dualScreenSmoke) ? [] : screen.getAllDisplays();
  // --dual-screen-smoke explicitly opts a smoke run into this path for real-hardware verification --
  // it must force this on regardless of the Settings toggle's default, since a fresh smoke run's
  // in-memory database always sees that default (currently off; see GymDatabase.getDualScreenEnabled).
  const useDualScreen = (!smokeDirectory || dualScreenSmoke) && (dualScreenSmoke || dualScreenEnabled) && displays.length >= 2;
  const indexPath = path.join(__dirname, 'renderer', 'index.html');

  if (!useDualScreen) {
    // This window IS the staff dashboard (see applyWindowRole('single') in renderer.js) -- there's
    // no customer-facing screen to lock down here, so kiosk lockdown never applies to it regardless
    // of the Settings toggle (see kioskWindowIsCustomerFacing).
    kioskWindowIsCustomerFacing = false;
    kioskWindow = new BrowserWindow(windowOptions({
      show: !smokeDirectory,
      title: 'Gym Check-in'
    }));
    staffWindow = null;
    attachCommonWindowBehaviors(kioskWindow, { isKioskDisplay: false });
    await kioskWindow.loadFile(indexPath);
  } else {
    // getAllDisplays() has no guaranteed order (it's not "primary first") -- resolve the actual
    // primary explicitly. The staff dashboard belongs on the display Windows itself considers
    // primary (the one staff actually sits in front of); the customer-facing kiosk display always
    // goes on the other one -- monitor two, never monitor one.
    const primaryDisplay = screen.getPrimaryDisplay();
    const secondaryDisplay = displays.find((display) => display.id !== primaryDisplay.id) || displays[0];
    kioskWindowIsCustomerFacing = true;

    // Both windows must exist (be assigned to kioskWindow/staffWindow) *before* either one starts
    // loading the page -- loadFile()'s promise only resolves after the renderer has already run its
    // top-level script, which includes the very first app-info request. If staffWindow were created
    // after `await kioskWindow.loadFile(...)`, the kiosk window's own first app-info call would race
    // ahead of staffWindow existing at all, and the main process would (wrongly, just for that one
    // request) resolve its role as 'single' instead of 'kiosk'.
    kioskWindow = new BrowserWindow(windowOptions({
      x: secondaryDisplay.bounds.x,
      y: secondaryDisplay.bounds.y,
      width: secondaryDisplay.bounds.width,
      height: secondaryDisplay.bounds.height,
      show: !smokeDirectory,
      fullscreen: !smokeDirectory && !kioskLockdownEnabled,
      kiosk: !smokeDirectory && kioskLockdownEnabled,
      // Staff needs to freely switch to other apps (e.g. a separate MultiSport terminal app) on
      // their own screen without ever risking covering or losing focus-priority on the customer-
      // facing display -- alwaysOnTop plus staying out of the taskbar/alt-tab list keeps this
      // window "always up" regardless of what else is running.
      alwaysOnTop: true,
      skipTaskbar: true,
      title: 'Gym Check-in'
    }));
    staffWindow = new BrowserWindow(windowOptions({
      x: primaryDisplay.bounds.x,
      y: primaryDisplay.bounds.y,
      width: primaryDisplay.bounds.width,
      height: primaryDisplay.bounds.height,
      show: !smokeDirectory,
      title: 'Gym Check-in — Staff'
    }));
    attachCommonWindowBehaviors(kioskWindow, { isKioskDisplay: true });
    attachCommonWindowBehaviors(staffWindow, { isKioskDisplay: false });
    await Promise.all([kioskWindow.loadFile(indexPath), staffWindow.loadFile(indexPath)]);
  }

  if (smokeDirectory) {
    if (staffWindow) await runDualScreenSmokeCapture();
    else await runSmokeCapture();
  }
}

// Verifies the two things unique to dual-screen mode: each window resolves the right windowRole
// (kiosk vs staff) and renders accordingly, and a check-in caught by the *staff* window's own
// keyboard focus still ends up fully displayed on the kiosk window via the main-process relay --
// see the 'check-in' handler below. The single-window path has its own much more thorough capture
// (runSmokeCapture) that this deliberately doesn't duplicate.
async function runDualScreenSmokeCapture() {
  fs.mkdirSync(smokeDirectory, { recursive: true });
  const captureBoth = async (label) => {
    await captureWindowScreenshot(kioskWindow, `dual-kiosk-${label}.png`);
    await captureWindowScreenshot(staffWindow, `dual-staff-${label}.png`);
  };

  await new Promise((resolve) => setTimeout(resolve, 400));
  // Fresh state: kiosk shows the idle check-in screen with no admin affordance at all; staff shows
  // the first-run PIN setup screen, full-page (no modal backdrop/centering).
  await captureBoth('01-fresh');

  await staffWindow.webContents.executeJavaScript(
    "staffLockNewPin.value = '1234'; staffLockConfirmPin.value = '1234'; staffLockSetupForm.requestSubmit();"
  );
  await new Promise((resolve) => setTimeout(resolve, 600));
  await captureWindowScreenshot(staffWindow, 'dual-staff-02-recovery-code.png');
  await staffWindow.webContents.executeJavaScript('staffLockRecoveryContinue.click();');
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Staff window now shows admin content directly -- no PIN screen, no modal chrome, no kiosk stage.
  await captureWindowScreenshot(staffWindow, 'dual-staff-03-admin-open.png');

  // A scan the KIOSK window itself catches -- ordinary path, should show the full result there.
  await kioskWindow.webContents.executeJavaScript("submitUid('10000001')");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await captureWindowScreenshot(kioskWindow, 'dual-kiosk-02-local-checkin.png');
  await kioskWindow.webContents.executeJavaScript('resetToIdle();');

  // A scan the STAFF window catches instead (the case this phase exists for -- staff had focus on
  // their own screen when someone tapped a card at the kiosk). The staff window should show a
  // toast; the kiosk window should independently receive the full result via the relay.
  await staffWindow.webContents.executeJavaScript("submitUid('10000003')");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await captureBoth('03-remote-checkin');

  const errorLogPath = path.join(smokeDirectory, 'console-errors.log');
  if (rendererErrors.length) {
    fs.writeFileSync(errorLogPath, rendererErrors.join('\n'));
    console.error(`${rendererErrors.length} renderer console error(s) during dual-screen smoke capture -- see ${errorLogPath}`);
    rendererErrors.forEach((line) => console.error('  ', line));
  } else if (fs.existsSync(errorLogPath)) {
    fs.unlinkSync(errorLogPath);
  }

  kioskWindow.destroy();
  staffWindow.destroy();
  app.quit();
}

async function captureWindowScreenshot(win, fileName) {
  // On a hidden (show: false) window, the first capturePage() after a DOM change can occasionally
  // return a stale compositor frame from before the change. A cheap throwaway capture forces a fresh
  // one before the real capture that gets saved.
  await win.webContents.capturePage();
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(smokeDirectory, fileName), image.toPNG());
}

async function runSmokeCapture() {
  const mainWindow = kioskWindow; // single-window smoke path -- this window is the staff dashboard
  fs.mkdirSync(smokeDirectory, { recursive: true });
  await new Promise((resolve) => setTimeout(resolve, 250));
  // The dashboard opens (and, via appInfo.smoke, auto-unlocks) on its own at launch now -- there's no
  // separate check-in stage to show first. This is already the "Add new member" tab, unlocked.
  await captureScreenshot('01-ready.png');
  // Czech diacritics: type a name that exercises the characters the bundled font's latin-ext subset
  // specifically has to cover (ěščřžáíéůú), and screenshot it -- confirms real glyphs render, not
  // tofu/missing-glyph boxes, rather than just trusting the font's declared unicode-range.
  await mainWindow.webContents.executeJavaScript(
    "document.querySelector('#first-name').value = 'Přemysl'; document.querySelector('#last-name').value = 'Škvrňata';"
  );
  await captureScreenshot('01b-czech-diacritics.png');
  await mainWindow.webContents.executeJavaScript(
    "document.querySelector('#first-name').value = ''; document.querySelector('#last-name').value = '';"
  );
  // Force the first-run PIN flow back open on top of that auto-unlock, so it -- setup, then the
  // one-time recovery code reveal -- is captured for real here, by actually submitting the form (not
  // just showing it), the same way a brand-new install would actually experience it.
  await mainWindow.webContents.executeJavaScript("staffSessionActive = false; showStaffLock()");
  await new Promise((resolve) => setTimeout(resolve, 800));
  await captureScreenshot('02-staff-pin-setup.png');
  await mainWindow.webContents.executeJavaScript(
    "staffLockNewPin.value = '1234'; staffLockConfirmPin.value = '1234'; staffLockSetupForm.requestSubmit();"
  );
  await new Promise((resolve) => setTimeout(resolve, 600));
  await captureScreenshot('02b-recovery-code-reveal.png');
  await mainWindow.webContents.executeJavaScript("staffLockRecoveryContinue.click()");
  // Known-card-while-Add-member-armed guard (see dispatchScan's own comment): the Add-member tab
  // ambiently arms capture just by being open, unlike Scan to find/replace which are explicit
  // one-shot button clicks -- so a real member's card tapped here (staff simply hadn't switched off
  // this tab yet) must still check them in for real, not get treated as an unassigned card to
  // capture. Dispatches real keydown events for an ALREADY-KNOWN demo UID (Jordan Lee, 10000003 --
  // deliberately not 10000001, to avoid colliding with the unrelated approved-check-in test just
  // below, which uses that one and runs within DUPLICATE_WINDOW_MS of this) while fresh off initial
  // setup, exactly when armedCaptureTarget is still the ambient 'add-member' from opening this tab.
  await mainWindow.webContents.executeJavaScript(
    "['1','0','0','0','0','0','0','3'].forEach((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));"
  );
  await new Promise((resolve) => setTimeout(resolve, 800));
  const knownCardWhileArmed = await mainWindow.webContents.executeJavaScript(
    "({ feedUid: activityFeedEntries[0]?.uid, feedAllowed: activityFeedEntries[0]?.allowed, captureHasCard: cardCapture.classList.contains('has-card'), stillArmed: armedCaptureTarget })"
  );
  if (knownCardWhileArmed.feedUid !== '10000003' || knownCardWhileArmed.feedAllowed !== true
    || knownCardWhileArmed.captureHasCard !== false || knownCardWhileArmed.stillArmed !== 'add-member') {
    throw new Error(`A known card tapped while Add-member capture was ambiently armed did not check in as expected: ${JSON.stringify(knownCardWhileArmed)}`);
  }
  // The complementary case, same armed state: a genuinely unknown card must still be captured as
  // before -- this fix must not break the actual "add a new member" flow it exists to protect.
  await mainWindow.webContents.executeJavaScript(
    "['9','9','9','9','9','9','9','9'].forEach((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));"
  );
  await new Promise((resolve) => setTimeout(resolve, 800));
  const unknownCardWhileArmed = await mainWindow.webContents.executeJavaScript(
    "({ captureHasCard: cardCapture.classList.contains('has-card'), capturedValue: memberCardUid.value })"
  );
  if (!unknownCardWhileArmed.captureHasCard || unknownCardWhileArmed.capturedValue !== '99999999') {
    throw new Error(`A genuinely unknown card while Add-member capture was armed was not captured as expected: ${JSON.stringify(unknownCardWhileArmed)}`);
  }
  await mainWindow.webContents.executeJavaScript("resetAddMemberForm()"); // clean slate for the rest of the script, which expects an uncaptured Add-member form
  // The dashboard has no check-in stage of its own any more (see applyWindowRole('single') in
  // renderer.js) -- every check-in below shows only as a toast plus an activity-feed entry, which is
  // exactly what these screenshots are verifying still works correctly with the dashboard as the
  // permanent, PIN-gated default screen.
  await mainWindow.webContents.executeJavaScript("submitUid('10000001')");
  await new Promise((resolve) => setTimeout(resolve, 800));
  await captureScreenshot('03-approved.png');
  await mainWindow.webContents.executeJavaScript("submitUid('UNKNOWN999')");
  await new Promise((resolve) => setTimeout(resolve, 800));
  await captureScreenshot('04-denied.png');
  // Not openAdmin('add', uid) (that was the old check-in stage's "Assign to new member" button,
  // which doesn't exist any more): click the real activity-feed entry for the unknown card just
  // above, exactly the way staff actually would, so this exercises the genuine replacement path.
  await mainWindow.webContents.executeJavaScript(
    "[...document.querySelectorAll('.activity-feed-row')].find(row => row.textContent.includes('Unknown card')).click();" +
    "document.querySelector('input[value=\"punchcard\"]').click();"
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('05-admin-add.png');
  // The scenario this feature originally fixed -- a member checks in while staff is mid-task (here,
  // still filling in a new member's form) -- is now simply how every check-in behaves on this window:
  // the in-progress form stays untouched and the check-in is still recorded, as a toast/feed entry.
  await mainWindow.webContents.executeJavaScript("submitUid('10000001')");
  await new Promise((resolve) => setTimeout(resolve, 700));
  await captureScreenshot('05b-checkin-while-admin-open.png');
  await mainWindow.webContents.executeJavaScript("submitUid('10000003')");
  await new Promise((resolve) => setTimeout(resolve, 800));
  await captureScreenshot('06-punchcard.png');
  // The membership-type radio click above (real .click(), not a raw .value= assignment -- see its
  // own comment) left the Add-member form genuinely dirty, same as a real staff member getting
  // pulled away mid-entry. That's exactly the scenario the new unsaved-changes guard on tab
  // switches exists to catch -- resolve it here the way a careful staff member would (discard,
  // nothing of real value was entered), so the switch to Renew below isn't itself the confirm-prompt
  // test; that's covered on its own further down.
  await mainWindow.webContents.executeJavaScript("resetAddMemberForm()");
  await mainWindow.webContents.executeJavaScript("openAdmin('renew'); memberSearch.value = ''; runMemberSearch()");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await captureScreenshot('07-admin-renew.png');
  // Clicking a member's name (not the Edit button) should open the same editor -- exercise the real
  // click listener, not just call openMemberEditor() directly, so this actually verifies the new
  // click-to-edit affordance rather than assuming it's wired correctly.
  await mainWindow.webContents.executeJavaScript("document.querySelector('.member-row-details').click()");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('07c-click-name-to-edit.png');
  await mainWindow.webContents.executeJavaScript("closeMemberEditor()");
  await mainWindow.webContents.executeJavaScript("expiringDaysInput.value = '90'; showExpiringButton.click()");
  await new Promise((resolve) => setTimeout(resolve, 700));
  await captureScreenshot('07b-expiring-soon.png');
  // Not clearExpiringButton.click(): that dispatches its async handler fire-and-forget (a DOM
  // click() call doesn't return the handler's promise), so the very next line could race ahead of
  // visibleMembers actually being repopulated. executeJavaScript awaits a returned promise, so calling
  // runMemberSearch() directly guarantees the list is back before the next step reads visibleMembers.
  await mainWindow.webContents.executeJavaScript("clearExpiringButton.hidden = true; runMemberSearch()");
  await mainWindow.webContents.executeJavaScript("openMemberEditor(visibleMembers.find(member => member.cardUid === '10000001'), true)");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('08-edit-member.png');
  // "Change photo…" now offers a choice instead of jumping straight to the file picker -- verify the
  // choice appears, and that picking "Take photo" opens the camera modal without crashing either way:
  // on a machine with no camera it should fail gracefully (a status message, not a blank freeze); on
  // one with a real camera (some dev machines) it should show a live preview and actually save.
  await mainWindow.webContents.executeJavaScript("changePhotoToggle.click()");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('08c-photo-source-choice.png');
  await mainWindow.webContents.executeJavaScript("takePhotoButton.click()");
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await captureScreenshot('08d-camera-modal.png');
  await mainWindow.webContents.executeJavaScript(
    "if (!cameraCaptureButton.hidden) cameraCaptureButton.click();"
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('08e-camera-captured-preview.png');
  await mainWindow.webContents.executeJavaScript(
    "if (!cameraUseButton.hidden) cameraUseButton.click(); else cameraCancelButton.click();"
  );
  await new Promise((resolve) => setTimeout(resolve, 700));
  await captureScreenshot('08f-photo-saved.png');
  await mainWindow.webContents.executeJavaScript("closeMemberEditor(); setAdminTab('history')");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('08g-checkin-history.png');
  await mainWindow.webContents.executeJavaScript("setAdminTab('settings')");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('09-admin-settings.png');
  // Update flow: simulate the real autoUpdater events (no actual network check in smoke mode) to
  // verify the Download/Restart-and-install buttons actually appear and disappear at the right
  // moments -- this is the exact state machine that was previously a dead end (an update could be
  // detected but nothing ever let staff act on it).
  const { autoUpdater: smokeAutoUpdater } = require('electron-updater');
  const assertUpdateUi = async (label, expected) => {
    const actual = await mainWindow.webContents.executeJavaScript(
      '({ downloadHidden: downloadUpdateButton.hidden, installHidden: installUpdateButton.hidden, status: updateStatusEl.textContent })'
    );
    for (const key of Object.keys(expected)) {
      if (actual[key] !== expected[key]) {
        throw new Error(`Update UI state wrong at "${label}": expected ${key}=${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])} (full: ${JSON.stringify(actual)})`);
      }
    }
  };
  smokeAutoUpdater.emit('update-available', { version: '9.9.9' });
  await new Promise((resolve) => setTimeout(resolve, 300));
  await assertUpdateUi('available', { downloadHidden: false, installHidden: true });
  await mainWindow.webContents.executeJavaScript("checkUpdatesButton.scrollIntoView({ block: 'center' })");
  await captureScreenshot('09e-update-available.png');
  smokeAutoUpdater.emit('download-progress', { percent: 42 });
  await new Promise((resolve) => setTimeout(resolve, 300));
  await assertUpdateUi('downloading', { downloadHidden: false, installHidden: true });
  await captureScreenshot('09f-update-downloading.png');
  smokeAutoUpdater.emit('update-downloaded', { version: '9.9.9' });
  await new Promise((resolve) => setTimeout(resolve, 300));
  await assertUpdateUi('downloaded', { downloadHidden: true, installHidden: false });
  await captureScreenshot('09g-update-downloaded.png');
  // Appearance: click through each color scheme and the light/dark toggle for real, and confirm the
  // choice actually round-trips through localStorage (not just that the swatch looks selected) --
  // this is what theme.js reads on the next launch to avoid a flash of the wrong theme.
  await mainWindow.webContents.executeJavaScript("document.querySelector('[data-theme-choice=\"zinc\"]').click()");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('09a-theme-zinc.png');
  await mainWindow.webContents.executeJavaScript("document.querySelector('[data-theme-choice=\"emerald\"]').click()");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('09b-theme-emerald.png');
  await mainWindow.webContents.executeJavaScript("appearanceModeToggle.click()");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('09c-theme-emerald-light.png');
  const savedTheme = await mainWindow.webContents.executeJavaScript("localStorage.getItem('gym-checkin-theme')");
  const savedMode = await mainWindow.webContents.executeJavaScript("localStorage.getItem('gym-checkin-mode')");
  if (savedTheme !== 'emerald' || savedMode !== 'light') {
    throw new Error(`Appearance did not persist to localStorage as expected: theme=${savedTheme} mode=${savedMode}`);
  }
  await mainWindow.webContents.executeJavaScript(
    "document.querySelector('[data-theme-choice=\"indigo\"]').click(); appearanceModeToggle.click();"
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('09d-theme-indigo-dark.png');
  await mainWindow.webContents.executeJavaScript(
    "document.querySelector('[data-theme-choice=\"slate\"]').click();"
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  // Language: switch to Czech live (no restart) and confirm the static UI actually re-rendered in
  // Czech, not just that the button looks selected -- this is the one live-translation path that
  // isn't covered by the unit tests in test/shared.test.js, which only check the lookup logic in
  // isolation, never a real DOM.
  await mainWindow.webContents.executeJavaScript(
    "document.querySelector('[data-language-choice=\"cs\"]').click()"
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  const czechHeading = await mainWindow.webContents.executeJavaScript("document.querySelector('#admin-title').textContent");
  if (czechHeading !== 'Správa členů') {
    throw new Error(`Language switch to Czech did not take effect -- #admin-title read "${czechHeading}"`);
  }
  await captureScreenshot('09h-settings-czech.png');
  await mainWindow.webContents.executeJavaScript(
    "document.querySelector('[data-language-choice=\"en\"]').click()"
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  // Scan method: purely cosmetic (see applyScanMethod's own comment -- a card reader and a barcode
  // scanner are indistinguishable to scan-router.js), but confirm the swap actually reaches the DOM
  // -- the idle-view text/icon (checked directly, since single-window smoke mode never shows that
  // customer-facing stage to screenshot) and the still-visible Add-member hint/test-scan labels.
  await mainWindow.webContents.executeJavaScript("document.querySelector('[data-scan-method-choice=\"barcode\"]').click()");
  await new Promise((resolve) => setTimeout(resolve, 300));
  const barcodeState = await mainWindow.webContents.executeJavaScript(`({
    idleHeading: idleHeading.textContent,
    cardIconHidden: scanCardIcon.hidden,
    barcodeIconHidden: scanBarcodeIcon.hidden,
    captureHint: cardCaptureHint.textContent,
    capturedUidPlaceholder: capturedUid.textContent,
    scanDifferentLabel: scanDifferentCardButton.textContent,
    testLabel: testToggle.textContent,
    scanHint: document.querySelector('#scan-hint').textContent
  })`);
  if (barcodeState.idleHeading !== 'Scan your membership barcode'
    || barcodeState.cardIconHidden !== true || barcodeState.barcodeIconHidden !== false
    || barcodeState.captureHint !== 'Scan an unassigned barcode'
    || barcodeState.capturedUidPlaceholder !== 'Waiting for barcode…'
    || barcodeState.scanDifferentLabel !== 'Scan a different barcode'
    || barcodeState.testLabel !== 'Test a scan'
    || !barcodeState.scanHint.startsWith('Waiting for barcode')) {
    throw new Error(`Scan method did not switch to barcode wording as expected: ${JSON.stringify(barcodeState)}`);
  }
  await mainWindow.webContents.executeJavaScript("setAdminTab('add')");
  await new Promise((resolve) => setTimeout(resolve, 300));
  await captureScreenshot('09j-scan-method-barcode.png');
  await mainWindow.webContents.executeJavaScript("document.querySelector('[data-scan-method-choice=\"card\"]').click()");
  await new Promise((resolve) => setTimeout(resolve, 300));
  // Session expiry: main.js's own 5-minute staff-session timer (STAFF_SESSION_MS) can lock the
  // server side at any moment the renderer isn't watching for it -- simulate that exact race by
  // calling lock-staff directly (bypassing the renderer's own closeAdmin/staffSessionActive path
  // entirely, same as a real silent timeout would) while the dashboard still thinks it's unlocked,
  // then trigger any assertUnlocked()-gated action. Previously this just showed "please unlock
  // again" as inline text and left the dashboard sitting there, still unlocked, doing nothing --
  // confirm it now actually puts the PIN screen back up.
  await mainWindow.webContents.executeJavaScript("window.gym.lockStaff()");
  await mainWindow.webContents.executeJavaScript("saveRetentionButton.click()");
  await new Promise((resolve) => setTimeout(resolve, 400));
  const relockedAfterExpiry = await mainWindow.webContents.executeJavaScript("!staffLockView.hidden && adminContent.hidden");
  if (!relockedAfterExpiry) {
    throw new Error('A session-expiry (not_authorized) response did not put the PIN screen back up as expected');
  }
  await captureScreenshot('09i-session-expired-relock.png');
  await mainWindow.webContents.executeJavaScript("staffLockPinInput.value = '1234'; staffLockEnterForm.requestSubmit();");
  await new Promise((resolve) => setTimeout(resolve, 500));
  // The Lock button replaces the old "close admin" X now that the dashboard is a permanent page --
  // verify the full round trip for real: click it, confirm the PIN screen reappears (not a blank/
  // hidden page), then unlock again and confirm the dashboard returns to the same tab.
  await mainWindow.webContents.executeJavaScript("adminClose.click()");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('10-locked.png');
  await mainWindow.webContents.executeJavaScript("staffLockPinInput.value = '1234'; staffLockEnterForm.requestSubmit();");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await captureScreenshot('10b-unlocked-again.png');

  // Reader-with-no-Enter-terminator: confirmed against a real reader in the field whose UID sat
  // correctly detected in scanState (allFast, past MIN_SCAN_LENGTH) the entire time and simply never
  // got acted on, because the app previously only ever dispatched a scan from inside the Enter
  // handler. Dispatching real keydown events in a tight loop naturally produces sub-millisecond
  // gaps (all within one synchronous tick) without needing to fake timestamps, so this exercises the
  // real advanceScanState()/tryAutoDispatchScan() path exactly as a genuine fast reader would drive
  // it -- deliberately never dispatches 'Enter' at all.
  await mainWindow.webContents.executeJavaScript(
    "['1','0','0','0','0','0','0','1'].forEach((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));"
  );
  await new Promise((resolve) => setTimeout(resolve, 800)); // SCAN_AUTO_DISPATCH_PAUSE_MS (300ms) plus room for the real check-in IPC round trip
  const noEnterScanResult = await mainWindow.webContents.executeJavaScript(
    '({ uid: activityFeedEntries[0]?.uid, allowed: activityFeedEntries[0]?.allowed })'
  );
  if (noEnterScanResult.uid !== '10000001' || noEnterScanResult.allowed !== true) {
    throw new Error(`A fast scan with no Enter terminator was not auto-dispatched as expected: ${JSON.stringify(noEnterScanResult)}`);
  }

  // Unsaved-changes/risky-edit confirms (see confirmDiscardUnsavedChanges and
  // describeRiskyEditChanges in renderer.js): verifies a dirty Add-member form actually blocks a tab
  // switch when the user says Cancel, actually proceeds and discards when they say OK, and that the
  // Edit form's risky-change message comes out combined and correctly worded. Never touches a REAL
  // window.confirm() (which would hang this whole script waiting for a click nothing can provide) --
  // window.confirm is swapped for a canned function for the duration of each check instead.
  await mainWindow.webContents.executeJavaScript(`(async () => {
    setAdminTab('add');
    const first = document.querySelector('#first-name');
    first.value = 'Temp';
    first.dispatchEvent(new Event('input', { bubbles: true }));
    const dirtyAfterTyping = window.__gymHasUnsavedChanges();

    window.confirm = () => false; // simulate clicking Cancel on the discard prompt
    setAdminTab('renew');
    const blockedTab = currentAdminTab;
    const stillDirtyAfterBlock = addMemberDirty;

    window.confirm = () => true; // simulate clicking OK
    setAdminTab('renew');
    const allowedTab = currentAdminTab;
    const clearAfterAllow = addMemberDirty;
    const firstNameAfterDiscard = document.querySelector('#first-name').value;

    const riskyBoth = describeRiskyEditChanges(
      { name: 'Test Person', membershipStatus: 'active', cardUid: 'AAA' },
      { membershipStatus: 'cancelled', cardUid: 'BBB' }
    );
    const riskyNone = describeRiskyEditChanges(
      { name: 'Test Person', membershipStatus: 'active', cardUid: 'AAA' },
      { membershipStatus: 'active', cardUid: 'AAA' }
    );

    return { dirtyAfterTyping, blockedTab, stillDirtyAfterBlock, allowedTab, clearAfterAllow, firstNameAfterDiscard, riskyBoth, riskyNone };
  })()`).then((result) => {
    const expected = {
      dirtyAfterTyping: true,
      blockedTab: 'add',
      stillDirtyAfterBlock: true,
      allowedTab: 'renew',
      clearAfterAllow: false,
      firstNameAfterDiscard: '',
      riskyBoth: 'Test Person: Changes their status to cancelled. Replaces their linked card (was AAA, now BBB). Continue?',
      riskyNone: null
    };
    for (const key of Object.keys(expected)) {
      if (JSON.stringify(result[key]) !== JSON.stringify(expected[key])) {
        throw new Error(`Unsaved-changes/risky-edit check "${key}" failed: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(result[key])} (full: ${JSON.stringify(result)})`);
      }
    }
  });

  const errorLogPath = path.join(smokeDirectory, 'console-errors.log');
  if (rendererErrors.length) {
    fs.writeFileSync(errorLogPath, rendererErrors.join('\n'));
    console.error(`${rendererErrors.length} renderer console error(s) during smoke capture -- see ${errorLogPath}`);
    rendererErrors.forEach((line) => console.error('  ', line));
  } else if (fs.existsSync(errorLogPath)) {
    fs.unlinkSync(errorLogPath); // stale from a previous failing run in the same directory
  }

  mainWindow.destroy();
  app.quit();
}

async function captureScreenshot(fileName) {
  await captureWindowScreenshot(kioskWindow, fileName);
}

app.whenReady().then(async () => {
  // Webcam photo capture (member editor's "Take photo") needs camera access, which Electron blocks
  // by default. Safe to always allow here: this app never loads any remote/third-party content, so
  // every request can only ever come from our own local pages, never a stray website.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => permission === 'media');

  databasePath = smokeDirectory ? ':memory:' : path.join(app.getPath('userData'), 'gym-checkin.sqlite');
  // Smoke mode must never write into the real userData folder -- the database already avoids this
  // (in-memory above), but photos didn't: a smoke run that actually captures/saves a photo (the
  // webcam "Take photo" flow, on a machine that has a real camera) used to land a real file in the
  // real app-data folder, outliving the smoke run itself. Route it into the throwaway smoke
  // directory instead, same as the screenshots and console-errors.log already are.
  photosDir = smokeDirectory ? path.join(smokeDirectory, 'photos') : path.join(app.getPath('userData'), 'photos');

  try {
    gymDatabase = new GymDatabase(databasePath);
  } catch (error) {
    logger.logError('startup', 'Failed to open the member database', error);
    dialog.showErrorBox(
      'Gym Check-in could not start',
      'The member database could not be opened or upgraded, so the app cannot continue.\n\n'
      + `Details: ${error.message}\n\n`
      + `If a schema upgrade was in progress, a backup copy may have been saved next to:\n${databasePath}\n`
      + '(look for a file named "gym-checkin.pre-migration-<timestamp>.sqlite").\n\n'
      + `A log of this error was saved to:\n${logger.getLogFilePath()}\n\n`
      + 'Please back up the database file, send that log file, and contact support before trying again.'
    );
    app.quit();
    return;
  }

  gymDatabase.seedDemoMembers();
  kioskLockdownEnabled = gymDatabase.getKioskLockdown();
  dualScreenEnabled = gymDatabase.getDualScreenEnabled();
  currentLanguage = gymDatabase.getLanguage();

  // GDPR storage-limitation: prune check-ins past the configured retention window on every launch.
  // Cheap at this dataset size and means nobody has to remember to do it by hand.
  const purged = gymDatabase.purgeOldCheckIns();
  if (purged > 0) console.log(`Purged ${purged} check-in record(s) past the retention window.`);

  // The smoke-capture path (--smoke-dir=, an in-memory DB reachable only via a CLI flag, never from
  // the packaged end-user app) drives the admin UI directly for screenshots; it isn't a real staff
  // session, so it starts pre-unlocked rather than needing a PIN typed via executeJavaScript.
  if (smokeDirectory) unlockStaff();

  ipcMain.handle('check-in', (event, uid) => {
    let result;
    try {
      result = gymDatabase.checkIn(uid);
    } catch (error) {
      logger.logError('checkin', 'Check-in failed', error);
      result = { allowed: false, reason: 'system_error', uid: normaliseUid(uid) };
    }
    // Dual-screen: a scan can be physically caught by either window depending on which one has OS
    // focus. If it wasn't the kiosk window itself, push the result there so the customer-facing
    // display still shows it -- the window that actually caught it shows its own local toast.
    if (staffWindow && kioskWindow && event.sender.id !== kioskWindow.webContents.id && !kioskWindow.isDestroyed()) {
      kioskWindow.webContents.send('remote-checkin-result', result);
    }
    // Smoke captures fire dozens of synthetic scans headlessly; a real popup/beep for each would be
    // noise, not a bug report, so skip notifications there rather than suppressing this in production.
    if (!smokeDirectory) notifyCheckIn(result);
    // The "last check-in" glance in the admin header updates from this broadcast alone (not from the
    // window that made the request directly) so it stays correct in every window-mode combination --
    // including dual-screen, where the kiosk window can catch a scan the staff window never sees any
    // other way. Harmless on the kiosk window itself: kiosk role never renders the admin header this
    // feeds, since it can't open the admin panel at all (see applyWindowRole in renderer.js).
    for (const win of [kioskWindow, staffWindow]) {
      if (win && !win.isDestroyed()) win.webContents.send('checkin-glance-update', result);
    }
    return result;
  });
  ipcMain.handle('search-check-ins', (_event, filters) => adminResult(() => {
    assertUnlocked();
    return gymDatabase.searchCheckIns(filters);
  }));
  ipcMain.handle('export-check-ins-csv', async (_event, filters) => {
    if (!staffUnlocked) return { ok: false, error: 'not_authorized' };
    const CSV_EXPORT_CAP = 5000;
    const rows = gymDatabase.searchCheckIns({ ...filters, limit: CSV_EXPORT_CAP, offset: 0 });
    const csv = toCsv(
      [
        { key: 'checkedInAt', label: t(currentLanguage, 'main.csv.checkedInAt') },
        { key: 'name', label: t(currentLanguage, 'main.csv.name') },
        { key: 'uid', label: t(currentLanguage, 'main.csv.cardUid') },
        { key: 'outcome', label: t(currentLanguage, 'main.csv.outcome') },
        { key: 'reason', label: t(currentLanguage, 'main.csv.reason') }
      ],
      rows.map((row) => ({ ...row, outcome: t(currentLanguage, row.allowed ? 'common.approved' : 'common.denied') }))
    );
    const target = await dialog.showSaveDialog(staffFacingWindow(), {
      title: t(currentLanguage, 'main.dialogs.exportHistoryTitle'),
      defaultPath: `gym-checkin-history-${localDateString()}.csv`,
      filters: [{ name: t(currentLanguage, 'main.dialogs.csvFilterName'), extensions: ['csv'] }]
    });
    if (target.canceled || !target.filePath) return { ok: false, error: 'cancelled' };
    try {
      fs.writeFileSync(target.filePath, csv);
      return { ok: true, data: { path: target.filePath, count: rows.length, truncated: rows.length >= CSV_EXPORT_CAP } };
    } catch (error) {
      logger.logError('export', 'Check-in history export failed', error);
      return { ok: false, error: 'operation_failed' };
    }
  });
  ipcMain.handle('recent-check-ins', () => gymDatabase.recentCheckIns());

  // --- Staff auth ---------------------------------------------------------------------------------
  ipcMain.handle('has-staff-pin', () => gymDatabase.hasStaffPin());

  ipcMain.handle('verify-staff-pin', (_event, pin) => {
    const now = Date.now();
    if (now < lockoutUntil) {
      return { ok: false, error: 'locked_out', retryAfterMs: lockoutUntil - now };
    }
    if (!gymDatabase.verifyStaffPin(pin)) {
      failedPinAttempts += 1;
      if (failedPinAttempts >= LOCKOUT_THRESHOLD) {
        const backoff = Math.min(LOCKOUT_MAX_MS, LOCKOUT_BASE_MS * 2 ** (failedPinAttempts - LOCKOUT_THRESHOLD));
        lockoutUntil = now + backoff;
      }
      return { ok: false, error: 'wrong_pin' };
    }
    unlockStaff();
    return { ok: true };
  });

  ipcMain.handle('set-staff-pin', (_event, input) => adminResult(() => {
    const { recoveryCode } = gymDatabase.setStaffPin(input?.newPin, input?.currentPin);
    unlockStaff();
    return { recoveryCode };
  }));

  ipcMain.handle('lock-staff', () => {
    lockStaff();
    return true;
  });

  ipcMain.handle('reset-staff-pin-with-recovery', (_event, input) => {
    const now = Date.now();
    if (now < recoveryLockoutUntil) {
      return { ok: false, error: 'locked_out', retryAfterMs: recoveryLockoutUntil - now };
    }
    const result = adminResult(() => gymDatabase.resetStaffPinWithRecovery(input?.recoveryCode, input?.newPin));
    if (!result.ok) {
      if (result.error === 'wrong_recovery_code') {
        failedRecoveryAttempts += 1;
        if (failedRecoveryAttempts >= LOCKOUT_THRESHOLD) {
          const backoff = Math.min(LOCKOUT_MAX_MS, LOCKOUT_BASE_MS * 2 ** (failedRecoveryAttempts - LOCKOUT_THRESHOLD));
          recoveryLockoutUntil = now + backoff;
        }
      }
      return result;
    }
    failedRecoveryAttempts = 0;
    unlockStaff();
    return result;
  });

  ipcMain.handle('regenerate-recovery-code', (_event, input) => adminResult(() => {
    assertUnlocked();
    return { recoveryCode: gymDatabase.regenerateRecoveryCodeWithPin(input?.currentPin) };
  }));

  // --- Admin (all require an unlocked staff session) ----------------------------------------------
  ipcMain.handle('add-member', (_event, input) => adminResult(() => {
    assertUnlocked();
    return gymDatabase.addMember(input);
  }));
  ipcMain.handle('update-member', (_event, input) => adminResult(() => {
    assertUnlocked();
    return gymDatabase.updateMember(input);
  }));
  ipcMain.handle('search-members', (_event, query) => adminResult(() => {
    assertUnlocked();
    return gymDatabase.searchMembers(query);
  }));
  ipcMain.handle('renew-member', (_event, input) => adminResult(() => {
    assertUnlocked();
    return gymDatabase.renewMember(input?.memberId, input?.renewalType, {
      validUntil: input?.validUntil,
      amountCents: input?.amountCents
    });
  }));
  ipcMain.handle('delete-member', (_event, input) => adminResult(() => {
    assertUnlocked();
    const { photoPath } = gymDatabase.deleteMember(input?.memberId);
    deleteOwnedPhotoFile(photoPath);
  }));
  ipcMain.handle('expiring-members', (_event, withinDays) => adminResult(() => {
    assertUnlocked();
    return gymDatabase.expiringMembers(Number(withinDays) || 7);
  }));

  // --- Member photos --------------------------------------------------------------------------
  ipcMain.handle('choose-member-photo', async () => {
    if (!staffUnlocked) return { ok: false, error: 'not_authorized' };
    const result = await dialog.showOpenDialog(staffFacingWindow(), {
      title: t(currentLanguage, 'main.dialogs.choosePhotoTitle'),
      properties: ['openFile'],
      filters: [{ name: t(currentLanguage, 'main.dialogs.imagesFilterName'), extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
    });
    if (result.canceled || !result.filePaths.length) return { ok: false, error: 'cancelled' };
    return { ok: true, data: { path: result.filePaths[0] } };
  });
  ipcMain.handle('set-member-photo', (_event, input) => adminResult(() => {
    assertUnlocked();
    const memberId = Number(input?.memberId);
    const sourcePath = String(input?.sourcePath ?? '');
    if (!Number.isInteger(memberId) || memberId < 1) throw new Error('invalid_member');
    if (!isAllowedImageExtension(sourcePath)) throw new Error('invalid_photo');
    let stats;
    try {
      stats = fs.statSync(sourcePath);
    } catch {
      throw new Error('invalid_photo');
    }
    if (!stats.isFile() || stats.size > MAX_PHOTO_BYTES) throw new Error('invalid_photo');

    fs.mkdirSync(photosDir, { recursive: true });
    const destPath = path.join(photosDir, `${memberId}-${Date.now()}${path.extname(sourcePath).toLowerCase()}`);
    fs.copyFileSync(sourcePath, destPath);

    const { previousPhotoPath } = gymDatabase.setMemberPhoto(memberId, destPath);
    deleteOwnedPhotoFile(previousPhotoPath);
    return { photoPath: destPath };
  }));
  // The member editor's "Take photo" -- a still captured client-side from the webcam via canvas,
  // handed over as a data URL rather than a file path (there's no source file on disk to point at).
  ipcMain.handle('capture-member-photo', (_event, input) => adminResult(() => {
    assertUnlocked();
    const memberId = Number(input?.memberId);
    if (!Number.isInteger(memberId) || memberId < 1) throw new Error('invalid_member');
    const parsed = parseCapturedPhotoDataUrl(input?.dataUrl, MAX_PHOTO_BYTES);
    if (!parsed) throw new Error('invalid_photo');

    fs.mkdirSync(photosDir, { recursive: true });
    const destPath = path.join(photosDir, `${memberId}-${Date.now()}${parsed.extension}`);
    fs.writeFileSync(destPath, parsed.buffer);

    const { previousPhotoPath } = gymDatabase.setMemberPhoto(memberId, destPath);
    deleteOwnedPhotoFile(previousPhotoPath);
    return { photoPath: destPath };
  }));
  ipcMain.handle('remove-member-photo', (_event, input) => adminResult(() => {
    assertUnlocked();
    const { previousPhotoPath } = gymDatabase.setMemberPhoto(input?.memberId, null);
    deleteOwnedPhotoFile(previousPhotoPath);
  }));

  ipcMain.handle('get-kiosk-lockdown', () => kioskLockdownEnabled);
  ipcMain.handle('set-kiosk-lockdown', (_event, enabled) => adminResult(() => {
    assertUnlocked();
    const value = Boolean(enabled);
    gymDatabase.setKioskLockdown(value);
    kioskLockdownEnabled = value;
    // Only ever forced onto a genuine customer-facing kiosk display. In single-window mode,
    // `kioskWindow` is the staff's own dashboard (see createWindows) -- applying real OS kiosk mode
    // to it would trap staff in a borderless fullscreen window with no way to Alt+Tab to MultiSport.
    if (kioskWindowIsCustomerFacing && kioskWindow && !kioskWindow.isDestroyed()) kioskWindow.setKiosk(value);
  }));

  ipcMain.handle('get-language', () => currentLanguage);
  ipcMain.handle('set-language', (_event, language) => adminResult(() => {
    assertUnlocked();
    gymDatabase.setLanguage(language);
    currentLanguage = language;
  }));

  ipcMain.handle('get-dual-screen-enabled', () => dualScreenEnabled);
  ipcMain.handle('set-dual-screen-enabled', (_event, enabled) => adminResult(() => {
    assertUnlocked();
    gymDatabase.setDualScreenEnabled(Boolean(enabled));
    // Deliberately not applied live -- see the comment on the `dualScreenEnabled` variable.
  }));

  ipcMain.handle('get-checkin-retention-days', () => gymDatabase.getCheckinRetentionDays());
  ipcMain.handle('set-checkin-retention-days', (_event, days) => adminResult(() => {
    assertUnlocked();
    gymDatabase.setCheckinRetentionDays(days);
  }));

  ipcMain.handle('export-member-data', async (_event, input) => {
    if (!staffUnlocked) return { ok: false, error: 'not_authorized' };
    let data;
    try {
      data = gymDatabase.exportMemberData(input?.memberId);
    } catch (error) {
      logger.logError('export', 'Member data export failed', error);
      return { ok: false, error: publicErrors.has(error.message) ? error.message : 'operation_failed' };
    }
    const target = await dialog.showSaveDialog(staffFacingWindow(), {
      title: t(currentLanguage, 'main.dialogs.exportMemberDataTitle'),
      defaultPath: `${data.member.name.replace(/[^a-z0-9]+/gi, '-')}-data-export.json`,
      filters: [{ name: t(currentLanguage, 'main.dialogs.jsonFilterName'), extensions: ['json'] }]
    });
    if (target.canceled || !target.filePath) return { ok: false, error: 'cancelled' };
    try {
      fs.writeFileSync(target.filePath, JSON.stringify(data, null, 2));
      return { ok: true, data: { path: target.filePath } };
    } catch (error) {
      logger.logError('export', 'Member data export write failed', error);
      return { ok: false, error: 'operation_failed' };
    }
  });

  ipcMain.handle('export-backup', async () => {
    if (!staffUnlocked) return { ok: false, error: 'not_authorized' };
    if (databasePath === ':memory:') return { ok: false, error: 'operation_failed' };
    const target = await dialog.showSaveDialog(staffFacingWindow(), {
      title: t(currentLanguage, 'main.dialogs.exportBackupTitle'),
      defaultPath: `gym-checkin-backup-${localDateString()}.sqlite`,
      filters: [{ name: t(currentLanguage, 'main.dialogs.sqliteFilterName'), extensions: ['sqlite'] }]
    });
    if (target.canceled || !target.filePath) return { ok: false, error: 'cancelled' };
    try {
      fs.copyFileSync(databasePath, target.filePath);
      return { ok: true, data: { path: target.filePath } };
    } catch (error) {
      logger.logError('export', 'Backup export failed', error);
      return { ok: false, error: 'operation_failed' };
    }
  });

  // The point of the whole logger module (see src/logger.js) -- lets staff hand over a real record
  // of what happened instead of describing it from memory. Gated the same way as every other export
  // here, since a log can contain member names/UIDs from error messages, not just technical detail.
  ipcMain.handle('export-log-file', async () => {
    if (!staffUnlocked) return { ok: false, error: 'not_authorized' };
    const logPath = logger.getLogFilePath();
    if (!logPath || !fs.existsSync(logPath)) return { ok: false, error: 'no_log_yet' };
    const target = await dialog.showSaveDialog(staffFacingWindow(), {
      title: t(currentLanguage, 'main.dialogs.exportLogTitle'),
      defaultPath: `gym-checkin-log-${localDateString()}.txt`,
      filters: [{ name: t(currentLanguage, 'main.dialogs.textFilterName'), extensions: ['txt', 'log'] }]
    });
    if (target.canceled || !target.filePath) return { ok: false, error: 'cancelled' };
    try {
      fs.copyFileSync(logPath, target.filePath);
      return { ok: true, data: { path: target.filePath } };
    } catch (error) {
      logger.logError('export', 'Log file export failed', error);
      return { ok: false, error: 'operation_failed' };
    }
  });

  // A second, simpler way to get the same file out during a real incident -- Export above needs
  // staff to navigate a save dialog and then go find where they put it before they can actually
  // send it anywhere. This just opens the folder with the file already selected, so it's a
  // right-click away from being attached to an email/message however they normally would -- no
  // dialog, no remembering a save location, no typing a path into File Explorer by hand.
  ipcMain.handle('open-log-folder', () => {
    if (!staffUnlocked) return { ok: false, error: 'not_authorized' };
    const logPath = logger.getLogFilePath();
    if (!logPath || !fs.existsSync(logPath)) return { ok: false, error: 'no_log_yet' };
    shell.showItemInFolder(logPath);
    return { ok: true };
  });

  ipcMain.handle('app-info', (event) => {
    let windowRole = 'single';
    if (staffWindow && kioskWindow) {
      if (event.sender.id === kioskWindow.webContents.id) windowRole = 'kiosk';
      else if (event.sender.id === staffWindow.webContents.id) windowRole = 'staff';
    }
    return { databasePath, smoke: Boolean(smokeDirectory), windowRole, language: currentLanguage, version: app.getVersion() };
  });

  ipcMain.handle('photo-url', (_event, photoPath) => {
    const resolved = resolvePhotoPath(photoPath, {
      demoPhotosDir: DEMO_PHOTOS_DIR,
      allowedRoots: [ASSETS_DIR, app.getPath('userData')]
    });
    return resolved ? pathToFileURL(resolved).href : null;
  });

  // --- Updater: manual check always available; automatic check at most once a day. See
  // UPDATER_SETUP.md for the one-time GitHub setup either path needs before a check can succeed. ---
  wireUpdater(() => staffFacingWindow());
  ipcMain.handle('check-for-updates', async () => {
    try {
      await checkForUpdatesManually();
      return { ok: true };
    } catch (error) {
      logger.logError('updater', 'Manual update check failed', error);
      return { ok: false, error: 'update_check_failed', message: error?.message };
    }
  });
  ipcMain.handle('download-update', async () => {
    try {
      await downloadUpdate();
      return { ok: true };
    } catch (error) {
      logger.logError('updater', 'Update download failed', error);
      return { ok: false, error: 'update_download_failed', message: error?.message };
    }
  });
  ipcMain.handle('quit-and-install-update', () => {
    // Already confirmed its own way (the "Restart and install" button's own window.confirm in
    // renderer.js) -- skip the generic quit warning below so this isn't confirmed twice in a row.
    quittingConfirmed = true;
    quitAndInstallUpdate();
  });

  // Never in smoke mode (no network activity during a capture run) or an unpackaged dev run (checks
  // against a real GitHub release don't make sense while iterating locally).
  if (!smokeDirectory && app.isPackaged) {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const lastCheckAt = gymDatabase.getLastUpdateCheckAt();
    const dueForCheck = !lastCheckAt || Date.now() - new Date(lastCheckAt).getTime() >= ONE_DAY_MS;
    if (dueForCheck) {
      gymDatabase.setLastUpdateCheckAt(new Date().toISOString());
      checkForUpdatesAutomatically();
    }
  }

  await createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (gymDatabase) gymDatabase.close();
});
