const IDLE_TIMEOUT_MS = 7000;
const DUPLICATE_WINDOW_MS = 1500;
const TOAST_VISIBLE_MS = 4000;

// A renderer-side bug that isn't wrapped in its own try/catch previously vanished silently on a real
// kiosk (no DevTools open in production) -- main.js's console-message listener already forwards
// every console.error() from this page into the persistent log file (see src/logger.js), so routing
// both of these through console.error is enough to get them there too, with no separate IPC call
// needed. Registered first, before anything else in this file has a chance to throw.
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const body = document.body;
const idleView = document.querySelector('#idle-view');
const resultView = document.querySelector('#result-view');
const memberPhoto = document.querySelector('#member-photo');
const memberName = document.querySelector('#member-name');
const resultEyebrow = document.querySelector('#result-eyebrow');
const resultMessage = document.querySelector('#result-message');
const membershipPill = document.querySelector('#membership-pill');
const portraitBadge = document.querySelector('#portrait-badge');
const resetProgress = document.querySelector('#reset-progress');
const assignCardButton = document.querySelector('#assign-card-button');
const testToggle = document.querySelector('#test-toggle');
const testForm = document.querySelector('#test-form');
const testUid = document.querySelector('#test-uid');
const testUidLabel = document.querySelector('label[for="test-uid"]');
const toastStack = document.querySelector('#toast-stack');
const idleHeading = document.querySelector('#idle-view h1');
const idleSubhead = document.querySelector('#idle-view .subhead');
const scanCardIcon = document.querySelector('#scan-card-icon');
const scanBarcodeIcon = document.querySelector('#scan-barcode-icon');
const cardCaptureHint = document.querySelector('#card-capture strong');

const adminModal = document.querySelector('#admin-modal');
const adminHeader = document.querySelector('#admin-header');
const adminToggle = document.querySelector('#admin-toggle');
const adminClose = document.querySelector('#admin-close');
const dashboardTestToggle = document.querySelector('#dashboard-test-toggle');
const dashboardTestForm = document.querySelector('#dashboard-test-form');
const dashboardTestUid = document.querySelector('#dashboard-test-uid');
const adminTabs = [...document.querySelectorAll('[data-admin-tab]')];
const adminContent = document.querySelector('#admin-content');
const adminAdd = document.querySelector('#admin-add');
const adminRenew = document.querySelector('#admin-renew');
const adminHistory = document.querySelector('#admin-history');
const adminSettings = document.querySelector('#admin-settings');
const activityFeedList = document.querySelector('#activity-feed-list');
const historyQuery = document.querySelector('#history-query');
const historyFromDate = document.querySelector('#history-from-date');
const historyToDate = document.querySelector('#history-to-date');
const historyFilterButton = document.querySelector('#history-filter-button');
const historyClearButton = document.querySelector('#history-clear-button');
const historyResults = document.querySelector('#history-results');
const historyCount = document.querySelector('#history-count');
const historyLoadMoreButton = document.querySelector('#history-load-more-button');
const historyExportButton = document.querySelector('#history-export-button');
const historyStatus = document.querySelector('#history-status');
const cardCapture = document.querySelector('#card-capture');
const capturedUid = document.querySelector('#captured-uid');
const memberCardUid = document.querySelector('#member-card-uid');
const scanDifferentCardButton = document.querySelector('#scan-different-card');
const addMemberForm = document.querySelector('#add-member-form');
const addMemberStatus = document.querySelector('#add-member-status');
const monthlyFields = document.querySelector('#monthly-fields');
const punchcardFields = document.querySelector('#punchcard-fields');
const validUntil = document.querySelector('#valid-until');
const passesRemaining = document.querySelector('#passes-remaining');
const memberSearch = document.querySelector('#member-search');
const scanToFindButton = document.querySelector('#scan-to-find-button');
const searchResults = document.querySelector('#search-results');
const renewStatus = document.querySelector('#renew-status');
const memberCount = document.querySelector('#member-count');
const editMemberForm = document.querySelector('#edit-member-form');
const editMemberCancel = document.querySelector('#edit-member-cancel');
const editMemberTitle = document.querySelector('#edit-member-title');
const editMemberStatus = document.querySelector('#edit-member-status');
const editMembershipType = document.querySelector('#edit-membership-type');
const editMonthlyField = document.querySelector('#edit-monthly-field');
const editPunchcardField = document.querySelector('#edit-punchcard-field');
const editValidUntil = document.querySelector('#edit-valid-until');
const editPassesRemaining = document.querySelector('#edit-passes-remaining');
const scanReplaceCardButton = document.querySelector('#scan-replace-card-button');

const staffLockView = document.querySelector('#staff-lock');
const staffLockStatus = document.querySelector('#staff-lock-status');
const staffLockEnterForm = document.querySelector('#staff-lock-enter-form');
const staffLockSetupForm = document.querySelector('#staff-lock-setup-form');
const staffLockPinInput = document.querySelector('#staff-lock-pin');
const staffLockNewPin = document.querySelector('#staff-lock-new-pin');
const staffLockConfirmPin = document.querySelector('#staff-lock-confirm-pin');
const staffLockForgotButton = document.querySelector('#staff-lock-forgot-button');
const staffLockRecoverForm = document.querySelector('#staff-lock-recover-form');
const staffLockRecoveryCode = document.querySelector('#staff-lock-recovery-code');
const staffLockRecoveryNewPin = document.querySelector('#staff-lock-recovery-new-pin');
const staffLockRecoveryConfirmPin = document.querySelector('#staff-lock-recovery-confirm-pin');
const staffLockRecoverCancel = document.querySelector('#staff-lock-recover-cancel');
const staffLockRecoveryReveal = document.querySelector('#staff-lock-recovery-reveal');
const staffLockRecoveryCodeDisplay = document.querySelector('#staff-lock-recovery-code-display');
const staffLockRecoveryContinue = document.querySelector('#staff-lock-recovery-continue');

const changePinForm = document.querySelector('#change-pin-form');
const changePinStatus = document.querySelector('#change-pin-status');
const regenerateRecoveryButton = document.querySelector('#regenerate-recovery-button');
const exportBackupButton = document.querySelector('#export-backup-button');
const backupStatus = document.querySelector('#backup-status');
const exportLogButton = document.querySelector('#export-log-button');
const diagnosticsStatus = document.querySelector('#diagnostics-status');
const checkUpdatesButton = document.querySelector('#check-updates-button');
const downloadUpdateButton = document.querySelector('#download-update-button');
const installUpdateButton = document.querySelector('#install-update-button');
const updateStatusEl = document.querySelector('#update-status');
const kioskLockdownToggle = document.querySelector('#kiosk-lockdown-toggle');
const dualScreenToggle = document.querySelector('#dual-screen-toggle');
const appearanceModeToggle = document.querySelector('#appearance-mode-toggle');
const themeSwatches = [...document.querySelectorAll('.theme-swatch')];
const retentionDaysInput = document.querySelector('#retention-days-input');
const saveRetentionButton = document.querySelector('#save-retention-button');
const languageChoiceButtons = [...document.querySelectorAll('.language-choice')];
const scanMethodChoiceButtons = [...document.querySelectorAll('.scan-method-choice')];
const retentionStatus = document.querySelector('#retention-status');
const exportMemberDataButton = document.querySelector('#export-member-data-button');
const stageSection = document.querySelector('.stage');
const footerSection = document.querySelector('.footer');

const addAmountPaid = document.querySelector('#add-amount-paid');
const editAmountPaid = document.querySelector('#edit-amount-paid');
const editMemberPhoto = document.querySelector('#edit-member-photo');
const changePhotoToggle = document.querySelector('#change-photo-toggle');
const changePhotoChoice = document.querySelector('#change-photo-choice');
const takePhotoButton = document.querySelector('#take-photo-button');
const choosePhotoFileButton = document.querySelector('#choose-photo-file-button');
const cancelPhotoChoiceButton = document.querySelector('#cancel-photo-choice-button');
const removePhotoButton = document.querySelector('#remove-photo-button');

const cameraModal = document.querySelector('#camera-modal');
const cameraVideo = document.querySelector('#camera-video');
const cameraCanvas = document.querySelector('#camera-canvas');
const cameraPreview = document.querySelector('#camera-preview');
const cameraStatus = document.querySelector('#camera-status');
const cameraCaptureButton = document.querySelector('#camera-capture-button');
const cameraRetakeButton = document.querySelector('#camera-retake-button');
const cameraUseButton = document.querySelector('#camera-use-button');
const cameraCancelButton = document.querySelector('#camera-cancel-button');
const deleteMemberButton = document.querySelector('#delete-member-button');
const expiringDaysInput = document.querySelector('#expiring-days');
const showExpiringButton = document.querySelector('#show-expiring-button');
const clearExpiringButton = document.querySelector('#clear-expiring-button');

