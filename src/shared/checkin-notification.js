// Pure text-formatting for the staff-facing OS notification shown on every check-in (see
// notifyCheckIn in src/main.js). Kept dependency-free (beyond i18n.js) and separate from main.js so
// the wording for every reason code -- especially the "is this card actually valid" part staff needs
// -- is covered by a plain unit test instead of only ever being seen live in a real Windows toast.
//
// `lang` defaults to English so every existing caller/test that doesn't pass one keeps working
// unchanged; main.js's real call site always passes the current app-wide language explicitly.
const { t, plural } = require('./i18n');

function checkinNotificationCopy(result, lang = 'en') {
  const name = result.member?.name
    || (result.reason === 'unknown_card' ? t(lang, 'common.unknownCard') : t(lang, 'common.unrecognisedCard'));

  switch (result.reason) {
    case 'active':
      return {
        title: t(lang, 'checkin.notif.approvedTitle', { name }),
        body: t(lang, 'checkin.notif.activeBody', { validUntil: result.member.validUntil })
      };
    case 'punchcard':
      return {
        title: t(lang, 'checkin.notif.approvedTitle', { name }),
        body: t(lang, 'checkin.notif.punchcardBody', {
          count: result.member.passesRemaining,
          unit: plural(lang, 'common.passUnit', result.member.passesRemaining)
        })
      };
    case 'expired':
      return {
        title: t(lang, 'checkin.notif.deniedTitle', { name }),
        body: t(lang, 'checkin.notif.expiredBody', { validUntil: result.member?.validUntil || '' })
      };
    case 'no_passes':
      return { title: t(lang, 'checkin.notif.deniedTitle', { name }), body: t(lang, 'checkin.notif.noPassesBody') };
    case 'frozen':
      return { title: t(lang, 'checkin.notif.deniedTitle', { name }), body: t(lang, 'checkin.notif.frozenBody') };
    case 'cancelled':
      return { title: t(lang, 'checkin.notif.deniedTitle', { name }), body: t(lang, 'checkin.notif.cancelledBody') };
    case 'unknown_card':
      return { title: t(lang, 'checkin.notif.unknownTitle'), body: t(lang, 'checkin.notif.unknownBody', { uid: result.uid || 'n/a' }) };
    case 'system_error':
      return { title: t(lang, 'checkin.notif.errorTitle'), body: t(lang, 'checkin.notif.errorBody') };
    default:
      return { title: t(lang, 'checkin.notif.unreadableTitle'), body: t(lang, 'checkin.notif.unreadableBody') };
  }
}

module.exports = { checkinNotificationCopy };
