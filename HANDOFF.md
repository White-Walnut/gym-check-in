# Handoff

Last updated 24 November 2026, at v1.9.17 (`2e941b7`). Replaces `docs/history/CLAUDE_HANDOFF_2026-09-07.md`.

Read this first, then `README.md` for how the app behaves and `RELEASING.md` before shipping anything.
If you're an AI coding agent, `CLAUDE.md` has the working rules for this repo.

## What this is

An offline Electron app for a gym's reception desk. A USB RFID reader in keyboard mode types a card
UID, the app checks it against a local SQLite database, records the attempt and tells staff the
result. Staff manage members, renewals and payments in a PIN-protected dashboard. English and Czech.

Installed copies update themselves from GitHub Releases, so anything pushed as a release reaches
the gym. Treat any installed copy and its database as production.

## Where everything is

| What | Where |
|---|---|
| Source (this repo) | `https://github.com/White-Walnut/gym-check-in`, branch `main`. **The repo is public.** |
| Local checkout | `C:\Users\michael.leblanc\Documents\Codex\2026-08-27\build-a-lightweight-local-desktop-app\outputs\gym-checkin-app` |
| Releases (what installed copies update from) | GitHub Releases on the repo above. v1.9.17 is "Latest". |
| Built installers | `dist\` in the checkout (git-ignored). Unsigned. |
| Live database on a PC running the app | `%APPDATA%\gym-check-in\gym-checkin.sqlite`, with `photos\`, `branding\` and `gym-checkin.log` beside it |
| Old test output and scratch files | `..\..\work\` (outside the repo, not in git). See **Data to clean up**. |

## State right now

- `main` and `origin/main` match. The working tree was clean before this handoff commit.
- `npm test`: 118 pass, 0 fail.
- Full Electron smoke run, rerun on 24 November against v1.9.17: passes, 43 screenshots. Its
  `console-errors.log` contains only the 3 intentional `[scan-timing-raw]` diagnostics.
- v1.9.16 was tagged and built but never got a GitHub release. v1.9.17 is the same code with only
  the version number and changelog changed, and it is the published release.

Recent work, newest first:

| Version | What changed |
|---|---|
| 1.9.16/17 | Second launch focuses the running app instead of opening a duplicate. Old check-ins are purged daily, not only at startup. A failed photo save no longer leaves the file behind. Settings help text moved into (i) bubbles. English copy rewritten plainly. Czech rewritten from scratch. "Unknown card" now translated in the Czech feed, history and CSV. Staff side redesigned in IBM Carbon style. |
| 1.9.15 | Members list: one renewal action per row, membership state as a status tag. |
| 1.9.14 | All five defects from the September readiness review fixed: verified `VACUUM INTO` backups (photos and logo copied alongside), billing anchor kept on name-only edits, last-pass re-entry, impossible dates rejected, deleted members can't be renewed. In-page dialogs replaced every `window.confirm`/`alert`/`prompt`. |
| 1.9.13 | Punch-card re-entry window, Payments tab, "Permanentka" renamed "Vstupová", renewal anchor fix for long-lapsed members. |

`CHANGELOG.md` has the full list. It's generated from commit subjects at release time.

## What the next person needs

- **Push access** to `White-Walnut/gym-check-in`. The repo belongs to the White-Walnut GitHub
  account, so the owner has to add you as a collaborator or transfer the repo.
- **Your own GitHub token** for releasing. `RELEASING.md` covers `gh auth login` and `GH_TOKEN`. Don't
  reuse anyone else's token, and never commit one.
- **Node.js 24+** and `npm install` in the checkout.
- **The gym's staff PIN and recovery code** if you need to look at the live install. They're held at
  the gym and aren't stored anywhere in this repo. Without both, the only way in is deleting the
  database.

## Open items

Roughly in priority order. None of these is a known data-loss bug.

1. **Verify on the gym PC.** The automated smoke run uses a hidden window and synthetic input, so it
   can't prove these:
   - The real RFID reader: known and unknown cards, double taps, last-pass re-entry, tapping while
     staff are typing in a form.
   - Native file dialogs (photo, logo, backup and export Save dialogs). After Save, Cancel and the
     window X, click and type into the Add member name fields without minimizing. This was the
     "fields are blocked" bug the user reported in September.
   - Two-screen mode. It has never been run on a real second monitor. With one attached, the
     `--dual-screen-smoke` flag below exercises that path.
   - Installing 1.9.17 over an older version with existing data.
2. **Czech review by a native speaker.** The Czech was rewritten in September and reads correctly to
   us, but these word choices deserve a second opinion: "Příchody" for check-ins, "Vstupová" used on
   its own as a noun for the punch card, "Recepce" for the staff area, "Opakovaný příchod na
   vstupovou" for the re-entry setting.
3. **Two Czech gaps left on purpose:**
   - A deleted member shows as "Deleted Member" in English, because that placeholder name is written
     into the database row when the member is anonymized (`deleteMember` in `src/database.js`).
     Fix it at display time, the same way "Unknown card" is handled (`checkInDisplayName` in
     `renderer.js`).
   - Date fields show `MM/DD/YYYY` because Electron runs with an en-US locale. Native `<input
     type="date">` follows the app locale, not the page language.
4. **No test gate in the release script.** `npm run release` bumps, pushes, builds and publishes
   without running tests. Run the checks in **How to verify** first, or add `npm test &&` to the
   front of the release scripts in `package.json`.
5. **Unsigned installer.** Windows SmartScreen warns on install and on every update.
   `UPDATER_SETUP.md` says where a certificate would go.

## Data to clean up

`..\..\work\` (beside the repo, not in git) holds two database files from 28 August:
`live-db-copy.sqlite` and `repaired-db-check.sqlite`. Going by the names they were copied from a real
install, so they probably contain member names and check-in history. Nobody has opened them for this
handoff. Decide whether they're still needed. If not, delete them. If so, move them somewhere with
proper access control. The rest of `work\` is old smoke-test output and can go.

Never commit a database, a log, or a screenshot showing a real member. The repo is public.

## How to verify

From the checkout, in PowerShell:

```powershell
npm test
```

Electron smoke run, in an isolated temporary profile with an in-memory database (it never touches
the live database):

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$smoke = Join-Path $env:TEMP ("gym-smoke-" + [guid]::NewGuid().ToString('N'))
& '.\node_modules\.bin\electron.cmd' . "--smoke-dir=$smoke"
```

