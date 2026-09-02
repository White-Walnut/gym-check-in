// English strings -- the canonical key set. Every other locale file must cover exactly these keys;
// see i18n.js's lookup(), which falls back to this file whenever a key is missing from the active
// language, so a partial translation never shows a blank string, just an English one.
//
// A few keys are objects instead of plain strings ({ one, few, many, other }) -- those are plural
// noun/sentence forms selected via Intl.PluralRules in i18n.js's plural(), not picked directly.
// English only ever needs "one" and "other"; Czech (see cs.js) also uses "few" (2-4) and "many".
//
// Keys ending in "Html" are inserted via innerHTML (see applyTranslations in i18n.js), not
// textContent, so they may contain simple inline tags like <strong>. Every other key is always
// injected as plain text -- never write a key expecting HTML unless its name says so.
const en = {
  // Renderer-side confirm() prompts guarding against an accidentally-lost or accidentally-risky
  // change -- see confirmDiscardAddMember/confirmDiscardEditMember/describeRiskyEditChanges in
  // renderer.js for exactly when each of these fires.
  confirm: {
    discardAddMember: "You've started adding a new member but haven't saved yet. Discard this and continue?",
    discardEditMember: "You have unsaved changes to this member's details. Discard them and continue?"
  },
  common: {
    approved: 'Approved',
    denied: 'Denied',
    loading: 'Loading…',
    cancel: 'Cancel',
    edit: 'Edit',
    unknownCard: 'Unknown card',
    unrecognisedCard: 'Unrecognised card',
    systemError: 'System error',
    passUnit: { one: 'pass', other: 'passes' },
    dayUnit: { one: 'day', other: 'days' },
    memberUnit: { one: 'member', other: 'members' },
    status: { active: 'active', frozen: 'frozen', cancelled: 'cancelled' }
  },

  topbar: {
    brandSubtitle: 'Member access',
    adminToggleAriaLabel: 'Open member management',
    adminToggleTitle: 'Member management (Tab)',
    readerReady: 'Reader ready'
  },

  // headingCard/subheadCard are shown when Settings > Scan method is "Card" (the default); the
  // Barcode variants when it's "Barcode" -- see the scanMethod handling in renderer.js, which swaps
  // the data-i18n key these elements point at rather than picking between two fixed strings, so a
  // later language switch still renders the right one (same pattern as the kiosk scan-hint).
  idle: {
    eyebrow: 'READY FOR CHECK-IN',
    headingCard: 'Tap your member card',
    headingBarcode: 'Scan your membership barcode',
    subheadCard: 'Hold the card near the reader. Approval appears instantly.',
    subheadBarcode: 'Point the scanner at your barcode. Approval appears instantly.'
  },

  result: {
    assignCardButton: 'Assign to new member'
  },

  footer: {
    testCardToggleCard: 'Test a card',
    testCardToggleBarcode: 'Test a scan',
    cardUidLabelCard: 'Card UID',
    cardUidLabelBarcode: 'Barcode',
    cardUidPlaceholder: 'Try 10000001',
    checkInSubmit: 'Check in',
    scanHintHtmlCard: 'Waiting for card <span>•</span> Tab member management <span>•</span> F11 full screen',
    scanHintHtmlBarcode: 'Waiting for barcode <span>•</span> Tab member management <span>•</span> F11 full screen',
    scanHintKioskHtmlCard: 'Waiting for card <span>•</span> F11 full screen',
    scanHintKioskHtmlBarcode: 'Waiting for barcode <span>•</span> F11 full screen'
  },

  admin: {
    kicker: 'STAFF AREA',
    title: 'Member management',
    lockAriaLabel: 'Lock and return to the PIN screen',
    lockTitle: 'Lock',
    lockLabel: 'Lock',
    tabs: { add: 'Add new member', renew: 'Renew or prolong', history: 'Check-in history', settings: 'Settings' }
  },

  staffLock: {
    enter: { heading: 'Enter staff PIN', pinPlaceholder: 'PIN', submit: 'Unlock', forgot: 'Forgot PIN?' },
    setup: {
      heading: 'Set a staff PIN',
      hint: 'Choose a 4-8 digit PIN. Reception staff will use it to open member management.',
      newPinPlaceholder: 'New PIN',
      confirmPinPlaceholder: 'Confirm PIN',
      submit: 'Set PIN',
      pinsDoNotMatch: 'PINs do not match.'
    },
    recover: {
      heading: 'Reset PIN with recovery code',
      hint: 'Enter the recovery code shown when the PIN was last set.',
      codePlaceholder: 'XXXXX-XXXXX',
      newPinPlaceholder: 'New PIN',
      confirmPinPlaceholder: 'Confirm new PIN',
      submit: 'Reset PIN',
      cancel: 'Back to PIN entry',
      pinsDoNotMatch: 'New PINs do not match.'
    },
    reveal: {
      heading: 'Your recovery code',
      hint: "Write this down and keep it somewhere safe. It's the only way back in if the staff PIN is forgotten, and it won't be shown again.",
      continueButton: "I've saved it, continue"
    }
  },

  addMember: {
    cardCaptureHintCard: 'Tap an unassigned card',
    cardCaptureHintBarcode: 'Scan an unassigned barcode',
    cardCaptureSubhint: 'The UID will appear here automatically.',
    cardCaptureWaitingCard: 'Waiting for card…',
    cardCaptureWaitingBarcode: 'Waiting for barcode…',
    scanDifferentCardCard: 'Scan a different card',
    scanDifferentCardBarcode: 'Scan a different barcode',
    firstName: 'First name',
    lastName: 'Last name',
    membershipLegend: 'Membership',
    monthlyTitle: 'Monthly',
    monthlyHint: 'Access until a fixed date',
    punchcardTitle: 'Punch card',
    punchcardHint: 'One pass used per entry',
    validUntil: 'Valid until',
    startingPasses: 'Starting passes',
    amountPaid: 'Amount paid (Kč)',
    optionalHint: 'optional',
    amountPlaceholder: 'e.g. 500',
    save: 'Save member',
    tapNextCardCard: 'Tap the next card.',
    tapNextCardBarcode: 'Scan the next barcode.',
    savedSuccessCard: '{name} saved. The card is ready.',
    savedSuccessBarcode: '{name} saved. The barcode is ready.'
  },

  renew: {
    searchLabel: 'Find by member name or card UID',
    searchPlaceholder: 'Start typing…',
    scanToFind: 'Scan to find',
    tapCardToJumpCard: 'Tap a card to jump to that member.',
    tapCardToJumpBarcode: 'Scan a barcode to jump to that member.',
    jumpedToCard: 'Jumped to card {uid}.',
    expiringWithin: 'Expiring within',
    days: 'days',
    show: 'Show',
    showAll: 'Show all members',
    noExpiringMembers: 'No members expiring in that window.',
    membersHeading: 'Members',
    loadingMembers: 'Loading members…',
    memberCount: '{count} {unit}',
    noMatchingMembers: 'No matching members.',
    editMemberTitle: 'Edit {name}',
    plusOneMonth: '+1 month',
    plusTenPasses: '+10 passes',
    customDateButton: 'Custom date',
    membershipDescriptionPunchcard: 'Punch card · {count} {unit} remaining · UID {uid}',
    membershipDescriptionMonthly: 'Monthly · Valid until {date} · UID {uid}',
    renewedMonthly: 'Monthly access extended through {date}.',
    renewedPunchcard: 'Punch card now has {count} {unit}.',
    renewResult: '{name}: {change}',
    updatedSuccess: '{name} updated.',
    deletedSuccess: '{name} was deleted.'
  },

  edit: {
    kicker: 'EDIT MEMBER',
    titleDefault: 'Member details',
    titleEditMember: 'Edit {name}',
    titleSetEndDate: 'Set end date for {name}',
    chooseExactDate: 'Choose the exact final day of access.',
    cancel: 'Cancel',
    changePhoto: 'Change photo…',
    takePhoto: 'Take photo',
    chooseFile: 'Choose file…',
    removePhoto: 'Remove photo',
    tapReplacementCardCard: 'Tap the replacement card.',
    tapReplacementCardBarcode: 'Scan the replacement barcode.',
    cardCapturedCard: 'Card {uid} captured.',
    cardCapturedBarcode: 'Barcode {uid} captured.',
    firstName: 'First name',
    lastName: 'Last name',
    cardUid: 'Card UID',
    scanReplace: 'Scan to replace',
    status: 'Status',
    statusActive: 'Active',
    statusFrozen: 'Frozen',
    statusCancelled: 'Cancelled',
    membership: 'Membership',
    membershipMonthly: 'Monthly',
    membershipPunchcard: 'Punch card',
    customEndDate: 'Custom end date',
    entriesRemaining: 'Entries remaining',
    amountPaid: 'Amount paid this visit (Kč)',
    exportData: 'Export data…',
    deleteMember: 'Delete member…',
    saveChanges: 'Save changes',
    photoUpdated: 'Photo updated.',
    photoRemoved: 'Photo removed.',
    dataExported: 'Data exported to {path}',
    deleteConfirm: "Permanently erase {name}'s name, photo, and card? Their check-in and payment history is kept, anonymized, for attendance and revenue records. This cannot be undone. Continue?",
    discard: {
      passesLost: '{count} unused {unit}',
      daysLost: '{count} remaining {unit}',
      removes: ' This removes {parts}.',
      reactivates: ' {name} is currently {status} and will be reactivated.',
      confirm: '{name}:{lossText}{reactivateText} Continue?',
      and: 'and'
    },
    // A second, independent confirm on the Edit form's Save button, for two changes that don't lose
    // a measurable balance the way the discard block above does, so nothing else would ever catch a
    // careless click here -- see describeRiskyEditChanges in renderer.js.
    riskyChange: {
      statusChange: ' Changes their status to {status}.',
      cardChange: ' Replaces their linked card (was {oldUid}, now {newUid}).',
      confirm: '{name}:{changes} Continue?'
    }
  },

  history: {
    nameOrUid: 'Name or card UID',
    searchPlaceholder: 'Search…',
    from: 'From',
    to: 'To',
    filter: 'Filter',
    clear: 'Clear',
    heading: 'Check-ins',
    loadMore: 'Load more',
    exportCsv: 'Export CSV…',
    loading: 'Loading…',
    loadingCheckIns: 'Loading check-ins…',
    exporting: 'Exporting…',
    noMatches: 'No check-ins match those filters.',
    shownCount: '{count} shown',
    exportedTruncated: 'Exported the most recent {count} matching rows — narrow the date range to get everything older.',
    exportedOk: 'Exported {count} row(s) to {path}.'
  },

  settings: {
    appearance: {
      heading: 'Appearance',
      hint: "Saved on this PC, so it doesn't need setting again next launch.",
      dark: 'Dark',
      light: 'Light',
      lightModeAriaLabel: 'Light mode',
      themes: {
        slate: { name: 'Slate', subtitle: 'Obsidian & Electric Blue' },
        zinc: { name: 'Zinc', subtitle: 'Charcoal & Warm Amber' },
        emerald: { name: 'Emerald', subtitle: 'Deep Forest & Mint' },
        indigo: { name: 'Indigo', subtitle: 'Midnight & Laser Violet' }
      }
    },
    language: {
      heading: 'Language',
      hint: 'Applies right away, on this PC only.',
      english: 'English',
      czech: 'Čeština'
    },
    scanMethod: {
      heading: 'Scan method',
      hint: 'Changes the on-screen instructions and icon to match your reader -- both a card reader '
        + 'and a barcode scanner plug in and work the same way underneath, so this is just about '
        + "showing members the right instructions for what's actually at the desk.",
      card: 'Card reader',
      barcode: 'Barcode scanner'
    },
    pin: {
      heading: 'Change staff PIN',
      currentPlaceholder: 'Current PIN',
      newPlaceholder: 'New PIN',
      confirmPlaceholder: 'Confirm new PIN',
      submit: 'Update PIN',
      updated: 'PIN updated.',
      pinsDoNotMatch: 'New PINs do not match.',
      regenerateRecovery: 'Regenerate recovery code…',
      regeneratePrompt: 'Enter your current PIN to regenerate the recovery code:',
      newRecoveryCodeAlert: "New recovery code: {code}\n\nWrite this down now -- it won't be shown again, and the old code no longer works."
    },
    backup: {
      heading: 'Backup',
      hint: 'Save a copy of the member database to a location of your choice.',
      exportButton: 'Export backup…',
      savedSuccess: 'Backup saved to {path}',
      failed: 'Backup could not be saved.'
    },
    diagnostics: {
      heading: 'Diagnostics',
      hint: "If something goes wrong, this saves a record of what happened so it can actually be "
        + "looked into -- it never leaves this PC on its own. Export it and send the file if you're "
        + 'asked to.',
      exportButton: 'Export log file…',
      openFolderButton: 'Show log file in folder',
      savedSuccess: 'Log file saved to {path}'
    },
    kiosk: {
      heading: 'Kiosk lockdown',
      hintHtml: 'Makes the customer-facing check-in display fullscreen and blocks Alt+F4 and its '
        + "close button, so a member at the desk can't casually exit or minimize it. This is a "
        + 'deterrent, not a full lockdown &mdash; the Windows key, Ctrl+Alt+Delete, and Task '
        + 'Manager still work and are outside any app\'s control. Turning this off always '
        + 'works from here, since reaching this screen already required the staff PIN. '
        + '<strong>Only takes effect when two-screen mode below is also on</strong> &mdash; '
        + "there's no customer-facing display otherwise, so this has no effect on your own "
        + 'staff dashboard.',
      enable: 'Enable kiosk lockdown'
    },
    dualScreen: {
      heading: 'Two-screen mode',
      hint: 'When two monitors are connected, use one purely for check-in results and the other '
        + 'purely for staff (no more switching between them). Only takes effect the next time '
        + 'the app starts, and only when a second display is actually detected.',
      enable: 'Use two screens when available'
    },
    retention: {
      heading: 'Data retention',
      hint: 'Check-in records older than this are deleted automatically each time the app starts. '
        + 'Member profiles and payment/renewal history are not affected by this setting.',
      deleteOlderThan: 'Delete check-ins older than',
      days: 'days',
      save: 'Save',
      saved: 'Saved. Takes effect from the next launch onward.'
    },
    updates: {
      heading: 'Updates',
      hint: 'Checks automatically once a day, and never downloads or installs anything without you '
        + 'confirming it here first. Use the button below any time for an immediate check.',
      check: 'Check for updates',
      download: 'Download update',
      install: 'Restart and install',
      checking: 'Checking…',
      checkingLong: 'Checking for updates…',
      checkFailed: 'Update check failed. See UPDATER_SETUP.md.',
      available: 'Update {version} is available.',
      upToDate: 'You are on the latest version.',
      downloadingStart: 'Downloading update…',
      downloadFailed: 'Download failed. Try again.',
      downloadingProgress: 'Downloading update… {percent}%',
      downloaded: 'Update {version} downloaded and ready.',
      errorWithMessage: 'Update check failed: {message}',
      errorGeneric: 'Update check failed.',
      installConfirm: 'This closes Gym Check-in and reopens it on the new version right away. Continue?'
    }
  },

  activity: {
    heading: 'Recent check-ins',
    empty: 'No check-ins yet.'
  },

  camera: {
    title: 'Take a photo',
    cancel: 'Cancel',
    retake: 'Retake',
    capture: 'Capture',
    usePhoto: 'Use this photo',
    starting: 'Starting camera…',
    accessFailed: 'Could not access the camera. Check permissions, and that no other app is using it.'
  },

  checkin: {
    pillPunchcard: 'Punch card · {count} remaining',
    pillExpired: 'Monthly · Expired {date}',
    pillValidUntil: 'Monthly · Valid until {date}',
    pillUidCaptured: 'UID {uid}',
    pillUidNotCaptured: 'UID not captured',
    passesRemaining: '{count} {unit} remaining',
    amountPaidPrompt: 'Amount paid (Kč), leave blank to skip:',
    reasons: {
      active: { eyebrow: 'CHECK-IN APPROVED', message: 'Welcome in. Have a good session.' },
      punchcard: { eyebrow: 'PASS APPROVED', message: '' },
      expired: { eyebrow: 'MEMBERSHIP EXPIRED', message: 'Please renew at reception before entering.' },
      no_passes: { eyebrow: 'NO PASSES REMAINING', message: 'Please renew the punch card before entering.' },
      frozen: { eyebrow: 'MEMBERSHIP FROZEN', message: 'Please speak with reception before entering.' },
      cancelled: { eyebrow: 'MEMBERSHIP CANCELLED', message: 'Please speak with reception before entering.' },
      unknown_card: { eyebrow: 'CARD NOT RECOGNISED', message: 'Assign this card or ask the member to try another one.' },
      system_error: { eyebrow: 'CHECK-IN UNAVAILABLE', message: 'The card was read, but the local database returned an error.' },
      invalid_uid: { eyebrow: 'CARD COULD NOT BE READ', message: 'Please tap again or ask at reception.' }
    },
    // Used only by src/shared/checkin-notification.js, for the OS notification -- separate wording
    // from `reasons` above because the notification is a single line, not an eyebrow + message pair.
    notif: {
      approvedTitle: '✅ {name}',
      deniedTitle: '⛔ {name}',
      unknownTitle: '❔ Unknown card',
      errorTitle: '⚠️ Check-in error',
      unreadableTitle: '⚠️ Card unreadable',
      activeBody: 'Valid membership · valid until {validUntil}',
      punchcardBody: 'Valid punch card · {count} {unit} remaining',
      expiredBody: 'DENIED -- membership expired {validUntil}',
      noPassesBody: 'DENIED -- punch card is empty',
      frozenBody: 'DENIED -- membership is frozen',
      cancelledBody: 'DENIED -- membership is cancelled',
      unknownBody: 'Not recognised -- UID {uid}',
      errorBody: 'Card was read, but the database returned an error.',
      unreadableBody: 'Ask the member to tap their card again.'
    }
  },

  errors: {
    invalid_uid: 'Tap a valid card before saving.',
    invalid_name: 'Enter the member’s first and last name.',
    invalid_membership_type: 'Choose a valid membership type.',
    invalid_status: 'Choose a valid member status.',
    invalid_date: 'Choose a valid end date.',
    invalid_passes: 'Enter at least one starting pass.',
    invalid_member: 'Choose a valid member.',
    member_not_found: 'That member could not be found.',
    card_exists: 'This card is already assigned to a member.',
    not_authorized: 'Your staff session expired. Please unlock again.',
    invalid_pin: 'PIN must be 4-8 digits.',
    wrong_pin: 'Incorrect current PIN.',
    wrong_recovery_code: 'Incorrect recovery code.',
    locked_out: 'Too many attempts. Please wait a moment and try again.',
    invalid_amount: 'Enter a valid amount, or leave it blank.',
    invalid_photo: 'Choose a JPG, PNG, or WEBP image under 8MB.',
    invalid_retention_days: 'Enter a whole number of days, 1 or more.',
    operation_failed: 'The change could not be saved. Try again.',
    no_log_yet: "Nothing has been logged yet -- there's no file to export."
  },

  // Main-process-only strings: native dialog titles/filters and CSV export column headers. Kept in
  // the same file (not a separate one) so a translator only ever has to look in one place per
  // language, even though these never reach the renderer.
  main: {
    confirm: {
      quit: 'Quitting will stop members from checking in until the app is reopened. Continue?',
      quitWithUnsavedChanges: 'Quitting will stop members from checking in, and unsaved changes in an open form will be lost. Continue?',
      quitCancel: 'Cancel',
      quitConfirm: 'Quit'
    },
    dialogs: {
      exportHistoryTitle: 'Export check-in history',
      exportMemberDataTitle: 'Export member data',
      exportBackupTitle: 'Export database backup',
      exportLogTitle: 'Export log file',
      choosePhotoTitle: 'Choose a member photo',
      csvFilterName: 'CSV',
      jsonFilterName: 'JSON',
      sqliteFilterName: 'SQLite database',
      textFilterName: 'Text file',
      imagesFilterName: 'Images'
    },
    csv: {
      checkedInAt: 'Checked in at',
      name: 'Name',
      cardUid: 'Card UID',
      outcome: 'Outcome',
      reason: 'Reason'
    }
  }
};

// CommonJS (required by main.js) *and* a plain browser <script>, loaded directly by index.html
// before i18n.js -- see src/shared/dates.js for why (sandboxed preload can't require() local files).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = en;
} else {
  window.GYM_LOCALES = window.GYM_LOCALES || {};
  window.GYM_LOCALES.en = en;
}
