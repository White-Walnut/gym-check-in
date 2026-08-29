# Gym Check-in

A small, offline Electron app for USB RFID readers that act as keyboards. It reads a card UID, checks
the local SQLite database, records the attempt, and tells staff what happened -- by default via a
Windows notification and a beep (see **Check-in notifications**), or on a dedicated customer-facing
display too if you turn on **Two-screen mode**.

## Run it

Requirements: Node.js 24 or newer and npm.

```powershell
npm install
npm start
```

The app opens straight into the staff dashboard, behind the staff PIN (see **Staff access** below) --
there's no separate check-in screen to look at first. Click **Test a card** in the dashboard's header
(visible on every tab) to test without a physical reader.

Demo cards:

- `10000001`: active monthly membership, approved
- `10000002`: expired monthly membership, denied
- `10000003`: 10-pass punch card, approved and decremented on every entry
- `10000004`: empty punch card, denied
- Any other UID: unknown card, denied

Existing databases are migrated automatically, and a timestamped backup copy
(`gym-checkin.pre-migration-<timestamp>.sqlite`, next to the live database) is made just before any
in-place schema upgrade runs. The demo-data version is also upgraded once so installations created by
version 1 receive the corrected demo cards; it does not reset punch-card balances on later launches.
A one-time repair also runs automatically if a past migration (versions up to 1.8.0) left the payment
history table's internal reference pointing at a table it had already cleaned up -- harmless to run,
and it backs up the database first the same way a schema upgrade does; it only ever does anything on
a database that actually hit that bug, and only once.

The database is created on first launch in Electron's app-data folder. The exact Windows location is
normally:

```text
%APPDATA%\gym-check-in\gym-checkin.sqlite
```

## Staff access

Member management is protected by a shared staff PIN (4-8 digits), enforced in the app's main
process -- every mutating action (add, edit, renew, search) re-checks the unlock state itself, not
just the screen that's shown, so it can't be bypassed from the page's own developer tools in a
packaged build (DevTools is disabled entirely once the app is installed; it's only available when
running via `npm start`/`npm run dev`).

- The **first time** anyone opens the staff area, they're asked to set a PIN.
- After that, opening the staff area requires the PIN. Five wrong attempts trigger a short,
  increasing lockout.
- The staff session stays unlocked while the panel is open (or up to 5 minutes of inactivity), and
  re-locks as soon as it's closed.
- Change the PIN any time from **Settings** inside the staff area (requires the current PIN).

This is one shared PIN for all staff, not per-person accounts -- there's no audit trail of *which*
staff member made a given change, only that a valid PIN was entered.

### Forgot the PIN?