let appInfo = { smoke: false, windowRole: 'single' };
let staffSessionActive = false;
let pendingAdminTab = 'add';
let pendingAdminUid = '';
let armedCaptureTarget = null; // null | 'add-member' | 'edit-member' | 'search'

let scanBuffer = '';
let scanState = { ...EMPTY_STATE };
let lastKeyAt = 0;

let checkInQueue = [];
let processingCheckIn = false;
let lastSubmittedUid = '';
let lastSubmittedAt = 0;

let resetTimer;
let searchTimer;
let lastUnknownUid = '';
let visibleMembers = [];

const HISTORY_PAGE_SIZE = 50;
let historyOffset = 0;
let historySearchTimer;

// The active UI language -- read from the main process (app_meta, not localStorage: main.js needs
// it too, for the OS notification and native dialog titles) as soon as getAppInfo() resolves near
// the bottom of this file, and updated live by the language switcher in Settings. Every function
// below that produces user-facing text reads this at CALL time, not once at load, so a language
// switch takes effect immediately without a restart.
let currentLang = 'en';

// Which physical device staff use to scan a member in -- purely cosmetic (see the "Scan method"
// section far below), read from localStorage since main.js never needs it. Applied during the same
// bootstrap pass as the language, once the DOM and window.i18n are both ready.
let scanMethod = 'card';

const REASON_CODES = new Set([
  'active', 'punchcard', 'expired', 'no_passes', 'frozen', 'cancelled',
  'unknown_card', 'system_error', 'invalid_uid'
]);
const ERROR_CODES = new Set([
  'invalid_uid', 'invalid_name', 'invalid_membership_type', 'invalid_status', 'invalid_date',
  'invalid_passes', 'invalid_member', 'member_not_found', 'card_exists', 'not_authorized',
  'invalid_pin', 'wrong_pin', 'wrong_recovery_code', 'locked_out', 'invalid_amount',
  'invalid_photo', 'invalid_retention_days', 'operation_failed', 'no_log_yet'
]);

// Replaces the old static reasonCopy/errorCopy lookup objects -- both now resolve through
// window.i18n (loaded as a <script> tag, see index.html) against the current language instead of a
// single hardcoded English string per key.
function reasonCopy(reason) {
  const key = REASON_CODES.has(reason) ? reason : 'invalid_uid';
  return {
    eyebrow: window.i18n.t(currentLang, `checkin.reasons.${key}.eyebrow`),
    message: window.i18n.t(currentLang, `checkin.reasons.${key}.message`)
  };
}

// Used only where a bare eyebrow-or-nothing is needed (history rows, activity feed) -- returns null
// for an unrecognised reason so the caller's own "Denied" fallback applies, matching reasonCopy's
// own invalid_uid fallback everywhere else.
function reasonEyebrow(reason) {
  return REASON_CODES.has(reason) ? window.i18n.t(currentLang, `checkin.reasons.${reason}.eyebrow`) : null;
}

function errorText(code, fallback = 'operation_failed') {
  return window.i18n.t(currentLang, `errors.${ERROR_CODES.has(code) ? code : fallback}`);
}

// main.js auto-locks the staff session after 5 minutes (STAFF_SESSION_MS) regardless of what this
// window still thinks -- every mutating IPC call gated by its assertUnlocked() can fail with
// 'not_authorized' as a result, at any point, on any form. Previously that just showed "please
// unlock again" as inline status text and left staff staring at a form that would silently reject
// every further action -- this actually puts the PIN screen back up, which is what that message
// promises. Call this instead of setStatus(..., errorText(error), 'error') for any error that came
// from an assertUnlocked()-gated call (i.e. everywhere except the PIN-entry/recovery forms
// themselves, which use their own not-gated endpoints and handle their own errors in place).
function handleUnauthorized() {
  staffSessionActive = false;
  showStaffLock();
  setStatus(staffLockStatus, errorText('not_authorized'), 'error');
}

// Shorthand for the common "show this IPC error, redirecting to the PIN screen instead if the
// session expired" pattern described above.
function showError(statusElement, error, fallback) {
  if (error === 'not_authorized') {
    handleUnauthorized();
    return;
  }
  setStatus(statusElement, errorText(error, fallback), 'error');
}

// Centralises every date/time display so it follows the selected app language rather than the OS's
// own locale -- passing `undefined` to toLocaleDateString() etc. would use the system locale
// instead, which could silently mismatch a staff member's chosen in-app language.
const DATE_LOCALES = { en: 'en-US', cs: 'cs-CZ' };
function dateLocale() { return DATE_LOCALES[currentLang] || DATE_LOCALES.en; }
function formatDate(date) { return date.toLocaleDateString(dateLocale()); }
function formatDateTime(date) { return date.toLocaleString(dateLocale()); }
function formatTime(date) { return date.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' }); }

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat(dateLocale(), {
    hour: '2-digit', minute: '2-digit'
  }).format(new Date());
}

// normaliseUid, localDateString, membershipEndDate, and wouldDiscardBalance below come from
// ../shared/dates.js and ../shared/renewal.js, loaded as plain <script> tags before this file (see
// index.html) -- not through preload/contextBridge, which can't require() local files under
// sandbox: true. This keeps the renderer's previews and confirmation prompts using the exact same
// calculation as the server-authoritative src/database.js.
function previewMonthlyEndDate(months = 1, anchorDay = null) {
  return membershipEndDate(localDateString(), months, anchorDay);
}

function fallbackAvatar(name = '?') {
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#242a26"/><circle cx="160" cy="118" r="62" fill="#768078"/><path d="M48 320c12-76 54-116 112-116s100 40 112 116" fill="#768078"/><text x="160" y="294" text-anchor="middle" fill="#f4f7f3" font-size="34" font-family="Arial" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resetToIdle() {
  clearTimeout(resetTimer);
  body.className = 'state-idle';
  resultView.hidden = true;
  idleView.hidden = false;
  assignCardButton.hidden = true;
  resetProgress.style.animation = '';
}

async function showResult(result) {
  clearTimeout(resetTimer);
  const copy = reasonCopy(result.reason);
  const approved = Boolean(result.allowed);
  const displayName = result.member?.name
    || window.i18n.t(currentLang, result.reason === 'system_error' ? 'common.systemError' : 'common.unknownCard');

  body.className = approved ? 'state-approved' : 'state-denied';
  idleView.hidden = true;
  resultView.hidden = false;
  resultEyebrow.textContent = copy.eyebrow;
  memberName.textContent = displayName;
  resultMessage.textContent = result.reason === 'punchcard'
    ? window.i18n.t(currentLang, 'checkin.passesRemaining', {
      count: result.member.passesRemaining,
      unit: window.i18n.plural(currentLang, 'common.passUnit', result.member.passesRemaining)
    })
    : copy.message;
  portraitBadge.textContent = approved ? '✓' : '×';
  assignCardButton.hidden = result.reason !== 'unknown_card';
  lastUnknownUid = result.reason === 'unknown_card' ? result.uid : '';

  if (result.member) {
    if (result.member.membershipType === 'punchcard') {
      membershipPill.textContent = window.i18n.t(currentLang, 'checkin.pillPunchcard', { count: result.member.passesRemaining });
    } else {
      const date = new Date(`${result.member.validUntil}T12:00:00`);
      membershipPill.textContent = window.i18n.t(currentLang, result.reason === 'expired' ? 'checkin.pillExpired' : 'checkin.pillValidUntil', { date: formatDate(date) });
    }
    memberPhoto.src = await window.gym.getPhotoUrl(result.member.photoPath) || fallbackAvatar(displayName);
  } else {
    membershipPill.textContent = result.uid
      ? window.i18n.t(currentLang, 'checkin.pillUidCaptured', { uid: result.uid })
      : window.i18n.t(currentLang, 'checkin.pillUidNotCaptured');
    memberPhoto.src = fallbackAvatar('?');
  }

  memberPhoto.onerror = () => { memberPhoto.src = fallbackAvatar(displayName); };
  resetProgress.style.animation = 'none';
  requestAnimationFrame(() => {
    resetProgress.style.animation = `countdown ${IDLE_TIMEOUT_MS}ms linear forwards`;
  });
  resetTimer = setTimeout(resetToIdle, IDLE_TIMEOUT_MS);
}

function showToast(result) {
  const copy = reasonCopy(result.reason);
  const approved = Boolean(result.allowed);
  const displayName = result.member?.name
    || window.i18n.t(currentLang, result.reason === 'system_error' ? 'common.systemError' : 'common.unknownCard');

  const toast = document.createElement('div');
  toast.className = `toast ${approved ? 'toast-approved' : 'toast-denied'}`;
  const title = document.createElement('strong');
  title.textContent = displayName;
  const message = document.createElement('span');
  message.textContent = copy.eyebrow;
  toast.append(title, message);
  toastStack.append(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 260);
  }, TOAST_VISIBLE_MS);
}

