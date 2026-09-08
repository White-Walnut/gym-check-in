const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { backupFilesDirectory, copyBackupFiles } = require('../src/backup');

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gym-checkin-backup-test-'));
}

test('backupFilesDirectory pairs the folder with the backup file staff named', () => {
  assert.equal(
    backupFilesDirectory(path.join('C:', 'backups', 'gym-checkin-backup-2026-09-07.sqlite')),
    path.join('C:', 'backups', 'gym-checkin-backup-2026-09-07-files')
  );
  // No extension is still fine -- the folder just takes the whole name.
  assert.equal(backupFilesDirectory(path.join('C:', 'backups', 'copy')), path.join('C:', 'backups', 'copy-files'));
});

test('copyBackupFiles copies member photos and branding next to the backup', () => {
  const directory = temporaryDirectory();
  const photos = path.join(directory, 'profile', 'photos');
  const branding = path.join(directory, 'profile', 'branding');
  fs.mkdirSync(photos, { recursive: true });
  fs.mkdirSync(branding, { recursive: true });
  fs.writeFileSync(path.join(photos, '1-1757000000000.jpg'), 'photo-one');
  fs.writeFileSync(path.join(photos, '2-1757000000001.png'), 'photo-two');
  fs.writeFileSync(path.join(branding, 'logo-1757000000002.png'), 'the-logo');

  const target = path.join(directory, 'gym-checkin-backup-2026-09-07.sqlite');
  const result = copyBackupFiles(target, { photos, branding });

  assert.equal(result.fileCount, 3);
  assert.equal(result.directory, path.join(directory, 'gym-checkin-backup-2026-09-07-files'));
  assert.equal(fs.readFileSync(path.join(result.directory, 'photos', '1-1757000000000.jpg'), 'utf8'), 'photo-one');
  assert.equal(fs.readFileSync(path.join(result.directory, 'photos', '2-1757000000001.png'), 'utf8'), 'photo-two');
  assert.equal(fs.readFileSync(path.join(result.directory, 'branding', 'logo-1757000000002.png'), 'utf8'), 'the-logo');
  // The originals are copied, not moved -- this runs against the live profile.
  assert.equal(fs.readdirSync(photos).length, 2);

  fs.rmSync(directory, { recursive: true, force: true });
});

test('copyBackupFiles leaves no empty folder when there is nothing to copy', () => {
  const directory = temporaryDirectory();
  const target = path.join(directory, 'backup.sqlite');

  // A gym with no uploaded photos and the default logo: the directories may not even exist yet.
  const missing = copyBackupFiles(target, {
    photos: path.join(directory, 'profile', 'photos'),
    branding: undefined
  });
  assert.equal(missing.fileCount, 0);
  assert.equal(missing.directory, null);
  assert.equal(fs.existsSync(path.join(directory, 'backup-files')), false);

  // An existing but empty directory is the same non-event.
  const empty = path.join(directory, 'profile', 'photos');
  fs.mkdirSync(empty, { recursive: true });
  const result = copyBackupFiles(target, { photos: empty });
  assert.equal(result.fileCount, 0);
  assert.equal(result.directory, null);
  assert.equal(fs.existsSync(path.join(directory, 'backup-files')), false);

  fs.rmSync(directory, { recursive: true, force: true });
});

test('copyBackupFiles copies files only, ignoring any nested directories', () => {
  const directory = temporaryDirectory();
  const photos = path.join(directory, 'photos');
  fs.mkdirSync(path.join(photos, 'thumbnails'), { recursive: true });
  fs.writeFileSync(path.join(photos, '3-1757000000003.jpg'), 'kept');
  fs.writeFileSync(path.join(photos, 'thumbnails', 'ignored.jpg'), 'ignored');

  const target = path.join(directory, 'backup.sqlite');
  const result = copyBackupFiles(target, { photos });

  assert.equal(result.fileCount, 1);
  assert.deepEqual(fs.readdirSync(path.join(result.directory, 'photos')), ['3-1757000000003.jpg']);

  fs.rmSync(directory, { recursive: true, force: true });
});
