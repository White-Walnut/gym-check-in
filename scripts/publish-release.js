// Uploads the already-built installer to a GitHub Release, via the official `gh` CLI rather than
// electron-builder's own --publish step. That step proved unreliable against this repo in practice
// (two separate attempts each uploaded a different subset of the three required files, apparently
// racing concurrent uploads against the GitHub API) -- `gh release create` uploads sequentially and
// is the standard, well-tested tool for exactly this, so it replaces that one step. Everything else
// (build.publish in package.json, electron-updater itself) is unaffected: that config is what tells
// the *installed app* where to check for updates, completely separate from how a release got
// uploaded in the first place.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const pkg = require('../package.json');
const tag = `v${pkg.version}`;
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Real, readable release notes -- read straight out of CHANGELOG.md rather than recomputed here
// from git history a second time. CHANGELOG.md is written once, earlier in the same release, by
// scripts/update-changelog.js (wired into npm's own "version" lifecycle hook) -- reading it back
// here means this can never independently disagree with what's actually in the file, and sidesteps
// the whole class of git/shell-quoting fragility that script's own comment describes in detail
// (this file used to compute the same thing itself, via `git describe ... ${tag}^`, and silently
// produced "No notable changes." on v1.9.6 because of exactly that).
function buildReleaseNotes() {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) return 'No notable changes.';
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const heading = `## ${tag} `; // trailing space: avoids v1.9.6 spuriously matching a v1.9.60 heading
  const headingIndex = changelog.indexOf(heading);
  if (headingIndex === -1) return 'No notable changes.';
  const bodyStart = changelog.indexOf('\n', headingIndex) + 1;
  const nextHeadingIndex = changelog.indexOf('\n## ', bodyStart);
  const section = (nextHeadingIndex === -1 ? changelog.slice(bodyStart) : changelog.slice(bodyStart, nextHeadingIndex)).trim();
  return section || 'No notable changes.';
}

const expectedNames = [
  `Gym-Check-in-Setup-${pkg.version}.exe`,
  `Gym-Check-in-Setup-${pkg.version}.exe.blockmap`,
  'latest.yml'
];
const files = expectedNames.map((name) => path.join(distDir, name));
const missing = files.filter((file) => !fs.existsSync(file));

if (missing.length) {
  console.error('Missing expected build output(s) -- run "npm run dist" first:');
  missing.forEach((file) => console.error(`  ${path.basename(file)}`));
  process.exit(1);
}

const notes = buildReleaseNotes();
console.log(`Publishing ${tag} to GitHub (${files.length} file(s))...`);
console.log(`Release notes:\n${notes}\n`);
try {
  execFileSync('gh', ['release', 'create', tag, ...files, '--title', tag, '--notes', notes], {
    stdio: 'inherit',
    cwd: rootDir
  });
} catch (error) {
  console.error('\ngh release create failed -- see the output above.');
  console.error('If the release already exists (e.g. from a previous incomplete attempt), delete it');
  console.error('on GitHub first (Releases page -> the release -> Delete), then run this again.');
  process.exit(1);
}
console.log('Done -- check the Releases page to confirm all three files are attached.');