// A check-in can arrive at any time -- including while staff is mid-task in the admin panel -- and
// must never be silently dropped just because a previous scan's round trip hasn't finished yet.
// submitUid() enqueues; the queue drains one UID at a time.
function submitUid(uid) {
  checkInQueue.push(uid);
  drainCheckInQueue();
}

async function drainCheckInQueue() {
  if (processingCheckIn) return;
  processingCheckIn = true;
  while (checkInQueue.length) {
    const uid = checkInQueue.shift();
    await processCheckIn(uid);
  }
  processingCheckIn = false;
}

async function processCheckIn(uid) {
  const scanKey = normaliseUid(uid);
  if (!scanKey) return;
  const now = Date.now();
  if (scanKey === lastSubmittedUid && now - lastSubmittedAt < DUPLICATE_WINDOW_MS) return;
  lastSubmittedUid = scanKey;
  lastSubmittedAt = now;

  let result;
  try {
    result = await window.gym.checkIn(uid);
  } catch (error) {
    console.error(error);
    result = { allowed: false, reason: 'invalid_uid', uid };
  }

  if (localDisplayMode(appInfo.windowRole) === 'full') {
    await showResult(result);
  } else {
    showToast(result);
  }
}

// --- Scan routing --------------------------------------------------------------------------------
// Card scans are classified by keystroke timing (see scan-router.js), never by which element has
// DOM focus. A confirmed scan is only ever captured into a form field when staff has explicitly
// armed that field via a "Scan a different card" / "Scan to find" / "Scan to replace" button;
// otherwise it always checks the member in, even while an admin form is open and has focus.

function dispatchScan(rawUid) {
  const uid = normaliseUid(rawUid);
  if (uid.length < 4) return;
  const decision = routeScan(armedCaptureTarget);
  if (decision.action === 'capture') {
    const target = armedCaptureTarget;
    armedCaptureTarget = null; // one-shot
    if (target === 'add-member') captureCard(uid);
    else if (target === 'edit-member') captureEditCardUid(uid);
    else if (target === 'search') captureSearchUid(uid);
  } else {
    submitUid(uid);
  }
}

function captureCard(uid) {
  const normalised = normaliseUid(uid);
  if (normalised.length < 4) return;
  memberCardUid.value = normalised;
  capturedUid.textContent = normalised;
  cardCapture.classList.add('has-card');
  scanDifferentCardButton.hidden = false;
  armedCaptureTarget = null;
  setStatus(addMemberStatus, scanText('edit.cardCapturedCard', 'edit.cardCapturedBarcode', { uid: normalised }), 'success');
  document.querySelector('#first-name').focus();
}

function clearCapturedCard() {
  memberCardUid.value = '';
  capturedUid.textContent = scanText('addMember.cardCaptureWaitingCard', 'addMember.cardCaptureWaitingBarcode');
  cardCapture.classList.remove('has-card');
  scanDifferentCardButton.hidden = true;
}

function captureEditCardUid(uid) {
  document.querySelector('#edit-card-uid').value = uid;
  setStatus(editMemberStatus, scanText('edit.cardCapturedCard', 'edit.cardCapturedBarcode', { uid }), 'success');
}

function captureSearchUid(uid) {
  memberSearch.value = uid;
  runMemberSearch();
  setStatus(renewStatus, window.i18n.t(currentLang, 'renew.jumpedToCard', { uid }), 'success');
}

// --- Staff area / PIN lock ------------------------------------------------------------------------

async function openAdmin(tabName = 'add', uid = '') {
  adminModal.hidden = false;
  pendingAdminTab = tabName;
  pendingAdminUid = uid;
  if (appInfo.smoke) staffSessionActive = true;
  if (staffSessionActive) {
    enterAdminContent();
    return;
  }
  await showStaffLock();
}

function enterAdminContent() {
  staffLockView.hidden = true;
  adminContent.hidden = false;
  if (appInfo.windowRole !== 'kiosk') adminHeader.hidden = false;
  setAdminTab(pendingAdminTab);
  if (pendingAdminUid) captureCard(pendingAdminUid);
}

async function showStaffLock() {
  adminContent.hidden = true;
  staffLockView.hidden = false;
  // The PIN screen is its own thing, not "Member management" -- showing that title (or a Lock
  // button, when the whole point of this screen is that it's already locked) here just reads as a
  // mistake. Hide the entire header rather than only the pieces that are individually confusing;
  // the lock screen doesn't need any of it.
  adminHeader.hidden = true;
  staffLockRecoverForm.hidden = true;
  staffLockRecoveryReveal.hidden = true;
  setStatus(staffLockStatus, '');
  const hasPin = await window.gym.hasStaffPin();
  staffLockEnterForm.hidden = !hasPin;
  staffLockSetupForm.hidden = hasPin;
  if (hasPin) {
    staffLockPinInput.value = '';
    setTimeout(() => staffLockPinInput.focus(), 50);
  } else {
    staffLockNewPin.value = '';
    staffLockConfirmPin.value = '';
    setTimeout(() => staffLockNewPin.focus(), 50);
  }
}

// Shown once, right after a PIN is first set, reset via recovery, or explicitly regenerated.
// `thenEnterAdmin` is true for the first two (staff should land in the admin area afterward) and
// false for an explicit regenerate from within Settings (staff is already there).
function showRecoveryCode(code, thenEnterAdmin) {
  staffLockEnterForm.hidden = true;
  staffLockSetupForm.hidden = true;
  staffLockRecoverForm.hidden = true;
  staffLockRecoveryReveal.hidden = false;
  staffLockRecoveryCodeDisplay.textContent = code;
  staffLockRecoveryContinue.onclick = () => {
    staffLockRecoveryReveal.hidden = true;
    if (thenEnterAdmin) enterAdminContent();
  };
}

// Named closeAdmin from when the admin panel was a dismissable overlay; now that the dashboard
// (single window, or the staff window in dual-screen mode) is a permanent page, this is really
// "lock and return to the PIN screen" -- it never hides the page itself for those roles, only for a
// kiosk-role window, which is a defensive fallback: in practice a kiosk window never opens the admin
// panel at all, so this branch should be unreachable.
function closeAdmin() {
  clearTimeout(searchTimer);
  clearTimeout(historySearchTimer);
  setStatus(addMemberStatus, '');
  setStatus(renewStatus, '');
  setStatus(staffLockStatus, '');
  setStatus(historyStatus, '');
  editMemberForm.hidden = true;
  armedCaptureTarget = null;
  clearExpiringButton.hidden = true;
  if (staffSessionActive && !appInfo.smoke) {
    staffSessionActive = false;
    window.gym.lockStaff();
  }
  if (appInfo.windowRole === 'kiosk') {
    adminModal.hidden = true;
  } else {
    showStaffLock();
  }
}

function setStatus(element, message, type = '') {
  element.textContent = message;
  element.classList.toggle('is-error', type === 'error');
  element.classList.toggle('is-success', type === 'success');
}

function setAdminTab(tabName) {
  const isAdd = tabName === 'add';
  const isRenew = tabName === 'renew';
  const isHistory = tabName === 'history';
  const isSettings = tabName === 'settings';
  adminAdd.hidden = !isAdd;
  adminRenew.hidden = !isRenew;
  adminHistory.hidden = !isHistory;
  adminSettings.hidden = !isSettings;
  adminTabs.forEach((button) => button.classList.toggle('is-active', button.dataset.adminTab === tabName));

  armedCaptureTarget = isAdd && !cardCapture.classList.contains('has-card') ? 'add-member' : null;

  if (isRenew) {
    runMemberSearch();
    setTimeout(() => memberSearch.focus(), 0);
  }
  if (isHistory) {
    runHistorySearch(true);
  }
  if (isSettings) {
    window.gym.getKioskLockdown().then((enabled) => { kioskLockdownToggle.checked = enabled; });
    window.gym.getDualScreenEnabled().then((enabled) => { dualScreenToggle.checked = enabled; });
    window.gym.getCheckinRetentionDays().then((days) => { retentionDaysInput.value = days; });
  }
}

function membershipDescription(member) {
  if (member.membershipType === 'punchcard') {
    return window.i18n.t(currentLang, 'renew.membershipDescriptionPunchcard', {
      count: member.passesRemaining,
      unit: window.i18n.plural(currentLang, 'common.passUnit', member.passesRemaining),
      uid: member.cardUid
    });
  }
  const date = formatDate(new Date(`${member.validUntil}T12:00:00`));
  return window.i18n.t(currentLang, 'renew.membershipDescriptionMonthly', { date, uid: member.cardUid });
}

