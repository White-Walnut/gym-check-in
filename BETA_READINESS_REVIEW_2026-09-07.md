# Beta readiness review

Reviewed: 7 September 2026. Source version: 1.9.13, HEAD `014dfb6`, plus existing uncommitted dialog/focus changes.

## Verdict

Do not release this build for use with real member data yet. Internal testing with disposable data is reasonable. A supervised live-data beta needs the confirmed defects below fixed and the exact Windows installer tested.

The existing suite is green, but extra tests found gaps that matter at reception: backups can omit saved records, a name edit can shorten a later renewal, and using the last punch pass breaks the advertised re-entry window. These are functional issues, separate from the visual polish.

This was an assessment, not a repair pass. No application code was changed during this assessment, nothing was published, and no live member database was opened. Existing candidate fixes were preserved. Test fixtures and a temporary browser-preview adapter were created under `../../work/beta-review-2026-09-07/`.

## What was tested

| Check | Result | What it establishes |
| --- | --- | --- |
| Existing `npm test` suite | 95 passed, 0 failed | Covered unit/regression cases pass in Node. |
| `npm audit --json` | 0 reported vulnerabilities | No advisories reported for the dependency tree at review time. Not a security audit. |
| Nine additional database probes | 4 passed, 5 failed | Actual database methods exercised using disposable fixtures. Details below. |
| Transaction failure during check-in logging | Passed | A failed check-in insert rolls back the pass deduction. |
| Transaction failure during payment logging | Passed | A failed subscription insert rolls back the renewal. |
| Close/reopen persistence | Passed | Fixture member, payment and check-in records survived; SQLite integrity and foreign-key checks passed. |
| 5,000 members and 1,000 check-ins | Passed | Lookup, search and check-in integrity held in an in-memory Node fixture. Not a disk, Electron or RFID throughput benchmark. |
| Browser-rendered staff UI | Partial pass | Real renderer with a disposable backend adapter; cancellation preserved data and left fields editable. |
| Exact installer, native dialogs and USB reader | Not verified | Still needed on the target Windows machine. |

The previous Electron launch attempt in this environment failed with renderer/GPU startup errors. The browser preview is not a substitute for native Electron verification. It mocks the preload/IPC boundary and cannot prove native file-dialog focus, PIN security, display handling or updater behavior.

## Confirmed defects and required fixes

### 1. Live database backups can omit committed data

Priority: block live-data beta.

Locations: `src/database.js:141` (`backupBeforeMigration`, raw copy at line 149), `src/main.js:1526` (export backup, raw copy at line 1535).

Reproduction used the real migration-backup method:

1. Create a temporary database and checkpoint its initial schema.
2. Add a member, the associated signup/subscription record, and a check-in. Leave the database open, with committed changes in its WAL file.
3. Run `backupBeforeMigration()` and open the resulting backup read-only.
4. The source has one of each record. The backup has zero members, zero subscriptions and zero check-ins.

The method copies only the base SQLite file. Export Backup contains the same unsafe operation, although its native UI was not executed in this review. A backup can open successfully yet be stale. That is particularly dangerous because staff can reasonably believe their data is protected.

