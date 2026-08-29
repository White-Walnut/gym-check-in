// Translation lookup + application, shared between the main process (require()'d directly) and the
// renderer (loaded as a plain <script> tag, same reason as ../dates.js -- sandboxed preload can't
// require() local files). The locale data itself lives in ./locales/en.js and ./locales/cs.js; this
// file is pure logic and has no strings of its own, so it never needs a translator's attention.

const SUPPORTED_LANGUAGES = ['en', 'cs'];
const DEFAULT_LANGUAGE = 'en';

function loadLocales() {
  if (typeof module !== 'undefined' && module.exports) {
    return { en: require('./locales/en'), cs: require('./locales/cs') };
  }
  // Populated by locales/en.js and locales/cs.js, loaded as <script> tags before this file.
  return (typeof window !== 'undefined' && window.GYM_LOCALES) || {};
}

const LOCALES = loadLocales();

function resolveLang(lang) {
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
}

// Walks a dot-path ("settings.updates.check") into a locale table; returns undefined if any segment
// is missing rather than throwing, so a typo'd key falls through to the English fallback below.
function getPath(table, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), table);
}

// Missing from the active language? Fall back to English. Missing from English too (a genuine typo
// in the calling code)? Return the raw key itself -- visibly wrong in the UI, which is far easier to
// spot and fix than a silently blank label.
function lookup(lang, key) {
  const direct = getPath(LOCALES[resolveLang(lang)], key);
  if (direct !== undefined) return direct;
  const fallback = getPath(LOCALES[DEFAULT_LANGUAGE], key);
  return fallback !== undefined ? fallback : key;
}

function interpolate(template, params) {
  if (typeof template !== 'string' || !params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  ));
}

// Plain-string lookup with {placeholder} substitution -- the everyday case (button labels, status
// messages, error text).
function t(lang, key, params) {
  return interpolate(lookup(lang, key), params);
}

// Picks the right plural form via Intl.PluralRules (real CLDR rules per language, not a hand-rolled
// guess -- Czech's one/few/other split doesn't match English's one/other, and this covers both
// correctly, including edge cases like 0 or negative numbers). `key` must point at an object with at
// least a "one" and an "other" entry (see locales/en.js's header comment); `params` are merged with
// `{ count: n }` for interpolation, so a template can reference {count} or any of its own params.
function plural(lang, key, n, params) {
  const node = lookup(lang, key);
  if (typeof node === 'string') return interpolate(node, { count: n, ...params });
  let category;
  try {
    category = new Intl.PluralRules(resolveLang(lang)).select(Number(n));
  } catch {
    category = Number(n) === 1 ? 'one' : 'other';
  }
  const template = (node && (node[category] ?? node.other ?? node.many)) ?? '';
  return interpolate(template, { count: n, ...params });
}

// Walks the DOM applying data-i18n* attributes -- textContent for data-i18n, innerHTML for
// data-i18n-html (only ever used with locale strings we author ourselves, never user input), and the
// placeholder/title/aria-label attributes for their data-i18n-* counterparts. Safe to call again on
// language change; every attribute stays in the markup (it's not consumed/removed), so re-running
// this is how a live language switch takes effect without a page reload.
function applyTranslations(lang, root) {
  if (typeof document === 'undefined') return;
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(lang, el.getAttribute('data-i18n')); });
  scope.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(lang, el.getAttribute('data-i18n-html')); });
  scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.setAttribute('placeholder', t(lang, el.getAttribute('data-i18n-placeholder'))); });
  scope.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(lang, el.getAttribute('data-i18n-title'))); });
  scope.querySelectorAll('[data-i18n-aria-label]').forEach((el) => { el.setAttribute('aria-label', t(lang, el.getAttribute('data-i18n-aria-label'))); });
}

const i18n = { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, resolveLang, t, plural, applyTranslations };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
} else {
  window.i18n = i18n;
}
