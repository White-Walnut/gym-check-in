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
    discardAddMember: "This new member isn't saved yet. Discard it?",
    discardEditMember: "Your changes to this member aren't saved. Discard them?"
  },
  common: {
    approved: 'Approved',
    denied: 'Denied',
    loading: 'Loading…',
    cancel: 'Cancel',
    ok: 'OK',
    moreInfo: 'More info',
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
    subheadCard: 'Hold it near the reader.',
    subheadBarcode: 'Point the scanner at the barcode.'
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
    tabs: { add: 'Add member', renew: 'Members', history: 'Check-ins', payments: 'Payments', settings: 'Settings' }
  },

  staffLock: {
    enter: { heading: 'Enter staff PIN', pinPlaceholder: 'PIN', submit: 'Unlock', forgot: 'Forgot PIN?' },
    setup: {
      heading: 'Set a staff PIN',
      hint: 'Use 4 to 8 digits. Staff enter it to open member management.',
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
      hint: "Write it down and keep it safe. It's the only way in if the PIN is forgotten, and it won't be shown again.",
      continueButton: "I've saved it, continue"
    }
  },

  addMember: {
    cardCaptureHintCard: 'Tap an unassigned card',
    cardCaptureHintBarcode: 'Scan an unassigned barcode',
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
    tapCardToJumpCard: 'Tap the card of the member you want.',
    tapCardToJumpBarcode: 'Scan the barcode of the member you want.',
    jumpedToCard: 'Found card {uid}.',
    expiringWithin: 'Expiring within',
    days: 'days',
    show: 'Show',
    showAll: 'Show all members',
    noExpiringMembers: 'No members expiring in that window.',
    loadingMembers: 'Loading members…',
    memberCount: '{count} {unit}',
    noMatchingMembers: 'No matching members.',
    editMemberTitle: 'Edit {name}',
    plusOneMonth: '+1 month',
    plusTenPasses: '+10 passes',
    customDateButton: 'Custom date',
    // The one-glance state of a membership, decided by src/shared/member-status.js. Kept short on
    // purpose: these sit in a chip at the end of a row, next to the member's name.
    status: {
      active: 'Active',
      expiringSoon: '{count} {unit} left',
      lastDay: 'Last day',
      expired: 'Expired {date}',
      frozen: 'Frozen',
      cancelled: 'Cancelled',
      passes: '{count} {unit}',
      passesLow: '{count} {unit} left',
      noPasses: 'No passes',
      unknown: 'Unknown'
    },
    metaMonthlyUntil: 'Monthly · to {date}',
    metaMonthlyEnded: 'Monthly · ended {date}',
    metaMonthlyNoDate: 'Monthly · no end date',
    metaPunchcard: 'Punch card',
    renewedMonthly: 'Valid until {date}.',
    renewedPunchcard: '{count} {unit} on the card.',
    renewResult: '{name}: {change}',
    updatedSuccess: '{name} updated.',
    deletedSuccess: '{name} was deleted.'
  },

  edit: {
    kicker: 'EDIT MEMBER',
    titleDefault: 'Member details',
    titleEditMember: 'Edit {name}',
    titleSetEndDate: 'Set end date for {name}',
    chooseExactDate: 'Choose the last day they can come in.',
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
    amountPaid: 'Paid now (Kč)',
    exportData: 'Export data…',
    deleteMember: 'Delete member…',
    saveChanges: 'Save changes',
    photoUpdated: 'Photo updated.',
    photoRemoved: 'Photo removed.',
    dataExported: 'Data exported to {path}',
    deleteConfirm: "Delete {name}? Their name, photo and card are erased for good. Their check-ins and payments stay in the records without a name. This can't be undone.",
    discard: {
      passesLost: '{count} unused {unit}',
      daysLost: '{count} remaining {unit}',
      removes: ' This removes {parts}.',
      reactivates: ' {name} is {status} and will become active again.',
      confirm: '{name}:{lossText}{reactivateText} Continue?',
      and: 'and'
    },
    // A second, independent confirm on the Edit form's Save button, for two changes that don't lose
    // a measurable balance the way the discard block above does, so nothing else would ever catch a
    // careless click here -- see describeRiskyEditChanges in renderer.js.
    riskyChange: {
      statusChange: ' Status changes to {status}.',
      cardChange: ' Card changes from {oldUid} to {newUid}.',
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
    exportedTruncated: 'Exported the newest {count} rows. Narrow the dates to export older ones.',
    exportedOk: 'Exported {count} row(s) to {path}.'
  },

  payments: {
    memberName: 'Member name',
    searchPlaceholder: 'Search…',
    from: 'From',
    to: 'To',
    filter: 'Filter',
    clear: 'Clear',
    heading: 'Payments',
    loading: 'Loading payments…',
    exporting: 'Exporting…',
    noMatches: 'No payments match those filters.',
    totalShown: 'Total: {amount} Kč ({count} shown)',
    exportedTruncated: 'Exported the newest {count} rows. Narrow the dates to export older ones.',
    exportedOk: 'Exported {count} row(s) to {path}.',
    eventSignup: 'New member',
    eventRenewal: 'Renewal',
    rowDescription: '{event} · {plan}'
  },

  settings: {
    branding: {
      heading: 'Gym branding',
      hint: 'The name shows on the check-in screen, in the staff header and on the PIN screen. The '
        + 'logo shows in the staff header and on the PIN screen. Leave both empty for the default look.',
      chooseLogo: 'Choose logo…',
      removeLogo: 'Remove logo',
      namePlaceholder: 'Gym name',
      saveName: 'Save name',
      logoUpdated: 'Logo updated.',
      logoRemoved: 'Logo removed.',
      nameSaved: 'Name saved.'
    },
    appearance: {
      heading: 'Appearance',
      hint: 'Saved on this PC.',
      dark: 'Dark',
      light: 'Light',
      lightModeAriaLabel: 'Light mode',
      themes: {
        slate: { name: 'Blue' },
        zinc: { name: 'Orange' },
        emerald: { name: 'Teal' },
        indigo: { name: 'Purple' }
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
      hint: 'Changes the instructions and icon members see. Both devices work the same way, so pick '
        + 'the one you have at the desk.',
      card: 'Card reader',
      barcode: 'Barcode scanner'
    },
    pin: {
      heading: 'Change staff PIN',
      hint: '4 to 8 digits.',
      currentPlaceholder: 'Current PIN',
      newPlaceholder: 'New PIN',
      confirmPlaceholder: 'Confirm new PIN',
      submit: 'Update PIN',
      updated: 'PIN updated.',
      pinsDoNotMatch: 'New PINs do not match.',
      regenerateRecovery: 'Regenerate recovery code…',
      regeneratePrompt: 'Enter your current PIN to regenerate the recovery code:',
      newRecoveryCodeAlert: "New recovery code: {code}\n\nWrite it down now. It won't be shown again, and the old code no longer works."
    },
    backup: {
      heading: 'Backup',
      hint: 'Saves a copy of the member database. Photos and the logo go into a folder next to the '
        + 'backup file. Keep the two together.',
      exportButton: 'Export backup…',
      savedSuccess: 'Backup saved to {path}',
      savedSuccessWithFiles: 'Backup saved to {path}, plus {count} photo/logo file(s) in the folder next to it.',
      failed: 'Backup could not be saved.'
    },
    diagnostics: {
      heading: 'Diagnostics',
      hint: "Keeps a record of errors on this PC. Nothing is sent anywhere. If you're asked for it, "
        + 'export the file and send it.',
      exportButton: 'Export log file…',
      openFolderButton: 'Show log file in folder',
      savedSuccess: 'Log file saved to {path}'
    },
    kiosk: {
      heading: 'Kiosk lockdown',
      hintHtml: 'Shows the check-in screen full screen and blocks Alt+F4 and the close button, so '
        + "members can't close it. The Windows key, Ctrl+Alt+Delete and Task Manager still work. "
        + '<strong>Only works when two-screen mode is on.</strong>',
      enable: 'Enable kiosk lockdown'
    },
    dualScreen: {
      heading: 'Two-screen mode',
      hint: 'With two monitors connected, one shows check-in results to members and the other shows '
        + 'this dashboard. Takes effect the next time the app starts.',
      enable: 'Use two screens when available'
    },
    retention: {
      heading: 'Data retention',
      hint: 'Check-ins older than this are deleted each time the app starts. Members, payments and '
        + 'renewals are kept.',
      deleteOlderThan: 'Delete check-ins older than',
      days: 'days',
      save: 'Save',
      saved: 'Saved. Applies the next time the app starts.'
    },
    cooldown: {
      heading: 'Punch-card re-entry',
      hint: 'If a punch card is tapped again within this time, the member gets in without using '
        + 'another pass, even if the first tap used their last one. The time counts from the tap that '
        + "used a pass. Monthly members aren't affected. Set 0 to turn it off.",
      noChargeWithin: 'No extra pass charged within',
      hours: 'hours',
      save: 'Save',
      saved: 'Saved. Applies from now on.'
    },
    updates: {
      heading: 'Updates',
      currentVersion: 'Version:',
      hint: 'Checks once a day. Nothing is downloaded or installed until you confirm it here.',
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
      punchcard_recent: { eyebrow: 'WELCOME BACK', message: 'You checked in recently, so no pass was used.' },
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
      expiredBody: 'DENIED: membership expired {validUntil}',
      noPassesBody: 'DENIED: punch card is empty',
      frozenBody: 'DENIED: membership is frozen',
      cancelledBody: 'DENIED: membership is cancelled',
      unknownBody: 'Not recognised: UID {uid}',
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
    invalid_cooldown_hours: 'Enter a whole number of hours, 0 or more.',
    operation_failed: 'The change could not be saved. Try again.',
    no_log_yet: "There's no log file yet."
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
      exportPaymentsTitle: 'Export payments',
      exportMemberDataTitle: 'Export member data',
      exportBackupTitle: 'Export database backup',
      exportLogTitle: 'Export log file',
      choosePhotoTitle: 'Choose a member photo',
      chooseLogoTitle: 'Choose a gym logo',
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
      reason: 'Reason',
      date: 'Date',
      eventType: 'Type',
      membershipType: 'Plan',
      amount: 'Amount (Kč)'
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
