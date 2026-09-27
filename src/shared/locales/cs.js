// Czech strings.
//
// Rewritten from scratch as natural Czech rather than translated line by line from en.js. Two rules
// run through the whole file, because Czech grammar breaks where English doesn't:
//
//   - No gendered past participles about a member ("uložen(a)", "byl(a) odstraněn(a)"). Messages are
//     phrased so the verb agrees with something fixed instead: "Uloženo: {name}", "Členství se znovu
//     aktivuje".
//   - No numbers glued to a verb or adjective that has to agree with them ("zbývá 3 vstupy",
//     "5 nevyužitých vstupů"). Counts go after a colon or in brackets ("Zbývá vstupů: 3"), which is
//     correct for every number. The only exceptions are the noun plurals in common.*Unit, which pick
//     the right form themselves.
//
// Must cover the same keys as en.js -- see that file's own header comment for the plural-object and
// "...Html" key conventions. Czech plural nouns use one/few/other (not "many" -- for a whole-number
// count, Czech's CLDR "many" category only ever applies to non-integers, so it never gets selected
// here; "other" is what a whole 0 or 5+ count actually falls into).
const cs = {
  confirm: {
    discardAddMember: 'Nový člen ještě není uložený. Zahodit ho?',
    discardEditMember: 'Změny u člena nejsou uložené. Zahodit je?'
  },
  common: {
    approved: 'Povoleno',
    denied: 'Zamítnuto',
    loading: 'Načítám…',
    cancel: 'Zrušit',
    ok: 'OK',
    moreInfo: 'Více informací',
    edit: 'Upravit',
    unknownCard: 'Neznámá karta',
    unrecognisedCard: 'Nerozpoznaná karta',
    systemError: 'Chyba systému',
    passUnit: { one: 'vstup', few: 'vstupy', other: 'vstupů' },
    dayUnit: { one: 'den', few: 'dny', other: 'dní' },
    memberUnit: { one: 'člen', few: 'členové', other: 'členů' },
    // Neuter, agreeing with "členství" -- both places that use these say "Členství je/bude {status}".
    status: { active: 'aktivní', frozen: 'pozastavené', cancelled: 'zrušené' }
  },

  topbar: {
    brandSubtitle: 'Vstup pro členy',
    adminToggleAriaLabel: 'Otevřít správu členů',
    adminToggleTitle: 'Správa členů (Tab)',
    readerReady: 'Čtečka připravena'
  },

  idle: {
    eyebrow: 'PŘIPRAVENO',
    headingCard: 'Přiložte členskou kartu',
    headingBarcode: 'Naskenujte čárový kód',
    subheadCard: 'Podržte ji u čtečky.',
    subheadBarcode: 'Namiřte skener na kód.'
  },

  result: {
    assignCardButton: 'Přiřadit novému členovi'
  },

  footer: {
    testCardToggleCard: 'Vyzkoušet kartu',
    testCardToggleBarcode: 'Vyzkoušet kód',
    cardUidLabelCard: 'UID karty',
    cardUidLabelBarcode: 'Čárový kód',
    cardUidPlaceholder: 'Např. 10000001',
    checkInSubmit: 'Zapsat příchod',
    scanHintHtmlCard: 'Čekám na kartu <span>•</span> Tab správa členů <span>•</span> F11 celá obrazovka',
    scanHintHtmlBarcode: 'Čekám na čárový kód <span>•</span> Tab správa členů <span>•</span> F11 celá obrazovka',
    scanHintKioskHtmlCard: 'Čekám na kartu <span>•</span> F11 celá obrazovka',
    scanHintKioskHtmlBarcode: 'Čekám na čárový kód <span>•</span> F11 celá obrazovka'
  },

  admin: {
    kicker: 'RECEPCE',
    title: 'Správa členů',
    lockAriaLabel: 'Zamknout a vrátit se na zadání PIN',
    lockTitle: 'Zamknout',
    lockLabel: 'Zamknout',
    tabs: { add: 'Nový člen', renew: 'Členové', history: 'Příchody', payments: 'Platby', settings: 'Nastavení' }
  },

  staffLock: {
    enter: { heading: 'Zadejte PIN', pinPlaceholder: 'PIN', submit: 'Odemknout', forgot: 'Zapomněli jste PIN?' },
    setup: {
      heading: 'Nastavte PIN',
      hint: 'PIN má 4 až 8 číslic. Recepce jím otevírá správu členů.',
      newPinPlaceholder: 'Nový PIN',
      confirmPinPlaceholder: 'Zopakujte PIN',
      submit: 'Nastavit PIN',
      pinsDoNotMatch: 'Zadané PINy se liší.'
    },
    recover: {
      heading: 'Nový PIN pomocí kódu pro obnovení',
      hint: 'Zadejte kód pro obnovení, který se zobrazil při nastavení PIN.',
      codePlaceholder: 'XXXXX-XXXXX',
      newPinPlaceholder: 'Nový PIN',
      confirmPinPlaceholder: 'Zopakujte nový PIN',
      submit: 'Nastavit nový PIN',
      cancel: 'Zpět na zadání PIN',
      pinsDoNotMatch: 'Zadané PINy se liší.'
    },
    reveal: {
      heading: 'Kód pro obnovení',
      hint: 'Zapište si ho a dobře uschovejte. Když zapomenete PIN, jinak se do aplikace nedostanete. Znovu se už nezobrazí.',
      continueButton: 'Mám ho zapsaný, pokračovat'
    }
  },

  addMember: {
    cardCaptureHintCard: 'Přiložte novou kartu',
    cardCaptureHintBarcode: 'Naskenujte nový čárový kód',
    cardCaptureWaitingCard: 'Čekám na kartu…',
    cardCaptureWaitingBarcode: 'Čekám na čárový kód…',
    scanDifferentCardCard: 'Načíst jinou kartu',
    scanDifferentCardBarcode: 'Načíst jiný kód',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    membershipLegend: 'Členství',
    monthlyTitle: 'Měsíční',
    monthlyHint: 'Platí do zvoleného data',
    punchcardTitle: 'Vstupová',
    punchcardHint: 'Každý příchod odečte jeden vstup',
    validUntil: 'Platí do',
    startingPasses: 'Počet vstupů',
    amountPaid: 'Zaplaceno (Kč)',
    optionalHint: 'nepovinné',
    amountPlaceholder: 'např. 500',
    save: 'Uložit člena',
    tapNextCardCard: 'Přiložte další kartu.',
    tapNextCardBarcode: 'Naskenujte další kód.',
    savedSuccessCard: 'Uloženo: {name}. Karta je připravená.',
    savedSuccessBarcode: 'Uloženo: {name}. Kód je připravený.'
  },

  renew: {
    searchLabel: 'Hledat podle jména nebo UID karty',
    searchPlaceholder: 'Začněte psát…',
    scanToFind: 'Najít kartou',
    tapCardToJumpCard: 'Přiložte kartu hledaného člena.',
    tapCardToJumpBarcode: 'Naskenujte kód hledaného člena.',
    jumpedToCard: 'Nalezena karta {uid}.',
    expiringWithin: 'Končí do',
    days: 'dní',
    show: 'Zobrazit',
    showAll: 'Zobrazit všechny',
    noExpiringMembers: 'V tomto období nikomu členství nekončí.',
    loadingMembers: 'Načítám členy…',
    memberCount: '{count} {unit}',
    noMatchingMembers: 'Hledání nic nenašlo.',
    editMemberTitle: 'Upravit: {name}',
    plusOneMonth: '+1 měsíc',
    plusTenPasses: '+10 vstupů',
    customDateButton: 'Jiné datum',
    status: {
      active: 'Aktivní',
      // "Ještě {count} {unit}" rather than a verb form: it stays grammatical across all three Czech
      // plural forms (1 den / 3 dny / 5 dní), which "zbývá/zbývají" would not.
      expiringSoon: 'Ještě {count} {unit}',
      lastDay: 'Poslední den',
      expired: 'Skončilo {date}',
      frozen: 'Pozastaveno',
      cancelled: 'Zrušeno',
      passes: '{count} {unit}',
      passesLow: 'Ještě {count} {unit}',
      noPasses: 'Bez vstupů',
      unknown: 'Neznámý stav'
    },
    metaMonthlyUntil: 'Měsíční · do {date}',
    metaMonthlyEnded: 'Měsíční · skončilo {date}',
    metaMonthlyNoDate: 'Měsíční · bez data konce',
    metaPunchcard: 'Vstupová',
    renewedMonthly: 'Platí do {date}.',
    renewedPunchcard: 'Zbývá vstupů: {count}.',
    renewResult: '{name}: {change}',
    updatedSuccess: 'Uloženo: {name}.',
    deletedSuccess: 'Smazáno: {name}.'
  },

  edit: {
    kicker: 'ÚPRAVA ČLENA',
    titleDefault: 'Údaje o členovi',
    titleEditMember: 'Upravit: {name}',
    titleSetEndDate: 'Konec platnosti: {name}',
    chooseExactDate: 'Vyberte poslední den, kdy může přijít.',
    cancel: 'Zrušit',
    changePhoto: 'Změnit fotku…',
    takePhoto: 'Vyfotit',
    chooseFile: 'Vybrat soubor…',
    removePhoto: 'Odebrat fotku',
    tapReplacementCardCard: 'Přiložte novou kartu.',
    tapReplacementCardBarcode: 'Naskenujte nový kód.',
    cardCapturedCard: 'Načtena karta {uid}.',
    cardCapturedBarcode: 'Načten kód {uid}.',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    cardUid: 'UID karty',
    scanReplace: 'Přiložit novou kartu',
    status: 'Stav členství',
    statusActive: 'Aktivní',
    statusFrozen: 'Pozastavené',
    statusCancelled: 'Zrušené',
    membership: 'Členství',
    membershipMonthly: 'Měsíční',
    membershipPunchcard: 'Vstupová',
    customEndDate: 'Platí do',
    entriesRemaining: 'Zbývá vstupů',
    amountPaid: 'Zaplaceno teď (Kč)',
    exportData: 'Exportovat data…',
    deleteMember: 'Smazat člena…',
    saveChanges: 'Uložit změny',
    photoUpdated: 'Fotka uložena.',
    photoRemoved: 'Fotka odebrána.',
    dataExported: 'Data uložena do {path}',
    deleteConfirm: 'Smazat člena {name}? Jméno, fotka a karta se trvale odstraní. Příchody a platby zůstanou v evidenci bez jména. Nelze vrátit zpět.',
    discard: {
      // Assembled by describeDiscard() in renderer.js as "{name}: Propadnou <part> a <part>." -- each
      // part carries its count in brackets so the phrase agrees whatever the number is.
      passesLost: 'nevyužité vstupy ({count})',
      daysLost: 'zbývající dny ({count})',
      removes: ' Propadnou {parts}.',
      reactivates: ' Členství je teď {status} a znovu se aktivuje.',
      confirm: '{name}:{lossText}{reactivateText} Pokračovat?',
      and: 'a'
    },
    riskyChange: {
      statusChange: ' Členství bude {status}.',
      cardChange: ' Karta se změní z {oldUid} na {newUid}.',
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
    loading: 'Načítám…',
    loadingCheckIns: 'Načítám příchody…',
    exporting: 'Exportuji…',
    noMatches: 'Filtru neodpovídá žádný příchod.',
    shownCount: 'Zobrazeno: {count}',
    exportedTruncated: 'Exportováno nejnovějších řádků: {count}. Starší získáte užším rozsahem dat.',
    exportedOk: 'Exportováno řádků: {count}. Soubor: {path}'
  },

  payments: {
    memberName: 'Jméno člena',
    searchPlaceholder: 'Hledat…',
    from: 'Od',
    to: 'Do',
    filter: 'Filtrovat',
    clear: 'Vymazat',
    heading: 'Platby',
    loading: 'Načítám platby…',
    exporting: 'Exportuji…',
    noMatches: 'Filtru neodpovídá žádná platba.',
    totalShown: 'Celkem: {amount} Kč (zobrazeno: {count})',
    exportedTruncated: 'Exportováno nejnovějších řádků: {count}. Starší získáte užším rozsahem dat.',
    exportedOk: 'Exportováno řádků: {count}. Soubor: {path}',
    eventSignup: 'Nový člen',
    eventRenewal: 'Prodloužení',
    rowDescription: '{event} · {plan}'
  },

  settings: {
    branding: {
      heading: 'Název a logo posilovny',
      hint: 'Název se zobrazí na obrazovce pro členy, v záhlaví recepce a u zadání PIN. Logo se '
        + 'zobrazí v záhlaví recepce a u zadání PIN. Když nic nevyplníte, použije se výchozí vzhled.',
      chooseLogo: 'Vybrat logo…',
      removeLogo: 'Odebrat logo',
      namePlaceholder: 'Název posilovny',
      saveName: 'Uložit název',
      logoUpdated: 'Logo uloženo.',
      logoRemoved: 'Logo odebráno.',
      nameSaved: 'Název uložen.'
    },
    appearance: {
      heading: 'Vzhled',
      hint: 'Uloží se v tomto počítači.',
      dark: 'Tmavý',
      light: 'Světlý',
      lightModeAriaLabel: 'Světlý režim',
      themes: {
        slate: { name: 'Modrá' },
        zinc: { name: 'Oranžová' },
        emerald: { name: 'Tyrkysová' },
        indigo: { name: 'Fialová' }
      }
    },
    language: {
      heading: 'Jazyk',
      hint: 'Projeví se hned, jen v tomto počítači.',
      english: 'English',
      czech: 'Čeština'
    },
    scanMethod: {
      heading: 'Čtečka na recepci',
      hint: 'Mění pokyny a ikonu, které vidí členové. Obě zařízení fungují stejně, vyberte to, které '
        + 'máte na recepci.',
      card: 'Čtečka karet',
      barcode: 'Čtečka čárových kódů'
    },
    pin: {
      heading: 'Změna PIN',
      hint: '4 až 8 číslic.',
      currentPlaceholder: 'Stávající PIN',
      newPlaceholder: 'Nový PIN',
      confirmPlaceholder: 'Zopakujte nový PIN',
      submit: 'Změnit PIN',
      updated: 'PIN změněn.',
      pinsDoNotMatch: 'Zadané PINy se liší.',
      regenerateRecovery: 'Vytvořit nový kód pro obnovení…',
      regeneratePrompt: 'Zadejte stávající PIN. Vytvoří se nový kód pro obnovení.',
      newRecoveryCodeAlert: 'Nový kód pro obnovení: {code}\n\nHned si ho zapište. Znovu se nezobrazí a starý kód už neplatí.'
    },
    backup: {
      heading: 'Záloha',
      hint: 'Uloží kopii databáze členů. Fotky a logo se uloží do složky vedle souboru se zálohou. '
        + 'Uchovávejte je spolu.',
      exportButton: 'Uložit zálohu…',
      savedSuccess: 'Záloha uložena do {path}',
      savedSuccessWithFiles: 'Záloha uložena do {path}. Fotky a logo jsou ve složce vedle ní (souborů: {count}).',
      failed: 'Zálohu se nepodařilo uložit.'
    },
    diagnostics: {
      heading: 'Diagnostika',
      hint: 'Aplikace si v tomto počítači zapisuje chyby. Nikam se nic neposílá. Když vás o záznam '
        + 'někdo požádá, uložte ho a pošlete.',
      exportButton: 'Uložit záznam chyb…',
      openFolderButton: 'Otevřít složku se záznamem',
      savedSuccess: 'Záznam uložen do {path}'
    },
    kiosk: {
      heading: 'Kioskový režim',
      hintHtml: 'Obrazovka pro členy běží přes celou obrazovku a nejde zavřít přes Alt+F4 ani křížkem. '
        + 'Klávesa Windows, Ctrl+Alt+Delete a Správce úloh fungují dál. '
        + '<strong>Funguje jen se zapnutým režimem dvou monitorů.</strong>',
      enable: 'Zapnout kioskový režim'
    },
    dualScreen: {
      heading: 'Dva monitory',
      hint: 'Když jsou připojené dva monitory, na jednom vidí členové výsledek příchodu a na druhém '
        + 'je tato správa. Projeví se při příštím spuštění aplikace.',
      enable: 'Použít dva monitory, když jsou připojené'
    },
    retention: {
      heading: 'Mazání starých příchodů',
      hint: 'Starší příchody se smažou při každém spuštění aplikace. Členové, platby a prodloužení '
        + 'zůstávají.',
      deleteOlderThan: 'Mazat příchody starší než',
      days: 'dní',
      save: 'Uložit',
      saved: 'Uloženo. Projeví se při příštím spuštění.'
    },
    cooldown: {
      heading: 'Opakovaný příchod na vstupovou',
      hint: 'Když člen přiloží vstupovou kartu znovu během této doby, projde bez odečtení dalšího '
        + 'vstupu, i když mu první příchod vzal poslední. Doba se počítá od příchodu, který vstup '
        + 'odečetl. Měsíčních členství se to netýká. Hodnota 0 funkci vypne.',
      noChargeWithin: 'Neodečítat další vstup do',
      hours: 'hodin',
      save: 'Uložit',
      saved: 'Uloženo. Platí od teď.'
    },
    updates: {
      heading: 'Aktualizace',
      currentVersion: 'Verze:',
      hint: 'Aplikace hledá aktualizace jednou denně. Nic nestáhne ani nenainstaluje, dokud to tady '
        + 'nepotvrdíte.',
      check: 'Zkontrolovat aktualizace',
      download: 'Stáhnout aktualizaci',
      install: 'Restartovat a nainstalovat',
      checking: 'Kontroluji…',
      checkingLong: 'Hledám aktualizace…',
      checkFailed: 'Kontrola aktualizací selhala. Viz UPDATER_SETUP.md.',
      available: 'Je k dispozici verze {version}.',
      upToDate: 'Máte nejnovější verzi.',
      downloadingStart: 'Stahuji aktualizaci…',
      downloadFailed: 'Stahování selhalo. Zkuste to znovu.',
      downloadingProgress: 'Stahuji aktualizaci… {percent} %',
      downloaded: 'Verze {version} je stažená a připravená k instalaci.',
      errorWithMessage: 'Kontrola aktualizací selhala: {message}',
      errorGeneric: 'Kontrola aktualizací selhala.',
      installConfirm: 'Aplikace se zavře a hned se otevře v nové verzi. Pokračovat?'
    }
  },

  activity: {
    heading: 'Poslední příchody',
    empty: 'Zatím žádné příchody.'
  },

  camera: {
    title: 'Fotka člena',
    cancel: 'Zrušit',
    retake: 'Vyfotit znovu',
    capture: 'Vyfotit',
    usePhoto: 'Použít fotku',
    starting: 'Zapínám kameru…',
    accessFailed: 'Kamera není dostupná. Zkontrolujte oprávnění a jestli ji nepoužívá jiná aplikace.'
  },

  checkin: {
    pillPunchcard: 'Vstupová · zbývá vstupů: {count}',
    pillExpired: 'Měsíční · skončilo {date}',
    pillValidUntil: 'Měsíční · platí do {date}',
    pillUidCaptured: 'UID {uid}',
    pillUidNotCaptured: 'UID se nenačetlo',
    passesRemaining: 'Zbývá vstupů: {count}',
    amountPaidPrompt: 'Zaplacená částka v Kč (když nic, nechte prázdné):',
    reasons: {
      active: { eyebrow: 'VSTUP POVOLEN', message: 'Vítejte, ať se trénink vydaří.' },
      punchcard: { eyebrow: 'VSTUP POVOLEN', message: '' },
      punchcard_recent: { eyebrow: 'VÍTEJTE ZPĚT', message: 'Před chvílí jste už prošli, vstup se neodečítá.' },
      expired: { eyebrow: 'ČLENSTVÍ SKONČILO', message: 'Prodlužte si ho prosím na recepci.' },
      no_passes: { eyebrow: 'VSTUPY DOŠLY', message: 'Dokupte si prosím vstupy na recepci.' },
      frozen: { eyebrow: 'ČLENSTVÍ POZASTAVENO', message: 'Zastavte se prosím na recepci.' },
      cancelled: { eyebrow: 'ČLENSTVÍ ZRUŠENO', message: 'Zastavte se prosím na recepci.' },
      unknown_card: { eyebrow: 'KARTA NENÍ V SYSTÉMU', message: 'Přiřaďte kartu členovi, nebo zkuste jinou.' },
      system_error: { eyebrow: 'CHYBA SYSTÉMU', message: 'Karta se načetla, ale databáze vrátila chybu.' },
      invalid_uid: { eyebrow: 'KARTU NEJDE PŘEČÍST', message: 'Přiložte ji prosím znovu, nebo se zastavte na recepci.' }
    },
    notif: {
      approvedTitle: '✅ {name}',
      deniedTitle: '⛔ {name}',
      unknownTitle: '❔ Neznámá karta',
      errorTitle: '⚠️ Chyba při příchodu',
      unreadableTitle: '⚠️ Kartu nejde přečíst',
      activeBody: 'Platné členství · do {validUntil}',
      punchcardBody: 'Vstupová · zbývá vstupů: {count}',
      expiredBody: 'ZAMÍTNUTO: členství skončilo {validUntil}',
      noPassesBody: 'ZAMÍTNUTO: došly vstupy',
      frozenBody: 'ZAMÍTNUTO: členství je pozastavené',
      cancelledBody: 'ZAMÍTNUTO: členství je zrušené',
      unknownBody: 'Neznámá karta: UID {uid}',
      errorBody: 'Karta se načetla, ale databáze vrátila chybu.',
      unreadableBody: 'Ať člen přiloží kartu znovu.'
    }
  },

  errors: {
    invalid_uid: 'Před uložením přiložte kartu.',
    invalid_name: 'Vyplňte jméno a příjmení.',
    invalid_membership_type: 'Vyberte typ členství.',
    invalid_status: 'Vyberte stav členství.',
    invalid_date: 'Vyberte platné datum konce.',
    invalid_passes: 'Počet vstupů musí být aspoň 1.',
    invalid_member: 'Vyberte člena.',
    member_not_found: 'Člen nebyl nalezen.',
    card_exists: 'Tato karta už patří jinému členovi.',
    not_authorized: 'Správa se zamkla. Zadejte znovu PIN.',
    invalid_pin: 'PIN musí mít 4 až 8 číslic.',
    wrong_pin: 'Stávající PIN nesouhlasí.',
    wrong_recovery_code: 'Kód pro obnovení nesouhlasí.',
    locked_out: 'Příliš mnoho pokusů. Chvíli počkejte a zkuste to znovu.',
    invalid_amount: 'Zadejte platnou částku, nebo pole nechte prázdné.',
    invalid_photo: 'Vyberte obrázek JPG, PNG nebo WEBP do 8 MB.',
    invalid_retention_days: 'Zadejte celý počet dní (aspoň 1).',
    invalid_cooldown_hours: 'Zadejte celý počet hodin (0 nebo víc).',
    operation_failed: 'Změnu se nepodařilo uložit. Zkuste to znovu.',
    no_log_yet: 'Záznam chyb zatím neexistuje.'
  },

  main: {
    confirm: {
      quit: 'Po ukončení aplikace nepůjde přikládat karty, dokud ji znovu nespustíte. Ukončit?',
      quitWithUnsavedChanges: 'Po ukončení aplikace nepůjde přikládat karty a neuložené změny ve formuláři se ztratí. Ukončit?',
      quitCancel: 'Zrušit',
      quitConfirm: 'Ukončit'
    },
    dialogs: {
      exportHistoryTitle: 'Export příchodů',
      exportPaymentsTitle: 'Export plateb',
      exportMemberDataTitle: 'Export dat člena',
      exportBackupTitle: 'Záloha databáze',
      exportLogTitle: 'Uložit záznam chyb',
      choosePhotoTitle: 'Vyberte fotku člena',
      chooseLogoTitle: 'Vyberte logo posilovny',
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
      reason: 'Důvod',
      date: 'Datum',
      eventType: 'Událost',
      membershipType: 'Typ členství',
      amount: 'Částka (Kč)'
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = cs;
} else {
  window.GYM_LOCALES = window.GYM_LOCALES || {};
  window.GYM_LOCALES.cs = cs;
}
