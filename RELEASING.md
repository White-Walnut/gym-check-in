# Releasing a new version

You don't need to remember any of this -- just open this file each time and copy-paste.

## One-time setup: GitHub CLI

`electron-builder`'s own GitHub-upload step turned out to be unreliable against this repo in
practice (two attempts each uploaded a different partial subset of the needed files). Releases now
upload via `gh`, GitHub's own official command-line tool -- more dependable, and a genuinely useful
tool to have regardless.

1. Install it: `winget install --id GitHub.cli` (or download from [cli.github.com](https://cli.github.com))
2. Close and reopen PowerShell, then run: `gh auth login` and follow the prompts (browser login is
   easiest). If you already have `GH_TOKEN` set from before (see below), `gh` picks that up
   automatically and this step may already be done.

## Where the token lives

GitHub only shows a personal access token once, right when you create it -- there's no "view it
again" later.

1. **Save any token you create in a password manager immediately**, labeled something like "GitHub
   gym-check-in token" -- whatever you already use for other passwords.
2. **Run this once**, in PowerShell, pasting the token in place of the placeholder:
   ```powershell
   setx GH_TOKEN "paste-your-token-here"
   ```
   This saves it permanently for your Windows account (survives restarts) -- close and reopen any
   terminal windows after running it. Both `gh` and the app's own update-check config use this.
   When the token expires (90 days is typical), make a new one at
   [github.com/settings/tokens](https://github.com/settings/tokens) and run `setx` again.

## The loop, every time you've made a change

```powershell
git add -A
git commit -m "describe what changed"
npm run release
```

That's the whole thing. `npm run release` does four jobs in one:
1. Bumps the version number in `package.json` (and makes its own commit + tag for just that)
2. Pushes everything to GitHub
3. Builds the installer
4. Uploads it as a new GitHub Release, via `gh`

Three variants, depending on how big the change was:

| Command | Example | Use for |
|---|---|---|
| `npm run release` | 1.9.2 -> 1.9.3 | A fix, most of the time -- safe default if unsure |
| `npm run release:minor` | 1.9.2 -> 1.10.0 | A new feature, nothing existing breaks |
| `npm run release:major` | 1.9.2 -> 2.0.0 | Changes how staff actually use the app |

## Checking it worked

- **[github.com/White-Walnut/gym-check-in/releases](https://github.com/White-Walnut/gym-check-in/releases)**
  should show the new version at the top, with **three** files attached: the `.exe`, its
  `.exe.blockmap`, and `latest.yml`. All three matter -- `latest.yml` is what the app actually reads
  to know an update exists.
- In the app: staff area -> Settings -> "Check for updates" reports whether that's the version
  currently installed.

## If a publish ever fails partway through

Run just the upload step again, without bumping the version again:

```powershell
npm run publish-release
```

If GitHub says the release already exists (from an earlier incomplete attempt), delete it first --
Releases page -> that release -> **Delete** (this only removes the release listing, not the
underlying git tag) -- then run the command above again.
