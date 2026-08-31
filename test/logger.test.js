const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// logger.js keeps its resolved file path in module-level state (set once via init(), read by every
// other function) rather than taking a path per call -- exactly like the real app only ever calls
// init() once at startup. Since Node caches modules by resolved path, each test gets its own fresh
// module instance (and therefore its own independent logFilePath) by clearing the require cache and
// re-requiring between tests, rather than sharing one module-level path across the whole file.
function freshLogger() {
  const resolved = require.resolve('../src/logger');
  delete require.cache[resolved];
  return require('../src/logger');
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gym-checkin-logger-test-'));
}

test('logError writes a timestamped line plus the error stack, and still console.errors', () => {
  const logger = freshLogger();
  const dir = makeTempDir();
  logger.init(dir);
  logger.logError('test-scope', 'Something broke', new Error('boom'));
  const content = fs.readFileSync(logger.getLogFilePath(), 'utf8');
  assert.match(content, /\[test-scope\] \[error\] Something broke/);
  assert.match(content, /Error: boom/);
  assert.match(content, /^\[\d{4}-\d{2}-\d{2}T/); // ISO timestamp at the start of the line
});

test('logError tolerates a non-Error reason (e.g. a raw string from an unhandled rejection)', () => {
  const logger = freshLogger();
  const dir = makeTempDir();
  logger.init(dir);
  assert.doesNotThrow(() => logger.logError('test-scope', 'Rejected', 'just a string reason'));
  const content = fs.readFileSync(logger.getLogFilePath(), 'utf8');
  assert.match(content, /just a string reason/);
});

test('logInfo writes without an error line', () => {
  const logger = freshLogger();
  const dir = makeTempDir();
  logger.init(dir);
  logger.logInfo('test-scope', 'App started');
  const content = fs.readFileSync(logger.getLogFilePath(), 'utf8');
  assert.match(content, /\[test-scope\] \[info\] App started/);
});

test('getLogFilePath returns null before init() has run', () => {
  const logger = freshLogger();
  assert.equal(logger.getLogFilePath(), null);
});

test('logging before init() never throws, and simply does nothing', () => {
  const logger = freshLogger();
  assert.doesNotThrow(() => logger.logError('test-scope', 'too early', new Error('x')));
});

test('the log file rotates once it grows past the size cap, keeping only recent entries', () => {
  const logger = freshLogger();
  const dir = makeTempDir();
  logger.init(dir);
  // One long line well under the 2MB cap on its own; enough repeats to cross it. logInfo() also
  // console.logs every line it writes (by design, so `npm start` in a terminal still shows it) --
  // silenced here so a stress test doesn't dump ~2.5MB of filler into the actual test output.
  const chunk = 'x'.repeat(10_000);
  const realConsoleLog = console.log;
  console.log = () => {};
  try {
    for (let i = 0; i < 250; i += 1) {
      logger.logInfo('test-scope', `${chunk}-${i}`);
    }
  } finally {
    console.log = realConsoleLog;
  }
  const stats = fs.statSync(logger.getLogFilePath());
  // 250 * ~10KB is ~2.5MB, comfortably over the 2MB cap -- rotation must have kicked in and the file
  // must not have been left to grow unbounded.
  assert.ok(stats.size < 2.5 * 1024 * 1024, `expected the file to have rotated, but it's ${stats.size} bytes`);
  const content = fs.readFileSync(logger.getLogFilePath(), 'utf8');
  // The most recent entry must have survived rotation.
  assert.match(content, /x-249/);
  // Rotation must have actually dropped something -- the earliest entries can't all still be present.
  assert.doesNotMatch(content, /x-0\n/);
});

test('a failed rotation (e.g. the log file was deleted mid-run) never throws or blocks logging', () => {
  const logger = freshLogger();
  const dir = makeTempDir();
  logger.init(dir);
  logger.logInfo('test-scope', 'first line');
  fs.rmSync(logger.getLogFilePath());
  assert.doesNotThrow(() => logger.logInfo('test-scope', 'second line'));
  assert.match(fs.readFileSync(logger.getLogFilePath(), 'utf8'), /second line/);
});
