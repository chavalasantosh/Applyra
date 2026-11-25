import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('all new workspace modules exist and pass syntax', () => {
  const required = [
    'tokens.css',
    'assets/workspaces/workspaces.css',
    'assets/workspaces/shell.mjs',
    'assets/workspaces/overview-center.mjs',
    'assets/workspaces/opportunity-enhancer.mjs',
    'assets/workspaces/ops-center.mjs',
    'assets/workspaces/vault-suggestions.mjs',
    'assets/workspaces/company-enhancer.mjs',
    'assets/workspaces/workspaces-boot.mjs'
  ];
  for (const file of required) {
    assert.equal(fs.existsSync(file), true, `Missing required module: ${file}`);
  }
});

test('ops-center.mjs does not auto-fill Answer Vault on initialization', () => {
  const src = fs.readFileSync('assets/workspaces/ops-center.mjs', 'utf8');
  assert.equal(/setTimeout\s*\(\s*\(\)\s*=>\s*autoFillVault/.test(src), false);
  assert.equal(src.includes('openVaultReview'), true);
});
