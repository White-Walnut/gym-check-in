const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { GymDatabase, membershipEndDate, normaliseUid } = require('../src/database');

test('normalises common reader output without losing leading zeroes', () => {
  assert.equal(normaliseUid(' 00-ab:12\r\n'), '00AB12');
});

test('calculates a calendar month as next month same day minus one', () => {
  assert.equal(membershipEndDate('2026-08-28'), '2026-09-27');
  assert.equal(membershipEndDate('2026-12-15'), '2027-01-14');
  assert.equal(membershipEndDate('2026-01-31'), '2026-02-27');
});

test('approves active members and records the attempt', () => {
  const database = new GymDatabase(':memory:');
  database.db.prepare(`
    INSERT INTO members (card_uid, first_name, last_name, membership_status, valid_until)
    VALUES (?, ?, ?, ?, ?)
  `).run('00123', 'Taylor', 'Ng', 'active', '2027-01-01');

  const result = database.checkIn('00123', new Date('2026-08-27T12:00:00'));
  assert.equal(result.allowed, true);
  assert.equal(result.member.name, 'Taylor Ng');
  assert.equal(database.recentCheckIns()[0].reason, 'active');
  database.close();
});

test('denies expired, frozen and unknown cards', () => {
  const database = new GymDatabase(':memory:');
  const insert = database.db.prepare(`
    INSERT INTO members (card_uid, first_name, last_name, membership_status, valid_until)
    VALUES (?, ?, ?, ?, ?)
  `);
  insert.run('EXPIRED', 'Expired', 'Member', 'active', '2025-01-01');
  insert.run('FROZEN', 'Frozen', 'Member', 'frozen', '2027-01-01');

  assert.equal(database.checkIn('EXPIRED', new Date('2026-08-27T12:00:00')).reason, 'expired');
  assert.equal(database.checkIn('FROZEN', new Date('2026-08-27T12:00:00')).reason, 'frozen');
  assert.equal(database.checkIn('MISSING', new Date('2026-08-27T12:00:00')).reason, 'unknown_card');
  assert.equal(database.recentCheckIns().length, 3);
  database.close();
});

test('searchCheckIns filters by name/UID, by date range, and still includes denials', () => {
  const database = new GymDatabase(':memory:');
  const insert = database.db.prepare(`
    INSERT INTO members (card_uid, first_name, last_name, membership_status, valid_until)
    VALUES (?, ?, ?, ?, ?)
  `);
  insert.run('A1', 'Alex', 'Morgan', 'active', '2027-01-01');
  insert.run('B2', 'Jamie', 'Chen', 'active', '2025-01-01'); // expired

  database.checkIn('A1');       // approved
  database.checkIn('B2');       // denied (expired)
  database.checkIn('UNKNOWN1'); // denied (unknown card)

  // checkIn()'s `now` param only drives the expiry check, not the recorded timestamp -- that column
  // always stamps CURRENT_TIMESTAMP. Set explicit historical dates directly to test date filtering.
  const stampCheckedInAt = database.db.prepare('UPDATE check_ins SET checked_in_at = ? WHERE id = ?');
  stampCheckedInAt.run('2026-08-01 09:00:00', 1);
  stampCheckedInAt.run('2026-08-05 09:00:00', 2);
  stampCheckedInAt.run('2026-08-10 09:00:00', 3);

  const all = database.searchCheckIns();
  assert.equal(all.length, 3);
  assert.equal(all[0].reason, 'unknown_card'); // newest first
  assert.equal(all.filter((row) => !row.allowed).length, 2); // denials are not filtered out

  assert.deepEqual(database.searchCheckIns({ query: 'Alex' }).map((r) => r.name), ['Alex Morgan']);
  assert.deepEqual(database.searchCheckIns({ query: 'b2' }).map((r) => r.uid), ['B2']); // UID match, case-insensitive

  const inRange = database.searchCheckIns({ fromDate: '2026-08-05', toDate: '2026-08-05' });
  assert.equal(inRange.length, 1);
  assert.equal(inRange[0].name, 'Jamie Chen');

  const page1 = database.searchCheckIns({ limit: 1, offset: 0 });
  const page2 = database.searchCheckIns({ limit: 1, offset: 1 });
  assert.equal(page1[0].reason, 'unknown_card');
  assert.equal(page2[0].name, 'Jamie Chen');

  database.close();
});

