import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('index.html loads reconstructed Applyra 3.0 app bundle without CDN links', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /assets\/v3-app\/applyra-v3\.js/);
  assert.match(html, /assets\/v3-app\/applyra-v3\.css/);
  assert.doesNotMatch(html, /main-5HBZNLr_\.js/);

  const jsPath = path.join(ROOT, 'assets', 'v3-app', 'applyra-v3.js');
  const cssPath = path.join(ROOT, 'assets', 'v3-app', 'applyra-v3.css');
  assert.equal(fs.existsSync(jsPath), true, 'Missing assets/v3-app/applyra-v3.js');
  assert.equal(fs.existsSync(cssPath), true, 'Missing assets/v3-app/applyra-v3.css');

  const js = fs.readFileSync(jsPath, 'utf8');
  assert.doesNotMatch(js, /https:\/\/(cdn\.|unpkg\.com|cdn\.jsdelivr\.net)/i);
});

test('Applyra 3.0 OperationsView enforces zero-inference Answer Vault review', () => {
  const opsSrc = fs.readFileSync(path.join(ROOT, 'src-v3', 'app', 'views', 'OperationsView.tsx'), 'utf8');
  assert.match(opsSrc, /handleGenerateSafeSuggestions/);
  assert.match(opsSrc, /approveSuggestion/);
  assert.match(opsSrc, /Pending Safe Suggestions/);

  const appSrc = fs.readFileSync(path.join(ROOT, 'src-v3', 'app', 'App.tsx'), 'utf8');
  for (const id of ['overview', 'opportunities', 'operations', 'resume', 'company-intel', 'scans', 'settings']) {
    assert.match(appSrc, new RegExp(`id:\\s*'${id}'`), `Missing workspace route: ${id}`);
  }
});
