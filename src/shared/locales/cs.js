// Czech strings.
//
// *** DRAFT -- UNREVIEWED. I am not a native or fluent Czech speaker. Every value below is a
// first-pass translation for a native/fluent speaker to check before this ships (grammar, tone,
// natural phrasing, and correctness of the plural forms all need a real review). Treat this file as
// a starting point, not a finished translation. ***
//
// Must cover the same keys as en.js -- see that file's own header comment for the plural-object and
// "...Html" key conventions. Czech plural nouns use one/few/other (not "many" -- for a whole-number
// count, Czech's CLDR "many" category only ever applies to non-integers, so it never gets selected
// here; "other" is what a whole 0 or 5+ count actually falls into).
const cs = {
  confirm: {
    discardAddMember: 'Začali jste přidávat nového člena, ale ještě jste to neuložili. Zahodit rozepsané údaje a pokračovat?',
    discardEditMember: 'Máte neuložené změny u tohoto člena. Zahodit je a pokračovat?'
  },
  common: {
    approved: 'Schváleno',
    denied: 'Zamítnuto',
    loading: 'Načítání…',
    cancel: 'Zrušit',
    edit: 'Upravit',
    unknownCard: 'Neznámá karta',
    unrecognisedCard: 'Nerozpoznaná karta',
    systemError: 'Systémová chyba',
    passUnit: { one: 'vstup', few: 'vstupy', other: 'vstupů' },
    dayUnit: { one: 'den', few: 'dny', other: 'dní' },
    memberUnit: { one: 'člen', few: 'členové', other: 'členů' },
    status: { active: 'aktivní', frozen: 'pozastaveno', cancelled: 'zrušeno' }
  },

  topbar: {
    brandSubtitle: 'Přístup členů',
    adminToggleAriaLabel: 'Otevřít správu členů',
    adminToggleTitle: 'Správa členů (Tab)',
    readerReady: 'Čtečka připravena'
  },

  idle: {
    eyebrow: 'PŘIPRAVENO K PŘÍCHODU',
    headingCard: 'Přiložte svou členskou kartu',
    headingBarcode: 'Naskenujte svůj čárový kód členství',
    subheadCard: 'Podržte kartu u čtečky. Schválení se zobrazí okamžitě.',
    subheadBarcode: 'Namiřte skener na čárový kód. Schválení se zobrazí okamžitě.'
  },

  result: {
    assignCardButton: 'Přiřadit novému členovi'
  },

  footer: {
    testCardToggleCard: 'Otestovat kartu',
    testCardToggleBarcode: 'Otestovat sken',
    cardUidLabelCard: 'UID karty',
    cardUidLabelBarcode: 'Čárový kód',
    cardUidPlaceholder: 'Zkuste 10000001',
    checkInSubmit: 'Zapsat příchod',
    scanHintHtmlCard: 'Čeká se na kartu <span>•</span> Tab správa členů <span>•</span> F11 celá obrazovka',
    scanHintHtmlBarcode: 'Čeká se na čárový kód <span>•</span> Tab správa členů <span>•</span> F11 celá obrazovka',
    scanHintKioskHtmlCard: 'Čeká se na kartu <span>•</span> F11 celá obrazovka',
    scanHintKioskHtmlBarcode: 'Čeká se na čárový kód <span>•</span> F11 celá obrazovka'
  },

  admin: {
    kicker: 'PRO PERSONÁL',
    title: 'Správa členů',
    lockAriaLabel: 'Uzamknout a vrátit se na obrazovku PIN',
    lockTitle: 'Uzamknout',
    lockLabel: 'Uzamknout',
    tabs: { add: 'Přidat nového člena', renew: 'Obnovit / prodloužit', history: 'Historie příchodů', settings: 'Nastavení' }
  },

  staffLock: {
    enter: { heading: 'Zadejte PIN personálu', pinPlaceholder: 'PIN', submit: 'Odemknout', forgot: 'Zapomenutý PIN?' },
    setup: {
      heading: 'Nastavte PIN personálu',
      hint: 'Zvolte 4-8místný PIN. Personál recepce jej použije k otevření správy členů.',
      newPinPlaceholder: 'Nový PIN',
      confirmPinPlaceholder: 'Potvrďte PIN',
      submit: 'Nastavit PIN',
      pinsDoNotMatch: 'PINy se neshodují.'
    },
    recover: {
      heading: 'Obnovit PIN pomocí obnovovacího kódu',
      hint: 'Zadejte obnovovací kód zobrazený při posledním nastavení PIN.',
      codePlaceholder: 'XXXXX-XXXXX',
      newPinPlaceholder: 'Nový PIN',
      confirmPinPlaceholder: 'Potvrďte nový PIN',
      submit: 'Obnovit PIN',
      cancel: 'Zpět na zadání PIN',
      pinsDoNotMatch: 'Nové PINy se neshodují.'
    },
    reveal: {
      heading: 'Váš obnovovací kód',
      hint: 'Zapište si jej a uschovejte na bezpečném místě. Je to jediný způsob, jak se dostat zpět, pokud je PIN personálu zapomenut, a znovu se nezobrazí.',
      continueButton: 'Uloženo, pokračovat'
    }
  },

  addMember: {
    cardCaptureHintCard: 'Přiložte nepřiřazenou kartu',
    cardCaptureHintBarcode: 'Naskenujte nepřiřazený čárový kód',
    cardCaptureSubhint: 'UID se zde zobrazí automaticky.',
    cardCaptureWaitingCard: 'Čeká se na kartu…',
    cardCaptureWaitingBarcode: 'Čeká se na čárový kód…',
    scanDifferentCardCard: 'Načíst jinou kartu',
    scanDifferentCardBarcode: 'Naskenovat jiný čárový kód',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    membershipLegend: 'Členství',
    monthlyTitle: 'Měsíční',
    monthlyHint: 'Přístup do pevného data',
    punchcardTitle: 'Permanentka',
    punchcardHint: 'Za každý vstup se odečte jeden vstup',
    validUntil: 'Platnost do',
    startingPasses: 'Počáteční počet vstupů',
    amountPaid: 'Zaplacená částka (Kč)',
    optionalHint: 'volitelné',
    amountPlaceholder: 'např. 500',
    save: 'Uložit člena',
    tapNextCardCard: 'Přiložte další kartu.',
    tapNextCardBarcode: 'Naskenujte další čárový kód.',
    savedSuccessCard: '{name} uložen(a). Karta je připravena.',
    savedSuccessBarcode: '{name} uložen(a). Čárový kód je připraven.'
  },

  renew: {
    searchLabel: 'Najít podle jména člena nebo UID karty',
    searchPlaceholder: 'Začněte psát…',
    scanToFind: 'Najít přiložením karty',
    tapCardToJumpCard: 'Přiložte kartu pro přechod na daného člena.',
    tapCardToJumpBarcode: 'Naskenujte čárový kód pro přechod na daného člena.',
    jumpedToCard: 'Přechod na kartu {uid}.',
    expiringWithin: 'Vyprší do',
    days: 'dní',
    show: 'Zobrazit',
    showAll: 'Zobrazit všechny členy',
    noExpiringMembers: 'V tomto období nikomu nevyprší členství.',
    membersHeading: 'Členové',
    loadingMembers: 'Načítání členů…',
    memberCount: '{count} {unit}',
    noMatchingMembers: 'Žádní odpovídající členové.',
    editMemberTitle: 'Upravit {name}',
    plusOneMonth: '+1 měsíc',
    plusTenPasses: '+10 vstupů',
    customDateButton: 'Vlastní datum',
    membershipDescriptionPunchcard: 'Permanentka · zbývá {count} {unit} · UID {uid}',
    membershipDescriptionMonthly: 'Měsíční · platnost do {date} · UID {uid}',
    renewedMonthly: 'Měsíční přístup prodloužen do {date}.',
    renewedPunchcard: 'Permanentka nyní obsahuje {count} {unit}.',
    renewResult: '{name}: {change}',
    updatedSuccess: '{name} aktualizován(a).',
    deletedSuccess: '{name} byl(a) odstraněn(a).'
  },

  edit: {
    kicker: 'ÚPRAVA ČLENA',
    titleDefault: 'Údaje o členovi',
    titleEditMember: 'Upravit {name}',
    titleSetEndDate: 'Nastavit konec platnosti pro {name}',
    chooseExactDate: 'Zvolte přesný poslední den přístupu.',
    cancel: 'Zrušit',
    changePhoto: 'Změnit fotku…',
    takePhoto: 'Vyfotit',
    chooseFile: 'Vybrat soubor…',
    removePhoto: 'Odebrat fotku',
    tapReplacementCardCard: 'Přiložte náhradní kartu.',
    tapReplacementCardBarcode: 'Naskenujte náhradní čárový kód.',
    cardCapturedCard: 'Karta {uid} načtena.',
    cardCapturedBarcode: 'Čárový kód {uid} načten.',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    cardUid: 'UID karty',
    scanReplace: 'Nahradit kartu přiložením',
    status: 'Stav',
    statusActive: 'Aktivní',
    statusFrozen: 'Pozastaveno',
    statusCancelled: 'Zrušeno',
    membership: 'Členství',
    membershipMonthly: 'Měsíční',
    membershipPunchcard: 'Permanentka',
    customEndDate: 'Vlastní konec platnosti',
    entriesRemaining: 'Zbývající vstupy',
    amountPaid: 'Zaplaceno při této návštěvě (Kč)',
    exportData: 'Exportovat data…',
    deleteMember: 'Odstranit člena…',
    saveChanges: 'Uložit změny',
    photoUpdated: 'Fotka aktualizována.',
    photoRemoved: 'Fotka odebrána.',
    dataExported: 'Data exportována do {path}',
    deleteConfirm: 'Trvale smazat jméno, fotku a kartu člena {name}? Historie příchodů a plateb zůstane zachována, anonymizovaná, pro účely docházky a evidence tržeb. Tuto akci nelze vrátit zpět. Pokračovat?',
    discard: {
      passesLost: '{count} nevyužitých {unit}',
      daysLost: '{count} zbývajících {unit}',
      removes: ' Tímto se odstraní {parts}.',
      reactivates: ' {name} je momentálně {status} a bude znovu aktivován(a).',
      confirm: '{name}:{lossText}{reactivateText} Pokračovat?',
      and: 'a'
    },
    riskyChange: {
      statusChange: ' Změní jejich stav na {status}.',
      cardChange: ' Nahradí jejich přiřazenou kartu (byla {oldUid}, nově {newUid}).',
      confirm: '{name}:{changes} Pokračovat?'
    }
  },

  history: {
    nameOrUid: 'Jméno nebo UID karty',
    searchPlaceholder: 'Hledat…',
    from: 'Od',
    to: 'Do',
    filter: 'Filtrovat',
    clear: 'Vymazat',
    heading: 'Příchody',
    loadMore: 'Načíst další',
    exportCsv: 'Exportovat CSV…',
    loading: 'Načítání…',
    loadingCheckIns: 'Načítání příchodů…',
    exporting: 'Exportuji…',
    noMatches: 'Žádné příchody neodpovídají zadaným filtrům.',
    shownCount: 'Zobrazeno: {count}',
    exportedTruncated: 'Exportováno posledních {count} odpovídajících řádků — zúžte rozsah dat pro získání starších záznamů.',
    exportedOk: 'Exportováno {count} řádků do {path}.'
  },

  settings: {
    appearance: {
      heading: 'Vzhled',
      hint: 'Toto nastavení se uloží a příště ho už nastavovat nemusíte.',
      dark: 'Tmavý',
      light: 'Světlý',
      lightModeAriaLabel: 'Světlý režim',
      themes: {
        slate: { name: 'Slate', subtitle: 'Tmavě modrá a modrý akcent' },
        zinc: { name: 'Zinc', subtitle: 'Tmavě šedá a oranžový akcent' },
        emerald: { name: 'Emerald', subtitle: 'Tmavě zelená a zelený akcent' },
        indigo: { name: 'Indigo', subtitle: 'Tmavě fialová a fialový akcent' }
      }
    },
    language: {
      heading: 'Jazyk',
      hint: 'Změna se projeví okamžitě, jen v tomto počítači.',
      english: 'English',
      czech: 'Čeština'
    },
    scanMethod: {
      heading: 'Způsob skenování',
      hint: 'Změní pokyny a ikonu na obrazovce podle vaší čtečky -- čtečka karet i skener čárových '
        + 'kódů se připojují a fungují stejně, jde jen o to ukázat členům správné pokyny pro to, '
        + 'co skutečně máte na recepci.',
      card: 'Čtečka karet',
      barcode: 'Skener čárových kódů'
    },
    pin: {
      heading: 'Změnit PIN personálu',
      currentPlaceholder: 'Současný PIN',
      newPlaceholder: 'Nový PIN',
      confirmPlaceholder: 'Potvrďte nový PIN',
      submit: 'Aktualizovat PIN',
      updated: 'PIN aktualizován.',
      pinsDoNotMatch: 'Nové PINy se neshodují.',
      regenerateRecovery: 'Vygenerovat nový obnovovací kód…',
      regeneratePrompt: 'Zadejte současný PIN pro vygenerování nového obnovovacího kódu:',
      newRecoveryCodeAlert: 'Nový obnovovací kód: {code}\n\nZapište si jej hned teď -- znovu se nezobrazí a starý kód přestane fungovat.'
    },
    backup: {
      heading: 'Záloha',
      hint: 'Uložte kopii databáze členů na místo dle vašeho výběru.',
      exportButton: 'Exportovat zálohu…',
      savedSuccess: 'Záloha uložena do {path}',
      failed: 'Zálohu se nepodařilo uložit.'
    },
    diagnostics: {
      heading: 'Diagnostika',
      hint: 'Pokud něco selže, uloží se záznam o tom, co se stalo, aby to bylo možné skutečně '
        + 'prošetřit -- z tohoto počítače se sám od sebe nikam neodesílá. Exportujte jej a soubor '
        + 'pošlete, pokud o to budete požádáni.',
      exportButton: 'Exportovat log…',
      openFolderButton: 'Zobrazit soubor s logem ve složce',
      savedSuccess: 'Log uložen do {path}'
    },
    kiosk: {
      heading: 'Kioskový režim',
      hintHtml: 'Zobrazí zákaznickou obrazovku přes celou obrazovku a zablokuje Alt+F4 i tlačítko '
        + 'zavřít, aby ji člen u recepce omylem nezavřel nebo neminimalizoval. Nejde o úplné '
        + 'uzamčení počítače &mdash; klávesa Windows, Ctrl+Alt+Delete a Správce úloh fungují dál. '
        + 'Vypnout to můžete odsud vždy. '
        + '<strong>Projeví se jen společně se zapnutým režimem dvou obrazovek níže</strong> '
        + '&mdash; bez druhé, zákaznické obrazovky toto nastavení nic neovlivní.',
      enable: 'Povolit kioskový režim'
    },
    dualScreen: {
      heading: 'Režim dvou obrazovek',
      hint: 'Pokud jsou připojeny dva monitory, použijte jeden výhradně pro výsledky příchodů a '
        + 'druhý výhradně pro personál (už žádné přepínání mezi nimi). Projeví se až při dalším '
        + 'spuštění aplikace, a pouze pokud je skutečně rozpoznán druhý displej.',
      enable: 'Používat dvě obrazovky, pokud jsou dostupné'
    },
    retention: {
      heading: 'Uchovávání dat',
      hint: 'Záznamy o příchodech starší než toto se automaticky smažou při každém spuštění '
        + 'aplikace. Profily členů a historie plateb/obnovení nejsou tímto nastavením dotčeny.',
      deleteOlderThan: 'Smazat příchody starší než',
      days: 'dní',
      save: 'Uložit',
      saved: 'Uloženo. Projeví se od dalšího spuštění.'
    },
    updates: {
      heading: 'Aktualizace',
      hint: 'Kontrola aktualizací probíhá automaticky jednou denně. Nic se nestáhne ani '
        + 'nenainstaluje bez vašeho potvrzení. Tlačítkem níže si aktualizaci můžete kdykoli '
        + 'vyžádat i ručně.',
      check: 'Zkontrolovat aktualizace',
      download: 'Stáhnout aktualizaci',
      install: 'Restartovat a nainstalovat',
      checking: 'Kontroluji…',
      checkingLong: 'Kontroluji aktualizace…',
      checkFailed: 'Kontrola aktualizací selhala. Viz UPDATER_SETUP.md.',
      available: 'Je dostupná aktualizace {version}.',
      upToDate: 'Máte nejnovější verzi.',
      downloadingStart: 'Stahuji aktualizaci…',
      downloadFailed: 'Stažení selhalo. Zkuste to znovu.',
      downloadingProgress: 'Stahuji aktualizaci… {percent} %',
      downloaded: 'Aktualizace {version} stažena a připravena.',
      errorWithMessage: 'Kontrola aktualizací selhala: {message}',
      errorGeneric: 'Kontrola aktualizací selhala.',
      installConfirm: 'Tímto se Gym Check-in zavře a znovu otevře v nové verzi. Pokračovat?'
    }
  },

  activity: {
    heading: 'Poslední příchody',
    empty: 'Zatím žádné příchody.'
  },

  camera: {
    title: 'Vyfotit',
    cancel: 'Zrušit',
    retake: 'Vyfotit znovu',
    capture: 'Vyfotit',
    usePhoto: 'Použít tuto fotku',
    starting: 'Spouštím kameru…',
    accessFailed: 'Nepodařilo se získat přístup ke kameře. Zkontrolujte oprávnění a že ji '
      + 'nepoužívá jiná aplikace.'
  },

  checkin: {
    pillPunchcard: 'Permanentka · zbývá {count}',
    pillExpired: 'Měsíční · vypršelo {date}',
    pillValidUntil: 'Měsíční · platnost do {date}',
    pillUidCaptured: 'UID {uid}',
    pillUidNotCaptured: 'UID nezachyceno',
    passesRemaining: 'zbývá {count} {unit}',
    amountPaidPrompt: 'Zaplacená částka (Kč), ponechte prázdné pro přeskočení:',
    reasons: {
      active: { eyebrow: 'PŘÍCHOD SCHVÁLEN', message: 'Vítejte. Přejeme dobrý trénink.' },
      punchcard: { eyebrow: 'VSTUP SCHVÁLEN', message: '' },
      expired: { eyebrow: 'ČLENSTVÍ VYPRŠELO', message: 'Před vstupem prosím obnovte členství na recepci.' },
      no_passes: { eyebrow: 'ŽÁDNÉ ZBÝVAJÍCÍ VSTUPY', message: 'Před vstupem prosím obnovte permanentku.' },
      frozen: { eyebrow: 'ČLENSTVÍ POZASTAVENO', message: 'Před vstupem se prosím obraťte na recepci.' },
      cancelled: { eyebrow: 'ČLENSTVÍ ZRUŠENO', message: 'Před vstupem se prosím obraťte na recepci.' },
      unknown_card: { eyebrow: 'KARTA NEROZPOZNÁNA', message: 'Přiřaďte tuto kartu, nebo požádejte člena o zkoušku jiné.' },
      system_error: { eyebrow: 'PŘÍCHOD NEDOSTUPNÝ', message: 'Karta byla načtena, ale lokální databáze vrátila chybu.' },
      invalid_uid: { eyebrow: 'KARTU SE NEPODAŘILO NAČÍST', message: 'Zkuste to prosím znovu, nebo se obraťte na recepci.' }
    },
    notif: {
      approvedTitle: '✅ {name}',
      deniedTitle: '⛔ {name}',
      unknownTitle: '❔ Neznámá karta',
      errorTitle: '⚠️ Chyba příchodu',
      unreadableTitle: '⚠️ Kartu nelze načíst',
      activeBody: 'Platné členství · platnost do {validUntil}',
      punchcardBody: 'Platná permanentka · zbývá {count} {unit}',
      expiredBody: 'ZAMÍTNUTO -- členství vypršelo {validUntil}',
      noPassesBody: 'ZAMÍTNUTO -- permanentka je prázdná',
      frozenBody: 'ZAMÍTNUTO -- členství je pozastaveno',
      cancelledBody: 'ZAMÍTNUTO -- členství je zrušeno',
      unknownBody: 'Nerozpoznáno -- UID {uid}',
      errorBody: 'Karta byla načtena, ale databáze vrátila chybu.',
      unreadableBody: 'Požádejte člena, aby kartu přiložil znovu.'
    }
  },

  errors: {
    invalid_uid: 'Před uložením přiložte platnou kartu.',
    invalid_name: 'Zadejte jméno a příjmení člena.',
    invalid_membership_type: 'Zvolte platný typ členství.',
    invalid_status: 'Zvolte platný stav člena.',
    invalid_date: 'Zvolte platné datum konce.',
    invalid_passes: 'Zadejte alespoň jeden počáteční vstup.',
    invalid_member: 'Zvolte platného člena.',
    member_not_found: 'Tento člen nebyl nalezen.',
    card_exists: 'Tato karta je již přiřazena jinému členovi.',
    not_authorized: 'Vaše relace personálu vypršela. Odemkněte prosím znovu.',
    invalid_pin: 'PIN musí mít 4-8 číslic.',
    wrong_pin: 'Nesprávný současný PIN.',
    wrong_recovery_code: 'Nesprávný obnovovací kód.',
    locked_out: 'Příliš mnoho pokusů. Počkejte chvíli a zkuste to znovu.',
    invalid_amount: 'Zadejte platnou částku, nebo pole ponechte prázdné.',
    invalid_photo: 'Vyberte obrázek JPG, PNG nebo WEBP do 8 MB.',
    invalid_retention_days: 'Zadejte celé číslo dní, 1 nebo více.',
    operation_failed: 'Změnu se nepodařilo uložit. Zkuste to znovu.',
    no_log_yet: 'Zatím nebylo nic zaznamenáno -- není co exportovat.'
  },

  main: {
    confirm: {
      quit: 'Ukončením aplikace se zastaví příchody členů, dokud ji znovu nespustíte. Pokračovat?',
      quitWithUnsavedChanges: 'Ukončením aplikace se zastaví příchody členů a ztratí se neuložené změny v otevřeném formuláři. Pokračovat?',
      quitCancel: 'Zrušit',
      quitConfirm: 'Ukončit'
    },
    dialogs: {
      exportHistoryTitle: 'Export historie příchodů',
      exportMemberDataTitle: 'Export dat člena',
      exportBackupTitle: 'Export zálohy databáze',
      exportLogTitle: 'Export logu',
      choosePhotoTitle: 'Vybrat fotku člena',
      csvFilterName: 'CSV',
      jsonFilterName: 'JSON',
      sqliteFilterName: 'Databáze SQLite',
      textFilterName: 'Textový soubor',
      imagesFilterName: 'Obrázky'
    },
    csv: {
      checkedInAt: 'Čas příchodu',
      name: 'Jméno',
      cardUid: 'UID karty',
      outcome: 'Výsledek',
      reason: 'Důvod'
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = cs;
} else {
  window.GYM_LOCALES = window.GYM_LOCALES || {};
  window.GYM_LOCALES.cs = cs;
}
