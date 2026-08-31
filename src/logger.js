// Persistent, size-capped diagnostic log -- the only way to see what actually happened on a real
// gym PC after the fact. Before this existed, every console.error(...) in the app just vanished
// into a console nobody has open in a packaged build; a crash or a quiet failure at the front desk
// left no trace at all. console.error/console.log still happen too (so `npm start` in a terminal is
// unchanged), but now everything also lands in one file staff can hand over via Settings > Export
// log file -- see the 'export-log-file' handler in main.js.
const fs = require('node:fs');
const path = require('node:path');

const MAX_LOG_BYTES = 2 * 1024 * 1024; // 2MB -- generous for a low-volume kiosk app, trivial to email
const KEEP_BYTES_ON_ROTATE = 512 * 1024; // rotating keeps only the most recent 512KB

let logFilePath = null;

// Called once at startup with the real userData dir (or the throwaway smoke dir in smoke mode, same
// pattern as databasePath/photosDir -- see main.js) before anything else in the app can log.
function init(logDir) {
  logFilePath = path.join(logDir, 'gym-checkin.log');
}

function getLogFilePath() {
  return logFilePath;
}

// Best-effort: keeps the file from growing forever on a kiosk that runs for months, but a failed
// rotation must never itself crash the app or block logging -- losing old history is fine, losing
// the ability to log the NEXT real error is not.
function rotateIfNeeded() {
  try {
    const stats = fs.statSync(logFilePath);
    if (stats.size <= MAX_LOG_BYTES) return;
    const fd = fs.openSync(logFilePath, 'r');
    const buffer = Buffer.alloc(KEEP_BYTES_ON_ROTATE);
    fs.readSync(fd, buffer, 0, KEEP_BYTES_ON_ROTATE, stats.size - KEEP_BYTES_ON_ROTATE);
    fs.closeSync(fd);
    fs.writeFileSync(logFilePath, `--- log rotated: older entries dropped ---\n${buffer.toString('utf8')}`);
  } catch {
    // File didn't exist yet, or rotation itself failed -- either way, fall through to appendFileSync
    // below, which will just create/extend the file normally.
  }
}

function write(scope, level, message, error) {
  if (!logFilePath) return; // init() hasn't run yet -- should be impossible past app startup, but never throw over logging itself
  const line = `[${new Date().toISOString()}] [${scope}] [${level}] ${message}`
    + (error ? `\n${error?.stack || error?.message || String(error)}` : '');
  try {
    rotateIfNeeded();
    fs.appendFileSync(logFilePath, `${line}\n`);
  } catch {
    // Disk full, permissions, whatever -- a logging failure must never crash the app it exists to
    // help debug.
  }
}

function logError(scope, message, error) {
  console.error(message, error ?? '');
  write(scope, 'error', message, error);
}

function logInfo(scope, message) {
  console.log(message);
  write(scope, 'info', message);
}

module.exports = { init, getLogFilePath, logError, logInfo };
