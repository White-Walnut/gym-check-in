// What a member's membership actually IS, right now, as one small decided value -- so the member
// list can show a state at a glance instead of asking staff to read a sentence and work it out.
//
// This exists because "Monthly · Valid until 1/1/2020 · UID 10000002" and "Monthly · Valid until
// 12/31/2099 · UID 10000001" rendered identically in the list: same weight, same colour, the only
// difference buried mid-sentence in a date. At a reception desk the useful question is never "what
// does this row say", it is "does this person need to pay". So the decision is made here, once, and
// the renderer only styles and translates it.
//
// Returns { key, tone, params }:
//   key    -- the i18n key suffix under renew.status.* (never a translated string: this module is
//             language-agnostic on purpose, which is also what makes it testable in plain Node)
//   tone   -- 'neutral' | 'warn' | 'danger' | 'muted', i.e. how loudly to render it. Only states
//             that need someone to DO something get warn/danger; a healthy membership stays quiet,
//             which is what stops the list turning into a wall of colour.
//   params -- interpolation values for that key ({ count } or { date })
//
// `member` uses the client/formatMember shape ({ membershipType, membershipStatus, passesRemaining,
// validUntil }); `today` is an ISO date string, passed in rather than read from the clock so this
// stays pure.

// Same dual-environment trick as renewal.js: require() in the main process and tests, and in the
// browser dates.js has already been loaded as a plain <script>, so its top-level declarations are
// on globalThis. Named distinctly to avoid clashing with that existing global binding.
const statusInclusiveDays = typeof require !== 'undefined' ? require('./dates').inclusiveDays : globalThis.inclusiveDays;

// A membership expiring within this many days is worth flagging at the desk while the member is
// standing there. Matches the default of the list's own "Expiring within [N] days" control.
const EXPIRING_SOON_DAYS = 7;

function memberStatus(member, today, expiringSoonDays = EXPIRING_SOON_DAYS) {
  if (!member) return { key: 'unknown', tone: 'muted', params: {} };

  // Frozen and cancelled outrank everything else: whatever the balance says, this card will be
  // refused at the reader, so that is the fact staff need. Deliberately muted rather than red --
  // it is a decision someone already made on purpose, not a problem to fix.
  if (member.membershipStatus === 'frozen') return { key: 'frozen', tone: 'muted', params: {} };
  if (member.membershipStatus === 'cancelled') return { key: 'cancelled', tone: 'muted', params: {} };

  if (member.membershipType === 'punchcard') {
    const passes = Number(member.passesRemaining) || 0;
    if (passes <= 0) return { key: 'noPasses', tone: 'danger', params: { count: 0 } };
    // A nearly-empty card is the punch-card equivalent of "expiring soon": worth mentioning now,
    // while they are at the desk, rather than the next time they are turned away.
    if (passes <= 2) return { key: 'passesLow', tone: 'warn', params: { count: passes } };
    return { key: 'passes', tone: 'neutral', params: { count: passes } };
  }

  if (!member.validUntil) return { key: 'expired', tone: 'danger', params: { date: null } };
  if (member.validUntil < today) return { key: 'expired', tone: 'danger', params: { date: member.validUntil } };

  // inclusiveDays counts both endpoints, so subtracting one gives whole days left AFTER today:
  // 0 means access ends tonight.
  const daysLeft = statusInclusiveDays(today, member.validUntil) - 1;
  if (daysLeft === 0) return { key: 'lastDay', tone: 'warn', params: { date: member.validUntil } };
  if (daysLeft <= expiringSoonDays) return { key: 'expiringSoon', tone: 'warn', params: { count: daysLeft } };
  return { key: 'active', tone: 'neutral', params: { date: member.validUntil } };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { memberStatus, EXPIRING_SOON_DAYS };
}
