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
