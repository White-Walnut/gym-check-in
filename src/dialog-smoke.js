// Electron-only regression checks, invoked exclusively by --smoke-dir. All member changes use the
// smoke database. Mouse/keyboard events go through Chromium; field values are never assigned to
// prove editability. This does not claim to emulate physical Windows file-picker interaction.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createSmokeDriver(win) {
  const evaluate = (script) => win.webContents.executeJavaScript(script);
  async function waitFor(expression, label = expression) {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await pause(40);
    }
    throw new Error(`Dialog smoke timed out: ${label}`);
  }
  async function clickPoint(x, y) {
    win.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
    win.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
    await pause(60);
  }
  async function click(selector) {
    const point = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el || el.disabled || !el.getClientRects().length) throw new Error('Cannot click ' + ${JSON.stringify(selector)});
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    })()`);
    await clickPoint(point.x, point.y);
  }
  async function key(keyCode, modifiers = []) {
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
    await pause(80);
  }
  async function type(selector, value) {
    await click(selector);
    assert.equal(await evaluate(`document.activeElement === document.querySelector(${JSON.stringify(selector)})`), true,
      `${selector} did not take focus after a mouse click`);
    await key('A', ['control']);
    await key('Backspace');
    await pause(300); // reset the RFID burst; human typing below stays slower than 100ms per key
    for (const character of value) {
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: character });
      win.webContents.sendInputEvent({ type: 'char', keyCode: character });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: character });
      await pause(140);
    }
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).value`), value,
      `${selector} did not accept keyboard input`);
  }
  return { evaluate, waitFor, click, clickPoint, key, type };
}

