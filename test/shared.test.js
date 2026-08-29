const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  generateSalt,
  hashSecret,
  verifySecret,
  isValidPinFormat,
  generateRecoveryCode,
  normaliseRecoveryCode
} = require('../src/shared/pin');
const { wouldDiscardBalance } = require('../src/shared/renewal');
const { resolvePhotoPath, isContainedIn, isAllowedImageExtension } = require('../src/shared/photo-paths');
const { membershipEndDate } = require('../src/shared/dates');
const { checkinNotificationCopy } = require('../src/shared/checkin-notification');
const { csvField, toCsv } = require('../src/shared/csv');
const { parseCapturedPhotoDataUrl } = require('../src/shared/photo-capture');

// --- Secret hashing (staff PIN + recovery code) ---------------------------------------------

test('a secret round-trips through hash + verify', () => {
  const salt = generateSalt();
  const hash = hashSecret('4321', salt);
  assert.equal(verifySecret('4321', salt, hash), true);
  assert.equal(verifySecret('1234', salt, hash), false);
});

test('verifySecret rejects a missing salt/hash instead of throwing', () => {
  assert.equal(verifySecret('4321', null, null), false);
  assert.equal(verifySecret('4321', 'somesalt', 'not-valid-hex'), false);
});

test('a generated recovery code is well-formed and free of ambiguous characters', () => {
  for (let i = 0; i < 20; i += 1) {
    const code = generateRecoveryCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
  }
});

test('normaliseRecoveryCode is forgiving of case and stray whitespace, so it still verifies', () => {
  const code = generateRecoveryCode();
  const salt = generateSalt();
  const hash = hashSecret(normaliseRecoveryCode(code), salt);
  assert.equal(verifySecret(normaliseRecoveryCode(`  ${code.toLowerCase()}  `), salt, hash), true);
});

// --- Photo file type check ---------------------------------------------------------------------

test('isAllowedImageExtension accepts common image types and rejects others', () => {
  assert.equal(isAllowedImageExtension('photo.jpg'), true);
  assert.equal(isAllowedImageExtension('photo.JPEG'), true);
  assert.equal(isAllowedImageExtension('photo.png'), true);
  assert.equal(isAllowedImageExtension('photo.webp'), true);
  assert.equal(isAllowedImageExtension('photo.svg'), false);
  assert.equal(isAllowedImageExtension('photo.exe'), false);
  assert.equal(isAllowedImageExtension('photo'), false);
});

test('isValidPinFormat requires 4-8 digits', () => {
  assert.equal(isValidPinFormat('1234'), true);
  assert.equal(isValidPinFormat('12345678'), true);
  assert.equal(isValidPinFormat('123'), false);
  assert.equal(isValidPinFormat('123456789'), false);
  assert.equal(isValidPinFormat('12a4'), false);
  assert.equal(isValidPinFormat(''), false);
});

// --- wouldDiscardBalance -----------------------------------------------------------------------

test('converting a punch-card member to monthly reports the passes that would be lost', () => {
  const member = { membershipType: 'punchcard', membershipStatus: 'active', passesRemaining: 8, validUntil: null };
  const result = wouldDiscardBalance(member, 'monthly', '2026-08-28');
  assert.equal(result.discardsPasses, true);
  assert.equal(result.passesLost, 8);
  assert.equal(result.discardsDays, false);
  assert.equal(result.reactivates, false);
});

test('converting a monthly member with remaining days to punch-card reports the days that would be lost', () => {
  const member = { membershipType: 'monthly', membershipStatus: 'active', passesRemaining: 0, validUntil: '2026-09-15' };
  const result = wouldDiscardBalance(member, 'punchcard', '2026-08-28');
  assert.equal(result.discardsDays, true);
  assert.equal(result.daysLost, 19); // inclusive of both endpoints
  assert.equal(result.discardsPasses, false);
});

test('an already-expired monthly member has no remaining days to discard', () => {
  const member = { membershipType: 'monthly', membershipStatus: 'active', passesRemaining: 0, validUntil: '2020-01-01' };
  const result = wouldDiscardBalance(member, 'punchcard', '2026-08-28');
  assert.equal(result.discardsDays, false);
  assert.equal(result.daysLost, 0);
});