function renderSearchResults(members) {
  visibleMembers = members;
  memberCount.textContent = window.i18n.t(currentLang, 'renew.memberCount', {
    count: members.length,
    unit: window.i18n.plural(currentLang, 'common.memberUnit', members.length)
  });
  searchResults.replaceChildren();
  if (!members.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-search';
    empty.textContent = window.i18n.t(currentLang, 'renew.noMatchingMembers');
    searchResults.append(empty);
    return;
  }

  for (const member of members) {
    const row = document.createElement('article');
    row.className = 'member-row';
    const details = document.createElement('div');
    details.className = 'member-row-details';
    details.setAttribute('role', 'button');
    details.tabIndex = 0;
    details.title = window.i18n.t(currentLang, 'renew.editMemberTitle', { name: member.name });
    const openEditor = () => openMemberEditor(member, false);
    details.addEventListener('click', openEditor);
    details.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openEditor();
      }
    });
    const name = document.createElement('strong');
    const description = document.createElement('small');
    name.textContent = member.name;
    description.textContent = membershipDescription(member);
    details.append(name, description);

    const actions = document.createElement('div');
    actions.className = 'renew-actions';
    const monthlyButton = makeRenewButton(window.i18n.t(currentLang, 'renew.plusOneMonth'), member.id, 'monthly');
    const punchButton = makeRenewButton(window.i18n.t(currentLang, 'renew.plusTenPasses'), member.id, 'punchcard');
    const editButton = makeActionButton(window.i18n.t(currentLang, 'common.edit'), () => openMemberEditor(member, false));
    actions.append(monthlyButton, punchButton);
    // "Custom date" only makes sense for a member already on a monthly plan -- forcing a punch-card
    // or frozen/cancelled member through this shortcut used to silently convert/reactivate them.
    if (member.membershipType === 'monthly') {
      actions.append(makeActionButton(window.i18n.t(currentLang, 'renew.customDateButton'), () => openMemberEditor(member, true)));
    }
    actions.append(editButton);
    row.append(details, actions);
    searchResults.append(row);
  }
}

function makeActionButton(label, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'renew-button';
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

function makeRenewButton(label, memberId, renewalType) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'renew-button';
  button.textContent = label;
  button.addEventListener('click', () => renewMember(memberId, renewalType, button));
  return button;
}

async function runMemberSearch() {
  const query = memberSearch.value.trim();
  const response = await window.gym.searchMembers(query);
  if (!response.ok) {
    showError(renewStatus, response.error);
    return;
  }
  setStatus(renewStatus, '');
  renderSearchResults(response.data);
}

// --- Check-in history (Settings > Check-in history tab) -------------------------------------------

function currentHistoryFilters() {
  return {
    query: historyQuery.value.trim(),
    fromDate: historyFromDate.value,
    toDate: historyToDate.value
  };
}

function renderHistoryRow(entry) {
  const row = document.createElement('div');
  row.className = 'history-row';

  const when = document.createElement('time');
  when.textContent = formatDateTime(new Date(entry.checkedInAt.replace(' ', 'T')));

  const who = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = entry.name;
  const uid = document.createElement('small');
  uid.textContent = window.i18n.t(currentLang, 'checkin.pillUidCaptured', { uid: entry.uid });
  who.append(name, uid);

  const status = document.createElement('span');
  status.className = `history-status ${entry.allowed ? 'is-approved' : 'is-denied'}`;
  status.textContent = entry.allowed ? window.i18n.t(currentLang, 'common.approved') : (reasonEyebrow(entry.reason) || window.i18n.t(currentLang, 'common.denied'));

  row.append(when, who, status);
  return row;
}

async function runHistorySearch(reset) {
  if (reset) {
    historyOffset = 0;
    historyResults.replaceChildren();
    historyLoadMoreButton.hidden = true;
  }
  setStatus(historyStatus, window.i18n.t(currentLang, 'history.loading'));
  const response = await window.gym.searchCheckIns({
    ...currentHistoryFilters(),
    limit: HISTORY_PAGE_SIZE,
    offset: historyOffset
  });
  if (!response.ok) {
    showError(historyStatus, response.error);
    return;
  }
  const rows = response.data;
  if (reset && !rows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-search';
    empty.textContent = window.i18n.t(currentLang, 'history.noMatches');
    historyResults.append(empty);
  } else {
    rows.forEach((entry) => historyResults.append(renderHistoryRow(entry)));
  }
  historyOffset += rows.length;
  historyCount.textContent = historyOffset ? window.i18n.t(currentLang, 'history.shownCount', { count: historyOffset }) : '';
  historyLoadMoreButton.hidden = rows.length < HISTORY_PAGE_SIZE;
  setStatus(historyStatus, '');
}

historyFilterButton.addEventListener('click', () => runHistorySearch(true));
historyLoadMoreButton.addEventListener('click', () => runHistorySearch(false));
historyClearButton.addEventListener('click', () => {
  historyQuery.value = '';
  historyFromDate.value = '';
  historyToDate.value = '';
  runHistorySearch(true);
});
historyQuery.addEventListener('input', () => {
  clearTimeout(historySearchTimer);
  historySearchTimer = setTimeout(() => runHistorySearch(true), 220);
});
[historyFromDate, historyToDate].forEach((input) => {
  input.addEventListener('change', () => runHistorySearch(true));
});

historyExportButton.addEventListener('click', async () => {
  setStatus(historyStatus, window.i18n.t(currentLang, 'history.exporting'));
  const result = await window.gym.exportCheckInsCsv(currentHistoryFilters());
  if (result.ok) {
    setStatus(historyStatus, result.data.truncated
      ? window.i18n.t(currentLang, 'history.exportedTruncated', { count: result.data.count })
      : window.i18n.t(currentLang, 'history.exportedOk', { count: result.data.count, path: result.data.path }), 'success');
  } else if (result.error === 'cancelled') {
    setStatus(historyStatus, '');
  } else {
    showError(historyStatus, result.error);
  }
});

// The dashboard's "Recent check-ins" feed -- a small always-visible activity log (like a streaming
// chat panel) so staff can see who just came in at a glance, without switching to the full Check-in
// history tab. Driven entirely by main.js's checkin-glance-update broadcast rather than the local
// scan-handling path, so it stays correct in dual-screen mode even when this window never itself
// caught the scan (see the comment on that broadcast in src/main.js). Never visible on a kiosk-role
// window: it lives inside #admin-content, which a kiosk window can never open at all.
const ACTIVITY_FEED_LIMIT = 5;
let activityFeedEntries = [];

// Clicking an entry jumps straight to acting on it: an unknown card goes to Add new member with the
// UID already captured (the old check-in stage's "Assign to new member" button doesn't exist any
// more now that the stage isn't shown on this window -- this is its replacement); anything else jumps
// to Renew or prolong, searched straight to that card.
function jumpToActivityFeedEntry(entry) {
  if (!entry.uid) return;
  if (entry.reason === 'unknown_card') {
    setAdminTab('add');
    captureCard(entry.uid);
  } else {
    setAdminTab('renew');
    captureSearchUid(entry.uid);
  }
}

function renderActivityFeed() {
  activityFeedList.replaceChildren();
  if (!activityFeedEntries.length) {
    const empty = document.createElement('p');
    empty.className = 'activity-feed-empty';
    empty.textContent = window.i18n.t(currentLang, 'activity.empty');
    activityFeedList.append(empty);
    return;
  }
  for (const entry of activityFeedEntries) {
    const row = document.createElement('div');
    row.className = `activity-feed-row ${entry.allowed ? 'is-approved' : 'is-denied'}`;
    row.addEventListener('click', () => jumpToActivityFeedEntry(entry));
    const name = document.createElement('strong');
    name.textContent = entry.name;
    const status = document.createElement('span');
    status.textContent = entry.allowed ? window.i18n.t(currentLang, 'common.approved') : (reasonEyebrow(entry.reason) || window.i18n.t(currentLang, 'common.denied'));
    const time = document.createElement('time');
    time.textContent = formatTime(entry.checkedInAt);
    row.append(name, status, time);
    activityFeedList.append(row);
  }
}

function pushActivityFeedEntry(result) {
  activityFeedEntries.unshift({
    uid: result.uid,
    allowed: Boolean(result.allowed),
    reason: result.reason,
    name: result.member?.name || window.i18n.t(currentLang, result.reason === 'unknown_card' ? 'common.unknownCard' : 'common.unrecognisedCard'),
    checkedInAt: new Date()
  });
  activityFeedEntries.length = Math.min(activityFeedEntries.length, ACTIVITY_FEED_LIMIT);
  renderActivityFeed();
}

window.gym.onCheckinGlanceUpdate((result) => pushActivityFeedEntry(result));

// Cold-start: seed the feed with whatever already happened before this session even started, so it
// isn't empty just because nobody has tapped a card since the app launched.
window.gym.getRecentCheckIns().then((rows) => {
  activityFeedEntries = (rows || []).slice(0, ACTIVITY_FEED_LIMIT).map((row) => ({
    uid: row.uid,
    allowed: row.allowed,
    reason: row.reason,
    name: row.name,
    checkedInAt: new Date(row.checkedInAt.replace(' ', 'T'))
  }));
  renderActivityFeed();
});