Every time a PIN is set for the first time, reset via recovery, or explicitly regenerated from
Settings, a one-time **recovery code** is shown once (format `XXXXX-XXXXX`) -- write it down
somewhere safe, since it's not shown again after that screen closes. On the PIN-entry screen, click
**Forgot PIN?** and enter the code plus a new PIN. Using the code rotates it, so the old one stops
working and a fresh one is shown to save. There's no other recovery path: if both the PIN and the
recovery code are lost, the only way back in is to delete the database (losing all member data), so
keep the recovery code somewhere durable (not just in the manager's head).

## RFID reader setup

Configure the reader in keyboard/HID mode with **Enter as its suffix**. The app accepts alphanumeric
UIDs and strips spaces, colons, and hyphens before matching. Leading zeroes are preserved.

Card scans are recognised by keystroke timing (a HID reader types far faster than a human), not by
which field currently has keyboard focus -- so a member tapping their card while staff is mid-task
(adding a new member, searching, editing someone else) still checks in normally, shown as a small
toast in the corner instead of interrupting whatever staff is doing. A scan is only captured into an
admin text field (assigning an unknown card, replacing a card UID, jumping to a member by UID) when
staff has explicitly armed that field with its "Scan a different card" / "Scan to replace" / "Scan to
find" button.

If the reader exposes a serial/COM port instead of acting as a keyboard, this version will not
receive it. Add a serial adapter layer or switch the reader to HID keyboard mode.

## Member data

The `members` table contains:

| Column | Meaning |
|---|---|
| `card_uid` | Normalised unique UID, stored as text |
| `first_name`, `last_name` | Name shown at check-in |
| `photo_path` | A `demo:<name>` token for the bundled demo photos, or an absolute path under the app's own userData folder; anything else is rejected when resolving to a display URL |
| `membership_status` | `active`, `frozen`, or `cancelled` |
| `membership_type` | `monthly` or `punchcard` |
| `valid_until` | Final valid day for monthly members in `YYYY-MM-DD` format |
| `passes_remaining` | Available entries for punch-card members |
| `billing_anchor_day` | The day-of-month a monthly member's cycle renews toward (see **Calendar-month renewals** below); `NULL` for punch-card members |

Every scan is appended to `check_ins`, including denied and unknown cards. This gives the gym a local
audit trail.

The `subscriptions` table records each signup and renewal, including membership type, days added,
passes added, an optional payment amount field for later integration, and a free-text `note` --
written automatically when a renewal converts a member's plan type and discards their other balance
(e.g. "Converted from punchcard (5 passes forfeited)"), so that history stays honest instead of
silently omitting the loss.

## Member management

The dashboard opens straight to member management, behind the staff PIN -- there's no separate step
to open it. A **Lock** button in the header returns to the PIN screen (e.g. before stepping away);
unlocking again returns to the same tab you left.

To add a member:

1. Open **Add new member** and tap an unassigned card. For a card that scanned as unrecognised, click
   its entry in **Recent check-ins** (see **Check-in notifications**) instead -- that jumps here with
   the UID already captured, the same way the old "Assign to new member" prompt used to.
2. Enter the member's first and last name.
3. Choose Monthly and set the end date, or choose Punch card and set the starting pass count.
4. Click **Save member**.

To renew access, open **Renew or prolong**. The member list appears immediately and can be filtered
by name or card UID (or click **Scan to find** and tap a card). Click a member's name to open their
editor directly -- the buttons alongside are still there for the one-click renewal shortcuts below.

- **+1 month** adds one calendar membership period. If access is still active, the new period begins
  the day after the current end date. If expired, it begins today.
- **+10 passes** adds ten entries, or converts the member to a punch card with ten entries.
- **Custom date** (monthly members only) opens the member editor focused on the end-date field for a
  one-off date -- it no longer changes the member's status or plan type as a side effect.
- **Edit** changes the member's name, card UID, status, membership type, exact end date, or remaining
  entry count.

Renewing always reactivates a frozen/cancelled member, and converting plan type discards the member's
existing balance in the other type (remaining punch-card passes, or remaining monthly days). Both
**+1 month** and **+10 passes** ask for confirmation first when either of those would happen, then
prompt for an optional amount paid (skip by leaving it blank) before saving.

**Renew or prolong** also has an **Expiring within [N] days** control next to the search box, so
reception can proactively see who's about to lapse instead of only reacting once a card is declined.

Open **Edit** on any member for the full set of changes:

- **Photo** -- Change photo… offers a choice: **Take photo** opens a live camera preview (Capture,
  then Retake or Use this photo), or **Choose file…** opens a file picker (JPG/PNG/WEBP, up to 8MB).
  Remove photo clears it. A photo can only be added once a member exists (not during the initial
  Add). The camera option needs a webcam and its OS-level permission; if none is available, the
  preview shows an error instead of a blank screen.
- **Amount paid this visit (Kč)** -- optional, recorded on the payment/renewal history whenever it's
  filled in, whether or not the edit itself also changes the member's access (e.g. just fixing a
  name still records the amount) -- same as the quick-renew buttons. There's no in-app view of that
  history yet; it's included in **Export data…** below.
- **Delete member…** -- anonymizes the member (name, photo, and card are erased) rather than removing
  the row, so their check-in and payment history stays intact for attendance/revenue records. The
  card UID is replaced with a placeholder that can never be re-assigned to a real scan, and the member
  never appears in search again. This cannot be undone through the UI.
- **Export data…** -- saves everything held about that member (profile, full check-in history, full
  subscription/payment history) as one JSON file, for responding to a data access request.

To replace the demo data, close the app and edit the database with a SQLite tool such as DB Browser
for SQLite. Keep card UIDs as text so leading zeroes are not lost.

Example insert:

```sql
INSERT INTO members
  (card_uid, first_name, last_name, membership_status,
   membership_type, valid_until, passes_remaining)
VALUES
  ('04A1B2C3D4', 'Jamie', 'Chen',
   'active', 'punchcard', NULL, 10);
```

### Calendar-month renewals

A monthly membership runs from its start date through the same calendar day next month, minus one
day (e.g. `2026-08-28` through `2026-09-27`). When the target month is too short for that day (e.g.
day 31 in February), it's clamped to the target month's last day before subtracting one.

