// Pure decision logic for turning raw keydown events into either a card-capture or a check-in,
// WITHOUT relying on which DOM element currently has focus. This is what fixes the bug where a
// member's card scan gets typed into whatever admin text field staff happened to be using (adding a
// new member, searching, editing) instead of checking them in or being captured on purpose.
//
// A keyboard-wedge RFID reader types each character single-digit-milliseconds apart; a human typing
// a UID by hand does not. advanceScanState() uses that to decide, one keystroke at a time, whether
// the *current* keystroke should be suppressed (kept out of whatever field has focus) because it's
// very likely part of a machine-typed scan. The first keystroke of any burst can't be classified yet
// (there's no prior gap to compare), so it is never suppressed -- a true scan's first character can
// rarely, cosmetically leak into a focused field; a full UID never can, which is the failure mode
// that mattered. As soon as a keystroke's timing looks human (a gap above FAST_CHAR_GAP_MS), the
// burst is abandoned and typing behaves completely normally again.
//
// routeScan() then decides, given the explicit "armed capture" state the app is in (never DOM focus),
// whether a confirmed scan should be captured into a specific field or treated as a check-in. Staff
// must explicitly arm capture (a button) for anything other than check-in to happen -- see
// ARM_ADD_MEMBER / ARM_EDIT_MEMBER / ARM_SEARCH usage in renderer.js.

const GAP_RESET_MS = 250; // a gap this large (or the very first keystroke) starts a fresh burst
const FAST_CHAR_GAP_MS = 40; // a gap this small between two consecutive characters is HID-reader speed
const MIN_SCAN_LENGTH = 4;

const EMPTY_STATE = Object.freeze({ length: 0, allFast: true });

function advanceScanState(prevState, gapMs) {
  const isContinuation = prevState.length > 0 && gapMs <= GAP_RESET_MS;

  if (!isContinuation) {
    // Start of a new possible burst -- not yet classifiable, never suppressed.
    return { length: 1, allFast: true, suppressed: false };
  }

  if (gapMs > FAST_CHAR_GAP_MS) {
    // Pace slowed down mid-burst: this is a human typing, not a scan. Abandon tracking entirely so
    // the rest of their input behaves like ordinary typing.
    return { length: 0, allFast: false, suppressed: false };
  }

  // Second+ consecutive fast keystroke: high-confidence HID scan. Suppress it.
  return { length: prevState.length + 1, allFast: true, suppressed: true };
}

function isConfirmedScan(state) {
  return state.allFast && state.length >= MIN_SCAN_LENGTH;
}

// armedTarget: null, or one of 'add-member' | 'edit-member' | 'search'.
function routeScan(armedTarget) {
  if (armedTarget) return { action: 'capture', target: armedTarget };
  return { action: 'check-in' };
}

// windowRole comes from app-info's `windowRole` ('single' | 'kiosk' | 'staff'). Only a real kiosk
// display -- the customer-facing monitor in two-screen mode -- ever shows the full check-in stage;
// every other window is a staff dashboard (no check-in stage at all, see applyWindowRole in
// renderer.js), where a check-in always shows as a toast plus an activity-feed entry instead.
//
//   'kiosk'            -> 'full'   (this window IS the customer-facing display)
//   'single' or 'staff' -> 'toast' (staff dashboard; 'single' also gets the same toast + feed 'kiosk'
//                                   gets pushed to via a main-process relay -- see 'remote-checkin-result')
function localDisplayMode(windowRole) {
  return windowRole === 'kiosk' ? 'full' : 'toast';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAP_RESET_MS,
    FAST_CHAR_GAP_MS,
    MIN_SCAN_LENGTH,
    EMPTY_STATE,
    advanceScanState,
    isConfirmedScan,
    routeScan,
    localDisplayMode
  };
}
