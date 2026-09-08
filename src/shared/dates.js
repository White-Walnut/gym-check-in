// Pure UID/date helpers shared between the main process (src/database.js) and the renderer, which
// loads this file directly as a <script> tag (see src/renderer/index.html) rather than through
// preload/contextBridge -- Electron's sandboxed preload can't require() local project files. Keeping
// a single implementation means the renderer's date previews can never quietly drift from the
// authoritative server-side calculation.

const MEMBERSHIP_TYPES = new Set(['monthly', 'punchcard']);

function normaliseUid(value) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function inclusiveDays(startDateString, endDateString) {
  const start = new Date(`${startDateString}T12:00:00`);
  const end = new Date(`${endDateString}T12:00:00`);
  return Math.max(0, Math.round((end - start) / 86_400_000) + 1);
}

// Shape *and* calendar validity. The shape test alone is not enough at the database/IPC boundary:
// JavaScript's own date parsing silently normalises impossible dates (2026-02-30 becomes March 2),
// so a plain Date.parse() check accepted a day that does not exist and stored it as a membership end
// date. A browser <input type="date"> blocks that through the ordinary form, but the boundary is
// reachable without it. Validating the components and then round-tripping them through a real Date
// is what rejects a normalised day: a Date built from 2026-02-30 reports day 2 of March, which no
// longer matches what was asked for. setFullYear is used rather than the `new Date(year, ...)`
// constructor because that constructor maps years 0-99 onto 1900-1999, which would wrongly fail the
// round-trip for a four-digit year like 0050.
function isIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(2000, 0, 1, 12);
  probe.setFullYear(year, month - 1, day);
  return probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day;
}

/**
 * A monthly membership runs from its start date through the same calendar day next month, minus
 * one day (e.g. 2026-08-28 through 2026-09-27). When the target month is too short to contain that
 * day (e.g. day 31 in February), the date is clamped to the target month's last day before
 * subtracting one.
 *
 * `anchorDay`, when provided, is used as the target day-of-month instead of `startDateString`'s own
 * day. This is what makes renewals anchor-preserving: a Jan-31 signup that gets clamped to Feb 27
 * should still be computed against "day 31" for March, April, etc., not against "day 27" (Feb 27's
 * own day-of-month) -- otherwise a single short month permanently drags every later month down with
 * it. Callers pass the member's stored `billing_anchor_day` here; omit it for a brand-new period
 * whose anchor IS `startDateString`'s day.
 */
function membershipEndDate(startDateString, months = 1, anchorDay = null) {
  const [year, month, day] = startDateString.split('-').map(Number);
  const targetDay = anchorDay ?? day;
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayInTargetMonth = new Date(targetYear, targetMonth + 1, 0, 12).getDate();
  const sameDayNextMonth = new Date(targetYear, targetMonth, Math.min(targetDay, lastDayInTargetMonth), 12);
  sameDayNextMonth.setDate(sameDayNextMonth.getDate() - 1);
  return localDateString(sameDayNextMonth);
}

// CommonJS (required by main.js/database.js) *and* a plain browser <script> (loaded directly by
// index.html, same directory as renderer.js/scan-router.js). It can't go through preload's
// contextBridge because Electron's sandboxed preload only resolves a small built-in module
// allowlist, not arbitrary local files -- see src/renderer/index.html for how this is loaded.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MEMBERSHIP_TYPES,
    normaliseUid,
    localDateString,
    addDays,
    inclusiveDays,
    isIsoDate,
    membershipEndDate
  };
}
