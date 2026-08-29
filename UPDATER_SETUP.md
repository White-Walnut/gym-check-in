# Finishing the auto-updater setup

**Status: wired up, not enabled.** `electron-updater` is installed and `src/updater.js` is hooked up
in `src/main.js`, but nothing in the app calls it automatically -- there is no startup check and no
background polling. The only way to trigger a check right now is the "Check for updates" button in
the staff area's Settings tab, and today it will fail because `package.json`'s `build.publish` still
has placeholder values. This is intentional and outstanding until you complete the steps below.

## 1. Create a GitHub repository

Any repo works -- public or private. If private, staff machines (or your build machine) will need a
token with access to it (step 3).

## 2. Point the build config at it

In `package.json`, under `build.publish`, replace the placeholders:

```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "YOUR_REPO_NAME"
}
```

## 3. Get a GitHub token

Create a personal access token (classic `repo` scope is enough) at
https://github.com/settings/tokens, and set it as an environment variable before publishing:

```bash
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

(On Windows PowerShell: `$env:GH_TOKEN = "ghp_..."`.) Keep this out of source control -- it's only
ever needed on the machine that runs the publish step, not on kiosk machines.

## 4. Build and publish a release

```bash
npm run dist -- --publish always
```

This builds the NSIS installer *and* uploads it plus a generated `latest.yml` to a new GitHub Release
matching the `version` in `package.json`. `electron-updater` reads `latest.yml` to know whether a
newer version exists.

Bump `version` in `package.json` before each future release -- `electron-updater` compares against
it.

## 5. Turn on the manual "Check for updates" button for real

Nothing else needs to change in code -- once `build.publish` points at a real repo with at least one
published release, the existing "Check for updates" button (Settings tab in the staff area) will
start working immediately, no redeploy needed beyond what step 4 already does.

## 6. (Optional, later) Enable automatic checks

Right now checks are manual-only by design. When you're ready to check automatically (e.g. once a
day, or on startup), add a call to `checkForUpdatesManually()` from `src/updater.js` somewhere in
`src/main.js` -- for example inside `app.whenReady().then(...)`, after `wireUpdater(...)` is called.
Consider debouncing/throttling it (e.g. once per day, not once per launch) so a kiosk that's rebooted
frequently doesn't hammer GitHub.

## 7. (Optional, later) Code signing

The installer is currently unsigned, so Windows SmartScreen will show an "unknown publisher" warning
on first install and on every update. If you get a code-signing certificate, add
`certificateFile`/`certificatePassword` (or an EV token config) under `build.win` in `package.json`.
