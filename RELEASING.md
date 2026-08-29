# Releasing a new version

You don't need to remember any of this -- just open this file each time and copy-paste.

## Where the token lives

GitHub only shows a personal access token once, right when you create it -- there's no "view it
again" later. Since you already have one on your clipboard right now:

1. **Paste it into a password manager immediately**, labeled something like "GitHub gym-check-in
   token" -- whatever you already use for other passwords. Do this before you copy anything else, or
   it's gone for good and you'll need to make a new one at
   [github.com/settings/tokens](https://github.com/settings/tokens).
2. **Then run this once**, in PowerShell, pasting the token in place of the placeholder:
   ```powershell
   setx GH_TOKEN "paste-your-token-here"
   ```
   This saves it permanently for your Windows account (survives restarts) -- close and reopen any
   terminal windows you already had open after running it. From then on, `npm run release` below just
   works, with no token step, ever, until the token expires (you set an expiry when you made it --
   90 days is typical). When it expires, make a new one on the same GitHub page and run `setx` again.

## The loop, every time you've made a change

```powershell
git add -A
git commit -m "describe what changed"
npm run release
```

That's the whole thing. `npm run release` does three jobs in one:
1. Bumps the version number in `package.json` (and makes its own commit + tag for just that)
2. Pushes everything to GitHub
3. Builds the installer and uploads it as a new GitHub Release

Three variants, depending on how big the change was:

| Command | Example | Use for |
|---|---|---|
| `npm run release` | 1.9.2 -> 1.9.3 | A fix, most of the time -- safe default if unsure |
| `npm run release:minor` | 1.9.2 -> 1.10.0 | A new feature, nothing existing breaks |
| `npm run release:major` | 1.9.2 -> 2.0.0 | Changes how staff actually use the app |

## Checking it worked

- **[github.com/White-Walnut/gym-check-in/releases](https://github.com/White-Walnut/gym-check-in/releases)**
  should show the new version at the top, not marked "Draft".
- In the app: staff area -> Settings -> "Check for updates" reports whether that's the version
  currently installed.

## One-time cleanup: publish the draft already sitting there

Your very first release (1.9.2) was created as a **draft** -- that was electron-builder's default
before `"draft": false` was added to `package.json`. Publish that one release by hand, once:

1. Go to [github.com/White-Walnut/gym-check-in/releases](https://github.com/White-Walnut/gym-check-in/releases)
2. Click the draft release
3. Scroll down, click **Publish release**

Every release after this one publishes automatically -- no manual click needed again.
