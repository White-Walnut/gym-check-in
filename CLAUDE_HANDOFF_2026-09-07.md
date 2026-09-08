# Dialog focus and renewal cancellation: Claude Code handoff

## Status first

There is an uncommitted candidate fix in this app folder. Review and finish validating this patch; do not implement a second fix from scratch.

Baseline: `014dfb6` (v1.9.13). The checkout was clean before this work. Version and installed executables have not changed. No database schema, production member records, payment records, or package dependencies were changed by this patch. The earlier `CLAUDE_HANDOFF_2026-09-03.md` mentioned in the user's IDE could not be found in this workspace; the current source and Git history were used instead.

Node tests: **95 passed, 0 failed** (82 baseline tests plus 13 new regressions). JavaScript syntax checks and `git diff --check` passed. **The Electron UI suite has NOT passed here.** Electron's renderer and GPU subprocesses failed before loading the page inside Codex's sandbox. Running outside the sandbox was rejected because this session's approval policy disables sandbox escalation. That is an execution blocker, not evidence that the focus fix works or fails.

The app root is:

```text
C:\Users\michael.leblanc\Documents\Codex\2026-08-27\build-a-lightweight-local-desktop-app\outputs\gym-checkin-app
```

## What the user reported

After a popup opens and is confirmed, cancelled, or closed, the new-member fields stop accepting clicks/input. Minimizing and restoring the app makes them work again. This is the priority bug.

A second defect was confirmed by executing the actual renewal handler against a stub IPC endpoint: clicking Cancel on the amount-paid prompt still called `renewMember`. The old code returned `null` both for cancellation and for a blank payment, then renewed unconditionally.

## Why the last focus fix was incomplete

Commit `e36da85` added `win.focus()` after seven native file-picker/export operations. It did not cover browser `window.confirm()` or `window.alert()` calls used for deletion, discarding edits, risky member edits, plan conversions, recovery-code messages, or update confirmation. The main-process quit message also had no recovery on cancellation.

This symptom matches Electron's Windows popup focus reports:

- https://github.com/electron/electron/issues/41602
- https://github.com/electron/electron/issues/40212

Those reports support the diagnosis; they do not establish a reproduction against this app's Electron 44 build.

The old smoke checks replaced `window.confirm`/`window.alert` with canned functions. The delete-then-add check also assigned `.value` directly to prove that fields were editable. Neither approach exercises popup focus or mouse hit-testing.

## Changes already made

### Renderer: `src/renderer/renderer.js`, `index.html`, `styles.css`

- The existing text prompt is now a shared HTML `<dialog>` opened with `showModal()`. It handles text entry, confirmations, and messages. The browser makes the page behind it inert and contains keyboard focus inside it.
- No production renderer action calls browser `window.confirm`, `window.alert`, or `window.prompt` anymore.
- `showAppDialog`, `showConfirmation`, `showAlert`, and `showTextPrompt` share lifecycle handling. Confirmation defaults to Cancel. Cancel, Escape, and backdrop dismissal resolve without approving the action.
- Dialog dismissal clears transient input/message data (including PIN/recovery text), drops pending sensitive keystrokes, closes the HTML dialog, and restores the prior focus target when it still exists and is usable.
- A second prompt request is declined while another is waiting. It cannot replace the first resolver or inherit its answer.
- Discard checks, tab changes, member-editor opening, activity-feed navigation, and staff-area entry now await confirmation where needed. Cancellation stops the dependent navigation/capture.
- While a dialog is open, RFID scans are routed to check-in instead of replacing the card on the form or moving focus behind the dialog. Existing scan timing and PIN-buffer logic otherwise remain unchanged.
- The amount prompt returns an explicit cancellation flag. Cancel makes **no renewal IPC call**. Confirming a blank amount still renews with `amountCents: null`. Invalid nonblank amounts remain in the dialog with the existing localized error.

### Main process: `src/main.js`, new `src/native-dialog.js`

- Normal quit confirmation is shown on the staff page using the same HTML dialog, including when the customer-facing window's X initiated it. Repeated close requests cannot stack confirmations. Confirmed quit still closes the app; Cancel preserves the session and forms.
- A native quit-confirmation fallback remains for an unavailable/failed renderer, so the app is not made impossible to close by a renderer failure.
- File pickers remain native. `withDialogFocus` retains the original owner and restores both the window and its web contents in `finally`, including Cancel and rejected picker operations. It blurs an already-focused owner before focusing it, since calling `focus()` on an already-focused window can be a no-op.
- Smoke runs now isolate Electron's `userData`/`sessionData` caches as well as the database, photos, branding, and logs.

### Verification code

