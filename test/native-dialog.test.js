const test = require('node:test');
const assert = require('node:assert/strict');
const { withDialogFocus } = require('../src/native-dialog');

function fakeOwner() {
  const events = [];
  return {
    events,
    isDestroyed: () => false,
    isFocused: () => true,
    blur: () => events.push('blur-window'),
    focus: () => events.push('focus-window'),
    webContents: { isDestroyed: () => false, focus: () => events.push('focus-contents') }
  };
}

for (const cancelled of [false, true]) {
  test(`native picker restores its original owner after ${cancelled ? 'Cancel' : 'selection'}`, async () => {
    const owner = fakeOwner();
    const result = { canceled: cancelled };
    assert.equal(await withDialogFocus(owner, async (actual) => {
      assert.equal(actual, owner);
      return result;
    }), result);
    assert.deepEqual(owner.events, ['blur-window', 'focus-window', 'focus-contents']);
  });
}

test('native picker restores focus even if it rejects, preserving the error', async () => {
  const owner = fakeOwner();
  const error = new Error('picker failed');
  await assert.rejects(withDialogFocus(owner, async () => { throw error; }), (actual) => actual === error);
  assert.deepEqual(owner.events, ['blur-window', 'focus-window', 'focus-contents']);
});

test('a destroyed picker owner is not focused', async () => {
  const owner = fakeOwner();
  await withDialogFocus(owner, async () => { owner.isDestroyed = () => true; });
  assert.deepEqual(owner.events, []);
});
