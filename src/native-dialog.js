// Keep the original owner: in dual-screen mode a later window lookup may target another window.
async function withDialogFocus(owner, openDialog) {
  try {
    return await openDialog(owner);
  } finally {
    if (owner && !owner.isDestroyed()) {
      // focus() alone can be a no-op when Windows already considers the window active. Re-enter
      // both window and web-content focus after native pickers, including Cancel and errors.
      if (owner.isFocused()) owner.blur();
      owner.focus();
      if (!owner.webContents.isDestroyed()) owner.webContents.focus();
    }
  }
}

module.exports = { withDialogFocus };
