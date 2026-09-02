// Keeps CHANGELOG.md up to date automatically -- wired into package.json's "version" script, which
// npm runs during `npm version patch/minor/major` (itself the first step of `npm run release`/
// `release:minor`/`release:major`) at the point where package.json's version number has already
// been bumped on disk, but *before* npm creates the version-bump commit and tag. Anything this
// script `git add`s gets folded into that same commit -- see npm's own docs on the "version" script
// lifecycle -- so the changelog update and the release it describes are never out of sync or one
// commit apart.
//
// Deliberately does NOT use `${tag}^` or `${tag}~1` the way publish-release.js's old, now-removed
// changelog logic did: at this point in the lifecycle HEAD isn't tagged yet (npm tags it after this
// script runs), so `git describe --tags --abbrev=0` on HEAD directly and unambiguously finds the
// *previous* release with no shell-metacharacter-vs-cmd.exe risk at all -- see publish-release.js's
// own comment for the exact bug that pattern caused there.
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const rootDir = path.join(__dirname, '..');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

function run(command) {
  return execSync(command, { cwd: rootDir }).toString().trim();
}

// Fresh read (this always runs as its own `node` process via the npm lifecycle, never a cached
// require from some longer-lived process), so this sees the version npm just wrote to disk.
const version = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version;

let previousTag = null;
try {
  previousTag = run('git describe --tags --abbrev=0');
} catch {
  // No earlier tag exists yet -- this is the first release ever cut. Fall through with
  // previousTag left null; the log call below covers all of history in that case.
}

const commits = run(`git log ${previousTag ? `${previousTag}..HEAD` : 'HEAD'} --pretty=format:%s`)
  .split('\n')
  .filter(Boolean);

const bullets = commits.length ? commits.map((line) => `- ${line}`).join('\n') : '- No notable changes.';
const date = new Date().toISOString().slice(0, 10);
const entry = `## v${version} -- ${date}\n\n${bullets}\n\n`;

const existing = fs.existsSync(changelogPath)
  ? fs.readFileSync(changelogPath, 'utf8')
  : '# Changelog\n\n';

// An "## Unreleased" section (if the file has one -- see the note in its own intro) means exactly
// the commits this release now contains; it gets replaced by this dated entry rather than left
// sitting there stale and duplicated. Otherwise the new entry just goes newest-first, right before
// whatever the current first "## " heading is (or at the end of the file, the very first time this
// ever runs against a changelog with no headings at all yet).
const unreleasedHeading = '## Unreleased';
const unreleasedIndex = existing.indexOf(unreleasedHeading);
let updated;
if (unreleasedIndex !== -1) {
  const nextHeadingIndex = existing.indexOf('## ', unreleasedIndex + unreleasedHeading.length);
  updated = existing.slice(0, unreleasedIndex) + entry + (nextHeadingIndex === -1 ? '' : existing.slice(nextHeadingIndex));
} else {
  const firstHeadingIndex = existing.indexOf('## ');
  updated = firstHeadingIndex === -1
    ? `${existing.trimEnd()}\n\n${entry}`
    : existing.slice(0, firstHeadingIndex) + entry + existing.slice(firstHeadingIndex);
}

fs.writeFileSync(changelogPath, updated);
run('git add CHANGELOG.md');
console.log(`CHANGELOG.md updated for v${version}.`);
