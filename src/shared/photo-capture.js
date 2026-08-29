// Pure parsing/validation for a webcam-captured still handed to capture-member-photo as a data URL
// (see src/main.js) instead of a file path -- there's no source file on disk for a live capture to
// point at. Kept dependency-free (just Buffer) so the one place untrusted renderer-supplied image
// bytes get decoded is covered by a plain unit test, not only ever exercised by clicking through a
// real camera.

const DATA_URL_PATTERN = /^data:(image\/png|image\/jpeg);base64,([a-zA-Z0-9+/]+=*)$/;
const EXTENSIONS_BY_MIME = { 'image/png': '.png', 'image/jpeg': '.jpg' };

// Returns { buffer, extension } for a well-formed PNG/JPEG data URL within maxBytes, or null for
// anything else -- malformed input, an unsupported MIME type, or one over the size cap.
function parseCapturedPhotoDataUrl(dataUrl, maxBytes) {
  const match = DATA_URL_PATTERN.exec(String(dataUrl ?? ''));
  if (!match) return null;
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > maxBytes) return null;
  return { buffer, extension: EXTENSIONS_BY_MIME[match[1]] };
}

module.exports = { parseCapturedPhotoDataUrl };
