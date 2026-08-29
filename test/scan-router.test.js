const test = require('node:test');
const assert = require('node:assert/strict');
const {
  EMPTY_STATE,
  FAST_CHAR_GAP_MS,
  GAP_RESET_MS,
  MIN_SCAN_LENGTH,
  advanceScanState,
  isConfirmedScan,
  routeScan,
  localDisplayMode
} = require('../src/renderer/scan-router');

function typeFast(uid) {
  let state = { ...EMPTY_STATE };
  for (const char of uid) {
    state = advanceScanState(state, 5); // well under FAST_CHAR_GAP_MS
    void char;
  }
  return state;
}

function typeSlowly(uid) {
  let state = { ...EMPTY_STATE };
  for (const char of uid) {
    state = advanceScanState(state, FAST_CHAR_GAP_MS + 60); // human typing pace
    void char;
  }
  return state;
}

test('a full-speed HID burst is a confirmed scan once it reaches the minimum length', () => {
  const state = typeFast('10000001');
  assert.equal(isConfirmedScan(state), true);
  assert.ok(state.length >= MIN_SCAN_LENGTH);
});

test('human-paced typing is never confirmed as a scan', () => {
  const state = typeSlowly('10000001');
  assert.equal(isConfirmedScan(state), false);
});

test('the first keystroke of a burst is never suppressed (nothing to compare it against yet)', () => {
  const first = advanceScanState({ ...EMPTY_STATE }, 999);
  assert.equal(first.suppressed, false);
});

test('a fast second keystroke is suppressed so it cannot leak into a focused field', () => {
  const first = advanceScanState({ ...EMPTY_STATE }, 999);
  const second = advanceScanState(first, 5);
  assert.equal(second.suppressed, true);
  assert.equal(second.length, 2);
});

test('a slow keystroke mid-burst abandons tracking and is not suppressed', () => {
  const first = advanceScanState({ ...EMPTY_STATE }, 999);
  const second = advanceScanState(first, 5);
  const third = advanceScanState(second, FAST_CHAR_GAP_MS + 100);
  assert.equal(third.suppressed, false);
  assert.equal(third.length, 0);
  assert.equal(isConfirmedScan(third), false);
});

test('a gap at or beyond GAP_RESET_MS always starts a fresh, unsuppressed burst', () => {
  const midBurst = typeFast('1000');
  const afterPause = advanceScanState(midBurst, GAP_RESET_MS + 1);
  assert.equal(afterPause.suppressed, false);
  assert.equal(afterPause.length, 1);
});

test('a shorter-than-minimum fast burst is not a confirmed scan', () => {
  const state = typeFast('123');
  assert.equal(state.length, 3);
  assert.equal(isConfirmedScan(state), false);
});

test('routeScan checks in by default, and captures only when explicitly armed', () => {
  assert.deepEqual(routeScan(null), { action: 'check-in' });
  assert.deepEqual(routeScan('add-member'), { action: 'capture', target: 'add-member' });
  assert.deepEqual(routeScan('edit-member'), { action: 'capture', target: 'edit-member' });
  assert.deepEqual(routeScan('search'), { action: 'capture', target: 'search' });
});

test('localDisplayMode: only a real kiosk display shows the full check-in stage', () => {
  assert.equal(localDisplayMode('kiosk'), 'full');
});

test('localDisplayMode: a single window (the staff dashboard, no kiosk stage) always shows a toast', () => {
  assert.equal(localDisplayMode('single'), 'toast');
});

test('localDisplayMode: the staff window in dual-screen mode always shows a toast (the kiosk window gets the full result via a push)', () => {
  assert.equal(localDisplayMode('staff'), 'toast');
});