It exits on its own after a few minutes. Look in `$smoke` for the PNG screenshots, and open
`console-errors.log` if it exists. Lines starting `[scan-timing-raw]` are expected; anything else is
a real error. A thrown assertion stops the run with a message naming the failed step.

Three more modes, all requiring `--smoke-dir`:

- `--dialog-smoke`: only the dialog and focus regression checks. Writes
  `dialog-regression-results.json` and `dialog-focus-after.png`.
- `--manual-smoke`: opens a visible, disposable session with demo members and staff PIN `1234`, for
  clicking through by hand. Nothing you do there reaches the live database.
- `--dual-screen-smoke`: runs the real two-window path. Only works with a second display attached.

Known flakiness on the development PC: Electron's GPU process sometimes dies with `UnknownVizError`
or exit code 143, leaving zero screenshots, and stray `electron.exe` processes from a killed run make
the next run fail. Kill them (`taskkill /F /IM electron.exe`) and run again. Don't change code to
work around it.

## Decisions already made

These were settled with the owner. Don't reopen them without a reason.

- **Deleting a member anonymizes the row** (name, photo, card erased) and keeps their check-ins and
  payments for attendance and revenue records.
- **Amounts are in CZK.** Entering an amount is always optional.
- **Old check-ins are deleted automatically** after a configurable number of days (default 730).
  Members, payments and renewals are never purged.
- **Punch-card re-entry window:** default 3 hours, 0 turns it off. A second tap inside the window is
  free, even if the first tap used the last pass. The window counts from the tap that used a pass, and
  free taps don't extend it. Monthly members are unaffected.
- **Renewals keep the billing anchor day** so short months don't drift the date, except after a
  lapse: a membership that already expired restarts from today. A name-only edit never moves the
  anchor.
- **Each member row has exactly one renewal button**, matching their current plan. Changing plan
  type happens only in Edit, which says what balance will be lost before saving.
- **The custom gym logo is never shown on the customer-facing kiosk window**, only the name. The
  owner chose this after a rendering problem that couldn't be reproduced.
- **Staff side uses IBM Carbon; the kiosk keeps its own look.** The accent picker stays (Blue, Orange,
  Teal, Purple). The stored keys are still `slate`/`zinc`/`emerald`/`indigo` so saved choices carry
  over.
- **Settings explanations live in (i) bubbles.** Only the PIN format rule and the version number stay
  on screen.
- **The Windows notification writes DENIED in capitals** so a refusal stands out in a one-line popup
  (a test pins this).
- **No `window.prompt`, `window.confirm` or `window.alert` anywhere.** `prompt()` crashes in Electron,
  and native popups caused the Windows focus bug. Use `showTextPrompt`, `showConfirmation` and
  `showAlert` in `renderer.js`.

## Older documents

`docs/history/` keeps the September handoff, the September readiness review and the v1.2.0 review
brief. Each has a note at the top saying what's outdated. Use them for background only.
