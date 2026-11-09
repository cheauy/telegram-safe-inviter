import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

// Regression test for the Windows crash:
// "Tenh Gram could not start its server: Only URLs with a scheme in:
// file, data, node, and electron are supported by the default ESM
// loader. On Windows, absolute paths must be valid file:// URLs.
// Received protocol 'c:'"
//
// Root cause: electron/main.cjs did `await import(serverEntry)` where
// serverEntry was a plain Windows path like C:\...\src\server.js.
// Node's ESM loader rejects that; it needs a file:// URL. The fix is
// `await import(pathToFileURL(serverEntry).href)`.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mainCjs = fs.readFileSync(path.join(repoRoot, 'electron', 'main.cjs'), 'utf8');

test('electron main imports the server as a file:// URL, not a bare path', () => {
  assert.ok(
    mainCjs.includes('pathToFileURL(serverEntry)'),
    'main.cjs must convert serverEntry with pathToFileURL() before import()',
  );
  assert.ok(
    !mainCjs.includes('await import(serverEntry)'),
    'main.cjs must not import the bare filesystem path',
  );
});

test('importing the server via a file:// URL works (fixed code path)', async () => {
  const serverPath = path.join(repoRoot, 'src', 'server.js');
  const url = pathToFileURL(serverPath);
  assert.ok(url.href.startsWith('file://'), `expected a file:// URL, got ${url.href}`);
  const serverModule = await import(url.href);
  assert.equal(typeof serverModule.createServer, 'function');
  assert.equal(typeof serverModule.startBackgroundTasks, 'function');
});
