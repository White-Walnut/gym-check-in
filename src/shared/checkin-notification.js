// Pure text-formatting for the staff-facing OS notification shown on every check-in (see
// notifyCheckIn in src/main.js). Kept dependency-free and separate from main.js so the wording for
// every reason code -- especially the "is this card actually valid" part staff needs -- is covered
// by a plain unit test instead of only ever being seen live in a real Windows toast.

function checkinNotificationCopy(result) {
  const name = result.member?.name
    || (result.reason === 'unknown_card' ? 'Unknown card' : 'Unrecognised card');

  switch (result.reason) {
    case 'active':
      return { title: `✅ ${name}`, body: `Valid membership · valid until ${result.member.validUntil}` };
    case 'punchcard': {
      const left = result.member.passesRemaining;
      return { title: `✅ ${name}`, body: `Valid punch card · ${left} ${left === 1 ? 'pass' : 'passes'} remaining` };
    }
    case 'expired':
      return { title: `⛔ ${name}`, body: `DENIED -- membership expired ${result.member?.validUntil || ''}` };
    case 'no_passes':
      return { title: `⛔ ${name}`, body: 'DENIED -- punch card is empty' };
    case 'frozen':
      return { title: `⛔ ${name}`, body: 'DENIED -- membership is frozen' };
    case 'cancelled':
      return { title: `⛔ ${name}`, body: 'DENIED -- membership is cancelled' };
    case 'unknown_card':
      return { title: '❔ Unknown card', body: `Not recognised -- UID ${result.uid || 'n/a'}` };
    case 'system_error':
      return { title: '⚠️ Check-in error', body: 'Card was read, but the database returned an error.' };
    default:
      return { title: '⚠️ Card unreadable', body: 'Ask the member to tap their card again.' };
  }
}

module.exports = { checkinNotificationCopy };