test('a frozen or cancelled member is flagged as reactivating on any renewal', () => {
  const frozen = { membershipType: 'punchcard', membershipStatus: 'frozen', passesRemaining: 0, validUntil: null };
  const cancelled = { membershipType: 'monthly', membershipStatus: 'cancelled', passesRemaining: 0, validUntil: '2020-01-01' };
  assert.equal(wouldDiscardBalance(frozen, 'monthly', '2026-08-28').reactivates, true);
  assert.equal(wouldDiscardBalance(cancelled, 'punchcard', '2026-08-28').reactivates, true);
});

test('renewing within the same plan type discards nothing', () => {
  const monthly = { membershipType: 'monthly', membershipStatus: 'active', passesRemaining: 0, validUntil: '2026-09-15' };
  const result = wouldDiscardBalance(monthly, 'monthly', '2026-08-28');
  assert.equal(result.discardsDays, false);
  assert.equal(result.discardsPasses, false);
  assert.equal(result.reactivates, false);
});

// --- photo path containment ---------------------------------------------------------------------

const ASSETS_DIR = path.join('C:', 'app', 'assets');
const DEMO_PHOTOS_DIR = path.join(ASSETS_DIR, 'members');
const USER_DATA_DIR = path.join('C:', 'Users', 'staff', 'AppData', 'Roaming', 'gym-check-in');
const ROOTS = { demoPhotosDir: DEMO_PHOTOS_DIR, allowedRoots: [ASSETS_DIR, USER_DATA_DIR] };

test('a demo token resolves inside the bundled assets directory', () => {
  const resolved = resolvePhotoPath('demo:alex', ROOTS);
  assert.equal(resolved, path.join(DEMO_PHOTOS_DIR, 'alex.svg'));
});

test('a path inside userData is allowed', () => {
  const target = path.join(USER_DATA_DIR, 'photos', 'member-1.jpg');
  assert.equal(resolvePhotoPath(target, ROOTS), target);
});

test('a path outside every allowed root is rejected', () => {
  assert.equal(resolvePhotoPath(path.join('C:', 'Users', 'staff', 'AppData', 'Roaming', 'gym-check-in.sqlite'), ROOTS), null);
  assert.equal(resolvePhotoPath('C:\\Windows\\System32\\drivers\\etc\\hosts', ROOTS), null);
});

test('a sibling directory sharing a name prefix is not treated as contained', () => {
  // "gym-check-in-evil" starts with the same string as the userData root but is not inside it.
  const evilSibling = USER_DATA_DIR + '-evil';
  assert.equal(isContainedIn(USER_DATA_DIR, path.join(evilSibling, 'file.jpg')), false);
});

test('missing or non-string input resolves to null instead of throwing', () => {
  assert.equal(resolvePhotoPath(null, ROOTS), null);
  assert.equal(resolvePhotoPath(undefined, ROOTS), null);
  assert.equal(resolvePhotoPath(42, ROOTS), null);
});

// --- anchor-preserving calendar math (see src/database.js renewMember/updateMember) -------------

test('a clamped short month does not compound into a permanent drift when the anchor is preserved', () => {
  // Signup Jan 31 (anchor day 31): first period is clamped by February. Every later month should be
  // computed fresh against anchor day 31, not against whatever day the previous (clamped) period
  // happened to end on -- so the shortfall never compounds across months.
  const anchor = 31;
  let end = membershipEndDate('2026-01-31', 1, anchor); // Jan 31 -> Feb 27 (2026 is not a leap year)
  assert.equal(end, '2026-02-27');

  const nextStart = '2026-02-28';
  end = membershipEndDate(nextStart, 1, anchor); // still anchored to 31 -> Mar 30 (Mar has 31 days)
  assert.equal(end, '2026-03-30');

  // Compare against the OLD (buggy) behavior of re-deriving the anchor from the previous period's
  // own end-day (28): that compounds into a lower day every month it repeats.
  const driftedEnd = membershipEndDate(nextStart, 1); // no anchor -> uses nextStart's own day (28)
  assert.equal(driftedEnd, '2026-03-27');
  assert.notEqual(end, driftedEnd);
});

// --- check-in notification copy (see notifyCheckIn in src/main.js) -------------------------------
// The one thing staff must be able to tell from the popup alone is whether the card was valid --
// every reason code's body has to actually say so, not just restate "checked in".