test('punchcard check-ins decrement once and deny entry at zero', () => {
  const database = new GymDatabase(':memory:');
  database.db.prepare(`
    INSERT INTO members
      (card_uid, first_name, last_name, membership_status, membership_type, passes_remaining)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PUNCH10', 'Punch', 'Member', 'active', 'punchcard', 2);

  // Spaced well past the default 3-hour re-entry cooldown (see the next test for that behavior on
  // its own) -- this test is specifically about decrementing/zero-denial, not the cooldown.
  const base = new Date('2026-01-01T09:00:00Z');
  const hoursLater = (hours) => new Date(base.getTime() + hours * 3600 * 1000);
  const first = database.checkIn('PUNCH10', base);
  const second = database.checkIn('PUNCH10', hoursLater(4));
  const third = database.checkIn('PUNCH10', hoursLater(8));
  assert.equal(first.allowed, true);
  assert.equal(first.member.passesRemaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.member.passesRemaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.reason, 'no_passes');
  assert.equal(database.getMemberByUid('PUNCH10').passes_remaining, 0);
  database.close();
});

test('punchcard re-entry within the cooldown window checks in without spending a pass', () => {
  const database = new GymDatabase(':memory:');
  database.db.prepare(`
    INSERT INTO members
      (card_uid, first_name, last_name, membership_status, membership_type, passes_remaining)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PUNCH20', 'Punch', 'Member', 'active', 'punchcard', 5);

  const base = new Date('2026-01-01T09:00:00Z');
  const minutesLater = (minutes) => new Date(base.getTime() + minutes * 60 * 1000);

  const first = database.checkIn('PUNCH20', base);
  assert.equal(first.allowed, true);
  assert.equal(first.reason, 'punchcard');
  assert.equal(first.member.passesRemaining, 4);

  // Well within the default 3-hour cooldown -- allowed back in, but no second pass spent.
  const second = database.checkIn('PUNCH20', minutesLater(90));
  assert.equal(second.allowed, true);
  assert.equal(second.reason, 'punchcard_recent');
  assert.equal(second.member.passesRemaining, 4);
  assert.equal(database.getMemberByUid('PUNCH20').passes_remaining, 4);

  // Past the cooldown -- a genuinely new visit, spends a pass normally again.
  const third = database.checkIn('PUNCH20', minutesLater(90 + 3 * 60 + 1));
  assert.equal(third.allowed, true);
  assert.equal(third.reason, 'punchcard');
  assert.equal(third.member.passesRemaining, 3);

  database.close();
});

test('punchcard cooldown can be disabled (0 hours) or adjusted', () => {
  const database = new GymDatabase(':memory:');
  database.db.prepare(`
    INSERT INTO members
      (card_uid, first_name, last_name, membership_status, membership_type, passes_remaining)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PUNCH30', 'Punch', 'Member', 'active', 'punchcard', 5);

  assert.equal(database.getPunchcardCooldownHours(), 3); // default
  database.setPunchcardCooldownHours(0);
  assert.equal(database.getPunchcardCooldownHours(), 0);

  const base = new Date('2026-01-01T09:00:00Z');
  const secondsLater = (seconds) => new Date(base.getTime() + seconds * 1000);
  const first = database.checkIn('PUNCH30', base);
  const second = database.checkIn('PUNCH30', secondsLater(1)); // one second later -- cooldown is off
  assert.equal(first.member.passesRemaining, 4);
  assert.equal(second.reason, 'punchcard'); // not punchcard_recent -- cooldown disabled means every scan spends a pass
  assert.equal(second.member.passesRemaining, 3);

  assert.throws(() => database.setPunchcardCooldownHours(-1), /invalid_cooldown_hours/);
  assert.throws(() => database.setPunchcardCooldownHours('abc'), /invalid_cooldown_hours/);

  database.close();
});

test("monthly members are unaffected by the punch-card cooldown (they don't spend passes)", () => {
  const database = new GymDatabase(':memory:');
  database.db.prepare(`
    INSERT INTO members
      (card_uid, first_name, last_name, membership_status, membership_type, valid_until)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('MONTHLY10', 'Monthly', 'Member', 'active', 'monthly', '2099-12-31');

  const base = new Date('2026-01-01T09:00:00Z');
  const minutesLater = (minutes) => new Date(base.getTime() + minutes * 60 * 1000);
  const first = database.checkIn('MONTHLY10', base);
  const second = database.checkIn('MONTHLY10', minutesLater(5)); // straight back in, seconds later
  assert.equal(first.allowed, true);
  assert.equal(first.reason, 'active');
  assert.equal(second.allowed, true);
  assert.equal(second.reason, 'active'); // never punchcard_recent -- that only ever applies to punch cards

  database.close();
});

test('adds members, logs subscriptions, searches, and renews both plan types', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: '04-a1-b2-c3',
    firstName: 'Jamie',
    lastName: 'Chen',
    membershipType: 'punchcard',
    passesRemaining: 10
  });

  assert.equal(member.cardUid, '04A1B2C3');
  assert.equal(database.searchMembers('Jamie')[0].name, 'Jamie Chen');
  assert.equal(database.searchMembers('04A1')[0].id, member.id);
  assert.equal(database.searchMembers('')[0].id, member.id);
  assert.equal(database.renewMember(member.id, 'punchcard').passesRemaining, 20);
  const monthly = database.renewMember(member.id, 'monthly', new Date('2026-08-28T12:00:00'));
  assert.equal(monthly.membershipType, 'monthly');
  assert.equal(monthly.validUntil, '2026-09-27');
  assert.equal(database.db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 3);
  assert.throws(() => database.addMember({
    cardUid: '04A1B2C3', firstName: 'Other', lastName: 'Member',
    membershipType: 'punchcard', passesRemaining: 10
  }), /card_exists/);
  database.close();
});