- `test/native-dialog.test.js`: selection, cancellation, rejection, and destroyed-owner handling.
- `test/renderer-actions.test.js`: executes actual renderer functions in a Node VM. Covers cancelling monthly/punch-card renewal, confirming a blank payment, cents conversion, cancelling plan conversion, and awaiting cancelled activity-feed/discard navigation.
- `src/dialog-smoke.js`: new Electron integration checks using Chromium mouse/keyboard events. Checks confirmation Cancel, Escape, backdrop, approval, alert focus restoration, renewal cancellation without record changes, invalid/blank payment, deletion followed by new-member typing, and cancellation of the actual main-process quit handler.
- Existing full smoke checks now dismiss actual HTML confirmations/messages rather than mocking browser popups. The new dialog suite also runs at the end of full single-window smoke.
- New `--dialog-smoke` selects the focused regression suite; `--manual-smoke` opens a visible disposable session for real OS-level checks. Both require `--smoke-dir`.

## Run these checks next

Use a normal local PowerShell terminal that can launch Electron. Do not run `npm run release` or replace the installed app during verification.

```powershell
Set-Location -LiteralPath 'C:\Users\michael.leblanc\Documents\Codex\2026-08-27\build-a-lightweight-local-desktop-app\outputs\gym-checkin-app'
git status --short
npm test
git diff --check

# Some agent terminals inherit this variable and accidentally launch Electron as plain Node.
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

$dialogReviewRoot = 'C:\Users\michael.leblanc\Documents\Codex\2026-08-27\build-a-lightweight-local-desktop-app\work\claude-dialog-review-' + [guid]::NewGuid().ToString('N')

# Focused UI regressions. Requires a real Electron renderer, no server or network.
& '.\node_modules\.bin\electron.cmd' . "--smoke-dir=$dialogReviewRoot\focused" --dialog-smoke

# Existing full single-window UI/check-in smoke suite, including the new dialog regressions.
& '.\node_modules\.bin\electron.cmd' . "--smoke-dir=$dialogReviewRoot\full"

# Visible session for actual mouse/keyboard/file-picker checks.
& '.\node_modules\.bin\electron.cmd' . "--smoke-dir=$dialogReviewRoot\manual" --manual-smoke
```

In manual mode, the database is in memory and demo fixtures are seeded. The test PIN is `1234`. All Chromium profile files and app-managed photos/branding/logs stay under the specified smoke folder. Closing this session discards its member changes. If exporting a fixture, choose a destination inside the review folder. Backup export is intentionally unavailable for an in-memory database; use history/payment/member export to exercise the shared Save dialog path.

The focused suite should exit successfully and create `dialog-regression-results.json` and `dialog-focus-after.png`. A reached test failure writes `dialog-failure.txt`. Inspect the result file and screenshot; do not count an empty output folder or a process-launch failure as a pass. The test driver itself has not yet run past renderer startup in this environment, so fix any genuine harness problems and rerun rather than weakening assertions.

Full smoke may log intentional scan-timing diagnostics via `console.error`; inspect any `console-errors.log` to separate those existing diagnostics from actual JS exceptions. Do not dismiss real errors as expected noise.

## Acceptance checks on Windows

1. Type a new member's first/last name. Attempt to leave the tab. Test Cancel, Escape, clicking outside, and OK. Cancel paths preserve values. OK discards them. Return to Add and click/type into both name fields and click the date field, without minimizing.
2. Open a member editor. Cancel deletion, then edit a field. Confirm deletion of a disposable fixture. Immediately add another member. Fields must stay responsive.
3. Try +1 month and +10 passes. Cancel the amount prompt by button/Escape/backdrop. Membership dates, passes, and payment records must remain unchanged. Confirming a blank amount must renew once with no payment amount. A valid entered amount must be recorded once.
4. Cancel plan conversion and risky status/card edits. No pending change may be saved. Confirm them on test records and verify exactly one intended change.
5. Regenerate a recovery code using test PIN 1234. Dismiss the message, then type into a normal field. Verify the PIN prompt accepts normal typing and Enter. A real card tap must not approve a destructive confirmation.
6. Open the photo picker and an export Save dialog. Test selecting a file, Cancel, and the native X. Then click/type into Add-member fields. This is the real OS-level check that mocked native-dialog tests cannot prove.
7. Click the application X with unsaved member data; cancel. Values and input focus must survive. Confirm quit in a disposable session. If two monitors are available, repeat from each window and verify the staff window owns the confirmation and both close only on approval.
8. Verify Tab/Shift+Tab stay inside an open dialog and that rapid repeated clicks do not create extra renewals or stranded overlays. Check English and Czech labels. No minimize/restore workaround should be needed.

The existing narrow image/camera UI and payment parsing have other possible improvements outside this fix. Keep this task focused on dialog lifecycle, cancellation, focus, and regressions introduced by making confirmations asynchronous.

## Handoff outcome expected

Review the uncommitted diff, run the tests above, and resolve any defects in this candidate fix. Report what passed, what was physically tested, and anything still unverified. A source patch and passing Node tests are not the same as a verified Windows fix. Do not bump the version, publish a release, or install over the user's app as part of this verification task.
