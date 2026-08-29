# Claude Code review brief: Gym Check-in 1.2.0

## Your task

Review this application and report findings only.

Do not edit files. Do not run formatters, migrations, packaging, or commands that write to the project. Do not open or modify the live SQLite database in AppData. Read the source, run only non-mutating checks where practical, and return a prioritized review with file and line references.

Focus on defects, data-loss risks, incorrect business rules, security boundaries, and behavior that will fail at a real gym reception desk. Avoid generic style comments unless they expose a concrete maintenance or reliability problem.

## Product goal

This is a local, offline Electron kiosk for a USB RFID reader operating in HID keyboard-wedge mode. The reader types a card UID and sends Enter. The app matches the normalized UID against SQLite and shows a large green or red result with the member's name, photo, and current membership state.

There is also a staff area, opened with `Tab` or the staff icon, for adding, renewing, and editing members.

## Current release

- Version: `1.2.0`
- Portable build: `dist/Gym Check-in 1.2.0.exe`
- SHA-256: `FB4D4E929A4C69651674C2C5514F96EC0B3A16752AF54B3431EFF0D6F18958C3`
- Runtime: Electron 44 with Node's built-in `node:sqlite`
- Frontend: plain HTML, CSS, and JavaScript
- External runtime services: none

## Important files

- `src/database.js`: schema, migrations, demo seed, check-in evaluation, punch-card decrement, member CRUD, renewal logic, subscription history
- `src/main.js`: Electron lifecycle, IPC handlers, file-photo URL conversion, smoke-test capture mode
- `src/preload.js`: isolated renderer API
- `src/renderer/index.html`: kiosk and staff-management markup
- `src/renderer/renderer.js`: RFID keyboard buffer, kiosk state, admin workflows, member list and editor
- `src/renderer/styles.css`: kiosk and admin layout
- `test/database.test.js`: database, migration, renewal, and editing tests
- `README.md`: operating and data-model documentation
- `package.json`: scripts, pinned Electron/build versions, packaging configuration

## Implemented behavior

### Check-in

- UID normalization removes non-alphanumeric characters, uppercases the result, and preserves leading zeroes.
- Monthly members are approved when status is `active` and `valid_until` has not passed.
- Punch-card members are approved when status is `active` and `passes_remaining > 0`.
- An approved punch-card check-in decrements one pass in the same SQLite transaction that records the check-in.
- Unknown, expired, frozen, cancelled, empty punch-card, invalid, and system-error states have separate result copy.
- Duplicate reads of the same UID within 1.5 seconds are ignored in the renderer.
- The screen resets after seven seconds, but a different member can scan immediately.

### Staff area

- Opens with `Tab` from the kiosk or by clicking the staff icon.
- Unknown cards show an `Assign to new member` action that prefills the captured UID.
- New members can be monthly with an exact end date or punch-card with a starting entry count.
- Renew view immediately loads up to 500 members and can filter by name or UID.
- `+1 month` adds a calendar membership period.
- `+10 passes` adds entries and can convert a monthly member to punch-card.
- `Custom date` opens the editor with monthly membership and an exact final day.
- `Edit` changes first name, last name, card UID, status, membership type, end date, or remaining entries.
- Increasing an end date or entry balance through Edit creates a renewal record; identity-only corrections do not.

### Calendar-month rule

The user's explicit rule is: a monthly membership runs from its start date through the same calendar day next month minus one day.

- If the member is expired, a one-month renewal starts today.
- If still active, the next period starts the day after the current `valid_until` date.
- Example: 2026-08-28 through 2026-09-27.
- The current end-of-month implementation clamps a missing target day before subtracting one day. Example: a start of 2026-01-31 ends on 2026-02-27. Review whether this edge behavior is defensible or should use a different business rule.

### SQLite schema

Tables:

- `members`
- `check_ins`
- `subscriptions`
- `app_meta`

Membership types are `monthly` and `punchcard`. Status values are `active`, `frozen`, and `cancelled`.

The application migrates the original schema by rebuilding `members` and `check_ins` so `valid_until` can be nullable and the new membership columns can be added. Migration tests assert that existing members and check-ins survive and that `PRAGMA foreign_key_check` returns no errors.

The `subscriptions` table records signups and renewals with days or passes added. It contains an optional `amount_cents` field, but the current UI does not collect or store payment amounts.