function toggleEditPlanFields() {
  const isMonthly = editMembershipType.value === 'monthly';
  editMonthlyField.hidden = !isMonthly;
  editPunchcardField.hidden = isMonthly;
  editValidUntil.required = isMonthly;
  editPassesRemaining.required = !isMonthly;
}

function openMemberEditor(member, customDateOnly = false) {
  document.querySelector('#edit-member-id').value = member.id;
  document.querySelector('#edit-first-name').value = member.firstName;
  document.querySelector('#edit-last-name').value = member.lastName;
  document.querySelector('#edit-card-uid').value = member.cardUid;
  // Always seed the member's real current status/type -- "Custom date" only jumps focus to the date
  // field, it never silently reactivates a frozen/cancelled member or converts their plan.
  document.querySelector('#edit-membership-status').value = member.membershipStatus;
  editMembershipType.value = member.membershipType;
  editValidUntil.value = member.validUntil || previewMonthlyEndDate(1);
  editPassesRemaining.value = member.passesRemaining;
  editAmountPaid.value = '';
  editMemberTitle.textContent = window.i18n.t(currentLang, customDateOnly ? 'edit.titleSetEndDate' : 'edit.titleEditMember', { name: member.name });
  setStatus(editMemberStatus, customDateOnly ? window.i18n.t(currentLang, 'edit.chooseExactDate') : '');
  toggleEditPlanFields();
  loadEditMemberPhoto(member.photoPath, member.name);
  editMemberForm.hidden = false;
  editMemberForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => (customDateOnly ? editValidUntil : document.querySelector('#edit-first-name')).focus(), 100);
}

async function loadEditMemberPhoto(photoPath, name) {
  editMemberPhoto.src = (photoPath && await window.gym.getPhotoUrl(photoPath)) || fallbackAvatar(name);
  editMemberPhoto.onerror = () => { editMemberPhoto.src = fallbackAvatar(name); };
  removePhotoButton.hidden = !photoPath;
}

function closeMemberEditor() {
  editMemberForm.hidden = true;
  setStatus(editMemberStatus, '');
}

function describeDiscard(member, discard) {
  const parts = [];
  if (discard.discardsPasses) {
    parts.push(window.i18n.t(currentLang, 'edit.discard.passesLost', {
      count: discard.passesLost,
      unit: window.i18n.plural(currentLang, 'common.passUnit', discard.passesLost)
    }));
  }
  if (discard.discardsDays) {
    parts.push(window.i18n.t(currentLang, 'edit.discard.daysLost', {
      count: discard.daysLost,
      unit: window.i18n.plural(currentLang, 'common.dayUnit', discard.daysLost)
    }));
  }
  const lossText = parts.length
    ? window.i18n.t(currentLang, 'edit.discard.removes', { parts: parts.join(` ${window.i18n.t(currentLang, 'edit.discard.and')} `) })
    : '';
  const reactivateText = discard.reactivates
    ? window.i18n.t(currentLang, 'edit.discard.reactivates', {
      name: member.name,
      status: window.i18n.t(currentLang, `common.status.${member.membershipStatus}`)
    })
    : '';
  return window.i18n.t(currentLang, 'edit.discard.confirm', { name: member.name, lossText, reactivateText });
}

function amountToCents(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function promptForAmountCents() {
  const raw = window.prompt(window.i18n.t(currentLang, 'checkin.amountPaidPrompt'));
  return raw === null ? null : amountToCents(raw);
}

async function renewMember(memberId, renewalType, clickedButton) {
  const member = visibleMembers.find((candidate) => candidate.id === memberId);
  if (member) {
    const today = localDateString();
    const discard = wouldDiscardBalance(member, renewalType, today);
    if (discard.discardsPasses || discard.discardsDays || discard.reactivates) {
      if (!window.confirm(describeDiscard(member, discard))) return;
    }
  }
  const amountCents = promptForAmountCents();

  const buttons = [...clickedButton.closest('.renew-actions').querySelectorAll('button')];
  buttons.forEach((button) => { button.disabled = true; });
  const response = await window.gym.renewMember({ memberId, renewalType, amountCents });
  buttons.forEach((button) => { button.disabled = false; });
  if (!response.ok) {
    showError(renewStatus, response.error);
    return;
  }
  const change = renewalType === 'monthly'
    ? window.i18n.t(currentLang, 'renew.renewedMonthly', { date: formatDate(new Date(`${response.data.validUntil}T12:00:00`)) })
    : window.i18n.t(currentLang, 'renew.renewedPunchcard', {
      count: response.data.passesRemaining,
      unit: window.i18n.plural(currentLang, 'common.passUnit', response.data.passesRemaining)
    });
  setStatus(renewStatus, window.i18n.t(currentLang, 'renew.renewResult', { name: response.data.name, change }), 'success');
  await runMemberSearch();
}

document.addEventListener('keydown', (event) => {
  // No more Escape-closes-admin: the dashboard (single window, or the staff window in dual-screen
  // mode) is a permanent page now, not a dismissable overlay -- see applyWindowRole and closeAdmin.
  if (event.key === 'Tab' && adminModal.hidden && appInfo.windowRole !== 'kiosk' && !event.target.matches('input, button')) {
    openAdmin('add');
    event.preventDefault();
    return;
  }

  if (event.key === 'Enter') {
    if (isConfirmedScan(scanState)) {
      event.preventDefault();
      const uid = scanBuffer;
      scanBuffer = '';
      scanState = { ...EMPTY_STATE };
      dispatchScan(uid);
    } else {
      scanBuffer = '';
      scanState = { ...EMPTY_STATE };
    }
    return;
  }

  if (event.key.length === 1 && /[a-zA-Z0-9_-]/.test(event.key)) {
    const now = performance.now();
    const gap = now - lastKeyAt;
    lastKeyAt = now;
    const next = advanceScanState(scanState, gap);
    if (next.length === 0) {
      // Pace looked human -- abandon tracking and let this (and future) keystrokes type normally.
      scanBuffer = '';
      scanState = next;
      return;
    }
    if (next.suppressed) event.preventDefault();
    scanBuffer = next.length === 1 ? event.key : scanBuffer + event.key;
    scanState = next;
  }
});

adminToggle.addEventListener('click', () => openAdmin('add'));
adminClose.addEventListener('click', closeAdmin);
document.querySelector('[data-close-admin]').addEventListener('click', closeAdmin);
adminTabs.forEach((button) => button.addEventListener('click', () => setAdminTab(button.dataset.adminTab)));
assignCardButton.addEventListener('click', () => openAdmin('add', lastUnknownUid));
editMemberCancel.addEventListener('click', closeMemberEditor);
editMembershipType.addEventListener('change', toggleEditPlanFields);

scanDifferentCardButton.addEventListener('click', () => {
  clearCapturedCard();
  armedCaptureTarget = 'add-member';
  setStatus(addMemberStatus, scanText('addMember.tapNextCardCard', 'addMember.tapNextCardBarcode'));
});

scanToFindButton.addEventListener('click', () => {
  armedCaptureTarget = 'search';
  setStatus(renewStatus, scanText('renew.tapCardToJumpCard', 'renew.tapCardToJumpBarcode'));
});

scanReplaceCardButton.addEventListener('click', () => {
  armedCaptureTarget = 'edit-member';
  setStatus(editMemberStatus, scanText('edit.tapReplacementCardCard', 'edit.tapReplacementCardBarcode'));
});

// "Change photo…" offers a choice rather than jumping straight to the file picker, so staff can
// take a fresh photo with a webcam instead of needing one already saved as a file somewhere.
function hidePhotoSourceChoice() {
  changePhotoChoice.hidden = true;
  changePhotoToggle.hidden = false;
}

changePhotoToggle.addEventListener('click', () => {
  changePhotoToggle.hidden = true;
  changePhotoChoice.hidden = false;
});
cancelPhotoChoiceButton.addEventListener('click', hidePhotoSourceChoice);

async function applyMemberPhotoResponse(response) {
  if (!response.ok) {
    showError(editMemberStatus, response.error);
    return;
  }
  editMemberPhoto.src = await window.gym.getPhotoUrl(response.data.photoPath) || fallbackAvatar('?');
  removePhotoButton.hidden = false;
  setStatus(editMemberStatus, window.i18n.t(currentLang, 'edit.photoUpdated'), 'success');
}

choosePhotoFileButton.addEventListener('click', async () => {
  hidePhotoSourceChoice();
  const memberId = Number(document.querySelector('#edit-member-id').value);
  const picked = await window.gym.chooseMemberPhoto();
  if (!picked.ok) return; // cancelled
  choosePhotoFileButton.disabled = true;
  const response = await window.gym.setMemberPhoto({ memberId, sourcePath: picked.data.path });
  choosePhotoFileButton.disabled = false;
  await applyMemberPhotoResponse(response);
});

// --- Webcam capture ("Take photo") -----------------------------------------------------------

let cameraStream = null;
let capturedPhotoDataUrl = null;

function stopCameraStream() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
}

