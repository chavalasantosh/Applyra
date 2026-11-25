import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Visual Laboratory compiles cleanly with 22 demos and zero CDN dependencies', () => {
  const labHtml = fs.readFileSync(path.join(ROOT, 'visual-lab.html'), 'utf8');
  assert.match(labHtml, /assets\/v3-lab\/lab\.js/);
  assert.match(labHtml, /assets\/v3-lab\/lab\.css/);

  const jsPath = path.join(ROOT, 'assets', 'v3-lab', 'lab.js');
  const cssPath = path.join(ROOT, 'assets', 'v3-lab', 'lab.css');
  assert.equal(fs.existsSync(jsPath), true, 'Missing compiled assets/v3-lab/lab.js');
  assert.equal(fs.existsSync(cssPath), true, 'Missing compiled assets/v3-lab/lab.css');

  const js = fs.readFileSync(jsPath, 'utf8');
  assert.doesNotMatch(js, /https:\/\/(cdn\.|unpkg\.com|cdn\.jsdelivr\.net)/i);

  const appSrc = fs.readFileSync(path.join(ROOT, 'src-v3', 'lab', 'App.tsx'), 'utf8');
  const demoMatches = appSrc.match(/id:\s*'(\d{2}-[^']+)'/g) || [];
  assert.ok(demoMatches.length >= 22, `Expected at least 22 demos, got ${demoMatches.length}`);
});
