// The half of a backup that is not in the database.
//
// Member photos and the gym logo are files on disk (userData/photos, userData/branding); the
// database only stores their paths. So a .sqlite snapshot on its own is not a complete backup of
// what staff have put into this app -- restoring only the database brings every member back with a
// missing photo, and the gym's own logo gone. This module copies those files alongside the snapshot
// so the two halves travel together.
//
// Layout: for a backup saved as "gym-checkin-backup-2026-09-07.sqlite", the files land in a sibling
// folder "gym-checkin-backup-2026-09-07-files/", with one subfolder per source ("photos",
// "branding"). A sibling folder rather than an archive because there is no bundled archiver here,
// and because a plain folder is something staff can inspect, copy to a USB stick and restore by
// hand -- no tooling required, which is the point of a backup.
//
// Kept as its own module (rather than inline in main.js) so it is testable in plain Node: main.js
// only runs under Electron, and this is exactly the logic that needs to be verified rather than
// assumed.

const fs = require('node:fs');
const path = require('node:path');

// Sibling folder for a given backup file. Derived from the name staff chose, so a backup and its
// files stay visibly paired in the folder listing even after several backups accumulate.
function backupFilesDirectory(targetPath) {
  const directory = path.dirname(targetPath);
  const base = path.basename(targetPath, path.extname(targetPath));
  return path.join(directory, `${base}-files`);
}

// Copies each named source directory into <backup>-files/<name>/. `sources` is a plain
// { name: absoluteDirectory } map so the caller (main.js) keeps ownership of where those
// directories actually are, which differs between a real profile and a smoke run.
//
// Only regular files are copied, one level deep -- both source directories are flat by
// construction (see main.js's photosDir/brandingDir writers). A source that does not exist yet, or
// holds nothing, is skipped rather than treated as an error: a gym with no uploaded photos and no
// custom logo has nothing to copy, which is not a failure. Nothing is created when there is nothing
// to copy, so no empty folder is left next to the backup to look like something went wrong.
function copyBackupFiles(targetPath, sources) {
  const destination = backupFilesDirectory(targetPath);
  let fileCount = 0;

  for (const [name, sourceDirectory] of Object.entries(sources)) {
    if (!sourceDirectory || !fs.existsSync(sourceDirectory)) continue;
    const files = fs.readdirSync(sourceDirectory, { withFileTypes: true }).filter((entry) => entry.isFile());
    if (files.length === 0) continue;

    const subdirectory = path.join(destination, name);
    fs.mkdirSync(subdirectory, { recursive: true });
    for (const file of files) {
      fs.copyFileSync(path.join(sourceDirectory, file.name), path.join(subdirectory, file.name));
      fileCount += 1;
    }
  }

  return { directory: fileCount > 0 ? destination : null, fileCount };
}

module.exports = { backupFilesDirectory, copyBackupFiles };
