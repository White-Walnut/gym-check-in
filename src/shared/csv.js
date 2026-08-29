// Minimal RFC 4180-ish CSV formatting for the check-in history export (see export-check-ins-csv in
// src/main.js). Kept dependency-free and pure so the escaping rules -- the part most likely to
// silently corrupt a report if gotten wrong -- are covered by a plain unit test instead of only ever
// being checked by opening the file in Excel.

function csvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// `headers` is an ordered list of `{ key, label }` pairs: `label` becomes the header row text,
// `key` looks up each row's value.
function toCsv(headers, rows) {
  const lines = [headers.map((h) => csvField(h.label)).join(',')];
  for (const row of rows) lines.push(headers.map((h) => csvField(row[h.key])).join(','));
  return lines.join('\r\n');
}

module.exports = { csvField, toCsv };