Required fix: use a SQLite-supported consistent snapshot mechanism, such as the backup API or `VACUUM INTO`, with explicit error handling. Do not replace this with an uncoordinated copy of the database and WAL files. SQLite describes the relevant copying hazards and safe alternatives in [How To Corrupt An SQLite Database](https://sqlite.org/howtocorrupt.html).

Add a regression that restores a backup taken while committed writes remain in WAL, then checks member balances, subscription records and check-ins. Also define and test backup/restore of member photos and branding, which are stored outside the database. A failed pre-migration backup should not silently count as protection.

### 2. A name-only edit changes the billing anchor

Priority: block live-data beta.

Location: `src/database.js:719`, inside `updateMember`.

Reproduction: create two identical monthly memberships on 31 January 2026, ending 27 February. Edit only the first name of one member on 1 February. Renew both by one calendar month on 10 February.

Observed: the edited member ends on 27 March; the untouched control ends on 30 March. The edit resets the original billing anchor from day 31 to day 28 despite no membership change.

Required fix: preserve the stored anchor for identity/photo/status-only edits and unchanged membership terms. Apply an explicit, documented anchor rule only when staff actually change membership dates or type. Add name-only edit regression tests at month-end, including leap-year and short-month transitions. Keep calendar months distinct from fixed 30-day extensions.

### 3. Last-pass members cannot use the configured re-entry window

Priority: block live-data beta while this feature is offered.

Locations: `src/database.js:598` and `src/database.js:604`.

Reproduction: enable a two-hour re-entry window; create a punchcard with one pass. Scan at 12:00, then again at 12:01. The first scan is approved and leaves zero passes. The second is denied with `no_passes`.

The zero-balance check happens before the re-entry check. Settings explicitly promise that repeat entry within the window does not use another pass.

Required fix: retain frozen/cancelled rejection, then evaluate qualifying prior entry before rejecting an otherwise eligible zero-balance member. Test last-pass re-entry, expiry of the window, cooldown disabled, and frozen/cancelled members. Decide explicitly whether repeat entries extend the window or it stays anchored to the paid entry; do not change that policy accidentally as part of this repair.

### 4. The backend accepts nonexistent calendar dates

Priority: fix before broader beta.

Location: `src/shared/dates.js:30`, used by database validation.

Observed: `isIsoDate('2026-02-30')` returns true and `addMember` accepts it. JavaScript date parsing normalizes some invalid dates. Browser date controls may prevent this through the ordinary form, but the database/API boundary still accepts invalid state.

Required fix: validate the calendar components and round-trip them exactly. Test invalid month/day combinations and leap years through add, edit and custom renewal paths.

### 5. Soft-deleted members can still be renewed by ID

Priority: fix before broader beta.

Locations: `src/database.js:815` (`renewMember`), `src/database.js:910` (`getMemberById`).

Observed: add a member, soft-delete them, then call `renewMember` using the saved ID. The renewal succeeds instead of returning `member_not_found`. Active lookups do not exclude `deleted_at` rows consistently.

Required fix: reject mutations of deleted members and distinguish active-member lookup from historical lookup. Check edit paths too. Preserve historical records where intended. Add regressions for stale IDs after deletion.

This probe demonstrates an unwanted mutation of a hidden record. It does not establish that renewal alone restores access through the old card UID.

## Candidate fixes versus the built app

The working tree contains the earlier in-page dialog and native-focus fixes, including new `native-dialog.js` and dialog tests. They remain uncommitted.

Read-only comparison against `dist/win-unpacked/resources/app.asar` found that both `main.js` and `renderer.js` differ from current source, and `native-dialog.js` is absent from that archive. Do not treat the old 1.9.13 build as verification of the candidate fixes. The existing `Gym-Check-in-Setup-1.9.13.exe` also reports `NotSigned` in Windows Authenticode inspection.

The release scripts currently bump versions, push tags, build and publish without a test gate. The publishing script creates an ordinary GitHub release, not an explicitly isolated beta release. Do not use the normal release command to distribute an experimental candidate unintentionally. Choose a beta distribution path and verify what existing clients would see before publishing.

Unsigned distribution is not a reason to skip internal testing, but it needs a deliberate plan before wider distribution. This review did not test installation warnings or updater trust behavior.

## Dialog/focus observations

Using the real renderer in Chrome with a disposable backend adapter:

- Cancelled a +10-pass payment dialog; the member remained at nine passes.
- Entered a first and last name, tried to leave Add Member, then pressed Escape in the discard dialog. The form stayed open with both names preserved.
- Clicked and typed into the first-name field after cancellation. It accepted more text.
- Cancelled another discard dialog, then confirmed discarding only that disposable form and opened Settings.

These browser interactions support the in-page dialog behavior. They do not close the original Windows focus bug. On the exact candidate installer, repeat Save/Cancel/Escape/close flows, native photo/logo/backup file dialogs, and quit cancellation; after every path, click and type in both name fields without minimizing the app.

## Why the interface still feels generic

This is a design judgment based on the current Add Member, renewal list and Settings screens in the dark Slate theme, not a measured usability study.

The problem is mostly hierarchy, not the particular shade of blue:

- Rounded, filled panels appear at nearly every level. Navigation, membership choices, status panels and settings choices all receive similar visual weight.
- The Add Member form is spread across a wide canvas. Oversized fields, a large waiting-for-card panel and a distant Save button make a short task feel bigger than it is.
- Every renewal row repeats similarly weighted actions, including both membership types. Actual active/expired status is buried in descriptive text rather than made easy to scan.
- Settings makes a gym-name Save button unusually large and gives decorative palette names such as "Midnight & Laser Violet" considerable space. That feels like a template showcase, not a reception tool.
- Small muted helper text competes with prominent buttons and headings. Some explanations belong behind help or in setup, not in the everyday workflow.

Recommended direction:

1. Keep the customer display bold: photo, name, approved/denied, expiry or remaining passes. Green/red belongs here.
2. Make staff screens compact and calm: a clear member list with Name, Status, Membership and expiry/balance; one obvious renewal action appropriate to the member, with secondary actions less prominent.
3. Constrain Add Member to a sensible form width. Put scan status near the card field and keep Save close to the last input.
4. Use fewer filled containers, restrained corner rounding, readable secondary text and one accent color. Changing the font alone will not solve this.
5. Shorten labels: "Members" instead of "Renew or prolong"; "Check-ins" instead of "Check-in history" where context is clear. Keep technical UID details available without making them the headline.

A full redesign is not a beta prerequisite. Accurate status, readable text and a fast desk workflow matter more than changing every visual component.

## Release gate for a supervised beta

1. Fix the five findings and add failing-then-passing regression tests to the permanent suite. Preserve the current user changes and do not alter live data while repairing them.
2. Restore a fresh live-WAL backup into an isolated profile. Check members, balances, payments, history and photos, not just whether SQLite opens.
3. Build an identified candidate after the fixes. Test that exact installer on the intended Windows setup, including a clean install and upgrade with fixture data. Keep a recovery copy and test rollback/data compatibility rather than assuming it.
4. Test the physical reader: known/unknown UID, manual demo input, duplicate taps, typing in staff fields, last-pass re-entry, expired/frozen/cancelled memberships, relaunch and offline operation.
5. Complete the native-dialog focus regression above; also test PIN lock/unlock/recovery and single-/dual-display behavior where used. Do not introduce a creator backdoor as part of readiness work.
6. Confirm the beta will not be served unintentionally to ordinary update clients. Record the candidate version, test results, known limitations and who can restore a backup.
7. Start with a small supervised group, an issue log and a manual check-in fallback. Broaden only after observed desk use is stable.

## Reproduction files

From the app folder:

```powershell
npm test
npm audit --json
node ../../work/beta-review-2026-09-07/probe.cjs
```

The probe uses temporary/in-memory databases and saves `probe-results.json` beside itself. It records individual failures and currently exits zero even when probes fail; read the `passed` fields. It is a diagnostic script, not yet a CI test gate. Port the cases into `node --test` when implementing the fixes.

The temporary `preview.cjs` serves the actual renderer only with a test backend on loopback. It is not production code and must not be packaged or treated as an Electron security test.
