// Pure decision logic for whether a plan-conversion (via the quick "+1 month" / "+10 passes"
// buttons, or an Edit that changes membership type) would silently discard something the member
// already has. Shared between src/database.js (which uses it to write an honest subscription note)
// and the renderer (loaded directly as a <script>, see src/renderer/index.html -- sandboxed preload
// can't require() local files, so this can't go through contextBridge) to decide whether to show a
// confirmation prompt before calling the mutating IPC at all.
//
// `member` uses the client/formatMember shape: { membershipType, membershipStatus, passesRemaining,
// validUntil }. `today` is an ISO date string (YYYY-MM-DD), passed in rather than computed here to
// keep this function pure and trivially testable.

// In Node (main.js/database.js) this pulls inclusiveDays from ./dates via require(); in the browser,
// dates.js is loaded first as a plain <script>, so `inclusiveDays` is already declared as a function
// in this shared top-level scope -- naming this anything else avoids an "already declared" clash with
// that existing binding.
const sharedInclusiveDays = typeof require !== 'undefined' ? require('./dates').inclusiveDays : globalThis.inclusiveDays;

function wouldDiscardBalance(member, renewalType, today) {
  const reactivates = Boolean(member) && member.membershipStatus !== 'active';

  if (!member) {
    return { discardsPasses: false, passesLost: 0, discardsDays: false, daysLost: 0, reactivates: false };
  }

  const discardsPasses = renewalType === 'punchcard'
    ? false
    : member.membershipType === 'punchcard' && member.passesRemaining > 0;
  const passesLost = discardsPasses ? member.passesRemaining : 0;

  const discardsDays = renewalType === 'monthly'
    ? false
    : member.membershipType === 'monthly' && Boolean(member.validUntil) && member.validUntil >= today;
  const daysLost = discardsDays ? sharedInclusiveDays(today, member.validUntil) : 0;

  return { discardsPasses, passesLost, discardsDays, daysLost, reactivates };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { wouldDiscardBalance };
}