test('extends active access by a calendar month and accepts a custom end date', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'CALENDAR1', firstName: 'Calendar', lastName: 'Member',
    membershipType: 'monthly', validUntil: '2026-09-27'
  }, new Date('2026-08-28T12:00:00'));

  const nextMonth = database.renewMember(member.id, 'monthly', {}, new Date('2026-08-28T12:00:00'));
  assert.equal(nextMonth.validUntil, '2026-10-27');
  const custom = database.renewMember(member.id, 'monthly', { validUntil: '2027-08-27' }, new Date('2026-08-28T12:00:00'));
  assert.equal(custom.validUntil, '2027-08-27');
  assert.throws(
    () => database.renewMember(member.id, 'monthly', { validUntil: '2027-01-01' }, new Date('2026-08-28T12:00:00')),
    /invalid_date/
  );
  database.close();
});

test('edits member identity, card, status and membership values', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'EDIT0001', firstName: 'Before', lastName: 'Name',
    membershipType: 'punchcard', passesRemaining: 5
  });
  const updated = database.updateMember({
    id: member.id,
    cardUid: 'EDIT0002',
    firstName: 'After',
    lastName: 'Member',
    membershipStatus: 'frozen',
    membershipType: 'punchcard',
    passesRemaining: 12
  });
  assert.equal(updated.name, 'After Member');
  assert.equal(updated.cardUid, 'EDIT0002');
  assert.equal(updated.membershipStatus, 'frozen');
  assert.equal(updated.passesRemaining, 12);
  assert.equal(database.getMemberByUid('EDIT0001'), undefined);
  assert.equal(database.db.prepare("SELECT passes_added FROM subscriptions ORDER BY id DESC LIMIT 1").get().passes_added, 7);
  database.close();
});

