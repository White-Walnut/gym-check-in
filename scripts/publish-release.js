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
const distDir = path.join(__dirname, '..', 'dist');

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

console.log(`Publishing ${tag} to GitHub (${files.length} file(s))...`);
try {
  execFileSync('gh', ['release', 'create', tag, ...files, '--title', tag, '--generate-notes'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('\ngh release create failed -- see the output above.');
  console.error('If the release already exists (e.g. from a previous incomplete attempt), delete it');
  console.error('on GitHub first (Releases page -> the release -> Delete), then run this again.');
  process.exit(1);
}
console.log('Done -- check the Releases page to confirm all three files are attached.');