Each monthly member has a `billing_anchor_day` -- the day-of-month their cycle is meant to land on,
recorded when they sign up (or whenever staff explicitly picks a new end date) and preserved across
automatic "+1 month" renewals. This means a short month (like February) doesn't permanently drag a
member's billing day down in later months: a member anchored to day 31 who gets clamped to day 27 in
February is still computed against day 31 again in March, not against 27.

## Check-in notifications

By default there's no dedicated customer-facing screen at all -- just the staff dashboard, plus a
notification for every check-in so staff know it happened (and whether the card was actually valid)
even while they're doing something else entirely, like scanning a card in a separate MultiSport app:

- A **Windows notification** pops up over whatever currently has focus, naming the member and stating
  plainly whether they're valid (e.g. "Valid membership · valid until 2026-09-27") or denied and why
  (e.g. "DENIED -- membership expired 2026-08-01"). An unrecognised card shows its UID instead of a
  name.
- A **beep** plays at the same time so staff can tell approved from denied by ear without looking up:
  one beep for an approved entry, a quick double-beep for a denial -- the same pattern a standalone
  door-badge reader uses. This is useful on its own if the reader itself has no display next to it.

Both fire from the one PC regardless of which window (if any) currently has focus, and neither depends
on a second monitor -- this is the normal setup for a single staff PC with a plain USB reader.

A **Recent check-ins** panel also sits in the dashboard's header, visible no matter which tab is
open -- like a chat panel next to a stream -- showing the last 5 check-ins with name and outcome.
Click an entry to act on it immediately: an unrecognised card jumps to **Add new member** with the UID
already captured; anything else jumps to **Renew or prolong**, searched straight to that member. It
never appears on a kiosk-role window in two-screen mode, since that window can't open the dashboard at
all.

## Check-in history

The **Check-in history** tab lists every check-in -- approved, denied, and unknown-card alike, since a
run of denials or repeated unknown-card taps is itself worth noticing, not just noise to hide. Filter
by member name/card UID and/or a date range; **Load more** paginates further back. **Export CSV…**
saves the currently-filtered list (up to 5,000 rows at a time) to a file, e.g. for handing attendance
numbers to an accountant. A deleted member's past check-ins still show, under their anonymized
placeholder name, since deleting a member never touches the check-in log itself.

## Two-screen mode (one PC, two monitors) -- optional

When two displays are connected and **Use two screens when available** is turned on in Settings (off
by default), the app opens two separate windows instead of one: the **staff dashboard** on monitor
one (whichever display Windows considers primary -- the one staff actually sit in front of), and a
**kiosk window** on monitor two, showing only the check-in screen for the customer. With only one
display connected, or the setting off, the dashboard runs alone exactly as described elsewhere in this
document -- there's no separate kiosk window to place anywhere.

A card scan is recognised by whichever window currently has OS keyboard focus -- if that happens to
be the dashboard (e.g. staff is mid-task there when someone taps a card at the kiosk display), the
result is still pushed to the kiosk window so the customer-facing screen shows it, while the dashboard
shows a quick toast plus a **Recent check-ins** entry instead. Nothing about check-in accuracy depends
on which window catches the scan.

