// Applies the saved theme/mode to <html> as early as possible -- loaded as the very first thing in
// <head>, before the stylesheet link, so the CSS variable matrix in styles.css already has the
// right data-theme/data-mode to match by the time anything paints. Without this (e.g. if this ran
// from the bottom of <body> alongside renderer.js), returning staff would see a flash of the
// fallback theme before their actual choice kicked in.
//
// Deliberately has no dependency on renderer.js or anything else -- renderer.js re-reads these same
// two keys later (see applyAppearance) only to sync the Settings tab's own controls to match, not to
// decide the theme itself.
(function applyStoredAppearance() {
  var VALID_THEMES = ['slate', 'zinc', 'emerald', 'indigo'];
  var theme = 'slate';
  var mode = 'dark';
  try {
    var storedTheme = localStorage.getItem('gym-checkin-theme');
    var storedMode = localStorage.getItem('gym-checkin-mode');
    if (VALID_THEMES.indexOf(storedTheme) !== -1) theme = storedTheme;
    if (storedMode === 'light' || storedMode === 'dark') mode = storedMode;
  } catch (error) {
    // localStorage can throw in some restricted contexts (e.g. storage explicitly disabled) --
    // fall back to the defaults above rather than leaving the page with no theme attributes at all.
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
})();
