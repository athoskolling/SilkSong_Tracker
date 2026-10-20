// Builds a local copy of the pinned Firebase web SDK, for tools/sync-rehearsal.mjs when gstatic
// cannot be reached (a sandbox, a plane). Nothing here is loaded by the site.
//
//   node tools/local-sdk.mjs <empty-or-new-folder-outside-the-repository>
//
// What it does: installs `firebase` at exactly the version pinned in js/firebase.js (SDK_VERSION) and
// `esbuild` into that folder from npm, then bundles firebase/app, firebase/auth and firebase/firestore
// into firebase-app.js, firebase-auth.js and firebase-firestore.js (plus one shared chunk), the same
// file names gstatic serves. It writes a VERSION file; the rehearsal refuses a folder whose VERSION is
// not the pinned one.
//
// Honest limit: this is the same SDK release, but not the bytes gstatic serves (those are Google's own
// build). It is enough to run the real SDK logic against the Emulators; it does not prove gstatic.
//
// It needs npm and access to the npm registry. It never touches the repository.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] ? resolve(process.argv[2]) : '';
if (!target || target.startsWith(REPO)) {
  console.error('Usage: node tools/local-sdk.mjs <folder outside the repository>');
  process.exit(2);
}

const version = /const SDK_VERSION = '([^']+)'/.exec(readFileSync(join(REPO, 'js/firebase.js'), 'utf8'))?.[1];
if (!version) {
  console.error('Could not read SDK_VERSION from js/firebase.js');
  process.exit(2);
}

const run = (command, args) => execFileSync(command, args, { cwd: target, stdio: 'inherit' });

mkdirSync(join(target, 'entries'), { recursive: true });
writeFileSync(join(target, 'package.json'), JSON.stringify({ name: 'local-sdk', private: true }));
run('npm', ['install', '--no-audit', '--no-fund', `firebase@${version}`, 'esbuild']);

for (const name of ['app', 'auth', 'firestore']) {
  writeFileSync(join(target, 'entries', `${name}.js`), `export * from 'firebase/${name}';\n`);
}
// Splitting keeps one copy of @firebase/app shared by the three files, as on gstatic: auth and
// firestore must register themselves with the same app module that the page initializes.
run(join(target, 'node_modules', '.bin', 'esbuild'), [
  'entries/app.js', 'entries/auth.js', 'entries/firestore.js',
  '--bundle', '--splitting', '--format=esm', '--platform=browser', '--minify',
  '--outdir=out', '--entry-names=firebase-[name]', '--chunk-names=chunk-[hash]',
]);
writeFileSync(join(target, 'out', 'VERSION'), `${version}\n`);

console.log(`Built firebase ${version}: ${readdirSync(join(target, 'out')).join(', ')}`);
console.log(`Use it with: SDK_DIR=${join(target, 'out')} firebase emulators:exec ... "node tools/sync-rehearsal.mjs"`);
