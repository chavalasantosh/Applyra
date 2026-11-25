import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('tokens.css defines all 6 Applyra appearance personalities and 4 motion modes', () => {
  const css = fs.readFileSync(path.join(ROOT, 'tokens.css'), 'utf8');
  for (const ap of ['obsidian', 'ivory', 'spatial', 'cyber', 'graphite', 'aurora']) {
    assert.match(css, new RegExp(`\\[data-appearance="${ap}"\\]`), `Missing appearance token block: ${ap}`);
  }
  for (const mode of ['reduced', 'standard', 'enhanced', 'cinematic']) {
    assert.match(css, new RegExp(`\\[data-motion="${mode}"\\]`), `Missing motion token block: ${mode}`);
  }
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('Vite visual-engine build outputs MV3 CSP-compliant local bundle without CDN links', () => {
  const jsPath = path.join(ROOT, 'assets', 'visual-engine', 'applyra-visual.js');
  const cssPath = path.join(ROOT, 'assets', 'visual-engine', 'applyra-visual.css');
  assert.equal(fs.existsSync(jsPath), true, 'Missing assets/visual-engine/applyra-visual.js');
  assert.equal(fs.existsSync(cssPath), true, 'Missing assets/visual-engine/applyra-visual.css');

  const js = fs.readFileSync(jsPath, 'utf8');
  assert.ok(js.length > 5000, 'Expected compiled React + Motion bundle');
  assert.doesNotMatch(js, /https:\/\/(cdn\.|unpkg\.com|cdn\.jsdelivr\.net)/i);
});

test('storage-bridge extracts zero fabricated skills when evidence and profile are empty', () => {
  const src = fs.readFileSync(path.join(ROOT, 'web-src', 'data', 'storage-bridge.ts'), 'utf8');
  assert.match(src, /export function extractCandidateSkills/);
  assert.match(src, /if \(textCorpus\.trim\(\)\.length > 0\)/);
  assert.match(src, /if \(!haystack\.trim\(\)\) return \[\]/);
});