function showCameraLiveView() {
  capturedPhotoDataUrl = null;
  cameraPreview.hidden = true;
  cameraVideo.hidden = false;
  cameraCaptureButton.hidden = false;
  cameraRetakeButton.hidden = true;
  cameraUseButton.hidden = true;
}

async function openCameraModal() {
  cameraModal.hidden = false;
  showCameraLiveView();
  setStatus(cameraStatus, window.i18n.t(currentLang, 'camera.starting'));
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640 }, audio: false });
    cameraVideo.srcObject = cameraStream;
    setStatus(cameraStatus, '');
  } catch (error) {
    console.error('Camera access failed:', error);
    setStatus(cameraStatus, window.i18n.t(currentLang, 'camera.accessFailed'), 'error');
  }
}

function closeCameraModal() {
  stopCameraStream();
  cameraVideo.srcObject = null;
  cameraModal.hidden = true;
}

takePhotoButton.addEventListener('click', () => {
  hidePhotoSourceChoice();
  openCameraModal();
});

cameraCaptureButton.addEventListener('click', () => {
  // Center-crop to a square so the saved photo matches the round portrait frame used everywhere
  // else in the app, regardless of the camera's native aspect ratio.
  const size = Math.min(cameraVideo.videoWidth, cameraVideo.videoHeight) || 480;
  cameraCanvas.width = size;
  cameraCanvas.height = size;
  const context = cameraCanvas.getContext('2d');
  const offsetX = (cameraVideo.videoWidth - size) / 2;
  const offsetY = (cameraVideo.videoHeight - size) / 2;
  context.drawImage(cameraVideo, offsetX, offsetY, size, size, 0, 0, size, size);
  capturedPhotoDataUrl = cameraCanvas.toDataURL('image/jpeg', 0.92);
  cameraPreview.src = capturedPhotoDataUrl;
  cameraVideo.hidden = true;
  cameraPreview.hidden = false;
  cameraCaptureButton.hidden = true;
  cameraRetakeButton.hidden = false;
  cameraUseButton.hidden = false;
});

cameraRetakeButton.addEventListener('click', showCameraLiveView);
cameraCancelButton.addEventListener('click', closeCameraModal);

cameraUseButton.addEventListener('click', async () => {
  const memberId = Number(document.querySelector('#edit-member-id').value);
  if (!memberId || !capturedPhotoDataUrl) return;
  cameraUseButton.disabled = true;
  const response = await window.gym.captureMemberPhoto({ memberId, dataUrl: capturedPhotoDataUrl });
  cameraUseButton.disabled = false;
  if (!response.ok) {
    showError(cameraStatus, response.error);
    return;
  }
  closeCameraModal();
  await applyMemberPhotoResponse(response);
});

removePhotoButton.addEventListener('click', async () => {
  const memberId = Number(document.querySelector('#edit-member-id').value);
  removePhotoButton.disabled = true;
  const response = await window.gym.removeMemberPhoto({ memberId });
  removePhotoButton.disabled = false;
  if (!response.ok) {
    showError(editMemberStatus, response.error);
    return;
  }
  editMemberPhoto.src = fallbackAvatar('?');
  removePhotoButton.hidden = true;
  setStatus(editMemberStatus, window.i18n.t(currentLang, 'edit.photoRemoved'), 'success');
});

exportMemberDataButton.addEventListener('click', async () => {
  const memberId = Number(document.querySelector('#edit-member-id').value);
  exportMemberDataButton.disabled = true;
  const response = await window.gym.exportMemberData({ memberId });
  exportMemberDataButton.disabled = false;
  if (!response.ok) {
    if (response.error !== 'cancelled') showError(editMemberStatus, response.error);
    return;
  }
  setStatus(editMemberStatus, window.i18n.t(currentLang, 'edit.dataExported', { path: response.data.path }), 'success');
});

deleteMemberButton.addEventListener('click', async () => {
  const memberId = Number(document.querySelector('#edit-member-id').value);
  const name = `${document.querySelector('#edit-first-name').value} ${document.querySelector('#edit-last-name').value}`;
  const proceed = window.confirm(window.i18n.t(currentLang, 'edit.deleteConfirm', { name }));
  if (!proceed) return;
  deleteMemberButton.disabled = true;
  const response = await window.gym.deleteMember({ memberId });
  deleteMemberButton.disabled = false;
  if (!response.ok) {
    showError(editMemberStatus, response.error);
    return;
  }
  closeMemberEditor();
  setStatus(renewStatus, window.i18n.t(currentLang, 'renew.deletedSuccess', { name }), 'success');
  await runMemberSearch();
});

showExpiringButton.addEventListener('click', async () => {
  const withinDays = Number(expiringDaysInput.value) || 7;
  const response = await window.gym.expiringMembers(withinDays);
  if (!response.ok) {
    showError(renewStatus, response.error);
    return;
  }
  memberSearch.value = '';
  renderSearchResults(response.data);
  setStatus(renewStatus, response.data.length ? '' : window.i18n.t(currentLang, 'renew.noExpiringMembers'));
  clearExpiringButton.hidden = false;
});

clearExpiringButton.addEventListener('click', async () => {
  clearExpiringButton.hidden = true;
  await runMemberSearch();
});

document.querySelectorAll('input[name="membershipType"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const isMonthly = radio.value === 'monthly' && radio.checked;
    if (!radio.checked) return;
    monthlyFields.hidden = !isMonthly;
    punchcardFields.hidden = isMonthly;
    validUntil.required = isMonthly;
    passesRemaining.required = !isMonthly;
  });
});

addMemberForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!memberCardUid.value) {
    setStatus(addMemberStatus, errorText('invalid_uid'), 'error');
    return;
  }
  const submitButton = addMemberForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const membershipType = addMemberForm.elements.membershipType.value;
  const response = await window.gym.addMember({
    cardUid: memberCardUid.value,
    firstName: addMemberForm.elements.firstName.value,
    lastName: addMemberForm.elements.lastName.value,
    membershipType,
    validUntil: membershipType === 'monthly' ? validUntil.value : null,
    passesRemaining: membershipType === 'punchcard' ? Number(passesRemaining.value) : 0,
    amountCents: amountToCents(addAmountPaid.value)
  });
  submitButton.disabled = false;
  if (!response.ok) {
    showError(addMemberStatus, response.error);
    return;
  }
  setStatus(addMemberStatus, scanText('addMember.savedSuccessCard', 'addMember.savedSuccessBarcode', { name: response.data.name }), 'success');
  addMemberForm.reset();
  validUntil.value = previewMonthlyEndDate(1);
  monthlyFields.hidden = false;
  punchcardFields.hidden = true;
  addAmountPaid.value = '';
  clearCapturedCard();
  armedCaptureTarget = 'add-member';
});

editMemberForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = editMemberForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const membershipType = editMembershipType.value;
  const response = await window.gym.updateMember({
    id: Number(document.querySelector('#edit-member-id').value),
    firstName: document.querySelector('#edit-first-name').value,
    lastName: document.querySelector('#edit-last-name').value,
    cardUid: document.querySelector('#edit-card-uid').value,
    membershipStatus: document.querySelector('#edit-membership-status').value,
    membershipType,
    validUntil: membershipType === 'monthly' ? editValidUntil.value : null,
    passesRemaining: membershipType === 'punchcard' ? Number(editPassesRemaining.value) : 0,
    amountCents: amountToCents(editAmountPaid.value)
  });
  submitButton.disabled = false;
  if (!response.ok) {
    showError(editMemberStatus, response.error);
    return;
  }
  setStatus(editMemberStatus, window.i18n.t(currentLang, 'renew.updatedSuccess', { name: response.data.name }), 'success');
  setStatus(renewStatus, window.i18n.t(currentLang, 'renew.updatedSuccess', { name: response.data.name }), 'success');
  await runMemberSearch();
  setTimeout(closeMemberEditor, 700);
});

memberSearch.addEventListener('input', () => {
  clearExpiringButton.hidden = true;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runMemberSearch, 180);
});

staffLockEnterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const pin = staffLockPinInput.value;
  const submitButton = staffLockEnterForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.verifyStaffPin(pin);
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(staffLockStatus, errorText(response.error, 'wrong_pin'), 'error');
    staffLockPinInput.value = '';
    staffLockPinInput.focus();
    return;
  }
  staffSessionActive = true;
  enterAdminContent();
});

staffLockSetupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const newPin = staffLockNewPin.value;
  const confirmPin = staffLockConfirmPin.value;
  if (newPin !== confirmPin) {
    setStatus(staffLockStatus, window.i18n.t(currentLang, 'staffLock.setup.pinsDoNotMatch'), 'error');
    return;
  }
  const submitButton = staffLockSetupForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.setStaffPin({ newPin });
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(staffLockStatus, errorText(response.error), 'error');
    return;
  }
  staffSessionActive = true;
  showRecoveryCode(response.data.recoveryCode, true);
});