## Demo cards

The demo-data upgrade is versioned in `app_meta` so it runs once and does not reset punch-card balances on every launch.

- `10000001`: active monthly
- `10000002`: expired monthly
- `10000003`: ten-entry punch card at first upgrade
- `10000004`: empty punch card

An earlier seed implementation skipped all demos whenever any member already existed. Version 2 repairs the known demo UIDs with an upsert and preserves unrelated members.

## Live database history

The development machine's live database is normally:

`C:\Users\michael.leblanc\AppData\Roaming\gym-check-in\gym-checkin.sqlite`

It was found still using the original schema after version 1.1.0. A backup was created before repair:

`C:\Users\michael.leblanc\AppData\Roaming\gym-check-in\gym-checkin.pre-v1.1-repair.sqlite`

The repaired live database passed `PRAGMA foreign_key_check`, and a copy returned `10000001` as Alex Morgan with `allowed: true`.

Do not inspect or modify either AppData file as part of this review unless the user separately authorizes it.

## Verification already performed

`npm test` currently reports ten passing tests covering:

- UID normalization
- Calendar-month calculations
- Active, expired, frozen, and unknown-card evaluation
- Punch-card decrement and zero-balance denial
- Member creation, search, subscriptions, and plan conversion
- Active calendar-month extension and custom end dates
- Full member editing
- Legacy-schema migration and foreign-key integrity
- Demo-data repair without pass reset on relaunch

`npm audit` reported zero known vulnerabilities at the time version 1.2.0 was built.

The packaged executable passed a seven-screen smoke render:

1. Ready state
2. Monthly approval
3. Unknown-card denial and assignment action
4. Punch-card new-member form
5. Punch-card approval with nine entries remaining
6. Immediate member list with renewal actions
7. Custom-date/member editor

## Known limitations and review targets

Please investigate these rather than assuming they are acceptable:

1. **Staff access has no authentication.** This follows the requested `Tab` workflow, but any kiosk user can currently open member management.
2. **Keyboard-wedge capture depends on focus.** The global buffer ignores key events originating from inputs and buttons. A card tapped while a text field has focus may type into that field instead of being treated as a card scan.
3. **Demo photo paths may not survive portable extraction changes.** Demo seed data stores an absolute asset path derived from the running package. A portable executable may extract to a different temporary directory on another launch. The renderer falls back to generated initials when a photo fails, but assess whether demo assets need a stable token or custom protocol.
4. **No member-photo picker exists.** The schema and renderer support `photo_path`, but staff cannot select or replace photos through the UI.
5. **Payment values are not captured.** `subscriptions.amount_cents` exists but remains null through current staff workflows.
6. **Member listing is capped at 500.** Search and initial list share that cap and have no pagination.
7. **Plan conversion semantics need scrutiny.** `+1 month` converts punch-card to monthly and clears remaining entries. `+10 passes` converts monthly to punch-card and clears the end date.
8. **Edit-based renewal detection is inferred from value increases.** Confirm that subscription history cannot be duplicated, omitted, or misleading during plan changes and corrections.
9. **Synchronous SQLite runs on Electron's main process.** The dataset is expected to be small, but inspect UI-blocking and busy-lock behavior.
10. **Renderer smoke mode uses an in-memory database.** Migration behavior is covered by Node tests rather than the packaged Electron smoke path.
11. **There is no backup/restore workflow in the UI.** The database is local and operationally important.
12. **Portable executable is unsigned by a trusted publisher.** Electron Builder runs its signing step, but no production certificate is configured.

## Review questions

Return a prioritized report that answers:

1. Can any normal check-in decrement the wrong member, decrement twice, or approve without recording the event?
2. Can schema migration lose data or leave foreign keys/indexes in an invalid state after interruption?
3. Are calendar-month and custom-date calculations correct across leap years, DST boundaries, short months, expired members, and active extensions?
4. Can renderer state, focus, rapid scans, or overlapping timers cause a scan to be ignored or applied to the admin form incorrectly?
5. Are IPC inputs sufficiently validated, and can the renderer access arbitrary local files through `photo-url`?
6. Can member edits create contradictory membership data or misleading subscription records?
7. What are the three highest-value changes before real deployment?

For each finding, include severity, concrete consequence, reproduction or reasoning, and exact file/line references. Separate confirmed defects from design risks and optional improvements.