test('an approved monthly member notification states validity, not just a name', () => {
  const copy = checkinNotificationCopy({
    allowed: true, reason: 'active', uid: '1',
    member: { name: 'Jordan Lee', validUntil: '2026-09-27' }
  });
  assert.match(copy.title, /Jordan Lee/);
  assert.match(copy.body, /Valid/i);
  assert.match(copy.body, /2026-09-27/);
});

test('an approved punch-card notification pluralises the remaining count correctly', () => {
  const one = checkinNotificationCopy({
    allowed: true, reason: 'punchcard', uid: '1',
    member: { name: 'Alex Novak', passesRemaining: 1 }
  });
  assert.match(one.body, /1 pass\b/);
  assert.doesNotMatch(one.body, /1 passes/);

  const many = checkinNotificationCopy({
    allowed: true, reason: 'punchcard', uid: '1',
    member: { name: 'Alex Novak', passesRemaining: 9 }
  });
  assert.match(many.body, /9 passes/);
});

test('every denial reason states DENIED and a distinct reason', () => {
  const cases = ['expired', 'no_passes', 'frozen', 'cancelled'];
  const bodies = cases.map((reason) => checkinNotificationCopy({
    allowed: false, reason, uid: '1',
    member: { name: 'Sam Doe', validUntil: '2026-01-01' }
  }).body);
  for (const body of bodies) assert.match(body, /DENIED/);
  assert.equal(new Set(bodies).size, cases.length);
});

test('an unknown card notification surfaces the UID instead of a member name', () => {
  const copy = checkinNotificationCopy({ allowed: false, reason: 'unknown_card', uid: 'DEADBEEF' });
  assert.match(copy.title, /Unknown card/i);
  assert.match(copy.body, /DEADBEEF/);
});

// --- CSV export (see export-check-ins-csv in src/main.js) ----------------------------------------

test('csvField quotes only values that actually need it', () => {
  assert.equal(csvField('Jordan Lee'), 'Jordan Lee');
  assert.equal(csvField(''), '');
  assert.equal(csvField(null), '');
  assert.equal(csvField(undefined), '');
  assert.equal(csvField('Doe, Jane'), '"Doe, Jane"');
  assert.equal(csvField('She said "hi"'), '"She said ""hi"""');
  assert.equal(csvField('line1\nline2'), '"line1\nline2"');
});

// --- webcam capture data-URL parsing (see capture-member-photo in src/main.js) -------------------

const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('parseCapturedPhotoDataUrl accepts a well-formed PNG data URL', () => {
  const result = parseCapturedPhotoDataUrl(`data:image/png;base64,${TINY_PNG_BASE64}`, 1024 * 1024);
  assert.ok(result);
  assert.equal(result.extension, '.png');
  assert.ok(Buffer.isBuffer(result.buffer));
  assert.ok(result.buffer.length > 0);
});

test('parseCapturedPhotoDataUrl accepts a well-formed JPEG data URL', () => {
  const result = parseCapturedPhotoDataUrl(`data:image/jpeg;base64,${TINY_PNG_BASE64}`, 1024 * 1024);
  assert.ok(result);
  assert.equal(result.extension, '.jpg');
});

test('parseCapturedPhotoDataUrl rejects malformed input or an unsupported MIME type', () => {
  assert.equal(parseCapturedPhotoDataUrl(undefined, 1024 * 1024), null);
  assert.equal(parseCapturedPhotoDataUrl('not a data url', 1024 * 1024), null);
  assert.equal(parseCapturedPhotoDataUrl(`data:image/gif;base64,${TINY_PNG_BASE64}`, 1024 * 1024), null);
  assert.equal(parseCapturedPhotoDataUrl('data:image/png;base64,', 1024 * 1024), null);
});

test('parseCapturedPhotoDataUrl rejects anything over the size cap', () => {
  const result = parseCapturedPhotoDataUrl(`data:image/png;base64,${TINY_PNG_BASE64}`, 4);
  assert.equal(result, null);
});

test('toCsv writes a header row and one row per entry, in header order', () => {
  const headers = [{ key: 'name', label: 'Name' }, { key: 'uid', label: 'Card UID' }];
  const rows = [{ name: 'Jordan Lee', uid: '10000001' }, { name: 'Doe, Jane', uid: '10000002' }];
  const csv = toCsv(headers, rows);
  const lines = csv.split('\r\n');
  assert.equal(lines[0], 'Name,Card UID');
  assert.equal(lines[1], 'Jordan Lee,10000001');
  assert.equal(lines[2], '"Doe, Jane",10000002');
});