test('upgrades the legacy schema without losing members or check-ins', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-checkin-test-'));
  const databasePath = path.join(directory, 'legacy.sqlite');
  const legacy = new DatabaseSync(databasePath);
  legacy.exec(`
    CREATE TABLE members (
      id INTEGER PRIMARY KEY, card_uid TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL, last_name TEXT NOT NULL, photo_path TEXT,
      membership_status TEXT NOT NULL, valid_until TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE check_ins (
      id INTEGER PRIMARY KEY, member_id INTEGER, card_uid TEXT NOT NULL,
      checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      allowed INTEGER NOT NULL, reason TEXT NOT NULL
    );
    INSERT INTO members
      (id, card_uid, first_name, last_name, membership_status, valid_until)
    VALUES (7, 'LEGACY01', 'Legacy', 'Member', 'active', '2099-01-01');
    INSERT INTO check_ins (member_id, card_uid, allowed, reason)
    VALUES (7, 'LEGACY01', 1, 'active');
  `);
  legacy.close();

  const upgraded = new GymDatabase(databasePath);
  const member = upgraded.getMemberByUid('LEGACY01');
  assert.equal(member.membership_type, 'monthly');
  assert.equal(member.passes_remaining, 0);
  // billing_anchor_day is a new column; a legacy monthly member gets it backfilled from their
  // existing valid_until so anchor-preserving renewals work immediately after the upgrade.
  assert.equal(member.billing_anchor_day, 1);
  assert.equal(upgraded.recentCheckIns()[0].name, 'Legacy Member');
  assert.equal(upgraded.db.prepare('PRAGMA foreign_key_check').all().length, 0);
  upgraded.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('a legacy-schema rebuild does not leave a pre-existing subscriptions table pointing at a dropped table', () => {
  // Regression test for the bug fixed in rebuildLegacyTables: renaming `members` without
  // legacy_alter_table set used to make SQLite silently rewrite any OTHER table's foreign key that
  // referenced `members` (here, a subscriptions table that already exists before the rebuild) to
  // follow the rename -- leaving it dangling once the renamed table was dropped a few lines later.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-checkin-test-'));
  const databasePath = path.join(directory, 'legacy-with-subscriptions.sqlite');
  const legacy = new DatabaseSync(databasePath);
  legacy.exec(`
    CREATE TABLE members (
      id INTEGER PRIMARY KEY, card_uid TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL, last_name TEXT NOT NULL, photo_path TEXT,
      membership_status TEXT NOT NULL, valid_until TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO members (id, card_uid, first_name, last_name, membership_status, valid_until)
    VALUES (9, 'PRE0001', 'Pre', 'Existing', 'active', '2099-01-01');
    CREATE TABLE subscriptions (
      id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL, event_type TEXT NOT NULL,
      membership_type TEXT NOT NULL, days_added INTEGER NOT NULL DEFAULT 0, passes_added INTEGER NOT NULL DEFAULT 0,
      amount_cents INTEGER, note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id)
    ) STRICT;
    INSERT INTO subscriptions (member_id, event_type, membership_type, days_added, amount_cents)
    VALUES (9, 'signup', 'monthly', 30, 9900);
  `);
  legacy.close();

  const upgraded = new GymDatabase(databasePath);
  const schemaSql = upgraded.db.prepare("SELECT sql FROM sqlite_master WHERE name = 'subscriptions'").get().sql;
  assert.ok(!schemaSql.includes('members_legacy'));
  assert.equal(upgraded.db.prepare('PRAGMA foreign_key_check').all().length, 0);
  assert.equal(upgraded.db.prepare('SELECT amount_cents FROM subscriptions WHERE id = 1').get().amount_cents, 9900);

  const member = upgraded.getMemberByUid('PRE0001');
  upgraded.updateMember({
    id: member.id, cardUid: 'PRE0001', firstName: 'Pre', lastName: 'Existing',
    membershipStatus: 'active', membershipType: 'monthly', validUntil: '2099-01-01', amountCents: 100
  });
  assert.equal(upgraded.db.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n, 2);

  upgraded.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('creates a pre-migration backup file before rebuilding a legacy schema', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-checkin-test-'));
  const databasePath = path.join(directory, 'legacy.sqlite');
  const legacy = new DatabaseSync(databasePath);
  legacy.exec(`
    CREATE TABLE members (
      id INTEGER PRIMARY KEY, card_uid TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL, last_name TEXT NOT NULL, photo_path TEXT,
      membership_status TEXT NOT NULL, valid_until TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO members (id, card_uid, first_name, last_name, membership_status, valid_until)
    VALUES (1, 'BACKUP01', 'Backup', 'Member', 'active', '2099-01-01');
  `);
  legacy.close();

  const upgraded = new GymDatabase(databasePath);
  upgraded.close();

  const backups = fs.readdirSync(directory).filter((name) => name.includes('pre-migration'));
  assert.equal(backups.length, 1);
  const backedUp = new DatabaseSync(path.join(directory, backups[0]));
  const row = backedUp.prepare('SELECT card_uid FROM members WHERE id = 1').get();
  assert.equal(row.card_uid, 'BACKUP01');
  backedUp.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('repairs a subscriptions table whose foreign key was left dangling on a dropped members_legacy table', () => {
  // Reproduces a real bug: an earlier version of rebuildLegacyTables renamed `members` without
  // legacy_alter_table set, which made SQLite silently rewrite subscriptions' foreign key to follow
  // the rename -- then members_legacy was dropped, leaving that foreign key permanently dangling.
  // Every subsequent renewal/payment (any INSERT into subscriptions) then failed with
  // "no such table: main.members_legacy".
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-checkin-test-'));
  const databasePath = path.join(directory, 'dangling-fk.sqlite');
  const broken = new DatabaseSync(databasePath);
  broken.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE members (
      id INTEGER PRIMARY KEY, card_uid TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      photo_path TEXT, membership_status TEXT NOT NULL DEFAULT 'active', membership_type TEXT NOT NULL DEFAULT 'monthly',
      valid_until TEXT, passes_remaining INTEGER NOT NULL DEFAULT 0, billing_anchor_day INTEGER, deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;
    CREATE TABLE check_ins (
      id INTEGER PRIMARY KEY, member_id INTEGER, card_uid TEXT NOT NULL,
      checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, allowed INTEGER NOT NULL, reason TEXT NOT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id)
    ) STRICT;
    INSERT INTO members (card_uid, first_name, last_name, membership_status, membership_type, valid_until)
    VALUES ('REPAIR01', 'Robin', 'Fix', 'active', 'monthly', '2027-01-01');
    CREATE TABLE subscriptions (
      id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL, event_type TEXT NOT NULL,
      membership_type TEXT NOT NULL, days_added INTEGER NOT NULL DEFAULT 0, passes_added INTEGER NOT NULL DEFAULT 0,
      amount_cents INTEGER, note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members_legacy(id)
    ) STRICT;
    INSERT INTO subscriptions (member_id, event_type, membership_type, days_added, amount_cents)
    VALUES (1, 'signup', 'monthly', 30, 12345);
  `);
  broken.close();

  const database = new GymDatabase(databasePath);
  const schemaSql = database.db.prepare("SELECT sql FROM sqlite_master WHERE name = 'subscriptions'").get().sql;
  assert.ok(!schemaSql.includes('members_legacy'));

  // The pre-existing row survived the repair...
  const existing = database.db.prepare('SELECT amount_cents FROM subscriptions').all();
  assert.equal(existing.length, 1);
  assert.equal(existing[0].amount_cents, 12345);

  // ...and the actual failure mode (an edit that logs a payment/renewal) now works.
  database.updateMember({
    id: 1, cardUid: 'REPAIR01', firstName: 'Robin', lastName: 'Fix',
    membershipStatus: 'active', membershipType: 'monthly', validUntil: '2027-01-01', amountCents: 5000
  });
  assert.equal(database.db.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n, 2);

  database.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('repairs demo cards once and does not reset used passes on relaunch', () => {
  const database = new GymDatabase(':memory:');
  database.db.prepare(`
    INSERT INTO members
      (card_uid, first_name, last_name, membership_status, membership_type, valid_until)
    VALUES ('CUSTOM01', 'Custom', 'Member', 'active', 'monthly', '2099-01-01')
  `).run();
  database.seedDemoMembers();
  assert.equal(database.getMemberByUid('CUSTOM01').first_name, 'Custom');
  assert.equal(database.getMemberByUid('10000001').photo_path, 'demo:alex');
  assert.equal(database.checkIn('10000001').allowed, true);
  assert.equal(database.checkIn('10000002').reason, 'expired');
  const punch = database.checkIn('10000003');
  assert.equal(punch.allowed, true);
  assert.equal(punch.member.passesRemaining, 9);
  assert.equal(database.checkIn('10000004').reason, 'no_passes');

  database.seedDemoMembers();
  assert.equal(database.getMemberByUid('10000003').passes_remaining, 9);
  database.close();
});

test('anchor-preserving renewal: a Jan-31 signup does not permanently drift downward', () => {
  const database = new GymDatabase(':memory:');
  // Staff signs the member up on Jan 31 with a one-month end date they picked in the UI (which
  // itself defaults to "same calendar day next month minus one day" -- Feb 27, since Feb 2026 only
  // has 28 days). The anchor is recorded as day 31 (the actual signup day), not day 27.
  const member = database.addMember({
    cardUid: 'ANCHOR01', firstName: 'Anchor', lastName: 'Member',
    membershipType: 'monthly', validUntil: '2026-02-27'
  }, new Date('2026-01-31T12:00:00'));

  let current = database.renewMember(member.id, 'monthly', {}, new Date('2026-02-01T12:00:00'));
  // Re-anchored to day 31: March has 31 days, so this lands on March 30 -- NOT March 27, which is
  // what the old (buggy) logic would give by re-deriving the target day from Feb 27's own day (27).
  assert.equal(current.validUntil, '2026-03-30');

  current = database.renewMember(member.id, 'monthly', {}, new Date('2026-03-01T12:00:00'));
  // April has only 30 days: day 31 clamps to 30, minus one day.
  assert.equal(current.validUntil, '2026-04-29');

  database.close();
});

test('a long-lapsed monthly renewal re-anchors to today instead of the stale old anchor', () => {
  const database = new GymDatabase(':memory:');
  // Signed up on the 1st years ago; membership expired long, long before "today".
  const member = database.addMember({
    cardUid: 'LAPSED01', firstName: 'Lapsed', lastName: 'Member',
    membershipType: 'monthly', validUntil: '2020-02-29'
  }, new Date('2020-01-01T12:00:00'));
  assert.equal(database.getMemberById(member.id).billing_anchor_day, 1);

  const current = database.renewMember(member.id, 'monthly', {}, new Date('2026-09-03T12:00:00'));
  // A full month from today (Sept 3), not truncated down to "day before the 1st" using the stale
  // anchor -- that bug produced 2026-09-30 (a 27-day period) instead of a real month.
  assert.equal(current.validUntil, '2026-10-02');
  // The restart re-anchors going forward too.
  assert.equal(database.getMemberById(member.id).billing_anchor_day, 3);

  database.close();
});

test('staff PIN: first-time setup, verification, and change all round-trip', () => {
  const database = new GymDatabase(':memory:');
  assert.equal(database.hasStaffPin(), false);
  assert.equal(database.verifyStaffPin('1234'), false);

  database.setStaffPin('1234');
  assert.equal(database.hasStaffPin(), true);
  assert.equal(database.verifyStaffPin('1234'), true);
  assert.equal(database.verifyStaffPin('9999'), false);

  assert.throws(() => database.setStaffPin('4321', 'wrong'), /wrong_pin/);
  assert.throws(() => database.setStaffPin('12'), /invalid_pin/);

  database.setStaffPin('4321', '1234');
  assert.equal(database.verifyStaffPin('1234'), false);
  assert.equal(database.verifyStaffPin('4321'), true);
  database.close();
});

test('checkin retention: defaults to 24 months, validates, and purges only rows older than the cutoff', () => {
  const database = new GymDatabase(':memory:');
  assert.equal(database.getCheckinRetentionDays(), 730);
  assert.throws(() => database.setCheckinRetentionDays(0), /invalid_retention_days/);
  assert.throws(() => database.setCheckinRetentionDays('abc'), /invalid_retention_days/);
  database.setCheckinRetentionDays(30);
  assert.equal(database.getCheckinRetentionDays(), 30);

  const member = database.addMember({
    cardUid: 'RETAIN01', firstName: 'Old', lastName: 'Timer',
    membershipType: 'punchcard', passesRemaining: 10
  });
  // Directly insert check-ins at known ages, bypassing checkIn()'s "now" so the dates are exact.
  const insert = database.db.prepare(
    "INSERT INTO check_ins (member_id, card_uid, checked_in_at, allowed, reason) VALUES (?, ?, ?, 1, 'active')"
  );
  insert.run(member.id, 'RETAIN01', '2026-01-01T10:00:00');   // well past 30 days -- should be purged
  insert.run(member.id, 'RETAIN01', '2026-07-20T10:00:00');   // within 30 days of "now" -- should survive

  const removed = database.purgeOldCheckIns(new Date('2026-08-01T12:00:00'));
  assert.equal(removed, 1);
  const remaining = database.db.prepare('SELECT checked_in_at FROM check_ins WHERE member_id = ?').all(member.id);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].checked_in_at, '2026-07-20T10:00:00');
  database.close();
});

test('exportMemberData returns the member profile plus full check-in and subscription history', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'EXPORT01', firstName: 'Export', lastName: 'Me',
    membershipType: 'monthly', validUntil: '2026-09-27', amountCents: 50000
  }, new Date('2026-08-28T12:00:00'));
  database.checkIn('EXPORT01', new Date('2026-08-28T12:00:00'));

  const data = database.exportMemberData(member.id);
  assert.equal(data.member.cardUid, 'EXPORT01');
  assert.equal(data.checkIns.length, 1);
  assert.equal(data.checkIns[0].allowed, true);
  assert.equal(data.subscriptions.length, 1);
  assert.equal(data.subscriptions[0].amountCents, 50000);
  assert.ok(data.exportedAt);

  assert.throws(() => database.exportMemberData(999999), /member_not_found/);
  database.close();
});

test('dual-screen defaults off and persists once set', () => {
  const database = new GymDatabase(':memory:');
  assert.equal(database.getDualScreenEnabled(), false);
  database.setDualScreenEnabled(true);
  assert.equal(database.getDualScreenEnabled(), true);
  database.setDualScreenEnabled(false);
  assert.equal(database.getDualScreenEnabled(), false);
  database.close();
});

test('language defaults to English, persists once set, and rejects an unsupported code', () => {
  const database = new GymDatabase(':memory:');
  assert.equal(database.getLanguage(), 'en');
  database.setLanguage('cs');
  assert.equal(database.getLanguage(), 'cs');
  database.setLanguage('en');
  assert.equal(database.getLanguage(), 'en');
  assert.throws(() => database.setLanguage('fr'), /invalid_language/);
  database.close();
});

test('kiosk lockdown defaults off and persists once set', () => {
  const database = new GymDatabase(':memory:');
  assert.equal(database.getKioskLockdown(), false);
  database.setKioskLockdown(true);
  assert.equal(database.getKioskLockdown(), true);
  database.setKioskLockdown(false);
  assert.equal(database.getKioskLockdown(), false);
  database.close();
});

test('last update check timestamp defaults to null and persists once set', () => {
  const database = new GymDatabase(':memory:');
  assert.equal(database.getLastUpdateCheckAt(), null);
  const stamp = '2026-08-29T12:00:00.000Z';
  database.setLastUpdateCheckAt(stamp);
  assert.equal(database.getLastUpdateCheckAt(), stamp);
  database.close();
});

test('PIN recovery: a code is minted on first setup, works once, and rotates after use', () => {
  const database = new GymDatabase(':memory:');
  const { recoveryCode } = database.setStaffPin('1234');
  assert.match(recoveryCode, /^[A-Z0-9]{5}-[A-Z0-9]{5}$/);

  // Changing an existing PIN normally does not mint a new code.
  const changed = database.setStaffPin('5678', '1234');
  assert.equal(changed.recoveryCode, null);
  assert.equal(database.verifyRecoveryCode(recoveryCode), true);

  assert.throws(() => database.resetStaffPinWithRecovery('WRONG-CODE1', '9999'), /wrong_recovery_code/);

  const reset = database.resetStaffPinWithRecovery(recoveryCode, '9999');
  assert.equal(database.verifyStaffPin('9999'), true);
  assert.equal(database.verifyStaffPin('5678'), false);
  // The used code is rotated -- it no longer works, only the freshly issued one does.
  assert.equal(database.verifyRecoveryCode(recoveryCode), false);
  assert.equal(database.verifyRecoveryCode(reset.recoveryCode), true);

  assert.throws(() => database.regenerateRecoveryCodeWithPin('wrong'), /wrong_pin/);
  const regenerated = database.regenerateRecoveryCodeWithPin('9999');
  assert.equal(database.verifyRecoveryCode(reset.recoveryCode), false);
  assert.equal(database.verifyRecoveryCode(regenerated), true);
  database.close();
});

test('deleteMember anonymizes identity but keeps check-in and subscription history', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'DELETE01', firstName: 'Erin', lastName: 'Example',
    membershipType: 'punchcard', passesRemaining: 5
  });
  database.checkIn('DELETE01');

  database.deleteMember(member.id);

  assert.equal(database.getMemberByUid('DELETE01'), undefined); // old card no longer resolves
  assert.equal(database.searchMembers('Erin').length, 0); // never resurfaces in search
  assert.equal(database.searchMembers('').find((m) => m.id === member.id), undefined);

  const raw = database.db.prepare('SELECT * FROM members WHERE id = ?').get(member.id);
  assert.equal(raw.first_name, 'Deleted');
  assert.equal(raw.card_uid, `DELETED-${member.id}`);
  assert.ok(raw.deleted_at);

  // History survives, attributed to the now-anonymized row.
  assert.equal(database.recentCheckIns()[0].name, 'Deleted Member');
  assert.equal(database.db.prepare('SELECT COUNT(*) AS n FROM subscriptions WHERE member_id = ?').get(member.id).n, 1);

  assert.throws(() => database.deleteMember(member.id), /member_not_found/);
  database.close();
});

test('a deleted member\'s placeholder card_uid can never be matched by a real scan', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'DELETE02', firstName: 'Sam', lastName: 'Example',
    membershipType: 'punchcard', passesRemaining: 5
  });
  database.deleteMember(member.id);
  // A reader can only ever produce alphanumeric characters (normaliseUid strips the hyphen), so the
  // literal stored value "DELETED-<id>" is unreachable via checkIn.
  assert.equal(database.checkIn(`DELETED${member.id}`).reason, 'unknown_card');
  database.close();
});

test('expiringMembers returns only active monthly members lapsing within the window, soonest first', () => {
  const database = new GymDatabase(':memory:');
  const now = new Date('2026-08-01T12:00:00');
  database.addMember({ cardUid: 'SOON1', firstName: 'A', lastName: 'A', membershipType: 'monthly', validUntil: '2026-08-05' }, now);
  database.addMember({ cardUid: 'SOON2', firstName: 'B', lastName: 'B', membershipType: 'monthly', validUntil: '2026-08-03' }, now);
  database.addMember({ cardUid: 'LATER', firstName: 'C', lastName: 'C', membershipType: 'monthly', validUntil: '2026-09-05' }, now);
  database.addMember({ cardUid: 'PUNCH', firstName: 'D', lastName: 'D', membershipType: 'punchcard', passesRemaining: 5 }, now);
  const frozen = database.addMember({ cardUid: 'FROZEN', firstName: 'E', lastName: 'E', membershipType: 'monthly', validUntil: '2026-08-04' }, now);
  database.updateMember({
    id: frozen.id, firstName: 'E', lastName: 'E', cardUid: 'FROZEN', membershipStatus: 'frozen',
    membershipType: 'monthly', validUntil: '2026-08-04'
  }, now);

  const expiring = database.expiringMembers(7, now);
  assert.deepEqual(expiring.map((m) => m.cardUid), ['SOON2', 'SOON1']);
  database.close();
});

test('payment amounts round-trip through addMember, updateMember, and renewMember', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'PAY0001', firstName: 'Pat', lastName: 'Payer',
    membershipType: 'monthly', validUntil: '2026-09-27', amountCents: 50000
  }, new Date('2026-08-28T12:00:00'));
  assert.equal(
    database.db.prepare('SELECT amount_cents FROM subscriptions WHERE member_id = ?').get(member.id).amount_cents,
    50000
  );

  database.renewMember(member.id, 'monthly', { amountCents: 45000 }, new Date('2026-08-28T12:00:00'));
  const latest = database.db.prepare('SELECT amount_cents FROM subscriptions WHERE member_id = ? ORDER BY id DESC LIMIT 1').get(member.id);
  assert.equal(latest.amount_cents, 45000);

  assert.throws(() => database.addMember({
    cardUid: 'PAY0002', firstName: 'Bad', lastName: 'Amount',
    membershipType: 'monthly', validUntil: '2026-09-27', amountCents: -5
  }), /invalid_amount/);
  database.close();
});

test('updateMember still records a payment amount even when the edit does not itself extend access', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'PAY0003', firstName: 'Sam', lastName: 'Fixer',
    membershipType: 'monthly', validUntil: '2026-09-27'
  }, new Date('2026-08-28T12:00:00'));
  const before = database.db.prepare('SELECT COUNT(*) AS n FROM subscriptions WHERE member_id = ?').get(member.id).n;

  // Only fixing the first name -- same end date, same status/type -- would previously never call
  // logRenewal at all, silently discarding any amount typed into "Amount paid this visit".
  database.updateMember({
    id: member.id, cardUid: 'PAY0003', firstName: 'Samantha', lastName: 'Fixer',
    membershipStatus: 'active', membershipType: 'monthly', validUntil: '2026-09-27',
    amountCents: 20000
  });

  const rows = database.db.prepare('SELECT amount_cents FROM subscriptions WHERE member_id = ? ORDER BY id DESC').all(member.id);
  assert.equal(rows.length, before + 1);
  assert.equal(rows[0].amount_cents, 20000);
  database.close();
});

test('setMemberPhoto updates photo_path and returns the previous value', () => {
  const database = new GymDatabase(':memory:');
  const member = database.addMember({
    cardUid: 'PHOTO01', firstName: 'Photo', lastName: 'Test',
    membershipType: 'punchcard', passesRemaining: 1
  });
  const first = database.setMemberPhoto(member.id, '/userdata/photos/1-123.jpg');
  assert.equal(first.previousPhotoPath, null);
  const second = database.setMemberPhoto(member.id, '/userdata/photos/1-456.jpg');
  assert.equal(second.previousPhotoPath, '/userdata/photos/1-123.jpg');
  assert.equal(database.getMemberById(member.id).photo_path, '/userdata/photos/1-456.jpg');
  database.close();
});