staffLockForgotButton.addEventListener('click', () => {
  staffLockEnterForm.hidden = true;
  staffLockRecoverForm.hidden = false;
  setStatus(staffLockStatus, '');
  staffLockRecoveryCode.value = '';
  staffLockRecoveryNewPin.value = '';
  staffLockRecoveryConfirmPin.value = '';
  staffLockRecoveryCode.focus();
});

staffLockRecoverCancel.addEventListener('click', () => {
  staffLockRecoverForm.hidden = true;
  staffLockEnterForm.hidden = false;
  setStatus(staffLockStatus, '');
  staffLockPinInput.focus();
});

staffLockRecoverForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const recoveryCode = staffLockRecoveryCode.value;
  const newPin = staffLockRecoveryNewPin.value;
  const confirmPin = staffLockRecoveryConfirmPin.value;
  if (newPin !== confirmPin) {
    setStatus(staffLockStatus, window.i18n.t(currentLang, 'staffLock.recover.pinsDoNotMatch'), 'error');
    return;
  }
  const submitButton = staffLockRecoverForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.resetStaffPinWithRecovery({ recoveryCode, newPin });
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(staffLockStatus, errorText(response.error), 'error');
    return;
  }
  staffSessionActive = true;
  showRecoveryCode(response.data.recoveryCode, true);
});

regenerateRecoveryButton.addEventListener('click', async () => {
  const currentPin = window.prompt(window.i18n.t(currentLang, 'settings.pin.regeneratePrompt'));
  if (currentPin === null) return;
  regenerateRecoveryButton.disabled = true;
  const response = await window.gym.regenerateRecoveryCode({ currentPin });
  regenerateRecoveryButton.disabled = false;
  if (!response.ok) {
    showError(changePinStatus, response.error);
    return;
  }
  window.alert(window.i18n.t(currentLang, 'settings.pin.newRecoveryCodeAlert', { code: response.data.recoveryCode }));
});

changePinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const currentPin = document.querySelector('#change-pin-current').value;
  const newPin = document.querySelector('#change-pin-new').value;
  const confirmPin = document.querySelector('#change-pin-confirm').value;
  if (newPin !== confirmPin) {
    setStatus(changePinStatus, window.i18n.t(currentLang, 'settings.pin.pinsDoNotMatch'), 'error');
    return;
  }
  const submitButton = changePinForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.setStaffPin({ currentPin, newPin });
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(changePinStatus, errorText(response.error), 'error');
    return;
  }
  setStatus(changePinStatus, window.i18n.t(currentLang, 'settings.pin.updated'), 'success');
  changePinForm.reset();
});

kioskLockdownToggle.addEventListener('change', async () => {
  const desired = kioskLockdownToggle.checked;
  kioskLockdownToggle.disabled = true;
  const response = await window.gym.setKioskLockdown(desired);
  kioskLockdownToggle.disabled = false;
  if (!response.ok) {
    kioskLockdownToggle.checked = !desired; // revert on failure
    if (response.error === 'not_authorized') handleUnauthorized();
  }
});

dualScreenToggle.addEventListener('change', async () => {
  const desired = dualScreenToggle.checked;
  dualScreenToggle.disabled = true;
  const response = await window.gym.setDualScreenEnabled(desired);
  dualScreenToggle.disabled = false;
  if (!response.ok) {
    dualScreenToggle.checked = !desired; // revert on failure
    if (response.error === 'not_authorized') handleUnauthorized();
  }
});

// --- Appearance (theme + light/dark mode) ---------------------------------------------------
// The actual choice is already applied to <html> by theme.js before this script even runs (that's
// what avoids a flash of the wrong theme on launch) -- this only syncs the Settings tab's own
// controls to match on open, and updates both the live page and the saved choice when staff picks
// something new. Saved to localStorage rather than the SQLite database: this is a per-device display
// preference, not gym data, so it's fine (arguably better) for it to live with this one PC/window
// rather than round-tripping through the main process.
const THEME_STORAGE_KEY = 'gym-checkin-theme';
const MODE_STORAGE_KEY = 'gym-checkin-mode';

function applyAppearance(theme, mode) {
  themeSwatches.forEach((button) => {
    const active = button.dataset.themeChoice === theme;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });
  appearanceModeToggle.checked = mode === 'light';
}

function setAppearance(theme, mode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
  applyAppearance(theme, mode);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Could not save the appearance choice -- it will reset next launch:', error);
  }
}

themeSwatches.forEach((button) => {
  button.addEventListener('click', () => {
    setAppearance(button.dataset.themeChoice, document.documentElement.dataset.mode);
  });
});

appearanceModeToggle.addEventListener('change', () => {
  setAppearance(document.documentElement.dataset.theme, appearanceModeToggle.checked ? 'light' : 'dark');
});

// Sync the controls above to whatever theme.js already applied -- doesn't wait for the Settings tab
// to be opened, since that's cheap and one less thing to remember to call from setAdminTab.
applyAppearance(document.documentElement.dataset.theme, document.documentElement.dataset.mode);

// --- Language ----------------------------------------------------------------------------------
// Unlike appearance (above), the language choice is main-authoritative (see database.js's app_meta
// pattern) rather than localStorage-only, since main.js needs it too, for the OS notification and
// native dialog titles -- so switching it round-trips through window.gym.setLanguage rather than
// being written straight to localStorage.

function applyLanguageChoice(lang) {
  languageChoiceButtons.forEach((button) => {
    const active = button.dataset.languageChoice === lang;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });
}

// Applies immediately to everything already on screen: every static data-i18n* element, the clock,
// and the always-visible activity feed. Deliberately does NOT re-run the member search or check-in
// history results -- those hold whatever the last real fetch returned, and re-rendering an empty
// starting state here would stomp their own "Loading…" placeholder before it's ever had a chance to
// load; they simply pick up the new language next time staff searches or reopens that tab.
async function setLanguage(lang) {
  currentLang = lang;
  applyLanguageChoice(lang);
  window.i18n.applyTranslations(lang);
  updateClock();
  renderActivityFeed();
  const response = await window.gym.setLanguage(lang);
  if (!response.ok) {
    if (response.error === 'not_authorized') handleUnauthorized();
    else console.error('Could not save the language choice -- it will reset next launch:', response.error);
  }
}

languageChoiceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.languageChoice !== currentLang) setLanguage(button.dataset.languageChoice);
  });
});

// --- Scan method (card reader vs barcode scanner) -----------------------------------------------
// Purely cosmetic: an RFID card reader and a laser barcode scanner both plug in as a generic USB
// keyboard and are indistinguishable to scan-router.js, which only ever looks at keystroke timing
// (see its own header comment) -- so this changes nothing about how a scan is actually detected or
// processed. It only swaps which on-screen instructions and icon staff/members see, to match
// whichever device is actually sitting at the desk. Saved to localStorage like the theme (not
// main-authoritative like language): main.js never needs to know this, nothing it generates --
// notifications, dialog titles -- mentions how the scan happened.
const SCAN_METHOD_STORAGE_KEY = 'gym-checkin-scan-method';
const VALID_SCAN_METHODS = ['card', 'barcode'];

// Every dynamic (JS-generated, not static markup) string that mentions the physical scan action --
// status messages like "Card {uid} captured." -- goes through this instead of a bare window.i18n.t()
// call, so it automatically picks the Card or Barcode variant of a key pair without every call site
// needing its own ternary.
function scanText(cardKey, barcodeKey, params) {
  return window.i18n.t(currentLang, scanMethod === 'barcode' ? barcodeKey : cardKey, params);
}

// #scan-hint's data-i18n-html key depends on BOTH independent toggles -- window role (kiosk vs not,
// set once at startup by applyWindowRole) and scan method (changeable any time from Settings) -- so
// it needs its own small combinator rather than letting either caller set the attribute directly and
// risk one stomping the other's choice.
function updateScanHintKey() {
  const kiosk = appInfo.windowRole === 'kiosk';
  const isBarcode = scanMethod === 'barcode';
  const key = kiosk
    ? (isBarcode ? 'footer.scanHintKioskHtmlBarcode' : 'footer.scanHintKioskHtmlCard')
    : (isBarcode ? 'footer.scanHintHtmlBarcode' : 'footer.scanHintHtmlCard');
  document.querySelector('#scan-hint').setAttribute('data-i18n-html', key);
}

