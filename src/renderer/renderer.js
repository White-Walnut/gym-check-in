const IDLE_TIMEOUT_MS = 7000;
const DUPLICATE_WINDOW_MS = 1500;
const TOAST_VISIBLE_MS = 4000;

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
const toastStack = document.querySelector('#toast-stack');

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

const reasonCopy = {
  active: { eyebrow: 'CHECK-IN APPROVED', message: 'Welcome in. Have a good session.' },
  punchcard: { eyebrow: 'PASS APPROVED', message: '' },
  expired: { eyebrow: 'MEMBERSHIP EXPIRED', message: 'Please renew at reception before entering.' },
  no_passes: { eyebrow: 'NO PASSES REMAINING', message: 'Please renew the punch card before entering.' },
  frozen: { eyebrow: 'MEMBERSHIP FROZEN', message: 'Please speak with reception before entering.' },
  cancelled: { eyebrow: 'MEMBERSHIP CANCELLED', message: 'Please speak with reception before entering.' },
  unknown_card: { eyebrow: 'CARD NOT RECOGNISED', message: 'Assign this card or ask the member to try another one.' },
  system_error: { eyebrow: 'CHECK-IN UNAVAILABLE', message: 'The card was read, but the local database returned an error.' },
  invalid_uid: { eyebrow: 'CARD COULD NOT BE READ', message: 'Please tap again or ask at reception.' }
};