async function runDialogSmoke(win, directory, { requestQuit, capture = true } = {}) {
  const driver = createSmokeDriver(win);
  const { evaluate, waitFor, click, clickPoint, key, type } = driver;
  const passed = [];
  const modalOpen = () => waitFor('textPromptModal.open && !textPromptModal.hidden');
  const modalClosed = () => waitFor('!textPromptModal.open && textPromptModal.hidden');
  const ok = '#text-prompt-form [type="submit"]';
  await evaluate(`(async () => {
    if (!await window.gym.hasStaffPin()) await window.gym.setStaffPin({ newPin: '1234' });
    await window.gym.verifyStaffPin('1234');
    staffSessionActive = true;
    resetAddMemberForm(); closeMemberEditor();
    await openAdmin('add');
    window.confirm = window.alert = window.prompt = () => { throw new Error('Browser popup regression'); };
  })()`);

  await type('#first-name', 'Taylor');
  await click('[data-admin-tab="renew"]');
  await modalOpen();
  assert.equal(await evaluate('document.activeElement === textPromptCancelButton'), true, 'Confirm must default to Cancel');
  await click('#text-prompt-cancel');
  await modalClosed();
  assert.equal(await evaluate('currentAdminTab'), 'add');
  assert.equal(await evaluate('document.querySelector("#first-name").value'), 'Taylor');
  await type('#last-name', 'Reed');
  passed.push('Cancel preserves unsaved member data and both name fields remain clickable/editable');

  await click('[data-admin-tab="renew"]');
  await modalOpen();
  await key('Escape');
  await modalClosed();
  assert.equal(await evaluate('currentAdminTab'), 'add');
  await type('#first-name', 'Morgan');
  await click('[data-admin-tab="renew"]');
  await modalOpen();
  await clickPoint(8, 8);
  await modalClosed();
  assert.equal(await evaluate('currentAdminTab'), 'add');
  await type('#last-name', 'Lane');
  passed.push('Escape and backdrop dismissal preserve data and release input focus');

  await click('[data-admin-tab="renew"]');
  await modalOpen();
  await click(ok);
  await modalClosed();
  await waitFor('currentAdminTab === "renew"');
  await click('[data-admin-tab="add"]');
  assert.equal(await evaluate('document.querySelector("#first-name").value'), '');
  await type('#first-name', 'Alex');
  await type('#last-name', 'River');
  await click('#valid-until');
  assert.equal(await evaluate('document.activeElement.id'), 'valid-until');
  passed.push('Confirmed discard clears the form; name and date inputs work on returning to Add');

  await click('#first-name');
  await evaluate("showAlert('Dialog regression check'); void 0");
  await modalOpen();
  await click(ok);
  await modalClosed();
  assert.equal(await evaluate('document.activeElement.id'), 'first-name');
  await type('#first-name', 'Casey');
  passed.push('Alert dismissal restores the previously focused field');

  // Check all renewal dismissal paths against real in-memory member and payment records.
  await evaluate(`(async () => {
    resetAddMemberForm();
    const result = await window.gym.addMember({cardUid:'SMOKEDIALOG1',firstName:'Dialog',lastName:'Fixture',
      membershipType:'punchcard',passesRemaining:10});
    if (!result.ok) throw new Error('Cannot create isolated dialog fixture: ' + result.error);
    window.dialogFixtureId = result.data.id;
    await setAdminTab('renew'); memberSearch.value = 'SMOKEDIALOG1'; await runMemberSearch();
  })()`);
  const snapshot = () => evaluate(`(async () => ({
    members: (await window.gym.searchMembers('SMOKEDIALOG1')).data,
    payments: (await window.gym.searchPayments({query:'SMOKEDIALOG1'})).data
  }))()`);
  const before = await snapshot();
  assert.ok(before.members?.length, 'Fixture lookup must not silently fail');
  const renewalButton = '.member-row [data-action="renew-primary"]';
  // Each row carries one renewal action, matching that member's own plan -- +10 passes for this
  // punch-card fixture, so this is a same-type renewal that goes straight to the amount prompt.
  for (const dismissal of ['cancel', 'escape', 'backdrop']) {
    await click(renewalButton);
    await modalOpen();
    assert.equal(await evaluate('activePromptKind'), 'text');
    if (dismissal === 'cancel') await click('#text-prompt-cancel');
    if (dismissal === 'escape') await key('Escape');
    if (dismissal === 'backdrop') await clickPoint(8, 8);
    await modalClosed();
    assert.deepEqual(await snapshot(), before, `${dismissal} changed membership or payments`);
  }
  passed.push('Renewal Cancel, Escape, and backdrop leave membership and payments unchanged');

  await click(renewalButton);
  await modalOpen();
  await type('#text-prompt-input', '-5');
  await click(ok);
  assert.equal(await evaluate('textPromptModal.open && Boolean(textPromptError.textContent)'), true);
  assert.deepEqual(await snapshot(), before, 'Invalid payment changed the member');
  await type('#text-prompt-input', '');
  await click(ok);
  await modalClosed();
  await waitFor('visibleMembers[0]?.passesRemaining === 20');
  passed.push('Invalid payment stays in the dialog; confirmed blank payment renews exactly once');

  await evaluate('openMemberEditor(visibleMembers[0])');
  await click('#delete-member-button');
  await modalOpen();
  await click('#text-prompt-cancel');
  await modalClosed();
  await type('#edit-first-name', 'Review');
  await click('#delete-member-button');
  await modalOpen();
  await click(ok);
  await modalClosed();
  await waitFor('editMemberForm.hidden && !visibleMembers.some(m => m.id === window.dialogFixtureId)');
  await click('[data-admin-tab="add"]');
  await type('#first-name', 'Jordan');
  await type('#last-name', 'Lake');
  passed.push('Delete cancellation keeps the editor usable; confirmed delete allows immediate new-member typing');

  if (requestQuit) {
    const pending = requestQuit();
    await modalOpen();
    await click('#text-prompt-cancel');
    await pending;
    await modalClosed();
    assert.equal(win.isDestroyed(), false);
    assert.equal(await evaluate('document.querySelector("#first-name").value'), 'Jordan');
    await type('#last-name', 'Stone');
    passed.push('Actual main-process quit request can be cancelled without losing data or field focus');
  }
  if (capture) {
    const screenshot = await win.webContents.capturePage();
    fs.writeFileSync(path.join(directory, 'dialog-focus-after.png'), screenshot.toPNG());
  }
  await evaluate('resetAddMemberForm()');
  fs.writeFileSync(path.join(directory, 'dialog-regression-results.json'), JSON.stringify({ passed }, null, 2));
  return passed;
}

module.exports = { createSmokeDriver, runDialogSmoke };