// Rather than picking between two fixed strings, this points each element's data-i18n(-*) attribute
// at the right Card/Barcode-suffixed key and lets the normal applyTranslations() pass render it --
// same trick as the kiosk-role scan-hint above, so it composes correctly with a later language
// switch (which just re-runs applyTranslations() against whatever key is currently set) instead of
// needing every place that can change the page's text to know about every other one.
function applyScanMethod(method) {
  const isBarcode = method === 'barcode';
  idleHeading.setAttribute('data-i18n', isBarcode ? 'idle.headingBarcode' : 'idle.headingCard');
  idleSubhead.setAttribute('data-i18n', isBarcode ? 'idle.subheadBarcode' : 'idle.subheadCard');
  cardCaptureHint.setAttribute('data-i18n', isBarcode ? 'addMember.cardCaptureHintBarcode' : 'addMember.cardCaptureHintCard');
  capturedUid.setAttribute('data-i18n', isBarcode ? 'addMember.cardCaptureWaitingBarcode' : 'addMember.cardCaptureWaitingCard');
  scanDifferentCardButton.setAttribute('data-i18n', isBarcode ? 'addMember.scanDifferentCardBarcode' : 'addMember.scanDifferentCardCard');
  testToggle.setAttribute('data-i18n', isBarcode ? 'footer.testCardToggleBarcode' : 'footer.testCardToggleCard');
  dashboardTestToggle.setAttribute('data-i18n', isBarcode ? 'footer.testCardToggleBarcode' : 'footer.testCardToggleCard');
  testUidLabel.setAttribute('data-i18n', isBarcode ? 'footer.cardUidLabelBarcode' : 'footer.cardUidLabelCard');
  scanCardIcon.hidden = isBarcode;
  scanBarcodeIcon.hidden = !isBarcode;
  scanMethodChoiceButtons.forEach((button) => {
    const active = button.dataset.scanMethodChoice === method;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });
  updateScanHintKey();
  window.i18n.applyTranslations(currentLang);
}

function setScanMethod(method) {
  scanMethod = method;
  applyScanMethod(method);
  try {
    localStorage.setItem(SCAN_METHOD_STORAGE_KEY, method);
  } catch (error) {
    console.error('Could not save the scan method -- it will reset next launch:', error);
  }
}

scanMethodChoiceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.scanMethodChoice !== scanMethod) setScanMethod(button.dataset.scanMethodChoice);
  });
});

saveRetentionButton.addEventListener('click', async () => {
  saveRetentionButton.disabled = true;
  const response = await window.gym.setCheckinRetentionDays(Number(retentionDaysInput.value));
  saveRetentionButton.disabled = false;
  if (!response.ok) {
    showError(retentionStatus, response.error);
    return;
  }
  setStatus(retentionStatus, window.i18n.t(currentLang, 'settings.retention.saved'), 'success');
});

exportBackupButton.addEventListener('click', async () => {
  exportBackupButton.disabled = true;
  const response = await window.gym.exportBackup();
  exportBackupButton.disabled = false;
  if (!response.ok) {
    if (response.error === 'not_authorized') handleUnauthorized();
    else if (response.error !== 'cancelled') setStatus(backupStatus, window.i18n.t(currentLang, 'settings.backup.failed'), 'error');
    return;
  }
  setStatus(backupStatus, window.i18n.t(currentLang, 'settings.backup.savedSuccess', { path: response.data.path }), 'success');
});

exportLogButton.addEventListener('click', async () => {
  exportLogButton.disabled = true;
  const response = await window.gym.exportLogFile();
  exportLogButton.disabled = false;
  if (!response.ok) {
    if (response.error !== 'cancelled') showError(diagnosticsStatus, response.error);
    return;
  }
  setStatus(diagnosticsStatus, window.i18n.t(currentLang, 'settings.diagnostics.savedSuccess', { path: response.data.path }), 'success');
});

checkUpdatesButton.addEventListener('click', async () => {
  checkUpdatesButton.disabled = true;
  setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.checking'));
  const response = await window.gym.checkForUpdates();
  if (!response.ok) {
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.checkFailed'), 'error');
    checkUpdatesButton.disabled = false;
  }
});

// Nothing downloads or installs on its own (see src/updater.js) -- these two buttons only ever
// appear once staff has already taken the previous step: "available" reveals Download, and
// "downloaded" (below) reveals Restart and install. Each click is its own explicit confirmation.
downloadUpdateButton.addEventListener('click', async () => {
  downloadUpdateButton.disabled = true;
  setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.downloadingStart'));
  const response = await window.gym.downloadUpdate();
  if (!response.ok) {
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.downloadFailed'), 'error');
    downloadUpdateButton.disabled = false;
  }
});

installUpdateButton.addEventListener('click', () => {
  if (window.confirm(window.i18n.t(currentLang, 'settings.updates.installConfirm'))) {
    window.gym.quitAndInstallUpdate();
  }
});

window.gym.onUpdateStatus((payload) => {
  if (payload.status === 'checking') {
    checkUpdatesButton.disabled = true;
    downloadUpdateButton.hidden = true;
    installUpdateButton.hidden = true;
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.checkingLong'));
  } else if (payload.status === 'available') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.hidden = false;
    downloadUpdateButton.disabled = false;
    installUpdateButton.hidden = true;
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.available', { version: payload.version || '' }), 'success');
  } else if (payload.status === 'not-available') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.hidden = true;
    installUpdateButton.hidden = true;
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.upToDate'), 'success');
  } else if (payload.status === 'downloading') {
    downloadUpdateButton.disabled = true;
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.downloadingProgress', { percent: payload.percent ?? 0 }));
  } else if (payload.status === 'downloaded') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.hidden = true;
    installUpdateButton.hidden = false;
    setStatus(updateStatusEl, window.i18n.t(currentLang, 'settings.updates.downloaded', { version: payload.version || '' }), 'success');
  } else if (payload.status === 'error') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.disabled = false;
    setStatus(updateStatusEl, payload.message
      ? window.i18n.t(currentLang, 'settings.updates.errorWithMessage', { message: payload.message })
      : window.i18n.t(currentLang, 'settings.updates.errorGeneric'), 'error');
  }
});

// Shared by the kiosk stage's own "Test a card" (footer, real reader-facing displays) and the
// dashboard's copy of it in the admin header -- the stage is hidden entirely on a dashboard-role
// window (see applyWindowRole), so without this, staff would have no way to test a scan there at all.
function wireTestCardControl(toggle, form, input) {
  toggle.addEventListener('click', () => {
    const opening = form.hidden;
    form.hidden = !opening;
    toggle.hidden = opening;
    if (opening) input.focus();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const uid = input.value;
    input.value = '';
    input.blur();
    form.hidden = true;
    toggle.hidden = false;
    submitUid(uid);
  });
}

wireTestCardControl(testToggle, testForm, testUid);
wireTestCardControl(dashboardTestToggle, dashboardTestForm, dashboardTestUid);

// Dual-screen only (main.js only ever sends this to the kiosk window): a scan physically caught by
// the staff window still needs to show its full result somewhere -- this is that "somewhere".
window.gym.onRemoteCheckIn((result) => { showResult(result); });

// windowRole is 'single' unless main.js actually created a separate kiosk + staff window pair (see
// createWindows() in main.js) -- see scan-router.js's localDisplayMode() for how it changes what a
// caught scan does, and src/main.js's app-info handler for how it's resolved.
function applyWindowRole(role) {
  if (role === 'kiosk') {
    adminToggle.hidden = true;
    // Tab does nothing on this window in dual-screen mode (see the keydown handler above) -- don't
    // advertise it as a way to reach member management here. updateScanHintKey() (called from
    // applyScanMethod, right after this in the bootstrap below) picks up windowRole from appInfo,
    // already set by the time it runs, so nothing else is needed here.
  } else {
    // Every other role ('single', or 'staff' in dual-screen mode) is a permanent, PIN-gated staff
    // dashboard -- there's no public check-in stage to show on this window at all any more. A member
    // tapping a card here still gets a beep and, if a second monitor is running the real kiosk
    // display, their result shown there (see main.js); this window only ever shows a toast plus an
    // activity-feed entry (see pushActivityFeedEntry).
    stageSection.hidden = true;
    footerSection.hidden = true;
    adminToggle.hidden = true;
    adminModal.classList.add('is-page');
    openAdmin('add');
  }
}

validUntil.value = previewMonthlyEndDate(1);
updateClock();
setInterval(updateClock, 1000);

window.gym.getAppInfo().then((info) => {
  appInfo = info || appInfo;
  currentLang = appInfo.language || 'en';
  applyLanguageChoice(currentLang);
  try {
    const storedScanMethod = localStorage.getItem(SCAN_METHOD_STORAGE_KEY);
    if (VALID_SCAN_METHODS.includes(storedScanMethod)) scanMethod = storedScanMethod;
  } catch (error) {
    // localStorage can throw in some restricted contexts -- fall back to the 'card' default.
  }
  // Order matters: applyWindowRole may swap #scan-hint's data-i18n-html key for a kiosk-role window,
  // and applyScanMethod swaps several more (idle heading/subhead, the capture hint, the test-scan
  // labels) -- this final applyTranslations() pass is what actually renders whichever keys end up
  // set, so it must run after both, not before.
  applyWindowRole(appInfo.windowRole);
  applyScanMethod(scanMethod);
  window.i18n.applyTranslations(currentLang);
  updateClock();
});
