# Auto-updater setup

**Status: done and live.** `electron-updater` is wired up in `src/main.js`, `package.json`'s
`build.publish` points at the real repo ([White-Walnut/gym-check-in](https://github.com/White-Walnut/gym-check-in)),
and the app checks for updates automatically once a day (never downloads or installs without staff
explicitly clicking to confirm -- see the comment on `checkForUpdatesAutomatically` in
`src/updater.js`). The "Check for updates" button in the staff area's Settings tab still works too,
for an immediate manual check.

For the actual release routine (bumping the version, publishing to GitHub) see
**[RELEASING.md](RELEASING.md)** -- that's the one you'll actually use day to day.

## (Optional, later) Code signing

The installer is currently **unsigned**, so Windows SmartScreen shows an "unknown publisher" warning
on first install and on every update. If you get a code-signing certificate, add
`certificateFile`/`certificatePassword` (or an EV token config) under `build.win` in `package.json`.