Toggling this setting takes effect on the **next launch**, not immediately -- it doesn't try to tear
down and rebuild windows while the app is running. The dashboard window is a normal, closable window
(not kiosk-locked, since it isn't customer-facing); if it's accidentally closed, restart the app to
get it back rather than trying to reopen it from the kiosk window, which intentionally has no way to
open the dashboard on its own in this mode.

## Kiosk lockdown

**Settings** has an **Enable kiosk lockdown** toggle: fullscreen, and blocks Alt+F4 and the window's
close button, so a member at the desk can't casually exit or minimize the check-in display. It's a
deterrent, not a real OS lockdown -- the Windows key, Ctrl+Alt+Delete, and Task Manager are outside
any application's control. Turning it off always works from Settings, since reaching that screen
already required the staff PIN. For a genuinely unbreakable kiosk, use Windows "Assigned Access" or an
equivalent locked-down account, configured on the machine itself.

This only takes effect together with **Two-screen mode** above -- there's no customer-facing display
otherwise, so it never applies to your own staff dashboard (which would otherwise trap you in a
borderless fullscreen window with no way to Alt+Tab to another app).

## Appearance

**Settings** has an **Appearance** panel: a light/dark switch, plus four color schemes --
**Slate** (obsidian & electric blue), **Zinc** (charcoal & warm amber), **Emerald** (deep forest &
mint), and **Indigo** (midnight & laser violet). The choice is saved on this PC (`localStorage`, not
the shared database) and applied before the page even paints on the next launch, so there's no flash
of the wrong theme. A dual-screen setup's kiosk and staff windows share the same choice automatically,
since they're the same page.

Approved/denied always stay a recognizable green/red regardless of which scheme is active -- only
the neutral surfaces and the accent color (buttons, active tab, focus rings) change. The interface
font is **Plus Jakarta Sans**, bundled locally (`assets/fonts/`, OFL-licensed -- see the `OFL-*.txt`
files there) with full Czech diacritic support (ěščřžáíéůú); card UIDs and timestamps use
**JetBrains Mono** for a sharper, more precise read. Both are self-hosted specifically so nothing
about this app's offline operation changes -- no fonts are ever fetched over a network.

## Data retention (GDPR)

**Settings** has a **Delete check-ins older than [N] days** field (default 730 days / ~24 months).
Every launch, the app deletes `check_ins` rows older than that on its own -- no manual step needed.
This only affects the check-in log; member profiles and payment/renewal history are untouched, since
those typically need to be kept for accounting regardless.

Combined with **Delete member…** (which anonymizes a member's identity while keeping their history
for accounting) and **Export data…** (which produces everything held about one member as a JSON
file), this covers the technical side of a right-to-erasure or right-of-access request. It doesn't
cover the non-technical side -- a privacy notice for members, a documented legal basis for collecting
their data, and so on -- which is a business/legal decision, not something this app can decide for
you.

## Backup

**Settings** inside the staff area has an **Export backup** button, which saves a copy of the live
database to a location you choose. There's no in-app *restore* -- to restore a backup, close the app
and replace `gym-checkin.sqlite` (see the path above) with the backup file, then relaunch.

## Build a Windows installer

```powershell
npm run dist
```

Produces a per-user NSIS installer (`dist\Gym Check-in Setup <version>.exe`) -- no admin rights
required, with a Start Menu shortcut and a proper uninstaller. The SQLite database and photos remain
local to the PC. No network connection is used at check-in.

The installer is currently **unsigned**, so Windows SmartScreen will show an "unknown publisher"
warning on first install (and on every update, once updates are enabled) -- see `UPDATER_SETUP.md`
for how to add a code-signing certificate later.

## Updates

Auto-updates run via `electron-updater` and GitHub Releases. The app checks automatically once a
day (on launch, at most once per 24 hours) and shows a Windows notification if a newer version is
available -- it never downloads or installs anything without staff explicitly confirming in
Settings. The "Check for updates" button there also triggers an immediate manual check any time. See
[`RELEASING.md`](RELEASING.md) for how to actually publish a new version.

## Implementation notes

- Electron renderer isolation and sandboxing are enabled, and DevTools is disabled in packaged
  builds. Database access stays in the main process behind a narrow IPC bridge; every admin IPC
  handler independently re-checks the staff-unlock state, not just the UI.
- SQLite uses WAL mode so writes are durable and reads remain responsive.
- Monthly approval requires active status and a non-expired end date.
- Punch-card approval requires active status and at least one pass. The pass decrement and check-in
  log share one database transaction, and check-ins are queued client-side so a scan is never
  silently dropped just because a previous one is still in flight.
- On a kiosk display (two-screen mode only -- the staff dashboard has no result screen of its own,
  see **Check-in notifications**), the result screen returns to ready mode after seven seconds.
- Shared UID-normalisation and date-math logic lives in `src/shared/` and is used by both the main
  process and the renderer (loaded directly as `<script>` tags -- Electron's sandboxed preload can't
  `require()` local project files), so the two sides can't quietly disagree.
- Theming (see **Appearance**) is a small, self-contained system: `theme.js` applies the saved
  `data-theme`/`data-mode` attributes to `<html>` before `styles.css` is even parsed (no flash of the
  wrong theme), and every themed color in that stylesheet is one of a handful of CSS custom
  properties (`--bg-app`, `--bg-panel`, `--bg-raised`, `--border`, `--text-main`, `--text-muted`,
  `--accent`, plus `--success`/`--danger`, fixed per light/dark mode rather than per color scheme) --
  adding a fifth color scheme means adding one more attribute-selector block of variable values, not
  touching the ~300 rules that use them.
