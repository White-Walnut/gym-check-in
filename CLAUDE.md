# Working on Gym Check-in

Read `HANDOFF.md` first: current state, open items, and decisions that are already settled. `README.md`
describes the app's behaviour for staff and owners.

## Commands

```powershell
npm install
npm test                      # node --test, all unit/regression tests (118 at v1.9.17)
npm start                     # run the app against the real database in %APPDATA%
npm run dev                   # same, with DevTools available
```

Electron smoke runs (in-memory database, isolated profile, never the live data) are described in
`HANDOFF.md` under **How to verify**. Run the full one after any UI change and look at the
screenshots. Passing unit tests don't show what the screen looks like.

## Rules

- **Never release, bump the version, push tags, run `npm run dist`/`release*`/`publish-release`, or
  install over the user's app unless the user asks for that specific step.** A release reaches the
  gym through auto-update.
- **Never open or edit a live database** (`%APPDATA%\gym-check-in\gym-checkin.sqlite`) or the
  database copies in `..\..\work\`. Use `--smoke-dir` runs or `new GymDatabase(':memory:')` in tests.
- **The repo is public.** No tokens, no real member data, no screenshots or logs from a real install.
- **Every admin IPC handler in `main.js` checks the staff session itself**: `adminResult(() => {
  assertUnlocked(); ... })`. The renderer's lock screen is not a security boundary.
- **No `window.prompt`, `window.confirm` or `window.alert`.** Use `showTextPrompt`,
  `showConfirmation` and `showAlert` in `renderer.js` (one shared in-page `<dialog>`). Native file
  dialogs go through `showNativeDialog` in `main.js`, which restores window focus afterwards.
- **Card scans are routed by keystroke timing, never by which field has focus.** See
  `src/renderer/scan-router.js` and the keydown handler in `renderer.js`. A scan only fills a form
  field when staff armed that field with its "Scan ..." button. PIN fields have extra protection
  (`isScanSensitiveField`). Don't weaken any of this; each piece fixed a bug a real reader caused.
- **Every user-visible string goes in both `src/shared/locales/en.js` and `cs.js`.** A test fails if
  their key sets differ. Markup uses `data-i18n`, `data-i18n-html` (only for keys ending in `Html`),
  `data-i18n-placeholder`, `data-i18n-aria-label` and `data-i18n-title`.
- **A new error code needs three entries**: `publicErrors` in `main.js`, `ERROR_CODES` in
  `renderer.js`, and `errors.<code>` in both locale files. Miss one and staff see a generic
  "could not be saved" message instead of the real reason.
- **Commit messages become the changelog.** `scripts/update-changelog.js` turns commit subjects into
  `CHANGELOG.md` and the GitHub release notes, so write the subject for the gym owner ("Fix: ...",
  "Add ..."). End messages with the co-author line your harness asks for. Commit and push to `main`
  only when the user has asked for the work to be committed.

## Where things are

| File | Responsibility |
|---|---|
| `src/main.js` | Electron lifecycle, single-instance lock, windows (single or two-screen), every IPC handler, staff unlock state, check-in notifications and beep, the smoke-test driver |
| `src/database.js` | SQLite schema and migrations, check-in rules, punch-card decrement and re-entry window, member CRUD, renewals and billing anchor, payments, history search, retention purge |
| `src/backup.js` | Verified `VACUUM INTO` backup plus copying photos/logo beside it |
| `src/native-dialog.js` | `withDialogFocus`: owner-window focus restore around native file dialogs |
| `src/updater.js` | electron-updater wiring. Never downloads or installs without staff confirming. |
| `src/logger.js` | Rotating `gym-checkin.log` |
| `src/dialog-smoke.js` | The `--dialog-smoke` regression checks (real Chromium input events) |
| `src/preload.js` | The `window.gym` API exposed to the page (sandboxed: it can't `require` project files) |
| `src/renderer/renderer.js` | All page logic: kiosk result screen, dashboard tabs, forms, dialogs, toasts, activity feed, settings |
| `src/renderer/scan-router.js` | Pure scan-vs-typing timing logic, unit-tested |
| `src/renderer/theme.js` | Applies the saved theme before the stylesheet paints |
| `src/renderer/styles.css` | Kiosk styles first (`--bg-*`, `--accent` tokens), then the Carbon staff side (`--cds-*` tokens) |
| `src/shared/*.js` | Code used by both processes (dates, renewal maths, member status, i18n, CSV, PIN hashing). Loaded in the page as plain `<script>` tags. |
| `test/*.test.js` | `node --test` suites. `renderer-actions.test.js` runs real renderer functions in a VM. |

## Style

- Match the surrounding code. Comments here are long and explain *why*: the bug or decision that
  led to the code. Keep that habit for anything non-obvious, and don't add comments that restate the
  code.
- Staff-side CSS follows IBM Carbon v11 using the `--cds-*` tokens already defined in `styles.css`:
  no rounded corners (tags and the toggle excepted), filled fields with a bottom border, 2px inset
  focus ring, no shadows or blur except on toasts. Don't touch the kiosk section's look unless asked.
- `[hidden]` is forced to `display: none !important` globally, so `element.hidden = true` always
  works, whatever `display` a class sets.

## Writing UI text

English:
- Short and plain. Say what happens. Use the real verb ("Saves a copy", not "serves to save").
- No dashes as punctuation (`--`, `—`) in UI strings; use a full stop, comma or colon.
- Sentence case everywhere except the kiosk eyebrows, which are capitals by design.
- Explanations go in a Settings (i) bubble, not on screen.

Czech (see the header comment in `cs.js`):
- Never `uložen(a)` or similar gender brackets. Use "Uloženo: {name}" or make the verb agree with a
  fixed noun such as "členství".
- Never glue a number to a verb or adjective that must agree with it. "Zbývá vstupů: {count}" is
  correct for every number; "zbývá {count} vstupy" is not. The noun plurals in `common.*Unit` pick
  their own form and are fine to use.
- No "jejich" for one person; it's a calque of the English "their".
- Status words in `common.status` are neuter because they always describe "členství".

## Testing gotchas

- On the development PC, Electron's GPU process sometimes crashes (`UnknownVizError`, exit 143) and
  leaves zero screenshots. Kill stray `electron.exe` processes and rerun. It isn't a code problem.
- A smoke screenshot can lag behind the DOM in the hidden window. `captureWindowScreenshot` forces a
  repaint first. If a screenshot still contradicts a DOM assertion that passed, trust the assertion
  and rerun rather than changing app code.
- Some terminals set `ELECTRON_RUN_AS_NODE`, which makes `electron .` start as plain Node. Unset it
  before smoke runs.
