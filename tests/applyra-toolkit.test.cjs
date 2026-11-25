const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const bridge = require(path.join(root, 'src', 'applyra-toolkit-bridge.js'));

test('Applyra Toolkit Bridge client exports all required integration methods', () => {
  assert.ok(bridge, 'Bridge module should exist');
  assert.equal(typeof bridge.checkHealth, 'function');
  assert.equal(typeof bridge.syncToToolkit, 'function');
  assert.equal(typeof bridge.fetchFromToolkit, 'function');
  assert.equal(typeof bridge.fetchAnalytics, 'function');
  assert.equal(typeof bridge.tailorResume, 'function');
});

test('Toolkit CLI supports applyra-export and applyra-import roundtrip', (t) => {
  const tmpDir = path.join(root, 'tests', '.tmp-toolkit-test');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const exportPath = path.join(tmpDir, 'exported-workspace.json');
  const toolkitScript = path.join(root, 'job_auto_apply_toolkit.py');

  // 1. Export workspace from toolkit
  const expCmd = `py "${toolkitScript}" applyra-export "${exportPath}"`;
  const expOut = execSync(expCmd, { cwd: root, encoding: 'utf8' });
  assert.ok(expOut.includes('Applyra workspace exported'), `Output: ${expOut}`);
  assert.ok(fs.existsSync(exportPath), 'Export file must be created');

  const ws = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  assert.ok(ws.exportedAt, 'Must have exportedAt timestamp');
  assert.ok(Array.isArray(ws.jobs), 'Must have jobs array');
  assert.ok(Array.isArray(ws.interviews), 'Must have interviews array');

  // 2. Import workspace back into toolkit
  const impCmd = `py "${toolkitScript}" applyra-import "${exportPath}"`;
  const impOut = execSync(impCmd, { cwd: root, encoding: 'utf8' });
  assert.ok(impOut.includes('Applyra workspace imported'), `Output: ${impOut}`);

  // Cleanup
  try {
    fs.unlinkSync(exportPath);
    fs.rmdirSync(tmpDir);
  } catch {}
});
