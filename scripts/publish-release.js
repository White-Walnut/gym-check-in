// Uploads the already-built installer to a GitHub Release, via the official `gh` CLI rather than
// electron-builder's own --publish step. That step proved unreliable against this repo in practice
// (two separate attempts each uploaded a different subset of the three required files, apparently
// racing concurrent uploads against the GitHub API) -- `gh release create` uploads sequentially and
// is the standard, well-tested tool for exactly this, so it replaces that one step. Everything else
// (build.publish in package.json, electron-updater itself) is unaffected: that config is what tells
// the *installed app* where to check for updates, completely separate from how a release got
// uploaded in the first place.
const { execFileSync, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const pkg = require('../package.json');
const tag = `v${pkg.version}`;
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Real, readable release notes from actual commit messages since the last release -- not GitHub's
// `--generate-notes`, which only produces a meaningful summary when changes come in through pull
// requests; every change here lands as a direct commit to main, so that flag was only ever
// generating an empty-looking "Full Changelog: compare link" and nothing else.
function buildReleaseNotes() {
  try {
    const previousTag = execSync(`git describe --tags --abbrev=0 ${tag}^`, { cwd: rootDir }).toString().trim();
    const commits = execSync(`git log ${previousTag}..${tag} --pretty=format:%s`, { cwd: rootDir })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean)
      // The version-bump commit itself ("1.9.5") is noise -- every release has exactly one and it
      // says nothing about what changed.
      .filter((line) => !/^\d+\.\d+\.\d+$/.test(line));
    return commits.length ? commits.map((line) => `- ${line}`).join('\n') : 'No notable changes.';
  } catch {
    return 'Initial release.';
  }
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
