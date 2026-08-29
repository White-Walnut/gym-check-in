// Pure containment logic for src/main.js's `photo-url` IPC handler, plus the file-extension check
// used when staff uploads a real member photo (`set-member-photo`). This is the one place a
// renderer-supplied string gets turned into a file:// URL or copied to disk, so it must never resolve
// outside a small allowlist of directories or accept an unexpected file type. Kept dependency-free
// (just `node:path`) so it's testable without Electron.

const path = require('node:path');

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function isAllowedImageExtension(filename) {
  return ALLOWED_IMAGE_EXTENSIONS.has(path.extname(String(filename ?? '')).toLowerCase());
}

// Demo members store a stable token ("demo:alex") instead of an absolute path, so their photos keep
// resolving correctly no matter where a portable/installed build's __dirname currently points.
function resolveDemoToken(value, demoPhotosDir) {
  const match = /^demo:([a-zA-Z0-9_-]+)$/.exec(String(value ?? ''));
  if (!match) return null;
  return path.join(demoPhotosDir, `${match[1]}.svg`);
}

function isContainedIn(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// Returns an absolute, allowlisted path, or null if `photoPath` is missing/invalid or resolves
// outside every root in `allowedRoots`.
function resolvePhotoPath(photoPath, { demoPhotosDir, allowedRoots }) {
  if (!photoPath || typeof photoPath !== 'string') return null;
  const demoPath = resolveDemoToken(photoPath, demoPhotosDir);
  const resolved = path.resolve(demoPath || photoPath);
  const contained = allowedRoots.some((root) => isContainedIn(path.resolve(root), resolved));
  return contained ? resolved : null;
}

module.exports = { resolveDemoToken, isContainedIn, resolvePhotoPath, isAllowedImageExtension };
