const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { wouldDiscardBalance } = require('../src/shared/renewal');

// Exercise the actual renderer handlers without Electron or a live database. The UI integration
// suite separately checks HTML-dialog focus with mouse and keyboard events.
const source = fs.readFileSync(path.join(__dirname, '../src/renderer/renderer.js'), 'utf8');
function rendererFunction(name) {
  const start = source.search(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  assert.notEqual(start, -1, `Missing renderer function ${name}`);
  const end = source.indexOf('\n}', start);
  return source.slice(start, end + 2);
}

function renewalHarness({ type = 'monthly', answer = null, confirm = true } = {}) {
  const calls = [];
  const member = { id: 7, name: 'Test Fixture', membershipType: type, membershipStatus: 'active',
    passesRemaining: type === 'punchcard' ? 10 : 0, validUntil: '2026-10-06' };
  const buttons = [{ disabled: false }, { disabled: false }];
  const context = vm.createContext({
    visibleMembers: [member], wouldDiscardBalance,
    localDateString: () => '2026-09-07',
    showConfirmation: async () => { calls.push({ action: 'confirm' }); return confirm; },
    describeDiscard: () => 'Confirm conversion',
    showTextPrompt: async (_message, options) => {
      calls.push({ action: 'prompt' });
      if (answer !== null) assert.equal(options.validate(answer), '');
      return answer;
    },
    errorText: (error) => error,
    window: {
      gym: { renewMember: async (input) => {
        calls.push({ action: 'renew', ...input });
        return { ok: true, data: { ...member, passesRemaining: 20 } };
      } },
      i18n: { t: () => 'Renewed', plural: () => 'passes' }
    },
    currentLang: 'en', renewStatus: {},
    formatDate: () => '6 October',
    runMemberSearch: async () => { calls.push({ action: 'refresh' }); },
    setStatus: () => {},
    showError: () => assert.fail('Unexpected renewal error')
  });
  for (const name of ['amountToCents', 'promptForAmountCents', 'renewMember']) {
    vm.runInContext(rendererFunction(name), context);
  }
  return { calls, buttons, run: (renewalType = type) => context.renewMember(7, renewalType,
    { closest: () => ({ querySelectorAll: () => buttons }) }) };
}

for (const type of ['monthly', 'punchcard']) {
  test(`${type}: cancelling the payment dialog makes no renewal IPC call`, async () => {
    const h = renewalHarness({ type, answer: null });
    await h.run();
    assert.deepEqual(h.calls, [{ action: 'prompt' }]);
    assert.ok(h.buttons.every((button) => !button.disabled));
  });

  test(`${type}: confirming a blank payment renews once with no amount`, async () => {
    const h = renewalHarness({ type, answer: '' });
    await h.run();
    assert.deepEqual(h.calls, [
      { action: 'prompt' },
      { action: 'renew', memberId: 7, renewalType: type, amountCents: null },
      { action: 'refresh' }
    ]);
    assert.ok(h.buttons.every((button) => !button.disabled));
  });
}

test('confirmed payment converts to cents and renews exactly once', async () => {
  const h = renewalHarness({ answer: '450.50' });
  await h.run();
  const renewals = h.calls.filter((call) => call.action === 'renew');
  assert.equal(renewals.length, 1);
  assert.equal(renewals[0].amountCents, 45050);
});

test('cancelling plan conversion never opens payment or calls renewal', async () => {
  const h = renewalHarness({ type: 'punchcard', confirm: false });
  await h.run('monthly');
  assert.deepEqual(h.calls, [{ action: 'confirm' }]);
});

for (const reason of ['unknown_card', 'approved']) {
  test(`activity feed ${reason}: cancelling async navigation never overwrites the current form`, async () => {
    const captures = [];
    let decide;
    const pending = new Promise((resolve) => { decide = resolve; });
    const context = vm.createContext({
      setAdminTab: () => pending,
      captureCard: (uid) => captures.push(uid),
      captureSearchUid: (uid) => captures.push(uid)
    });
    vm.runInContext(rendererFunction('jumpToActivityFeedEntry'), context);
    const action = context.jumpToActivityFeedEntry({ uid: 'TEST1234', reason });
    assert.deepEqual(captures, [], 'Capture ran before staff answered');
    decide(false);
    await action;
    assert.deepEqual(captures, [], 'Capture ran despite cancellation');
  });
}

test('discard checks await each answer and stop when Add-member discard is cancelled', async () => {
  const calls = [];
  const context = vm.createContext({
    confirmDiscardAddMember: async () => { calls.push('add'); return false; },
    confirmDiscardEditMember: async () => { calls.push('edit'); return true; }
  });
  vm.runInContext(rendererFunction('confirmDiscardUnsavedChanges'), context);
  assert.equal(await context.confirmDiscardUnsavedChanges(), false);
  assert.deepEqual(calls, ['add']);
});

// --- Member list rows ---------------------------------------------------------------------------
// The member list is the screen reception spends its day on, and its layout decisions are the kind
// nothing else would catch: that a row offers exactly ONE renewal action and it matches the plan
// that member is already on (offering both used to convert plans and forfeit balances by misclick),
// and that the status of a membership is a separate, tone-carrying element rather than a clause
// buried in a grey sentence. Rendered here against a miniature DOM so those hold without Electron.

function fakeElement(tag) {
  const element = {
    tagName: tag.toUpperCase(),
    children: [],
    dataset: {},
    classList: { add: (name) => { element.className = `${element.className} ${name}`.trim(); } },
    style: {},
    className: '',
    textContent: '',
    append: (...nodes) => element.children.push(...nodes),
    replaceChildren: (...nodes) => { element.children = nodes; },
    addEventListener: () => {},
    setAttribute: (name, value) => { element[name] = value; },
    querySelectorAll: () => []
  };
  return element;
}

function renderRows(members) {
  const { memberStatus } = require('../src/shared/member-status');
  const { localDateString } = require('../src/shared/dates');
  const i18n = require('../src/shared/i18n');
  const searchResults = fakeElement('div');
  const context = vm.createContext({
    document: { createElement: fakeElement },
    searchResults,
    memberCount: fakeElement('span'),
    memberStatus,
    localDateString: () => '2026-09-08',
    formatDate: (date) => date.toISOString().slice(0, 10),
    openMemberEditor: () => {},
    renewMember: () => {},
    currentLang: 'en',
    visibleMembers: [],
    window: { i18n }
  });
  for (const name of ['memberStatusLabel', 'membershipMeta', 'makeTextAction', 'makeRenewButton', 'renderSearchResults']) {
    vm.runInContext(rendererFunction(name), context);
  }
  context.renderSearchResults(members);
  return searchResults.children;
}

const rowActions = (row) => row.children.at(-1).children;
const actionNames = (row) => rowActions(row).map((button) => button.dataset.action);
const statusChip = (row) => row.children[1];

test('a member row offers one renewal action, matching the plan that member is already on', () => {
  const [monthlyRow, punchRow] = renderRows([
    { id: 1, name: 'Alex Monthly', cardUid: '10000001', membershipType: 'monthly', membershipStatus: 'active', validUntil: '2026-12-31', passesRemaining: 0 },
    { id: 2, name: 'Jordan Punch', cardUid: '10000003', membershipType: 'punchcard', membershipStatus: 'active', validUntil: null, passesRemaining: 9 }
  ]);

  // Monthly: +1 month, and a custom end date is a monthly-only idea so it stays available.
  assert.deepEqual(actionNames(monthlyRow), ['renew-primary', 'custom-date', 'edit-member']);
  assert.equal(rowActions(monthlyRow)[0].textContent, '+1 month');
  // Punch card: +10 passes, and no custom-date action at all.
  assert.deepEqual(actionNames(punchRow), ['renew-primary', 'edit-member']);
  assert.equal(rowActions(punchRow)[0].textContent, '+10 passes');

  // Neither row offers the other plan's renewal -- that is the misclick that used to convert a
  // member's plan and forfeit their balance straight from the list.
  assert.equal(rowActions(monthlyRow).some((button) => button.textContent === '+10 passes'), false);
  assert.equal(rowActions(punchRow).some((button) => button.textContent === '+1 month'), false);

  // Exactly one filled button per row; everything else is a quiet text action.
  for (const row of [monthlyRow, punchRow]) {
    assert.equal(rowActions(row).filter((button) => button.className.includes('is-primary')).length, 1);
    assert.equal(rowActions(row).filter((button) => button.className === 'row-text-action').length, rowActions(row).length - 1);
  }
});

test('a member row states its membership state as its own toned element, not as prose', () => {
  const [valid, expiring, expired, empty, frozen] = renderRows([
    { id: 1, name: 'Valid', cardUid: 'A1', membershipType: 'monthly', membershipStatus: 'active', validUntil: '2099-12-31', passesRemaining: 0 },
    { id: 2, name: 'Expiring', cardUid: 'A2', membershipType: 'monthly', membershipStatus: 'active', validUntil: '2026-09-11', passesRemaining: 0 },
    { id: 3, name: 'Expired', cardUid: 'A3', membershipType: 'monthly', membershipStatus: 'active', validUntil: '2020-01-01', passesRemaining: 0 },
    { id: 4, name: 'Empty', cardUid: 'A4', membershipType: 'punchcard', membershipStatus: 'active', validUntil: null, passesRemaining: 0 },
    { id: 5, name: 'Frozen', cardUid: 'A5', membershipType: 'punchcard', membershipStatus: 'frozen', validUntil: null, passesRemaining: 5 }
  ]);

  assert.equal(statusChip(valid).textContent, 'Active');
  assert.equal(statusChip(valid).className, 'member-status is-neutral');
  assert.equal(statusChip(expiring).textContent, '3 days left');
  assert.equal(statusChip(expiring).className, 'member-status is-warn');
  assert.equal(statusChip(expired).textContent, 'Expired 2020-01-01');
  assert.equal(statusChip(expired).className, 'member-status is-danger');
  assert.equal(statusChip(empty).textContent, 'No passes');
  assert.equal(statusChip(empty).className, 'member-status is-danger');
  assert.equal(statusChip(frozen).textContent, 'Frozen');
  assert.equal(statusChip(frozen).className, 'member-status is-muted');

  // The expired member's row no longer relies on someone reading a date mid-sentence: the plan line
  // is reference detail, and the UID is a separate demoted element rather than sentence tail.
  const meta = expired.children[0].children[1];
  assert.equal(meta.children[0].textContent, 'Monthly · ended 2020-01-01');
  assert.equal(meta.children[1].textContent, 'A3');
  assert.equal(meta.children[1].className, 'member-uid');
});
