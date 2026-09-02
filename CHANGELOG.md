# Changelog

Every entry below is generated automatically from commit messages when a release is cut -- see
`scripts/update-changelog.js`, wired into `npm version` via package.json's `version` script (which
runs as part of `npm run release`/`release:minor`/`release:major`). Nothing here should ever need to
be hand-edited; if a version's list looks wrong, the fix belongs in that script, not in this file.

An "Unreleased" section, when present, lists commits already on `main` that haven't shipped in a
release yet -- the next `npm run release` replaces it with that version's own dated entry.

## Unreleased

- Fix two-screen orphaned-window bug; warn before quitting or losing unsaved edits
- Fix the real cause of v1.9.6's empty release notes: cmd.exe eats the caret

## v1.9.6 -- 2026-08-31

- Generate real release notes from commit history instead of GitHub's empty auto-notes
- Add localization: English + Czech, switchable live from Settings
- Fix: a silently-expired staff session now actually re-locks the UI; polish Czech copy
- Add a Settings > Scan method toggle (card reader / barcode scanner)
- Add persistent diagnostic logging, for real beta testing

## v1.9.5 -- 2026-08-29

- Add Download/Restart-and-install buttons -- an update could be detected but nothing let staff act on it

## v1.9.4 -- 2026-08-29

- Fix publish config: releaseType (not draft) is the real electron-builder property
- Publish releases via gh CLI instead of electron-builder's unreliable --publish step
- Give the installer a space-free filename so it matches latest.yml exactly (no more upload-tool renaming mismatch)
- Fix: optional-hint now sits inline (grid layout was forcing it to its own row); update stale Updates-tab copy

## v1.9.3 -- 2026-08-29

- No notable changes.

## v1.9.2 -- 2026-08-29

- Initial commit: Gym Check-in v1.9.2
- Add automatic once-a-day update check (manual button still always available)
- Point build.publish at the real GitHub repo (White-Walnut/gym-check-in)
- Add npm run release scripts, auto-publish (no draft), and a RELEASING.md cheat sheet
