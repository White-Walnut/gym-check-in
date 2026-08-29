// Secret hashing shared by the staff PIN and the PIN-recovery code (src/database.js). Uses Node's
// built-in crypto (scrypt) so no new dependency is needed. Salt and hash are stored as hex strings in
// app_meta. This module has no Electron dependency, so it's testable in plain node:test.

const crypto = require('node:crypto');

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

function generateSalt() {
  return crypto.randomBytes(SALT_BYTES).toString('hex');
}

function hashSecret(value, salt) {
  return crypto.scryptSync(String(value), salt, KEY_LENGTH, SCRYPT_OPTIONS).toString('hex');
}

function verifySecret(value, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actual = Buffer.from(hashSecret(value, salt), 'hex');
  let expected;
  try {
    expected = Buffer.from(expectedHash, 'hex');
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

// Plain numeric PIN, 4-8 digits -- comfortable on a reception-desk number pad.
function isValidPinFormat(pin) {
  return /^\d{4,8}$/.test(String(pin ?? ''));
}

// Recovery code: 10 characters, uppercase letters + digits, excluding visually ambiguous ones
// (0/O, 1/I), formatted "XXXXX-XXXXX" for easy handwriting/reading back.
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRecoveryCode() {
  const bytes = crypto.randomBytes(10);
  let raw = '';
  for (let i = 0; i < 10; i += 1) {
    raw += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
  }
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

// Recovery codes are entered by hand, so normalise case/whitespace before hashing/verifying.
function normaliseRecoveryCode(code) {
  return String(code ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

module.exports = {
  generateSalt,
  hashSecret,
  verifySecret,
  isValidPinFormat,
  generateRecoveryCode,
  normaliseRecoveryCode
};
