const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const {
  MEMBERSHIP_TYPES,
  normaliseUid,
  localDateString,
  addDays,
  inclusiveDays,
  isIsoDate,
  membershipEndDate
} = require('./shared/dates');
const { wouldDiscardBalance } = require('./shared/renewal');
const {
  generateSalt,
  hashSecret,
  verifySecret,
  isValidPinFormat,
  generateRecoveryCode,
  normaliseRecoveryCode
} = require('./shared/pin');
const { SUPPORTED_LANGUAGES } = require('./shared/i18n');

// Stable, extraction-path-independent references to the bundled demo photos. Resolved to an actual
// file:// URL by main.js's `photo-url` handler using *that run's* __dirname, so they never go stale
// after a portable/installed re-launch lands in a different directory. See DEMO_PHOTO_TOKENS below.
const DEMO_PHOTO_TOKENS = {
  alex: 'demo:alex',
  sam: 'demo:sam',
  jordan: 'demo:jordan'
};

class GymDatabase {
  constructor(databasePath) {
    this.databasePath = databasePath;
    this.db = new DatabaseSync(databasePath);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      ) STRICT;
    `);

    const hasMembers = Boolean(this.db.prepare(`
      SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'members'
    `).get());

    if (!hasMembers) {
      this.createCoreTables();
    } else {
      const columns = this.db.prepare('PRAGMA table_info(members)').all();
      const names = new Set(columns.map((column) => column.name));
      const validUntil = columns.find((column) => column.name === 'valid_until');
      const needsRebuild = !names.has('membership_type') || !names.has('passes_remaining')
        || !names.has('billing_anchor_day') || !names.has('deleted_at') || validUntil?.notnull === 1;
      if (needsRebuild) {
        this.backupBeforeMigration();
        this.rebuildLegacyTables(names);
      }
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY,
        member_id INTEGER NOT NULL,
        event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'renewal')),
        membership_type TEXT NOT NULL CHECK (membership_type IN ('monthly', 'punchcard')),
        days_added INTEGER NOT NULL DEFAULT 0 CHECK (days_added >= 0),
        passes_added INTEGER NOT NULL DEFAULT 0 CHECK (passes_added >= 0),
        amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents >= 0),
        note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_check_ins_time ON check_ins(checked_in_at DESC);
      CREATE INDEX IF NOT EXISTS idx_check_ins_member ON check_ins(member_id, checked_in_at DESC);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_member ON subscriptions(member_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_members_name ON members(last_name, first_name);
    `);

    this.repairDanglingForeignKeys();
  }

  // One-time repair for a bug in an earlier version of rebuildLegacyTables (see the comment there):
  // a members-table rebuild could silently rewrite subscriptions' foreign key to point at the
  // temporary "members_legacy" name instead of leaving it on "members", leaving it permanently
  // dangling once that temporary table was dropped -- every subsequent INSERT into subscriptions
  // (i.e. every renewal/payment) then failed with "no such table: main.members_legacy". Detects the
  // stale reference directly from the stored schema text and rebuilds just that one table, copying
  // its data across -- the exact same rename/recreate/copy shape rebuildLegacyTables already uses.
  repairDanglingForeignKeys() {
    const subscriptionsSql = this.db.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'subscriptions'
    `).get()?.sql;
    if (!subscriptionsSql || !subscriptionsSql.includes('members_legacy')) return;

    console.error('Repairing subscriptions: its foreign key was left pointing at a dropped table.');
    this.backupBeforeMigration();
    this.db.exec('PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE;');
    try {
      this.db.exec('ALTER TABLE subscriptions RENAME TO subscriptions_broken;');
      this.db.exec(`
        CREATE TABLE subscriptions (
          id INTEGER PRIMARY KEY,
          member_id INTEGER NOT NULL,
          event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'renewal')),
          membership_type TEXT NOT NULL CHECK (membership_type IN ('monthly', 'punchcard')),
          days_added INTEGER NOT NULL DEFAULT 0 CHECK (days_added >= 0),
          passes_added INTEGER NOT NULL DEFAULT 0 CHECK (passes_added >= 0),
          amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents >= 0),
          note TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members(id)
        ) STRICT;
        INSERT INTO subscriptions
          (id, member_id, event_type, membership_type, days_added, passes_added, amount_cents, note, created_at)
        SELECT id, member_id, event_type, membership_type, days_added, passes_added, amount_cents, note, created_at
        FROM subscriptions_broken;
        DROP TABLE subscriptions_broken;
        COMMIT;
      `);
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    } finally {
      this.db.exec('PRAGMA foreign_keys = ON;');
    }
  }

  // Copies the live database file aside before an in-place schema rebuild. Best-effort: skipped for
  // in-memory databases (tests, smoke-capture mode) and for a database file that doesn't exist yet
  // (brand-new install, nothing to protect). A failure here is not fatal to migration -- we still log
  // it so it's visible, but the app should keep starting; the rebuild itself remains atomic via its
  // own transaction regardless of whether a backup could be made.
  backupBeforeMigration() {
    if (!this.databasePath || this.databasePath === ':memory:') return null;
    if (!fs.existsSync(this.databasePath)) return null;
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const directory = path.dirname(this.databasePath);
      const base = path.basename(this.databasePath, path.extname(this.databasePath));
      const backupPath = path.join(directory, `${base}.pre-migration-${stamp}.sqlite`);
      fs.copyFileSync(this.databasePath, backupPath);
      return backupPath;
    } catch (error) {
      console.error('Could not create a pre-migration backup:', error);
      return null;
    }
  }

  createCoreTables() {
    this.db.exec(`
      CREATE TABLE members (
        id INTEGER PRIMARY KEY,
        card_uid TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        photo_path TEXT,
        membership_status TEXT NOT NULL DEFAULT 'active'
          CHECK (membership_status IN ('active', 'frozen', 'cancelled')),
        membership_type TEXT NOT NULL DEFAULT 'monthly'
          CHECK (membership_type IN ('monthly', 'punchcard')),
        valid_until TEXT,
        passes_remaining INTEGER NOT NULL DEFAULT 0 CHECK (passes_remaining >= 0),
        billing_anchor_day INTEGER CHECK (billing_anchor_day IS NULL OR (billing_anchor_day BETWEEN 1 AND 31)),
        deleted_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) STRICT;

      CREATE TABLE check_ins (
        id INTEGER PRIMARY KEY,
        member_id INTEGER,
        card_uid TEXT NOT NULL,
        checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        allowed INTEGER NOT NULL CHECK (allowed IN (0, 1)),
        reason TEXT NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id)
      ) STRICT;
    `);
  }

  rebuildLegacyTables(existingColumns) {
    const hasCheckIns = Boolean(this.db.prepare(`
      SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'check_ins'
    `).get());
    const membershipExpression = existingColumns.has('membership_type') ? 'membership_type' : "'monthly'";
    const passesExpression = existingColumns.has('passes_remaining') ? 'passes_remaining' : '0';
    const anchorExpression = existingColumns.has('billing_anchor_day')
      ? 'billing_anchor_day'
      : `CASE WHEN ${membershipExpression} = 'monthly' AND valid_until IS NOT NULL
              THEN CAST(strftime('%d', valid_until) AS INTEGER) ELSE NULL END`;
    const deletedAtExpression = existingColumns.has('deleted_at') ? 'deleted_at' : 'NULL';

    // legacy_alter_table=ON is the load-bearing part here, not foreign_keys=OFF: SQLite's ALTER TABLE
    // RENAME auto-rewrites *other* tables' stored FOREIGN KEY clauses to follow the renamed table by
    // name, regardless of whether foreign_keys enforcement is on or off -- legacy_alter_table is the
    // pragma that actually disables that rewrite. Without it, any table created before this point
    // that references members (e.g. subscriptions) ends up with its FK silently rewritten to
    // "members_legacy", which then dangles forever once that table is dropped a few lines down --
    // this exact bug shipped once already (see repairDanglingForeignKeys below for the one-time fix).
    this.db.exec('PRAGMA foreign_keys = OFF; PRAGMA legacy_alter_table = ON; BEGIN IMMEDIATE;');
    try {
      this.db.exec('ALTER TABLE members RENAME TO members_legacy;');
      if (hasCheckIns) this.db.exec('ALTER TABLE check_ins RENAME TO check_ins_legacy;');
      this.createCoreTables();
      this.db.exec(`
        INSERT INTO members (
          id, card_uid, first_name, last_name, photo_path, membership_status,
          membership_type, valid_until, passes_remaining, billing_anchor_day, deleted_at, created_at, updated_at
        )
        SELECT id, card_uid, first_name, last_name, photo_path, membership_status,
               ${membershipExpression}, valid_until, ${passesExpression}, ${anchorExpression}, ${deletedAtExpression}, created_at, updated_at
        FROM members_legacy;
      `);
      if (hasCheckIns) {
        this.db.exec(`
          INSERT INTO check_ins (id, member_id, card_uid, checked_in_at, allowed, reason)
          SELECT id, member_id, card_uid, checked_in_at, allowed, reason FROM check_ins_legacy;
          DROP TABLE check_ins_legacy;
        `);
      }
      this.db.exec('DROP TABLE members_legacy; COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    } finally {
      this.db.exec('PRAGMA foreign_keys = ON; PRAGMA legacy_alter_table = OFF;');
    }
  }

  seedDemoMembers() {
    const seedVersion = this.db.prepare("SELECT value FROM app_meta WHERE key = 'demo_seed_version'").get()?.value;
    if (Number(seedVersion || 0) >= 2) return;

    const demos = [
      ['10000001', 'Alex', 'Morgan', DEMO_PHOTO_TOKENS.alex, 'monthly', '2099-12-31', 0],
      ['10000002', 'Sam', 'Rivera', DEMO_PHOTO_TOKENS.sam, 'monthly', '2020-01-01', 0],
      ['10000003', 'Jordan', 'Lee', DEMO_PHOTO_TOKENS.jordan, 'punchcard', null, 10],
      ['10000004', 'Casey', 'Demo', null, 'punchcard', null, 0]
    ];

    this.transaction(() => {
      const upsert = this.db.prepare(`
        INSERT INTO members (
          card_uid, first_name, last_name, photo_path, membership_status,
          membership_type, valid_until, passes_remaining, billing_anchor_day
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
        ON CONFLICT(card_uid) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          photo_path = excluded.photo_path,
          membership_status = 'active',
          membership_type = excluded.membership_type,
          valid_until = excluded.valid_until,
          passes_remaining = excluded.passes_remaining,
          billing_anchor_day = excluded.billing_anchor_day,
          updated_at = CURRENT_TIMESTAMP
      `);
      const log = this.db.prepare(`
        INSERT INTO subscriptions
          (member_id, event_type, membership_type, days_added, passes_added, note)
        VALUES (?, 'signup', ?, ?, ?, 'Demo data upgrade')
      `);

      for (const demo of demos) {
        const anchorDay = demo[4] === 'monthly' ? Number(demo[5].split('-')[2]) : null;
        upsert.run(...demo, anchorDay);
        const member = this.db.prepare('SELECT id FROM members WHERE card_uid = ?').get(demo[0]);
        log.run(member.id, demo[4], demo[4] === 'monthly' ? 30 : 0, demo[4] === 'punchcard' ? demo[6] : 0);
      }
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('demo_seed_version', '2')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run();
    });
  }

  // --- Staff PIN -----------------------------------------------------------------------------

  getStaffPinRecord() {
    const salt = this.db.prepare("SELECT value FROM app_meta WHERE key = 'staff_pin_salt'").get()?.value;
    const hash = this.db.prepare("SELECT value FROM app_meta WHERE key = 'staff_pin_hash'").get()?.value;
    return salt && hash ? { salt, hash } : null;
  }

  hasStaffPin() {
    return this.getStaffPinRecord() !== null;
  }

  // First-time setup (no existing PIN) needs no currentPin and mints a fresh recovery code, shown
  // once to whoever is setting up. Once a PIN exists, changing it requires the correct current one
  // and does NOT touch the recovery code (see regenerateRecoveryCodeWithPin for that).
  setStaffPin(newPin, currentPin = null) {
    if (!isValidPinFormat(newPin)) throw new Error('invalid_pin');
    const existing = this.getStaffPinRecord();
    const isFirstTimeSetup = !existing;
    if (existing && !verifySecret(currentPin, existing.salt, existing.hash)) throw new Error('wrong_pin');

    const salt = generateSalt();
    const hash = hashSecret(newPin, salt);
    let recoveryCode = null;
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('staff_pin_salt', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(salt);
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('staff_pin_hash', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(hash);
      if (isFirstTimeSetup) recoveryCode = this.regenerateRecoveryCode();
    });
    return { recoveryCode };
  }

  verifyStaffPin(pin) {
    const existing = this.getStaffPinRecord();
    if (!existing) return false;
    return verifySecret(pin, existing.salt, existing.hash);
  }

  // --- PIN recovery ------------------------------------------------------------------------------
  // A recovery code is the only way back in if the shared staff PIN is forgotten. It's generated and
  // shown in plaintext exactly once (at first-time PIN setup, right after a successful recovery, or
  // via an explicit "regenerate" action) -- only its hash is ever stored, same as the PIN itself.

  regenerateRecoveryCode() {
    const code = generateRecoveryCode();
    const salt = generateSalt();
    const hash = hashSecret(normaliseRecoveryCode(code), salt);
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('recovery_code_salt', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(salt);
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('recovery_code_hash', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(hash);
    return code;
  }

  // Explicit regeneration from Settings requires the current PIN -- reachable only once the staff
  // area is already unlocked, but re-confirmed since it invalidates the old code.
  regenerateRecoveryCodeWithPin(currentPin) {
    const existing = this.getStaffPinRecord();
    if (!existing || !verifySecret(currentPin, existing.salt, existing.hash)) throw new Error('wrong_pin');
    return this.regenerateRecoveryCode();
  }

  verifyRecoveryCode(code) {
    const salt = this.db.prepare("SELECT value FROM app_meta WHERE key = 'recovery_code_salt'").get()?.value;
    const hash = this.db.prepare("SELECT value FROM app_meta WHERE key = 'recovery_code_hash'").get()?.value;
    if (!salt || !hash) return false;
    return verifySecret(normaliseRecoveryCode(code), salt, hash);
  }

  // Resets the PIN using the recovery code instead of the current PIN, then rotates the recovery
  // code (the used one might have been seen by more than just the account owner) and returns the new
  // one to show once.
  resetStaffPinWithRecovery(recoveryCode, newPin) {
    if (!isValidPinFormat(newPin)) throw new Error('invalid_pin');
    if (!this.verifyRecoveryCode(recoveryCode)) throw new Error('wrong_recovery_code');

    const salt = generateSalt();
    const hash = hashSecret(newPin, salt);
    let newRecoveryCode = null;
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('staff_pin_salt', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(salt);
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('staff_pin_hash', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(hash);
      newRecoveryCode = this.regenerateRecoveryCode();
    });
    return { recoveryCode: newRecoveryCode };
  }

  // --- Kiosk lockdown --------------------------------------------------------------------------
  // A soft deterrent (fullscreen kiosk window, blocks Alt+F4/the close button) toggled from
  // Settings -- NOT a real OS-level lockdown. The Windows key, Ctrl+Alt+Del, and Task Manager are
  // outside any application's control; a genuine unbreakable kiosk needs Windows "Assigned Access"
  // or an equivalent shell replacement, configured on the machine itself.

  getKioskLockdown() {
    return this.db.prepare("SELECT value FROM app_meta WHERE key = 'kiosk_lockdown'").get()?.value === '1';
  }

  setKioskLockdown(enabled) {
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('kiosk_lockdown', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(enabled ? '1' : '0');
  }

  // --- Dual-screen ------------------------------------------------------------------------------
  // Whether to split into a kiosk window (customer-facing) and a staff window (admin, un-modal'd)
  // on separate monitors when two displays are detected. Defaults OFF: the day-to-day setup is one
  // staff-facing window plus the check-in notification/beep (see main.js's notifyCheckIn), not a
  // dedicated customer-facing display -- this stays available in Settings for a gym that does want
  // that display. With only one display connected, main.js always uses single-window mode regardless
  // of this setting either way.

  getDualScreenEnabled() {
    const value = this.db.prepare("SELECT value FROM app_meta WHERE key = 'dual_screen_enabled'").get()?.value;
    return value === undefined ? false : value === '1';
  }

  setDualScreenEnabled(enabled) {
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('dual_screen_enabled', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(enabled ? '1' : '0');
  }

  // --- Language ----------------------------------------------------------------------------------
  // The UI language, not a per-window display preference like the theme (which lives in localStorage
  // instead) -- the main process needs it too, for the OS check-in notification and native dialog
  // titles, so it has to be readable from here rather than only from the renderer's own storage.

  getLanguage() {
    const value = this.db.prepare("SELECT value FROM app_meta WHERE key = 'language'").get()?.value;
    return SUPPORTED_LANGUAGES.includes(value) ? value : 'en';
  }

  setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.includes(language)) throw new Error('invalid_language');
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('language', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(language);
  }

  // --- Gym branding --------------------------------------------------------------------------------
  // A gym's own name and logo, shown in place of the generic "GYM CHECK-IN" mark on the check-in
  // screen, the staff header, and the PIN lock screen. Both optional and unset by default, in which
  // case every one of those places falls back to the built-in look exactly as before -- this is
  // purely cosmetic, never required for the app to function.

  getGymBranding() {
    const name = this.db.prepare("SELECT value FROM app_meta WHERE key = 'gym_name'").get()?.value || null;
    const logoPath = this.db.prepare("SELECT value FROM app_meta WHERE key = 'gym_logo_path'").get()?.value || null;
    return { name, logoPath };
  }

  // An empty/blank name clears it back to the default rather than storing an empty string forever.
  setGymName(name) {
    const trimmed = String(name ?? '').trim().slice(0, 60);
    if (trimmed) {
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('gym_name', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(trimmed);
    } else {
      this.db.prepare("DELETE FROM app_meta WHERE key = 'gym_name'").run();
    }
    return trimmed;
  }

  // Returns the previous path (if any) so main.js can delete that now-orphaned file, same pattern as
  // setMemberPhoto below.
  setGymLogoPath(logoPath) {
    const previousLogoPath = this.getGymBranding().logoPath;
    if (logoPath) {
      this.db.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('gym_logo_path', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(logoPath);
    } else {
      this.db.prepare("DELETE FROM app_meta WHERE key = 'gym_logo_path'").run();
    }
    return { previousLogoPath };
  }

  // --- Updates -----------------------------------------------------------------------------------
  // Throttles the automatic background check (see checkForUpdatesAutomatically in main.js) to at
  // most once a day, regardless of how often the app is launched -- a kiosk rebooted several times a
  // day shouldn't hammer GitHub on every single launch. The manual "Check for updates" button always
  // works regardless of this timestamp.

  getLastUpdateCheckAt() {
    return this.db.prepare("SELECT value FROM app_meta WHERE key = 'last_update_check_at'").get()?.value ?? null;
  }

  setLastUpdateCheckAt(isoTimestamp) {
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('last_update_check_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(isoTimestamp));
  }

  // --- Data retention (GDPR storage-limitation) -------------------------------------------------
  // Member erasure itself is handled by deleteMember() above; this is the other GDPR-relevant
  // piece -- check_ins accumulate forever otherwise. Defaults to a generous 24 months so nothing is
  // silently lost for a gym that hasn't thought about this yet; the actual right retention period
  // for a given business is a policy decision, not something this app should assume.

  getCheckinRetentionDays() {
    const value = this.db.prepare("SELECT value FROM app_meta WHERE key = 'checkin_retention_days'").get()?.value;
    return value === undefined ? 730 : Number(value);
  }

  setCheckinRetentionDays(days) {
    const value = Number(days);
    if (!Number.isInteger(value) || value < 1) throw new Error('invalid_retention_days');
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('checkin_retention_days', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(value));
  }

  // --- Punch-card re-entry cooldown -----------------------------------------------------------
  // Only matters for punch cards, not monthly passes: a monthly member tapping in twice in one day
  // costs nothing (unlimited access within their paid period either way), but a punch card charges
  // one pass per scan -- so an accidental second tap (leaving and immediately walking back in,
  // someone bumping the reader, a member forgetting they already tapped) would silently burn a
  // second pass for what was really one visit. Defaults to 3 hours: long enough to absorb an
  // accidental re-tap, short enough to still credit a genuine two-a-day gym-goer (morning + evening)
  // as the two separate visits they actually are, which a longer window (6+ hours) would wrongly
  // collapse into one.

  getPunchcardCooldownHours() {
    const value = this.db.prepare("SELECT value FROM app_meta WHERE key = 'punchcard_cooldown_hours'").get()?.value;
    return value === undefined ? 3 : Number(value);
  }

  setPunchcardCooldownHours(hours) {
    const value = Number(hours);
    if (!Number.isInteger(value) || value < 0) throw new Error('invalid_cooldown_hours');
    this.db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('punchcard_cooldown_hours', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(value));
  }

  // Deletes check_ins older than the configured retention window. Returns the number of rows
  // removed. Safe to call on every launch -- a no-op when nothing has aged out yet.
  purgeOldCheckIns(now = new Date()) {
    const cutoff = addDays(localDateString(now), -this.getCheckinRetentionDays());
    const result = this.db.prepare('DELETE FROM check_ins WHERE date(checked_in_at) < date(?)').run(cutoff);
    return result.changes;
  }

  // Everything held about one member, for responding to a GDPR access/portability request. Includes
  // full check-in and subscription history, not just the current member row.
  exportMemberData(memberId) {
    const id = Number(memberId);
    if (!Number.isInteger(id) || id < 1) throw new Error('invalid_member');
    const member = this.getMemberById(id);
    if (!member) throw new Error('member_not_found');
    const checkIns = this.db.prepare(`
      SELECT checked_in_at AS checkedInAt, allowed, reason
      FROM check_ins WHERE member_id = ? ORDER BY id ASC
    `).all(id).map((row) => ({ ...row, allowed: Boolean(row.allowed) }));
    const subscriptions = this.db.prepare(`
      SELECT event_type AS eventType, membership_type AS membershipType, days_added AS daysAdded,
             passes_added AS passesAdded, amount_cents AS amountCents, note, created_at AS createdAt
      FROM subscriptions WHERE member_id = ? ORDER BY id ASC
    `).all(id);
    return { member: this.formatMember(member), checkIns, subscriptions, exportedAt: new Date().toISOString() };
  }

  // --- Check-in --------------------------------------------------------------------------------

  checkIn(rawUid, now = new Date()) {
    const uid = normaliseUid(rawUid);
    if (!uid) return { allowed: false, reason: 'invalid_uid', uid };

    return this.transaction(() => {
      const member = this.getMemberByUid(uid);
      if (!member) {
        this.recordCheckIn(null, uid, false, 'unknown_card', now);
        return { allowed: false, reason: 'unknown_card', uid };
      }

      const today = localDateString(now);
      let allowed = true;
      let reason = member.membership_type === 'punchcard' ? 'punchcard' : 'active';

      if (member.membership_status === 'frozen') {
        allowed = false;
        reason = 'frozen';
      } else if (member.membership_status === 'cancelled') {
        allowed = false;
        reason = 'cancelled';
      } else if (member.membership_type === 'monthly' && (!member.valid_until || member.valid_until < today)) {
        allowed = false;
        reason = 'expired';
      } else if (member.membership_type === 'punchcard' && member.passes_remaining <= 0) {
        allowed = false;
        reason = 'no_passes';
      }

      if (allowed && member.membership_type === 'punchcard') {
        const cooldownHours = this.getPunchcardCooldownHours();
        // Only a genuine PRIOR successful punch-card entry re-arms this -- a member who was denied
        // (frozen, cancelled, no passes) last time around gets evaluated fresh, not silently let in
        // just because they tapped again recently. SQLite's own CURRENT_TIMESTAMP default (what
        // recordCheckIn's checked_in_at actually holds) is UTC 'YYYY-MM-DD HH:MM:SS'; matching that
        // format exactly here keeps this a plain string comparison, not a timezone-sensitive parse.
        const cooldownActive = cooldownHours > 0 && this.db.prepare(`
          SELECT 1 FROM check_ins
          WHERE member_id = ? AND allowed = 1 AND reason IN ('punchcard', 'punchcard_recent') AND checked_in_at > ?
          LIMIT 1
        `).get(member.id, new Date(now.getTime() - cooldownHours * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '));

        if (cooldownActive) {
          reason = 'punchcard_recent'; // let back in, but no pass charged for what's the same visit
        } else {
          const update = this.db.prepare(`
            UPDATE members SET passes_remaining = passes_remaining - 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND passes_remaining > 0
          `).run(member.id);
          if (update.changes !== 1) {
            allowed = false;
            reason = 'no_passes';
          } else {
            member.passes_remaining -= 1;
          }
        }
      }

      this.recordCheckIn(member.id, uid, allowed, reason, now);
      return this.formatCheckInResult(member, uid, allowed, reason);
    });
  }

  addMember(input, now = new Date()) {
    const uid = normaliseUid(input?.cardUid);
    const firstName = String(input?.firstName ?? '').trim();
    const lastName = String(input?.lastName ?? '').trim();
    const membershipType = String(input?.membershipType ?? '');
    const validUntil = input?.validUntil ? String(input.validUntil) : null;
    const passesRemaining = Number(input?.passesRemaining ?? 0);
    const amountCents = input?.amountCents != null ? Number(input.amountCents) : null;

    if (uid.length < 4) throw new Error('invalid_uid');
    if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80) throw new Error('invalid_name');
    if (!MEMBERSHIP_TYPES.has(membershipType)) throw new Error('invalid_membership_type');
    if (membershipType === 'monthly' && (!validUntil || !isIsoDate(validUntil))) throw new Error('invalid_date');
    if (membershipType === 'punchcard' && (!Number.isInteger(passesRemaining) || passesRemaining < 1)) throw new Error('invalid_passes');
    if (amountCents !== null && (!Number.isInteger(amountCents) || amountCents < 0)) throw new Error('invalid_amount');

    return this.transaction(() => {
      if (this.getMemberByUid(uid)) throw new Error('card_exists');
      const today = localDateString(now);
      // Anchor = day-of-month this period actually starts (today), not the staff-chosen end date --
      // this matches the spec's own "same calendar day next month" example (a member who starts on
      // the 28th anchors to 28, even though their first period visibly ends on the 27th).
      const anchorDay = membershipType === 'monthly' ? Number(today.split('-')[2]) : null;
      const result = this.db.prepare(`
        INSERT INTO members (
          card_uid, first_name, last_name, membership_status, membership_type,
          valid_until, passes_remaining, billing_anchor_day
        ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
      `).run(
        uid, firstName, lastName, membershipType,
        membershipType === 'monthly' ? validUntil : null,
        membershipType === 'punchcard' ? passesRemaining : 0,
        anchorDay
      );

      const daysAdded = membershipType === 'monthly' ? inclusiveDays(today, validUntil) : 0;
      this.db.prepare(`
        INSERT INTO subscriptions
          (member_id, event_type, membership_type, days_added, passes_added, amount_cents)
        VALUES (?, 'signup', ?, ?, ?, ?)
      `).run(result.lastInsertRowid, membershipType, daysAdded, membershipType === 'punchcard' ? passesRemaining : 0, amountCents);

      return this.formatMember(this.getMemberById(Number(result.lastInsertRowid)));
    });
  }

  updateMember(input, now = new Date()) {
    const id = Number(input?.id);
    const uid = normaliseUid(input?.cardUid);
    const firstName = String(input?.firstName ?? '').trim();
    const lastName = String(input?.lastName ?? '').trim();
    const membershipStatus = String(input?.membershipStatus ?? '');
    const membershipType = String(input?.membershipType ?? '');
    const validUntil = input?.validUntil ? String(input.validUntil) : null;
    const passesRemaining = Number(input?.passesRemaining ?? 0);
    const amountCents = input?.amountCents != null ? Number(input.amountCents) : null;

    if (!Number.isInteger(id) || id < 1) throw new Error('invalid_member');
    if (uid.length < 4) throw new Error('invalid_uid');
    if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80) throw new Error('invalid_name');
    if (!['active', 'frozen', 'cancelled'].includes(membershipStatus)) throw new Error('invalid_status');
    if (!MEMBERSHIP_TYPES.has(membershipType)) throw new Error('invalid_membership_type');
    if (membershipType === 'monthly' && (!validUntil || !isIsoDate(validUntil))) throw new Error('invalid_date');
    if (membershipType === 'punchcard' && (!Number.isInteger(passesRemaining) || passesRemaining < 0)) throw new Error('invalid_passes');
    if (amountCents !== null && (!Number.isInteger(amountCents) || amountCents < 0)) throw new Error('invalid_amount');

    return this.transaction(() => {
      const existing = this.getMemberById(id);
      if (!existing) throw new Error('member_not_found');
      const uidOwner = this.getMemberByUid(uid);
      if (uidOwner && uidOwner.id !== id) throw new Error('card_exists');

      const today = localDateString(now);
      const discard = wouldDiscardBalance(this.formatMember(existing), membershipType, today);
      const note = discard.discardsPasses
        ? `Converted from punchcard via edit (${discard.passesLost} ${discard.passesLost === 1 ? 'pass' : 'passes'} forfeited)`
        : discard.discardsDays
          ? `Converted from monthly via edit (${discard.daysLost} ${discard.daysLost === 1 ? 'day' : 'days'} forfeited)`
          : null;

      // A human just explicitly chose this end date, so it redefines the billing anchor -- unlike
      // the system's own "+1 month" computation, which preserves whatever anchor is already on file.
      // The anchor is the day-of-month this period *starts* (mirroring addMember/renewMember), not
      // the day-of-month staff happened to type as the end date.
      const previousEnd = existing.membership_type === 'monthly' ? existing.valid_until : null;
      const periodStart = previousEnd && previousEnd >= today ? addDays(previousEnd, 1) : today;
      const anchorDay = membershipType === 'monthly' ? Number(periodStart.split('-')[2]) : null;

      this.db.prepare(`
        UPDATE members SET card_uid = ?, first_name = ?, last_name = ?,
          membership_status = ?, membership_type = ?, valid_until = ?,
          passes_remaining = ?, billing_anchor_day = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        uid, firstName, lastName, membershipStatus, membershipType,
        membershipType === 'monthly' ? validUntil : null,
        membershipType === 'punchcard' ? passesRemaining : 0,
        anchorDay,
        id
      );

      let daysAdded = 0;
      let passesAdded = 0;
      if (membershipType === 'monthly' && (!previousEnd || validUntil > previousEnd)) {
        daysAdded = inclusiveDays(periodStart, validUntil);
      } else if (membershipType === 'punchcard') {
        const previousPasses = existing.membership_type === 'punchcard' ? existing.passes_remaining : 0;
        passesAdded = Math.max(0, passesRemaining - previousPasses);
      }
      // Log whenever the edit actually changed access (days/passes added, or a plan-conversion note)
      // OR whenever staff explicitly recorded a payment for this visit -- otherwise an amount typed
      // into an edit that doesn't also extend access (e.g. just fixing a name or correcting a card
      // UID) would be silently discarded instead of recorded.
      if (daysAdded > 0 || passesAdded > 0 || note || amountCents !== null) {
        this.logRenewal(id, membershipType, daysAdded, passesAdded, note, amountCents);
      }

      return this.formatMember(this.getMemberById(id));
    });
  }

  searchMembers(rawQuery, limit = 500) {
    const query = String(rawQuery ?? '').trim();
    if (!query) {
      return this.db.prepare(`
        SELECT id, card_uid, first_name, last_name, photo_path, membership_status,
               membership_type, valid_until, passes_remaining, billing_anchor_day
        FROM members WHERE deleted_at IS NULL ORDER BY last_name, first_name LIMIT ?
      `).all(limit).map((member) => this.formatMember(member));
    }
    const uidQuery = normaliseUid(query);
    return this.db.prepare(`
      SELECT id, card_uid, first_name, last_name, photo_path, membership_status,
             membership_type, valid_until, passes_remaining, billing_anchor_day
      FROM members
      WHERE deleted_at IS NULL AND (lower(first_name || ' ' || last_name) LIKE ? OR card_uid LIKE ?)
      ORDER BY last_name, first_name LIMIT ?
    `).all(`%${query.toLowerCase()}%`, `%${uidQuery}%`, limit).map((member) => this.formatMember(member));
  }

  // Active monthly members whose access lapses within the next `withinDays` days -- lets reception
  // proactively chase renewals instead of only reacting once someone's card is declined.
  expiringMembers(withinDays = 7, now = new Date()) {
    const today = localDateString(now);
    const cutoff = addDays(today, withinDays);
    return this.db.prepare(`
      SELECT id, card_uid, first_name, last_name, photo_path, membership_status,
             membership_type, valid_until, passes_remaining, billing_anchor_day
      FROM members
      WHERE deleted_at IS NULL AND membership_status = 'active' AND membership_type = 'monthly'
        AND valid_until IS NOT NULL AND valid_until >= ? AND valid_until <= ?
      ORDER BY valid_until ASC
    `).all(today, cutoff).map((member) => this.formatMember(member));
  }

  // Anonymizes a member's identity (name, photo, card UID) rather than removing the row, so their
  // check-in/subscription history stays intact for attendance and revenue accuracy. The placeholder
  // card_uid can never collide with a live scan: UID normalisation strips the hyphen from anything a
  // reader can actually send, so "DELETED-<id>" is permanently unmatchable while still satisfying the
  // UNIQUE constraint (id is unique). Returns the member's previous photoPath so the caller (which
  // owns the filesystem/Electron context, not this module) can delete the actual photo file.
  deleteMember(memberId) {
    const id = Number(memberId);
    if (!Number.isInteger(id) || id < 1) throw new Error('invalid_member');
    return this.transaction(() => {
      const existing = this.db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      if (!existing || existing.deleted_at) throw new Error('member_not_found');
      this.db.prepare(`
        UPDATE members SET first_name = 'Deleted', last_name = 'Member', card_uid = 'DELETED-' || id,
          photo_path = NULL, membership_status = 'cancelled', passes_remaining = 0,
          valid_until = NULL, billing_anchor_day = NULL, deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      return { photoPath: existing.photo_path };
    });
  }

  renewMember(memberId, renewalType, options = {}, now = new Date()) {
    if (options instanceof Date) {
      now = options;
      options = {};
    }
    const id = Number(memberId);
    if (!Number.isInteger(id) || id < 1) throw new Error('invalid_member');
    if (!MEMBERSHIP_TYPES.has(renewalType)) throw new Error('invalid_membership_type');
    const amountCents = options?.amountCents != null ? Number(options.amountCents) : null;
    if (amountCents !== null && (!Number.isInteger(amountCents) || amountCents < 0)) throw new Error('invalid_amount');

    return this.transaction(() => {
      const member = this.getMemberById(id);
      if (!member) throw new Error('member_not_found');

      const today = localDateString(now);
      const discard = wouldDiscardBalance(this.formatMember(member), renewalType, today);
      const note = discard.discardsPasses
        ? `Converted from punchcard (${discard.passesLost} ${discard.passesLost === 1 ? 'pass' : 'passes'} forfeited)`
        : discard.discardsDays
          ? `Converted from monthly (${discard.daysLost} ${discard.daysLost === 1 ? 'day' : 'days'} forfeited)`
          : null;

      if (renewalType === 'monthly') {
        // A renewal is only "contiguous" with the member's existing cycle if their previous period
        // hadn't already lapsed -- that's the same condition that decides whether the new period
        // starts the day after the old one ends, or fresh from today.
        const isContiguousRenewal = member.membership_type === 'monthly' && member.valid_until && member.valid_until >= today;
        const startDate = isContiguousRenewal ? addDays(member.valid_until, 1) : today;
        const customEndDate = options?.validUntil ? String(options.validUntil) : null;
        if (customEndDate && (!isIsoDate(customEndDate) || customEndDate < startDate)) throw new Error('invalid_date');

        // Anchor rule: the anchor is the day-of-month this period *starts* (startDate), not the day
        // staff typed as a custom end date. The system's own "+1 month" computation (no custom date)
        // preserves whatever anchor is already on file instead of re-deriving it from startDate --
        // that's what stops a clamped short month from permanently dragging later months down with
        // it. But that only makes sense for a genuinely contiguous renewal: if the old period already
        // lapsed (member.valid_until < today), this is really a fresh restart from today, so the
        // anchor must be re-derived from startDate too -- otherwise a member who signed up years ago
        // on, say, the 1st, and renews today after months away, gets a period truncated down to
        // whatever's left before the 1st instead of a full month from today. A staff-chosen custom
        // date always re-anchors to this period's actual start either way, since it's a deliberate
        // override of the automatic cycle.
        const existingAnchor = isContiguousRenewal ? member.billing_anchor_day : null;
        const anchorDay = (!customEndDate && existingAnchor) ? existingAnchor : Number(startDate.split('-')[2]);
        const validUntil = customEndDate || membershipEndDate(startDate, 1, anchorDay);
        const daysAdded = inclusiveDays(startDate, validUntil);

        this.db.prepare(`
          UPDATE members SET membership_type = 'monthly', membership_status = 'active',
            valid_until = ?, passes_remaining = 0, billing_anchor_day = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(validUntil, anchorDay, id);
        this.logRenewal(id, 'monthly', daysAdded, 0, note, amountCents);
      } else {
        const startingPasses = member.membership_type === 'punchcard' ? member.passes_remaining : 0;
        this.db.prepare(`
          UPDATE members SET membership_type = 'punchcard', membership_status = 'active',
            valid_until = NULL, passes_remaining = ?, billing_anchor_day = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(startingPasses + 10, id);
        this.logRenewal(id, 'punchcard', 0, 10, note, amountCents);
      }
      return this.formatMember(this.getMemberById(id));
    });
  }

  logRenewal(memberId, membershipType, daysAdded, passesAdded, note = null, amountCents = null) {
    this.db.prepare(`
      INSERT INTO subscriptions (member_id, event_type, membership_type, days_added, passes_added, note, amount_cents)
      VALUES (?, 'renewal', ?, ?, ?, ?, ?)
    `).run(memberId, membershipType, daysAdded, passesAdded, note, amountCents);
  }

  // photoPath is either an absolute path under the app's userData/photos directory (set by
  // main.js's set-member-photo handler, which owns the actual file copy) or null to clear it.
  // Returns the member's *previous* photo path so the caller can delete that file if it's a real
  // uploaded photo (not a demo: token).
  setMemberPhoto(memberId, photoPath) {
    const id = Number(memberId);
    if (!Number.isInteger(id) || id < 1) throw new Error('invalid_member');
    return this.transaction(() => {
      const existing = this.db.prepare('SELECT photo_path FROM members WHERE id = ?').get(id);
      if (!existing) throw new Error('member_not_found');
      this.db.prepare('UPDATE members SET photo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(photoPath, id);
      return { previousPhotoPath: existing.photo_path };
    });
  }

  getMemberByUid(uid) {
    return this.db.prepare(`
      SELECT id, card_uid, first_name, last_name, photo_path, membership_status,
             membership_type, valid_until, passes_remaining, billing_anchor_day FROM members WHERE card_uid = ?
    `).get(uid);
  }

  getMemberById(id) {
    return this.db.prepare(`
      SELECT id, card_uid, first_name, last_name, photo_path, membership_status,
             membership_type, valid_until, passes_remaining, billing_anchor_day FROM members WHERE id = ?
    `).get(id);
  }

  formatMember(member) {
    if (!member) return null;
    return {
      id: member.id,
      cardUid: member.card_uid,
      firstName: member.first_name,
      lastName: member.last_name,
      name: `${member.first_name} ${member.last_name}`,
      photoPath: member.photo_path,
      membershipStatus: member.membership_status,
      membershipType: member.membership_type,
      validUntil: member.valid_until,
      passesRemaining: member.passes_remaining
    };
  }

  formatCheckInResult(member, uid, allowed, reason) {
    return { allowed, reason, uid, member: this.formatMember(member) };
  }

  // checked_in_at is set explicitly from `now` (formatted to match SQLite's own CURRENT_TIMESTAMP
  // default exactly: UTC 'YYYY-MM-DD HH:MM:SS') rather than left to that default, so it's actually
  // consistent with whatever `now` checkIn() itself used for everything else -- the punch-card
  // cooldown check above compares against real stored checked_in_at values, and a test passing a
  // fake `now` would otherwise be comparing that fake cutoff against unrelated real-wall-clock rows.
  recordCheckIn(memberId, uid, allowed, reason, now = new Date()) {
    this.db.prepare(`
      INSERT INTO check_ins (member_id, card_uid, allowed, reason, checked_in_at) VALUES (?, ?, ?, ?, ?)
    `).run(memberId, uid, allowed ? 1 : 0, reason, now.toISOString().slice(0, 19).replace('T', ' '));
  }

  recentCheckIns(limit = 6) {
    return this.db.prepare(`
      SELECT c.id, c.card_uid AS uid, c.checked_in_at AS checkedInAt,
             c.allowed, c.reason,
             CASE WHEN m.id IS NULL THEN 'Unknown card' ELSE m.first_name || ' ' || m.last_name END AS name
      FROM check_ins c LEFT JOIN members m ON m.id = c.member_id
      ORDER BY c.id DESC LIMIT ?
    `).all(limit).map((row) => ({ ...row, allowed: Boolean(row.allowed) }));
  }

  // Filterable check-in history for the staff History tab (and its CSV export). Every check-in is
  // included -- approved, denied, and unknown-card alike -- since a run of denials or repeated
  // unknown-card taps is itself useful signal (a member whose card keeps failing, a possible
  // tailgating attempt), not just noise to hide. A deleted member's past check-ins still show, under
  // their anonymized placeholder name, since deleteMember() never touches check_ins itself.
  searchCheckIns({ query = '', fromDate = '', toDate = '', limit = 100, offset = 0 } = {}) {
    const clauses = [];
    const params = [];
    const trimmedQuery = String(query || '').trim();
    if (trimmedQuery) {
      clauses.push('((m.id IS NOT NULL AND (m.first_name || \' \' || m.last_name) LIKE ?) OR c.card_uid LIKE ?)');
      params.push(`%${trimmedQuery}%`, `%${trimmedQuery}%`);
    }
    if (fromDate) {
      clauses.push('date(c.checked_in_at) >= date(?)');
      params.push(fromDate);
    }
    if (toDate) {
      clauses.push('date(c.checked_in_at) <= date(?)');
      params.push(toDate);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    // Capped well above what the on-screen list ever asks for (its own page size is far smaller);
    // this ceiling only really matters to the CSV export path, which asks for as much as it can hold.
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 5000);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    return this.db.prepare(`
      SELECT c.id, c.card_uid AS uid, c.checked_in_at AS checkedInAt,
             c.allowed, c.reason,
             CASE WHEN m.id IS NULL THEN 'Unknown card' ELSE m.first_name || ' ' || m.last_name END AS name
      FROM check_ins c LEFT JOIN members m ON m.id = c.member_id
      ${where}
      ORDER BY c.id DESC LIMIT ? OFFSET ?
    `).all(...params, safeLimit, safeOffset).map((row) => ({ ...row, allowed: Boolean(row.allowed) }));
  }

  // Filterable list of actual payments (signups/renewals where a real amount was entered) for the
  // staff Payments tab (and its CSV export), plus the total for whatever filter is applied -- the
  // amount paid was already being captured at signup/renewal, but nothing anywhere let staff see it
  // again afterward. Only rows with a real amount_cents show here; a renewal done without entering
  // one (the amount prompt can always be skipped) isn't a "payment" to list. A deleted member's past
  // payments still show under their anonymized placeholder name, same reasoning as searchCheckIns.
  searchPayments({ query = '', fromDate = '', toDate = '', limit = 100, offset = 0 } = {}) {
    const clauses = ['s.amount_cents IS NOT NULL'];
    const params = [];
    const trimmedQuery = String(query || '').trim();
    if (trimmedQuery) {
      clauses.push('(m.first_name || \' \' || m.last_name) LIKE ?');
      params.push(`%${trimmedQuery}%`);
    }
    if (fromDate) {
      clauses.push('date(s.created_at) >= date(?)');
      params.push(fromDate);
    }
    if (toDate) {
      clauses.push('date(s.created_at) <= date(?)');
      params.push(toDate);
    }
    const where = `WHERE ${clauses.join(' AND ')}`;
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 5000);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const rows = this.db.prepare(`
      SELECT s.id, s.created_at AS createdAt, s.event_type AS eventType,
             s.membership_type AS membershipType, s.amount_cents AS amountCents,
             m.first_name || ' ' || m.last_name AS name
      FROM subscriptions s JOIN members m ON m.id = s.member_id
      ${where}
      ORDER BY s.id DESC LIMIT ? OFFSET ?
    `).all(...params, safeLimit, safeOffset);
    const { total } = this.db.prepare(`
      SELECT COALESCE(SUM(s.amount_cents), 0) AS total FROM subscriptions s JOIN members m ON m.id = s.member_id ${where}
    `).get(...params);
    return { rows, totalCents: total };
  }

  transaction(work) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = work();
      this.db.exec('COMMIT;');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  GymDatabase,
  DEMO_PHOTO_TOKENS,
  addDays,
  inclusiveDays,
  localDateString,
  membershipEndDate,
  normaliseUid
};