const errorCopy = {
  invalid_uid: 'Tap a valid card before saving.',
  invalid_name: 'Enter the member’s first and last name.',
  invalid_membership_type: 'Choose a valid membership type.',
  invalid_status: 'Choose a valid member status.',
  invalid_date: 'Choose a valid end date.',
  invalid_passes: 'Enter at least one starting pass.',
  invalid_member: 'Choose a valid member.',
  member_not_found: 'That member could not be found.',
  card_exists: 'This card is already assigned to a member.',
  not_authorized: 'Your staff session expired. Please unlock again.',
  invalid_pin: 'PIN must be 4-8 digits.',
  wrong_pin: 'Incorrect current PIN.',
  wrong_recovery_code: 'Incorrect recovery code.',
  locked_out: 'Too many attempts. Please wait a moment and try again.',
  invalid_amount: 'Enter a valid amount, or leave it blank.',
  invalid_photo: 'Choose a JPG, PNG, or WEBP image under 8MB.',
  invalid_retention_days: 'Enter a whole number of days, 1 or more.',
  operation_failed: 'The change could not be saved. Try again.'
};

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat(undefined, {
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
  const copy = reasonCopy[result.reason] || reasonCopy.invalid_uid;
  const approved = Boolean(result.allowed);
  const displayName = result.member?.name || (result.reason === 'system_error' ? 'System error' : 'Unknown card');

  body.className = approved ? 'state-approved' : 'state-denied';
  idleView.hidden = true;
  resultView.hidden = false;
  resultEyebrow.textContent = copy.eyebrow;
  memberName.textContent = displayName;
  resultMessage.textContent = result.reason === 'punchcard'
    ? `${result.member.passesRemaining} ${result.member.passesRemaining === 1 ? 'pass' : 'passes'} remaining`
    : copy.message;
  portraitBadge.textContent = approved ? '✓' : '×';
  assignCardButton.hidden = result.reason !== 'unknown_card';
  lastUnknownUid = result.reason === 'unknown_card' ? result.uid : '';

  if (result.member) {
    if (result.member.membershipType === 'punchcard') {
      membershipPill.textContent = `Punch card · ${result.member.passesRemaining} remaining`;
    } else {
      const date = new Date(`${result.member.validUntil}T12:00:00`);
      membershipPill.textContent = result.reason === 'expired'
        ? `Monthly · Expired ${date.toLocaleDateString()}`
        : `Monthly · Valid until ${date.toLocaleDateString()}`;
    }
    memberPhoto.src = await window.gym.getPhotoUrl(result.member.photoPath) || fallbackAvatar(displayName);
  } else {
    membershipPill.textContent = `UID ${result.uid || 'not captured'}`;
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
  const copy = reasonCopy[result.reason] || reasonCopy.invalid_uid;
  const approved = Boolean(result.allowed);
  const displayName = result.member?.name || (result.reason === 'system_error' ? 'System error' : 'Unknown card');

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
  setStatus(addMemberStatus, `Card ${normalised} captured.`, 'success');
  document.querySelector('#first-name').focus();
}

function clearCapturedCard() {
  memberCardUid.value = '';
  capturedUid.textContent = 'Waiting for card…';
  cardCapture.classList.remove('has-card');
  scanDifferentCardButton.hidden = true;
}

function captureEditCardUid(uid) {
  document.querySelector('#edit-card-uid').value = uid;
  setStatus(editMemberStatus, `Card ${uid} captured.`, 'success');
}

function captureSearchUid(uid) {
  memberSearch.value = uid;
  runMemberSearch();
  setStatus(renewStatus, `Jumped to card ${uid}.`, 'success');
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
    return `Punch card · ${member.passesRemaining} ${member.passesRemaining === 1 ? 'pass' : 'passes'} remaining · UID ${member.cardUid}`;
  }
  const date = new Date(`${member.validUntil}T12:00:00`).toLocaleDateString();
  return `Monthly · Valid until ${date} · UID ${member.cardUid}`;
}

function renderSearchResults(members) {
  visibleMembers = members;
  memberCount.textContent = `${members.length} ${members.length === 1 ? 'member' : 'members'}`;
  searchResults.replaceChildren();
  if (!members.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-search';
    empty.textContent = 'No matching members.';
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
    details.title = `Edit ${member.name}`;
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
    const monthlyButton = makeRenewButton('+1 month', member.id, 'monthly');
    const punchButton = makeRenewButton('+10 passes', member.id, 'punchcard');
    const editButton = makeActionButton('Edit', () => openMemberEditor(member, false));
    actions.append(monthlyButton, punchButton);
    // "Custom date" only makes sense for a member already on a monthly plan -- forcing a punch-card
    // or frozen/cancelled member through this shortcut used to silently convert/reactivate them.
    if (member.membershipType === 'monthly') {
      actions.append(makeActionButton('Custom date', () => openMemberEditor(member, true)));
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
    setStatus(renewStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
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
  when.textContent = new Date(entry.checkedInAt.replace(' ', 'T')).toLocaleString();

  const who = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = entry.name;
  const uid = document.createElement('small');
  uid.textContent = `UID ${entry.uid}`;
  who.append(name, uid);

  const status = document.createElement('span');
  status.className = `history-status ${entry.allowed ? 'is-approved' : 'is-denied'}`;
  status.textContent = entry.allowed ? 'Approved' : (reasonCopy[entry.reason]?.eyebrow || 'Denied');

  row.append(when, who, status);
  return row;
}

async function runHistorySearch(reset) {
  if (reset) {
    historyOffset = 0;
    historyResults.replaceChildren();
    historyLoadMoreButton.hidden = true;
  }
  setStatus(historyStatus, 'Loading…');
  const response = await window.gym.searchCheckIns({
    ...currentHistoryFilters(),
    limit: HISTORY_PAGE_SIZE,
    offset: historyOffset
  });
  if (!response.ok) {
    setStatus(historyStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  const rows = response.data;
  if (reset && !rows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-search';
    empty.textContent = 'No check-ins match those filters.';
    historyResults.append(empty);
  } else {
    rows.forEach((entry) => historyResults.append(renderHistoryRow(entry)));
  }
  historyOffset += rows.length;
  historyCount.textContent = historyOffset ? `${historyOffset} shown` : '';
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
  setStatus(historyStatus, 'Exporting…');
  const result = await window.gym.exportCheckInsCsv(currentHistoryFilters());
  if (result.ok) {
    setStatus(historyStatus, result.data.truncated
      ? `Exported the most recent ${result.data.count} matching rows — narrow the date range to get everything older.`
      : `Exported ${result.data.count} row(s) to ${result.data.path}.`, 'success');
  } else if (result.error === 'cancelled') {
    setStatus(historyStatus, '');
  } else {
    setStatus(historyStatus, errorCopy[result.error] || errorCopy.operation_failed, 'error');
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
    empty.textContent = 'No check-ins yet.';
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
    status.textContent = entry.allowed ? 'Approved' : (reasonCopy[entry.reason]?.eyebrow || 'Denied');
    const time = document.createElement('time');
    time.textContent = entry.checkedInAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    row.append(name, status, time);
    activityFeedList.append(row);
  }
}

function pushActivityFeedEntry(result) {
  activityFeedEntries.unshift({
    uid: result.uid,
    allowed: Boolean(result.allowed),
    reason: result.reason,
    name: result.member?.name || (result.reason === 'unknown_card' ? 'Unknown card' : 'Unrecognised card'),
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
  editMemberTitle.textContent = customDateOnly ? `Set end date for ${member.name}` : `Edit ${member.name}`;
  setStatus(editMemberStatus, customDateOnly ? 'Choose the exact final day of access.' : '');
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
  if (discard.discardsPasses) parts.push(`${discard.passesLost} unused ${discard.passesLost === 1 ? 'pass' : 'passes'}`);
  if (discard.discardsDays) parts.push(`${discard.daysLost} remaining ${discard.daysLost === 1 ? 'day' : 'days'}`);
  const lossText = parts.length ? ` This removes ${parts.join(' and ')}.` : '';
  const reactivateText = discard.reactivates ? ` ${member.name} is currently ${member.membershipStatus} and will be reactivated.` : '';
  return `${member.name}:${lossText}${reactivateText} Continue?`;
}

function amountToCents(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function promptForAmountCents() {
  const raw = window.prompt('Amount paid (Kč), leave blank to skip:');
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
    setStatus(renewStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  const change = renewalType === 'monthly'
    ? `Monthly access extended through ${new Date(`${response.data.validUntil}T12:00:00`).toLocaleDateString()}.`
    : `Punch card now has ${response.data.passesRemaining} passes.`;
  setStatus(renewStatus, `${response.data.name}: ${change}`, 'success');
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
  setStatus(addMemberStatus, 'Tap the next card.');
});

scanToFindButton.addEventListener('click', () => {
  armedCaptureTarget = 'search';
  setStatus(renewStatus, 'Tap a card to jump to that member.');
});

scanReplaceCardButton.addEventListener('click', () => {
  armedCaptureTarget = 'edit-member';
  setStatus(editMemberStatus, 'Tap the replacement card.');
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
    setStatus(editMemberStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  editMemberPhoto.src = await window.gym.getPhotoUrl(response.data.photoPath) || fallbackAvatar('?');
  removePhotoButton.hidden = false;
  setStatus(editMemberStatus, 'Photo updated.', 'success');
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
  setStatus(cameraStatus, 'Starting camera…');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640 }, audio: false });
    cameraVideo.srcObject = cameraStream;
    setStatus(cameraStatus, '');
  } catch (error) {
    console.error('Camera access failed:', error);
    setStatus(cameraStatus, 'Could not access the camera. Check permissions, and that no other app is using it.', 'error');
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
    setStatus(cameraStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
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
    setStatus(editMemberStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  editMemberPhoto.src = fallbackAvatar('?');
  removePhotoButton.hidden = true;
  setStatus(editMemberStatus, 'Photo removed.', 'success');
});

exportMemberDataButton.addEventListener('click', async () => {
  const memberId = Number(document.querySelector('#edit-member-id').value);
  exportMemberDataButton.disabled = true;
  const response = await window.gym.exportMemberData({ memberId });
  exportMemberDataButton.disabled = false;
  if (!response.ok) {
    if (response.error !== 'cancelled') setStatus(editMemberStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  setStatus(editMemberStatus, `Data exported to ${response.data.path}`, 'success');
});

deleteMemberButton.addEventListener('click', async () => {
  const memberId = Number(document.querySelector('#edit-member-id').value);
  const name = `${document.querySelector('#edit-first-name').value} ${document.querySelector('#edit-last-name').value}`;
  const proceed = window.confirm(
    `Permanently erase ${name}'s name, photo, and card? Their check-in and payment history is kept, `
    + 'anonymized, for attendance and revenue records. This cannot be undone. Continue?'
  );
  if (!proceed) return;
  deleteMemberButton.disabled = true;
  const response = await window.gym.deleteMember({ memberId });
  deleteMemberButton.disabled = false;
  if (!response.ok) {
    setStatus(editMemberStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  closeMemberEditor();
  setStatus(renewStatus, `${name} was deleted.`, 'success');
  await runMemberSearch();
});

showExpiringButton.addEventListener('click', async () => {
  const withinDays = Number(expiringDaysInput.value) || 7;
  const response = await window.gym.expiringMembers(withinDays);
  if (!response.ok) {
    setStatus(renewStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  memberSearch.value = '';
  renderSearchResults(response.data);
  setStatus(renewStatus, response.data.length ? '' : 'No members expiring in that window.');
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
    setStatus(addMemberStatus, errorCopy.invalid_uid, 'error');
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
    setStatus(addMemberStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  setStatus(addMemberStatus, `${response.data.name} saved. The card is ready.`, 'success');
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
    setStatus(editMemberStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  setStatus(editMemberStatus, `${response.data.name} updated.`, 'success');
  setStatus(renewStatus, `${response.data.name} updated.`, 'success');
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
    setStatus(staffLockStatus, errorCopy[response.error] || errorCopy.wrong_pin, 'error');
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
    setStatus(staffLockStatus, 'PINs do not match.', 'error');
    return;
  }
  const submitButton = staffLockSetupForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.setStaffPin({ newPin });
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(staffLockStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
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
    setStatus(staffLockStatus, 'New PINs do not match.', 'error');
    return;
  }
  const submitButton = staffLockRecoverForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.resetStaffPinWithRecovery({ recoveryCode, newPin });
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(staffLockStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  staffSessionActive = true;
  showRecoveryCode(response.data.recoveryCode, true);
});

regenerateRecoveryButton.addEventListener('click', async () => {
  const currentPin = window.prompt('Enter your current PIN to regenerate the recovery code:');
  if (currentPin === null) return;
  regenerateRecoveryButton.disabled = true;
  const response = await window.gym.regenerateRecoveryCode({ currentPin });
  regenerateRecoveryButton.disabled = false;
  if (!response.ok) {
    setStatus(changePinStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  window.alert(`New recovery code: ${response.data.recoveryCode}\n\nWrite this down now -- it won't be shown again, and the old code no longer works.`);
});

changePinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const currentPin = document.querySelector('#change-pin-current').value;
  const newPin = document.querySelector('#change-pin-new').value;
  const confirmPin = document.querySelector('#change-pin-confirm').value;
  if (newPin !== confirmPin) {
    setStatus(changePinStatus, 'New PINs do not match.', 'error');
    return;
  }
  const submitButton = changePinForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const response = await window.gym.setStaffPin({ currentPin, newPin });
  submitButton.disabled = false;
  if (!response.ok) {
    setStatus(changePinStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  setStatus(changePinStatus, 'PIN updated.', 'success');
  changePinForm.reset();
});

kioskLockdownToggle.addEventListener('change', async () => {
  const desired = kioskLockdownToggle.checked;
  kioskLockdownToggle.disabled = true;
  const response = await window.gym.setKioskLockdown(desired);
  kioskLockdownToggle.disabled = false;
  if (!response.ok) {
    kioskLockdownToggle.checked = !desired; // revert on failure
  }
});

dualScreenToggle.addEventListener('change', async () => {
  const desired = dualScreenToggle.checked;
  dualScreenToggle.disabled = true;
  const response = await window.gym.setDualScreenEnabled(desired);
  dualScreenToggle.disabled = false;
  if (!response.ok) {
    dualScreenToggle.checked = !desired; // revert on failure
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

saveRetentionButton.addEventListener('click', async () => {
  saveRetentionButton.disabled = true;
  const response = await window.gym.setCheckinRetentionDays(Number(retentionDaysInput.value));
  saveRetentionButton.disabled = false;
  if (!response.ok) {
    setStatus(retentionStatus, errorCopy[response.error] || errorCopy.operation_failed, 'error');
    return;
  }
  setStatus(retentionStatus, 'Saved. Takes effect from the next launch onward.', 'success');
});

exportBackupButton.addEventListener('click', async () => {
  exportBackupButton.disabled = true;
  const response = await window.gym.exportBackup();
  exportBackupButton.disabled = false;
  if (!response.ok) {
    if (response.error !== 'cancelled') setStatus(backupStatus, 'Backup could not be saved.', 'error');
    return;
  }
  setStatus(backupStatus, `Backup saved to ${response.data.path}`, 'success');
});

checkUpdatesButton.addEventListener('click', async () => {
  checkUpdatesButton.disabled = true;
  setStatus(updateStatusEl, 'Checking…');
  const response = await window.gym.checkForUpdates();
  if (!response.ok) {
    setStatus(updateStatusEl, 'Update check failed. See UPDATER_SETUP.md.', 'error');
    checkUpdatesButton.disabled = false;
  }
});

// Nothing downloads or installs on its own (see src/updater.js) -- these two buttons only ever
// appear once staff has already taken the previous step: "available" reveals Download, and
// "downloaded" (below) reveals Restart and install. Each click is its own explicit confirmation.
downloadUpdateButton.addEventListener('click', async () => {
  downloadUpdateButton.disabled = true;
  setStatus(updateStatusEl, 'Downloading update…');
  const response = await window.gym.downloadUpdate();
  if (!response.ok) {
    setStatus(updateStatusEl, 'Download failed. Try again.', 'error');
    downloadUpdateButton.disabled = false;
  }
});

installUpdateButton.addEventListener('click', () => {
  if (window.confirm('This closes Gym Check-in and reopens it on the new version right away. Continue?')) {
    window.gym.quitAndInstallUpdate();
  }
});

window.gym.onUpdateStatus((payload) => {
  if (payload.status === 'checking') {
    checkUpdatesButton.disabled = true;
    downloadUpdateButton.hidden = true;
    installUpdateButton.hidden = true;
    setStatus(updateStatusEl, 'Checking for updates…');
  } else if (payload.status === 'available') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.hidden = false;
    downloadUpdateButton.disabled = false;
    installUpdateButton.hidden = true;
    setStatus(updateStatusEl, `Update ${payload.version || ''} is available.`, 'success');
  } else if (payload.status === 'not-available') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.hidden = true;
    installUpdateButton.hidden = true;
    setStatus(updateStatusEl, 'You are on the latest version.', 'success');
  } else if (payload.status === 'downloading') {
    downloadUpdateButton.disabled = true;
    setStatus(updateStatusEl, `Downloading update… ${payload.percent ?? 0}%`);
  } else if (payload.status === 'downloaded') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.hidden = true;
    installUpdateButton.hidden = false;
    setStatus(updateStatusEl, `Update ${payload.version || ''} downloaded and ready.`, 'success');
  } else if (payload.status === 'error') {
    checkUpdatesButton.disabled = false;
    downloadUpdateButton.disabled = false;
    setStatus(updateStatusEl, `Update check failed${payload.message ? `: ${payload.message}` : '.'}`, 'error');
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
    // advertise it as a way to reach member management here.
    document.querySelector('#scan-hint').innerHTML = 'Waiting for card <span>•</span> F11 full screen';
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
  applyWindowRole(appInfo.windowRole);
});
